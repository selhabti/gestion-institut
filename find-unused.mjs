import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Fichiers à toujours garder (essentiels)
const ESSENTIAL_FILES = [
  'App.tsx',
  'main.tsx',
  'vite-env.d.ts',
  'DashboardPage.tsx',
  'MembersTable.tsx',
  'MemberForm.tsx',
  'SessionManager.tsx'
];

// Extensions à analyser
const EXTENSIONS = ['.tsx', '.ts'];

function findUnusedFiles(dir = 'src') {
  const allFiles = [];
  const importedFiles = new Set();
  
  // Étape 1: Lister tous les fichiers
  function collectFiles(directory) {
    const items = fs.readdirSync(directory);
    
    items.forEach(item => {
      const fullPath = path.join(directory, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        collectFiles(fullPath);
      } else if (EXTENSIONS.some(ext => item.endsWith(ext))) {
        allFiles.push(fullPath);
      }
    });
  }
  
  // Étape 2: Trouver tous les imports
  function findImports(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const importRegex = /from\s+['"](\.\/[^'"]+)['"]/g;
      let match;
      
      while ((match = importRegex.exec(content)) !== null) {
        const importPath = match[1];
        const resolvedPath = resolveImportPath(filePath, importPath);
        if (resolvedPath) {
          importedFiles.add(resolvedPath);
        }
      }
    } catch (error) {
      console.log(`⚠️  Erreur lecture ${filePath}:`, error.message);
    }
  }
  
  function resolveImportPath(baseFile, importPath) {
    const dir = path.dirname(baseFile);
    const fullImportPath = path.resolve(dir, importPath);
    
    // Essaye différentes extensions
    for (const ext of EXTENSIONS) {
      const withExt = fullImportPath + ext;
      if (fs.existsSync(withExt)) return withExt;
    }
    
    // Essaye sans extension
    if (fs.existsSync(fullImportPath)) return fullImportPath;
    
    // Essaye avec index
    const withIndex = path.join(fullImportPath, 'index.tsx');
    if (fs.existsSync(withIndex)) return withIndex;
    
    return null;
  }
  
  // Exécution
  collectFiles(dir);
  
  // Analyser les imports de chaque fichier
  allFiles.forEach(file => findImports(file));
  
  // Fichiers non importés
  const unusedFiles = allFiles.filter(file => {
    const fileName = path.basename(file);
    
    // Garder les fichiers essentiels
    if (ESSENTIAL_FILES.some(essential => fileName.includes(essential))) {
      return false;
    }
    
    // Garder les fichiers dans certains dossiers critiques
    if (file.includes('/pages/') || file.includes('/components/ui/')) {
      return false;
    }
    
    return !importedFiles.has(file);
  });
  
  return {
    allFiles: allFiles.length,
    importedFiles: importedFiles.size,
    unusedFiles
  };
}

// Exécution
console.log('🔍 Analyse des fichiers inutilisés...\n');
const result = findUnusedFiles();

console.log(`📊 Statistiques:`);
console.log(`   Total fichiers: ${result.allFiles}`);
console.log(`   Fichiers importés: ${result.importedFiles}`);
console.log(`   Fichiers potentiellement inutilisés: ${result.unusedFiles.length}\n`);

if (result.unusedFiles.length > 0) {
  console.log('🗑️  FICHIERS POTENTIELLEMENT INUTILISÉS:');
  result.unusedFiles.forEach(file => {
    console.log(`   ❌ ${file}`);
  });
  
  console.log('\n💡 Conseil: Vérifiez manuellement ces fichiers avant suppression!');
} else {
  console.log('✅ Aucun fichier inutilisé détecté!');
}
