import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DollarSign, Users, TrendingUp, TrendingDown,
  Download, AlertTriangle, CheckCircle, XCircle,
  Clock, Calendar, BarChart3, Euro, FileSpreadsheet, Target, RefreshCw
} from "lucide-react";
import { professorHoursService } from "@/services/professorHoursService";
import { SessionsTable } from "@/components/professor/SessionsTable";
import { getGroupFee } from "@/lib/fees";
import type { Member } from "@/types/member";
import type { ProfessorSession } from "@/types/professorHours";

const MONTHLY_FEE = 20;
const HOURLY_RATE = 30;

interface FinanceTabProps {
  members: Member[];
  onRefresh?: () => void;
}

export const FinanceTab = ({ members, onRefresh }: FinanceTabProps) => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const currentMonthStr = `${currentYear}-${String(currentMonth).padStart(2, "0")}`;

  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr);
  const [professorSessions, setProfessorSessions] = useState<ProfessorSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const selYear = parseInt(selectedMonth.split("-")[0]);
  const selMonth = parseInt(selectedMonth.split("-")[1]);

  useEffect(() => {
    const load = async () => {
      setLoadingSessions(true);
      try {
        const sessions = await professorHoursService.getSessionsByMonth(selYear, selMonth);
        setProfessorSessions(sessions);
      } catch {
        setProfessorSessions([]);
      }
      setLoadingSessions(false);
    };
    load();
  }, [selYear, selMonth, refreshKey]);

  const financeData = useMemo(() => {
    const totalStudents = members.length;

    const paymentsThisMonth = members.flatMap((m) =>
      (m.payments || []).filter((p) => p.date && p.date.startsWith(selectedMonth))
    );

    const paidCount = paymentsThisMonth.length;
    const latePayers = members.filter(
      (m) => !m.payments?.some((p) => p.date && p.date.startsWith(selectedMonth))
    );

    const expectedRevenue = members.reduce(
      (sum, m) => sum + getGroupFee(m.group),
      0
    );
    const collectedRevenue = paymentsThisMonth.reduce((sum, p) => sum + (p.amount || MONTHLY_FEE), 0);

    const totalHours = professorSessions
      .filter((s) => s.status !== "cancelled")
      .reduce((sum, s) => sum + s.actualHours, 0);
    const professorCost = totalHours * HOURLY_RATE;

    const netMargin = collectedRevenue - professorCost;
    // Si TOUS les élèves payaient : le coût professeur est-il recouvrable ?
    const projectedMargin = expectedRevenue - professorCost;
    const recoverable = projectedMargin >= 0;

    return {
      totalStudents,
      paidCount,
      latePayers,
      expectedRevenue,
      collectedRevenue,
      totalHours,
      professorCost,
      netMargin,
      projectedMargin,
      recoverable,
    };
  }, [members, selectedMonth, professorSessions]);

  const monthLabel = new Date(selYear, selMonth - 1).toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });

  const handleMonthChange = (delta: number) => {
    const d = new Date(selYear, selMonth - 1 + delta, 1);
    setSelectedMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  };

  const exportCSV = () => {
    const rows = [
      ["Nom", "Prénom", "Groupe", "Ville", "Paiement", "Montant"],
      ...members.map((m) => {
        const payment = (m.payments || []).find((p) => p.date?.startsWith(selectedMonth));
        return [
          m.lastName,
          m.firstName,
          m.group,
          m.city || "",
          payment ? "Payé" : "En attente",
          payment ? `${payment.amount || MONTHLY_FEE}€` : "0€",
        ];
      }),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cotisations-${selectedMonth}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportProfessorCSV = () => {
    const rows = [
      ["Date", "Début", "Fin", "Heures", "Statut", "Notes"],
      ...professorSessions.map((s) => [
        s.date,
        s.startTime,
        s.endTime,
        s.actualHours.toString(),
        s.status === "completed" ? "Effectué" : "Annulé",
        s.notes || "",
      ]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `professeur-${selectedMonth}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Euro className="h-6 w-6 text-emerald-600" />
            Finances - Gestion des cotisations
          </CardTitle>
          <CardDescription>
            Cotisations par groupe (Jeudi 10€ • Dimanche/Nouraniya 20€) et
            coût professeur à {HOURLY_RATE}€/h
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => handleMonthChange(-1)}>
            ←
          </Button>
          <span className="font-semibold text-lg min-w-[180px] text-center capitalize">
            {monthLabel}
          </span>
          <Button variant="outline" size="sm" onClick={() => handleMonthChange(1)}>
            →
          </Button>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => onRefresh?.()}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Rafraîchir
          </Button>
          <Button variant="outline" size="sm" onClick={exportCSV}>
            <Download className="h-4 w-4 mr-1" />
            Cotisations CSV
          </Button>
          <Button variant="outline" size="sm" onClick={exportProfessorCSV}>
            <FileSpreadsheet className="h-4 w-4 mr-1" />
            Professeur CSV
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-blue-600 mb-2">
              <Users className="h-5 w-5" />
              <span className="text-sm font-medium">Revenu attendu</span>
            </div>
            <p className="text-3xl font-bold text-blue-700">
              {financeData.expectedRevenue}€
            </p>
            <p className="text-sm text-slate-500 mt-1">
              {financeData.totalStudents} élèves × {MONTHLY_FEE}€
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-emerald-600 mb-2">
              <TrendingUp className="h-5 w-5" />
              <span className="text-sm font-medium">Revenu collecté</span>
            </div>
            <p className="text-3xl font-bold text-emerald-700">
              {financeData.collectedRevenue}€
            </p>
            <p className="text-sm text-slate-500 mt-1">
              {financeData.paidCount}/{financeData.totalStudents} payé
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-orange-600 mb-2">
              <Clock className="h-5 w-5" />
              <span className="text-sm font-medium">Coût professeur</span>
            </div>
            <p className="text-3xl font-bold text-orange-700">
              {financeData.professorCost}€
            </p>
            <p className="text-sm text-slate-500 mt-1">
              {financeData.totalHours}h × {HOURLY_RATE}€
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-indigo-600 mb-2">
              <BarChart3 className="h-5 w-5" />
              <span className="text-sm font-medium">Marge nette</span>
            </div>
            <p className={`text-3xl font-bold ${financeData.netMargin >= 0 ? "text-emerald-700" : "text-red-700"}`}>
              {financeData.netMargin >= 0 ? "+" : ""}{financeData.netMargin}€
            </p>
            <p className="text-sm text-slate-500 mt-1">
              Collecté - Coût professeur
            </p>
          </CardContent>
        </Card>

        <Card
          className={
            financeData.recoverable ? "border-emerald-200" : "border-red-200"
          }
        >
          <CardContent className="p-6">
            <div
              className={`flex items-center gap-2 mb-2 ${
                financeData.recoverable ? "text-emerald-600" : "text-red-600"
              }`}
            >
              <Target className="h-5 w-5" />
              <span className="text-sm font-medium">Si tout payé</span>
            </div>
            <p
              className={`text-3xl font-bold ${
                financeData.recoverable ? "text-emerald-700" : "text-red-700"
              }`}
            >
              {financeData.projectedMargin >= 0 ? "+" : ""}
              {financeData.projectedMargin}€
            </p>
            <p
              className={`text-sm mt-1 font-medium ${
                financeData.recoverable ? "text-emerald-600" : "text-red-600"
              }`}
            >
              {financeData.recoverable
                ? "Frais prof recouvrables"
                : "Frais prof NON recouvrables"}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Retardataires - {monthLabel}
          </CardTitle>
          <CardDescription>
            {financeData.latePayers.length} élève{financeData.latePayers.length > 1 ? "s" : ""} n{"'"}ont pas encore payé
          </CardDescription>
        </CardHeader>
        <CardContent>
          {financeData.latePayers.length === 0 ? (
            <div className="text-center py-8 text-emerald-600">
              <CheckCircle className="h-12 w-12 mx-auto mb-3" />
              <p className="font-semibold">Tous les élèves ont payé !</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-slate-500">
                    <th className="pb-3 font-medium">Nom</th>
                    <th className="pb-3 font-medium">Prénom</th>
                    <th className="pb-3 font-medium">Groupe</th>
                    <th className="pb-3 font-medium">Cotisation</th>
                    <th className="pb-3 font-medium">Ville</th>
                    <th className="pb-3 font-medium">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {financeData.latePayers.map((m) => (
                    <tr key={m.id} className="border-b last:border-0 hover:bg-slate-50">
                      <td className="py-3 font-medium uppercase">{m.lastName}</td>
                      <td className="py-3 uppercase">{m.firstName}</td>
                      <td className="py-3">
                        <Badge variant="outline">{m.group}</Badge>
                      </td>
                      <td className="py-3 font-semibold">
                        {getGroupFee(m.group)}€
                      </td>
                      <td className="py-3 text-slate-500">{m.city || "—"}</td>
                      <td className="py-3">
                        <Badge className="bg-red-100 text-red-700 border-red-200">
                          <XCircle className="h-3 w-3 mr-1" />
                          En attente
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Heures professeur — tableau éditable (enregistrer / modifier / annuler une séance) */}
      <SessionsTable onChanged={() => setRefreshKey((k) => k + 1)} />
    </div>
  );
};
