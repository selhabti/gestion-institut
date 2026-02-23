#!/bin/bash
# auto-deploy.sh - Version finale avec génération de message IA locale
# Usage: ./auto-deploy.sh [--dry-run]
# Compatible CI/CD : GitHub Actions

set -e

# ─────────────────────────────────────────────
# CONFIGURATION
# ─────────────────────────────────────────────
TARGET_BRANCH="main"
LOG_FILE="deploy.log"
DRY_RUN=false

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# ─────────────────────────────────────────────
# FONCTIONS UTILITAIRES
# ─────────────────────────────────────────────
log() {
  local level="$1"; local msg="$2"
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] [$level] $msg" >> "$LOG_FILE"
}
info()    { echo -e "${BLUE}ℹ️  $1${NC}";    log "INFO"    "$1"; }
success() { echo -e "${GREEN}✅ $1${NC}";    log "SUCCESS" "$1"; }
warning() { echo -e "${YELLOW}⚠️  $1${NC}";  log "WARNING" "$1"; }
error()   { echo -e "${RED}❌ $1${NC}";     log "ERROR"   "$1"; exit 1; }

# ─────────────────────────────────────────────
# ARGUMENTS
# ─────────────────────────────────────────────
for arg in "$@"; do
  case $arg in
    --dry-run) DRY_RUN=true ;;
    *) echo "Usage: $0 [--dry-run]"; exit 1 ;;
  esac
done

$DRY_RUN && warning "MODE DRY-RUN activé — aucune modification ne sera effectuée"

echo ""
echo -e "${BLUE}🚀 Auto-deploy with intelligent commit message...${NC}"
echo ""

# ─────────────────────────────────────────────
# VÉRIFICATIONS PRÉALABLES
# ─────────────────────────────────────────────
git status &>/dev/null                || error "Not inside a Git repository"
git remote get-url origin &>/dev/null || error "No remote 'origin' configured"
[ -f "package.json" ] && ! command -v node &>/dev/null && error "Node.js is required but not installed"

# Branche courante
current_branch=$(git branch --show-current)
if [ "$current_branch" != "$TARGET_BRANCH" ]; then
  warning "You are on branch '$current_branch', not '$TARGET_BRANCH'"
  read -p "   Continue anyway? (y/N): " branch_confirm
  [[ ! $branch_confirm =~ ^[Yy]$ ]] && { echo "❌ Deployment cancelled"; exit 0; }
fi

# Changements présents ?
if git diff --quiet && git diff --cached --quiet; then
  success "Nothing to deploy — working tree is clean"
  exit 0
fi

# ─────────────────────────────────────────────
# ANALYSE INTELLIGENTE DU DIFF
# ─────────────────────────────────────────────
info "Analyzing changes..."

file_count=$(git status --porcelain | wc -l | tr -d ' ')
files=$(git status --porcelain | awk '{print $2}')

# --- Catégories de fichiers modifiés ---
ts_files=$(echo "$files"    | grep -cE "\.(tsx|ts)$"                    || true)
js_files=$(echo "$files"    | grep -cE "\.(jsx|js)$"                    || true)
css_files=$(echo "$files"   | grep -cE "\.(css|scss|sass)$"             || true)
test_files=$(echo "$files"  | grep -cE "\.(test|spec)\.(ts|js|tsx|jsx)$" || true)
config_files=$(echo "$files"| grep -cE "\.(json|yaml|yml|env|config\..*)$" || true)
doc_files=$(echo "$files"   | grep -cE "\.(md|mdx|txt)$"                || true)
asset_files=$(echo "$files" | grep -cE "\.(png|jpg|svg|ico|webp|woff|ttf)$" || true)

components=$(echo "$files"  | grep -c "components/"        || true)
pages=$(echo "$files"       | grep -c "pages/\|app/"       || true)
hooks=$(echo "$files"       | grep -c "hooks/"             || true)
services=$(echo "$files"    | grep -c "services/\|api/"    || true)
utils=$(echo "$files"       | grep -c "utils/\|helpers/"   || true)
actions=$(echo "$files"     | grep -c "\.github/workflows/" || true)

