// Traduction position (1/8 de hizb) -> repère sourate:verset/page.
// Fonctions pures : les données viennent de la table `reperes` chargée par le hook.

export type Riwaya = "hafs" | "warsh";
export type Sens = "fatiha_vers_nas" | "nas_vers_fatiha";

export interface Repere {
  riwaya: Riwaya;
  sens: Sens;
  huitieme: number;
  sourate: number;
  verset: number;
  page: number;
  exact: boolean;
}

export interface SurahRef {
  number: number;
  name: string;
  ayahCount: number;
}

export interface PlageLibelle {
  label: string;
  exact: boolean;
  kind: "versets" | "pages";
}

const clampHuitieme = (value: number): number => {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(480, Math.round(value)));
};

export const positionVersRepere = (
  reperes: Repere[],
  riwaya: Riwaya,
  sens: Sens,
  position: number
): Repere | null => {
  const huitieme = clampHuitieme(position);
  return (
    reperes.find(
      (repere) =>
        repere.riwaya === riwaya &&
        repere.sens === sens &&
        repere.huitieme === huitieme
    ) ?? null
  );
};

const surahName = (surahs: SurahRef[], number: number): string =>
  surahs.find((surah) => surah.number === number)?.name ?? `Sourate ${number}`;

const surahAyahCount = (surahs: SurahRef[], number: number): number =>
  surahs.find((surah) => surah.number === number)?.ayahCount ?? 0;

/**
 * Libellé d'une plage [de, a[.
 * La fin affichée est le verset qui PRÉCÈDE le repère de `a` (jamais le repère `a` lui-même).
 * Si début et fin retombent sur le même repère (approximation Hafs), on affiche des pages.
 */
export const plageVersLibelle = (
  reperes: Repere[],
  riwaya: Riwaya,
  sens: Sens,
  de: number,
  a: number,
  surahs: SurahRef[]
): PlageLibelle | null => {
  const start = positionVersRepere(reperes, riwaya, sens, de);
  const endRepere = positionVersRepere(reperes, riwaya, sens, a);
  if (!start || !endRepere) return null;

  const exact = start.exact && endRepere.exact;

  const sameRepere =
    start.sourate === endRepere.sourate &&
    start.verset === endRepere.verset &&
    start.page === endRepere.page;

  if (sameRepere) {
    const from = Math.min(start.page, endRepere.page);
    const to = Math.max(start.page, endRepere.page);
    return {
      label: from === to ? `Page ${from}` : `Pages ${from} → ${to}`,
      exact,
      kind: "pages",
    };
  }

  let endSurah = endRepere.sourate;
  let endAyah = endRepere.verset - 1;
  if (endAyah < 1) {
    const previousSurah = endSurah - 1;
    const previousCount = surahAyahCount(surahs, previousSurah);
    if (!previousCount) return null;
    endSurah = previousSurah;
    endAyah = previousCount;
  }

  const startName = surahName(surahs, start.sourate);
  const endName = surahName(surahs, endSurah);
  const label =
    start.sourate === endSurah
      ? `${startName} ${start.verset} → ${endAyah}`
      : `${startName} ${start.verset} → ${endName} ${endAyah}`;

  return { label, exact, kind: "versets" };
};

/** Libellé court en huitièmes, ex. « Hizb 12, 3/8 → 5/8 ». */
export const plageHizbLibelle = (de: number, a: number): string => {
  const start = hizbLabel(de);
  const end = hizbLabel(a);

  if (!start) {
    if (!end) return "Fin";
    return `Début → Hizb ${end.hizb}, ${end.rest}/8`;
  }
  if (!end) {
    return `Hizb ${start.hizb}, ${start.rest}/8 → Fin`;
  }

  if (start.hizb === end.hizb) {
    if (start.rest === 0) return `Hizb ${start.hizb} → ${end.rest}/8`;
    return `Hizb ${start.hizb}, ${start.rest}/8 → ${end.rest}/8`;
  }

  return `Hizb ${start.hizb}, ${start.rest}/8 → Hizb ${end.hizb}, ${end.rest}/8`;
};

const hizbLabel = (
  position: number
): { hizb: number; rest: number } | null => {
  const p = clampHuitieme(position);
  if (p >= 480) return null;
  return { hizb: Math.floor(p / 8) + 1, rest: p % 8 };
};
