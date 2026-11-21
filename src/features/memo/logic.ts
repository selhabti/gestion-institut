// Logique pure du suivi de mémorisation V2.
// Aucune dépendance à la base : uniquement des entrées/sorties typées.

export type Riwaya = "hafs" | "warsh";
export type Sens = "fatiha_vers_nas" | "nas_vers_fatiha";
export type NouveauStatut = "valide" | "partiel" | "refaire" | "absent";

export const POSITION_MIN = 0;
export const POSITION_MAX = 480;

export interface EleveMemo {
  riwaya: Riwaya;
  sens: Sens;
  date_debut: string; // YYYY-MM-DD (un samedi)
  /** Point de départ absolu de la mémorisation (0..480). Parcours contigus uniquement. */
  position_origine: number;
  position_depart: number;
  rythme: number;
  quota_revision: number;
}

export interface Etat {
  position: number;
  pointeur_rev: number;
  cycles_faits: number;
}

export interface SeanceBrouillon {
  samedi: string;
  nouveau_de: number;
  nouveau_a: number;
  recent_de: number;
  recent_a: number;
  ancien_de: number | null;
  ancien_a: number | null;
}

export interface SeanceEnregistree {
  samedi: string;
  nouveau_statut: NouveauStatut | null;
  nouveau_atteint: number | null;
  recent_ok: boolean | null;
  ancien_ok: boolean | null;
}

export type SeanceSaisie = SeanceBrouillon & SeanceEnregistree;

export type SeanceComplete = SeanceSaisie & {
  note: number | null;
  commentaire: string | null;
};

export interface AvertissementSeance {
  samedi: string;
  nouveau_de: number;
  position_attendue: number;
}

export const clampPosition = (value: number): number => {
  if (!Number.isFinite(value)) return POSITION_MIN;
  return Math.max(
    POSITION_MIN,
    Math.min(POSITION_MAX, Math.round(value))
  );
};

const clampInt = (value: number, min: number, max: number): number => {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, Math.round(value)));
};

const safePositive = (value: number, fallback: number): number =>
  Number.isFinite(value) && value > 0 ? Math.round(value) : fallback;

/**
 * Prépare les 3 blocs d'un samedi à partir de l'état courant.
 * La zone mémorisée est [position_origine, position[.
 * - NOUVEAU : [position, position + rythme[
 * - RÉCENT  : [max(origine, position - 4*rythme), position[
 * - ANCIEN  : [origine + pointeur_rev, ... + quota_revision[ dans [origine, recent_de[
 * Le pointeur est RELATIF à position_origine.
 * Seuls les parcours contigus sont gérés (pas de parties dispersées).
 */
export const preparerSeance = (
  etat: Etat,
  eleve: EleveMemo,
  samedi: string
): SeanceBrouillon => {
  const origine = clampPosition(eleve.position_origine);
  const position = Math.max(origine, clampPosition(etat.position));
  const rythme = safePositive(eleve.rythme, 2);
  const quota = safePositive(eleve.quota_revision, 8);

  const recent_de = Math.max(origine, position - 4 * rythme);
  const recent_a = position;

  const nouveau_de = position;
  const nouveau_a = Math.min(POSITION_MAX, position + rythme);

  let ancien_de: number | null = null;
  let ancien_a: number | null = null;

  const zone = recent_de - origine;
  if (zone > 0) {
    let pointer = Math.max(0, Math.round(etat.pointeur_rev));
    if (pointer >= zone) pointer = 0;

    ancien_de = origine + pointer;
    ancien_a = Math.min(recent_de, ancien_de + quota);

    if (ancien_a <= ancien_de) {
      ancien_de = origine;
      ancien_a = Math.min(recent_de, origine + quota);
    }
  }

  return {
    samedi,
    nouveau_de,
    nouveau_a,
    recent_de,
    recent_a,
    ancien_de,
    ancien_a,
  };
};

/**
 * Applique une séance saisie à l'état.
 * - valide  -> position = nouveau_a
 * - partiel -> position = nouveau_atteint (borné entre nouveau_de et nouveau_a)
 * - refaire / absent -> position inchangée
 * - ancien_ok = true -> le pointeur avance, ou revient à 0 (+1 cycle) en fin de zone
 * - recent_ok n'influence aucun calcul
 */
