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
export const QUANTITY_OPTIONS = [
  "1/8 page",
  "1/4 page",
  "1/2 page",
  "5/8 page",
  "3/4 page",
  "7/8 page",
  "1 page",
  "2 pages",
  "3 pages",
  "4 pages",
  "5 pages",
  "6 pages",
  "7 pages",
  "8 pages",
  "9 pages",
  "10 pages",
  "1 Hizb",
];
