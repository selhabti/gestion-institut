export interface QuranAyah {
  surah: number;
  ayah: number;
  text: string;
  page: number;
  juz: number;
  hizb: number;
  rub: number;
  sajda: boolean;
  sajda_type: string | null;
}

export interface QuranSurah {
  number: number;
  name_ar: string;
  name_translit: string;
  name_en: string;
  revelation: string;
  ayah_count: number;
  start_page: number;
  end_page: number;
  page_count: number;
  juz_start: number;
  juz_end: number;
  hizb_start: number;
  hizb_end: number;
  rub_start: number;
  rub_end: number;
  first_verse_preview: string;
}

export interface QuranRub {
  number: number;
  hizb: number;
  juz: number;
  quarter_index: number;
  label: string;
  fraction: number;
  start_surah: number;
  start_ayah: number;
  end_surah: number;
  end_ayah: number;
  start_page: number;
  end_page: number;
  page_count: number;
  ayah_count: number;
  start_preview: string;
  end_preview: string;
}

export interface QuranPlan {
  start_hizb: number;
  start_eighths: number;
  weekly_eighths: number;
}
