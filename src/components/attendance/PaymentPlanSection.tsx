// src/components/attendance/PaymentPlanSection.tsx
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Wallet, Plus, Trash2, AlertTriangle } from "lucide-react";
import {
  usePaymentPlan,
  TOTAL_DUE,
  MAX_INSTALLMENTS,
  type PlanInstallmentInput,
} from "@/hooks/usePaymentPlan";

interface PaymentPlanSectionProps {
  memberId: string | null;
  enabled: boolean;
}

export function PaymentPlanSection({
  memberId,
  enabled,
}: PaymentPlanSectionProps) {
  const plan = usePaymentPlan(memberId, enabled);
  const [count, setCount] = useState(3);
  const [drafts, setDrafts] = useState<PlanInstallmentInput[]>([]);

  useEffect(() => {
    const per = Math.round((TOTAL_DUE / count) * 100) / 100;
    setDrafts(
      Array.from({ length: count }, () => ({ amount: per, dueDate: "" }))
    );
  }, [count]);

  const today = new Date(new Date().toISOString().split("T")[0]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-emerald-600 text-white">
            <Wallet className="h-6 w-6" />
          </div>
          <span>Paiements</span>
        </CardTitle>
        {plan.entries.length > 0 && (
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-sm">
              {plan.paidTotal}€ / {plan.total || TOTAL_DUE}€
            </Badge>
            <Button
              size="sm"
              variant="ghost"
              className="text-red-600 hover:text-red-700"
              onClick={async () => {
                if (confirm("Supprimer le plan de paiement ?")) {
                  await plan.deletePlan();
                }
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {plan.loading ? (
          <p className="text-sm text-muted-foreground">Chargement…</p>
        ) : plan.entries.length === 0 ? (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Total à régler : <b>{TOTAL_DUE}€</b>, en{" "}
              <b>1 à {MAX_INSTALLMENTS} fois</b>. Fixez les dates pour relancer
              aux échéances.
            </p>

            <div className="flex items-center gap-3">
              <Label>Nombre d'échéances</Label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setCount(n)}
                    className={`h-9 w-9 rounded-lg border text-sm font-semibold transition-colors ${
                      count === n
                        ? "bg-emerald-600 text-white border-transparent"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              {drafts.map((d, i) => (
                <div key={i} className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm text-slate-500 w-20">
                    Échéance {i + 1}
                  </span>
                  <Input
                    type="number"
                    value={d.amount}
                    onChange={(e) =>
                      setDrafts((prev) =>
                        prev.map((x, j) =>
                          j === i ? { ...x, amount: Number(e.target.value) } : x
                        )
                      )
                    }
                    className="w-24"
                  />
                  <span className="text-sm text-slate-500">€</span>
                  <Input
                    type="date"
                    value={d.dueDate}
                    onChange={(e) =>
                      setDrafts((prev) =>
                        prev.map((x, j) =>
                          j === i ? { ...x, dueDate: e.target.value } : x
                        )
                      )
                    }
                    className="w-44"
                  />
                </div>
              ))}
            </div>

            <Button onClick={() => plan.createPlan(drafts)}>
              <Plus className="h-4 w-4 mr-1" />
              Créer le plan
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {plan.entries.map((e) => {
              const overdue =
                !e.paid &&
                e.due_date != null &&
                new Date(e.due_date) < today;
              return (
                <div
                  key={e.id}
                  className={`flex items-center justify-between gap-3 p-3 rounded-xl border ${
                    e.paid
                      ? "bg-emerald-50 border-emerald-200"
                      : overdue
                      ? "bg-red-50 border-red-200"
                      : "bg-slate-50 border-slate-200"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-slate-700">
                      {e.number}
                    </span>
                    <div>
                      <p className="font-medium">{e.amount}€</p>
                      <p className="text-xs text-slate-500">
                        {e.due_date
                          ? `Échéance : ${new Date(
                              e.due_date + "T00:00:00"
                            ).toLocaleDateString("fr-FR")}`
                          : "Pas de date"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {e.paid ? (
                      <Badge className="bg-emerald-500 text-white">Payé</Badge>
                    ) : overdue ? (
                      <Badge className="bg-red-500 text-white">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Relance
                      </Badge>
                    ) : (
                      <Badge variant="outline">En attente</Badge>
                    )}
                    <Button
                      size="sm"
                      variant={e.paid ? "outline" : "default"}
                      onClick={() => plan.markPaid(e, !e.paid)}
                    >
                      {e.paid ? "Annuler" : "Marquer payé"}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default PaymentPlanSection;
