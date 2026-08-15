# ClientEcho — Zero-Friction Testimonial & Social Proof Platform

ClientEcho is an enterprise-grade, multi-tenant B2B SaaS platform engineered for solo creators, developers, and agencies to collect 1-click magic link approvals, import offline praise with hardcoded trust signals, and embed sandboxed, zero-CLS social proof widgets in minutes.

---

## 🏛️ The 13 Core System Architecture Pillars

ClientEcho is built strictly adhering to 13 fundamental architectural pillars:

### 1. Multi-Tenant PostgreSQL Row-Level Security (RLS)
- Every table (`creators`, `widgets`, `testimonials`, `magic_link_tokens`, `admin_audit_log`, `password_reset_tokens`) has RLS enabled.
- Data isolation is strictly enforced via `auth.uid() = creator_id`, ensuring tenant workspaces cannot query, modify, or delete cross-tenant social proof.

### 2. 1-Click Cryptographic Magic Link Pipeline
- Generates 32-byte cryptographically random raw tokens (`crypto.randomBytes(32)` -> 64 hex chars).
- Plaintext tokens are transmitted strictly via transactional email; PostgreSQL stores SHA-256 hashes (`token_hash`).
- Single-use enforcement (`used_at`) with atomic PostgreSQL transactions prevents double-spending token race conditions.

### 3. Public Submission Intake & Multi-Layer Spam Defense
- **Step 1:** Cloudflare Turnstile CAPTCHA verification (`verifyTurnstileToken`).
- **Step 2:** Strict Zod schema parsing (`publicFormSchema`).
- **Step 3:** Server-side DOMPurify sanitization (`sanitizeHtml`, `sanitizePlainText`) stripping `<script>`, event handlers, and dangerous tags.
- **Step 4:** Upstash Dual Sliding-Window Rate Limiting (5 req/min per IP, 20 req/min per widget slug).
- **Step 5:** Video URL allowlist validation (YouTube, Vimeo, Loom).

### 4. Offline Praise Import & Trust Verification Badging
- Supports importing manual client feedback (Slack DMs, tweets, email screenshots).
- Automatically tagged with hardcoded immutable trust badges:
  - `Verified Magic Link`: Cryptographic client 1-click approval.
  - `Verified Submission`: Public widget form with Turnstile bot protection.
  - `Self-Reported / Imported`: Manual creator import with transparent audit label.

### 5. Sandboxed Iframe Embed Delivery Engine
- Serves sandboxed iframe embeds (`/embed/[slug]`) with `Content-Security-Policy: frame-ancestors *`.
- Auto-resizing cross-origin `postMessage` listener updates host iframe height dynamically without layout shifts or scrollbars inside the iframe.

### 6. Framing & Clickjacking Defense Architecture
- All authenticated and sensitive surfaces (`/dashboard/*`, `/settings/*`, `/billing/*`, `/admin/*`, `/login`, `/signup`) strictly emit:
  - `X-Frame-Options: DENY`
  - `Content-Security-Policy: frame-ancestors 'none'`
  - `X-Content-Type-Options: nosniff`

### 7. Surface C Tech Admin Role Boundary & Immutable Audit Trail
- Separate `/admin` route restricted to `app_metadata.role = 'tech_admin'`.
- PostgreSQL RLS explicitly blocks Tech Admins from modifying or deleting creator testimonials (`COALESCE((auth.jwt() -> 'app_metadata' ->> 'role'), '') != 'tech_admin'`).
- All admin suspension actions write non-repudiable logs to `admin_audit_log`.

### 8. Stripe Billing & Subscription Telemetry
- Tiered feature limits enforced between Starter Free Plan ($0/forever, 1 widget limit, 25 approved testimonials cap) and Pro Workspace Plan ($19/mo, unlimited widgets, custom Google Fonts, white-label branding removal).
- Fully integrated with PCI-compliant Stripe Checkout and Customer Portal.

### 9. Edge Caching & Cache Invalidation Strategy
- Embed payloads check Upstash Redis cache first (`getCachedWidgetPayload`), reducing database load.
- Automatic cache invalidation (`invalidateWidgetCache`) fires on testimonial approval, rejection, deletion, or theme modification.

### 10. Cyber-Ink Design System
- Branded CSS token palette (`--ink-900: #2D2D2D`, `--ink-800: #33363B`, `--surface-light: #EFF3F6`, `--surface-white: #FFFFFF`).
- Syne font for display headings, Manrope for body text, with smooth glassmorphism and subtle micro-interactions.