# --- Analyse du contenu du diff ---
diff_content=$(git diff HEAD 2>/dev/null || git diff --cached 2>/dev/null || true)

has_fix=$(echo "$diff_content"      | grep -ci "fix\|bug\|error\|issue\|crash\|broken\|patch"       || true)
has_feat=$(echo "$diff_content"     | grep -ci "add\|new\|create\|implement\|feature\|introduce"    || true)
has_refactor=$(echo "$diff_content" | grep -ci "refactor\|rename\|move\|restructure\|clean\|rewrite" || true)
has_perf=$(echo "$diff_content"     | grep -ci "performance\|optim\|speed\|cache\|lazy\|memo"       || true)
has_style=$(echo "$diff_content"    | grep -ci "style\|design\|layout\|ui\|ux\|responsive\|tailwind" || true)
has_types=$(echo "$diff_content"    | grep -ci "interface\|type\|typing\|Props\|generic"             || true)
has_breaking=$(echo "$diff_content" | grep -ci "breaking\|BREAKING\|remove\|delete\|drop"           || true)

# ─────────────────────────────────────────────
# DÉTERMINATION DU TYPE (Conventional Commits)
# ─────────────────────────────────────────────
determine_type() {
  if   [ "$actions" -gt 0 ];                                              then echo "ci"
  elif [ "$test_files" -gt 0 ] && [ "$ts_files" -eq 0 ] && [ "$js_files" -eq 0 ]; then echo "test"
  elif [ "$has_breaking" -gt 2 ];                                         then echo "feat!"
  elif [ "$doc_files" -gt 0 ] && [ "$ts_files" -eq 0 ] && [ "$css_files" -eq 0 ]; then echo "docs"
  elif [ "$has_fix" -gt "$has_feat" ] && [ "$has_fix" -gt 0 ];            then echo "fix"
  elif [ "$has_refactor" -gt "$has_feat" ] && [ "$has_refactor" -gt 0 ];  then echo "refactor"
  elif [ "$has_perf" -gt 0 ];                                             then echo "perf"
  elif [ "$css_files" -gt 0 ] && [ "$ts_files" -eq 0 ];                  then echo "style"
  elif [ "$config_files" -gt 0 ] && [ "$ts_files" -eq 0 ];               then echo "chore"
  elif [ "$asset_files" -gt 0 ] && [ "$ts_files" -eq 0 ];                then echo "chore"
  elif [ "$has_feat" -gt 0 ];                                             then echo "feat"
  else echo "chore"
  fi
}

# Détermination du scope
determine_scope() {
  if   [ "$actions" -gt 0 ];                          then echo "ci"
  elif [ "$components" -gt 0 ] && [ "$pages" -gt 0 ]; then echo "ui"
  elif [ "$components" -gt 2 ];                        then echo "components"
  elif [ "$pages" -gt 0 ];                             then echo "pages"
  elif [ "$hooks" -gt 0 ];                             then echo "hooks"
  elif [ "$services" -gt 0 ];                          then echo "api"
  elif [ "$utils" -gt 0 ];                             then echo "utils"
  elif [ "$css_files" -gt 0 ] && [ "$ts_files" -eq 0 ]; then echo "styles"
  elif [ "$config_files" -gt 0 ];                      then echo "config"
  elif [ "$doc_files" -gt 0 ];                         then echo "docs"
  else echo ""
  fi
}

