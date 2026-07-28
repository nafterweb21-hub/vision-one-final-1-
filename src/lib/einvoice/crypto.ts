/**
 * Crypto primitives for the NIC IRP handshake.
 *
 * NIC's e-invoice API (without a GSP) uses a hybrid scheme:
 *   1. A random 32-byte AppKey is RSA-encrypted with the IRP's public key and
 *      sent during auth.
 *   2. The auth response is AES-256-ECB encrypted with the AppKey and contains
 *      a session key (SEK), itself AES-ECB(AppKey) encrypted.
 *   3. Every subsequent request/response payload is AES-256-ECB encrypted with
 *      the decrypted SEK.
 */
import crypto from "node:crypto";

/** Load a public key from a PEM public key or an X.509 certificate. */
function toPublicKey(pem: string): crypto.KeyObject {
  const text = pem.trim();
  if (text.includes("BEGIN CERTIFICATE")) {
    return new crypto.X509Certificate(text).publicKey;
  }
  return crypto.createPublicKey(text);
}

/** RSA/ECB/PKCS1 encrypt, returning base64 (matches NIC's expectation). */
export function rsaEncrypt(publicKeyPem: string, data: Buffer): string {
  const key = toPublicKey(publicKeyPem);
  const encrypted = crypto.publicEncrypt(
    { key, padding: crypto.constants.RSA_PKCS1_PADDING },
    data,
  );
  return encrypted.toString("base64");
}

/** AES-256-ECB encrypt (PKCS7 padding), returning base64. */
export function aesEncrypt(keyBase64OrBuf: string | Buffer, plaintext: string): string {
  const key = typeof keyBase64OrBuf === "string" ? Buffer.from(keyBase64OrBuf, "base64") : keyBase64OrBuf;
  const cipher = crypto.createCipheriv("aes-256-ecb", key, null);
  return Buffer.concat([cipher.update(Buffer.from(plaintext, "utf8")), cipher.final()]).toString("base64");
}

/** AES-256-ECB decrypt of a base64 payload, returning the plaintext Buffer. */
export function aesDecrypt(keyBase64OrBuf: string | Buffer, dataBase64: string): Buffer {
  const key = typeof keyBase64OrBuf === "string" ? Buffer.from(keyBase64OrBuf, "base64") : keyBase64OrBuf;
  const decipher = crypto.createDecipheriv("aes-256-ecb", key, null);
  return Buffer.concat([decipher.update(Buffer.from(dataBase64, "base64")), decipher.final()]);
}

/** Fresh 32-byte AppKey, base64-encoded, for the auth handshake. */
export function generateAppKey(): { raw: Buffer; base64: string } {
  const raw = crypto.randomBytes(32);
  return { raw, base64: raw.toString("base64") };
}
