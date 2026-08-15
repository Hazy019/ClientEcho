-- ============================================================================
-- CLIENTECHO MVP: Postgres Schema & Row-Level Security (RLS) Migration
-- Non-Destructive, Fully Idempotent & Executable in Supabase SQL Editor
-- ============================================================================

-- 1. Create Custom Enum Types Safely
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'testimonial_status') THEN 
        CREATE TYPE testimonial_status AS ENUM ('pending', 'approved', 'rejected'); 
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'testimonial_source') THEN 
        CREATE TYPE testimonial_source AS ENUM ('magic_link', 'public_form', 'manual_import'); 
    END IF;
END $$;

-- 2. Table: creators
CREATE TABLE IF NOT EXISTS creators (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    name TEXT,
    avatar_url TEXT,
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    stripe_price_id TEXT,
    subscription_status TEXT DEFAULT 'free' NOT NULL,
    custom_css_trials_used INTEGER DEFAULT 0 NOT NULL,
    settings JSONB DEFAULT '{"notifyOnSubmission":true,"notifyOnApproval":true,"magicLinksEnabled":true,"publicFormEnabled":true,"manualImportEnabled":true,"requireRating":true,"formIntroCopy":"Share your experience working with us!"}'::jsonb NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Ensure all creators columns exist if table was created in an earlier pass
ALTER TABLE creators 
    ADD COLUMN IF NOT EXISTS name TEXT,
    ADD COLUMN IF NOT EXISTS avatar_url TEXT,
    ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
    ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
    ADD COLUMN IF NOT EXISTS stripe_price_id TEXT,
    ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'free' NOT NULL,
    ADD COLUMN IF NOT EXISTS custom_css_trials_used INTEGER DEFAULT 0 NOT NULL,
    ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{"notifyOnSubmission":true,"notifyOnApproval":true,"magicLinksEnabled":true,"publicFormEnabled":true,"manualImportEnabled":true,"requireRating":true,"formIntroCopy":"Share your experience working with us!"}'::jsonb NOT NULL,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now() NOT NULL;

-- 3. Table: widgets
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

-- 4. Table: testimonials
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

-- 5. Table: magic_link_tokens
CREATE TABLE IF NOT EXISTS magic_link_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    testimonial_id UUID NOT NULL REFERENCES testimonials(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL UNIQUE,
    client_email TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 6. Table: admin_audit_log
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

-- 7. Table: password_reset_tokens
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_email TEXT NOT NULL,
    token_hash TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
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
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_hash ON password_reset_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_email ON password_reset_tokens(user_email);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Enable RLS safely on all application tables
-- ============================================================================

ALTER TABLE creators ENABLE ROW LEVEL SECURITY;
ALTER TABLE widgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE magic_link_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- POLICIES FOR creators TABLE
-- ----------------------------------------------------------------------------
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'creators_select_own_or_admin' AND tablename = 'creators') THEN
        CREATE POLICY "creators_select_own_or_admin" ON creators FOR SELECT USING (auth.uid() = id OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'tech_admin');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'creators_insert_own' AND tablename = 'creators') THEN
        CREATE POLICY "creators_insert_own" ON creators FOR INSERT WITH CHECK (auth.uid() = id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'creators_update_own' AND tablename = 'creators') THEN
        CREATE POLICY "creators_update_own" ON creators FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'creators_delete_own' AND tablename = 'creators') THEN
        CREATE POLICY "creators_delete_own" ON creators FOR DELETE USING (auth.uid() = id);
    END IF;
END $$;

-- ----------------------------------------------------------------------------
-- POLICIES FOR widgets TABLE
-- ----------------------------------------------------------------------------
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'widgets_select_own_or_active_public' AND tablename = 'widgets') THEN
        CREATE POLICY "widgets_select_own_or_active_public" ON widgets FOR SELECT USING (creator_id = auth.uid() OR is_active = true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'widgets_insert_own' AND tablename = 'widgets') THEN
        CREATE POLICY "widgets_insert_own" ON widgets FOR INSERT WITH CHECK (creator_id = auth.uid());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'widgets_update_own' AND tablename = 'widgets') THEN
        CREATE POLICY "widgets_update_own" ON widgets FOR UPDATE USING (creator_id = auth.uid()) WITH CHECK (creator_id = auth.uid());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'widgets_delete_own' AND tablename = 'widgets') THEN
        CREATE POLICY "widgets_delete_own" ON widgets FOR DELETE USING (creator_id = auth.uid());
    END IF;
