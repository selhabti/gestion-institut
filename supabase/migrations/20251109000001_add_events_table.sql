-- ============================================
-- MIGRATION COMPLÈTE : AJOUT DE LA TABLE EVENTS ET PROFESSOR_SESSIONS
-- Ne modifie pas le schéma existant
-- Date: 2025-11-09 + 2025-12-12
-- ============================================

-- ============================================
-- PARTIE 1: CRÉATION DU TYPE EVENT_TYPE
-- ============================================

-- 1. Créer le type d'événements (si pas existant)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'event_type') THEN
        CREATE TYPE public.event_type AS ENUM (
            'vacation', 
            'seminar', 
            'holiday', 
            'special_session', 
            'maintenance'
        );
    END IF;
END $$;

-- ============================================
-- PARTIE 2: TABLE EVENTS
-- ============================================

-- 2. Créer la table events (si pas existante)
CREATE TABLE IF NOT EXISTS public.events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    event_type event_type NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    groups group_type[] DEFAULT '{}',
    exclude_from_stats BOOLEAN DEFAULT TRUE,
    requires_attendance BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    CONSTRAINT valid_dates CHECK (end_date >= start_date)
);

COMMENT ON TABLE public.events IS 'Events calendar (vacations, seminars, holidays)';

-- 3. Créer les index (si pas existants)
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE schemaname = 'public' 
        AND tablename = 'events' 
        AND indexname = 'idx_events_dates'
    ) THEN
        CREATE INDEX idx_events_dates ON public.events (start_date, end_date);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE schemaname = 'public' 
        AND tablename = 'events' 
        AND indexname = 'idx_events_type'
    ) THEN
        CREATE INDEX idx_events_type ON public.events (event_type);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE schemaname = 'public' 
        AND tablename = 'events' 
        AND indexname = 'idx_events_groups'
    ) THEN
        CREATE INDEX idx_events_groups ON public.events USING GIN(groups);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE schemaname = 'public' 
        AND tablename = 'events' 
        AND indexname = 'idx_events_stats'
    ) THEN
        CREATE INDEX idx_events_stats ON public.events (exclude_from_stats) 
        WHERE exclude_from_stats = true;
    END IF;
END $$;

-- 4. Activer RLS sur events
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- 5. Politiques RLS pour events
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'events' 
        AND policyname = 'Enable read for all'
    ) THEN
        CREATE POLICY "Enable read for all" ON public.events
            FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'events' 
        AND policyname = 'Enable insert for authenticated users'
    ) THEN
        CREATE POLICY "Enable insert for authenticated users" ON public.events
            FOR INSERT WITH CHECK (auth.role() = 'authenticated');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'events' 
        AND policyname = 'Enable update for creator'
    ) THEN
        CREATE POLICY "Enable update for creator" ON public.events
            FOR UPDATE USING (
                auth.uid() = created_by OR 
                public.has_role(auth.uid(), 'admin'::app_role)
            );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'events' 
        AND policyname = 'Enable delete for admins only'
    ) THEN
        CREATE POLICY "Enable delete for admins only" ON public.events
            FOR DELETE USING (public.has_role(auth.uid(), 'admin'::app_role));
    END IF;
END $$;

-- 6. Trigger pour updated_at sur events
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_events_updated_at'
    ) THEN
        CREATE TRIGGER update_events_updated_at 
            BEFORE UPDATE ON public.events 
            FOR EACH ROW 
            EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
END $$;

-- 7. Activer realtime pour events
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'events'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.events;
    END IF;
END $$;

-- ============================================
-- PARTIE 3: TABLE PROFESSOR_SESSIONS (NOUVEAU)
-- ============================================

-- 8. Création de la table professor_sessions
CREATE TABLE IF NOT EXISTS public.professor_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
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
    
    -- Contrainte: une seule session par jour et par utilisateur
    CONSTRAINT unique_user_date UNIQUE(user_id, date)
);

COMMENT ON TABLE public.professor_sessions IS 'Stockage des heures de cours du professeur';
COMMENT ON COLUMN public.professor_sessions.actual_hours IS 'Nombre d''heures effectuées (0 pour les séances annulées)';
COMMENT ON COLUMN public.professor_sessions.status IS 'Statut: completed (effectué) ou cancelled (annulé)';

