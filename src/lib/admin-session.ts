// Web Crypto API — Edge Runtime compatible (no Node.js crypto / Buffer)
import { config } from "@/lib/config"

const SECRET = config.adminSecret

const enc = new TextEncoder()

async function getKey(): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    enc.encode(SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  )
}

function toBase64url(str: string): string {
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "")
}

function fromBase64url(str: string): string {
  return atob(str.replace(/-/g, "+").replace(/_/g, "/"))
}

function bufToHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

function hexToBuf(hex: string): Uint8Array {
  const result = new Uint8Array(new ArrayBuffer(hex.length / 2))
  for (let i = 0; i < hex.length; i += 2) {
    result[i / 2] = parseInt(hex.slice(i, i + 2), 16)
  }
  return result
}

export async function signSession(): Promise<string> {
  const iat = Math.floor(Date.now() / 1000)
  const exp = iat + 86400
  const payload = toBase64url(JSON.stringify({ iat, exp }))
  const key = await getKey()
  const sigBuf = await crypto.subtle.sign("HMAC", key, enc.encode(payload))
  return `${payload}.${bufToHex(sigBuf)}`
}

export async function verifySession(token: string): Promise<boolean> {
  const parts = token.split(".")
  if (parts.length !== 2) return false

  const [payload, signature] = parts
  const key = await getKey()
  const valid = await crypto.subtle.verify("HMAC", key, hexToBuf(signature).buffer as ArrayBuffer, enc.encode(payload))
  if (!valid) return false

  try {
    const decoded = JSON.parse(fromBase64url(payload)) as { iat: number; exp: number }
    return decoded.exp > Math.floor(Date.now() / 1000)
  } catch {
    return false
  }
}
