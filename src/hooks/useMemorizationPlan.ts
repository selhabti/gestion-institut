import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export interface MemorizationPlan {
  member_id: string;
  start_date: string; // YYYY-MM-DD (un samedi)
  start_hizb: number; // 1..60
  start_eighths: number; // 0..7 (fraction de hizb déjà mémorisée au départ)
  weekly_eighths: number; // incrément hebdo en 1/8 de hizb
}

export type MemorizationPlanInput = Omit<MemorizationPlan, "member_id">;

export const useMemorizationPlan = (
  memberId: string | null,
  enabled: boolean
) => {
  const [plan, setPlan] = useState<MemorizationPlan | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!memberId) return;
    setLoading(true);
    try {
      const { data } = await supabase
        .from("memorization_plan")
        .select("*")
        .eq("member_id", memberId)
        .maybeSingle();
      setPlan((data as MemorizationPlan) ?? null);
    } catch (error) {
      console.error("Erreur chargement programme:", error);
    } finally {
      setLoading(false);
    }
  }, [memberId]);

  useEffect(() => {
    if (enabled && memberId) load();
  }, [enabled, memberId, load]);

  const save = useCallback(
    async (input: MemorizationPlanInput) => {
      if (!memberId) return;
      const { error } = await supabase.from("memorization_plan").upsert(
        {
          member_id: memberId,
          ...input,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "member_id" }
      );
      if (error) {
        toast.error("Impossible d'enregistrer le programme");
        throw error;
      }
      await load();
      toast.success("Programme de mémorisation enregistré");
    },
    [memberId, load]
  );

  return { plan, loading, save, reload: load };
};

// ---- Utilitaires de progression (en 1/8 de hizb) ----

export const toYMD = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export const formatEighths = (eighths: number): string => {
  const hizb = Math.floor(eighths / 8);
  const rest = eighths % 8;
  if (rest === 0) return `Hizb ${hizb}`;
  const label = ["", "1/8", "1/4", "3/8", "1/2", "5/8", "3/4", "7/8"][rest];
  return `Hizb ${hizb} + ${label}`;
};

export interface PlannedWeek {
  date: string;
  isPresent: boolean;
  cumulativeEighths: number;
  label: string;
}

/**
 * Calcule, pour chaque samedi depuis le début du programme, la cible cumulée.
 * La cible n'augmente que les semaines où l'élève est PRÉSENT (sinon l'incrément
 * est reporté : la progression suit le nombre de présences, pas le calendrier).
 */
export const computePlannedWeeks = (
  plan: MemorizationPlan,
  presentDates: Set<string>,
  horizonWeeks = 4
): PlannedWeek[] => {
  const result: PlannedWeek[] = [];
  const start = new Date(plan.start_date + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(today);
  end.setDate(end.getDate() + horizonWeeks * 7);

  let presents = 0;
  let d = new Date(start);

  while (d <= end) {
    const ds = toYMD(d);
    const isPresent = presentDates.has(ds);
    if (isPresent) presents += 1;

    const cumulativeEighths =
      plan.start_hizb * 8 +
      plan.start_eighths +
      presents * plan.weekly_eighths;

    result.push({
      date: ds,
      isPresent,
      cumulativeEighths,
      label: formatEighths(cumulativeEighths),
    });

    d.setDate(d.getDate() + 7);
  }

  return result;
};
