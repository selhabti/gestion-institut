import { useEffect, useMemo, useState } from "react";
import { BookOpen, Check, X } from "lucide-react";
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
  positionVersRepere,
  plageHizbLibelle,
  plageVersLibelle,
  type Repere,
  type SurahRef,
} from "./reperes";
import type { EleveMemo, Etat, NouveauStatut } from "./logic";
import { MushafPageDialog } from "./MushafPageDialog";

interface SeanceEditorProps {
  draft: MemoSeance;
  etatAvant: Etat;
  eleve: EleveMemo;
  reperes: Repere[];
  surahs: SurahRef[];
  saving: boolean;
  onSave: (seance: MemoSeance) => Promise<void>;
  onOpenMushaf?: (bloc: "nouveau" | "recent" | "ancien") => void;
}

const surahName = (surahs: SurahRef[], number: number) =>
  surahs.find((surah) => surah.number === number)?.name ?? `Sourate ${number}`;

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
  const [mushaf, setMushaf] = useState<{
    page: number;
    title: string;
  } | null>(null);

  useEffect(() => {
    setNouveauStatut(draft.nouveau_statut);
    setNouveauAtteint(draft.nouveau_atteint);
    setRecentOk(draft.recent_ok);
    setAncienOk(draft.ancien_ok);
    setNote(draft.note);
    setCommentaire(draft.commentaire ?? "");
  }, [draft.id, draft.samedi, draft.nouveau_de]);

  const label = (de: number | null, a: number | null) => {
    if (de === null || a === null || de >= a) return "—";
    const libelle = plageVersLibelle(
      reperes,
      eleve.riwaya,
      eleve.sens,
      de,
      a,
      surahs
    );
    return libelle ? `${libelle.label}${libelle.exact ? "" : " ≈"}` : "—";
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

  const zone = Math.max(0, draft.recent_de - eleve.position_origine);
  const cyclePercent =
    zone > 0
      ? Math.min(100, Math.round((etatAvant.pointeur_rev / zone) * 100))
      : 0;
  const nonew = draft.nouveau_de >= draft.nouveau_a;
  const noRecent = draft.recent_de >= draft.recent_a;
  const noOld = draft.ancien_de === null || draft.ancien_a === null;

  // À 480/480, il n'y a plus de bloc nouveau : une séance de révision reste saisissable.
  const effectiveNouveauStatut: NouveauStatut | null = nonew
    ? "valide"
    : nouveauStatut;
  const canSave = effectiveNouveauStatut !== null && !saving;

  const handleSave = () => {
    if (!canSave || !effectiveNouveauStatut) return;
    void onSave({
      ...draft,
      nouveau_statut: effectiveNouveauStatut,
      nouveau_atteint:
        effectiveNouveauStatut === "partiel" ? nouveauAtteint : null,
      recent_ok: recentOk,
      ancien_ok: ancienOk,
      note,
      commentaire: commentaire.trim() || null,
    });
  };

  return (
    <div className="space-y-5">
      <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-slate-800">NOUVEAU</p>
            <p className="text-xs text-slate-500">
              {draft.nouveau_de} → {draft.nouveau_a} ·{" "}
              {label(draft.nouveau_de, draft.nouveau_a)} ·{" "}
              {plageHizbLibelle(draft.nouveau_de, draft.nouveau_a)}
            </p>
          </div>
          {!nonew && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                if (onOpenMushaf) {
                  onOpenMushaf("nouveau");
                  return;
                }
                openMushaf(draft.nouveau_de, "Mushaf — nouveau");
              }}
            >
              <BookOpen className="mr-1 h-4 w-4" />
              Mushaf
            </Button>
          )}
        </div>

        {nonew ? (
          <Badge className="bg-emerald-100 text-emerald-700">
            Mémorisation terminée (480/480)
          </Badge>
        ) : (
          <>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant={nouveauStatut === "valide" ? "default" : "outline"}
                onClick={() => {
                  setNouveauStatut("valide");
                  setNouveauAtteint(null);
                }}
              >
                <Check className="mr-1 h-4 w-4" />
                Validé
              </Button>
              <Button
                size="sm"
                variant={nouveauStatut === "partiel" ? "default" : "outline"}
                disabled={partielOptions.length === 0}
                onClick={() => {
                  setNouveauStatut("partiel");
                  setNouveauAtteint(
                    (current) => current ?? partielOptions[0] ?? null
                  );
                }}
              >
                ½ Partiel
              </Button>
              <Button
                size="sm"
                variant={nouveauStatut === "refaire" ? "default" : "outline"}
                onClick={() => {
                  setNouveauStatut("refaire");
                  setNouveauAtteint(null);
                }}
              >
                <X className="mr-1 h-4 w-4" />
                Refaire
              </Button>
              <Button
                size="sm"
                variant={nouveauStatut === "absent" ? "default" : "outline"}
                onClick={() => {
                  setNouveauStatut("absent");
                  setNouveauAtteint(null);
                }}
              >
                Absent
              </Button>
            </div>

            {nouveauStatut === "partiel" && partielOptions.length > 0 && (
              <div className="flex items-center gap-2">
                <Label className="text-xs">Arrivé à</Label>
                <Select
                  value={String(nouveauAtteint ?? partielOptions[0])}
                  onValueChange={(value) => setNouveauAtteint(Number(value))}
                >
                  <SelectTrigger className="h-8 w-48">
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
                          {position} —{" "}
                          {repere
                            ? `${surahName(surahs, repere.sourate)} ${
                                repere.verset
                              } (p.${repere.page})`
                            : "?"}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            )}
          </>
        )}
      </div>

      <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-slate-800">RÉCENT</p>
            <p className="text-xs text-slate-500">
              {draft.recent_de} → {draft.recent_a} ·{" "}
              {label(draft.recent_de, draft.recent_a)} ·{" "}
              {plageHizbLibelle(draft.recent_de, draft.recent_a)}
            </p>
          </div>
          {!noRecent && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                if (onOpenMushaf) {
                  onOpenMushaf("recent");
                  return;
                }
                openMushaf(draft.recent_de, "Mushaf — récent");
              }}
            >
              <BookOpen className="mr-1 h-4 w-4" />
              Mushaf
            </Button>
          )}
        </div>
        {noRecent ? (
          <Badge variant="outline">Aucune révision récente</Badge>
        ) : (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={recentOk === true ? "default" : "outline"}
              onClick={() => setRecentOk(true)}
            >
              <Check className="mr-1 h-4 w-4" />
              OK
            </Button>
            <Button
              size="sm"
              variant={recentOk === false ? "default" : "outline"}
              onClick={() => setRecentOk(false)}
            >
              <X className="mr-1 h-4 w-4" />
              Non
            </Button>
          </div>
        )}
      </div>

      <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-slate-800">ANCIEN</p>
            <p className="text-xs text-slate-500">
              {noOld
                ? "Aucune révision ancienne"
                : `${draft.ancien_de} → ${draft.ancien_a} · ${label(
                    draft.ancien_de,
                    draft.ancien_a
                  )} · ${plageHizbLibelle(
                    draft.ancien_de ?? 0,
                    draft.ancien_a ?? 0
                  )}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              Cycle {etatAvant.cycles_faits + 1} · {cyclePercent}%
            </Badge>
            {!noOld && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  if (onOpenMushaf) {
                    onOpenMushaf("ancien");
                    return;
                  }
                  openMushaf(draft.ancien_de, "Mushaf — ancien");
                }}
              >
                <BookOpen className="mr-1 h-4 w-4" />
                Mushaf
              </Button>
            )}
          </div>
        </div>
        {!noOld && (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={ancienOk === true ? "default" : "outline"}
              onClick={() => setAncienOk(true)}
            >
              <Check className="mr-1 h-4 w-4" />
              OK
            </Button>
            <Button
              size="sm"
              variant={ancienOk === false ? "default" : "outline"}
              onClick={() => setAncienOk(false)}
            >
              <X className="mr-1 h-4 w-4" />
              Non
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label className="text-xs">Note (1–5)</Label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((value) => (
              <Button
                key={value}
                size="sm"
                variant={note === value ? "default" : "outline"}
                onClick={() => setNote(note === value ? null : value)}
              >
                {value}
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

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={!canSave}>
          {saving ? "Enregistrement…" : "Enregistrer la séance"}
        </Button>
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
