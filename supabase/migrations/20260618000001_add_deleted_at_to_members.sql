-- ============================================
-- MIGRATION : AJOUT DE LA COLONNE DELETED_AT
-- Soft delete pour les membres
-- Date: 2026-06-18
-- ============================================

-- Ajouter la colonne deleted_at à la table members
ALTER TABLE public.members 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

COMMENT ON COLUMN public.members.deleted_at IS 'Date d''archivage (soft delete). NULL = actif, non NULL = archivé';

-- Index pour filtrer rapidement les membres actifs/archivés
CREATE INDEX IF NOT EXISTS idx_members_deleted_at 
ON public.members (deleted_at)
WHERE deleted_at IS NULL;

-- Index pour lister les archivés
CREATE INDEX IF NOT EXISTS idx_members_deleted_at_desc 
ON public.members (deleted_at DESC)
WHERE deleted_at IS NOT NULL;
