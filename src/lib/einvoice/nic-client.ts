/**
 * NIC Invoice Registration Portal (IRP) client.
 *
 * Implements the encrypted auth handshake and the Generate / Cancel IRN calls.
 * See ./crypto.ts for the hybrid RSA + AES scheme NIC uses. All network and
 * crypto errors are normalized into an `IrpError` with the IRP error text.
 */
import { aesDecrypt, aesEncrypt, generateAppKey, rsaEncrypt } from "./crypto";
import { getEInvoiceConfig, missingEInvoiceConfig, type EInvoiceConfig } from "./config";

export class IrpError extends Error {
  code?: string;
  constructor(message: string, code?: string) {
    super(message);
    this.name = "IrpError";
    this.code = code;
  }
}

type AuthSession = { authToken: string; sessionKey: Buffer; expiresAt: number };

// In-memory auth cache, keyed by API GSTIN. Tokens are reused across requests
// until shortly before expiry to avoid re-authenticating on every call.
const authCache = new Map<string, AuthSession>();

function normalizeIrpErrors(errorDetails: unknown): string {
  if (!errorDetails) return "Unknown IRP error";
  if (typeof errorDetails === "string") return errorDetails;
  if (Array.isArray(errorDetails)) {
    return errorDetails
      .map((e: any) => (e?.ErrorMessage ? `${e.ErrorCode ?? ""} ${e.ErrorMessage}`.trim() : JSON.stringify(e)))
      .join("; ");
  }
  const e = errorDetails as any;
  return e?.ErrorMessage || e?.message || JSON.stringify(errorDetails);
}

async function postJson(url: string, headers: Record<string, string>, body: unknown): Promise<any> {
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify(body),
    });
  } catch (e: any) {
    throw new IrpError(`Cannot reach IRP at ${url}: ${e?.message || e}`);
  }
  const text = await res.text();
  let json: any;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    throw new IrpError(`IRP returned a non-JSON response (HTTP ${res.status}): ${text.slice(0, 300)}`);
  }
  if (!res.ok && json?.Status == null) {
    throw new IrpError(`IRP HTTP ${res.status}: ${normalizeIrpErrors(json?.ErrorDetails ?? text)}`);
  }
  return json;
}

async function authenticate(cfg: EInvoiceConfig): Promise<AuthSession> {
  const cached = authCache.get(cfg.gstin);
  if (cached && cached.expiresAt > Date.now() + 60_000) return cached;

  const appKey = generateAppKey();
  const authPayload = {
    UserName: cfg.username,
    Password: cfg.password,
    AppKey: appKey.base64,
    ForceRefreshAccessToken: true,
  };

  const encData = rsaEncrypt(cfg.publicKey, Buffer.from(JSON.stringify(authPayload), "utf8"));
  const resp = await postJson(
    `${cfg.baseUrl}${cfg.authPath}`,
    { "client-id": cfg.clientId, "client-secret": cfg.clientSecret, gstin: cfg.gstin },
    { Data: encData },
  );

  if (String(resp?.Status) !== "1" || !resp?.Data) {
    throw new IrpError(`IRP auth failed: ${normalizeIrpErrors(resp?.ErrorDetails)}`);
  }

  // Response Data is AES(AppKey) of { AuthToken, Sek, TokenExpiry }.
  let authInfo: any;
  try {
    authInfo = JSON.parse(aesDecrypt(appKey.raw, resp.Data).toString("utf8"));
  } catch (e: any) {
    throw new IrpError(`Failed to decrypt IRP auth response: ${e?.message || e}`);
  }

  // The session key (SEK) is itself AES(AppKey) encrypted inside the response.
  const sessionKey = aesDecrypt(appKey.raw, authInfo.Sek);
  const expiresAt = authInfo.TokenExpiry
    ? new Date(authInfo.TokenExpiry.replace(" ", "T")).getTime() || Date.now() + 5 * 3600_000
    : Date.now() + 5 * 3600_000;

  const session: AuthSession = { authToken: authInfo.AuthToken, sessionKey, expiresAt };
  authCache.set(cfg.gstin, session);
  return session;
}

function apiHeaders(cfg: EInvoiceConfig, auth: AuthSession): Record<string, string> {
  return {
    "client-id": cfg.clientId,
    "client-secret": cfg.clientSecret,
    Gstin: cfg.gstin,
    user_name: cfg.username,
    AuthToken: auth.authToken,
  };
}

/** Decrypt a `{ Status, Data, ErrorDetails }` IRP response body. */
function decodeApiResponse(auth: AuthSession, resp: any): any {
  if (String(resp?.Status) !== "1") {
    throw new IrpError(normalizeIrpErrors(resp?.ErrorDetails));
  }
  if (!resp?.Data) return {};
  try {
    return JSON.parse(aesDecrypt(auth.sessionKey, resp.Data).toString("utf8"));
  } catch (e: any) {
    throw new IrpError(`Failed to decrypt IRP response: ${e?.message || e}`);
  }
}

export type GenerateIrnResult = {
  irn: string;
  ackNo: string;
  ackDate: string;
  signedInvoice: string;
  signedQrCode: string;
  ewbNo?: string;
  raw: any;
};

export async function generateIrn(payload: unknown): Promise<GenerateIrnResult> {
  const cfg = getEInvoiceConfig();
  const missing = missingEInvoiceConfig(cfg);
  if (missing.length) {
    throw new IrpError(`E-invoicing is not configured. Missing env: ${missing.join(", ")}`);
  }

  const auth = await authenticate(cfg);
  const encData = aesEncrypt(auth.sessionKey, JSON.stringify(payload));
  const resp = await postJson(`${cfg.baseUrl}${cfg.generatePath}`, apiHeaders(cfg, auth), { Data: encData });
  const data = decodeApiResponse(auth, resp);

  return {
    irn: data.Irn,
    ackNo: String(data.AckNo ?? ""),
    ackDate: data.AckDt ?? "",
    signedInvoice: data.SignedInvoice ?? "",
    signedQrCode: data.SignedQRCode ?? "",
    ewbNo: data.EwbNo ? String(data.EwbNo) : undefined,
    raw: data,
  };
}

export async function cancelIrn(params: {
  irn: string;
  reasonCode: string; // "1" duplicate, "2" data entry mistake, "3" order cancelled, "4" others
  remark: string;
}): Promise<any> {
  const cfg = getEInvoiceConfig();
  const missing = missingEInvoiceConfig(cfg);
  if (missing.length) {
    throw new IrpError(`E-invoicing is not configured. Missing env: ${missing.join(", ")}`);
  }

  const auth = await authenticate(cfg);
  const body = { Irn: params.irn, CnlRsn: params.reasonCode, CnlRem: params.remark };
  const encData = aesEncrypt(auth.sessionKey, JSON.stringify(body));
  const resp = await postJson(`${cfg.baseUrl}${cfg.cancelPath}`, apiHeaders(cfg, auth), { Data: encData });
  return decodeApiResponse(auth, resp);
}
