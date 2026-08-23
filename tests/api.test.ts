import { describe, it, expect } from "vitest";
import { publicFormSchema, magicLinkRequestSchema } from "../src/lib/validation/schemas";
import { sanitizeHtml, sanitizePlainText } from "../src/lib/security/sanitizer";
import { validateVideoUrl } from "../src/lib/security/video-url";
import { generateMagicLinkToken, hashMagicLinkToken, normalizeToken } from "../src/lib/tokens/magic-link";
import { getFromAddress } from "../src/lib/email";

describe("API Security & Validation Suite", () => {
  describe("1. Zod Input Validation", () => {
    it("validates valid public form submission", () => {
      const result = publicFormSchema.safeParse({
        widgetSlug: "my-portfolio",
        authorName: "John Doe",
        authorEmail: "john@example.com",
        content: "This is a great service! Highly recommended.",
        rating: 5,
      });
      expect(result.success).toBe(true);
    });

    it("rejects public form submission with short content (< 10 chars)", () => {
      const result = publicFormSchema.safeParse({
        widgetSlug: "my-portfolio",
        authorName: "John Doe",
        content: "Short",
      });
      expect(result.success).toBe(false);
    });

    it("rejects magic link request with invalid client email", () => {
      const result = magicLinkRequestSchema.safeParse({
        widgetId: "00000000-0000-0000-0000-000000000000",
        clientEmail: "not-an-email",
        authorName: "Jane Smith",
        content: "Draft testimonial content",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("2. DOMPurify HTML Sanitization", () => {
    it("strips malicious script tags and inline handlers", () => {
      const maliciousHtml = '<p>Great work!</p><script>alert("XSS")</script><img src="x" onerror="alert(1)"/>';
      const clean = sanitizeHtml(maliciousHtml);
      expect(clean).not.toContain("<script>");
      expect(clean).not.toContain("onerror");
      expect(clean).toContain("Great work!");
    });

    it("strips all HTML tags for plain text fields", () => {
      const input = "<h1>John <b>Doe</b></h1>";
      const clean = sanitizePlainText(input);
      expect(clean).toBe("John Doe");
    });
  });

  describe("3. Video URL Allowlist Validation", () => {
    it("allows valid YouTube video URLs", () => {
      const res = validateVideoUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
      expect(res.isValid).toBe(true);
    });

    it("allows valid Vimeo video URLs", () => {
      const res = validateVideoUrl("https://vimeo.com/148751763");
      expect(res.isValid).toBe(true);
    });

    it("allows valid Loom video URLs", () => {
      const res = validateVideoUrl("https://www.loom.com/share/1234567890abcdef");
      expect(res.isValid).toBe(true);
    });

    it("REJECTS arbitrary untrusted video hosts", () => {
      const res = validateVideoUrl("https://malicious-site.com/video.mp4");
      expect(res.isValid).toBe(false);
      expect(res.error).toContain("Only YouTube, Vimeo, and Loom");
    });
  });

  describe("4. Magic Link Cryptographic Token Security & Robust Normalization", () => {
    it("generates 32-byte (64 hex char) random raw token and valid SHA-256 hash", () => {
      const tokenObj = generateMagicLinkToken(72);
      expect(tokenObj.rawToken).toHaveLength(64);
      expect(tokenObj.tokenHash).toHaveLength(64);

      // Verify hashing raw token produces exact stored hash
      const computedHash = hashMagicLinkToken(tokenObj.rawToken);
      expect(computedHash).toBe(tokenObj.tokenHash);
    });

    it("sets expiry to 72 hours in the future", () => {
      const now = new Date();
      const tokenObj = generateMagicLinkToken(72);
      const diffHours = (tokenObj.expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60);
      expect(Math.round(diffHours)).toBe(72);
    });

    it("normalizes tokens with trailing whitespace, newlines, and quotes from mobile chat apps", () => {
      const baseToken = "a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90";
      
      expect(normalizeToken(`  ${baseToken} \n`)).toBe(baseToken);
      expect(normalizeToken(`"${baseToken}"`)).toBe(baseToken);
      expect(normalizeToken(`<${baseToken}>`)).toBe(baseToken);
      expect(normalizeToken(`${baseToken}.`)).toBe(baseToken);
      expect(normalizeToken(encodeURIComponent(baseToken))).toBe(baseToken);

      // Hashes must match exactly despite whitespace or surrounding artifacts
      expect(hashMagicLinkToken(`  ${baseToken} \r\n`)).toBe(hashMagicLinkToken(baseToken));
    });
  });

  describe("5. Email Deliverability & Sender Personalization", () => {
    it("formats personalized sender display for 1-to-1 primary inbox delivery", () => {
      const sender = getFromAddress("Hazy");
      expect(sender).toContain("Hazy via ClientEcho");
    });

    it("falls back to ClientEcho when no creator name provided", () => {
      const sender = getFromAddress();
      expect(sender).toContain("ClientEcho");
    });
  });
});