# Construction du message
build_message() {
  local type="$1"
  local scope="$2"
  local scope_part=""
  [ -n "$scope" ] && scope_part="($scope)"

  local body=""
  case $type in
    "feat")
      if   [ "$components" -gt 0 ] && [ "$pages" -gt 0 ]; then body="add new components and page updates"
      elif [ "$components" -gt 0 ];  then body="add ${components} new component(s)"
      elif [ "$pages" -gt 0 ];       then body="add new page(s) and routing"
      elif [ "$hooks" -gt 0 ];       then body="add custom hook(s) for state management"
      elif [ "$services" -gt 0 ];    then body="add new API service(s)"
      else                                body="add new feature(s) across ${file_count} file(s)"
      fi ;;
    "feat!")  body="introduce breaking changes — review migration guide" ;;
    "fix")
      if   [ "$components" -gt 0 ];  then body="resolve issue(s) in component(s)"
      elif [ "$services" -gt 0 ];    then body="fix API/service layer error(s)"
      else                                body="fix bug(s) across ${file_count} file(s)"
      fi ;;
    "refactor")
      if   [ "$has_types" -gt 0 ];   then body="improve types, interfaces and code structure"
      elif [ "$utils" -gt 0 ];       then body="restructure utility functions and helpers"
      else                                body="clean up and restructure codebase"
      fi ;;
    "perf")   body="improve performance and optimize rendering" ;;
    "style")
      if [ "$has_style" -gt 0 ];     then body="update UI styles and responsive layout"
      else                                body="apply formatting and style adjustments"
      fi ;;
    "test")   body="add/update test coverage for ${file_count} file(s)" ;;
    "docs")   body="update documentation and README" ;;
    "ci")     body="update GitHub Actions workflow(s)" ;;
    "chore")
      if   [ "$config_files" -gt 0 ]; then body="update configuration and project settings"
      elif [ "$asset_files" -gt 0 ];  then body="update assets and static resources"
      else                                  body="maintain project structure and dependencies"
      fi ;;
    *)        body="update ${file_count} file(s)" ;;
  esac

  echo "${type}${scope_part}: ${body}"
}

# ─────────────────────────────────────────────
# GÉNÉRATION DU MESSAGE
# ─────────────────────────────────────────────
commit_type=$(determine_type)
commit_scope=$(determine_scope)
generated_message=$(build_message "$commit_type" "$commit_scope")

# Semver selon le type
case $commit_type in
  "feat!")  change_type="major" ;;
  "feat")   change_type="minor" ;;
  *)        change_type="patch" ;;
esac

# ─────────────────────────────────────────────
# GESTION DE VERSION
# ─────────────────────────────────────────────
current_version="N/A"
new_version="0.0.1"

if [ -f "package.json" ]; then
  current_version=$(node -p "require('./package.json').version" 2>/dev/null || echo "0.0.0")
  IFS='.' read -ra parts <<< "$current_version"
  major=${parts[0]:-0}; minor=${parts[1]:-0}; patch_v=${parts[2]:-0}

  case $change_type in
    "major") new_version="$((major + 1)).0.0" ;;
    "minor") new_version="$major.$((minor + 1)).0" ;;
    "patch") new_version="$major.$minor.$((patch_v + 1))" ;;
  esac
fi

# ─────────────────────────────────────────────
# AFFICHAGE DU MESSAGE GÉNÉRÉ
# ─────────────────────────────────────────────
echo ""
echo -e "${CYAN}┌──────────────────────────────────────────────────┐${NC}"
echo -e "${CYAN}│          🤖 GENERATED COMMIT MESSAGE              │${NC}"
echo -e "${CYAN}├──────────────────────────────────────────────────┤${NC}"
echo -e "${CYAN}│${NC}  ${GREEN}$generated_message${NC}"
echo -e "${CYAN}└──────────────────────────────────────────────────┘${NC}"
echo ""
echo -e "   ${YELLOW}Analysis breakdown:${NC}"
[ "$ts_files" -gt 0 ]     && echo "   → $ts_files TypeScript file(s)"
[ "$js_files" -gt 0 ]     && echo "   → $js_files JavaScript file(s)"
[ "$css_files" -gt 0 ]    && echo "   → $css_files Style file(s)"
[ "$test_files" -gt 0 ]   && echo "   → $test_files Test file(s)"
[ "$config_files" -gt 0 ] && echo "   → $config_files Config file(s)"
[ "$actions" -gt 0 ]      && echo "   → $actions GitHub Actions workflow(s)"
[ "$has_fix" -gt 0 ]      && echo "   → Fix signals detected ($has_fix occurrences)"
[ "$has_feat" -gt 0 ]     && echo "   → Feature signals detected ($has_feat occurrences)"
[ "$has_breaking" -gt 2 ] && echo "   → ⚠️  Breaking change signals detected!"
echo ""

