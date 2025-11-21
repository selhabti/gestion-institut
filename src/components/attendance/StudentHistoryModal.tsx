// src/components/attendance/StudentHistoryModal.tsx
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, X, Calendar, CreditCard, TrendingUp } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import type { StudentHistory } from "@/types/attendance";
import { motion } from "framer-motion";

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
  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toISOString().slice(0, 7)
  );

  const selectedMonthStats = useMemo(() => {
    return student?.monthlyStats.find((stats) => stats.month === selectedMonth);
  }, [student?.monthlyStats, selectedMonth]);

  const availableMonths = useMemo(() => {
    if (!student?.monthlyStats) return [];
    return student.monthlyStats
      .map((stats) => stats.month)
      .sort()
      .reverse();
  }, [student?.monthlyStats]);

  // Met à jour le mois sélectionné quand l'élève change
  useEffect(() => {
    if (student?.monthlyStats && student.monthlyStats.length > 0) {
      const latest = student.monthlyStats
        .map((s) => s.month)
        .sort()
        .reverse()[0];
      setSelectedMonth(latest);
    }
  }, [student]);

  if (!student) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto bg-card/95 backdrop-blur-xl border-border/80 shadow-2xl">
        <DialogHeader>
          <div id="student-history-description" className="sr-only">
            Historique des présences et paiements de {student.firstName}{" "}
            {student.lastName}
          </div>

          {/* HEADER DE LA MODALE */}
          <DialogTitle className="text-left">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8 py-8"
            >
              {/* AVATAR – Version corrigée et magnifique */}
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="shrink-0"
              >
                <div className="relative">
                  {/* Glow noir subtil extérieur */}
                  <div className="absolute -inset-1 bg-black/20 rounded-3xl blur-xl" />

                  {/* Avatar principal */}
                  <div className="relative w-24 h-24 rounded-3xl bg-gradient-to-tr from-primary via-primary/80 to-primary/60 flex items-center justify-center text-white text-4xl font-geist-bold shadow-2xl ring-8 ring-black/10 ring-offset-4 ring-offset-background">
                    {student.firstName.charAt(0).toUpperCase()}
                  </div>

                  {/* Liseré intérieur noir ultra-fin */}
                  <div className="absolute inset-1 rounded-3xl ring-4 ring-inset ring-black/15 pointer-events-none" />
                </div>
              </motion.div>

              {/* Nom + infos */}
              <div className="text-center sm:text-left space-y-4">
                <motion.h2
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-5xl md:text-6xl font-geist-thin tracking-wider leading-tight"
                >
                  <span className="text-foreground/90">
                    {student.firstName.charAt(0).toUpperCase() +
                      student.firstName.slice(1).toLowerCase()}
                  </span>{" "}
                  <span className="font-geist-semibold tracking-widest uppercase bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                    {student.lastName.toUpperCase()}
                  </span>
                </motion.h2>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="flex items-center gap-4 text-foreground/80 justify-center sm:justify-start"
                >
                  <span className="font-geist-medium text-base tracking-wider">
                    Élève
                  </span>
                  <div className="w-px h-5 bg-foreground/30" />
                  <span className="font-geist-medium text-base tracking-wider">
                    Groupe
                  </span>
                  <Badge
                    variant="secondary"
                    className="ml-3 px-4 py-1.5 text-sm font-geist-semibold tracking-widest bg-primary/10 text-primary border border-primary/30"
                  >
                    {student.group}
                  </Badge>
                </motion.div>
              </div>
            </motion.div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-8 mt-6">
          {/* SÉLECTEUR DE MOIS – Version finale validée */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="overflow-hidden border-border/80 bg-card/95 backdrop-blur-sm shadow-xl">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-lg">
                  <div className="p-3 rounded-2xl bg-gradient-to-br from-primary to-primary/80 shadow-lg">
                    <Calendar className="h-6 w-6 text-white" />
                  </div>
                  <span className="font-geist-medium tracking-tight">
                    Sélection de la période
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-3 bg-muted/70 rounded-2xl ring-1 ring-border/60">
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
                            flex-1 relative py-4 text-sm font-geist-semibold tracking-widest transition-all duration-300
                            ${
                              isActive
                                ? "text-primary"
                                : "text-muted-foreground hover:text-foreground"
                            }
                          `}
                        >
                          {label}
                          {isActive && (
                            <motion.div
                              layoutId="activeMonthUnderline"
                              className="absolute inset-x-6 bottom-3 h-1 bg-primary rounded-full shadow-lg"
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Stats du mois */}
                {selectedMonthStats && (
                  <div className="grid grid-cols-3 gap-6">
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      className="text-center p-6 rounded-3xl bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/30 backdrop-blur-sm"
                    >
                      <p className="text-5xl font-geist-bold text-emerald-600">
                        {selectedMonthStats.presentSessions}
                      </p>
                      <p className="mt-2 text-sm font-geist-medium text-emerald-700 tracking-widest uppercase">
                        Présent
                      </p>
                    </motion.div>

                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      className="text-center p-6 rounded-3xl bg-gradient-to-br from-rose-500/10 to-rose-600/5 border border-rose-500/30 backdrop-blur-sm"
                    >
                      <p className="text-5xl font-geist-bold text-rose-600">
                        {selectedMonthStats.absentSessions}
                      </p>
                      <p className="mt-2 text-sm font-geist-medium text-rose-700 tracking-widest uppercase">
                        Absent
                      </p>
                    </motion.div>

                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      className="relative text-center p-6 rounded-3xl bg-gradient-to-br from-primary/10 to-primary/20 border border-primary/40 overflow-hidden backdrop-blur-sm"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-60" />
                      <p className="relative text-5xl font-geist-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                        {selectedMonthStats.attendanceRate}%
                      </p>
                      <p className="relative mt-2 text-sm font-geist-medium text-primary/80 tracking-widest uppercase">
                        Taux de présence
                      </p>
                      <div className="absolute top-3 right-3 px-3 py-1.5 rounded-full bg-primary text-white text-xs font-geist-bold shadow-xl">
                        ACTIF
                      </div>
                    </motion.div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Paiement */}
          {selectedMonthStats && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Card className="border-border/80 bg-card/95 backdrop-blur-sm shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <CreditCard className="h-6 w-6 text-primary" />
                    <span className="font-geist-medium">
                      Statut de paiement •{" "}
                      {new Date(selectedMonth + "-01").toLocaleDateString(
                        "fr-FR",
                        {
                          month: "long",
                          year: "numeric",
                        }
                      )}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div
                    className={`flex items-center justify-between p-6 rounded-2xl border-2 ${
                      selectedMonthStats.paymentStatus.status === "paid"
                        ? "bg-emerald-50/80 border-emerald-300"
                        : "bg-rose-50/80 border-rose-300"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`p-4 rounded-2xl ${
                          selectedMonthStats.paymentStatus.status === "paid"
                            ? "bg-emerald-500 text-white"
                            : "bg-rose-500 text-white"
                        } shadow-xl`}
                      >
                        <CreditCard className="h-8 w-8" />
                      </div>
                      <div>
                        <p className="text-xl font-geist-semibold">
                          {selectedMonthStats.paymentStatus.status === "paid"
                            ? "Cotisation réglée"
                            : "Cotisation en attente"}
                        </p>
                        {selectedMonthStats.paymentStatus.dueDate && (
                          <p className="text-sm text-muted-foreground">
                            Échéance :{" "}
                            {new Date(
                              selectedMonthStats.paymentStatus.dueDate
                            ).toLocaleDateString("fr-FR")}
                          </p>
                        )}
                      </div>
                    </div>
                    <Badge
                      variant={
                        selectedMonthStats.paymentStatus.status === "paid"
                          ? "default"
                          : "destructive"
                      }
                      className="text-lg px-6 py-2"
                    >
                      {selectedMonthStats.paymentStatus.status === "paid"
                        ? "PAYÉ"
                        : "IMPAYÉ"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Détail des séances */}
          {selectedMonthStats && selectedMonthStats.sessions.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              <Card className="border-border/80 bg-card/95 backdrop-blur-sm shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <TrendingUp className="h-6 w-6 text-primary" />
                    <span className="font-geist-medium">
                      Détail des séances
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedMonthStats.sessions.map((session) => (
                    <motion.div
                      key={session.date}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`flex items-center justify-between p-5 rounded-2xl border-2 transition-all hover:shadow-lg ${
                        session.status === "present"
                          ? "bg-emerald-50/70 border-emerald-300"
                          : session.status === "absent"
                          ? "bg-rose-50/70 border-rose-300"
                          : "bg-muted/50 border-border"
                      }`}
                    >
                      <div className="flex items-center gap-5">
                        <div
                          className={`p-3 rounded-2xl ${
                            session.status === "present"
                              ? "bg-emerald-500 text-white"
                              : session.status === "absent"
                              ? "bg-rose-500 text-white"
                              : "bg-muted text-muted-foreground"
                          } shadow-xl`}
                        >
                          {session.status === "present" ? (
                            <Check className="h-6 w-6" />
                          ) : (
                            <X className="h-6 w-6" />
                          )}
                        </div>
                        <div>
                          <p className="font-geist-semibold text-lg">
                            {new Date(session.date).toLocaleDateString(
                              "fr-FR",
                              {
                                weekday: "long",
                                day: "numeric",
                                month: "long",
                              }
                            )}
                          </p>
                          <p className="text-sm text-muted-foreground capitalize">
                            {session.day} • {session.sessionType}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className="text-base px-5 py-2 font-geist-medium"
                      >
                        {session.status === "present"
                          ? "Présent"
                          : session.status === "absent"
                          ? "Absent"
                          : "Non enregistré"}
                      </Badge>
                    </motion.div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Stats globales */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <Card className="border-border/80 bg-card/95 backdrop-blur-sm shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <TrendingUp className="h-6 w-6 text-primary" />
                  <span className="font-geist-medium">Performance globale</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {[
                    {
                      value: student.overallAttendance.overallRate + "%",
                      label: "Taux global",
                      color: "from-primary",
                    },
                    {
                      value: student.overallAttendance.presentCount,
                      label: "Présences",
                      color: "from-emerald-500",
                    },
                    {
                      value: student.overallAttendance.absentCount,
                      label: "Absences",
                      color: "from-rose-500",
                    },
                    {
                      value: student.overallAttendance.totalSessions,
                      label: "Total",
                      color: "from-purple-500",
                    },
                  ].map((stat, i) => (
                    <motion.div
                      key={i}
                      whileHover={{ scale: 1.05 }}
                      className="text-center p-6 rounded-3xl bg-gradient-to-br ${stat.color}/10 to-transparent border border-border/50 backdrop-blur-sm"
                    >
                      <p
                        className={`text-5xl font-geist-bold bg-gradient-to-r ${
                          stat.color
                        } to-${
                          stat.color.split("-")[1]
                        }-600 bg-clip-text text-transparent`}
                      >
                        {stat.value}
                      </p>
                      <p className="mt-2 text-sm font-geist-medium text-muted-foreground tracking-widest uppercase">
                        {stat.label}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
