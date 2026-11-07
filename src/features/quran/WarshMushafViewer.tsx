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
import { QURAN_TOTAL_PAGES, useQuranWarshEighths } from "./api";
import type { QuranPlan } from "./types";
import { supabase } from "@/lib/supabase";

function positionOf(cumulative: number) {
  const safe = Math.max(0, cumulative);
  return { hizb: Math.floor(safe / 8), eighth: safe % 8 };
}

function formatPosition(cumulative: number | null) {
  if (cumulative === null) return "—";
  const { hizb, eighth } = positionOf(cumulative);
  return eighth === 0 ? `Hizb ${hizb}` : `Hizb ${hizb} + ${eighth}/8`;
}

interface WarshMushafViewerProps {
  plan: QuranPlan | null;
  validatedEighths: number | null;
  targetEighths: number | null;
  embedded?: boolean;
  onRefresh?: () => void;
  memberId?: string;
}

export function WarshMushafViewer({
  plan,
  validatedEighths,
  targetEighths,
  embedded,
  onRefresh,
  memberId,
}: WarshMushafViewerProps) {
  const eighthsQuery = useQuranWarshEighths();

  const base = plan ? plan.start_hizb * 8 + plan.start_eighths : null;
  const targetFrom = validatedEighths ?? base;
  const targetTo =
    targetEighths ??
    (targetFrom !== null && plan
      ? targetFrom + plan.weekly_eighths
      : null);
  const memorizedFrom = plan ? plan.start_hizb * 8 : null;
  const memorizedTo = validatedEighths;

  const startPosition = targetFrom !== null ? positionOf(targetFrom) : null;
  const endPosition =
    targetTo !== null
      ? positionOf(Math.max(targetFrom ?? 0, targetTo - 1))
      : null;
  const startEighthNumber =
    startPosition !== null
      ? (startPosition.hizb - 1) * 8 + startPosition.eighth + 1
      : null;
  const endEighthNumber =
    endPosition !== null
      ? (endPosition.hizb - 1) * 8 + endPosition.eighth + 1
      : null;

  const startRow = useMemo(
    () =>
      eighthsQuery.data?.find(
        (row) => row.number === startEighthNumber
      ) ?? null,
    [eighthsQuery.data, startEighthNumber]
  );
  const endRow = useMemo(
    () =>
      eighthsQuery.data?.find((row) => row.number === endEighthNumber) ?? null,
    [eighthsQuery.data, endEighthNumber]
  );

  const targetStartPage = startRow?.start_page ?? null;
  const targetEndPage = endRow?.end_page ?? null;

  const [page, setPage] = useState(1);
  const [imageError, setImageError] = useState(false);
  const [restoringPage, setRestoringPage] = useState(true);
  const [restoredPage, setRestoredPage] = useState<number | null>(null);
  const lastTargetPage = useRef<number | null>(null);

  useEffect(() => {
    let active = true;
    setRestoringPage(true);
    setRestoredPage(null);

    if (!memberId) {
      setRestoringPage(false);
      return;
    }

    (async () => {
      try {
        const { data } = await supabase
          .from("mushaf_progress")
          .select("page")
          .eq("member_id", memberId)
          .maybeSingle();
        if (!active) return;
        if (data?.page) {
          setRestoredPage(data.page);
          setPage(data.page);
        }
      } catch (e) {
        console.warn("Lecture de la dernière page Warsh impossible:", e);
      } finally {
        if (active) setRestoringPage(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [memberId]);

  useEffect(() => {
    if (targetStartPage === null) return;
    if (restoringPage) return;
    if (restoredPage !== null) return;
    if (lastTargetPage.current === targetStartPage) return;
    lastTargetPage.current = targetStartPage;
    setPage(targetStartPage);
  }, [targetStartPage, restoringPage, restoredPage]);

  useEffect(() => {
    setImageError(false);
  }, [page]);

  useEffect(() => {
    if (!memberId || restoringPage) return;
    const timer = setTimeout(() => {
      void supabase
        .from("mushaf_progress")
        .upsert(
          { member_id: memberId, page, updated_at: new Date().toISOString() },
          { onConflict: "member_id" }
        )
        .then((res: { error?: unknown } | null) => {
          if (res?.error) {
            console.warn("Sauvegarde de la dernière page Warsh impossible:", res.error);
          }
        });
    }, 700);
    return () => clearTimeout(timer);
  }, [page, memberId, restoringPage]);

  const pageImageUrl = `https://cdn.quran.ws/svg/pages/v1.1.1/warsh-kfqc/${String(
    page
  ).padStart(3, "0")}.svg`;

  const refresh = () => {
    void eighthsQuery.refetch();
    onRefresh?.();
  };

  const cardClassName = embedded
    ? "border-0 bg-transparent shadow-none"
    : undefined;
  const contentClassName = embedded ? "space-y-4 p-0" : "space-y-4";

  if (!plan) {
    return (
      <Card className={cardClassName}>
        {!embedded && (
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="rounded-2xl bg-emerald-600 p-3 text-white">
                <BookOpen className="h-6 w-6" />
              </div>
              Part à mémoriser — Warsh
            </CardTitle>
          </CardHeader>
        )}
        <CardContent className={contentClassName}>
          <p className="text-sm text-muted-foreground">
            Définissez le programme de mémorisation pour voir la part à faire.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cardClassName}>
      {!embedded && (
        <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
          <CardTitle className="flex items-center gap-3">
            <div className="rounded-2xl bg-emerald-600 p-3 text-white">
              <BookOpen className="h-6 w-6" />
            </div>
            <div>
              <span>Part à mémoriser — Warsh</span>
              <p className="text-xs font-normal text-muted-foreground">
                {formatPosition(targetFrom)} → {formatPosition(targetTo)}
              </p>
            </div>
          </CardTitle>
          <Badge className="bg-amber-100 text-amber-800">À faire</Badge>
        </CardHeader>
      )}

      <CardContent className={contentClassName}>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-emerald-700 ring-1 ring-emerald-200">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Mémorisé : {formatPosition(memorizedFrom)} →{" "}
            {formatPosition(memorizedTo)}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-amber-800 ring-1 ring-amber-200">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            À faire : {formatPosition(targetFrom)} →{" "}
            {formatPosition(targetTo)}
          </span>
          {startRow && endRow && (
            <span className="text-muted-foreground">
              Hizb {startRow.hizb} · 1/8 n°{startRow.number} → Hizb{" "}
              {endRow.hizb} · 1/8 n°{endRow.number} · pages{" "}
              {startRow.start_page} → {endRow.end_page}
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

        {eighthsQuery.isError ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            Données Warsh indisponibles :{" "}
            {eighthsQuery.error instanceof Error
              ? eighthsQuery.error.message
              : "erreur inconnue"}
            .
          </div>
        ) : eighthsQuery.isLoading || targetStartPage === null ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Chargement de la cible Warsh…
          </div>
        ) : imageError ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            Page visuelle Warsh indisponible pour la page {page}.
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-amber-200 bg-white p-2 shadow-inner">
            <img
              src={pageImageUrl}
              alt={`Page ${page} du mushaf Warsh`}
              loading="lazy"
              onError={() => setImageError(true)}
              className="mx-auto w-full max-w-xl"
            />
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {startRow && endRow
              ? `Cible : 1/8 ${startRow.number} → ${endRow.number}`
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
