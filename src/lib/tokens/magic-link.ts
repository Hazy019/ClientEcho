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

export function hashMagicLinkToken(rawToken: string): string {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}
