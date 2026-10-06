import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import type { PaymentPlanEntry } from "@/types/member";

export const TOTAL_DUE = 150;
export const MAX_INSTALLMENTS = 5;

export interface PlanInstallmentInput {
  amount: number;
  dueDate: string; // YYYY-MM-DD
}

export const usePaymentPlan = (memberId: string | null, enabled: boolean) => {
  const [entries, setEntries] = useState<PaymentPlanEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!memberId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("payment_plan")
        .select("*")
        .eq("member_id", memberId)
        .order("number", { ascending: true });
      if (error) throw error;
      setEntries((data || []) as PaymentPlanEntry[]);
    } catch (error) {
      console.error("Erreur chargement plan de paiement:", error);
    } finally {
      setLoading(false);
    }
  }, [memberId]);

  useEffect(() => {
    if (enabled && memberId) load();
  }, [enabled, memberId, load]);

  const createPlan = useCallback(
    async (installments: PlanInstallmentInput[]) => {
      if (!memberId) return;
      await supabase.from("payment_plan").delete().eq("member_id", memberId);
      const rows = installments.map((it, i) => ({
        member_id: memberId,
        number: i + 1,
        amount: it.amount,
        due_date: it.dueDate || null,
      }));
      const { error } = await supabase.from("payment_plan").insert(rows);
      if (error) {
        toast.error("Impossible d'enregistrer le plan");
        throw error;
      }
      await load();
      toast.success("Plan de paiement enregistré");
    },
    [memberId, load]
  );

  const markPaid = useCallback(
    async (entry: PaymentPlanEntry, paid: boolean) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (paid) {
        const { data, error } = await supabase
          .from("payments")
          .insert({
            member_id: entry.member_id,
            payment_date: new Date().toISOString().split("T")[0],
            amount: entry.amount,
            payment_mode: "plusieurs_fois",
            installment_label: `${entry.number}/${entries.length}`,
            created_by: user?.id ?? null,
          })
          .select()
          .single();
        if (error) {
          toast.error("Impossible d'enregistrer le paiement");
          return;
        }
        const { error: upErr } = await supabase
          .from("payment_plan")
          .update({
            paid: true,
            paid_at: new Date().toISOString(),
            payment_id: data.id,
          })
          .eq("id", entry.id);
        if (upErr) {
          toast.error("Impossible de valider l'échéance");
          return;
        }
      } else {
        if (entry.payment_id) {
          await supabase.from("payments").delete().eq("id", entry.payment_id);
        }
        await supabase
          .from("payment_plan")
          .update({ paid: false, paid_at: null, payment_id: null })
          .eq("id", entry.id);
      }
      await load();
    },
    [entries.length, load]
  );

  const deletePlan = useCallback(async () => {
    if (!memberId) return;
    await supabase.from("payment_plan").delete().eq("member_id", memberId);
    await load();
  }, [memberId, load]);

  const total = entries.reduce((s, e) => s + Number(e.amount || 0), 0);
  const paidTotal = entries
    .filter((e) => e.paid)
    .reduce((s, e) => s + Number(e.amount || 0), 0);
  const hasOverdue = entries.some(
    (e) =>
      !e.paid &&
      e.due_date != null &&
      new Date(e.due_date) < new Date(new Date().toISOString().split("T")[0])
  );

  return {
    entries,
    loading,
    total,
    paidTotal,
    hasOverdue,
    createPlan,
    markPaid,
    deletePlan,
    reload: load,
  };
};
