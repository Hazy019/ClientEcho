import {
  pgTable,
  uuid,
  text,
  boolean,
  integer,
  jsonb,
  timestamp,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const testimonialStatusEnum = pgEnum("testimonial_status", [
  "pending",
  "approved",
  "rejected",
]);

export const testimonialSourceEnum = pgEnum("testimonial_source", [
  "magic_link",
  "public_form",
  "manual_import",
]);

// 1. Creators
export const creators = pgTable("creators", {
  id: uuid("id").primaryKey(),
  email: text("email").notNull(),
  name: text("name"),
  avatarUrl: text("avatar_url"),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  stripePriceId: text("stripe_price_id"),
  subscriptionStatus: text("subscription_status").default("free").notNull(),
  customCssTrialsUsed: integer("custom_css_trials_used").default(0).notNull(),
  settings: jsonb("settings").default({
    notifyOnSubmission: true,
    notifyOnApproval: true,
    magicLinksEnabled: true,
    publicFormEnabled: true,
    manualImportEnabled: true,
    requireRating: true,
    formIntroCopy: "Share your experience working with us! Your feedback helps us improve and build social proof.",
  }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// 2. Widgets
export const widgets = pgTable(
  "widgets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    creatorId: uuid("creator_id")
      .notNull()
      .references(() => creators.id, { onDelete: "cascade" }),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    themeConfig: jsonb("theme_config").default({}).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    creatorIdx: index("idx_widgets_creator_id").on(table.creatorId),
    slugIdx: index("idx_widgets_slug").on(table.slug),
  })
);

// 3. Testimonials
export const testimonials = pgTable(
  "testimonials",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    widgetId: uuid("widget_id")
      .notNull()
      .references(() => widgets.id, { onDelete: "cascade" }),
    creatorId: uuid("creator_id")
      .notNull()
      .references(() => creators.id, { onDelete: "cascade" }),
    authorName: text("author_name").notNull(),
    authorEmail: text("author_email"),
    authorTitle: text("author_title"),
    authorAvatarUrl: text("author_avatar_url"),
    content: text("content").notNull(),
    rating: integer("rating"),
    status: testimonialStatusEnum("status").default("pending").notNull(),
    source: testimonialSourceEnum("source").notNull(),
    videoUrl: text("video_url"),
    proofImageUrl: text("proof_image_url"),
    isImportedSelfReported: boolean("is_imported_self_reported").default(false).notNull(),
    metadata: jsonb("metadata").default({}).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    creatorIdx: index("idx_testimonials_creator_id").on(table.creatorId),
    widgetIdx: index("idx_testimonials_widget_id").on(table.widgetId),
    statusIdx: index("idx_testimonials_status").on(table.status),
    creatorStatusIdx: index("idx_testimonials_creator_status").on(table.creatorId, table.status),
    widgetStatusIdx: index("idx_testimonials_widget_status").on(table.widgetId, table.status),
  })
);

// 4. Magic Link Tokens
export const magicLinkTokens = pgTable(
  "magic_link_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    testimonialId: uuid("testimonial_id")
      .notNull()
      .references(() => testimonials.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull().unique(),
    clientEmail: text("client_email").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    hashIdx: index("idx_magic_link_tokens_hash").on(table.tokenHash),
    testimonialIdx: index("idx_magic_link_tokens_testimonial_id").on(table.testimonialId),
  })
);

// 5. Admin Audit Log
export const adminAuditLog = pgTable("admin_audit_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  adminId: text("admin_id").notNull(),
  action: text("action").notNull(),
  targetType: text("target_type").notNull(),
  targetId: text("target_id"),
  details: jsonb("details").default({}).notNull(),
  ipAddress: text("ip_address"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// 6. Password Reset Tokens
export const passwordResetTokens = pgTable(
  "password_reset_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userEmail: text("user_email").notNull(),
    tokenHash: text("token_hash").notNull().unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    hashIdx: index("idx_password_reset_tokens_hash").on(table.tokenHash),
    emailIdx: index("idx_password_reset_tokens_email").on(table.userEmail),
  })
);

// 7. Processed Stripe Events (Idempotency Record)
export const processedStripeEvents = pgTable("processed_stripe_events", {
  id: text("id").primaryKey(), // Stripe event id (e.g. evt_12345)
  eventType: text("event_type").notNull(),
  processedAt: timestamp("processed_at", { withTimezone: true }).defaultNow().notNull(),
});


