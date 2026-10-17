// src/pages/DashboardPage/components/MonthlyPaymentsTab.tsx
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Wallet, Search, Check } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import type { Member } from "@/types/member";
import { capitalize } from "@/lib/utils";

// Cotisation mensuelle par groupe
const GROUP_FEES: Record<string, number> = {
  Jeudi: 10,
  Dimanche: 20,
  Lundi: 20,
  Samedi: 20,
};

export const getGroupFee = (group: string): number =>
  GROUP_FEES[group] ?? 20;

interface MonthlyPaymentsTabProps {
  members: Member[];
}

export function MonthlyPaymentsTab({ members }: MonthlyPaymentsTabProps) {
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const currentMonth = new Date().toISOString().slice(0, 7);

  const rows = useMemo(
    () =>
      members
        .filter((m) =>
          `${m.firstName} ${m.lastName}`
            .toLowerCase()
            .includes(search.toLowerCase())
        )
        .map((m) => {
          const payment = (m.payments || []).find((p) =>
            p.date?.startsWith(currentMonth)
          );
          return {
            member: m,
            fee: getGroupFee(m.group),
            paid: Boolean(payment),
            paymentId: payment?.id,
          };
        })
        .sort((a, b) => a.member.lastName.localeCompare(b.member.lastName)),
    [members, search, currentMonth]
  );

  const markPaid = async (row: (typeof rows)[number]) => {
    setBusyId(row.member.id);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const { error } = await supabase.from("payments").insert({
        member_id: row.member.id,
        payment_date: new Date().toISOString().split("T")[0],
        amount: row.fee,
        created_by: user?.id ?? null,
      });
      if (error) throw error;
      toast.success(`Paiement de ${row.fee}€ enregistré`);
      setTimeout(() => window.location.reload(), 600);
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors du paiement");
    } finally {
      setBusyId(null);
    }
  };

  const unmark = async (row: (typeof rows)[number]) => {
    if (!row.paymentId) return;
    if (!confirm(`Annuler le paiement de ${row.member.firstName} ?`)) return;
    setBusyId(row.member.id);
    try {
      const { error } = await supabase
        .from("payments")
        .delete()
        .eq("id", row.paymentId);
      if (error) throw error;
      toast.success("Paiement annulé");
      setTimeout(() => window.location.reload(), 600);
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de l'annulation");
    } finally {
      setBusyId(null);
    }
  };

  const paidCount = rows.filter((r) => r.paid).length;
  const collected = rows
    .filter((r) => r.paid)
    .reduce((s, r) => s + r.fee, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-slate-500">Encaissé ce mois</p>
            <p className="text-2xl font-bold text-emerald-600">{collected}€</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-slate-500">Élèves à jour</p>
            <p className="text-2xl font-bold text-slate-800">
              {paidCount}/{rows.length}
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
        <CardHeader className="flex flex-row items-center justify-between space-y-0 gap-4">
          <CardTitle className="flex items-center gap-3">
            <Wallet className="h-5 w-5" />
            Cotisations du mois
          </CardTitle>
          <div className="relative">
            <Search className="h-4 w-4 absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher…"
              className="pl-8 w-56"
            />
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
                  <th className="py-2 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
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
                      {row.paid ? (
                        <Badge className="bg-emerald-500 text-white">
                          Payé
                        </Badge>
                      ) : (
                        <Badge variant="outline">En attente</Badge>
                      )}
                    </td>
                    <td className="py-3">
                      {row.paid ? (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busyId === row.member.id}
                          onClick={() => unmark(row)}
                        >
                          Annuler
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          disabled={busyId === row.member.id}
                          onClick={() => markPaid(row)}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Marquer payé
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
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
    </div>
  );
}

export default MonthlyPaymentsTab;
