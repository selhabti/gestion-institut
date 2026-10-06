// src/components/attendance/StudentHistoryModal.tsx

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,  // ← AJOUTER CET IMPORT
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Check,
  X,
  Calendar,
  CreditCard,
  TrendingUp,
  BookOpen,
  Plus,
  Trash2,
  Shield,
  Table2,
} from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import type { StudentHistory } from "@/types/attendance";
import { motion } from "framer-motion";
import { AttendanceService } from "@/services/attendanceService";
import { toast } from "sonner";
import { getCurrentInstitutId } from "@/lib/institutes";
import { useMemorization, type Riwaya } from "@/hooks/useMemorization";
import { useStaff } from "@/hooks/useStaff";
import { JUZ_REFERENCE, SURAHS } from "@/lib/quranReference";
import { QuantityCombobox } from "@/components/attendance/QuantityCombobox";
import { PaymentPlanSection } from "@/components/attendance/PaymentPlanSection";
import type {
  MemorizationEntry,
  MemorizationKind,
  MemorizationStatus,
} from "@/types/member";

const KIND_LABELS: Record<MemorizationKind, string> = {
  nouvelle: "Nouvelle",
  recente: "Récente",
  ancienne: "Ancienne",
};

const KIND_CLASS: Record<MemorizationKind, string> = {
  nouvelle: "bg-indigo-100 text-indigo-700 border-indigo-200",
  recente: "bg-emerald-100 text-emerald-700 border-emerald-200",
  ancienne: "bg-amber-100 text-amber-700 border-amber-200",
};

const STATUS_LABELS: Record<MemorizationStatus, string> = {
  fait: "Fait",
  partiel: "Partiel",
  a_revoir: "À revoir",
};

const KINDS: MemorizationKind[] = ["nouvelle", "recente", "ancienne"];
const STATUSES: MemorizationStatus[] = ["fait", "partiel", "a_revoir"];

interface StudentHistoryModalProps {
  student: StudentHistory | null;
  isOpen: boolean;
  onClose: () => void;
}

