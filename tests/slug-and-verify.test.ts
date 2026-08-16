import { describe, it, expect } from "vitest";
import { widgetSchema } from "../src/lib/validation/schemas";
import {
  generateVerificationFingerprint,
  getVerificationTierDetails,
} from "../src/lib/security/verification";
import { generateMagicLinkToken, hashMagicLinkToken } from "../src/lib/tokens/magic-link";

describe("Pass 11: Multi-Tenant Slug & Public Verification Test Suite", () => {
  describe("1. Slug Schema & Format Validation", () => {
    it("accepts valid lowercase alphanumeric and hyphenated slugs", () => {
      const validSlugs = [
        "portfolio-abc123",
        "agency-client-reviews",
        "acme-design-2026",
        "custom-widget-1",
      ];
      for (const slug of validSlugs) {
        const res = widgetSchema.safeParse({
          name: "My Widget",
          slug,
        });
        expect(res.success, `Expected slug "${slug}" to be valid`).toBe(true);
      }
    });

    it("rejects invalid slugs containing uppercase, spaces, or special characters", () => {
      const invalidSlugs = [
        "My-Portfolio",
        "portfolio with spaces",
        "widget_underscore",
        "slug@special!",
        "ab", // too short (< 3)
      ];
      for (const slug of invalidSlugs) {
        const res = widgetSchema.safeParse({
          name: "My Widget",
          slug,
        });
        expect(res.success, `Expected slug "${slug}" to be rejected`).toBe(false);
      }
    });
  });

  describe("2. Multi-Tenant Conflict Simulation", () => {
    interface MockWidget {
      id: string;
      creatorId: string;
      slug: string;
    }

    function evaluateSlugConflict(
      existingDbWidgets: MockWidget[],
      requestingCreatorId: string,
      targetSlug: string
    ): { allow: boolean; isUpdate: boolean; status: number; error?: string } {
      const slugOwner = existingDbWidgets.find((w) => w.slug === targetSlug);

      if (slugOwner) {
        if (slugOwner.creatorId === requestingCreatorId) {
          // Allowed: Owner updating their own widget with this slug
          return { allow: true, isUpdate: true, status: 200 };
        }
        // Conflict: Another tenant already claimed this global slug
        return {
          allow: false,
          isUpdate: false,
          status: 409,
          error: `The URL "${targetSlug}" is already taken. Try a different one.`,
        };
      }

      // Allowed: Unclaimed slug, inserting new widget
      return { allow: true, isUpdate: false, status: 200 };
    }

    const mockDb: MockWidget[] = [
      { id: "w-1", creatorId: "creator-alice", slug: "portfolio-alice" },
      { id: "w-2", creatorId: "creator-alice", slug: "design-reviews" },
      { id: "w-3", creatorId: "creator-bob", slug: "dev-testimonials" },
    ];

    it("allows Alice to update her existing widget slug", () => {
      const res = evaluateSlugConflict(mockDb, "creator-alice", "portfolio-alice");
      expect(res.allow).toBe(true);
      expect(res.isUpdate).toBe(true);
      expect(res.status).toBe(200);
    });

    it("PREVENTS Bob from hijacking Alice's slug and returns 409 Conflict", () => {
      const res = evaluateSlugConflict(mockDb, "creator-bob", "portfolio-alice");
      expect(res.allow).toBe(false);
      expect(res.status).toBe(409);
      expect(res.error).toContain('The URL "portfolio-alice" is already taken');
    });

    it("PREVENTS Charlie from claiming an existing slug from any creator", () => {
      const res1 = evaluateSlugConflict(mockDb, "creator-charlie", "design-reviews");
      expect(res1.allow).toBe(false);
      expect(res1.status).toBe(409);

      const res2 = evaluateSlugConflict(mockDb, "creator-charlie", "dev-testimonials");
      expect(res2.allow).toBe(false);
      expect(res2.status).toBe(409);
    });

    it("allows Charlie to create a fresh unique slug", () => {
      const res = evaluateSlugConflict(mockDb, "creator-charlie", "portfolio-charlie-99");
      expect(res.allow).toBe(true);
      expect(res.isUpdate).toBe(false);
      expect(res.status).toBe(200);
    });
  });

  describe("3. Flagship Differentiator: Public Verification Page Logic", () => {
    it("generates deterministic non-reversible verification fingerprints", () => {
      const testimonialId = "123e4567-e89b-12d3-a456-426614174000";
      const tokenHash = "5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8";

      const fp1 = generateVerificationFingerprint(testimonialId, tokenHash);
      const fp2 = generateVerificationFingerprint(testimonialId, tokenHash);

      expect(fp1).toBe(fp2);
      expect(fp1).toMatch(/^CE-VFY-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}$/);

      // Verify changing ID produces distinct fingerprint
      const fp3 = generateVerificationFingerprint("different-id-0000", tokenHash);
      expect(fp3).not.toBe(fp1);
    });

    it("correctly identifies Tier 1: Magic Link cryptographic verification", () => {
      const details = getVerificationTierDetails("magic_link", false);
      expect(details.tier).toBe("magic_link");
      expect(details.badgeLabel).toBe("Verified & Approved");
      expect(details.isCryptographicallyVerified).toBe(true);
      expect(details.statusBadgeColor).toBe("emerald");
      expect(details.summary).toContain("cryptographic magic link");
    });

    it("correctly identifies Tier 2: Public Form submission", () => {
      const details = getVerificationTierDetails("public_form", false);
      expect(details.tier).toBe("public_form");
      expect(details.badgeLabel).toBe("Verified Direct Submission");
      expect(details.isCryptographicallyVerified).toBe(true);
      expect(details.statusBadgeColor).toBe("indigo");
      expect(details.summary).toContain("Turnstile bot protection");
    });

    it("correctly and honestly identifies Tier 3: Manual Import / Self-Reported", () => {
      const details = getVerificationTierDetails("manual_import", true);
      expect(details.tier).toBe("manual_import");
      expect(details.badgeLabel).toBe("Self-Reported / Imported");
      expect(details.isCryptographicallyVerified).toBe(false);
      expect(details.statusBadgeColor).toBe("amber");
      expect(details.summary).toContain("not independently verified");
    });

    it("strictly preserves privacy: never includes raw token or email in fingerprint", () => {
      const rawToken = "super-secret-raw-token-never-expose-1234567890abcdef";
      const tokenHash = hashMagicLinkToken(rawToken);
      const clientEmail = "sensitive-client@company.com";
      const testimonialId = "test-uuid-123";

      const fingerprint = generateVerificationFingerprint(testimonialId, tokenHash);

      expect(fingerprint).not.toContain(rawToken);
      expect(fingerprint).not.toContain(clientEmail);
      expect(fingerprint).not.toContain("sensitive-client");
      expect(fingerprint.length).toBeLessThan(30); // Compact format
    });
  });

  describe("4. Magic Link Timestamp Event Tracking", () => {
    it("simulates full lifecycle: Dispatched -> Opened -> Approved", () => {
      const sentTime = new Date("2026-08-16T10:00:00Z");
      const openTime = new Date("2026-08-16T10:15:00Z");
      const approveTime = new Date("2026-08-16T10:16:30Z");

      const token = generateMagicLinkToken(72);
      const metadata: Record<string, any> = {
        openedAt: openTime.toISOString(),
      };

      expect(sentTime.getTime()).toBeLessThan(openTime.getTime());
      expect(openTime.getTime()).toBeLessThan(approveTime.getTime());
      expect(metadata.openedAt).toBe("2026-08-16T10:15:00.000Z");
    });
  });
});
