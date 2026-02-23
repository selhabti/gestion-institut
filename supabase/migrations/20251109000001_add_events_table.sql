-- ============================================
-- MIGRATION INCRÉMENTALE : AJOUT DE LA TABLE EVENTS
-- Ne modifie pas le schéma existant
-- Date: 2025-11-09
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
    -- Index pour les dates
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE schemaname = 'public' 
        AND tablename = 'events' 
        AND indexname = 'idx_events_dates'
    ) THEN
        CREATE INDEX idx_events_dates ON public.events (start_date, end_date);
    END IF;

    -- Index pour le type
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE schemaname = 'public' 
        AND tablename = 'events' 
        AND indexname = 'idx_events_type'
    ) THEN
        CREATE INDEX idx_events_type ON public.events (event_type);
    END IF;

    -- Index pour les groupes (GIN pour les arrays)
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE schemaname = 'public' 
        AND tablename = 'events' 
        AND indexname = 'idx_events_groups'
    ) THEN
        CREATE INDEX idx_events_groups ON public.events USING GIN(groups);
    END IF;

    -- Index pour l'exclusion des stats
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

-- 4. Activer RLS
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- 5. Politiques RLS (compatibles avec ton style existant)
DO $$ 
BEGIN 
    -- Politique SELECT pour tout le monde (comme tes autres tables)
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'events' 
        AND policyname = 'Enable read for all'
    ) THEN
        CREATE POLICY "Enable read for all" ON public.events
            FOR SELECT USING (true);
    END IF;

    -- Politique INSERT pour utilisateurs authentifiés
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'events' 
        AND policyname = 'Enable insert for authenticated users'
    ) THEN
        CREATE POLICY "Enable insert for authenticated users" ON public.events
            FOR INSERT WITH CHECK (auth.role() = 'authenticated');
    END IF;

    -- Politique UPDATE pour créateur ou admin
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

    -- Politique DELETE pour admin seulement
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

-- 6. Trigger pour updated_at (si pas existant)
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

-- 7. Activer realtime pour la table events
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
-- DONNÉES INITIALES : Vacances d'hiver
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

-- Insérer quelques événements par défaut
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
-- VÉRIFICATION
-- ============================================

-- Vérifier que la table a été créée
SELECT '✅ Table events créée avec succès' as status
WHERE EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'events'
);

-- Afficher les événements créés
SELECT 
    title, 
    event_type, 
    start_date, 
    end_date, 
    exclude_from_stats
FROM public.events 
ORDER BY start_date;

-- ============================================
-- AJOUT DES INDEX 
-- ============================================

-- Index sur attendances pour optimiser les requêtes par date et type de session
CREATE INDEX IF NOT EXISTS idx_attendances_date_group 
  ON public.attendances USING btree (date, session_type);

-- Index sur attendances pour filtrer par nom de groupe
CREATE INDEX IF NOT EXISTS idx_attendances_group 
  ON public.attendances USING btree (group_name);

-- Index sur attendances pour les requêtes inversées (session_type puis date)
CREATE INDEX IF NOT EXISTS idx_attendances_group_date 
  ON public.attendances USING btree (session_type, date);

-- Index GIN sur members pour les recherches dans les groupes secondaires
CREATE INDEX IF NOT EXISTS idx_members_secondary_groups 
  ON public.members USING GIN (secondary_groups);

-- Vérification
SELECT 
    tablename, 
    indexname 
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND tablename IN ('attendances', 'members')
ORDER BY tablename, indexname;


-- Ajouter ces colonnes à TABLES ATTENDANCES
ALTER TABLE public.attendances 
ADD COLUMN IF NOT EXISTS transfer_note TEXT,
ADD COLUMN IF NOT EXISTS sync_note TEXT,
ADD COLUMN IF NOT EXISTS auto_transferred BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN public.attendances.transfer_note IS 'Note pour les transferts manuels';
COMMENT ON COLUMN public.attendances.sync_note IS 'Note pour les synchronisations automatiques';
COMMENT ON COLUMN public.attendances.auto_transferred IS 'Si l\'attendance a été ajoutée automatiquement';