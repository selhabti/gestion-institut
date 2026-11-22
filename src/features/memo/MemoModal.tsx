import { useEffect, useState } from "react";
import {
  BookOpen,
  CalendarDays,
  Check,
  Minus,
  Plus,
  RefreshCw,
  Settings2,
  Trash2,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMemo, type MemoSeance } from "@/hooks/useMemo";
import {
  prochainSamedi,
  samediDe,
  type Riwaya,
} from "@/features/memo/logic";
import {
  positionVersRepere,
  type Repere,
  type SurahRef,
} from "@/features/memo/reperes";
import { SeanceEditor } from "./SeanceEditor";
import { MemoMushafPanel } from "./MemoMushafPanel";
import { MemoProgressBar } from "./MemoProgressBar";
import { AideDialog, AIDE_KEY } from "./MemoAide";
import { MushafPageDialog } from "./MushafPageDialog";
import {
  MEMO_BLOC_LABELS,
  MEMO_COLORS,
  type MemoBlocKey,
} from "./colors";
import type { Member } from "@/types/member";

const surahName = (surahs: SurahRef[], number: number) =>
  surahs.find((surah) => surah.number === number)?.name ?? `Sourate ${number}`;

const hizbOf = (position: number) =>
  position >= 480 ? 61 : Math.floor(position / 8) + 1;
const eighthOf = (position: number) => (position >= 480 ? 0 : position % 8);
const positionOf = (hizb: number, eighth: number) =>
  hizb >= 61 ? 480 : (hizb - 1) * 8 + eighth;

const isSaturday = (date: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  return samediDe(new Date(`${date}T12:00:00Z`)) === date;
};

const dayLabel = (date: string) =>
  new Date(`${date}T12:00:00`).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

const RYTHME_OPTIONS = [
  { value: 1, label: "1/8 de hizb par semaine" },
  { value: 2, label: "1/4 de hizb par semaine" },
  { value: 3, label: "3/8 de hizb par semaine" },
  { value: 4, label: "1/2 hizb par semaine" },
  { value: 6, label: "3/4 de hizb par semaine" },
  { value: 8, label: "1 hizb par semaine" },
];

const QUOTA_OPTIONS = [
  { value: 1, label: "1/8 de hizb d'ancien" },
  { value: 2, label: "1/4 de hizb d'ancien" },
  { value: 3, label: "3/8 de hizb d'ancien" },
  { value: 4, label: "1/2 hizb d'ancien" },
  { value: 6, label: "3/4 de hizb d'ancien" },
  { value: 8, label: "1 hizb d'ancien" },
  { value: 12, label: "1 hizb 1/2 d'ancien" },
  { value: 16, label: "2 hizb d'ancien" },
];

const segmentLabel = (
  current: number,
  options: { value: number; label: string }[]
) =>
  options.find((option) => option.value === current)?.label ??
  `${current} huitième(s)`;

interface PositionFieldProps {
  title: string;
  hizb: number;
  eighth: number;
  onHizb: (value: number) => void;
  onEighth: (value: number) => void;
  position: number;
  repere: Repere | null;
  surahs: SurahRef[];
  disabled?: boolean;
  onViewPage?: (page: number) => void;
}

