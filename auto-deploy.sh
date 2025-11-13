#!/bin/bash

# auto-deploy.sh - Déploiement intelligent avec meilleure détection
# Usage: ./auto-deploy.sh

set -e

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# Configuration
VERSION_FILE="package.json"

# Fonctions d'affichage
log() { echo -e "${BLUE}ℹ️  $1${NC}"; }
success() { echo -e "${GREEN}✅ $1${NC}"; }
warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
error() { echo -e "${RED}❌ $1${NC}"; }
info() { echo -e "${CYAN}💡 $1${NC}"; }

# Vérifications
check_requirements() {
    log "Vérification des prérequis..."
    
    if ! command -v git &> /dev/null; then
        error "Git n'est pas installé"
        exit 1
    fi
    
    if [ ! -f "$VERSION_FILE" ]; then
        error "Fichier $VERSION_FILE non trouvé"
        exit 1
    fi
    
    if ! git status &> /dev/null; then
        error "Pas dans un repository Git"
        exit 1
    fi
}

# Détection de tous les changements
get_all_changes() {
    log "Scan des modifications..."
    
    # Essayer d'abord les fichiers staged
    local staged_files=$(git diff --cached --name-only 2>/dev/null)
    
    # Si pas de staged, prendre tous les fichiers modifiés
    if [ -z "$staged_files" ]; then
        staged_files=$(git status --porcelain | grep -E "^[AMDRC]" | awk '{print $2}')
    fi
    
    # Si toujours vide, prendre tous les fichiers non suivis + modifiés
    if [ -z "$staged_files" ]; then
        staged_files=$(git status --porcelain | awk '{print $2}')
    fi
    
    echo "$staged_files"
}

# Analyse simplifiée et robuste
analyze_changes() {
    log "Analyse des changements en cours..."
    
    # Obtenir tous les changements
    all_files=$(get_all_changes)
    
    if [ -z "$all_files" ]; then
        warning "Aucun changement détecté dans le repository"
        info "Vérifiez avec: git status"
        exit 0
    fi
    
    # Filtrer les fichiers non significatifs
    significant_files=$(echo "$all_files" | grep -v -E "(package-lock\.json|\.lock$|\.log$|dist/|node_modules/|\.env)")
    
    if [ -z "$significant_files" ]; then
        info "Changements détectés mais non significatifs:"
        echo "$all_files" | while read file; do
            echo "  ⚪ $file"
        done
        warning "Seulement des fichiers de lock/metadata détectés"
        read -p "📦 Voulez-vous quand même commit? (y/N): " commit_anyway
        if [[ $commit_anyway =~ ^[Yy]$ ]]; then
            export CHANGE_TYPE="patch"
            export COMMIT_MESSAGE="📦 CHORE: Mise à jour métadonnées et dépendances"
            export SIGNIFICANT_FILES="$all_files"
        else
            exit 0
        fi
    else
        # Analyse des types de fichiers significatifs
        local change_type="patch"
        local description="Optimisations diverses"
        
        # Détection basique
        if echo "$significant_files" | grep -q -E "\.(tsx|ts|jsx|js)$"; then
            ts_count=$(echo "$significant_files" | grep -E "\.(tsx|ts|jsx|js)$" | wc -l)
            if [ $ts_count -gt 1 ]; then
                change_type="minor"
                description="Amélioration codebase"
            fi
            
            # Détection composants
            components=$(echo "$significant_files" | grep -c "components/")
            if [ $components -gt 0 ]; then
                change_type="minor"
                description="Amélioration interface"
            fi
        fi
        
        # Détection CSS
        if echo "$significant_files" | grep -q -E "\.(css|scss)$"; then
            change_type="patch"
            description="Ajustements styles"
        fi
        
        # Détection configuration
        if echo "$significant_files" | grep -q -E "(package\.json|vite\.config|tsconfig)"; then
            # Vérifier si ce sont des vraies dépendances
            if echo "$significant_files" | grep -q "package.json"; then
                if git diff package.json 2>/dev/null | grep -q '"dependencies"'; then
                    change_type="minor"
                    description="Mise à jour dépendances"
                else
                    description="Configuration projet"
                fi
            fi
        fi
        
        # Construction du message
        case $change_type in
            "major") commit_message="🚀 REFONTE: $description" ;;
            "minor") commit_message="✨ FEAT: $description" ;;
            "patch") commit_message="🔧 FIX: $description" ;;
        esac
        
        # Affichage
        info "Changements significatifs détectés:"
        echo "$significant_files" | while read file; do
            echo "  📄 $file"
        done
        
        if [ "$all_files" != "$significant_files" ]; then
            info "Fichiers ignorés:"
            comm -23 <(echo "$all_files" | sort) <(echo "$significant_files" | sort) | while read file; do
                echo "  ⚪ $file"
            done
        fi
        
        export CHANGE_TYPE="$change_type"
        export COMMIT_MESSAGE="$commit_message"
        export SIGNIFICANT_FILES="$significant_files"
    fi
}