END $$;

-- ----------------------------------------------------------------------------
-- POLICIES FOR testimonials TABLE
-- ----------------------------------------------------------------------------
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'testimonials_select_own_or_approved_public' AND tablename = 'testimonials') THEN
        CREATE POLICY "testimonials_select_own_or_approved_public" ON testimonials FOR SELECT USING (creator_id = auth.uid() OR (status = 'approved' AND EXISTS (SELECT 1 FROM widgets WHERE widgets.id = testimonials.widget_id AND widgets.is_active = true)));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'testimonials_insert_own_only' AND tablename = 'testimonials') THEN
        CREATE POLICY "testimonials_insert_own_only" ON testimonials FOR INSERT WITH CHECK (creator_id = auth.uid());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'testimonials_update_own_only' AND tablename = 'testimonials') THEN
        CREATE POLICY "testimonials_update_own_only" ON testimonials FOR UPDATE USING (creator_id = auth.uid() AND COALESCE((auth.jwt() -> 'app_metadata' ->> 'role'), '') != 'tech_admin') WITH CHECK (creator_id = auth.uid() AND COALESCE((auth.jwt() -> 'app_metadata' ->> 'role'), '') != 'tech_admin');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'testimonials_delete_own_only' AND tablename = 'testimonials') THEN
        CREATE POLICY "testimonials_delete_own_only" ON testimonials FOR DELETE USING (creator_id = auth.uid() AND COALESCE((auth.jwt() -> 'app_metadata' ->> 'role'), '') != 'tech_admin');
    END IF;
END $$;

-- ----------------------------------------------------------------------------
-- POLICIES FOR magic_link_tokens TABLE
-- ----------------------------------------------------------------------------
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'magic_tokens_select_own_or_valid_public' AND tablename = 'magic_link_tokens') THEN
        CREATE POLICY "magic_tokens_select_own_or_valid_public" ON magic_link_tokens FOR SELECT USING ((used_at IS NULL AND expires_at > now()) OR EXISTS (SELECT 1 FROM testimonials WHERE testimonials.id = magic_link_tokens.testimonial_id AND testimonials.creator_id = auth.uid()));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'magic_tokens_insert_creator_own' AND tablename = 'magic_link_tokens') THEN
        CREATE POLICY "magic_tokens_insert_creator_own" ON magic_link_tokens FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM testimonials WHERE testimonials.id = magic_link_tokens.testimonial_id AND testimonials.creator_id = auth.uid()));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'magic_tokens_update_mark_used' AND tablename = 'magic_link_tokens') THEN
        CREATE POLICY "magic_tokens_update_mark_used" ON magic_link_tokens FOR UPDATE USING (used_at IS NULL AND expires_at > now()) WITH CHECK (used_at IS NOT NULL);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'magic_tokens_delete_own_or_admin' AND tablename = 'magic_link_tokens') THEN
        CREATE POLICY "magic_tokens_delete_own_or_admin" ON magic_link_tokens FOR DELETE USING (EXISTS (SELECT 1 FROM testimonials WHERE testimonials.id = magic_link_tokens.testimonial_id AND testimonials.creator_id = auth.uid()) OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'tech_admin');
    END IF;
END $$;

-- ----------------------------------------------------------------------------
-- POLICIES FOR admin_audit_log TABLE (Immutable Log)
-- ----------------------------------------------------------------------------
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'admin_audit_log_select_admin' AND tablename = 'admin_audit_log') THEN
        CREATE POLICY "admin_audit_log_select_admin" ON admin_audit_log FOR SELECT USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'tech_admin');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'admin_audit_log_insert_admin' AND tablename = 'admin_audit_log') THEN
        CREATE POLICY "admin_audit_log_insert_admin" ON admin_audit_log FOR INSERT WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'tech_admin');
    END IF;
END $$;
