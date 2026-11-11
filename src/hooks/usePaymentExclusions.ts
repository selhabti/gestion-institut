import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

/**
 * Élèves exclus de la recette et des retardataires pour un mois donné.
 * L'exclusion ne supprime pas un paiement déjà encaissé.
 */
export const usePaymentExclusions = (month: string) => {
  const [excluded, setExcluded] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("payment_exclusions")
        .select("member_id")
        .eq("month", month);
      if (error) throw error;
      setExcluded(
        new Set(
          ((data || []) as { member_id: string }[]).map((r) => r.member_id)
        )
      );
    } catch (e) {
      console.warn("Chargement des exclusions de paiement impossible:", e);
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const exclude = useCallback(
    async (memberId: string, reason?: string) => {
      const { error } = await supabase
        .from("payment_exclusions")
        .upsert(
          { member_id: memberId, month, reason: reason ?? null },
          { onConflict: "member_id,month" }
        );
      if (error) {
        toast.error("Impossible d'exclure cet élève");
        throw error;
      }
      setExcluded((prev) => new Set(prev).add(memberId));
      toast.success("Élève exclu de la recette et des retardataires");
    },
    [month]
  );

  const include = useCallback(
    async (memberId: string) => {
      const { error } = await supabase
        .from("payment_exclusions")
        .delete()
        .eq("member_id", memberId)
        .eq("month", month);
      if (error) {
        toast.error("Impossible de réintégrer cet élève");
        throw error;
      }
      setExcluded((prev) => {
        const next = new Set(prev);
        next.delete(memberId);
        return next;
      });
      toast.success("Élève réintégré");
    },
    [month]
  );

  return { excluded, loading, exclude, include, reload };
};
