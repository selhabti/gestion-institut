import { useEffect, useMemo, useRef, useState } from "react";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  LocateFixed,
  RefreshCw,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  QURAN_TOTAL_PAGES,
  useQuranPage,
  useQuranRubs,
  useQuranSurahs,
} from "./api";
import type { QuranAyah, QuranPlan } from "./types";

const BASMALA = "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ";

const toArabicDigits = (value: number) =>
  String(value).replace(/\d/g, (digit) => "٠١٢٣٤٥٦٧٨٩"[Number(digit)]);

function positionOf(cumulative: number) {
  const safe = Math.max(0, cumulative);
  return { hizb: Math.floor(safe / 8), eighth: safe % 8 };
}

function rubForEighths(cumulative: number) {
  const { hizb, eighth } = positionOf(cumulative);
  const safeHizb = Math.min(60, Math.max(1, hizb));
  const rubInHizb = Math.floor(eighth / 2) + 1;
  return Math.min(240, Math.max(1, (safeHizb - 1) * 4 + rubInHizb));
}

function formatPosition(cumulative: number | null) {
  if (cumulative === null) return "—";
  const { hizb, eighth } = positionOf(cumulative);
  return eighth === 0 ? `Hizb ${hizb}` : `Hizb ${hizb} + ${eighth}/8`;
}

interface MushafViewerProps {
  plan: QuranPlan | null;
  validatedEighths: number | null;
  targetEighths: number | null;
  riwaya?: "Hafs" | "Warsh" | null;
  onRefresh?: () => void;
}