# Gestion des versions
get_current_version() {
    node -p "require('./$VERSION_FILE').version" 2>/dev/null || echo "0.0.0"
}

increment_version() {
    local current_version=$1
    local type=$2
    
    IFS='.' read -ra parts <<< "$current_version"
    local major=${parts[0]}
    local minor=${parts[1]}
    local patch=${parts[2]}
    
    case $type in
        "major") echo "$((major + 1)).0.0" ;;
        "minor") echo "$major.$((minor + 1)).0" ;;
        "patch") echo "$major.$minor.$((patch + 1))" ;;
    esac
}

update_version() {
    local new_version=$1
    log "Mise à jour version: $new_version"
    
    # Méthode robuste sans Node.js si nécessaire
    if command -v node &> /dev/null; then
        node -e "
            const fs = require('fs');
            const pkg = JSON.parse(fs.readFileSync('$VERSION_FILE', 'utf8'));
            pkg.version = '$new_version';
            fs.writeFileSync('$VERSION_FILE', JSON.stringify(pkg, null, 2) + '\n');
        "
    else
        # Fallback avec sed
        current_version=$(get_current_version)
        sed -i.bak "s/\"version\": \"$current_version\"/\"version\": \"$new_version\"/" "$VERSION_FILE"
        rm -f "$VERSION_FILE.bak"
    fi
    
    success "Version $new_version définie"
}

# Processus Git
git_auto_process() {
    local change_type="$CHANGE_TYPE"
    local commit_message="$COMMIT_MESSAGE"
    local current_version=$(get_current_version)
    local new_version=$(increment_version "$current_version" "$change_type")
    
    echo
    log "📊 RÉSUMÉ DU DÉPLOIEMENT:"
    info "Version: $current_version → $new_version"
    info "Type: $change_type"
    info "Message: $commit_message"
    info "Fichiers: $(echo "$SIGNIFICANT_FILES" | wc -l) modifiés"
    
    # Affichage des différences
    read -p "🔍 Voir les modifications? (y/N): " show_diff
    if [[ $show_diff =~ ^[Yy]$ ]]; then
        git diff --color=always | head -50
        echo "..."
    fi
    
    # Confirmation
    echo
    read -p "🚀 Procéder au déploiement? (Y/n): " confirm
    if [[ $confirm =~ ^[Nn]$ ]]; then
        warning "Déploiement annulé par l'utilisateur"
        exit 0
    fi
    
    # Mise à jour version
    update_version "$new_version"
    
    # Ajout des fichiers
    log "Ajout des modifications..."
    git add .
    
    # Commit
    log "Création du commit..."
    if git commit -m "$commit_message [v$new_version]" 2>/dev/null; then
        success "Commit créé"
    else
        warning "Aucun changement à commiter (peut-être déjà commité)"
    fi
    
    # Tag
    log "Création du tag..."
    git tag -a "v$new_version" -m "Version $new_version - $commit_message"
    
    # Push
    log "Envoi vers le repository..."
    git push origin main
    git push --tags
    
    # Résumé final
    echo
    success "🎉 DÉPLOIEMENT RÉUSSI!"
    success "📦 Version: v$new_version"
    success "📝 Commit: $commit_message"
    success "🔗 Remote: main"
}

# Main
main() {
    echo -e "${PURPLE}"
    echo "╔══════════════════════════════════════╗"
    echo "║         AUTO-DEPLOY v3.0            ║"
    echo "║    Déploiement Auto-Intelligent     ║"
    echo "╚══════════════════════════════════════╝"
    echo -e "${NC}"
    
    check_requirements
    analyze_changes
    git_auto_process
}

# Gestion des erreurs
trap 'error "Script interrompu"; exit 1' INT TERM
main "$@"