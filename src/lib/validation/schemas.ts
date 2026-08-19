import { z } from "zod";

export const magicLinkRequestSchema = z.object({
  widgetId: z.string().uuid("Invalid widget ID"),
  clientEmail: z.string().email("Invalid client email address"),
  authorName: z.string().min(1, "Author name is required").max(100),
  content: z.string().min(1, "Content is required").max(2000),
  rating: z.number().int().min(1).max(5).optional(),
  promptMessage: z.string().max(500).optional(),
});

export const magicLinkApproveSchema = z.object({
  token: z.string().min(32, "Invalid magic link token"),
  authorName: z.string().min(1).max(100).optional(),
  authorTitle: z.string().max(100).optional(),
  content: z.string().min(1).max(2000).optional(),
  rating: z.number().int().min(1).max(5).optional(),
});

export const publicFormSchema = z.object({
  widgetSlug: z.string().min(1, "Widget slug is required"),
  authorName: z.string().min(1, "Your name is required").max(100),
  authorEmail: z.string().email("Invalid email address").optional().or(z.literal("")),
  authorTitle: z.string().max(100).optional(),
  content: z.string().min(10, "Testimonial must be at least 10 characters").max(2000),
  rating: z.number().int().min(1).max(5).optional(),
  videoUrl: z.string().url().optional().or(z.literal("")),
  turnstileToken: z.string().optional(),
});

export const manualImportSchema = z.object({
  widgetId: z.string().uuid("Invalid widget ID"),
  authorName: z.string().min(1, "Author name is required").max(100),
  authorTitle: z.string().max(100).optional(),
  content: z.string().min(5, "Testimonial content is required").max(2000),
  rating: z.number().int().min(1).max(5).optional(),
  proofImageUrl: z.string().optional(),
});

export const widgetSchema = z.object({
  name: z.string().min(1, "Widget name is required").max(100),
  slug: z
    .string()
    .min(3, "Slug must be at least 3 characters")
    .max(50)
    .regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens"),
  themeConfig: z
    .object({
      primaryColor: z.string().optional(),
      accentColor: z.string().optional(),
      backgroundColor: z.string().optional(),
      textColor: z.string().optional(),
      cardStyle: z.enum(["minimal", "border", "glass"]).default("border"),
      layout: z.enum(["grid", "carousel", "list", "rotator", "marquee", "spotlight"]).optional(),
      layoutVariant: z.enum(["grid", "carousel", "rotator", "marquee", "spotlight"]).default("grid"),
      fontPairing: z.string().optional(),
      showRating: z.boolean().default(true),
      showAvatar: z.boolean().default(true),
      borderRadius: z.union([z.number(), z.string()]).optional(),
      paddingDensity: z.enum(["compact", "comfortable", "spacious"]).default("comfortable"),
      shadowIntensity: z.enum(["none", "subtle", "pronounced"]).default("subtle"),
      sizePreset: z.enum(["compact", "standard", "large", "full", "custom"]).default("standard"),
      customMaxWidth: z.union([z.number(), z.string()]).optional(),
      textReveal: z.boolean().default(false),
      defaultTheme: z.enum(["light", "dark", "auto"]).default("light"),
      autoRotateInterval: z.number().min(2).max(60).default(6),
      customCss: z.string().optional(),
    })
    .passthrough()
    .default({}),
  isActive: z.boolean().default(true),
});


