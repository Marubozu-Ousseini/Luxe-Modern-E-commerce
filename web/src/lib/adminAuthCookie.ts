export const ADMIN_CREDS_COOKIE = "malafaareh_admin_creds";

export type AdminCreds = {
  v: 1;
  user: string;
  pass: string;
};

function getBtoa(): (data: string) => string {
  if (typeof btoa === "function") return btoa;
  return (data: string) => Buffer.from(data, "binary").toString("base64");
}

function getAtob(): (data: string) => string {
  if (typeof atob === "function") return atob;
  return (data: string) => Buffer.from(data, "base64").toString("binary");
}

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  const base64 = getBtoa()(binary);
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlDecodeToBytes(input: string): Uint8Array {
  const base64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "===".slice((base64.length + 3) % 4);
  const binary = getAtob()(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a[i] ^ b[i];
  return out === 0;
}

async function hmacSha256(key: Uint8Array, data: Uint8Array): Promise<Uint8Array> {
  const cryptoObj = globalThis.crypto;
  if (!cryptoObj?.subtle) throw new Error("WebCrypto not available");

  const keyBuf = new ArrayBuffer(key.byteLength);
  new Uint8Array(keyBuf).set(key);
  const dataBuf = new ArrayBuffer(data.byteLength);
  new Uint8Array(dataBuf).set(data);

  const cryptoKey = await cryptoObj.subtle.importKey(
    "raw",
    keyBuf,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const sig = await cryptoObj.subtle.sign("HMAC", cryptoKey, dataBuf);
  return new Uint8Array(sig);
}

export async function signAdminCreds(creds: AdminCreds, secret: string): Promise<string> {
  const json = JSON.stringify(creds);
  const enc = new TextEncoder();
  const payloadBytes = enc.encode(json);
  const payload = base64UrlEncode(payloadBytes);

  const sigBytes = await hmacSha256(enc.encode(secret), enc.encode(payload));
  const sig = base64UrlEncode(sigBytes);
  return `${payload}.${sig}`;
}

export async function verifyAdminCreds(token: string, secret: string): Promise<AdminCreds | null> {
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return null;

  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);

  const enc = new TextEncoder();
  let expectedSig: Uint8Array;
  try {
    expectedSig = await hmacSha256(enc.encode(secret), enc.encode(payload));
  } catch {
    return null;
  }

  let providedSig: Uint8Array;
  try {
    providedSig = base64UrlDecodeToBytes(sig);
  } catch {
    return null;
  }

  if (!timingSafeEqual(expectedSig, providedSig)) return null;

  try {
    const payloadBytes = base64UrlDecodeToBytes(payload);
    const json = new TextDecoder().decode(payloadBytes);
    const parsed = JSON.parse(json) as unknown;
    if (!parsed || typeof parsed !== "object") return null;

    const v = (parsed as { v?: unknown }).v;
    const user = (parsed as { user?: unknown }).user;
    const pass = (parsed as { pass?: unknown }).pass;

    if (v !== 1) return null;
    if (typeof user !== "string" || user.length === 0) return null;
    if (typeof pass !== "string" || pass.length === 0) return null;

    return { v: 1, user, pass };
  } catch {
    return null;
  }
}
