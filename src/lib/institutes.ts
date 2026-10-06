export type InstitutId = "zayed" | "attanzil";

export interface InstitutConfig {
  id: InstitutId;
  name: string;
  /** Base URL de Neon Auth (Managed Better Auth) pour cet institut */
  authUrl: string;
  /** URL de la Neon Data API (PostgREST) pour cet institut */
  dataApiUrl: string;
  logoUrl?: string;
}

export const STORAGE_KEY = "selected-institut";
export const INSTITUT_ID_CHANGED_EVENT = "institut-id-changed";

// Les configs sont injectées via .env.
// Format attendu (Neon) :
//   VITE_INSTITUT_ZAYED_AUTH_URL, VITE_INSTITUT_ZAYED_DATA_API_URL
//   VITE_INSTITUT_ATTANZIL_AUTH_URL, VITE_INSTITUT_ATTANZIL_DATA_API_URL
const env = (import.meta as any).env;

export const INSTITUTS: Record<InstitutId, InstitutConfig> = {
  zayed: {
    id: "zayed",
    name: "Zayed Ibn Thabyte",
    authUrl: (env.VITE_INSTITUT_ZAYED_AUTH_URL || "").trim(),
    dataApiUrl: (env.VITE_INSTITUT_ZAYED_DATA_API_URL || "").trim(),
    logoUrl: (import.meta.env.BASE_URL || "/") + "coran.png",
  },
  attanzil: {
    id: "attanzil",
    name: "Institut Attanzil",
    authUrl: (env.VITE_INSTITUT_ATTANZIL_AUTH_URL || "").trim(),
    dataApiUrl: (env.VITE_INSTITUT_ATTANZIL_DATA_API_URL || "").trim(),
    // Pas encore de logo pour Attanzil → placeholder dans l'en-tête
    logoUrl: "",
  },
};

// Seuls les instituts dont Auth + Data API sont remplis dans .env sont activés.
// → Chaque déploiement ne monte QUE son institut => zéro interdépendance.
export const getInstitutList = (): InstitutConfig[] => {
  return (Object.keys(INSTITUTS) as InstitutId[])
    .map((id) => INSTITUTS[id])
    .filter((c) => Boolean(c.authUrl && c.dataApiUrl));
};

const parseInstitutFromUrl = (): InstitutId | null => {
  if (typeof window === "undefined") return null;
  const base = (import.meta.env.BASE_URL || "/").replace(/\/$/, "");
  let path = window.location.pathname;
  if (base && path.startsWith(base)) path = path.slice(base.length);
  const seg = path.split("/").filter(Boolean)[0];
  return seg === "zayed" || seg === "attanzil" ? (seg as InstitutId) : null;
};

export const getCurrentInstitutId = (): InstitutId | null => {
  if (typeof window === "undefined") return null;
  const enabled = getInstitutList();

  // Priorité à l'institut présent dans l'URL (/attanzil/dashboard)
  const fromUrl = parseInstitutFromUrl();
  if (fromUrl && enabled.some((c) => c.id === fromUrl)) return fromUrl;

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
  window.localStorage.removeItem("neon-auth-zayed");
  window.localStorage.removeItem("neon-auth-attanzil");
};

export const getCurrentInstitut = (): InstitutConfig | null => {
  const id = getCurrentInstitutId();
  return id ? INSTITUTS[id] : null;
};
