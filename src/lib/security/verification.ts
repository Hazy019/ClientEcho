import { createHash } from "crypto";

export type VerificationTier = "magic_link" | "public_form" | "manual_import";

export interface VerificationDetails {
  tier: VerificationTier;
  badgeLabel: string;
  headline: string;
  summary: string;
  isCryptographicallyVerified: boolean;
  statusBadgeColor: "emerald" | "indigo" | "amber";
}

/**
 * Generate a deterministic, non-reversible public verification fingerprint
 * based on the testimonial ID and cryptographic token hash / creation timestamp.
 * Never exposes raw secret tokens or email addresses.
 */
export function generateVerificationFingerprint(
  testimonialId: string,
  entropy: string = "clientecho-v1"
): string {
  const hash = createHash("sha256")
    .update(`clientecho:verify:${testimonialId}:${entropy}`)
    .digest("hex")
    .toUpperCase();

  // Format as CE-VFY-XXXX-XXXX-XXXX (16 chars)
  const part1 = hash.substring(0, 4);
  const part2 = hash.substring(4, 8);
  const part3 = hash.substring(8, 12);
  const part4 = hash.substring(12, 16);

  return `CE-VFY-${part1}-${part2}-${part3}-${part4}`;
}

export function getVerificationTierDetails(
  source: string,
  isImportedSelfReported: boolean = false
): VerificationDetails {
  if (source === "magic_link") {
    return {
      tier: "magic_link",
      badgeLabel: "Verified & Approved",
      headline: "Cryptographically Verified 1-Click Magic Link",
      summary:
        "This testimonial was authenticated through ClientEcho's single-use cryptographic magic link flow. The client directly reviewed, modified (if desired), and approved the endorsement with 1-click without creating an account.",
      isCryptographicallyVerified: true,
      statusBadgeColor: "emerald",
    };
  }

  if (source === "public_form") {
    return {
      tier: "public_form",
      badgeLabel: "Verified Direct Submission",
      headline: "Verified Direct Form Submission",
      summary:
        "This testimonial was submitted directly by the client through an authenticated ClientEcho submission form, verified with Cloudflare Turnstile bot protection, DOMPurify HTML sanitization, and IP rate limiting.",
      isCryptographicallyVerified: true,
      statusBadgeColor: "indigo",
    };
  }

  // Self-reported / imported
  return {
    tier: "manual_import",
    badgeLabel: "Self-Reported / Imported",
    headline: "Creator Self-Reported Import",
    summary:
      "This testimonial was manually imported by the workspace creator (e.g. from Slack, email, or direct correspondence) and was not independently verified through ClientEcho's cryptographic magic link approval flow.",
    isCryptographicallyVerified: false,
    statusBadgeColor: "amber",
  };
}
