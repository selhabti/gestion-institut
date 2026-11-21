import { useEffect, useState } from "react";
import {
  BookOpen,
  CalendarDays,
  History,
  Plus,
  RefreshCw,
  Settings2,
  Trash2,
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
import { Progress } from "@/components/ui/progress";
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
}: PositionFieldProps) {
  return (
    <div className="space-y-2 rounded-2xl border border-slate-200 bg-slate-50/60 p-3">
      <Label className="text-sm font-semibold">{title}</Label>
      <div className="flex items-center gap-2">
        <Select
          value={String(hizb)}
          onValueChange={(value) => {
            const next = Number(value);
            onHizb(next);
            if (next >= 61) onEighth(0);
          }}
          disabled={disabled}
        >
          <SelectTrigger className="h-9 w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Array.from({ length: 60 }, (_, index) => index + 1).map(
              (value) => (
                <SelectItem key={value} value={String(value)}>
                  Hizb {value}
                </SelectItem>
              )
            )}
            <SelectItem value="61">Terminé (480)</SelectItem>
          </SelectContent>
        </Select>
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
      <p className="text-xs text-slate-500">
        <span className="font-mono">{position}</span> ·{" "}
        {repere
          ? `${surahName(surahs, repere.sourate)} ${repere.verset} · page ${
              repere.page
            }${repere.exact ? "" : " ≈"}`
          : "Repère indisponible"}
      </p>
    </div>
  );
}

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
  const [legacyOpen, setLegacyOpen] = useState(false);

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
  const position = profile?.position ?? 0;
  const cycle = memo.cycleInfo;

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-emerald-600" />
            Mémorisation — {member.firstName} {member.lastName}
          </DialogTitle>
          <DialogDescription>
            {profile
              ? "Suivi en 1/8 de hizb, séances du samedi."
              : "Démarrez le suivi : origine, position actuelle, rythme et quota."}
          </DialogDescription>
        </DialogHeader>

        {memo.loading && !profile ? (
          <div className="py-10 text-center text-sm text-slate-500">
            Chargement…
          </div>
        ) : !profile ? (
          <div className="space-y-4 py-2">
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
            />
            {originPos > arrivePos && (
              <p className="text-xs text-rose-600">
                L'origine doit être inférieure ou égale à la position actuelle.
              </p>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Rythme (huitièmes / semaine)</Label>
                <Input
                  type="number"
                  min={1}
                  value={rythme}
                  onChange={(event) => setRythme(Number(event.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label>Quota de révision</Label>
                <Input
                  type="number"
                  min={1}
                  value={quota}
                  onChange={(event) => setQuota(Number(event.target.value))}
                />
              </div>
            </div>

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
            <div className="space-y-2 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="font-semibold text-emerald-800">
                  Position {position}/480
                </span>
                <span className="text-xs text-emerald-700">
                  Origine {profile.position_origine} · Cycle {cycle.number} ·{" "}
                  {cycle.percent}%
                </span>
              </div>
              <Progress value={(position / 480) * 100} className="h-3" />
              <p className="text-xs text-emerald-700">
                Riwaya {profile.riwaya === "warsh" ? "Warsh" : "Hafs"} · rythme{" "}
                {profile.rythme}/sem. · quota {profile.quota_revision}
              </p>
            </div>

            <Tabs value={tab} onValueChange={setTab} className="space-y-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="samedi">Samedi</TabsTrigger>
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
                  />
                ) : (
                  <div className="py-8 text-center text-sm text-slate-500">
                    Préparation de la séance…
                  </div>
                )}
              </TabsContent>

              <TabsContent value="historique" className="space-y-4">
                {memo.avertissements.length > 0 && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                    <p className="font-semibold">Incohérences détectées</p>
                    <ul className="mt-1 space-y-1 text-xs">
                      {memo.avertissements.map((warning) => (
                        <li key={warning.samedi}>
                          {warning.samedi} : nouveau_de ={" "}
                          {warning.nouveau_de} (attendu{" "}
                          {warning.position_attendue})
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="space-y-2">
                  {[...memo.seances].reverse().map((seance) => (
                    <div
                      key={seance.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 p-3 text-sm"
                    >
                      <div>
                        <p className="font-medium">{dayLabel(seance.samedi)}</p>
                        <p className="text-xs text-slate-500">
                          Statut : {seance.nouveau_statut ?? "à saisir"} · note{" "}
                          {seance.note ?? "—"}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedSamedi(seance.samedi);
                          setTab("samedi");
                        }}
                      >
                        Ouvrir
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
                  variant="outline"
                  size="sm"
                  onClick={() => setLegacyOpen(true)}
                >
                  <History className="mr-1 h-4 w-4" />
                  Ancien historique (lecture seule)
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
      </DialogContent>
    </Dialog>
  );
}
