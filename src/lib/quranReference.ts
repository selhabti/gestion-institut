// Table de correspondance Juz / Hizb / Sourate (Coran, riwaya Hafs & Warsh : même découpage des juz)
export interface JuzReference {
  juz: number;
  hizb: string;
  startSurah: string;
  startAyah: string;
}

export const JUZ_REFERENCE: JuzReference[] = [
  { juz: 1, hizb: "1–2", startSurah: "Al-Fâtiha", startAyah: "1:1" },
  { juz: 2, hizb: "3–4", startSurah: "Al-Baqara", startAyah: "2:142" },
  { juz: 3, hizb: "5–6", startSurah: "Al-Baqara", startAyah: "2:253" },
  { juz: 4, hizb: "7–8", startSurah: "Âl-‘Imrân", startAyah: "3:92" },
  { juz: 5, hizb: "9–10", startSurah: "An-Nisâ", startAyah: "4:24" },
  { juz: 6, hizb: "11–12", startSurah: "An-Nisâ", startAyah: "4:148" },
  { juz: 7, hizb: "13–14", startSurah: "Al-Mâ’ida", startAyah: "5:82" },
  { juz: 8, hizb: "15–16", startSurah: "Al-An‘âm", startAyah: "6:111" },
  { juz: 9, hizb: "17–18", startSurah: "Al-A‘râf", startAyah: "7:88" },
  { juz: 10, hizb: "19–20", startSurah: "Al-Anfâl", startAyah: "8:41" },
  { juz: 11, hizb: "21–22", startSurah: "At-Tawba", startAyah: "9:93" },
  { juz: 12, hizb: "23–24", startSurah: "Hûd", startAyah: "11:6" },
  { juz: 13, hizb: "25–26", startSurah: "Yûsuf", startAyah: "12:53" },
  { juz: 14, hizb: "27–28", startSurah: "Al-Hijr", startAyah: "15:1" },
  { juz: 15, hizb: "29–30", startSurah: "Al-Isrâ", startAyah: "17:1" },
  { juz: 16, hizb: "31–32", startSurah: "Al-Kahf", startAyah: "18:75" },
  { juz: 17, hizb: "33–34", startSurah: "Al-Anbiyâ", startAyah: "21:1" },
  { juz: 18, hizb: "35–36", startSurah: "Al-Mu’minûn", startAyah: "23:1" },
  { juz: 19, hizb: "37–38", startSurah: "Al-Furqân", startAyah: "25:21" },
  { juz: 20, hizb: "39–40", startSurah: "An-Naml", startAyah: "27:56" },
  { juz: 21, hizb: "41–42", startSurah: "Al-‘Ankabût", startAyah: "29:46" },
  { juz: 22, hizb: "43–44", startSurah: "Al-Ahzâb", startAyah: "33:31" },
  { juz: 23, hizb: "45–46", startSurah: "Yâ-Sîn", startAyah: "36:28" },
  { juz: 24, hizb: "47–48", startSurah: "Az-Zumar", startAyah: "39:32" },
  { juz: 25, hizb: "49–50", startSurah: "Fussilat", startAyah: "41:47" },
  { juz: 26, hizb: "51–52", startSurah: "Al-Ahqâf", startAyah: "46:1" },
  { juz: 27, hizb: "53–54", startSurah: "Adh-Dhâriyât", startAyah: "51:31" },
  { juz: 28, hizb: "55–56", startSurah: "Al-Mujâdala", startAyah: "58:1" },
  { juz: 29, hizb: "57–58", startSurah: "Al-Mulk", startAyah: "67:1" },
  { juz: 30, hizb: "59–60", startSurah: "An-Naba’", startAyah: "78:1" },
];

// Options de quantité de mémorisation
// Fractions : uniquement pour le hizb (1/8 … 1 hizb)
export const HIZB_FRACTIONS = [
  "1/8 hizb",
  "1/4 hizb",
  "1/2 hizb",
  "5/8 hizb",
  "3/4 hizb",
  "7/8 hizb",
];

// Pages : nombres entiers
export const PAGE_OPTIONS = Array.from({ length: 10 }, (_, i) => {
  const n = i + 1;
  return `${n} page${n > 1 ? "s" : ""}`;
});

// Hizb entiers
export const HIZB_OPTIONS = Array.from({ length: 5 }, (_, i) => `${i + 1} hizb`);

