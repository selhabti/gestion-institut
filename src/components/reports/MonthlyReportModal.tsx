import { useState, useEffect, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users, CheckCircle, CreditCard, TrendingUp, BarChart3,
  Download, X, Target, Clock, ChevronLeft, ChevronRight
} from "lucide-react";
import type { Member } from "@/types/member";

interface MonthlyReportModalProps {
  members: Member[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const MonthlyReportModal = ({
  members,
  open,
  onOpenChange,
}: MonthlyReportModalProps) => {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  );

  useEffect(() => {
    if (open) {
      const n = new Date();
      setSelectedMonth(`${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}`);
    }
  }, [open]);

  const monthName = useMemo(() => {
    const [y, m] = selectedMonth.split("-");
    const d = new Date(parseInt(y), parseInt(m) - 1);
    return d.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  }, [selectedMonth]);

  const goToPrevMonth = () => {
    setSelectedMonth((prev) => {
      const [y, m] = prev.split("-").map(Number);
      const d = new Date(y, m - 2);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    });
  };

  const goToNextMonth = () => {
    setSelectedMonth((prev) => {
      const [y, m] = prev.split("-").map(Number);
      const d = new Date(y, m);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    });
  };

  const stats = useMemo(() => {
    let totalPresent = 0;
    let totalAttendances = 0;

    members.forEach((m) => {
      const monthlyAttendances = (m.attendances || []).filter((a) => {
        if (!a.date?.startsWith(selectedMonth)) return false;
        const day = new Date(a.date).getDay();
        return day === 0 || day === 1 || day === 6;
      });
      monthlyAttendances.forEach((a) => {
        totalAttendances++;
        if (a.status === "present") totalPresent++;
      });
    });

    const paidThisMonth = members.filter((m) =>
      m.payments.some((p) => p.date?.startsWith(selectedMonth))
    ).length;

    return {
      totalStudents: members.length,
      byGroup: members.reduce((acc, m) => {
        acc[m.group] = (acc[m.group] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      paidThisMonth,
      presenceRate: totalAttendances > 0
        ? Math.round((totalPresent / totalAttendances) * 100)
        : 0,
      paymentRate: members.length > 0
        ? Math.round((paidThisMonth / members.length) * 100)
        : 0,
    };
  }, [members, selectedMonth]);

  if (!open) return null;

  const isCurrentMonth =
    selectedMonth ===
    `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-xl z-50 flex items-center justify-center p-4"
      onClick={() => onOpenChange(false)}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="bg-white/95 backdrop-blur-xl rounded-3xl border-2 border-black/10 shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER PREMIUM */}
        <div className="relative p-8 pb-6 border-b border-black/5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                <BarChart3 className="h-8 w-8" />
              </div>
              <div>
                <h2 className="text-3xl font-geist-black">
                  Rapport Mensuel Détaillé
                </h2>
                <p className="text-indigo-100 font-geist-medium text-lg">
                  {monthName} • Analyse complète des performances
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-12 w-12 rounded-2xl bg-white/20 hover:bg-white/30 text-white"
            >
              <X className="h-6 w-6" />
            </Button>
          </div>

          {/* Navigation des mois */}
          <div className="flex items-center justify-center gap-4 mt-6">
            <Button variant="ghost" size="sm" onClick={goToPrevMonth} className="text-white/80 hover:text-white">
              <ChevronLeft className="h-5 w-5 mr-1" />
              Mois précédent
            </Button>
            <span className="text-white font-geist-bold text-lg capitalize">{monthName}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={goToNextMonth}
              disabled={isCurrentMonth}
              className="text-white/80 hover:text-white disabled:opacity-30"
            >
              Mois suivant
              <ChevronRight className="h-5 w-5 ml-1" />
            </Button>
          </div>
        </div>

        {/* CONTENU */}
        <div className="overflow-y-auto max-h-[calc(95vh-200px)]">
          <div className="p-8 space-y-8">
            {/* === KPI PRINCIPAUX === */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl border border-blue-200 p-6 text-center">
                <Users className="h-10 w-10 text-blue-600 mx-auto mb-3" />
                <div className="text-3xl font-geist-black text-blue-700">
                  {stats.totalStudents}
                </div>
                <p className="text-blue-800 font-geist-bold">Élèves total</p>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl border border-green-200 p-6 text-center">
                <Target className="h-10 w-10 text-green-600 mx-auto mb-3" />
                <div className="text-3xl font-geist-black text-green-700">
                  {stats.presenceRate}%
                </div>
                <p className="text-green-800 font-geist-bold">Taux présence</p>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl border border-purple-200 p-6 text-center">
                <TrendingUp className="h-10 w-10 text-purple-600 mx-auto mb-3" />
                <div className="text-3xl font-geist-black text-purple-700">
                  {stats.paymentRate}%
                </div>
                <p className="text-purple-800 font-geist-bold">Cotisations</p>
              </div>

              <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl border border-orange-200 p-6 text-center">
                <CreditCard className="h-10 w-10 text-orange-600 mx-auto mb-3" />
                <div className="text-3xl font-geist-black text-orange-700">
                  {stats.paidThisMonth * 20}€
                </div>
                <p className="text-orange-800 font-geist-bold">
                  Revenus estimés
                </p>
              </div>
            </div>

            {/* === GRID DE STATISTIQUES DÉTAILLÉES === */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* OBJECTIFS DU MOIS */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-black/10 p-6">
                <h3 className="text-2xl font-geist-black text-slate-900 mb-6 flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl">
                    <Target className="h-6 w-6 text-white" />
                  </div>
                  Objectifs du Mois
                </h3>

                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-blue-50 rounded-xl border border-blue-200">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-8 w-8 text-green-600" />
                      <span className="font-geist-bold text-slate-800">
                        Élèves cotisés
                      </span>
                    </div>
                    <Badge className="bg-green-500 text-white px-3 py-2 text-lg font-geist-black">
                      {stats.paidThisMonth}
                    </Badge>
                  </div>

                  <div className="flex justify-between items-center p-4 bg-red-50 rounded-xl border border-red-200">
                    <div className="flex items-center gap-3">
                      <Clock className="h-8 w-8 text-red-600" />
                      <span className="font-geist-bold text-slate-800">
                        En attente de paiement
                      </span>
                    </div>
                    <Badge className="bg-red-500 text-white px-3 py-2 text-lg font-geist-black">
                      {stats.totalStudents - stats.paidThisMonth}
                    </Badge>
                  </div>

                  <div className="flex justify-between items-center p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                    <div className="flex items-center gap-3">
                      <TrendingUp className="h-8 w-8 text-yellow-600" />
                      <span className="font-geist-bold text-slate-800">
                        Taux de réussite
                      </span>
                    </div>
                    <Badge className="bg-yellow-500 text-white px-3 py-2 text-lg font-geist-black">
                      {stats.totalStudents > 0
                        ? Math.round((stats.paidThisMonth / stats.totalStudents) * 100)
                        : 0}%
                    </Badge>
                  </div>
                </div>
              </div>

              {/* RÉPARTITION PAR GROUPE */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-black/10 p-6">
                <h3 className="text-2xl font-geist-black text-slate-900 mb-6 flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  Répartition par groupe
                </h3>

                <div className="space-y-3">
                  {Object.entries(stats.byGroup).map(([group, count]) => (
                    <div
                      key={group}
                      className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200"
                    >
                      <span className="font-geist-bold text-slate-800">
                        {group === "Lundi"
                          ? "Méthode Nouraniya"
                          : `Groupe ${group}`}
                      </span>
                      <Badge
                        variant="secondary"
                        className="text-lg px-4 py-2 font-geist-black"
                      >
                        {count} élève{count > 1 ? "s" : ""}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* === PERFORMANCE GLOBALE === */}
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-200 p-8">
              <h3 className="text-2xl font-geist-black text-slate-900 mb-6 text-center">
                Performance Globale du Centre
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                <div className="bg-white/80 rounded-2xl p-6 border border-indigo-100">
                  <div className="text-5xl font-geist-black text-indigo-700">
                    {stats.presenceRate}%
                  </div>
                  <p className="text-indigo-800 font-geist-bold mt-2">
                    Assiduité moyenne
                  </p>
                </div>

                <div className="bg-white/80 rounded-2xl p-6 border border-green-100">
                  <div className="text-5xl font-geist-black text-green-700">
                    {stats.paymentRate}%
                  </div>
                  <p className="text-green-800 font-geist-bold mt-2">
                    Cotisations réglées
                  </p>
                </div>

                <div className="bg-white/80 rounded-2xl p-6 border border-purple-100">
                  <div className="text-5xl font-geist-black text-purple-700">
                    {Math.round((stats.presenceRate + stats.paymentRate) / 2)}%
                  </div>
                  <p className="text-purple-800 font-geist-bold mt-2">
                    Score global
                  </p>
                </div>
              </div>
            </div>

            {/* === BOUTON D'EXPORT === */}
            <div className="flex justify-center pt-4">
              <Button
                onClick={() => {
                  const csvData =
                    `RAPPORT MENSUEL - ${monthName}\n\n` +
                    `Statistiques Générales\n` +
                    `Total élèves,${stats.totalStudents}\n` +
                    `Taux de présence,${stats.presenceRate}%\n` +
                    `Taux de cotisation,${stats.paymentRate}%\n` +
                    `Revenus estimés,${stats.paidThisMonth * 20}€\n\n` +
                    `Répartition par Groupe\n` +
                    `Groupe,Nombre d'élèves\n` +
                    Object.entries(stats.byGroup)
                      .map(([g, c]) => `${g},${c}`)
                      .join("\n") +
                    "\n\n" +
                    `Performance Financière\n` +
                    `Élèves cotisés,${stats.paidThisMonth}\n` +
                    `En attente,${stats.totalStudents - stats.paidThisMonth}\n` +
                    `Taux de réussite,${Math.round(
                      (stats.paidThisMonth / stats.totalStudents) * 100
                    )}%`;

                  const blob = new Blob([csvData], {
                    type: "text/csv;charset=utf-8;",
                  });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `rapport-mensuel-${monthName.replace(" ", "-")}.csv`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                }}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-geist-bold px-8 py-3 rounded-2xl shadow-xl"
              >
                <Download className="h-5 w-5 mr-2" />
                Exporter le rapport complet (CSV)
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default MonthlyReportModal;
