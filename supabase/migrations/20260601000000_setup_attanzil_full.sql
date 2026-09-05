-- ============================================================
-- SETUP COMPLET - INSTITUT ATTANZIL (2ème projet Supabase)
-- À exécuter dans : Supabase → SQL Editor → New query → Run
-- ============================================================

-- ============================================================
-- 1. TYPES / ENUMS
-- ============================================================

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'group_type') THEN
    CREATE TYPE public.group_type AS ENUM ('Lundi', 'Samedi', 'Dimanche');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'attendance_status') THEN
    CREATE TYPE public.attendance_status AS ENUM ('present', 'absent_justified', 'absent_unjustified');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('admin', 'user');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'event_type') THEN
    CREATE TYPE public.event_type AS ENUM ('vacation', 'seminar', 'holiday', 'special_session', 'maintenance');
  END IF;
END $$;

-- ============================================================
-- 2. TABLE USER_ROLES (créée AVANT has_role qui la référence)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role public.app_role NOT NULL DEFAULT 'user',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 3. FONCTIONS UTILITAIRES
-- ============================================================

CREATE OR REPLACE FUNCTION public.has_role(user_id uuid, role app_role)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = has_role.user_id AND role = has_role.role
  );
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 4. TABLE MEMBERS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    city TEXT NOT NULL DEFAULT '',
    group_type public.group_type NOT NULL DEFAULT 'Lundi',
    secondary_groups public.group_type[] DEFAULT '{}',
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_members_secondary_groups ON public.members USING GIN (secondary_groups);
CREATE INDEX IF NOT EXISTS idx_members_deleted_at ON public.members (deleted_at)
  WHERE deleted_at IS NULL;

-- ============================================================
-- 5. TABLE ATTENDANCES
-- ============================================================

CREATE TABLE IF NOT EXISTS public.attendances (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status public.attendance_status NOT NULL DEFAULT 'present',
    group_name TEXT,
    session_type TEXT,
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    transfer_note TEXT,
    sync_note TEXT,
    auto_transferred BOOLEAN DEFAULT FALSE,
    transferred_at TIMESTAMPTZ,
    CONSTRAINT unique_member_date_session UNIQUE (member_id, date, session_type)
);

CREATE INDEX IF NOT EXISTS idx_attendances_date_group ON public.attendances (date, session_type);
CREATE INDEX IF NOT EXISTS idx_attendances_group ON public.attendances (group_name);
CREATE INDEX IF NOT EXISTS idx_attendances_member ON public.attendances (member_id, date DESC);

-- ============================================================
-- 6. TABLE PAYMENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL DEFAULT 20,
    payment_date DATE NOT NULL,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_member_date ON public.payments (member_id, payment_date DESC);

-- ============================================================
-- 7. TABLE EVENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    event_type public.event_type NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    groups public.group_type[] DEFAULT '{}',
    exclude_from_stats BOOLEAN DEFAULT TRUE,
    requires_attendance BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    CONSTRAINT valid_dates CHECK (end_date >= start_date)
);

