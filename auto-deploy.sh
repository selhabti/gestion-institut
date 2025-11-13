#!/bin/bash

# auto-deploy.sh - Version simplifiée et fiable
# Usage: ./auto-deploy.sh

set -e

echo "🚀 Déploiement automatique intelligent..."

# Vérification basique
if ! git status &> /dev/null; then
    echo "❌ Pas dans un repository Git"
    exit 1
fi

# Vérifier les changements
if git diff --quiet && git diff --cached --quiet; then
    echo "✅ Aucun changement à déployer"
    exit 0
fi

# Analyser les changements de manière simple
echo "📊 Analyse des modifications..."

# Obtenir les fichiers modifiés
files=$(git status --porcelain | awk '{print $2}')
file_count=$(echo "$files" | wc -l)

# Détection simple du type
if echo "$files" | grep -q -E "\.(tsx|ts|jsx|js)$"; then
    # Compter les composants modifiés
    component_count=$(echo "$files" | grep -c "components/" || true)
    if [ $component_count -gt 2 ]; then
        change_type="minor"
        message="✨ Amélioration des composants et interface"
    else
        change_type="patch" 
        message="🔧 Optimisation du code et corrections"
    fi
elif echo "$files" | grep -q -E "\.(css|scss|tailwind)$"; then
    change_type="patch"
    message="🎨 Ajustements des styles et responsive"
else
    change_type="patch"
    message="📦 Mise à jour divers éléments"
fi

# Gestion de version
if [ -f "package.json" ]; then
    current_version=$(node -p "require('./package.json').version")
    echo "🏷️  Version actuelle: $current_version"
    
    # Incrémentation basée sur le type
    IFS='.' read -ra parts <<< "$current_version"
    major=${parts[0]}
    minor=${parts[1]}
    patch=${parts[2]}
    
    case $change_type in
        "major") new_version="$((major + 1)).0.0" ;;
        "minor") new_version="$major.$((minor + 1)).0" ;;
        "patch") new_version="$major.$minor.$((patch + 1))" ;;
    esac
    
    # Mise à jour
    node -e "
        const fs = require('fs');
        const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        pkg.version = '$new_version';
        fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
    "
else
    new_version="0.0.1"
    change_type="minor"
    message="🎉 Version initiale"
fi

# Affichage du résumé
echo ""
echo "📋 RÉSUMÉ DU DÉPLOIEMENT:"
echo "   📁 Fichiers: $file_count modifiés"
echo "   🏷️  Version: $current_version → $new_version"
echo "   🎯 Type: $change_type"
echo "   📝 Message: $message"
echo ""

# Liste des fichiers
echo "📄 Fichiers modifiés:"
echo "$files" | head -10 | while read file; do
    echo "   • $file"
done
if [ $file_count -gt 10 ]; then
    echo "   ... et $((file_count - 10)) autres"
fi

# Confirmation
echo ""
read -p "🚀 Procéder au déploiement? (Y/n): " confirm
if [[ $confirm =~ ^[Nn]$ ]]; then
    echo "❌ Déploiement annulé"
    exit 0
fi

# Processus Git
echo "📦 Préparation du commit..."
git add .

echo "💾 Création du commit..."
git commit -m "$message [v$new_version]"

echo "🏷️  Création du tag..."
git tag -a "v$new_version" -m "Version $new_version - $message"

echo "🚀 Envoi vers GitHub..."
git push origin main
git push --tags

echo ""
echo "✅ DÉPLOIEMENT RÉUSSI!"
echo "   🌐 Accédez à: https://github.com/selhabti/gestion-institut"
echo "   📦 Version: v$new_version"
echo "   📝 Commit: $message"