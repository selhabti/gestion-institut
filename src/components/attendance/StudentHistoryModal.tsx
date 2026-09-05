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
import { Check, X, Calendar, CreditCard, TrendingUp } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import type { StudentHistory } from "@/types/attendance";
import { motion } from "framer-motion";
import { AttendanceService } from "@/services/attendanceService";

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

  // Charger l'historique avec exclusion quand le modal s'ouvre
  useEffect(() => {
    if (student?.studentId && isOpen) {
      loadStudentHistory();
    }
  }, [student?.studentId, isOpen]);

  const loadStudentHistory = async () => {
    setLoading(true);
    try {
      const history = await AttendanceService.getStudentHistoryWithExclusion(student!.studentId);
      setHistoryData(history);
      
      // Sélectionner le mois le plus récent
      if (history.monthlyStats.length > 0) {
        setSelectedMonth(history.monthlyStats[0].month);
      }
    } catch (error) {
      console.error("Erreur chargement historique:", error);
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
  );
}