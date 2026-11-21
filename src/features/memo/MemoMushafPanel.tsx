import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { MemoSeance } from "@/hooks/useMemo";
import {
  positionVersRepere,
  plageHizbLibelle,
  plageVersLibelle,
  type Repere,
  type SurahRef,
} from "./reperes";
import type { Riwaya, Sens } from "./logic";

const TOTAL = 604;

export type MemoBlocKey = "nouveau" | "recent" | "ancien";

const BLOC_LABELS: Record<MemoBlocKey, string> = {
  nouveau: "NOUVEAU",
  recent: "RÉCENT",
  ancien: "ANCIEN",
};

const pageUrl = (riwaya: Riwaya, page: number) =>
  `https://cdn.quran.ws/svg/pages/v1.1.1/${
    riwaya === "warsh" ? "warsh-kfqc" : "hafs-kfqc"
  }/${String(page).padStart(3, "0")}.svg`;

interface MemoMushafPanelProps {
  draft: MemoSeance | null;
  riwaya: Riwaya;
  sens: Sens;
  reperes: Repere[];
  surahs: SurahRef[];
  selected: MemoBlocKey;
  onSelectedChange: (bloc: MemoBlocKey) => void;
}

export function MemoMushafPanel({
  draft,
  riwaya,
  sens,
  reperes,
  surahs,
  selected,
  onSelectedChange,
}: MemoMushafPanelProps) {
  const ranges: Record<
    MemoBlocKey,
    { de: number | null; a: number | null }
  > = {
    nouveau: draft
      ? { de: draft.nouveau_de, a: draft.nouveau_a }
      : { de: null, a: null },
    recent: draft
      ? { de: draft.recent_de, a: draft.recent_a }
      : { de: null, a: null },
    ancien: draft
      ? { de: draft.ancien_de, a: draft.ancien_a }
      : { de: null, a: null },
  };

  const hasRange = (bloc: MemoBlocKey) => {
    const range = ranges[bloc];
    return range.de !== null && range.a !== null && range.de < range.a;
  };

  const active: MemoBlocKey = hasRange(selected)
    ? selected
    : (["nouveau", "recent", "ancien"] as MemoBlocKey[]).find(hasRange) ??
      "nouveau";

  const range = ranges[active];
  const startRepere =
    draft && range.de !== null
      ? positionVersRepere(reperes, riwaya, sens, range.de)
      : null;

  const [page, setPage] = useState(startRepere?.page ?? 1);
  const [input, setInput] = useState(String(startRepere?.page ?? 1));

  useEffect(() => {
    setPage(startRepere?.page ?? 1);
    setInput(String(startRepere?.page ?? 1));
  }, [startRepere?.page, active, draft?.id]);

  useEffect(() => {
    setInput(String(page));
  }, [page]);

  if (!draft) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
        Sélectionne d'abord un samedi et prépare la séance pour voir le mushaf.
      </div>
    );
  }

  const label =
    range.de !== null && range.a !== null && range.de < range.a
      ? plageVersLibelle(reperes, riwaya, sens, range.de, range.a, surahs)
      : null;

  const go = () => {
    const n = Number(input);
    if (!Number.isFinite(n)) {
      setInput(String(page));
      return;
    }
    const next = Math.min(TOTAL, Math.max(1, Math.round(n)));
    setPage(next);
    setInput(String(next));
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {(["nouveau", "recent", "ancien"] as MemoBlocKey[]).map((bloc) => (
          <Button
            key={bloc}
            size="sm"
            variant={active === bloc ? "default" : "outline"}
            disabled={!hasRange(bloc)}
            onClick={() => onSelectedChange(bloc)}
          >
            {BLOC_LABELS[bloc]}
          </Button>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-slate-800">
              {BLOC_LABELS[active]}
            </p>
            <p className="text-xs text-slate-500">
              {range.de} → {range.a} ·{" "}
              {label ? label.label : "aucune plage"} ·{" "}
              {range.de !== null && range.a !== null
                ? plageHizbLibelle(range.de, range.a)
                : "—"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {riwaya === "warsh" ? "Warsh" : "Hafs"}
            </Badge>
            {label && !label.exact && (
              <Badge className="bg-amber-100 text-amber-800">≈</Badge>
            )}
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={page <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Input
            type="number"
            min={1}
            max={TOTAL}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                go();
              }
            }}
            className="h-8 w-20"
          />
          <span className="text-xs text-muted-foreground">/ {TOTAL}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setPage((current) => Math.min(TOTAL, current + 1))
            }
            disabled={page >= TOTAL}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={go}>
            Aller
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const target = startRepere?.page ?? 1;
              setPage(target);
              setInput(String(target));
            }}
          >
            <BookOpen className="mr-1 h-4 w-4" />
            Revenir au début du bloc
          </Button>
        </div>

        <img
          src={pageUrl(riwaya, page)}
          alt={`Page ${page} du mushaf`}
          className="mx-auto mt-3 w-full max-w-xl"
          loading="lazy"
        />
      </div>
    </div>
  );
}