export const appliquerSeance = (
  etat: Etat,
  seance: SeanceBrouillon & SeanceEnregistree,
  eleve: EleveMemo
): Etat => {
  const origine = clampPosition(eleve.position_origine);
  const current = Math.max(origine, clampPosition(etat.position));
  const statut = seance.nouveau_statut;

  if (!statut) {
    return {
      position: current,
      pointeur_rev: clampPosition(etat.pointeur_rev),
      cycles_faits: Math.max(0, Math.round(etat.cycles_faits)),
    };
  }

  let position = current;
  if (statut === "valide") {
    position = clampPosition(seance.nouveau_a);
  } else if (statut === "partiel") {
    const de = clampPosition(seance.nouveau_de);
    const a = clampPosition(seance.nouveau_a);
    const atteint = seance.nouveau_atteint;

    if (atteint !== null) {
      const bounded = clampInt(atteint, Math.min(de, a), Math.max(de, a));
      if (bounded <= de) {
        position = current;
      } else {
        position = Math.max(current, bounded);
      }
    }
  }

  let pointeur = Math.max(0, Math.round(etat.pointeur_rev));
  let cycles = Math.max(0, Math.round(etat.cycles_faits));
  const recentDe = Math.max(origine, Math.round(seance.recent_de));
  const zone = recentDe - origine;

  if (
    zone > 0 &&
    seance.ancien_de !== null &&
    seance.ancien_a !== null &&
    seance.ancien_ok === true
  ) {
    const ancienA = clampPosition(seance.ancien_a);
    if (ancienA >= recentDe) {
      pointeur = 0;
      cycles += 1;
    } else {
      pointeur = Math.max(0, ancienA - origine);
    }
  }

  return {
    position,
    pointeur_rev: clampPosition(pointeur),
    cycles_faits: cycles,
  };
};

/**
 * Rejoue toutes les séances SAISIES (statut non NULL) dans l'ordre des samedis.
 * Les blocs stockés sont appliqués tels quels : c'est la seule source de vérité.
 * Les séances suivantes non saisies sont régénérées par le hook après enregistrement.
 * Si un `nouveau_de` ne correspond pas à la position du rejeu précédent, on ne bloque pas :
 * on applique quand même et on renvoie un avertissement.
 */
export const rejouerAvecAvertissements = (
  eleve: EleveMemo,
  seances: SeanceSaisie[]
): { etat: Etat; avertissements: AvertissementSeance[] } => {
  let etat: Etat = {
    position: Math.max(
      clampPosition(eleve.position_origine),
      clampPosition(eleve.position_depart)
    ),
    pointeur_rev: 0,
    cycles_faits: 0,
  };

  const avertissements: AvertissementSeance[] = [];
  const ordered = seances
    .filter((seance) => seance.nouveau_statut !== null)
    .sort((a, b) => a.samedi.localeCompare(b.samedi));

  for (const seance of ordered) {
    if (seance.nouveau_de !== etat.position) {
      avertissements.push({
        samedi: seance.samedi,
        nouveau_de: seance.nouveau_de,
        position_attendue: etat.position,
      });
    }
    etat = appliquerSeance(etat, seance, eleve);
  }

  return { etat, avertissements };
};

export const rejouer = (
  eleve: EleveMemo,
  seances: SeanceSaisie[]
): Etat => rejouerAvecAvertissements(eleve, seances).etat;

const PARIS_TIME_ZONE = "Europe/Paris";

const parisYmd = (date: Date): { y: number; m: number; d: number } => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: PARIS_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const get = (type: string) =>
    Number(parts.find((part) => part.type === type)?.value);
  return { y: get("year"), m: get("month"), d: get("day") };
};

const formatYmd = (y: number, m: number, d: number): string =>
  `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

const utcDate = (y: number, m: number, d: number): Date =>
  new Date(Date.UTC(y, m - 1, d));

/** Samedi de la semaine contenant `date` (samedi -> lui-même), en Europe/Paris. */
export const samediDe = (date: Date): string => {
  const { y, m, d } = parisYmd(date);
  const utc = utcDate(y, m, d);
  const dow = utc.getUTCDay(); // 0 = dimanche, 6 = samedi
  const daysSinceSaturday = (dow + 1) % 7; // samedi=0, dimanche=1, ... vendredi=6
  utc.setUTCDate(utc.getUTCDate() - daysSinceSaturday);
  return formatYmd(utc.getUTCFullYear(), utc.getUTCMonth() + 1, utc.getUTCDate());
};

/** Samedi suivant `date` (strictement après), en Europe/Paris. */
export const prochainSamedi = (date: Date): string => {
  const { y, m, d } = parisYmd(date);
  const utc = utcDate(y, m, d);
  const dow = utc.getUTCDay();
  const delta = (6 - dow + 7) % 7;
  utc.setUTCDate(utc.getUTCDate() + (delta === 0 ? 7 : delta));
  return formatYmd(utc.getUTCFullYear(), utc.getUTCMonth() + 1, utc.getUTCDate());
};
