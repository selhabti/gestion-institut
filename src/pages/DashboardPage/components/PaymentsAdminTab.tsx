// src/pages/DashboardPage/components/PaymentsAdminTab.tsx
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Wallet, Search, AlertTriangle, CreditCard } from "lucide-react";
import type { Member } from "@/types/member";
import { PaymentPlanSection } from "@/components/attendance/PaymentPlanSection";
import { TOTAL_DUE } from "@/hooks/usePaymentPlan";
import { capitalize } from "@/lib/utils";

interface PaymentsAdminTabProps {
  members: Member[];
}

export const PaymentsAdminTab = ({ members }: PaymentsAdminTabProps) => {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Member | null>(null);

  const today = new Date(new Date().toISOString().split("T")[0]);

  const rows = useMemo(() => {
    return members
      .filter((m) =>
        `${m.firstName} ${m.lastName} ${m.city || ""}`
          .toLowerCase()
          .includes(search.toLowerCase())
      )
      .map((m) => {
        const plan = m.paymentPlan || [];
        const total = plan.reduce((s, e) => s + Number(e.amount || 0), 0);
        const paid = plan
          .filter((e) => e.paid)
          .reduce((s, e) => s + Number(e.amount || 0), 0);
        const overdue = plan.some(
          (e) => !e.paid && e.due_date && new Date(e.due_date) < today
        );
        return { member: m, total, paid, overdue, hasPlan: plan.length > 0 };
      })
      .sort((a, b) => {
        if (a.overdue !== b.overdue) return a.overdue ? -1 : 1;
        return a.member.lastName.localeCompare(b.member.lastName);
      });
  }, [members, search]);

  const relances = rows.filter((r) => r.overdue).length;
  const encaisse = rows.reduce((s, r) => s + r.paid, 0);

  return (
    <div className="space-y-6">
      {/* Résumé */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-slate-500">Total encaissé</p>
            <p className="text-2xl font-bold text-emerald-600">{encaisse}€</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-slate-500">Élèves à relancer</p>
            <p className="text-2xl font-bold text-red-600">{relances}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-slate-500">Objectif par élève</p>
            <p className="text-2xl font-bold text-slate-800">{TOTAL_DUE}€</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 gap-4">
          <CardTitle className="flex items-center gap-3">
            <Wallet className="h-5 w-5" />
            Paiements des élèves
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
                  <th className="py-2 pr-4 font-medium">Payé</th>
                  <th className="py-2 pr-4 font-medium">Statut</th>
                  <th className="py-2 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ member, paid, total, overdue, hasPlan }) => (
                  <tr
                    key={member.id}
                    className="border-b last:border-0 hover:bg-slate-50"
                  >
                    <td className="py-3 pr-4">
                      <span className="font-medium">
                        {capitalize(member.firstName)}
                      </span>{" "}
                      <span className="font-bold uppercase">
                        {member.lastName}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-slate-600">
                      {hasPlan ? `${paid}€ / ${total}€` : "—"}
                    </td>
                    <td className="py-3 pr-4">
                      {overdue ? (
                        <Badge className="bg-red-500 text-white">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Relance
                        </Badge>
                      ) : hasPlan && total > 0 && paid >= total ? (
                        <Badge className="bg-emerald-500 text-white">Payé</Badge>
                      ) : hasPlan ? (
                        <Badge variant="outline">En cours</Badge>
                      ) : (
                        <Badge variant="outline">Aucun plan</Badge>
                      )}
                    </td>
                    <td className="py-3">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelected(member)}
                      >
                        <CreditCard className="h-4 w-4 mr-1" />
                        Gérer
                      </Button>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="py-6 text-center text-slate-400"
                    >
                      Aucun élève
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Gestion du plan pour l'élève sélectionné */}
      <Dialog
        open={!!selected}
        onOpenChange={(o) => {
          if (!o) setSelected(null);
        }}
      >
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Paiement —{" "}
              {selected
                ? `${capitalize(selected.firstName)} ${capitalize(
                    selected.lastName
                  )}`
                : ""}
            </DialogTitle>
            <DialogDescription>
              Gérez le plan de paiement et les échéances.
            </DialogDescription>
          </DialogHeader>
          {selected && (
            <PaymentPlanSection memberId={selected.id} enabled={!!selected} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PaymentsAdminTab;
