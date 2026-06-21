#!/bin/bash

# scripts/deploy.sh
# Script de déploiement générique

set -e

DEPLOY_ENV=${1:-staging}
echo "🚀 Démarrage du déploiement en environnement: $DEPLOY_ENV"

# Validation de l'environnement
if [[ ! "$DEPLOY_ENV" =~ ^(staging|production)$ ]]; then
    echo "❌ Environnement invalide: $DEPLOY_ENV"
    echo "   Utilisation: ./scripts/deploy.sh [staging|production]"
    exit 1
fi

# Build de l'application
echo "🏗️  Build de l'application..."
./scripts/build.sh

# Selon la plateforme de déploiement choisie
case $DEPLOY_ENV in
    "staging")
        echo "🌐 Déploiement sur l'environnement de staging..."
        # Ici vous ajouterez la logique spécifique à votre hébergeur
        ;;
    "production")
        echo "🎯 Déploiement en production..."
        # Ici vous ajouterez la logique spécifique à votre hébergeur
        ;;
esac

echo "✅ Déploiement $DEPLOY_ENV terminé avec succès!"