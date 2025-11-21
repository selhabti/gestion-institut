#!/bin/bash

# scripts/build.sh
# Script de build pour la production

set -e

echo "🏗️  Démarrage du build de production..."

# Nettoyage du dossier dist
echo "🧹 Nettoyage du dossier de build..."
rm -rf dist/

# Vérification des variables d'environnement
echo "🔍 Vérification des variables d'environnement..."
if [ -z "$VITE_SUPABASE_URL" ] || [ -z "$VITE_SUPABASE_ANON_KEY" ]; then
    echo "❌ Variables d'environnement manquantes"
    echo "   VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY sont requis"
    exit 1
fi

# Build de l'application
echo "📦 Construction de l'application..."
bun run build

# Vérification du build
if [ ! -d "dist" ]; then
    echo "❌ Le build a échoué - le dossier dist n'existe pas"
    exit 1
fi

# Vérification des fichiers essentiels
ESSENTIAL_FILES=("dist/index.html" "dist/assets/")
for file in "${ESSENTIAL_FILES[@]}"; do
    if [ ! -e "$file" ]; then
        echo "❌ Fichier manquant après le build: $file"
        exit 1
    fi
done

echo "✅ Build terminé avec succès!"
echo "📁 Dossier dist créé avec les fichiers de production"