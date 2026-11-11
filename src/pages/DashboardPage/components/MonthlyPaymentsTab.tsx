// src/pages/DashboardPage/components/MonthlyPaymentsTab.tsx
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Wallet,
  Search,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  EyeOff,
  RotateCcw,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import type { Member } from "@/types/member";
import { capitalize } from "@/lib/utils";
import { getGroupFee } from "@/lib/fees";
import { formatDateForInput } from "@/utils/dateUtils";
import { usePaymentExclusions } from "@/hooks/usePaymentExclusions";

const MONTHS_FR = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
];

// Mois courant au format YYYY-MM (heure locale)
const currentMonth = () => formatDateForInput(new Date()).slice(0, 7);

const monthLabel = (ym: string) => {
  const [year, month] = ym.split("-").map(Number);
  return `${MONTHS_FR[month - 1] ?? ""} ${year}`;
};

interface MonthlyPaymentsTabProps {
  members: Member[];
  onDataChanged?: () => void;
}

export function MonthlyPaymentsTab({
  members,
  onDataChanged,
}: MonthlyPaymentsTabProps) {
  const [search, setSearch] = useState("");
  const [month, setMonth] = useState(currentMonth);
  const [busyId, setBusyId] = useState<string | null>(null);
  // Overrides locaux : `${month}:${memberId}` -> paymentId (null = non payé)
  const [overrides, setOverrides] = useState<Record<string, string | null>>({});
  const { excluded, exclude, include } = usePaymentExclusions(month);

  const shiftMonth = (delta: number) => {
    const [year, monthNumber] = month.split("-").map(Number);
    const d = new Date(year, monthNumber - 1 + delta, 1);
    setMonth(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    );
  };

  const paidIdOf = (m: Member): string | null => {
    const key = `${month}:${m.id}`;
    if (key in overrides) return overrides[key];
    const p = (m.payments || []).find(
      (pp) => String(pp.date || "").slice(0, 7) === month
    );
    return p?.id ?? null;
  };

  const rows = useMemo(
    () =>
      members
        .filter((m) =>
          `${m.firstName} ${m.lastName}`
            .toLowerCase()
            .includes(search.toLowerCase())
        )
        .map((m) => ({
          member: m,
          fee: getGroupFee(m.group),
          paymentId: paidIdOf(m),
          isExcluded: excluded.has(m.id),
        }))
        .sort((a, b) => a.member.lastName.localeCompare(b.member.lastName)),
    [members, search, overrides, month, excluded]
  );

  const activeRows = rows.filter((r) => !r.isExcluded);
  const lateRows = activeRows.filter((r) => !r.paymentId);

  const markPaid = async (row: (typeof rows)[number]) => {
    setBusyId(row.member.id);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      // Paiement d'un mois antérieur : daté dans ce mois (le 1er).
      const paymentDate =
        month === currentMonth()
          ? formatDateForInput(new Date())
          : `${month}-01`;

      const { data, error } = await supabase
        .from("payments")
        .insert({
          member_id: row.member.id,
          payment_date: paymentDate,
          amount: row.fee,
          created_by: user?.id ?? null,
        })
        .select()
        .single();
      if (error) throw error;
      setOverrides((prev) => ({
        ...prev,
        [`${month}:${row.member.id}`]: data.id,
      }));
      toast.success(
        `Paiement de ${row.fee}€ enregistré pour ${monthLabel(month)}`
      );
      onDataChanged?.();
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors du paiement");
    } finally {
      setBusyId(null);
    }
  };

  const unmark = async (row: (typeof rows)[number]) => {
    if (!row.paymentId) return;
    if (
      !confirm(
        `Annuler le paiement de ${row.member.firstName} pour ${monthLabel(
          month
        )} ?`
      )
    )
      return;
    setBusyId(row.member.id);
    try {
      const { error } = await supabase
        .from("payments")
        .delete()
        .eq("id", row.paymentId);
      if (error) throw error;
      setOverrides((prev) => ({
        ...prev,
        [`${month}:${row.member.id}`]: null,
      }));
      toast.success("Paiement annulé");
      onDataChanged?.();
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de l'annulation");
    } finally {
      setBusyId(null);
    }
  };

  const paidCount = activeRows.filter((r) => r.paymentId).length;
  const collected = rows
    .filter((r) => r.paymentId)
    .reduce((s, r) => s + r.fee, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-slate-500">Encaissé — {monthLabel(month)}</p>
            <p className="text-2xl font-bold text-emerald-600">{collected}€</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-slate-500">Élèves à jour</p>
            <p className="text-2xl font-bold text-slate-800">
              {paidCount}/{activeRows.length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-slate-500">Retardataires</p>
            <p className="text-2xl font-bold text-rose-600">
              {lateRows.length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-slate-500">Tarifs</p>
            <p className="text-xs text-slate-600 mt-1">
              Jeudi 10€ • Dimanche 20€ • Nouraniya 20€
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 space-y-0">
          <CardTitle className="flex items-center gap-3">
            <Wallet className="h-5 w-5" />
            Cotisations — {monthLabel(month)}
          </CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => shiftMonth(-1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-semibold w-32 text-center">
              {monthLabel(month)}
            </span>
            <Button variant="outline" size="sm" onClick={() => shiftMonth(1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            {month !== currentMonth() && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMonth(currentMonth())}
              >
                Mois actuel
              </Button>
            )}
            <div className="relative">
              <Search className="h-4 w-4 absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher…"
                className="pl-8 w-48"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-slate-500">
                  <th className="py-2 pr-4 font-medium">Élève</th>
                  <th className="py-2 pr-4 font-medium">Groupe</th>
                  <th className="py-2 pr-4 font-medium">Cotisation</th>
                  <th className="py-2 pr-4 font-medium">Statut</th>
                  <th className="py-2 font-medium">Paiement</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const paid = Boolean(row.paymentId);
                  const isExcluded = row.isExcluded;
                  return (
                    <tr
                      key={row.member.id}
                      className="border-b last:border-0 hover:bg-slate-50"
                    >
                      <td className="py-3 pr-4">
                        <span className="font-medium">
                          {capitalize(row.member.firstName)}
                        </span>{" "}
                        <span className="font-bold uppercase">
                          {row.member.lastName}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <Badge variant="outline">
                          {row.member.group === "Lundi"
                            ? "Nouraniya"
                            : row.member.group}
                        </Badge>
                      </td>
                      <td className="py-3 pr-4 font-semibold">{row.fee}€</td>
                      <td className="py-3 pr-4">
                        {isExcluded ? (
                          <Badge
                            variant="outline"
                            className="bg-slate-100 text-slate-600"
                          >
                            Exclu
                          </Badge>
                        ) : paid ? (
                          <Badge className="bg-emerald-500 text-white">
                            Payé
                          </Badge>
                        ) : (
                          <Badge className="bg-rose-50 text-rose-700 border-rose-200">
                            Retard
                          </Badge>
                        )}
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-1">
                          {isExcluded ? (
                            <button
                              type="button"
                              disabled={busyId === row.member.id}
                              onClick={() => void include(row.member.id)}
                              title="Réintégrer dans la recette et les retardataires"
                              className="h-9 px-3 rounded-xl flex items-center gap-1 border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 text-xs disabled:opacity-50"
                            >
                              <RotateCcw className="h-4 w-4" />
                              Réintégrer
                            </button>
                          ) : (
                            <>
                              <button
                                type="button"
                                disabled={busyId === row.member.id}
                                onClick={() => (paid ? unmark(row) : markPaid(row))}
                                title={paid ? "Annuler le paiement" : "Marquer payé"}
                                className={`h-10 w-10 rounded-xl flex items-center justify-center border transition-colors disabled:opacity-50 ${
                                  paid
                                    ? "bg-emerald-500 text-white border-emerald-600 hover:bg-emerald-600"
                                    : "bg-white text-slate-400 border-slate-200 hover:bg-slate-50"
                                }`}
                              >
                                <CreditCard className="h-5 w-5" />
                              </button>
                              <button
                                type="button"
                                disabled={busyId === row.member.id}
                                onClick={() => void exclude(row.member.id)}
                                title="Ne pas compter cet élève (recette + retardataires)"
                                className="h-9 w-9 rounded-xl flex items-center justify-center border border-slate-200 bg-white text-slate-400 hover:bg-slate-50 disabled:opacity-50"
                              >
                                <EyeOff className="h-4 w-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-400">
                      Aucun élève
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card
        className={
          lateRows.length > 0 ? "border-rose-200" : "border-emerald-200"
        }
      >
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            Retardataires — {monthLabel(month)}
            <Badge
              className={
                lateRows.length > 0
                  ? "bg-rose-100 text-rose-700"
                  : "bg-emerald-100 text-emerald-700"
              }
            >
              {lateRows.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {lateRows.length === 0 ? (
            <p className="text-sm text-emerald-700">
              Tous les élèves sont à jour pour {monthLabel(month)}.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {lateRows.map((r) => (
                <Badge
                  key={r.member.id}
                  variant="outline"
                  className="bg-rose-50 text-rose-700 border-rose-200"
                >
                  {capitalize(r.member.firstName)}{" "}
                  {r.member.lastName.toUpperCase()} • {r.member.group} •{" "}
                  {r.fee}€
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default MonthlyPaymentsTab;
