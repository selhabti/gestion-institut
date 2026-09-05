export type InstitutId = "zayed" | "attanzil";

export interface InstitutConfig {
  id: InstitutId;
  name: string;
  url: string;
  anonKey: string;
  logoUrl?: string;
}

export const STORAGE_KEY = "selected-institut";
export const INSTITUT_ID_CHANGED_EVENT = "institut-id-changed";

// Les configs sont injectées via .env
// Format attendu :
//   VITE_INSTITUT_ZAYED_URL, VITE_INSTITUT_ZAYED_ANON_KEY
//   VITE_INSTITUT_ATTANZIL_URL, VITE_INSTITUT_ATTANZIL_ANON_KEY
const env = (import.meta as any).env;

export const INSTITUTS: Record<InstitutId, InstitutConfig> = {
  zayed: {
    id: "zayed",
    name: "Zayed Ibn Thabyte",
    url: env.VITE_INSTITUT_ZAYED_URL || "",
    anonKey: env.VITE_INSTITUT_ZAYED_ANON_KEY || "",
    logoUrl: "/coran.png",
  },
  attanzil: {
    id: "attanzil",
    name: "Institut Attanzil",
    url: env.VITE_INSTITUT_ATTANZIL_URL || "",
    anonKey: env.VITE_INSTITUT_ATTANZIL_ANON_KEY || "",
    logoUrl: "/coran.png",
  },
};

// Seuls les instituts dont URL + clé sont remplis dans .env sont activés.
// → Chaque déploiement ne monte QUE son institut => zéro interdépendance.
export const getInstitutList = (): InstitutConfig[] => {
  return (Object.keys(INSTITUTS) as InstitutId[])
    .map((id) => INSTITUTS[id])
    .filter((c) => Boolean(c.url && c.anonKey));
};

export const getCurrentInstitutId = (): InstitutId | null => {
  if (typeof window === "undefined") return null;
  const enabled = getInstitutList();

  // Si un seul institut est configuré, on le force (pas de choix possible)
  if (enabled.length === 1) return enabled[0].id;

  const stored = window.localStorage.getItem(STORAGE_KEY) as InstitutId | null;
  return stored && enabled.some((c) => c.id === stored) ? stored : null;
};

export const setCurrentInstitut = (id: InstitutId) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, id);
  window.dispatchEvent(new Event(INSTITUT_ID_CHANGED_EVENT));
};

export const clearCurrentInstitut = () => {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
  window.localStorage.removeItem("app-supabase-auth-zayed");
  window.localStorage.removeItem("app-supabase-auth-attanzil");
};

export const getCurrentInstitut = (): InstitutConfig | null => {
  const id = getCurrentInstitutId();
  return id ? INSTITUTS[id] : null;
};
