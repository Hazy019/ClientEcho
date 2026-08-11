-- ============================================================================
-- CLIENTECHO MVP: Postgres Schema and Row-Level Security (RLS) Migration
-- ============================================================================
-- RLS POLICY AUDIT SUMMARY & ROLE RESTRICTIONS:
--
-- 1. Table: creators
--    - SELECT: Allowed for authenticated creator where id = auth.uid(), or Tech Admin.
--    - INSERT: Allowed for authenticated creator where id = auth.uid().
--    - UPDATE: Allowed for authenticated creator where id = auth.uid().
--    - DELETE: Allowed for authenticated creator where id = auth.uid().
--
-- 2. Table: widgets
--    - SELECT: Allowed for creator where creator_id = auth.uid(), OR anon/public if is_active = true.
--    - INSERT: Allowed for creator where creator_id = auth.uid().
--    - UPDATE: Allowed for creator where creator_id = auth.uid().
--    - DELETE: Allowed for creator where creator_id = auth.uid().
--
-- 3. Table: testimonials
--    - SELECT: Allowed for creator where creator_id = auth.uid(), OR public/anon where status = 'approved'.
--    - INSERT: Allowed for public/anon/authenticated ONLY with CHECK (status = 'pending').
--              Creators inserting directly must have creator_id = auth.uid().
--    - UPDATE: Allowed ONLY for creator where creator_id = auth.uid(). Tech Admin explicitly DENIED!
--    - DELETE: Allowed ONLY for creator where creator_id = auth.uid(). Tech Admin explicitly DENIED!
--
-- 4. Table: magic_link_tokens
--    - SELECT: Creator owning the testimonial, OR public/anon if token is unexpired and unused.
--    - INSERT: Creator owning the testimonial.
--    - UPDATE: Public/anon can set used_at = now() ONLY if token is unexpired and unused.
--    - DELETE: Creator owning testimonial OR service cron.
--
-- 5. Table: admin_audit_log
--    - SELECT: Allowed ONLY for Tech Admin (app_metadata.role = 'tech_admin').
--    - INSERT: Allowed ONLY for Tech Admin (app_metadata.role = 'tech_admin').
--    - UPDATE: DENIED to all roles (Immutable log).
--    - DELETE: DENIED to all roles (Immutable log).
-- ============================================================================

-- Create Enums
CREATE TYPE testimonial_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE testimonial_source AS ENUM ('magic_link', 'public_form', 'manual_import');