export function MushafViewer({
  plan,
  validatedEighths,
  targetEighths,
  riwaya,
  onRefresh,
}: MushafViewerProps) {
  const rubsQuery = useQuranRubs();
  const surahsQuery = useQuranSurahs();

  const base = plan ? plan.start_hizb * 8 + plan.start_eighths : null;
  const targetFrom = validatedEighths ?? base;
  const targetTo =
    targetEighths ??
    (targetFrom !== null && plan
      ? targetFrom + plan.weekly_eighths
      : null);
  const memorizedFrom = plan ? plan.start_hizb * 8 : null;
  const memorizedTo = validatedEighths;

  const targetStartRub =
    targetFrom !== null ? rubForEighths(targetFrom) : null;
  const targetEndRub =
    targetFrom !== null && targetTo !== null
      ? rubForEighths(Math.max(targetFrom, targetTo - 1))
      : null;
  const memorizedStartRub =
    memorizedFrom !== null ? rubForEighths(memorizedFrom) : null;
  const memorizedEndRub =
    memorizedFrom !== null &&
    memorizedTo !== null &&
    memorizedTo > memorizedFrom
      ? rubForEighths(memorizedTo - 1)
      : null;

  const targetStartRubData =
    rubsQuery.data?.find((rub) => rub.number === targetStartRub) ?? null;
  const targetEndRubData =
    rubsQuery.data?.find((rub) => rub.number === targetEndRub) ?? null;
  const targetStartPage = targetStartRubData?.start_page ?? null;

  const [page, setPage] = useState(1);
  const lastTargetPage = useRef<number | null>(null);

  useEffect(() => {
    if (targetStartPage === null) return;
    if (lastTargetPage.current === targetStartPage) return;
    lastTargetPage.current = targetStartPage;
    setPage(targetStartPage);
  }, [targetStartPage]);

  const pageQuery = useQuranPage(page);
  const ayahs = pageQuery.data ?? [];
  const pageMeta = ayahs[0];

  const surahByNumber = useMemo(() => {
    const map = new Map<number, { name_ar: string }>();
    for (const surah of surahsQuery.data ?? [])
      map.set(surah.number, surah);
    return map;
  }, [surahsQuery.data]);

  const isTarget = (ayah: QuranAyah) =>
    targetStartRub !== null &&
    targetEndRub !== null &&
    ayah.rub >= targetStartRub &&
    ayah.rub <= targetEndRub;

  const isMemorized = (ayah: QuranAyah) =>
    memorizedStartRub !== null &&
    memorizedEndRub !== null &&
    ayah.rub >= memorizedStartRub &&
    ayah.rub <= memorizedEndRub;

  const refresh = () => {
    void rubsQuery.refetch();
    void surahsQuery.refetch();
    void pageQuery.refetch();
    onRefresh?.();
  };

  let previousSurah = -1;
  const pageContent = ayahs.map((ayah) => {
    const startsSurah = ayah.surah !== previousSurah;
    previousSurah = ayah.surah;
    const surah = surahByNumber.get(ayah.surah);
    const showBasmala =
      startsSurah && ayah.ayah === 1 && ayah.surah !== 1 && ayah.surah !== 9;
    const target = isTarget(ayah);
    const memorized = !target && isMemorized(ayah);

    return (
      <span key={`${ayah.surah}:${ayah.ayah}`}>
        {startsSurah && (
          <span className="my-4 block text-center">
            <span className="inline-block rounded-full border border-amber-300 bg-amber-50 px-5 py-1 text-lg font-semibold text-amber-900">
              {surah?.name_ar ?? `Sourate ${ayah.surah}`}
            </span>
          </span>
        )}
        {showBasmala && (
          <span className="mb-3 block text-center text-xl">{BASMALA}</span>
        )}
        <span
          className={
            target
              ? "rounded bg-amber-100/90 px-1 ring-1 ring-amber-300"
              : memorized
              ? "rounded bg-emerald-50 px-1 ring-1 ring-emerald-200"
              : undefined
          }
        >
          {ayah.text}
          <span className="mx-1 inline-flex h-6 min-w-6 items-center justify-center rounded-full border border-amber-300 bg-amber-50 px-1 align-middle text-[11px] text-amber-800">
            {toArabicDigits(ayah.ayah)}
          </span>
          {ayah.sajda && (
            <span className="mx-1 text-amber-700" title="Sajda">
              ۩
            </span>
          )}
        </span>{" "}
      </span>
    );
  });

  if (riwaya === "Warsh") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="rounded-2xl bg-emerald-600 p-3 text-white">
              <BookOpen className="h-6 w-6" />
            </div>
            Part à mémoriser
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Le mushaf Warsh sera ajouté prochainement. Le programme et les
            quantités restent utilisables.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!plan) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="rounded-2xl bg-emerald-600 p-3 text-white">
              <BookOpen className="h-6 w-6" />
            </div>
            Part à mémoriser
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Définissez le programme de mémorisation pour voir la part à faire.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
        <CardTitle className="flex items-center gap-3">
          <div className="rounded-2xl bg-emerald-600 p-3 text-white">
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <span>Part à mémoriser</span>
            <p className="text-xs font-normal text-muted-foreground">
              {formatPosition(targetFrom)} → {formatPosition(targetTo)}
            </p>
          </div>
        </CardTitle>
        <Badge className="bg-amber-100 text-amber-800">À faire</Badge>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-emerald-700 ring-1 ring-emerald-200">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            {memorizedEndRub !== null
              ? `Mémorisé : ${formatPosition(
                  memorizedFrom
                )} → ${formatPosition(memorizedTo)}`
              : "Mémorisé : aucun"}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-amber-800 ring-1 ring-amber-200">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            À faire : {formatPosition(targetFrom)} →{" "}
            {formatPosition(targetTo)}
          </span>
          {targetStartRubData && targetEndRubData && (
            <span className="text-muted-foreground">
              Quarts {targetStartRub} → {targetEndRub} · pages{" "}
              {targetStartRubData.start_page} → {targetEndRubData.end_page}
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={page <= 1}
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Précédente
          </Button>
          <Badge variant="outline">
            Page {page} / {QURAN_TOTAL_PAGES}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setPage((current) =>
                Math.min(QURAN_TOTAL_PAGES, current + 1)
              )
            }
            disabled={page >= QURAN_TOTAL_PAGES}
          >
            Suivante
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
          {targetStartPage !== null && page !== targetStartPage && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPage(targetStartPage)}
            >
              <LocateFixed className="mr-1 h-4 w-4" />
              Revenir à la cible
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={refresh}>
            <RefreshCw className="mr-1 h-4 w-4" />
            Rafraîchir
          </Button>
        </div>

        {rubsQuery.isError || pageQuery.isError ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            Mushaf indisponible :{" "}
            {(pageQuery.error ?? rubsQuery.error) instanceof Error
              ? (pageQuery.error ?? rubsQuery.error)?.message
              : "erreur inconnue"}
            .
          </div>
        ) : pageQuery.isLoading ||
          rubsQuery.isLoading ||
          targetStartPage === null ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Chargement de la cible…
          </div>
        ) : ayahs.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Aucun verset pour la page {page}.
          </div>
        ) : (
          <div
            dir="rtl"
            className="max-h-[60vh] overflow-y-auto rounded-3xl border border-amber-200 bg-[#fffdf4] p-4 text-right text-[22px] leading-[2.4] text-slate-900 shadow-inner sm:p-6 sm:text-[26px]"
            style={{
              fontFamily:
                '"Scheherazade New", "Amiri", "Traditional Arabic", "Noto Naskh Arabic", serif',
            }}
          >
            {pageContent}
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {pageMeta
              ? `Juz ${pageMeta.juz} • Hizb ${pageMeta.hizb} • Quart ${pageMeta.rub}`
              : "—"}
          </span>
          <span>
            Page {page} / {QURAN_TOTAL_PAGES}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
