import crypto from "crypto";

/**
 * Magic Link Token Utilities
 * 
 * Cryptographically secure 32-byte token generation & SHA-256 hashing.
 * Plaintext token is sent in email link only; database stores SHA-256 hash.
 */

export interface GeneratedToken {
  rawToken: string;
  tokenHash: string;
  expiresAt: Date;
}

export function generateMagicLinkToken(expiryHours = 72): GeneratedToken {
  // Generate 32 bytes of cryptographically random data (64 hex characters)
  const rawToken = crypto.randomBytes(32).toString("hex");

  // SHA-256 Hash of raw token for database storage
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + expiryHours);

  return { rawToken, tokenHash, expiresAt };
}

/**
 * Normalizes a raw magic link token by stripping leading/trailing whitespace,
 * decoding URL components if encoded, removing quotes/punctuation from chat clients,
 * and standardizing to lowercase hex.
 */
export function normalizeToken(rawToken: string | null | undefined): string {
  if (!rawToken || typeof rawToken !== "string") return "";
  let clean = rawToken.trim();
  try {
    clean = decodeURIComponent(clean).trim();
  } catch {
    // If not encoded or malformed, continue with clean string
  }
  // Strip quotes, angle brackets, or trailing punctuation commonly added by chat apps or mail clients
  clean = clean.replace(/^[<"']+|[>"',;.]+$/g, "").trim();
  // Tokens generated are 64-char hex strings; extract hex sequence if surrounded by artifacts
  const hexMatch = clean.match(/[0-9a-fA-F]{32,64}/);
  if (hexMatch) {
    return hexMatch[0].toLowerCase();
  }
  return clean.toLowerCase();
}

export function hashMagicLinkToken(rawToken: string): string {
  const cleanToken = normalizeToken(rawToken);
  return crypto.createHash("sha256").update(cleanToken).digest("hex");
}