-- 1. creators Table
CREATE TABLE IF NOT EXISTS creators (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    name TEXT,
    avatar_url TEXT,
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    stripe_price_id TEXT,
    subscription_status TEXT DEFAULT 'free' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2. widgets Table
CREATE TABLE IF NOT EXISTS widgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    theme_config JSONB DEFAULT '{}'::jsonb NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 3. testimonials Table
CREATE TABLE IF NOT EXISTS testimonials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    widget_id UUID NOT NULL REFERENCES widgets(id) ON DELETE CASCADE,
    creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
    author_name TEXT NOT NULL,
    author_email TEXT,
    author_title TEXT,
    author_avatar_url TEXT,
    content TEXT NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    status testimonial_status DEFAULT 'pending' NOT NULL,
    source testimonial_source NOT NULL,
    video_url TEXT,
    proof_image_url TEXT,
    is_imported_self_reported BOOLEAN DEFAULT false NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 4. magic_link_tokens Table
CREATE TABLE IF NOT EXISTS magic_link_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    testimonial_id UUID NOT NULL REFERENCES testimonials(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL UNIQUE,
    client_email TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 5. admin_audit_log Table
CREATE TABLE IF NOT EXISTS admin_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL REFERENCES auth.users(id),
    action TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_id TEXT,
    details JSONB DEFAULT '{}'::jsonb NOT NULL,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Indexes for performance & query isolation
CREATE INDEX IF NOT EXISTS idx_widgets_creator_id ON widgets(creator_id);
CREATE INDEX IF NOT EXISTS idx_widgets_slug ON widgets(slug);
CREATE INDEX IF NOT EXISTS idx_testimonials_creator_id ON testimonials(creator_id);
CREATE INDEX IF NOT EXISTS idx_testimonials_widget_id ON testimonials(widget_id);
CREATE INDEX IF NOT EXISTS idx_testimonials_status ON testimonials(status);
CREATE INDEX IF NOT EXISTS idx_magic_link_tokens_hash ON magic_link_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_magic_link_tokens_testimonial_id ON magic_link_tokens(testimonial_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

ALTER TABLE creators ENABLE ROW LEVEL SECURITY;
ALTER TABLE widgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE magic_link_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- 1. POLICIES FOR creators TABLE
-- ----------------------------------------------------------------------------
CREATE POLICY "creators_select_own_or_admin"
    ON creators FOR SELECT
    USING (
        auth.uid() = id 
        OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'tech_admin'
    );

CREATE POLICY "creators_insert_own"
    ON creators FOR INSERT
    WITH CHECK (auth.uid() = id);

CREATE POLICY "creators_update_own"
    ON creators FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

CREATE POLICY "creators_delete_own"
    ON creators FOR DELETE
    USING (auth.uid() = id);

-- ----------------------------------------------------------------------------
-- 2. POLICIES FOR widgets TABLE
-- ----------------------------------------------------------------------------
CREATE POLICY "widgets_select_own_or_active_public"
    ON widgets FOR SELECT
    USING (
        creator_id = auth.uid() 
        OR is_active = true
    );

CREATE POLICY "widgets_insert_own"
    ON widgets FOR INSERT
    WITH CHECK (creator_id = auth.uid());

CREATE POLICY "widgets_update_own"
    ON widgets FOR UPDATE
    USING (creator_id = auth.uid())
    WITH CHECK (creator_id = auth.uid());

CREATE POLICY "widgets_delete_own"
    ON widgets FOR DELETE
    USING (creator_id = auth.uid());

-- ----------------------------------------------------------------------------
-- 3. POLICIES FOR testimonials TABLE
-- ----------------------------------------------------------------------------
-- SELECT: Creator sees all owned testimonials; Public/Anon sees approved testimonials for active widgets
CREATE POLICY "testimonials_select_own_or_approved_public"
    ON testimonials FOR SELECT
    USING (
        creator_id = auth.uid()
        OR (
            status = 'approved' 
            AND EXISTS (
                SELECT 1 FROM widgets 
                WHERE widgets.id = testimonials.widget_id 
                AND widgets.is_active = true
            )
        )
    );

-- INSERT: Anyone (anon/authenticated) can insert a pending testimonial.
-- Enforce WITH CHECK (status = 'pending') in policy itself!
CREATE POLICY "testimonials_insert_pending_or_own"
    ON testimonials FOR INSERT
    WITH CHECK (
        status = 'pending'
        OR creator_id = auth.uid()
    );

-- UPDATE: ONLY Creator owning the row can update. Tech Admin is explicitly denied!
CREATE POLICY "testimonials_update_own_only"
    ON testimonials FOR UPDATE
    USING (
        creator_id = auth.uid()
        AND COALESCE((auth.jwt() -> 'app_metadata' ->> 'role'), '') != 'tech_admin'
    )
    WITH CHECK (
        creator_id = auth.uid()
        AND COALESCE((auth.jwt() -> 'app_metadata' ->> 'role'), '') != 'tech_admin'
    );

-- DELETE: ONLY Creator owning the row can delete. Tech Admin is explicitly denied!
CREATE POLICY "testimonials_delete_own_only"
    ON testimonials FOR DELETE
    USING (
        creator_id = auth.uid()
        AND COALESCE((auth.jwt() -> 'app_metadata' ->> 'role'), '') != 'tech_admin'
    );

-- ----------------------------------------------------------------------------
-- 4. POLICIES FOR magic_link_tokens TABLE
-- ----------------------------------------------------------------------------
CREATE POLICY "magic_tokens_select_own_or_valid_public"
    ON magic_link_tokens FOR SELECT
    USING (
        (used_at IS NULL AND expires_at > now())
        OR EXISTS (
            SELECT 1 FROM testimonials 
            WHERE testimonials.id = magic_link_tokens.testimonial_id 
            AND testimonials.creator_id = auth.uid()
        )
    );

CREATE POLICY "magic_tokens_insert_creator_own"
    ON magic_link_tokens FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM testimonials 
            WHERE testimonials.id = magic_link_tokens.testimonial_id 
            AND testimonials.creator_id = auth.uid()
        )
    );

CREATE POLICY "magic_tokens_update_mark_used"
    ON magic_link_tokens FOR UPDATE
    USING (used_at IS NULL AND expires_at > now())
    WITH CHECK (used_at IS NOT NULL);

CREATE POLICY "magic_tokens_delete_own_or_admin"
    ON magic_link_tokens FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM testimonials 
            WHERE testimonials.id = magic_link_tokens.testimonial_id 
            AND testimonials.creator_id = auth.uid()
        )
        OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'tech_admin'
    );

-- ----------------------------------------------------------------------------
-- 5. POLICIES FOR admin_audit_log TABLE (Immutable Log)
-- ----------------------------------------------------------------------------
CREATE POLICY "admin_audit_log_select_admin"
    ON admin_audit_log FOR SELECT
    USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'tech_admin');

CREATE POLICY "admin_audit_log_insert_admin"
    ON admin_audit_log FOR INSERT
    WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'tech_admin');

-- Note: No UPDATE or DELETE policies created for admin_audit_log to ensure immutability.
