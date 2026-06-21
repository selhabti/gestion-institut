import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Type pour les variables d'environnement
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Récupération des variables d'environnement
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validation stricte au démarrage
if (!supabaseUrl) {
  throw new Error(
    '❌ VITE_SUPABASE_URL manquante. Vérifiez votre fichier .env'
  );
}

if (!supabaseAnonKey) {
  throw new Error(
    '❌ VITE_SUPABASE_ANON_KEY manquante. Vérifiez votre fichier .env'
  );
}

// Singleton pattern avec vérification
let supabaseInstance: SupabaseClient | null = null;

/**
 * Client Supabase unique pour toute l'application
 * Utilise le pattern Singleton pour éviter les instances multiples
 */
export const supabase = (() => {
  if (supabaseInstance) {
    return supabaseInstance;
  }

  if (typeof window === 'undefined') {
    throw new Error('Supabase client ne peut être initialisé que côté client');
  }

  console.log('🔌 Initialisation du client Supabase...');

  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'app-supabase-auth', // Clé unique pour éviter les conflits
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    },
    global: {
      headers: {
        'X-Client-Info': 'student-management-app@1.0.0',
      },
    },
    db: {
      schema: 'public',
    },
  });

  return supabaseInstance;
})();

// Type exporté pour les consumers
export type TypedSupabaseClient = typeof supabase;

// Utilitaire pour vérifier la connexion (optionnel)
export const checkSupabaseConnection = async () => {
  try {
    const { error } = await supabase
      .from('members')
      .select('id')
      .limit(1)
      .maybeSingle();
    
    if (error && error.code !== 'PGRST116') {
      console.error('❌ Erreur de connexion Supabase:', error);
      return false;
    }
    
    console.log('✅ Connexion Supabase établie');
    return true;
  } catch (err) {
    console.error('❌ Exception de connexion Supabase:', err);
    return false;
  }
};