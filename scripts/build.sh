#!/bin/bash

# scripts/build.sh
# Script de build pour la production

set -e

echo "🏗️  Démarrage du build de production..."

# Nettoyage du dossier dist
echo "🧹 Nettoyage du dossier de build..."
rm -rf dist/

# Vérification STRICTE des variables d'environnement
echo "🔍 Vérification des variables d'environnement..."

if [ -z "$VITE_SUPABASE_URL" ]; then
    echo "❌ ERREUR: VITE_SUPABASE_URL est requis mais vide"
    echo "   Vérifiez les secrets GitHub Actions"
    exit 1
fi

if [ -z "$VITE_SUPABASE_ANON_KEY" ]; then
    echo "❌ ERREUR: VITE_SUPABASE_ANON_KEY est requis mais vide"
    echo "   Vérifiez les secrets GitHub Actions"
    exit 1
fi

# Vérification que ce ne sont pas des valeurs mock
if [[ "$VITE_SUPABASE_URL" == *"default"* ]] || [[ "$VITE_SUPABASE_URL" == *"mock"* ]]; then
    echo "❌ ERREUR: VITE_SUPABASE_URL semble être une valeur mock"
    exit 1
fi

if [[ "$VITE_SUPABASE_ANON_KEY" == *"default"* ]] || [[ "$VITE_SUPABASE_ANON_KEY" == *"mock"* ]]; then
    echo "❌ ERREUR: VITE_SUPABASE_ANON_KEY semble être une valeur mock"
    exit 1
fi

echo "✅ Variables d'environnement validées avec succès"

# Build de l'application
echo "📦 Construction de l'application..."
bun run build

# Vérification du build
if [ ! -d "dist" ]; then
    echo "❌ Le build a échoué - le dossier dist n'existe pas"
    exit 1
fi

echo "✅ Build terminé avec succès!"
echo "📁 Dossier dist créé avec les fichiers de production"
ls -la dist/