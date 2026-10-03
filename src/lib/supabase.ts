import { createClient, SupabaseAuthAdapter } from "@neondatabase/neon-js";
import {
  getCurrentInstitut,
  INSTITUT_ID_CHANGED_EVENT,
} from "@/lib/institutes";

type NeonClient = ReturnType<typeof createClient>;

// Cache des clients par institut
const clientCache = new Map<string, NeonClient>();

function createClientForInstitut(
  institutId: string,
  authUrl: string,
  dataApiUrl: string
): NeonClient {
  if (!authUrl || !dataApiUrl) {
    throw new Error("Configuration Neon incomplète pour cet institut");
  }
  return createClient({
    auth: {
      adapter: SupabaseAuthAdapter(),
      url: authUrl,
    },
    dataApi: {
      url: dataApiUrl,
    },
  });
}

let currentClient: NeonClient | null = null;

function resolveClient(): NeonClient {
  if (typeof window === "undefined") {
    const fallbackAuth = import.meta.env.VITE_INSTITUT_ZAYED_AUTH_URL;
    const fallbackData = import.meta.env.VITE_INSTITUT_ZAYED_DATA_API_URL;
    if (fallbackAuth && fallbackData) {
      return createClientForInstitut("zayed", fallbackAuth, fallbackData);
    }
    throw new Error("Client Neon ne peut être initialisé côté serveur");
  }

  const institut = getCurrentInstitut();
  const authUrl = institut?.authUrl;
  const dataApiUrl = institut?.dataApiUrl;

  if (!institut || !authUrl || !dataApiUrl) {
    const legacyAuth = import.meta.env.VITE_INSTITUT_ZAYED_AUTH_URL;
    const legacyData = import.meta.env.VITE_INSTITUT_ZAYED_DATA_API_URL;
    if (legacyAuth && legacyData && !currentClient) {
      currentClient = createClientForInstitut("zayed", legacyAuth, legacyData);
      return currentClient;
    }
    throw new Error(
      "❌ Aucun institut sélectionné. Revenez à la page de sélection."
    );
  }

  const cacheKey = institut.id;
  if (!clientCache.has(cacheKey)) {
    clientCache.set(
      cacheKey,
      createClientForInstitut(institut.id, authUrl, dataApiUrl)
    );
  }
  currentClient = clientCache.get(cacheKey)!;
  return currentClient;
}

// Proxy qui délègue les appels (from, auth, etc.) au bon client selon l'institut sélectionné
export const supabase = new Proxy({} as NeonClient, {
  get(_target, prop, receiver) {
    const client = resolveClient();
    const value = Reflect.get(client as object, prop, client);
    if (typeof value === "function") {
      return value.bind(client);
    }
    return value;
  },
}) as NeonClient;

// Reconstruit le client courant quand on change d'institut
if (typeof window !== "undefined") {
  window.addEventListener(INSTITUT_ID_CHANGED_EVENT, () => {
    // On force la résolution au prochain accès (le cache par institut reste)
    resolveClient();
  });
}

export type TypedSupabaseClient = NeonClient;

export const checkSupabaseConnection = async () => {
  try {
    const { error } = await supabase
      .from("members")
      .select("id")
      .limit(1)
      .maybeSingle();

    if (error && error.code !== "PGRST116") {
      console.error("❌ Erreur de connexion Neon:", error);
      return false;
    }

    console.log("✅ Connexion Neon établie");
    return true;
  } catch (err) {
    console.error("❌ Exception de connexion Neon:", err);
    return false;
  }
};
