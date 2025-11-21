#!/bin/bash

# scripts/build.sh
# Script de build pour la production

set -e

echo "🏗️  Démarrage du build de production..."

# Nettoyage du dossier dist
echo "🧹 Nettoyage du dossier de build..."
rm -rf dist/

# Vérification avec fallback pour CI
echo "🔍 Vérification des variables d'environnement..."

if [ -z "$VITE_SUPABASE_URL" ] || [ "$VITE_SUPABASE_URL" = "https://default.supabase.co" ]; then
    echo "⚠️  VITE_SUPABASE_URL manquant - utilisation valeur CI"
    export VITE_SUPABASE_URL="https://ci-test.supabase.co"
fi

if [ -z "$VITE_SUPABASE_ANON_KEY" ] || [ "$VITE_SUPABASE_ANON_KEY" = "default-anon-key" ]; then
    echo "⚠️  VITE_SUPABASE_ANON_KEY manquant - utilisation valeur CI"
    export VITE_SUPABASE_ANON_KEY="ci-test-key"
fi

echo "✅ Variables configurées:"
echo "   URL: ${VITE_SUPABASE_URL:0:30}..."
echo "   KEY: ${VITE_SUPABASE_ANON_KEY:0:10}..."

# Build de l'application
echo "📦 Construction de l'application..."
bun run build

# Vérification du build
if [ ! -d "dist" ]; then
    echo "❌ Le build a échoué - le dossier dist n'existe pas"
    exit 1
fi

echo "✅ Build terminé avec succès!"
ls -la dist/