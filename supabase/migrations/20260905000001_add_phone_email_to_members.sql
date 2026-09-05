-- ============================================
-- MIGRATION : AJOUT DES COLONNES PHONE ET EMAIL
-- Coordonnées de contact pour les membres
-- Date: 2026-09-05
-- ============================================

-- Ajouter la colonne phone (obligatoire) à la table members
ALTER TABLE public.members
ADD COLUMN IF NOT EXISTS phone TEXT NOT NULL DEFAULT '';

-- Ajouter la colonne email (optionnel) à la table members
ALTER TABLE public.members
ADD COLUMN IF NOT EXISTS email TEXT DEFAULT NULL;

COMMENT ON COLUMN public.members.phone IS 'Numéro de téléphone du membre (obligatoire)';
COMMENT ON COLUMN public.members.email IS 'Adresse email du membre (optionnel)';