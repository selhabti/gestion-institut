import { createClient, SupabaseClient } from "@supabase/supabase-js";
import {
  getCurrentInstitut,
  INSTITUT_ID_CHANGED_EVENT,
} from "@/lib/institutes";

// Cache des clients par institut
const clientCache = new Map<string, SupabaseClient>();

function createClientForInstitut(institutId: string, url: string, anonKey: string): SupabaseClient {
  if (!url || !anonKey) {
    throw new Error("Configuration Supabase incomplète pour cet institut");
  }
  return createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: `app-supabase-auth-${institutId}`,
      storage: typeof window !== "undefined" ? window.localStorage : undefined,
    },
    global: {
      headers: {
        "X-Client-Info": "student-management-app@1.0.0",
      },
    },
    db: {
      schema: "public",
    },
  });
}

let currentClient: SupabaseClient | null = null;

function resolveClient(): SupabaseClient {
  if (typeof window === "undefined") {
    const fallback = import.meta.env.VITE_SUPABASE_URL
      ? createClientForInstitut(
          "zayed",
          import.meta.env.VITE_SUPABASE_URL,
          import.meta.env.VITE_SUPABASE_ANON_KEY
        )
      : null;
    if (fallback) return fallback;
    throw new Error("Supabase client ne peut être initialisé côté serveur");
  }

  const institut = getCurrentInstitut();
  const url = institut?.url;
  const anonKey = institut?.anonKey;

  if (!institut || !url || !anonKey) {
    const legacyUrl = import.meta.env.VITE_SUPABASE_URL;
    const legacyKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    if (legacyUrl && legacyKey && !currentClient) {
      currentClient = createClientForInstitut("zayed", legacyUrl, legacyKey);
      return currentClient;
    }
    throw new Error(
      "❌ Aucun institut sélectionné. Revenez à la page de sélection."
    );
  }

  const cacheKey = institut.id;
  if (!clientCache.has(cacheKey)) {
    clientCache.set(cacheKey, createClientForInstitut(institut.id, url, anonKey));
  }
  currentClient = clientCache.get(cacheKey)!;
  return currentClient;
}

// Proxy qui délègue les appels (from, auth, etc.) au bon client selon l'institut sélectionné
export const supabase = new Proxy(
  {},
  {
    get(_target, prop, receiver) {
      const client = resolveClient();
      const value = Reflect.get(client, prop, client);
      if (typeof value === "function") {
        return value.bind(client);
      }
      return value;
    },
  }
) as SupabaseClient;

// Reconstruit le client courant quand on change d'institut
if (typeof window !== "undefined") {
  window.addEventListener(INSTITUT_ID_CHANGED_EVENT, () => {
    // On force la résolution au prochain accès (le cache par institut reste)
    resolveClient();
  });
}

export type TypedSupabaseClient = SupabaseClient;

export const checkSupabaseConnection = async () => {
  try {
    const { error } = await supabase
      .from("members")
      .select("id")
      .limit(1)
      .maybeSingle();

    if (error && error.code !== "PGRST116") {
      console.error("❌ Erreur de connexion Supabase:", error);
      return false;
    }

    console.log("✅ Connexion Supabase établie");
    return true;
  } catch (err) {
    console.error("❌ Exception de connexion Supabase:", err);
    return false;
  }
};
