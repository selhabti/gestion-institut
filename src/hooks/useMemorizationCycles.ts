import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { toYMD } from "@/hooks/useMemorizationPlan";
import { toast } from "sonner";
import type {
  MemorizationCycle,
  MemorizationEntry,
  MemorizationEntrySnapshot,
} from "@/types/member";

const DAY_MS = 24 * 60 * 60 * 1000;
const CYCLE_DAYS = 28;

export type RevisionCategory =
  | "nouvelle"
  | "recente"
  | "ancienne"
  | "tres_ancienne";

export interface CycleInfo {
  number: number;
  start: string;
  end: string;
  daysLeft: number;
}

const startOfDay = (value: Date) => {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
};

const cycleFromIndex = (planStart: string, index: number): CycleInfo => {
  const start = new Date(planStart + "T00:00:00");
  start.setDate(start.getDate() + index * CYCLE_DAYS);
  const end = new Date(start);
  end.setDate(start.getDate() + CYCLE_DAYS - 1);
  const today = startOfDay(new Date());
  const daysLeft = Math.ceil((end.getTime() - today.getTime()) / DAY_MS);
  return {
    number: index + 1,
    start: toYMD(start),
    end: toYMD(end),
    daysLeft,
  };
};

export const currentCycleInfo = (
  planStart: string,
  date = new Date()
): CycleInfo => {
  const start = startOfDay(new Date(planStart + "T00:00:00"));
  const today = startOfDay(date);
  const diffDays = Math.max(
    0,
    Math.floor((today.getTime() - start.getTime()) / DAY_MS)
  );
  const index = Math.floor(diffDays / CYCLE_DAYS);
  return cycleFromIndex(planStart, index);
};

export const pendingCycleInfo = (
  planStart: string,
  cycles: MemorizationCycle[],
  date = new Date()
): { cycle: CycleInfo; overdue: boolean } => {
  const current = currentCycleInfo(planStart, date);
  const done = new Set(
    cycles
      .filter((cycle) => cycle.total_revision_done_at)
      .map((cycle) => cycle.cycle_start)
  );
  for (let index = 0; index < current.number - 1; index++) {
    const cycle = cycleFromIndex(planStart, index);
    if (!done.has(cycle.start)) return { cycle, overdue: true };
  }
  return { cycle: current, overdue: false };
};

export const revisionCategory = (
  weekStart: string,
  cycleStart: string
): RevisionCategory => {
  const entry = startOfDay(new Date(weekStart + "T00:00:00"));
  const cycle = startOfDay(new Date(cycleStart + "T00:00:00"));
  const diffDays = Math.floor((cycle.getTime() - entry.getTime()) / DAY_MS);
  if (diffDays < CYCLE_DAYS) return "nouvelle";
  if (diffDays < CYCLE_DAYS * 2) return "recente";
  if (diffDays < CYCLE_DAYS * 4) return "ancienne";
  return "tres_ancienne";
};

const toSnapshot = (entry: MemorizationEntry): MemorizationEntrySnapshot => ({
  id: entry.id,
  week_start: entry.week_start,
  kind: entry.kind,
  quantity: entry.quantity,
  surah_from: entry.surah_from,
  ayah_from: entry.ayah_from,
  surah_to: entry.surah_to,
  ayah_to: entry.ayah_to,
  status: entry.status,
  validated: entry.validated,
});

export const useMemorizationCycles = (
  memberId: string | null,
  enabled: boolean
) => {
  const [cycles, setCycles] = useState<MemorizationCycle[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!memberId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("memorization_cycles")
        .select("*")
        .eq("member_id", memberId)
        .order("cycle_start", { ascending: false });
      if (error) throw error;
      setCycles((data ?? []) as MemorizationCycle[]);
    } catch (error) {
      console.error("Erreur chargement cycles de révision:", error);
    } finally {
      setLoading(false);
    }
  }, [memberId]);

  useEffect(() => {
    if (enabled && memberId) load();
  }, [enabled, memberId, load]);

  const markTotalRevision = useCallback(
    async (params: {
      cycleNumber: number;
      cycleStart: string;
      cycleEnd: string;
      entries: MemorizationEntry[];
      notes?: string;
    }) => {
      if (!memberId) return;
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { error } = await supabase.from("memorization_cycles").upsert(
        {
          member_id: memberId,
          cycle_number: params.cycleNumber,
          cycle_start: params.cycleStart,
          cycle_end: params.cycleEnd,
          total_revision_done_at: new Date().toISOString(),
          notes: params.notes?.trim() || null,
          parts_snapshot: params.entries.map(toSnapshot),
          created_by: user?.id ?? null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "member_id,cycle_start" }
      );

      if (error) {
        toast.error("Impossible d'enregistrer la révision totale");
        throw error;
      }
      await load();
      toast.success("Révision totale enregistrée");
    },
    [memberId, load]
  );

  const clearTotalRevision = useCallback(
    async (cycleId: string) => {
      const { error } = await supabase
        .from("memorization_cycles")
        .update({
          total_revision_done_at: null,
          parts_snapshot: [],
          updated_at: new Date().toISOString(),
        })
        .eq("id", cycleId);

      if (error) {
        toast.error("Impossible d'annuler la révision totale");
        return;
      }
      await load();
      toast.success("Révision totale annulée");
    },
    [load]
  );

  return {
    cycles,
    loading,
    reload: load,
    markTotalRevision,
    clearTotalRevision,
  };
};
