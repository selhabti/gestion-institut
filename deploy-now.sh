#!/bin/bash

# deploy-now.sh - Déploiement en un clic
# Usage: ./deploy-now.sh

set -e

echo "🚀 Déploiement automatique en cours..."

# Analyse rapide
if git diff --quiet HEAD && git diff --cached --quiet; then
    echo "✅ Aucun changement à déployer"
    exit 0
fi

# Détection basique
if git diff --name-only | grep -q -E "\.(tsx|ts|jsx|js)$"; then
    if git diff --name-only | grep -q -E "components/.*\.(tsx|ts)$"; then
        msg="🎨 Amélioration interface composants"
    else
        msg="🔧 Optimisation logique métier"
    fi
elif git diff --name-only | grep -q -E "\.(css|scss)$"; then
    msg="💄 Ajustements styles et responsive"
else
    msg="📦 Mise à jour divers éléments"
fi

# Version
version=$(node -p "require('./package.json').version")
new_version=$(node -p "
    const v = require('./package.json').version.split('.');
    v[2] = parseInt(v[2]) + 1;
    v.join('.')
")

# Déploiement
node -e "
    const fs = require('fs');
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    pkg.version = '$new_version';
    fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
"

git add .
git commit -m "$msg [v$new_version]"
git tag "v$new_version"
git push origin main
git push --tags

echo "✅ Déployé: v$new_version - $msg"