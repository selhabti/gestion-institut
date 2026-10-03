import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import type { MemorizationEntry } from "@/types/member";

export type Riwaya = "Hafs" | "Warsh";

export const useMemorization = (memberId: string | null, enabled: boolean) => {
  const [riwaya, setRiwaya] = useState<Riwaya | null>(null);
  const [tajwidLevel, setTajwidLevel] = useState<string>("");
  const [entries, setEntries] = useState<MemorizationEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!memberId) return;
    setLoading(true);
    try {
      const { data: member } = await supabase
        .from("members")
        .select("riwaya, tajwid_level")
        .eq("id", memberId)
        .single();

      setRiwaya((member?.riwaya as Riwaya) ?? null);
      setTajwidLevel(member?.tajwid_level ?? "");

      const { data, error } = await supabase
        .from("memorization")
        .select("*")
        .eq("member_id", memberId)
        .order("week_start", { ascending: false });

      if (error) throw error;
      setEntries((data || []) as MemorizationEntry[]);
    } catch (error) {
      console.error("Erreur chargement mémorisation:", error);
    } finally {
      setLoading(false);
    }
  }, [memberId]);

  useEffect(() => {
    if (enabled && memberId) load();
  }, [enabled, memberId, load]);

  const saveRiwaya = useCallback(
    async (value: Riwaya) => {
      if (!memberId) return;
      setRiwaya(value);
      const { error } = await supabase
        .from("members")
        .update({ riwaya: value })
        .eq("id", memberId);
      if (error) toast.error("Impossible d'enregistrer la riwaya");
      else toast.success("Riwaya enregistrée");
    },
    [memberId]
  );

  const saveTajwid = useCallback(
    async (value: string) => {
      if (!memberId) return;
      const { error } = await supabase
        .from("members")
        .update({ tajwid_level: value })
        .eq("id", memberId);
      if (error) toast.error("Impossible d'enregistrer le niveau de tajwid");
    },
    [memberId]
  );

  const upsertEntry = useCallback(
    async (weekStart: string, quantity: string) => {
      if (!memberId) return;
      const { error } = await supabase.from("memorization").upsert(
        {
          member_id: memberId,
          week_start: weekStart,
          quantity: quantity || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "member_id,week_start" }
      );
      if (error) {
        toast.error("Impossible d'enregistrer la mémorisation");
        throw error;
      }
      await load();
    },
    [memberId, load]
  );

  const setValidated = useCallback(
    async (entry: MemorizationEntry, validated: boolean) => {
      const { error } = await supabase
        .from("memorization")
        .update({
          validated,
          validated_at: validated ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", entry.id);
      if (error) {
        toast.error("Impossible de mettre à jour la validation");
        return;
      }
      setEntries((prev) =>
        prev.map((e) => (e.id === entry.id ? { ...e, validated } : e))
      );
    },
    []
  );

  const deleteEntry = useCallback(async (id: string) => {
    const { error } = await supabase.from("memorization").delete().eq("id", id);
    if (error) {
      toast.error("Impossible de supprimer");
      return;
    }
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }, []);

  return {
    riwaya,
    tajwidLevel,
    entries,
    loading,
    saveRiwaya,
    saveTajwid,
    upsertEntry,
    setValidated,
    deleteEntry,
    reload: load,
  };
};
