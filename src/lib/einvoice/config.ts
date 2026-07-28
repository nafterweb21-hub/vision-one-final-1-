/**
 * Configuration for the GST Invoice Registration Portal (IRP) integration.
 *
 * Defaults target the NIC e-invoice sandbox. Point EINVOICE_BASE_URL at the
 * production IRP and supply production credentials to go live. All secrets come
 * from environment variables (see .env) so nothing is committed.
 */
export type EInvoiceConfig = {
  baseUrl: string;
  clientId: string;
  clientSecret: string;
  username: string;
  password: string;
  gstin: string;
  publicKey: string;
  authPath: string;
  generatePath: string;
  cancelPath: string;
};

function env(name: string): string {
  return (process.env[name] ?? "").trim();
}

export function getEInvoiceConfig(): EInvoiceConfig {
  return {
    baseUrl: env("EINVOICE_BASE_URL") || "https://einv-apisandbox.nic.in",
    clientId: env("EINVOICE_CLIENT_ID"),
    clientSecret: env("EINVOICE_CLIENT_SECRET"),
    username: env("EINVOICE_USERNAME"),
    password: env("EINVOICE_PASSWORD"),
    gstin: env("EINVOICE_GSTIN"),
    // Support keys pasted as a single line with literal "\n" sequences.
    publicKey: env("EINVOICE_PUBLIC_KEY").replace(/\\n/g, "\n"),
    authPath: env("EINVOICE_AUTH_PATH") || "/eivital/v1.04/auth",
    generatePath: env("EINVOICE_GENERATE_PATH") || "/eicore/v1.03/Invoice",
    cancelPath: env("EINVOICE_CANCEL_PATH") || "/eicore/v1.03/Cancel",
  };
}

/** Names of the required secrets, for a precise "not configured" error. */
const REQUIRED: (keyof EInvoiceConfig)[] = [
  "clientId",
  "clientSecret",
  "username",
  "password",
  "gstin",
  "publicKey",
];

export function missingEInvoiceConfig(cfg: EInvoiceConfig): string[] {
  const map: Record<string, string> = {
    clientId: "EINVOICE_CLIENT_ID",
    clientSecret: "EINVOICE_CLIENT_SECRET",
    username: "EINVOICE_USERNAME",
    password: "EINVOICE_PASSWORD",
    gstin: "EINVOICE_GSTIN",
    publicKey: "EINVOICE_PUBLIC_KEY",
  };
  return REQUIRED.filter((k) => !cfg[k]).map((k) => map[k as string]);
}