-- 9. Ajout des clés étrangères pour professor_sessions
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.table_constraints
        WHERE constraint_name = 'fk_professor_sessions_user'
    ) THEN
        ALTER TABLE public.professor_sessions
        ADD CONSTRAINT fk_professor_sessions_user
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (
        SELECT FROM information_schema.table_constraints
        WHERE constraint_name = 'fk_professor_sessions_created_by'
    ) THEN
        ALTER TABLE public.professor_sessions
        ADD CONSTRAINT fk_professor_sessions_created_by
        FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
    END IF;
    
    IF NOT EXISTS (
        SELECT FROM information_schema.table_constraints
        WHERE constraint_name = 'fk_professor_sessions_updated_by'
    ) THEN
        ALTER TABLE public.professor_sessions
        ADD CONSTRAINT fk_professor_sessions_updated_by
        FOREIGN KEY (updated_by) REFERENCES auth.users(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 10. Création des index pour professor_sessions
CREATE INDEX IF NOT EXISTS idx_prof_sessions_user_date 
ON public.professor_sessions(user_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_prof_sessions_date 
ON public.professor_sessions(date);

CREATE INDEX IF NOT EXISTS idx_prof_sessions_status 
ON public.professor_sessions(status);

CREATE INDEX IF NOT EXISTS idx_prof_sessions_user_status 
ON public.professor_sessions(user_id, status);

-- 11. Activer RLS sur professor_sessions
ALTER TABLE public.professor_sessions ENABLE ROW LEVEL SECURITY;

-- 12. Politiques RLS pour professor_sessions
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT FROM pg_policies WHERE policyname = 'professor_sessions_select_own'
    ) THEN
        CREATE POLICY "professor_sessions_select_own"
            ON public.professor_sessions FOR SELECT
            USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (
        SELECT FROM pg_policies WHERE policyname = 'professor_sessions_insert_own'
    ) THEN
        CREATE POLICY "professor_sessions_insert_own"
            ON public.professor_sessions FOR INSERT
            WITH CHECK (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (
        SELECT FROM pg_policies WHERE policyname = 'professor_sessions_update_own'
    ) THEN
        CREATE POLICY "professor_sessions_update_own"
            ON public.professor_sessions FOR UPDATE
            USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (
        SELECT FROM pg_policies WHERE policyname = 'professor_sessions_delete_own'
    ) THEN
        CREATE POLICY "professor_sessions_delete_own"
            ON public.professor_sessions FOR DELETE
            USING (auth.uid() = user_id);
    END IF;
END $$;

-- 13. Trigger updated_at pour professor_sessions
CREATE OR REPLACE FUNCTION public.handle_professor_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    NEW.updated_by = auth.uid();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_professor_sessions_updated_at ON public.professor_sessions;
CREATE TRIGGER update_professor_sessions_updated_at
    BEFORE UPDATE ON public.professor_sessions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_professor_sessions_updated_at();

-- 14. Trigger created_at pour professor_sessions
CREATE OR REPLACE FUNCTION public.handle_professor_sessions_created_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.created_at = NOW();
    NEW.created_by = auth.uid();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_professor_sessions_created_at ON public.professor_sessions;
CREATE TRIGGER set_professor_sessions_created_at
    BEFORE INSERT ON public.professor_sessions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_professor_sessions_created_at();

-- 15. Activer realtime pour professor_sessions
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'professor_sessions'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.professor_sessions;
    END IF;
END $$;

-- ============================================
-- PARTIE 4: DONNÉES INITIALES
-- ============================================

-- Insérer les vacances d'hiver 2025-2026
INSERT INTO public.events (
    title,
    description,
    event_type,
    start_date,
    end_date,
    groups,
    exclude_from_stats,
    requires_attendance,
    created_by
) 
SELECT 
    'Vacances d''hiver 2025-2026',
    'Période de vacances - Cours suspendus',
    'vacation',
    '2025-12-20',
    '2026-01-04',
    '{}',
    true,
    false,
    id
FROM auth.users 
WHERE NOT EXISTS (
    SELECT 1 FROM public.events 
    WHERE title = 'Vacances d''hiver 2025-2026'
    AND event_type = 'vacation'
)
LIMIT 1;

-- Insérer Aïd al-Fitr
INSERT INTO public.events (
    title,
    description,
    event_type,
    start_date,
    end_date,
    groups,
    exclude_from_stats,
    requires_attendance,
    created_by
) 
SELECT 
    'Aïd al-Fitr 2025',
    'Fête de rupture du jeûne',
    'holiday',
    '2025-03-30',
    '2025-03-31',
    '{}',
    true,
    false,
    id
FROM auth.users 
WHERE NOT EXISTS (
    SELECT 1 FROM public.events 
    WHERE title = 'Aïd al-Fitr 2025'
    AND event_type = 'holiday'
)
LIMIT 1;

-- ============================================
-- PARTIE 5: INDEX SUPPLÉMENTAIRES EXISTANTS
-- ============================================

-- Index sur attendances
CREATE INDEX IF NOT EXISTS idx_attendances_date_group 
  ON public.attendances USING btree (date, session_type);

CREATE INDEX IF NOT EXISTS idx_attendances_group 
  ON public.attendances USING btree (group_name);

CREATE INDEX IF NOT EXISTS idx_attendances_group_date 
  ON public.attendances USING btree (session_type, date);

-- Index GIN sur members
CREATE INDEX IF NOT EXISTS idx_members_secondary_groups 
  ON public.members USING GIN (secondary_groups);

-- ============================================
-- PARTIE 6: AJOUT DES COLONNES À ATTENDANCES
-- ============================================

ALTER TABLE public.attendances 
ADD COLUMN IF NOT EXISTS transfer_note TEXT,
ADD COLUMN IF NOT EXISTS sync_note TEXT,
ADD COLUMN IF NOT EXISTS auto_transferred BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN public.attendances.transfer_note IS 'Note pour les transferts manuels';
COMMENT ON COLUMN public.attendances.sync_note IS 'Note pour les synchronisations automatiques';
COMMENT ON COLUMN public.attendances.auto_transferred IS 'Si l''attendance a été ajoutée automatiquement';

-- ============================================
-- PARTIE 7: VÉRIFICATIONS FINALES
-- ============================================

-- Vérifier les tables créées
SELECT '✅ Tables créées avec succès' as status
WHERE EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN ('events', 'professor_sessions')
);

-- Afficher la structure de professor_sessions
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'professor_sessions'
ORDER BY ordinal_position;

-- Afficher les index de professor_sessions
SELECT 
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'professor_sessions';

-- Afficher les événements créés
SELECT 
    title, 
    event_type, 
    start_date, 
    end_date, 
    exclude_from_stats
FROM public.events 
ORDER BY start_date;

-- Afficher les index des tables existantes
SELECT 
    tablename, 
    indexname 
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND tablename IN ('attendances', 'members', 'events', 'professor_sessions')
ORDER BY tablename, indexname;