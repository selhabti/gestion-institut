import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { QuranAyah, QuranRub, QuranSurah } from "./types";

export const QURAN_TOTAL_PAGES = 604;

const AYAH_SELECT =
  "surah,ayah,text,page,juz,hizb,rub,sajda,sajda_type";

const SURAH_SELECT =
  "number,name_ar,name_translit,name_en,revelation,ayah_count,start_page,end_page,page_count,juz_start,juz_end,hizb_start,hizb_end,rub_start,rub_end,first_verse_preview";

const RUB_SELECT =
  "number,hizb,juz,quarter_index,label,fraction,start_surah,start_ayah,end_surah,end_ayah,start_page,end_page,page_count,ayah_count,start_preview,end_preview";

async function fetchPage(page: number): Promise<QuranAyah[]> {
  const { data, error } = await supabase
    .from("quran_ayahs")
    .select(AYAH_SELECT)
    .eq("page", page)
    .order("surah")
    .order("ayah");

  if (error) throw new Error(error.message);
  return (data ?? []) as QuranAyah[];
}

async function fetchSurahs(): Promise<QuranSurah[]> {
  const { data, error } = await supabase
    .from("quran_surahs")
    .select(SURAH_SELECT)
    .order("number");

  if (error) throw new Error(error.message);
  return (data ?? []) as QuranSurah[];
}

async function fetchRubs(): Promise<QuranRub[]> {
  const { data, error } = await supabase
    .from("quran_rubs")
    .select(RUB_SELECT)
    .order("number");

  if (error) throw new Error(error.message);
  return (data ?? []) as QuranRub[];
}

async function fetchAyahPage(
  surah: number,
  ayah: number
): Promise<number | null> {
  const { data, error } = await supabase
    .from("quran_ayahs")
    .select("page")
    .eq("surah", surah)
    .eq("ayah", ayah)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data?.page ?? null;
}

export function useQuranPage(page: number) {
  return useQuery({
    queryKey: ["quran", "page", page],
    queryFn: () => fetchPage(page),
    staleTime: 5 * 60_000,
  });
}

export function useQuranSurahs() {
  return useQuery({
    queryKey: ["quran", "surahs"],
    queryFn: fetchSurahs,
    staleTime: Infinity,
  });
}

export function useQuranRubs() {
  return useQuery({
    queryKey: ["quran", "rubs"],
    queryFn: fetchRubs,
    staleTime: Infinity,
  });
}

export function useQuranAyahPage(
  surah: number | null,
  ayah: number | null
) {
  return useQuery({
    queryKey: ["quran", "ayah-page", surah, ayah],
    queryFn: () => fetchAyahPage(surah as number, ayah as number),
    enabled: surah !== null && ayah !== null,
    staleTime: Infinity,
  });
}
