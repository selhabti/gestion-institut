// Path: src/utils/cache.ts
interface CacheItem<T> {
    data: T;
    timestamp: number;
    version: string;
  }
  
  class LocalCache {
    private static readonly CACHE_VERSION = '1.0.0';
    private static readonly CACHE_PREFIX = 'institut_cache_';
    
    // Durées de cache en millisecondes
    static readonly TTL = {
      SHORT: 5 * 60 * 1000, // 5 minutes
      MEDIUM: 30 * 60 * 1000, // 30 minutes
      LONG: 2 * 60 * 60 * 1000, // 2 heures
      DAY: 24 * 60 * 60 * 1000, // 24 heures
    };
  
    static set<T>(key: string, data: T, ttl: number = this.TTL.MEDIUM): void {
      try {
        const cacheKey = `${this.CACHE_PREFIX}${key}`;
        const item: CacheItem<T> = {
          data,
          timestamp: Date.now(),
          version: this.CACHE_VERSION,
        };
        
        localStorage.setItem(cacheKey, JSON.stringify(item));
        
        // Stocker aussi la date d'expiration
        const expiryKey = `${cacheKey}_expiry`;
        localStorage.setItem(expiryKey, (Date.now() + ttl).toString());
        
        console.log(`💾 Cache mis à jour: ${key}`);
      } catch (error) {
        console.warn('⚠️ Échec du cache localStorage:', error);
        this.clearIfFull();
      }
    }
  
    static get<T>(key: string): T | null {
      try {
        const cacheKey = `${this.CACHE_PREFIX}${key}`;
        const itemStr = localStorage.getItem(cacheKey);
        
        if (!itemStr) return null;
        
        const item: CacheItem<T> = JSON.parse(itemStr);
        
        // Vérifier la version
        if (item.version !== this.CACHE_VERSION) {
          this.remove(key);
          return null;
        }
        
        // Vérifier l'expiration
        const expiryKey = `${cacheKey}_expiry`;
        const expiryStr = localStorage.getItem(expiryKey);
        
        if (expiryStr) {
          const expiryTime = parseInt(expiryStr, 10);
          if (Date.now() > expiryTime) {
            this.remove(key);
            return null;
          }
        }
        
        console.log(`📦 Cache utilisé: ${key}`);
        return item.data;
      } catch (error) {
        console.warn('⚠️ Erreur de lecture du cache:', error);
        return null;
      }
    }
  
    static remove(key: string): void {
      const cacheKey = `${this.CACHE_PREFIX}${key}`;
      localStorage.removeItem(cacheKey);
      localStorage.removeItem(`${cacheKey}_expiry`);
    }
  
    static clear(): void {
      Object.keys(localStorage)
        .filter(key => key.startsWith(this.CACHE_PREFIX))
        .forEach(key => localStorage.removeItem(key));
      
      console.log('🧹 Cache nettoyé');
    }
  
    private static clearIfFull(): void {
      try {
        localStorage.setItem('test', 'test');
        localStorage.removeItem('test');
      } catch {
        // localStorage plein, nettoyer les anciennes entrées
        const now = Date.now();
        Object.keys(localStorage)
          .filter(key => key.startsWith(this.CACHE_PREFIX))
          .forEach(key => {
            try {
              const itemStr = localStorage.getItem(key);
              if (itemStr) {
                const item = JSON.parse(itemStr);
                if (now - item.timestamp > this.TTL.DAY) {
                  localStorage.removeItem(key);
                  localStorage.removeItem(`${key}_expiry`);
                }
              }
            } catch {
              localStorage.removeItem(key);
            }
          });
      }
    }
  
    // Statistiques du cache
    static getStats(): { size: number; items: number } {
      const cacheItems = Object.keys(localStorage)
        .filter(key => key.startsWith(this.CACHE_PREFIX) && !key.endsWith('_expiry'));
      
      const totalSize = cacheItems.reduce((size, key) => {
        return size + (localStorage.getItem(key)?.length || 0);
      }, 0);
      
      return {
        size: totalSize,
        items: cacheItems.length,
      };
    }
  }
  
  export default LocalCache;