function PositionField({
  title,
  hizb,
  eighth,
  onHizb,
  onEighth,
  position,
  repere,
  surahs,
  disabled,
  onViewPage,
}: PositionFieldProps) {
  return (
    <div className="space-y-2 rounded-2xl border border-slate-200 bg-slate-50/60 p-3">
      <Label className="text-sm font-semibold">{title}</Label>
      <div className="flex items-center gap-2">
        <Input
          type="number"
          min={1}
          max={61}
          value={hizb}
          onChange={(event) => {
            const next = Number(event.target.value);
            const clamped = Number.isFinite(next)
              ? Math.min(61, Math.max(1, Math.round(next)))
              : 1;
            onHizb(clamped);
            if (clamped >= 61) onEighth(0);
          }}
          disabled={disabled}
          className="h-9 w-24"
          aria-label="Hizb"
        />
        <span className="text-xs text-slate-500">Hizb</span>
        <Select
          value={String(eighth)}
          onValueChange={(value) => onEighth(Number(value))}
          disabled={disabled || hizb >= 61}
        >
          <SelectTrigger className="h-9 w-24">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Array.from({ length: 8 }, (_, index) => index).map((value) => (
              <SelectItem key={value} value={String(value)}>
                {value}/8
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <p className="text-[11px] text-slate-400">
        Saisir 1–60 · 61 = terminé (480)
      </p>
      <p className="text-xs text-slate-500">
        <span className="font-mono">{position}</span> ·{" "}
        {repere
          ? `${surahName(surahs, repere.sourate)} ${repere.verset} · page ${
              repere.page
            }${repere.exact ? "" : " ≈"}`
          : "Repère indisponible"}
      </p>
      {repere && onViewPage && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-11"
          onClick={() => onViewPage(repere.page)}
        >
          <BookOpen className="mr-1 h-4 w-4" />
          Voir la page
        </Button>
      )}
    </div>
  );
}

type HistoryState = "ok" | "ko" | "half" | "absent" | "none";

function HistoryPill({
  bloc,
  state,
}: {
  bloc: MemoBlocKey;
  state: HistoryState;
}) {
  const color = MEMO_COLORS[bloc];
  const base =
    "inline-flex h-7 items-center gap-1 rounded-full border px-2 text-[11px] font-semibold";
  if (state === "none") {
    return (
      <span className={`${base} border-slate-200 bg-slate-50 text-slate-500`}>
        {MEMO_BLOC_LABELS[bloc]}
      </span>
    );
  }
  if (state === "absent") {
    return (
      <span className={`${base} border-slate-300 bg-slate-100 text-slate-600`}>
        {MEMO_BLOC_LABELS[bloc]} · Absent
      </span>
    );
  }
  return (
    <span
      className={base}
      style={{
        backgroundColor: color.light,
        borderColor: color.hex,
        color: color.dark,
      }}
    >
      {state === "ok" ? (
        <Check className="h-3 w-3" />
      ) : state === "half" ? (
        <Minus className="h-3 w-3" />
      ) : (
        <X className="h-3 w-3" />
      )}
      {MEMO_BLOC_LABELS[bloc]}
    </span>
  );
}

const historyState = (
  bloc: MemoBlocKey,
  seance: MemoSeance
): HistoryState => {
  if (seance.nouveau_statut === "absent") return "absent";
  if (bloc === "nouveau") {
    return seance.nouveau_statut === "valide"
      ? "ok"
      : seance.nouveau_statut === "partiel"
      ? "half"
      : seance.nouveau_statut === "refaire"
      ? "ko"
      : "none";
  }
  const value = bloc === "recent" ? seance.recent_ok : seance.ancien_ok;
  return value === true ? "ok" : value === false ? "ko" : "none";
};

interface MemoModalProps {
  member: Member;
  onClose: () => void;
}

export function MemoModal({ member, onClose }: MemoModalProps) {
  const memo = useMemo(member.id);

  const [riwaya, setRiwaya] = useState<Riwaya>(
    (member.riwaya ?? "Hafs").toLowerCase() === "warsh" ? "warsh" : "hafs"
  );
  const [originHizb, setOriginHizb] = useState(1);
  const [originEighth, setOriginEighth] = useState(0);
  const [arriveHizb, setArriveHizb] = useState(1);
  const [arriveEighth, setArriveEighth] = useState(0);
  const [rythme, setRythme] = useState(2);
  const [quota, setQuota] = useState(8);
  const [dateDebut, setDateDebut] = useState(prochainSamedi(new Date()));
  const [starting, setStarting] = useState(false);

  const [tab, setTab] = useState("samedi");
  const [selectedSamedi, setSelectedSamedi] = useState(samediDe(new Date()));
  const [draft, setDraft] = useState<MemoSeance | null>(null);
  const [mushafBloc, setMushafBloc] = useState<MemoBlocKey>("nouveau");
  const [legacyOpen, setLegacyOpen] = useState(false);
  const [aideOpen, setAideOpen] = useState(false);
  const [pageDialog, setPageDialog] = useState<{
    page: number;
    title: string;
    riwaya: Riwaya;
  } | null>(null);

  const [settingsRythme, setSettingsRythme] = useState(2);
  const [settingsQuota, setSettingsQuota] = useState(8);
  const [settingsDate, setSettingsDate] = useState(prochainSamedi(new Date()));
  const [settingsOriginHizb, setSettingsOriginHizb] = useState(1);
  const [settingsOriginEighth, setSettingsOriginEighth] = useState(0);
  const [settingsArriveHizb, setSettingsArriveHizb] = useState(1);
  const [settingsArriveEighth, setSettingsArriveEighth] = useState(0);

  const originPos = positionOf(originHizb, originEighth);
  const arrivePos = positionOf(arriveHizb, arriveEighth);
  const startReperes = memo.reperesFor(riwaya);
  const originRepere = positionVersRepere(
    startReperes,
    riwaya,
    "fatiha_vers_nas",
    originPos
  );
  const arriveRepere = positionVersRepere(
    startReperes,
    riwaya,
    "fatiha_vers_nas",
    arrivePos
  );

  const profile = memo.profile;
  const cycle = memo.cycleInfo;

  const riwayaLabel =
    (profile?.riwaya ?? member.riwaya?.toLowerCase() ?? "hafs") === "warsh"
      ? "Warsh"
      : "Hafs";

  const summary = !profile
    ? ""
    : profile.position <= profile.position_origine
    ? "Mémorisé : rien pour l'instant"
    : profile.position >= 480
    ? `Mémorisé : du Hizb ${
        Math.floor(profile.position_origine / 8) + 1
      } à la fin (480/480)`
    : `Mémorisé : du Hizb ${
        Math.floor(profile.position_origine / 8) + 1
      } au Hizb ${Math.floor(profile.position / 8) + 1}, ${
        profile.position % 8
      }/8`;

  const barOrigin = profile?.position_origine ?? 0;
  const barPosition = profile?.position ?? 0;
  const barRecentDe =
    draft?.recent_de ??
    (profile
      ? Math.max(
          profile.position_origine,
          profile.position - 4 * profile.rythme
        )
      : 0);
  const barRecentA = draft?.recent_a ?? profile?.position ?? 0;
  const barNouveauDe = draft?.nouveau_de ?? profile?.position ?? 0;
  const barNouveauA =
    draft?.nouveau_a ??
    (profile ? Math.min(480, profile.position + profile.rythme) : 0);

  useEffect(() => {
    try {
      if (!window.localStorage.getItem(AIDE_KEY)) {
        setAideOpen(true);
        window.localStorage.setItem(AIDE_KEY, "1");
      }
    } catch {
      // stockage indisponible : on n'ouvre pas automatiquement
    }
  }, []);

  useEffect(() => {
    const suggestion = memo.suggestion;
    if (!suggestion || memo.profile) return;
    setOriginHizb(hizbOf(suggestion.origine));
    setOriginEighth(eighthOf(suggestion.origine));
    setArriveHizb(hizbOf(suggestion.arrive));
    setArriveEighth(eighthOf(suggestion.arrive));
  }, [memo.suggestion?.origine, memo.suggestion?.arrive, memo.profile]);

  useEffect(() => {
    if (!profile) return;
    setSettingsRythme(profile.rythme);
    setSettingsQuota(profile.quota_revision);
    setSettingsDate(profile.date_debut);
    setSettingsOriginHizb(hizbOf(profile.position_origine));
    setSettingsOriginEighth(eighthOf(profile.position_origine));
    setSettingsArriveHizb(hizbOf(profile.position_depart));
    setSettingsArriveEighth(eighthOf(profile.position_depart));
  }, [
    profile?.eleve_id,
    profile?.rythme,
    profile?.quota_revision,
    profile?.position_origine,
    profile?.position_depart,
    profile?.date_debut,
  ]);

  useEffect(() => {
    if (!profile) return;
    const current = samediDe(new Date());
    setSelectedSamedi(
      current < profile.date_debut ? profile.date_debut : current
    );
  }, [profile?.eleve_id, profile?.date_debut]);

  useEffect(() => {
    if (!profile) {
      setDraft(null);
      return;
    }
    if (!isSaturday(selectedSamedi)) {
      setDraft(null);
      return;
    }
    let active = true;
    memo
      .prepareSamedi(selectedSamedi)
      .then((next) => {
        if (active) setDraft(next);
      })
      .catch(() => {
        if (active) setDraft(null);
      });
    return () => {
      active = false;
    };
  }, [profile?.eleve_id, selectedSamedi, memo.seances.length]);

  const startValid =
    originPos <= arrivePos &&
    arrivePos <= 480 &&
    isSaturday(dateDebut) &&
    rythme > 0 &&
    quota > 0;

  const handleStart = async () => {
    if (!startValid) return;
    setStarting(true);
    try {
      await memo.start({
        riwaya,
        date_debut: dateDebut,
        position_origine: originPos,
        position_depart: arrivePos,
        rythme,
        quota_revision: quota,
      });
    } finally {
      setStarting(false);
    }
  };

  const etatAvant = profile ? memo.etatAvant(selectedSamedi) : null;
  const reperesForProfile = profile
    ? memo.reperesFor(profile.riwaya)
    : [];

  const handleSave = async (seance: MemoSeance) => {
    await memo.saveSeance(selectedSamedi, seance);
    const next = await memo.prepareSamedi(selectedSamedi);
    setDraft(next);
  };

  const settingsOriginPos = positionOf(
    settingsOriginHizb,
    settingsOriginEighth
  );
  const settingsArrivePos = positionOf(
    settingsArriveHizb,
    settingsArriveEighth
  );
  const settingsRoleRepere = (value: number) =>
    positionVersRepere(
      memo.reperesFor(profile?.riwaya ?? "hafs"),
      profile?.riwaya ?? "hafs",
      "fatiha_vers_nas",
      value
    );

  const handleSaveSettings = async () => {
    if (!profile) return;
    if (settingsOriginPos > settingsArrivePos) {
      alert("L'origine doit être inférieure ou égale à la position actuelle.");
      return;
    }
    if (
      !confirm(
        "Modifier le point de départ et les réglages relance le rejeu des séances. Continuer ?"
      )
    ) {
      return;
    }
    await memo.updateProfile({
      rythme: settingsRythme,
      quota_revision: settingsQuota,
      date_debut: settingsDate,
      position_origine: settingsOriginPos,
      position_depart: settingsArrivePos,
    });
  };

  const handleDelete = async () => {
    if (
      !confirm(
        "Supprimer le suivi de mémorisation de cet élève ? Les séances et le profil eleves_memo seront supprimés (l'élève reste dans la liste)."
      )
    ) {
      return;
    }
    await memo.deleteProfile();
    onClose();
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center justify-between gap-2">
            <span className="flex min-w-0 items-center gap-2">
              <BookOpen className="h-5 w-5 shrink-0 text-emerald-600" />
              <span className="truncate">
                Mémorisation — {member.firstName} {member.lastName}
              </span>
              <Badge variant="outline" className="shrink-0">
                {riwayaLabel}
              </Badge>
            </span>
            <Button
              variant="outline"
              size="sm"
              className="h-11 shrink-0"
              onClick={() => setAideOpen(true)}
            >
              ? Aide
            </Button>
          </DialogTitle>
          <DialogDescription>
            {profile
              ? "Suivi en 1/8 de hizb, séances du samedi."
              : "Démarrez le suivi : origine, position actuelle, rythme et quota."}
          </DialogDescription>
        </DialogHeader>

        {profile && (
          <div className="space-y-2 rounded-2xl border border-slate-200 bg-white p-4">
            <MemoProgressBar
              origine={barOrigin}
              position={barPosition}
              ancienDe={draft?.ancien_de ?? null}
              ancienA={draft?.ancien_a ?? null}
              recentDe={barRecentDe}
              recentA={barRecentA}
              nouveauDe={barNouveauDe}
              nouveauA={barNouveauA}
            />
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <span className="font-semibold text-slate-800">{summary}</span>
              <span
                data-testid="cycle"
                data-cycles={memo.profile?.cycles_faits ?? 0}
                className="text-slate-500"
              >
                Cycle de révision n° {cycle.number}, {cycle.percent} % du tour
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Riwaya {riwayaLabel} · rythme {profile.rythme}/sem. · ancien{" "}
              {profile.quota_revision}/sem.
            </p>
          </div>
        )}

        {memo.loading && !profile ? (
          <div className="py-10 text-center text-sm text-slate-500">
            Chargement…
          </div>
        ) : !profile ? (
          <div className="space-y-4 py-2">
            {memo.suggestion && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                Suggestion tirée de l'ancien suivi : à confirmer avec l'élève.
              </div>
            )}
            {!memo.suggestion && (
              <p className="text-sm text-slate-400">
                Exemple : A commencé à Hizb 1, 0/8 — arrivé à Hizb 2, 3/8.
              </p>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Riwaya</Label>
                <Select
                  value={riwaya}
                  onValueChange={(value) => setRiwaya(value as Riwaya)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hafs">Hafs</SelectItem>
                    <SelectItem value="warsh">Warsh</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Date de début (samedi)</Label>
                <Input
                  type="date"
                  value={dateDebut}
                  onChange={(event) => setDateDebut(event.target.value)}
                />
                {!isSaturday(dateDebut) && (
                  <p className="text-xs text-rose-600">
                    La date doit être un samedi.
                  </p>
                )}
              </div>
            </div>

            <PositionField
              title="A commencé à"
              hizb={originHizb}
              eighth={originEighth}
              onHizb={setOriginHizb}
              onEighth={setOriginEighth}
              position={originPos}
              repere={originRepere}
              surahs={memo.surahs}
              onViewPage={(page) =>
                setPageDialog({
                  page,
                  title: "A commencé à",
                  riwaya,
                })
              }
            />
            <PositionField
              title="Est arrivé à"
              hizb={arriveHizb}
              eighth={arriveEighth}
              onHizb={setArriveHizb}
              onEighth={setArriveEighth}
              position={arrivePos}
              repere={arriveRepere}
              surahs={memo.surahs}
              onViewPage={(page) =>
                setPageDialog({
                  page,
                  title: "Est arrivé à",
                  riwaya,
                })
              }
            />
            {originPos > arrivePos && (
              <p className="text-xs text-rose-600">
                L'origine doit être inférieure ou égale à la position actuelle.
              </p>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Rythme</Label>
                <Select
                  value={String(rythme)}
                  onValueChange={(value) => setRythme(Number(value))}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RYTHME_OPTIONS.map((option) => (
                      <SelectItem
                        key={option.value}
                        value={String(option.value)}
                      >
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Quota de révision (ancien)</Label>
                <Select
                  value={String(quota)}
                  onValueChange={(value) => setQuota(Number(value))}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {QUOTA_OPTIONS.map((option) => (
                      <SelectItem
                        key={option.value}
                        value={String(option.value)}
                      >
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <p className="text-xs text-slate-500">
              {segmentLabel(rythme, RYTHME_OPTIONS)} ·{" "}
              {segmentLabel(quota, QUOTA_OPTIONS)}.
            </p>

            <div className="flex justify-end">
              <Button
                onClick={handleStart}
                disabled={!startValid || starting}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <Plus className="mr-2 h-4 w-4" />
                {starting ? "Démarrage…" : "Démarrer le suivi"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <Tabs value={tab} onValueChange={setTab} className="space-y-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="samedi">Samedi</TabsTrigger>
                <TabsTrigger value="mushaf">Mushaf</TabsTrigger>
                <TabsTrigger value="historique">Historique</TabsTrigger>
                <TabsTrigger value="reglages">Réglages</TabsTrigger>
              </TabsList>

              <TabsContent value="samedi" className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Label className="text-sm">Séance du</Label>
                  <Input
                    type="date"
                    value={selectedSamedi}
                    onChange={(event) => setSelectedSamedi(event.target.value)}
                    className="w-44"
                  />
                  <Badge variant="outline">
                    {isSaturday(selectedSamedi)
                      ? dayLabel(selectedSamedi)
                      : "Choisir un samedi"}
                  </Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      void memo
                        .prepareSamedi(selectedSamedi)
                        .then((next) => setDraft(next));
                    }}
                  >
                    <RefreshCw className="mr-1 h-4 w-4" />
                    Préparer
                  </Button>
                </div>

                {!isSaturday(selectedSamedi) ? (
                  <p className="text-sm text-rose-600">
                    La séance doit être un samedi.
                  </p>
                ) : draft && etatAvant ? (
                  <SeanceEditor
                    draft={draft}
                    etatAvant={etatAvant}
                    eleve={{
                      riwaya: profile.riwaya,
                      sens: profile.sens,
                      date_debut: profile.date_debut,
                      position_origine: profile.position_origine,
                      position_depart: profile.position_depart,
                      rythme: profile.rythme,
                      quota_revision: profile.quota_revision,
                    }}
                    reperes={reperesForProfile}
                    surahs={memo.surahs}
                    saving={memo.saving}
                    onSave={handleSave}
                    onOpenMushaf={(bloc) => {
                      setMushafBloc(bloc);
                      setTab("mushaf");
                    }}
                  />
                ) : (
                  <div className="py-8 text-center text-sm text-slate-500">
                    Préparation de la séance…
                  </div>
                )}
              </TabsContent>

              <TabsContent value="mushaf" className="space-y-4">
                <MemoMushafPanel
                  draft={draft}
                  riwaya={profile.riwaya}
                  sens={profile.sens}
                  reperes={reperesForProfile}
                  surahs={memo.surahs}
                  selected={mushafBloc}
                  onSelectedChange={setMushafBloc}
                />
              </TabsContent>

              <TabsContent value="historique" className="space-y-4">
                {memo.avertissements.length > 0 && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                    <p className="font-semibold">Incohérences détectées</p>
                    <ul className="mt-1 space-y-1 text-xs">
                      {memo.avertissements.map((warning) => (
                        <li
                          key={warning.samedi}
                          data-testid="avertissement"
                        >
                          Ce samedi ({dayLabel(warning.samedi)}) ne suit pas le
                          précédent : vérifie la séance du{" "}
                          {dayLabel(warning.samedi)} (position attendue{" "}
                          {warning.position_attendue}).
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="space-y-2">
                  {[...memo.seances].reverse().map((seance) => (
                    <div
                      key={seance.id}
                      className="flex flex-col gap-2 rounded-xl border border-slate-200 p-3 text-sm sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <p className="font-medium">{dayLabel(seance.samedi)}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-1.5">
                          <HistoryPill
                            bloc="nouveau"
                            state={historyState("nouveau", seance)}
                          />
                          <HistoryPill
                            bloc="recent"
                            state={historyState("recent", seance)}
                          />
                          <HistoryPill
                            bloc="ancien"
                            state={historyState("ancien", seance)}
                          />
                        </div>
                        <p className="mt-1 text-xs text-slate-500">
                          Note {seance.note ?? "—"}/5
                          {seance.commentaire
                            ? ` · ${seance.commentaire}`
                            : ""}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-11 shrink-0"
                        onClick={() => {
                          setSelectedSamedi(seance.samedi);
                          setTab("samedi");
                        }}
                      >
                        Modifier
                      </Button>
                    </div>
                  ))}
                  {memo.seances.length === 0 && (
                    <p className="text-sm text-slate-500">
                      Aucune séance enregistrée.
                    </p>
                  )}
                </div>

                <Button
                  variant="link"
                  size="sm"
                  className="px-0 text-slate-500"
                  onClick={() => setLegacyOpen(true)}
                >
                  Ancien historique (avant la nouvelle version)
                </Button>
              </TabsContent>

              <TabsContent value="reglages" className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Rythme (huitièmes / semaine)</Label>
                    <Input
                      type="number"
                      min={1}
                      value={settingsRythme}
                      onChange={(event) =>
                        setSettingsRythme(Number(event.target.value))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Quota de révision</Label>
                    <Input
                      type="number"
                      min={1}
                      value={settingsQuota}
                      onChange={(event) =>
                        setSettingsQuota(Number(event.target.value))
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Date de début (samedi)</Label>
                  <Input
                    type="date"
                    value={settingsDate}
                    onChange={(event) => setSettingsDate(event.target.value)}
                    className="w-44"
                  />
                  {!isSaturday(settingsDate) && (
                    <p className="text-xs text-rose-600">
                      La date doit être un samedi.
                    </p>
                  )}
                </div>

                <PositionField
                  title="Point de départ (origine)"
                  hizb={settingsOriginHizb}
                  eighth={settingsOriginEighth}
                  onHizb={setSettingsOriginHizb}
                  onEighth={setSettingsOriginEighth}
                  position={settingsOriginPos}
                  repere={settingsRoleRepere(settingsOriginPos)}
                  surahs={memo.surahs}
                  onViewPage={(page) =>
                    setPageDialog({
                      page,
                      title: "Point de départ",
                      riwaya: profile.riwaya,
                    })
                  }
                />
                <PositionField
                  title="Position actuelle"
                  hizb={settingsArriveHizb}
                  eighth={settingsArriveEighth}
                  onHizb={setSettingsArriveHizb}
                  onEighth={setSettingsArriveEighth}
                  position={settingsArrivePos}
                  repere={settingsRoleRepere(settingsArrivePos)}
                  surahs={memo.surahs}
                  onViewPage={(page) =>
                    setPageDialog({
                      page,
                      title: "Position actuelle",
                      riwaya: profile.riwaya,
                    })
                  }
                />

                <div className="flex flex-wrap justify-between gap-2">
                  <Button
                    variant="outline"
                    className="text-rose-600 hover:text-rose-700"
                    onClick={handleDelete}
                  >
                    <Trash2 className="mr-1 h-4 w-4" />
                    Supprimer le suivi
                  </Button>
                  <Button
                    onClick={handleSaveSettings}
                    disabled={!isSaturday(settingsDate)}
                  >
                    <Settings2 className="mr-1 h-4 w-4" />
                    Enregistrer les réglages
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}

        <Dialog open={legacyOpen} onOpenChange={setLegacyOpen}>
          <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5" />
                Ancien historique (lecture seule)
              </DialogTitle>
              <DialogDescription>
                Lignes de l'ancienne table `memorization`. Aucune modification.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              {memo.legacy.length === 0 ? (
                <p className="text-sm text-slate-500">
                  Aucune ancienne ligne pour cet élève.
                </p>
              ) : (
                memo.legacy.map((row) => (
                  <div
                    key={row.id}
                    className="rounded-xl border border-slate-200 p-3 text-sm"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-medium">
                        {dayLabel(row.week_start)}
                      </span>
                      <Badge variant="outline">{row.kind}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      {row.quantity || "—"} · {row.surah_from || "—"}{" "}
                      {row.ayah_from || ""}
                      {row.surah_to ? ` → ${row.surah_to} ${row.ayah_to ?? ""}` : ""}
                    </p>
                    <p className="text-xs text-slate-500">
                      Statut : {row.status} ·{" "}
                      {row.validated ? "validé" : "non validé"}
                    </p>
                  </div>
                ))
              )}
            </div>
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => setLegacyOpen(false)}>
                Fermer
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <AideDialog open={aideOpen} onOpenChange={setAideOpen} />

        <MushafPageDialog
          open={!!pageDialog}
          onOpenChange={(open) => {
            if (!open) setPageDialog(null);
          }}
          riwaya={pageDialog?.riwaya ?? "hafs"}
          initialPage={pageDialog?.page ?? 1}
          title={pageDialog?.title}
        />
      </DialogContent>
    </Dialog>
  );
}
