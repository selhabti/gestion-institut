import { useEffect, useMemo, useState, type ReactNode } from "react";
import { BookOpen, Check, Minus, Star, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { MemoSeance } from "@/hooks/useMemo";
import {
  appliquerSeance,
  preparerSeance,
  prochainSamedi,
  type EleveMemo,
  type Etat,
  type NouveauStatut,
} from "./logic";
import {
  positionVersRepere,
  plageHizbLibelle,
  plageVersLibelle,
  type Repere,
  type SurahRef,
} from "./reperes";
import {
  MEMO_BLOC_HELP,
  MEMO_BLOC_LABELS,
  MEMO_COLORS,
  type MemoBlocKey,
} from "./colors";
import { MushafPageDialog } from "./MushafPageDialog";

interface SeanceEditorProps {
  draft: MemoSeance;
  etatAvant: Etat;
  eleve: EleveMemo;
  reperes: Repere[];
  surahs: SurahRef[];
  saving: boolean;
  onSave: (seance: MemoSeance) => Promise<void>;
  onOpenMushaf?: (bloc: MemoBlocKey) => void;
}

type CardState = "ok" | "ko" | "half" | "absent" | "none";

const hizbLabel = (position: number): string => {
  if (position >= 480) return "Fin (480/480)";
  return `Hizb ${Math.floor(position / 8) + 1}, ${position % 8}/8`;
};

const surahName = (surahs: SurahRef[], number: number) =>
  surahs.find((surah) => surah.number === number)?.name ?? `Sourate ${number}`;

const stateBorder: Record<CardState, string> = {
  ok: "border-emerald-500 bg-emerald-50/40",
  ko: "border-rose-500 bg-rose-50/40",
  half: "border-orange-500 bg-orange-50/40",
  absent: "border-slate-400 bg-slate-100/70",
  none: "border-slate-200 bg-white",
};

const stateBadge = (bloc: MemoBlocKey, state: CardState) => {
  if (state === "none") return null;
  if (state === "ok") {
    return (
      <Badge className="bg-emerald-600 text-white">
        <Check className="mr-1 h-3 w-3" />
        {bloc === "nouveau" ? "Appris" : "OK"}
      </Badge>
    );
  }
  if (state === "half") {
    return (
      <Badge className="bg-orange-500 text-white">
        <Minus className="mr-1 h-3 w-3" />
        En partie
      </Badge>
    );
  }
  if (state === "ko") {
    return (
      <Badge className="bg-rose-500 text-white">
        <X className="mr-1 h-3 w-3" />
        {bloc === "nouveau" ? "À refaire" : "Non"}
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="bg-slate-100 text-slate-600">
      Absent
    </Badge>
  );
};

interface BlocCardProps {
  bloc: MemoBlocKey;
  de: number | null;
  a: number | null;
  label: string;
  exact: boolean;
  state: CardState;
  onMushaf: () => void;
  dataDe: string | null;
  dataA: string | null;
  children: ReactNode;
  extra?: ReactNode;
}

function BlocCard({
  bloc,
  de,
  a,
  label,
  exact,
  state,
  onMushaf,
  dataDe,
  dataA,
  children,
  extra,
}: BlocCardProps) {
  const color = MEMO_COLORS[bloc];
  const hasRange = de !== null && a !== null && de < a;

  return (
    <div
      data-testid={`bloc-${bloc}`}
      data-de={dataDe ?? undefined}
      data-a={dataA ?? undefined}
      data-vide={hasRange ? undefined : "true"}
      className={`overflow-hidden rounded-2xl border-2 shadow-sm transition-colors ${stateBorder[state]}`}
    >
      <div className="h-1.5 w-full" style={{ backgroundColor: color.hex }} />
      <div className="space-y-3 p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: color.hex }}
              />
              <h3 className="text-sm font-bold tracking-wide text-slate-900">
                {MEMO_BLOC_LABELS[bloc]}
              </h3>
              {stateBadge(bloc, state)}
            </div>
            <p className="mt-0.5 text-xs text-slate-500">
              {MEMO_BLOC_HELP[bloc]}
            </p>
          </div>
          {hasRange && (
            <Button
              size="sm"
              variant="outline"
              className="h-11 shrink-0"
              onClick={onMushaf}
            >
              <BookOpen className="mr-1 h-4 w-4" />
              Ouvrir le mushaf
            </Button>
          )}
        </div>

        <div className="rounded-xl bg-white/70 p-3">
          <p className="text-sm font-semibold text-slate-800">
            {hasRange ? label : "—"}
            {hasRange && !exact ? " ≈" : ""}
          </p>
          <p className="mt-0.5 text-xs text-slate-500">
            {hasRange ? plageHizbLibelle(de as number, a as number) : "Aucune plage"}
          </p>
        </div>

        {children}
        {extra}
      </div>
    </div>
  );
}

export function SeanceEditor({
  draft,
  etatAvant,
  eleve,
  reperes,
  surahs,
  saving,
  onSave,
  onOpenMushaf,
}: SeanceEditorProps) {
  const [nouveauStatut, setNouveauStatut] = useState<NouveauStatut | null>(
    draft.nouveau_statut
  );
  const [nouveauAtteint, setNouveauAtteint] = useState<number | null>(
    draft.nouveau_atteint
  );
  const [recentOk, setRecentOk] = useState<boolean | null>(draft.recent_ok);
  const [ancienOk, setAncienOk] = useState<boolean | null>(draft.ancien_ok);
  const [note, setNote] = useState<number | null>(draft.note);
  const [commentaire, setCommentaire] = useState(draft.commentaire ?? "");
  const [mushaf, setMushaf] = useState<{ page: number; title: string } | null>(
    null
  );

  useEffect(() => {
    setNouveauStatut(draft.nouveau_statut);
    setNouveauAtteint(draft.nouveau_atteint);
    setRecentOk(draft.recent_ok);
    setAncienOk(draft.ancien_ok);
    setNote(draft.note);
    setCommentaire(draft.commentaire ?? "");
  }, [draft.id, draft.samedi, draft.nouveau_de]);

  const nonew = draft.nouveau_de >= draft.nouveau_a;
  const absent = nouveauStatut === "absent";
  const effectiveStatus: NouveauStatut | null = nonew
    ? "valide"
    : nouveauStatut;

  const partielOptions = useMemo(() => {
    const options: number[] = [];
    for (
      let position = draft.nouveau_de + 1;
      position < draft.nouveau_a;
      position += 1
    ) {
      options.push(position);
    }
    return options;
  }, [draft.nouveau_de, draft.nouveau_a]);

  useEffect(() => {
    if (nouveauStatut !== "partiel") return;
    if (partielOptions.length === 0) {
      setNouveauAtteint(null);
      return;
    }
    if (
      nouveauAtteint === null ||
      !partielOptions.includes(nouveauAtteint)
    ) {
      setNouveauAtteint(partielOptions[0]);
    }
  }, [nouveauStatut, partielOptions, nouveauAtteint]);

  const rangeInfo = (de: number | null, a: number | null) => {
    if (de === null || a === null || de >= a) {
      return { label: "—", exact: true };
    }
    const libelle = plageVersLibelle(
      reperes,
      eleve.riwaya,
      eleve.sens,
      de,
      a,
      surahs
    );
    return {
      label: libelle ? libelle.label : "—",
      exact: libelle?.exact ?? true,
    };
  };

  const bornes = (
    de: number | null,
    a: number | null
  ): { de: string | null; a: string | null } => {
    if (de === null || a === null || de >= a) {
      return { de: null, a: null };
    }
    const start = positionVersRepere(reperes, eleve.riwaya, eleve.sens, de);
    const endRepere = positionVersRepere(
      reperes,
      eleve.riwaya,
      eleve.sens,
      a
    );
    if (!start || !endRepere) return { de: null, a: null };

    const sameRepere =
      start.sourate === endRepere.sourate &&
      start.verset === endRepere.verset &&
      start.page === endRepere.page;
    if (sameRepere) {
      return {
        de: `${start.sourate}:${start.verset}`,
        a: `${endRepere.sourate}:${endRepere.verset}`,
      };
    }

    let endSurah = endRepere.sourate;
    let endAyah = endRepere.verset - 1;
    if (endAyah < 1) {
      const previousSurah = surahs.find(
        (surah) => surah.number === endSurah - 1
      );
      if (!previousSurah) return { de: null, a: null };
      endSurah -= 1;
      endAyah = previousSurah.ayahCount;
    }

    return {
      de: `${start.sourate}:${start.verset}`,
      a: `${endSurah}:${endAyah}`,
    };
  };

  const openMushaf = (de: number | null, title: string) => {
    if (de === null) return;
    const repere = positionVersRepere(
      reperes,
      eleve.riwaya,
      eleve.sens,
      de
    );
    if (!repere) return;
    setMushaf({ page: repere.page, title });
  };

  const handleMushaf = (bloc: MemoBlocKey, de: number | null) => {
    if (onOpenMushaf) {
      onOpenMushaf(bloc);
      return;
    }
    openMushaf(de, `Mushaf — ${MEMO_BLOC_LABELS[bloc].toLowerCase()}`);
  };

  const handleAbsent = () => {
    setNouveauStatut("absent");
    setNouveauAtteint(null);
    setRecentOk(null);
    setAncienOk(null);
  };

  const cyclePercent =
    draft.recent_de > eleve.position_origine
      ? Math.min(
          100,
          Math.round(
            (etatAvant.pointeur_rev /
              (draft.recent_de - eleve.position_origine)) *
              100
          )
        )
      : 0;

  const projected = appliquerSeance(
    etatAvant,
    {
      ...draft,
      nouveau_statut: effectiveStatus,
      nouveau_atteint:
        effectiveStatus === "partiel" ? nouveauAtteint : null,
      recent_ok: recentOk,
      ancien_ok: ancienOk,
    },
    eleve
  );
  const nextSamedi = prochainSamedi(
    new Date(`${draft.samedi}T12:00:00Z`)
  );
  const nextDraft = preparerSeance(projected, eleve, nextSamedi);
  const nextNouveau = nonew
    ? "Mémorisation terminée (révisions uniquement)"
    : rangeInfo(nextDraft.nouveau_de, nextDraft.nouveau_a).label;
  const nextAncien = nextDraft.ancien_de !== null
    ? rangeInfo(nextDraft.ancien_de, nextDraft.ancien_a).label
    : "Aucune tranche ancienne";
  const cycleDone = projected.cycles_faits > etatAvant.cycles_faits;

  const hasRevision = recentOk !== null || ancienOk !== null;
  const canSave = nonew ? hasRevision : nouveauStatut !== null;
  const disabledSave = saving || !canSave;

  const nouveauRange = rangeInfo(draft.nouveau_de, draft.nouveau_a);
  const recentRange = rangeInfo(draft.recent_de, draft.recent_a);
  const ancienRange = rangeInfo(draft.ancien_de, draft.ancien_a);
  const nouveauBornes = bornes(draft.nouveau_de, draft.nouveau_a);
  const recentBornes = bornes(draft.recent_de, draft.recent_a);
  const ancienBornes = bornes(draft.ancien_de, draft.ancien_a);

  const nouveauState: CardState = nonew
    ? "none"
    : nouveauStatut === "valide"
    ? "ok"
    : nouveauStatut === "partiel"
    ? "half"
    : nouveauStatut === "refaire"
    ? "ko"
    : nouveauStatut === "absent"
    ? "absent"
    : "none";

  const recentState: CardState = absent
    ? "absent"
    : recentOk === true
    ? "ok"
    : recentOk === false
    ? "ko"
    : "none";

  const ancienState: CardState = absent
    ? "absent"
    : ancienOk === true
    ? "ok"
    : ancienOk === false
    ? "ko"
    : "none";

  const handleSave = () => {
    if (!canSave || !effectiveStatus) return;
    void onSave({
      ...draft,
      nouveau_statut: effectiveStatus,
      nouveau_atteint:
        effectiveStatus === "partiel" ? nouveauAtteint : null,
      recent_ok: absent ? null : recentOk,
      ancien_ok: absent ? null : ancienOk,
      note,
      commentaire: commentaire.trim() || null,
    });
  };

  return (
    <div className="space-y-4">
      {nonew ? (
        <div className="rounded-2xl border-2 border-slate-300 bg-slate-100 p-4">
          <p className="text-sm font-semibold text-slate-700">
            Mémorisation terminée, révisions uniquement
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Plus de nouveau bloc : la position est à 480/480. Le statut NOUVEAU
            sera enregistré automatiquement à « valide » dès qu'une révision
            sera saisie.
          </p>
        </div>
      ) : (
        <BlocCard
          bloc="nouveau"
          de={draft.nouveau_de}
          a={draft.nouveau_a}
          label={nouveauRange.label}
          exact={nouveauRange.exact}
          state={nouveauState}
          onMushaf={() => handleMushaf("nouveau", draft.nouveau_de)}
          dataDe={nouveauBornes.de}
          dataA={nouveauBornes.a}
        >
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            <Button
              data-testid="btn-valide"
              className="h-11"
              variant={nouveauStatut === "valide" ? "default" : "outline"}
              onClick={() => {
                setNouveauStatut("valide");
                setNouveauAtteint(null);
              }}
            >
              <Check className="mr-1 h-4 w-4" />
              Appris
            </Button>
            <Button
              data-testid="btn-partiel"
              className="h-11"
              variant={nouveauStatut === "partiel" ? "default" : "outline"}
              disabled={partielOptions.length === 0}
              onClick={() => {
                setNouveauStatut("partiel");
                setNouveauAtteint(
                  (current) => current ?? partielOptions[0] ?? null
                );
              }}
            >
              <Minus className="mr-1 h-4 w-4" />
              En partie
            </Button>
            <Button
              data-testid="btn-refaire"
              className="h-11"
              variant={nouveauStatut === "refaire" ? "default" : "outline"}
              onClick={() => {
                setNouveauStatut("refaire");
                setNouveauAtteint(null);
              }}
            >
              <X className="mr-1 h-4 w-4" />
              À refaire
            </Button>
            <Button
              data-testid="btn-absent"
              className="h-11"
              variant={nouveauStatut === "absent" ? "default" : "outline"}
              onClick={handleAbsent}
            >
              Absent
            </Button>
          </div>

          {nouveauStatut === "partiel" && partielOptions.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <Label className="text-xs">Arrivé à</Label>
              <Select
                value={String(nouveauAtteint ?? partielOptions[0])}
                onValueChange={(value) => setNouveauAtteint(Number(value))}
              >
                <SelectTrigger className="h-11 w-full sm:w-64">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {partielOptions.map((position) => {
                    const repere = positionVersRepere(
                      reperes,
                      eleve.riwaya,
                      eleve.sens,
                      position
                    );
                    return (
                      <SelectItem key={position} value={String(position)}>
                        {hizbLabel(position)}
                        {repere
                          ? ` — ${surahName(surahs, repere.sourate)} ${
                              repere.verset
                            } (p.${repere.page})`
                          : ""}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          )}
        </BlocCard>
      )}

      <BlocCard
        bloc="recent"
        de={draft.recent_de}
        a={draft.recent_a}
        label={recentRange.label}
        exact={recentRange.exact}
        state={recentState}
        onMushaf={() => handleMushaf("recent", draft.recent_de)}
        dataDe={recentBornes.de}
        dataA={recentBornes.a}
      >
        {draft.recent_de >= draft.recent_a ? (
          <p className="text-xs text-slate-500">Rien à réviser en récent.</p>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:flex">
            <Button
              data-testid="btn-ok"
              className="h-11"
              variant={recentOk === true ? "default" : "outline"}
              disabled={absent}
              onClick={() => setRecentOk(true)}
            >
              <Check className="mr-1 h-4 w-4" />
              OK
            </Button>
            <Button
              data-testid="btn-ko"
              className="h-11"
              variant={recentOk === false ? "default" : "outline"}
              disabled={absent}
              onClick={() => setRecentOk(false)}
            >
              <X className="mr-1 h-4 w-4" />
              Non
            </Button>
          </div>
        )}
      </BlocCard>

      <BlocCard
        bloc="ancien"
        de={draft.ancien_de}
        a={draft.ancien_a}
        label={ancienRange.label}
        exact={ancienRange.exact}
        state={ancienState}
        onMushaf={() => handleMushaf("ancien", draft.ancien_de)}
        dataDe={ancienBornes.de}
        dataA={ancienBornes.a}
        extra={
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <Badge variant="outline">
              Cycle {etatAvant.cycles_faits + 1} · {cyclePercent}%
            </Badge>
            <span>La tranche change chaque samedi.</span>
          </div>
        }
      >
        {draft.ancien_de === null || draft.ancien_a === null ? (
          <p className="text-xs text-slate-500">
            Aucune tranche ancienne pour le moment.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:flex">
            <Button
              data-testid="btn-ok"
              className="h-11"
              variant={ancienOk === true ? "default" : "outline"}
              disabled={absent}
              onClick={() => setAncienOk(true)}
            >
              <Check className="mr-1 h-4 w-4" />
              OK
            </Button>
            <Button
              data-testid="btn-ko"
              className="h-11"
              variant={ancienOk === false ? "default" : "outline"}
              disabled={absent}
              onClick={() => setAncienOk(false)}
            >
              <X className="mr-1 h-4 w-4" />
              Non
            </Button>
          </div>
        )}
      </BlocCard>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label className="text-xs">Note (1–5 étoiles)</Label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((value) => (
              <Button
                key={value}
                size="icon"
                variant="ghost"
                className="h-11 w-11"
                aria-label={`Note ${value} sur 5`}
                onClick={() => setNote(note === value ? null : value)}
              >
                <Star
                  className={
                    note !== null && value <= note
                      ? "h-6 w-6 fill-amber-400 text-amber-400"
                      : "h-6 w-6 text-slate-300"
                  }
                />
              </Button>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <Label className="text-xs">Commentaire</Label>
          <Textarea
            value={commentaire}
            onChange={(event) => setCommentaire(event.target.value)}
            placeholder="Remarque du professeur…"
            className="min-h-16"
          />
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm">
        <p className="font-semibold text-slate-800">Samedi prochain</p>
        <p className="mt-1 text-slate-600">
          Il apprendra : <strong>{nextNouveau}</strong>.
        </p>
        <p className="text-slate-600">
          Il révisera en ancien : <strong>{nextAncien}</strong>.
        </p>
        {cycleDone && (
          <p className="mt-1 font-semibold text-teal-700">
            Tour de révision terminé : cycle n°{" "}
            {projected.cycles_faits + 1}.
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Button
          data-testid="btn-enregistrer"
          size="lg"
          className="h-12 w-full"
          disabled={disabledSave}
          onClick={handleSave}
        >
          {saving ? "Enregistrement…" : "Enregistrer"}
        </Button>
        {!canSave && !saving && (
          <p className="text-center text-xs text-slate-500">
            {nonew
              ? "Saisis au moins une révision (récent ou ancien) pour enregistrer."
              : "Choisis d'abord le résultat du NOUVEAU pour enregistrer."}
          </p>
        )}
      </div>

      <MushafPageDialog
        open={!!mushaf}
        onOpenChange={(open) => {
          if (!open) setMushaf(null);
        }}
        riwaya={eleve.riwaya}
        initialPage={mushaf?.page ?? 1}
        title={mushaf?.title}
      />
    </div>
  );
}


