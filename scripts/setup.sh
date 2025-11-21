#!/bin/bash

# scripts/setup.sh
# Script d'initialisation du projet pour CI/CD

set -e

echo "🚀 Configuration du projet Week Dues Tracker"

# Vérification des prérequis
if ! command -v node &> /dev/null; then
    echo "❌ Node.js n'est pas installé"
    exit 1
fi

if ! command -v bun &> /dev/null; then
    echo "❌ Bun n'est pas installé"
    exit 1
fi

# Installation des dépendances
echo "📦 Installation des dépendances..."
bun install

# Copie du fichier d'environnement
if [ ! -f ".env" ]; then
    echo "📄 Création du fichier .env depuis .env.example"
    cp .env.example .env
    echo "⚠️  N'oubliez pas de configurer les variables d'environnement dans .env"
fi

# Vérification de la configuration
echo "🔍 Vérification de la configuration..."
if [ ! -f "supabase/config.toml" ]; then
    echo "❌ Configuration Supabase manquante"
    exit 1
fi

echo "✅ Configuration terminée avec succès!"
echo "📝 Prochaines étapes:"
echo "   1. Configurez les variables dans .env"
echo "   2. Exécutez 'bun run dev' pour démarrer le développement"