### 11. Structural Scrollbar Layout Architecture
- Fixed 64px header (`.app-navbar`, `position: fixed`, `top: 0`, `height: 64px`, `z-index: 50`) outside the scroll container.
- Dedicated scrollable region (`.app-scroll-region`, `margin-top: 64px`, `height: calc(100vh - 64px)`, `overflow-y: auto`).
- Scoped custom scrollbars ensure scrollbar thumbs visually start **below the top header** across all routes.

### 12. Layout-Matching Shimmer Skeleton Loading System
- Zero Cumulative Layout Shift (CLS) loading states via [`SkeletonBlock.tsx`](file:///r:/kyrell/Testing/ClientEcho/src/components/ui/SkeletonBlock.tsx).
- Replaces generic text/spinners with exact footprint shimmer loaders.
- Full compliance with `@media (prefers-reduced-motion: reduce)` accessibility standards.

### 13. Token Cleanup Cron & Data Lifecycle Pipeline
- Automated background maintenance route (`/api/cron/purge-tokens`) purges expired or used magic link tokens.
- PostgreSQL `ON DELETE CASCADE` foreign key references ensure clean account deletion and data lifecycle hygiene.

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Framework** | Next.js 14 (App Router, Server Actions, Edge Middleware) |
| **Database & Auth** | PostgreSQL (Supabase Auth & SSR Client, Drizzle ORM) |
| **Security & Spam** | Cloudflare Turnstile, isomorphic-dompurify, Upstash Redis Rate Limiting |
| **Styling & UI** | TailwindCSS, Framer Motion, Lucide React, Syne & Manrope Fonts |
| **Payments** | Stripe Checkout API & Stripe Customer Portal |

---

## ⚡ Quickstart & Development Setup

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/your-org/client-echo.git
cd client-echo
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the root directory:
```env
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Database Connection
DATABASE_URL=postgresql://postgres:password@db.your-project.supabase.co:5432/postgres

# Upstash Redis Rate Limiting & Cache
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-redis-token

# Cloudflare Turnstile CAPTCHA
TURNSTILE_SECRET_KEY=your-turnstile-secret-key

# Stripe Billing
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### 3. Database Migration
Apply the PostgreSQL schema and RLS policies:
```bash
npx drizzle-kit push
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📊 Code Logic & Efficiency Analysis

| Subsystem | File Path | Efficiency Rating | Architectural Audit Notes |
| :--- | :--- | :---: | :--- |
| **Edge Routing** | [`src/middleware.ts`](file:///r:/kyrell/Testing/ClientEcho/src/middleware.ts) | 🟢 **High** | Performs session checks and injects security framing headers (`X-Frame-Options: DENY`) before reaching page handlers. |
| **Public Intake** | [`/api/testimonials/public/route.ts`](file:///r:/kyrell/Testing/ClientEcho/src/app/api/testimonials/public/route.ts) | 🟢 **High** | Early Turnstile & Zod validation prevents wasteful DB queries on invalid/bot payloads. |
| **Token Approval** | [`/api/testimonials/approve-token/route.ts`](file:///r:/kyrell/Testing/ClientEcho/src/app/api/testimonials/approve-token/route.ts) | 🟢 **High** | Atomic DB transaction prevents double-spending token race conditions. Purges Redis cache instantly upon state update. |
| **Embed Delivery** | [`/embed/[slug]/page.tsx`](file:///r:/kyrell/Testing/ClientEcho/src/app/embed/%5Bslug%5D/page.tsx) | 🟢 **High** | Cache-first strategy (`getCachedWidgetPayload`) bypasses Postgres queries for high-volume embed requests. |
| **Scroll & Layout** | [`src/app/globals.css`](file:///r:/kyrell/Testing/ClientEcho/src/app/globals.css) | 🟢 **High** | Separates fixed 64px header from `.app-scroll-region` container, guaranteeing clean scrollbar thumb positioning. |
| **Skeleton System** | [`SkeletonBlock.tsx`](file:///r:/kyrell/Testing/ClientEcho/src/components/ui/SkeletonBlock.tsx) | 🟢 **High** | Replaces layout-shifting spinners with exact footprint shimmer blocks; handles `prefers-reduced-motion`. |

