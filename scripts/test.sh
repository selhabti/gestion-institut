#!/bin/bash

# scripts/test.sh
# Script d'exécution des tests

set -e

echo "🧪 Démarrage des tests..."

# Tests TypeScript
echo "📝 Vérification TypeScript..."
bun run build --type-check

# Tests ESLint
echo "🔍 Analyse du code avec ESLint..."
bun run lint

# Tests de build
echo "🏗️  Test de build de production..."
bun run build

# Vérification des erreurs de runtime
echo "🔧 Vérification des imports et dépendances..."
bun run build --mode production

echo "✅ Tous les tests passés avec succès!"