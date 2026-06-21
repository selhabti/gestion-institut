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
  Clock, Calendar, BarChart3, Euro, FileSpreadsheet
} from "lucide-react";
import { professorHoursService } from "@/services/professorHoursService";
import type { Member } from "@/types/member";
import type { ProfessorSession } from "@/types/professorHours";

const MONTHLY_FEE = 20;
const HOURLY_RATE = 30;

interface FinanceTabProps {
  members: Member[];
}

export const FinanceTab = ({ members }: FinanceTabProps) => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const currentMonthStr = `${currentYear}-${String(currentMonth).padStart(2, "0")}`;

  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr);
  const [professorSessions, setProfessorSessions] = useState<ProfessorSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);

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
  }, [selYear, selMonth]);

  const financeData = useMemo(() => {
    const totalStudents = members.length;

    const paymentsThisMonth = members.flatMap((m) =>
      (m.payments || []).filter((p) => p.date && p.date.startsWith(selectedMonth))
    );

    const paidCount = paymentsThisMonth.length;
    const latePayers = members.filter(
      (m) => !m.payments?.some((p) => p.date && p.date.startsWith(selectedMonth))
    );

    const expectedRevenue = totalStudents * MONTHLY_FEE;
    const collectedRevenue = paymentsThisMonth.reduce((sum, p) => sum + (p.amount || MONTHLY_FEE), 0);

    const totalHours = professorSessions
      .filter((s) => s.status !== "cancelled")
      .reduce((sum, s) => sum + s.actualHours, 0);
    const professorCost = totalHours * HOURLY_RATE;

    const netMargin = collectedRevenue - professorCost;

    return { totalStudents, paidCount, latePayers, expectedRevenue, collectedRevenue, totalHours, professorCost, netMargin };
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
            Suivi des paiements à {MONTHLY_FEE}€/mois par élève et coût professeur à {HOURLY_RATE}€/h
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

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="h-5 w-5 text-orange-500" />
            Heures professeur - {monthLabel}
          </CardTitle>
          <CardDescription>
            {financeData.totalHours}h effectuées - {financeData.professorCost}€
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingSessions ? (
            <div className="text-center py-4 text-slate-500">Chargement...</div>
          ) : professorSessions.length === 0 ? (
            <div className="text-center py-4 text-slate-400">
              Aucune session enregistrée ce mois-ci
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-slate-500">
                    <th className="pb-3 font-medium">Date</th>
                    <th className="pb-3 font-medium">Début</th>
                    <th className="pb-3 font-medium">Fin</th>
                    <th className="pb-3 font-medium">Heures</th>
                    <th className="pb-3 font-medium">Coût</th>
                    <th className="pb-3 font-medium">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {professorSessions.map((s) => (
                    <tr key={s.id} className="border-b last:border-0 hover:bg-slate-50">
                      <td className="py-3">{s.date}</td>
                      <td className="py-3">{s.startTime}</td>
                      <td className="py-3">{s.endTime}</td>
                      <td className="py-3 font-medium">{s.actualHours}h</td>
                      <td className="py-3 font-medium text-orange-600">
                        {s.status !== "cancelled" ? `${(s.actualHours * HOURLY_RATE).toFixed(0)}€` : "—"}
                      </td>
                      <td className="py-3">
                        {s.status === "completed" ? (
                          <Badge className="bg-green-100 text-green-700">Effectué</Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-700">Annulé</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