# Proposition d'édition
read -p "   ✏️  Press Enter to accept, or type a custom message: " custom_message
final_message="${custom_message:-$generated_message}"

# ─────────────────────────────────────────────
# RÉSUMÉ
# ─────────────────────────────────────────────
echo ""
echo "┌──────────────────────────────────────────────────┐"
echo "│              📋 DEPLOYMENT SUMMARY                │"
echo "├──────────────────────────────────────────────────┤"
printf "│  %-14s %-33s │\n" "📁 Files:"    "$file_count modified"
printf "│  %-14s %-33s │\n" "🌿 Branch:"   "$current_branch → GitHub Actions"
printf "│  %-14s %-33s │\n" "🏷️  Version:" "$current_version → v$new_version ($change_type)"
printf "│  %-14s %-33s │\n" "📝 Commit:"   "${final_message:0:33}"
echo "└──────────────────────────────────────────────────┘"
echo ""

echo "   📄 Modified files:"
echo "$files" | head -10 | while read -r file; do
  [ -n "$file" ] && echo "      • $file"
done
[ "$file_count" -gt 10 ] && echo "      ... and $((file_count - 10)) more"

# ─────────────────────────────────────────────
# CONFIRMATION
# ─────────────────────────────────────────────
echo ""
read -p "🚀 Proceed with deployment? (Y/n): " confirm
[[ $confirm =~ ^[Nn]$ ]] && { echo "❌ Deployment cancelled"; exit 0; }

# ─────────────────────────────────────────────
# DRY-RUN
# ─────────────────────────────────────────────
if $DRY_RUN; then
  echo ""
  warning "DRY-RUN — commands that would have been executed:"
  echo "   git add ."
  [ -f "package.json" ] && echo "   → bump package.json to v$new_version"
  echo "   git commit -m \"$final_message\""
  echo "   git tag -a \"v$new_version\" -m \"v$new_version\""
  echo "   git push origin $current_branch"
  echo "   git push --tags"
  echo "   → GitHub Actions pipeline will trigger automatically"
  echo ""
  success "Dry-run complete — nothing was changed"
  exit 0
fi

# ─────────────────────────────────────────────
# DÉPLOIEMENT
# ─────────────────────────────────────────────

# Mise à jour package.json
if [ -f "package.json" ] && [ "$current_version" != "N/A" ]; then
  info "Bumping package.json to v$new_version..."
  node -e "
    const fs = require('fs');
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    pkg.version = '$new_version';
    fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
  "
fi

info "Staging all changes..."
git add .

info "Creating commit..."
git commit -m "$final_message"

# Tag avec vérification
if git rev-parse "v$new_version" &>/dev/null; then
  warning "Tag v$new_version already exists — skipping"
else
  info "Creating tag v$new_version..."
  git tag -a "v$new_version" -m "v$new_version — $final_message"
fi

info "Pushing to origin/$current_branch..."
git push origin "$current_branch"

info "Pushing tags..."
git push --tags

# ─────────────────────────────────────────────
# RÉSULTAT FINAL
# ─────────────────────────────────────────────
repo_url=$(git remote get-url origin | sed 's/\.git$//')
actions_url="${repo_url}/actions"

echo ""
echo "┌──────────────────────────────────────────────────┐"
echo "│              ✅ DEPLOYMENT SUCCESSFUL              │"
echo "└──────────────────────────────────────────────────┘"
echo ""
echo "   📦 Version  : v$new_version"
echo "   📝 Commit   : $final_message"
echo "   🔄 Pipeline : $actions_url"
echo "   📋 Log      : $LOG_FILE"
echo ""
info "GitHub Actions pipeline triggered — monitor at: $actions_url"

log "DEPLOY" "v$new_version pushed to $current_branch — $final_message"