export function StudentHistoryModal({
  student,
  isOpen,
  onClose,
}: StudentHistoryModalProps) {
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [historyData, setHistoryData] = useState<StudentHistory | null>(null);

  // Charger l'historique à l'ouverture.
  // On part des données déjà en mémoire (student) pour ne jamais afficher une fiche vide,
  // puis on les remplace par la version serveur si elle est disponible.
  useEffect(() => {
    if (student?.studentId && isOpen) {
      setHistoryData(student);
      if (student.monthlyStats?.length) {
        setSelectedMonth(student.monthlyStats[0].month);
      }
      loadStudentHistory();
    }
  }, [student?.studentId, isOpen]);

  const loadStudentHistory = async () => {
    setLoading(true);
    try {
      const history = await AttendanceService.getStudentHistoryWithExclusion(
        student!.studentId
      );
      // On ne remplace que si le serveur renvoie des données exploitables
      if (history?.monthlyStats?.length) {
        setHistoryData(history);
        setSelectedMonth(history.monthlyStats[0].month);
      }
    } catch (error) {
      console.error("Erreur chargement historique:", error);
      // on conserve les données en mémoire
    } finally {
      setLoading(false);
    }
  };

  const selectedMonthStats = useMemo(() => {
    return historyData?.monthlyStats.find((stats) => stats.month === selectedMonth);
  }, [historyData?.monthlyStats, selectedMonth]);

  const availableMonths = useMemo(() => {
    if (!historyData?.monthlyStats) return [];
    return historyData.monthlyStats.map((stats) => stats.month);
  }, [historyData?.monthlyStats]);

  // Attanzil : fiche de mémorisation (riwaya / quantité / validation / tajwid)
  const isAttanzil = getCurrentInstitutId() === "attanzil";
  const { currentRole } = useStaff();
  const isProf = currentRole === "super_admin";
  const memo = useMemorization(student?.studentId ?? null, isOpen && isAttanzil);

  const [newWeek, setNewWeek] = useState("");
  const [newQty, setNewQty] = useState("");
  const [newKind, setNewKind] = useState<MemorizationKind>("nouvelle");
  const [newSurah, setNewSurah] = useState("");
  const [newAyahFrom, setNewAyahFrom] = useState("");
  const [newAyahTo, setNewAyahTo] = useState("");
  const [newStatus, setNewStatus] = useState<MemorizationStatus>("fait");
  const [newQuality, setNewQuality] = useState("");
  const [tajwidDraft, setTajwidDraft] = useState("");
  const [showRef, setShowRef] = useState(false);
  useEffect(() => {
    setTajwidDraft(memo.tajwidLevel);
  }, [memo.tajwidLevel]);

  const weeks = useMemo(() => {
    const map = new Map<string, MemorizationEntry[]>();
    for (const e of memo.entries) {
      const arr = map.get(e.week_start) ?? [];
      arr.push(e);
      map.set(e.week_start, arr);
    }
    return Array.from(map.entries());
  }, [memo.entries]);

  if (!student) return null;
  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chargement</DialogTitle>
            <DialogDescription>
              Chargement de l'historique des présences...
            </DialogDescription>
          </DialogHeader>
          <div className="p-8 text-center">Chargement...</div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto bg-card/95 backdrop-blur-xl border-border/80 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-left">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8 py-8"
            >
              {/* Avatar */}
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="shrink-0"
              >
                <div className="relative">
                  <div className="absolute -inset-1 bg-black/20 rounded-3xl blur-xl" />
                  <div className="relative w-24 h-24 rounded-3xl bg-gradient-to-tr from-primary via-primary/80 to-primary/60 flex items-center justify-center text-white text-4xl font-bold shadow-2xl">
                    {student.firstName.charAt(0).toUpperCase()}
                  </div>
                </div>
              </motion.div>

              {/* Nom + infos */}
              <div className="text-center sm:text-left space-y-4">
                <h2 className="text-5xl md:text-6xl font-thin tracking-wider">
                  <span>{student.firstName}</span>{" "}
                  <span className="font-semibold uppercase text-primary">
                    {student.lastName}
                  </span>
                </h2>

                <div className="flex items-center gap-4 justify-center sm:justify-start">
                  <span>Élève</span>
                  <div className="w-px h-5 bg-foreground/30" />
                  <span>Groupe</span>
                  <Badge variant="secondary" className="ml-3 px-4 py-1.5">
                    {student.group}
                  </Badge>
                </div>
              </div>
            </motion.div>
          </DialogTitle>
          <DialogDescription className="sr-only">
            Historique détaillé des présences, absences et paiements pour {student.firstName} {student.lastName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-8 mt-6">
          {/* Fiche de mémorisation (Attanzil) */}
          {isAttanzil && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-indigo-600 text-white">
                      <BookOpen className="h-6 w-6" />
                    </div>
                    <span>Fiche de mémorisation</span>
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowRef(true)}
                  >
                    <Table2 className="h-4 w-4 mr-1" />
                    Juz / Hizb
                  </Button>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Riwaya */}
                  <div className="space-y-2">
                    <Label>Riwaya</Label>
                    <div className="flex gap-2">
                      {(["Hafs", "Warsh"] as Riwaya[]).map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => memo.saveRiwaya(r)}
                          className={`rounded-xl border-2 px-5 py-2 text-sm font-semibold transition-all ${
                            memo.riwaya === r
                              ? "bg-indigo-600 text-white border-transparent"
                              : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Niveau de tajwid — visible uniquement par le professeur */}
                  {isProf && (
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-purple-600" />
                        Niveau de tajwid (professeur uniquement)
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          value={tajwidDraft}
                          onChange={(e) => setTajwidDraft(e.target.value)}
                          placeholder="ex : Bon, très bon, à revoir…"
                        />
                        <Button
                          variant="outline"
                          onClick={() => memo.saveTajwid(tajwidDraft)}
                        >
                          Enregistrer
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Ajout / mise à jour d'une ligne */}
                  <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                    <Label>Ajouter une ligne de suivi</Label>

                    <div className="flex flex-wrap items-center gap-2">
                      <Input
                        type="date"
                        value={newWeek}
                        onChange={(e) => setNewWeek(e.target.value)}
                        className="w-44"
                      />
                      <div className="flex gap-1">
                        {KINDS.map((k) => (
                          <button
                            key={k}
                            type="button"
                            onClick={() => setNewKind(k)}
                            className={`rounded-lg border px-3 py-2 text-sm font-semibold transition-all ${
                              newKind === k
                                ? KIND_CLASS[k]
                                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                            }`}
                          >
                            {KIND_LABELS[k]}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Select value={newSurah} onValueChange={setNewSurah}>
                        <SelectTrigger className="w-52">
                          <SelectValue placeholder="Sourate" />
                        </SelectTrigger>
                        <SelectContent className="max-h-72">
                          {SURAHS.map((s) => (
                            <SelectItem key={s} value={s}>
                              {s}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        value={newAyahFrom}
                        onChange={(e) => setNewAyahFrom(e.target.value)}
                        placeholder="de (verset)"
                        className="w-28"
                      />
                      <Input
                        value={newAyahTo}
                        onChange={(e) => setNewAyahTo(e.target.value)}
                        placeholder="à (verset)"
                        className="w-28"
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <QuantityCombobox value={newQty} onChange={setNewQty} />
                      <div className="flex gap-1">
                        {STATUSES.map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setNewStatus(s)}
                            className={`rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
                              newStatus === s
                                ? "bg-slate-800 text-white border-transparent"
                                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                            }`}
                          >
                            {STATUS_LABELS[s]}
                          </button>
                        ))}
                      </div>
                      {isProf && (
                        <Input
                          value={newQuality}
                          onChange={(e) => setNewQuality(e.target.value)}
                          placeholder="Qualité (prof)"
                          className="w-40"
                        />
                      )}
                      <Button
                        onClick={async () => {
                          if (!newWeek) {
                            toast.error("Choisissez la date du samedi");
                            return;
                          }
                          await memo.upsertEntry({
                            weekStart: newWeek,
                            kind: newKind,
                            quantity: newQty,
                            surahFrom: newSurah,
                            ayahFrom: newAyahFrom,
                            ayahTo: newAyahTo,
                            surahTo: newSurah,
                            status: newStatus,
                            quality: newQuality,
                          });
                          setNewQty("");
                          setNewSurah("");
                          setNewAyahFrom("");
                          setNewAyahTo("");
                          setNewQuality("");
                        }}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Enregistrer
                      </Button>
                    </div>
                  </div>

                  {/* Suivi hebdomadaire */}
                  {weeks.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Aucune mémorisation enregistrée.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {weeks.map(([week, items]) => (
                        <div
                          key={week}
                          className="rounded-2xl border border-slate-200 overflow-hidden"
                        >
                          <div className="px-4 py-2 bg-slate-100 font-semibold capitalize text-slate-700">
                            {new Date(week + "T00:00:00").toLocaleDateString(
                              "fr-FR",
                              {
                                weekday: "long",
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                              }
                            )}
                          </div>
                          <div className="divide-y divide-slate-100">
                            {items.map((e) => {
                              const position = e.surah_from
                                ? `${e.surah_from}${
                                    e.ayah_from ? ` ${e.ayah_from}` : ""
                                  }${e.ayah_to ? ` → ${e.ayah_to}` : ""}`
                                : "—";
                              return (
                                <div
                                  key={e.id}
                                  className="flex items-center justify-between gap-3 p-3"
                                >
                                  <div className="flex items-center gap-3 min-w-0">
                                    <Badge
                                      variant="outline"
                                      className={KIND_CLASS[e.kind]}
                                    >
                                      {KIND_LABELS[e.kind]}
                                    </Badge>
                                    <div className="min-w-0">
                                      <p className="font-medium text-sm truncate">
                                        {position}
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        {e.quantity || "—"} •{" "}
                                        {STATUS_LABELS[e.status]}
                                        {isProf && e.quality
                                          ? ` • ${e.quality}`
                                          : ""}
                                        {e.validated ? " • validé ✓" : ""}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0">
                                    <Button
                                      size="sm"
                                      variant={
                                        e.validated ? "default" : "outline"
                                      }
                                      onClick={() =>
                                        memo.setValidated(e, !e.validated)
                                      }
                                    >
                                      {e.validated ? (
                                        <>
                                          <Check className="h-4 w-4 mr-1" />
                                          Validé
                                        </>
                                      ) : (
                                        "Valider"
                                      )}
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="text-red-600 hover:text-red-700"
                                      onClick={() => memo.deleteEntry(e.id)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Paiements (Attanzil) */}
          {isAttanzil && (
            <PaymentPlanSection
              memberId={student.studentId}
              enabled={isOpen && isAttanzil}
            />
          )}

          {/* Sélecteur de mois */}
          {availableMonths.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-lg">
                    <div className="p-3 rounded-2xl bg-primary text-white">
                      <Calendar className="h-6 w-6" />
                    </div>
                    <span>Sélection de la période</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="p-3 bg-muted/70 rounded-2xl">
                    <div className="flex">
                      {availableMonths.map((month) => {
                        const isActive = selectedMonth === month;
                        const label = new Date(month + "-01")
                          .toLocaleDateString("fr-FR", {
                            month: "short",
                            year: "2-digit",
                          })
                          .toUpperCase();

                        return (
                          <button
                            key={month}
                            onClick={() => setSelectedMonth(month)}
                            className={`
                              flex-1 relative py-4 text-sm font-semibold
                              ${isActive ? "text-primary" : "text-muted-foreground"}
                            `}
                          >
                            {label}
                            {isActive && (
                              <div className="absolute inset-x-6 bottom-3 h-1 bg-primary rounded-full" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Stats du mois */}
                  {selectedMonthStats && (
                    <div className="grid grid-cols-3 gap-6">
                      <div className="text-center p-6 rounded-3xl bg-emerald-50 border border-emerald-200">
                        <p className="text-5xl font-bold text-emerald-600">
                          {selectedMonthStats.presentSessions}
                        </p>
                        <p className="mt-2 text-sm font-medium text-emerald-700 uppercase">
                          Présent
                        </p>
                      </div>

                      <div className="text-center p-6 rounded-3xl bg-rose-50 border border-rose-200">
                        <p className="text-5xl font-bold text-rose-600">
                          {selectedMonthStats.absentSessions}
                        </p>
                        <p className="mt-2 text-sm font-medium text-rose-700 uppercase">
                          Absent
                        </p>
                      </div>

                      <div className="text-center p-6 rounded-3xl bg-primary/5 border border-primary/20">
                        <p className="text-5xl font-bold text-primary">
                          {selectedMonthStats.attendanceRate}%
                        </p>
                        <p className="mt-2 text-sm font-medium text-primary/80 uppercase">
                          Taux de présence
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Paiement */}
          {selectedMonthStats && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <CreditCard className="h-6 w-6 text-primary" />
                    <span>
                      Statut de paiement •{" "}
                      {new Date(selectedMonth + "-01").toLocaleDateString("fr-FR", {
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div
                    className={`flex items-center justify-between p-6 rounded-2xl border-2 ${
                      selectedMonthStats.paymentStatus.status === "paid"
                        ? "bg-emerald-50 border-emerald-300"
                        : "bg-amber-50 border-amber-300"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`p-4 rounded-2xl ${
                          selectedMonthStats.paymentStatus.status === "paid"
                            ? "bg-emerald-500"
                            : "bg-amber-500"
                        } text-white`}
                      >
                        <CreditCard className="h-8 w-8" />
                      </div>
                      <div>
                        <p className="text-xl font-semibold">
                          {selectedMonthStats.paymentStatus.status === "paid"
                            ? "Cotisation réglée"
                            : "Cotisation en attente"}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={selectedMonthStats.paymentStatus.status === "paid" ? "default" : "secondary"}
                      className="text-lg px-6 py-2"
                    >
                      {selectedMonthStats.paymentStatus.status === "paid" ? "PAYÉ" : "IMPAYÉ"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Détail des séances */}
          {selectedMonthStats && selectedMonthStats.sessions.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <TrendingUp className="h-6 w-6 text-primary" />
                    <span>Détail des séances</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedMonthStats.sessions.map((session, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`flex items-center justify-between p-5 rounded-2xl border-2 ${
                        session.status === "present"
                          ? "bg-emerald-50 border-emerald-300"
                          : "bg-rose-50 border-rose-300"
                      }`}
                    >
                      <div className="flex items-center gap-5">
                        <div
                          className={`p-3 rounded-2xl ${
                            session.status === "present"
                              ? "bg-emerald-500"
                              : "bg-rose-500"
                          } text-white`}
                        >
                          {session.status === "present" ? (
                            <Check className="h-6 w-6" />
                          ) : (
                            <X className="h-6 w-6" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-lg">
                            {new Date(session.date).toLocaleDateString("fr-FR", {
                              weekday: "long",
                              day: "numeric",
                              month: "long",
                            })}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {session.day} • {session.sessionType}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-base px-5 py-2">
                        {session.status === "present" ? "Présent" : "Absent"}
                      </Badge>
                    </motion.div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Stats globales */}
          {historyData && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <TrendingUp className="h-6 w-6 text-primary" />
                    <span>Performance globale</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="text-center p-6 rounded-3xl bg-gradient-to-br from-primary/10 to-transparent border">
                      <p className="text-5xl font-bold text-primary">
                        {historyData.overallAttendance.overallRate}%
                      </p>
                      <p className="mt-2 text-sm font-medium text-muted-foreground uppercase">
                        Taux global
                      </p>
                    </div>
                    <div className="text-center p-6 rounded-3xl bg-gradient-to-br from-emerald-500/10 to-transparent border">
                      <p className="text-5xl font-bold text-emerald-600">
                        {historyData.overallAttendance.presentCount}
                      </p>
                      <p className="mt-2 text-sm font-medium text-muted-foreground uppercase">
                        Présences
                      </p>
                    </div>
                    <div className="text-center p-6 rounded-3xl bg-gradient-to-br from-rose-500/10 to-transparent border">
                      <p className="text-5xl font-bold text-rose-600">
                        {historyData.overallAttendance.absentCount}
                      </p>
                      <p className="mt-2 text-sm font-medium text-muted-foreground uppercase">
                        Absences
                      </p>
                    </div>
                    <div className="text-center p-6 rounded-3xl bg-gradient-to-br from-purple-500/10 to-transparent border">
                      <p className="text-5xl font-bold text-purple-600">
                        {historyData.overallAttendance.totalSessions}
                      </p>
                      <p className="mt-2 text-sm font-medium text-muted-foreground uppercase">
                        Total
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </DialogContent>
    </Dialog>

    <Dialog open={showRef} onOpenChange={setShowRef}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Correspondance Juz / Hizb / Sourate</DialogTitle>
          <DialogDescription>
            30 juz • 60 hizb (2 hizb par juz). Point de départ de chaque juz.
          </DialogDescription>
        </DialogHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-slate-500">
                <th className="py-2 pr-4 font-medium">Juz</th>
                <th className="py-2 pr-4 font-medium">Hizb</th>
                <th className="py-2 pr-4 font-medium">Sourate (début)</th>
                <th className="py-2 font-medium">Verset</th>
              </tr>
            </thead>
            <tbody>
              {JUZ_REFERENCE.map((j) => (
                <tr key={j.juz} className="border-b last:border-0">
                  <td className="py-2 pr-4 font-semibold">{j.juz}</td>
                  <td className="py-2 pr-4">{j.hizb}</td>
                  <td className="py-2 pr-4">{j.startSurah}</td>
                  <td className="py-2 text-slate-500">{j.startAyah}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}