export const QUANTITY_OPTIONS = [
  ...HIZB_FRACTIONS,
  ...PAGE_OPTIONS,
  ...HIZB_OPTIONS,
];

// Les 114 sourates (noms translittérés)
export const SURAHS = [
  "Al-Fâtiha", "Al-Baqara", "Âl-‘Imrân", "An-Nisâ", "Al-Mâ’ida", "Al-An‘âm",
  "Al-A‘râf", "Al-Anfâl", "At-Tawba", "Yûnus", "Hûd", "Yûsuf", "Ar-Ra‘d",
  "Ibrâhîm", "Al-Hijr", "An-Nahl", "Al-Isrâ", "Al-Kahf", "Maryam", "Tâ-Hâ",
  "Al-Anbiyâ", "Al-Hajj", "Al-Mu’minûn", "An-Nûr", "Al-Furqân", "Ash-Shu‘arâ",
  "An-Naml", "Al-Qasas", "Al-‘Ankabût", "Ar-Rûm", "Luqmân", "As-Sajda",
  "Al-Ahzâb", "Saba’", "Fâtir", "Yâ-Sîn", "As-Sâffât", "Sâd", "Az-Zumar",
  "Ghâfir", "Fussilat", "Ash-Shûrâ", "Az-Zukhruf", "Ad-Dukhân", "Al-Jâthiya",
  "Al-Ahqâf", "Muhammad", "Al-Fath", "Al-Hujurât", "Qâf", "Adh-Dhâriyât",
  "At-Tûr", "An-Najm", "Al-Qamar", "Ar-Rahmân", "Al-Wâqi‘a", "Al-Hadîd",
  "Al-Mujâdala", "Al-Hashr", "Al-Mumtahana", "As-Saff", "Al-Jumu‘a",
  "Al-Munâfiqûn", "At-Taghâbun", "At-Talâq", "At-Tahrîm", "Al-Mulk",
  "Al-Qalam", "Al-Hâqqa", "Al-Ma‘ârij", "Nûh", "Al-Jinn", "Al-Muzzammil",
  "Al-Muddaththir", "Al-Qiyâma", "Al-Insân", "Al-Mursalât", "An-Naba’",
  "An-Nâzi‘ât", "‘Abasa", "At-Takwîr", "Al-Infitâr", "Al-Mutaffifîn",
  "Al-Inshiqâq", "Al-Burûj", "At-Târiq", "Al-A‘lâ", "Al-Ghâshiya", "Al-Fajr",
  "Al-Balad", "Ash-Shams", "Al-Layl", "Ad-Duhâ", "Ash-Sharh", "At-Tîn",
  "Al-‘Alaq", "Al-Qadr", "Al-Bayyina", "Az-Zalzala", "Al-‘Âdiyât", "Al-Qâri‘a",
  "At-Takâthur", "Al-‘Asr", "Al-Humaza", "Al-Fîl", "Quraysh", "Al-Mâ‘ûn",
  "Al-Kawthar", "Al-Kâfirûn", "An-Nasr", "Al-Masad", "Al-Ikhlâs", "Al-Falaq",
  "An-Nâs",
];

// Nombre de versets par sourate (index aligné sur SURAHS : 0 = Al-Fâtiha)
export const SURAH_VERSES: number[] = [
  7, 286, 200, 176, 120, 165, 206, 75, 129, 109, 123, 111, 43, 52, 99, 128,
  111, 110, 98, 135, 112, 78, 118, 64, 77, 227, 93, 88, 69, 60, 34, 30, 73,
  54, 45, 83, 182, 88, 75, 85, 54, 53, 89, 59, 37, 35, 38, 29, 18, 45, 60,
  49, 62, 55, 78, 96, 29, 22, 24, 13, 14, 11, 11, 18, 12, 12, 30, 52, 52,
  44, 28, 28, 20, 56, 40, 31, 50, 40, 46, 42, 29, 19, 36, 25, 22, 17, 19,
  26, 30, 20, 15, 21, 11, 8, 8, 19, 5, 8, 8, 11, 11, 8, 3, 9, 5, 4, 7, 3,
  6, 3, 5, 4, 5, 6,
];

export const surahVerseCount = (surah: string): number | null => {
  const i = SURAHS.indexOf(surah);
  return i >= 0 ? SURAH_VERSES[i] : null;
};

