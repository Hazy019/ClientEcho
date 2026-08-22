import { describe, it, expect, beforeEach } from "vitest";
import { validateImageMagicBytes } from "../src/lib/security/file-validation";
import { sanitizeAndValidateCss } from "../src/lib/security/css-sanitizer";
import { processedStripeEvents } from "../src/db/schema";
import { checkLoginRateLimit, recordLoginFailure, resetLoginFailures } from "../src/lib/security/rate-limit";

describe("Pass 16: CSS Specificity, Theme-Aware Colors, Widget Responsiveness & Security", () => {
  describe("1. Custom CSS Specificity & Baseline Styling", () => {
    it("safely sanitizes and permits custom CSS rules for stars, cards, and badges", () => {
      const inputCss = `
        .clientecho-stars { color: #8cff2e; }
        .clientecho-badge-verified { background-color: #10B981; color: #FFFFFF; }
        .clientecho-card { border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); }
      `;
      const result = sanitizeAndValidateCss(inputCss);
      expect(result.valid).toBe(true);
      expect(result.sanitizedCss).toContain(".clientecho-stars");
      expect(result.sanitizedCss).toContain("color: #8cff2e");
      expect(result.sanitizedCss).toContain(".clientecho-badge-verified");
    });

    it("supports theme-scoped dark selectors alongside base light selectors", () => {
      const inputCss = `
        .clientecho-card { background-color: #FFFFFF; }
        .clientecho-theme-dark .clientecho-card, [data-theme="dark"] .clientecho-card { background-color: #18181B; }
        .clientecho-quote { color: #1F2937; }
        .clientecho-theme-dark .clientecho-quote, [data-theme="dark"] .clientecho-quote { color: #F9FAFB; }
      `;
      const result = sanitizeAndValidateCss(inputCss);
      expect(result.valid).toBe(true);
      expect(result.sanitizedCss).toContain(".clientecho-theme-dark .clientecho-card");
      expect(result.sanitizedCss).toContain('[data-theme="dark"] .clientecho-card');
      expect(result.sanitizedCss).toContain(".clientecho-theme-dark .clientecho-quote");
    });

    it("safely permits and validates avatar thumbnail background fill, text color, and star stroke outline", () => {
      const inputCss = `
        .clientecho-avatar {
          border-radius: 9999px;
          background-color: #8cff2e;
          color: #111827;
          border-width: 2px;
          border-style: solid;
          border-color: #2D2D2D;
        }
        .clientecho-stars {
          color: #8cff2e;
          stroke: #10B981;
          gap: 4px;
        }
      `;
      const result = sanitizeAndValidateCss(inputCss);
      expect(result.valid).toBe(true);
      expect(result.sanitizedCss).toContain(".clientecho-avatar");
      expect(result.sanitizedCss).toContain("background-color: #8cff2e");
      expect(result.sanitizedCss).toContain("color: #111827");
      expect(result.sanitizedCss).toContain(".clientecho-stars");
      expect(result.sanitizedCss).toContain("stroke: #10B981");
    });

    it("safely permits and validates quote, author name, and author title typography properties", () => {
      const inputCss = `
        .clientecho-quote {
          font-size: 18px;
          font-weight: 500;
          font-style: italic;
          line-height: 1.8;
          text-align: center;
          color: #111827;
        }
        .clientecho-author-name {
          font-size: 16px;
          font-weight: 600;
          color: #1F2937;
        }
        .clientecho-author-title {
          font-size: 12px;
          font-weight: 400;
          color: #4B5563;
        }
        .clientecho-quote-mark {
          color: #8cff2e;
          font-weight: 700;
        }
      `;
      const result = sanitizeAndValidateCss(inputCss);
      expect(result.valid).toBe(true);
      expect(result.sanitizedCss).toContain("font-size: 18px");
      expect(result.sanitizedCss).toContain("font-weight: 500");
      expect(result.sanitizedCss).toContain("font-style: italic");
      expect(result.sanitizedCss).toContain("line-height: 1.8");
      expect(result.sanitizedCss).toContain("text-align: center");
      expect(result.sanitizedCss).toContain("font-size: 16px");
      expect(result.sanitizedCss).toContain("font-size: 12px");
      expect(result.sanitizedCss).toContain(".clientecho-quote-mark");
    });

    it("safely permits and validates layout-specific CSS for Orbit Avatars, Spotlight, Carousel, and Rotator", () => {
      const inputCss = `
        .clientecho-orbit-row {
          gap: 16px;
        }
        .clientecho-orbit-btn.clientecho-orbit-active {
          outline: 2px solid #8cff2e;
          outline-offset: 2px;
        }
        .clientecho-spotlight-chips {
          gap: 12px;
        }
        .clientecho-spotlight-chip.clientecho-chip-active {
          background-color: rgba(140, 255, 46, 0.15);
          border-color: #8cff2e;
        }
        .clientecho-carousel-btn {
          background-color: #1F2937;
          color: #8cff2e;
          border-radius: 9999px;
        }
        .clientecho-rotator-counter {
          color: #9CA3AF;
        }
        .clientecho-rotator-btn {
          background-color: #111827;
          border-radius: 12px;
        }
      `;
      const result = sanitizeAndValidateCss(inputCss);
      expect(result.valid).toBe(true);
      expect(result.sanitizedCss).toContain(".clientecho-orbit-row");
      expect(result.sanitizedCss).toContain(".clientecho-orbit-btn.clientecho-orbit-active");
      expect(result.sanitizedCss).toContain(".clientecho-spotlight-chips");
      expect(result.sanitizedCss).toContain(".clientecho-spotlight-chip.clientecho-chip-active");
      expect(result.sanitizedCss).toContain(".clientecho-carousel-btn");
      expect(result.sanitizedCss).toContain(".clientecho-rotator-counter");
      expect(result.sanitizedCss).toContain(".clientecho-rotator-btn");
    });
  });

  describe("2. Fixed-Width CSS Responsiveness Guardrail", () => {
    const fixedWidthRegex = /(?:^|[\s;{])(?:(?:max-)?width|min-width)\s*:\s*\d{3,}px/i;

    it("detects fixed pixel widths (e.g. width: 600px, min-width: 400px)", () => {
      expect(fixedWidthRegex.test(".clientecho-card { width: 600px; }")).toBe(true);
      expect(fixedWidthRegex.test(".clientecho-card { min-width: 450px; }")).toBe(true);
      expect(fixedWidthRegex.test("width: 800px;")).toBe(true);
    });

    it("does not flag percentage or small values (e.g. width: 100%, max-width: 100%, border-width: 2px)", () => {
      expect(fixedWidthRegex.test(".clientecho-card { width: 100%; }")).toBe(false);
      expect(fixedWidthRegex.test(".clientecho-card { border-width: 2px; }")).toBe(false);
      expect(fixedWidthRegex.test(".clientecho-avatar { width: 32px; height: 32px; }")).toBe(false);
    });
  });

  describe("3. File Upload Magic Bytes Validation (Security Item 6)", () => {
    it("validates authentic PNG file header", () => {
      const pngBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d]);
      const result = validateImageMagicBytes(pngBytes, "image/png");
      expect(result.valid).toBe(true);
      expect(result.mimeType).toBe("image/png");
      expect(result.extension).toBe("png");
    });

    it("validates authentic JPEG file header", () => {
      const jpegBytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]);
      const result = validateImageMagicBytes(jpegBytes, "image/jpeg");
      expect(result.valid).toBe(true);
      expect(result.mimeType).toBe("image/jpeg");
      expect(result.extension).toBe("jpg");
    });

    it("validates authentic WebP file header", () => {
      const webpBytes = new Uint8Array([
        0x52, 0x49, 0x46, 0x46, // RIFF
        0x24, 0x00, 0x00, 0x00,
        0x57, 0x45, 0x42, 0x50, // WEBP
      ]);
      const result = validateImageMagicBytes(webpBytes, "image/webp");
      expect(result.valid).toBe(true);
      expect(result.mimeType).toBe("image/webp");
      expect(result.extension).toBe("webp");
    });

    it("validates authentic GIF file header", () => {
      const gifBytes = new Uint8Array([
        0x47, 0x49, 0x46, 0x38, 0x39, 0x61, // GIF89a
        0x01, 0x00, 0x01, 0x00, 0x80, 0x00,
      ]);
      const result = validateImageMagicBytes(gifBytes, "image/gif");
      expect(result.valid).toBe(true);
      expect(result.mimeType).toBe("image/gif");
      expect(result.extension).toBe("gif");
    });

    it("rejects MIME type spoofing (e.g. text/html masked as image/png)", () => {
      const spoofedBytes = new TextEncoder().encode("<html><script>alert(1)</script></html>");
      const result = validateImageMagicBytes(spoofedBytes, "image/png");
      expect(result.valid).toBe(false);
      expect(result.error).toContain("Invalid or unsupported file signature");
    });

    it("rejects empty files", () => {
      const emptyBytes = new Uint8Array(0);
      const result = validateImageMagicBytes(emptyBytes);
      expect(result.valid).toBe(false);
      expect(result.error).toBe("File is empty");
    });

    it("rejects mismatched declared MIME type vs authentic bytes", () => {
      const pngBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d]);
      const result = validateImageMagicBytes(pngBytes, "image/jpeg");
      expect(result.valid).toBe(false);
      expect(result.error).toContain("MIME type mismatch");
    });
  });

  describe("4. Login Rate Limiting & Account Lockout Defense (Security Item 3)", () => {
    const testEmail = "security-test@example.com";
    const testIp = "192.168.1.100";

    beforeEach(() => {
      resetLoginFailures(testEmail);
    });

    it("allows initial login attempts", async () => {
      const status = await checkLoginRateLimit(testIp, testEmail);
      expect(status.success).toBe(true);
    });

    it("increments failure count and triggers lockout at 5 attempts", async () => {
      // 1st to 4th failure
      for (let i = 1; i <= 4; i++) {
        const failState = recordLoginFailure(testEmail);
        expect(failState.attempts).toBe(i);
        expect(failState.isLocked).toBe(false);
      }

      // 5th failure -> Lockout triggered
      const fifthFail = recordLoginFailure(testEmail);
      expect(fifthFail.attempts).toBe(5);
      expect(fifthFail.isLocked).toBe(true);

      // checkLoginRateLimit should now reject with lockout message
      const status = await checkLoginRateLimit(testIp, testEmail);
      expect(status.success).toBe(false);
      expect(status.reason).toContain("Account temporarily locked");
      expect(status.retryAfterSeconds).toBeGreaterThan(0);
    });

    it("resets failure counter on successful login", async () => {
      recordLoginFailure(testEmail);
      recordLoginFailure(testEmail);
      resetLoginFailures(testEmail);

      const status = await checkLoginRateLimit(testIp, testEmail);
      expect(status.success).toBe(true);
    });
  });

  describe("5. Stripe Webhook Idempotency Schema (Security Item 2)", () => {
    it("defines processedStripeEvents table schema with id, eventType, and processedAt", () => {
      expect(processedStripeEvents).toBeDefined();
      expect(processedStripeEvents.id).toBeDefined();
      expect(processedStripeEvents.eventType).toBeDefined();
      expect(processedStripeEvents.processedAt).toBeDefined();
    });
  });
});