CREATE INDEX IF NOT EXISTS idx_events_dates ON public.events (start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_events_type ON public.events (event_type);
CREATE INDEX IF NOT EXISTS idx_events_groups ON public.events USING GIN (groups);

-- ============================================================
-- 8. TABLE PROFESSOR_SESSIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.professor_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    actual_hours DECIMAL(5,2) NOT NULL CHECK (actual_hours >= 0),
    notes TEXT,
    status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('completed', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID,
    updated_by UUID,
    CONSTRAINT unique_user_date UNIQUE(user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_prof_sessions_user_date ON public.professor_sessions (user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_prof_sessions_date ON public.professor_sessions (date);
CREATE INDEX IF NOT EXISTS idx_prof_sessions_status ON public.professor_sessions (status);

-- ============================================================
-- 9. TABLE USER_GROUPS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.user_groups (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    group_type public.group_type NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- 10. TRIGGERS updated_at
-- ============================================================

DROP TRIGGER IF EXISTS update_members_updated_at ON public.members;
CREATE TRIGGER update_members_updated_at
    BEFORE UPDATE ON public.members
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_events_updated_at ON public.events;
CREATE TRIGGER update_events_updated_at
    BEFORE UPDATE ON public.events
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 11. RLS + POLITIQUES
-- ============================================================

-- MEMBERS
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "members_select" ON public.members;
CREATE POLICY "members_select" ON public.members FOR SELECT USING (true);
DROP POLICY IF EXISTS "members_insert_auth" ON public.members;
CREATE POLICY "members_insert_auth" ON public.members FOR INSERT WITH CHECK (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "members_update_auth" ON public.members;
CREATE POLICY "members_update_auth" ON public.members FOR UPDATE USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "members_delete_auth" ON public.members;
CREATE POLICY "members_delete_auth" ON public.members FOR DELETE USING (auth.role() = 'authenticated');

-- ATTENDANCES
ALTER TABLE public.attendances ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "attendances_select" ON public.attendances;
CREATE POLICY "attendances_select" ON public.attendances FOR SELECT USING (true);
DROP POLICY IF EXISTS "attendances_insert_auth" ON public.attendances;
CREATE POLICY "attendances_insert_auth" ON public.attendances FOR INSERT WITH CHECK (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "attendances_update_auth" ON public.attendances;
CREATE POLICY "attendances_update_auth" ON public.attendances FOR UPDATE USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "attendances_delete_auth" ON public.attendances;
CREATE POLICY "attendances_delete_auth" ON public.attendances FOR DELETE USING (auth.role() = 'authenticated');

-- PAYMENTS
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "payments_select" ON public.payments;
CREATE POLICY "payments_select" ON public.payments FOR SELECT USING (true);
DROP POLICY IF EXISTS "payments_insert_auth" ON public.payments;
CREATE POLICY "payments_insert_auth" ON public.payments FOR INSERT WITH CHECK (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "payments_delete_auth" ON public.payments;
CREATE POLICY "payments_delete_auth" ON public.payments FOR DELETE USING (auth.role() = 'authenticated');

-- EVENTS
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "events_select" ON public.events;
CREATE POLICY "events_select" ON public.events FOR SELECT USING (true);
DROP POLICY IF EXISTS "events_insert_auth" ON public.events;
CREATE POLICY "events_insert_auth" ON public.events FOR INSERT WITH CHECK (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "events_update_admin" ON public.events;
CREATE POLICY "events_update_admin" ON public.events FOR UPDATE USING (
    public.has_role(auth.uid(), 'admin'::public.app_role)
);
DROP POLICY IF EXISTS "events_delete_admin" ON public.events;
CREATE POLICY "events_delete_admin" ON public.events FOR DELETE USING (
    public.has_role(auth.uid(), 'admin'::public.app_role)
);

-- PROFESSOR_SESSIONS
ALTER TABLE public.professor_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "prof_sessions_select_own" ON public.professor_sessions;
CREATE POLICY "prof_sessions_select_own" ON public.professor_sessions FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "prof_sessions_insert_own" ON public.professor_sessions;
CREATE POLICY "prof_sessions_insert_own" ON public.professor_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "prof_sessions_update_own" ON public.professor_sessions;
CREATE POLICY "prof_sessions_update_own" ON public.professor_sessions FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "prof_sessions_delete_own" ON public.professor_sessions;
CREATE POLICY "prof_sessions_delete_own" ON public.professor_sessions FOR DELETE USING (auth.uid() = user_id);

-- USER_ROLES
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "user_roles_select" ON public.user_roles;
CREATE POLICY "user_roles_select" ON public.user_roles FOR SELECT USING (true);

-- USER_GROUPS
ALTER TABLE public.user_groups ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "user_groups_select" ON public.user_groups;
CREATE POLICY "user_groups_select" ON public.user_groups FOR SELECT USING (true);

-- ============================================================
-- 12. REALTIME
-- ============================================================

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.members;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.attendances;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.payments;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.events;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.professor_sessions;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- 13. CRÉATION DU COMPTE ADMIN (mêmes identifiants que Zayed)
-- ============================================================

INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, confirmation_sent_at, recovery_sent_at,
    confirmation_token, recovery_token,
    email_change, email_change_token_new,
    phone,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
SELECT
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'admin@institut.com',
    crypt('admin123', gen_salt('bf')),
    NOW(), NOW(), NOW(),
    '', '', '', '', '',
    '{"provider":"email","providers":["email"]}',
    '{}',
    NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@institut.com');

INSERT INTO auth.identities (
    id, user_id, provider_id, identity_data, provider,
    last_sign_in_at, created_at, updated_at
)
SELECT
    u.id, u.id, u.id,
    jsonb_build_object('sub', u.id::text, 'email', u.email),
    'email', NOW(), NOW(), NOW()
FROM auth.users u
WHERE u.email = 'admin@institut.com'
  AND NOT EXISTS (SELECT 1 FROM auth.identities i WHERE i.user_id = u.id);

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role
FROM auth.users
WHERE email = 'admin@institut.com'
  AND NOT EXISTS (
    SELECT 1 FROM public.user_roles r
    WHERE r.user_id = auth.users.id
  );