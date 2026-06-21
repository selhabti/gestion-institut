//Path: src/utils/lazyImport.ts
import { lazy, LazyExoticComponent, ComponentType } from 'react';

/**
 * Helper robuste pour les imports lazy qui gère les exports par défaut et nommés
 */
export function lazyImport<T extends ComponentType<any>>(
  importFunc: () => Promise<{ [key: string]: any }>
): LazyExoticComponent<T> {
  return lazy(async () => {
    try {
      const module = await importFunc();
      
      // 1. Essayer l'export par défaut
      if (module.default) {
        return { default: module.default as T };
      }
      
      // 2. Chercher un export nommé qui ressemble à un composant React
      const componentKeys = Object.keys(module).filter(key => {
        const value = module[key];
        return (
          typeof value === 'function' &&
          // Vérifie si c'est un composant React (nom en PascalCase ou a displayName)
          (/^[A-Z]/.test(key) || value.displayName || value.name)
        );
      });
      
      if (componentKeys.length > 0) {
        return { default: module[componentKeys[0]] as T };
      }
      
      // 3. Si rien trouvé, prendre le premier export
      const firstKey = Object.keys(module)[0];
      if (firstKey) {
        return { default: module[firstKey] as T };
      }
      
      throw new Error('Aucun composant React trouvé dans le module');
    } catch (error) {
      console.error('❌ Erreur de chargement lazy:', error);
      throw error;
    }
  });
}