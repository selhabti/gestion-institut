import { useCallback, useEffect, useMemo as useReactMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import {
  preparerSeance,
  rejouer,
  rejouerAvecAvertissements,
  type AvertissementSeance,
  type EleveMemo,
  type Etat,
  type NouveauStatut,
  type Riwaya,
  type Sens,
  type SeanceComplete,
} from "@/features/memo/logic";
import type { Repere, SurahRef } from "@/features/memo/reperes";

export type MemoSeance = SeanceComplete & { id: string };

export interface MemoProfile {
  eleve_id: string;
  riwaya: Riwaya;
  sens: Sens;
  date_debut: string;
  position_origine: number;
  position_depart: number;
  rythme: number;
  quota_revision: number;
  position: number;
  pointeur_rev: number;
  cycles_faits: number;
}

export interface LegacyMemoRow {
  id: string;
  week_start: string;
  kind: string;
  quantity: string | null;
  surah_from: string | null;
  ayah_from: string | null;
  surah_to: string | null;
  ayah_to: string | null;
  status: string;
  validated: boolean;
}

export interface MemoStartInput {
  riwaya: Riwaya;
  date_debut: string;
  position_origine: number;
  position_depart: number;
  rythme: number;
  quota_revision: number;
}

interface ProfileRow {
  eleve_id: string;
  riwaya: string;
  sens: string;
  date_debut: string;
  position_origine: number | null;
  position_depart: number;
  rythme: number;
  quota_revision: number;
  position: number;
  pointeur_rev: number;
  cycles_faits: number;
}

interface SeanceRow {
  id: string;
  samedi: string;
  nouveau_de: number;
  nouveau_a: number;
  recent_de: number;
  recent_a: number;
  ancien_de: number | null;
  ancien_a: number | null;
  nouveau_statut: NouveauStatut | null;
  nouveau_atteint: number | null;
  recent_ok: boolean | null;
  ancien_ok: boolean | null;
  note: number | null;
  commentaire: string | null;
}

const mapEleve = (row: ProfileRow): EleveMemo => ({
  riwaya: row.riwaya as Riwaya,
  sens: row.sens as Sens,
  date_debut: row.date_debut,
  position_origine: row.position_origine ?? 0,
  position_depart: row.position_depart,
  rythme: row.rythme,
  quota_revision: row.quota_revision,
});

const mapProfile = (row: ProfileRow): MemoProfile => ({
  eleve_id: row.eleve_id,
  riwaya: row.riwaya as Riwaya,
  sens: row.sens as Sens,
  date_debut: row.date_debut,
  position_origine: row.position_origine ?? 0,
  position_depart: row.position_depart,
  rythme: row.rythme,
  quota_revision: row.quota_revision,
  position: row.position,
  pointeur_rev: row.pointeur_rev,
  cycles_faits: row.cycles_faits,
});

const mapSeance = (row: SeanceRow): MemoSeance => ({
  id: row.id,
  samedi: row.samedi,
  nouveau_de: row.nouveau_de,
  nouveau_a: row.nouveau_a,
  recent_de: row.recent_de,
  recent_a: row.recent_a,
  ancien_de: row.ancien_de,
  ancien_a: row.ancien_a,
  nouveau_statut: row.nouveau_statut,
  nouveau_atteint: row.nouveau_atteint,
  recent_ok: row.recent_ok,
  ancien_ok: row.ancien_ok,
  note: row.note,
  commentaire: row.commentaire,
});

const sortSeances = (rows: MemoSeance[]): MemoSeance[] =>
  [...rows].sort((a, b) => a.samedi.localeCompare(b.samedi));

export const useMemo = (memberId: string | null) => {
  const [profile, setProfile] = useState<MemoProfile | null>(null);
  const [seances, setSeances] = useState<MemoSeance[]>([]);
  const [reperes, setReperes] = useState<Repere[]>([]);
  const [surahs, setSurahs] = useState<SurahRef[]>([]);
  const [legacy, setLegacy] = useState<LegacyMemoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!memberId) {
      setProfile(null);
      setSeances([]);
      setLegacy([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [profileRes, seancesRes, reperesRes, surahsRes, legacyRes] =
        await Promise.all([
          supabase
            .from("eleves_memo")
            .select("*")
            .eq("eleve_id", memberId)
            .maybeSingle(),
          supabase
            .from("seances")
            .select("*")
            .eq("eleve_id", memberId)
            .order("samedi", { ascending: true }),
          supabase
            .from("reperes")
            .select("riwaya,sens,huitieme,sourate,verset,page,exact")
            .eq("sens", "fatiha_vers_nas"),
          supabase
            .from("quran_surahs")
            .select("number,name_en,name_translit,ayah_count")
            .order("number"),
          supabase
            .from("memorization")
            .select(
              "id,week_start,kind,quantity,surah_from,ayah_from,surah_to,ayah_to,status,validated"
            )
            .eq("member_id", memberId)
            .order("week_start", { ascending: false }),
        ]);

      setProfile(
        profileRes.data ? mapProfile(profileRes.data as ProfileRow) : null
      );
      setSeances(
        sortSeances(((seancesRes.data ?? []) as SeanceRow[]).map(mapSeance))
      );
      setReperes(((reperesRes.data ?? []) as Repere[]) ?? []);
      setSurahs(
        ((surahsRes.data ?? []) as {
          number: number;
          name_en: string;
          name_translit: string;
          ayah_count: number;
        }[]).map((row) => ({
          number: row.number,
          name: row.name_en || row.name_translit,
          ayahCount: row.ayah_count,
        }))
      );
      setLegacy(((legacyRes.data ?? []) as LegacyMemoRow[]) ?? []);
    } catch (error) {
      console.error("Erreur chargement mémorisation V2:", error);
      toast.error("Impossible de charger le suivi de mémorisation");
    } finally {
      setLoading(false);
    }
  }, [memberId]);

  useEffect(() => {
    void load();
  }, [load]);

  const eleve = useReactMemo(
    () => (profile ? mapEleve(profile as unknown as ProfileRow) : null),
    [profile]
  );

  const replay = useReactMemo(
    () => (eleve ? rejouerAvecAvertissements(eleve, seances) : null),
    [eleve, seances]
  );

  const etat: Etat | null = replay?.etat ?? null;
  const avertissements: AvertissementSeance[] = replay?.avertissements ?? [];

  const reperesFor = useCallback(
    (riwaya: Riwaya) => reperes.filter((repere) => repere.riwaya === riwaya),
    [reperes]
  );

  const etatAvant = useCallback(
    (samedi: string): Etat | null => {
      if (!eleve) return null;
      const before = sortSeances(
        seances.filter(
          (seance) => seance.samedi < samedi && seance.nouveau_statut !== null
        )
      );
      return rejouer(eleve, before);
    },
    [eleve, seances]
  );

  const start = useCallback(
    async (input: MemoStartInput) => {
      if (!memberId) return;
      const { error } = await supabase.from("eleves_memo").insert({
        eleve_id: memberId,
        riwaya: input.riwaya,
        sens: "fatiha_vers_nas",
        date_debut: input.date_debut,
        position_origine: input.position_origine,
        position_depart: input.position_depart,
        rythme: input.rythme,
        quota_revision: input.quota_revision,
        position: input.position_depart,
        pointeur_rev: 0,
        cycles_faits: 0,
        updated_at: new Date().toISOString(),
      });
      if (error) {
        toast.error("Impossible de démarrer le suivi");
        throw error;
      }
      toast.success("Suivi de mémorisation démarré");
      await load();
    },
    [memberId, load]
  );

  const prepareSamedi = useCallback(
    async (samedi: string): Promise<MemoSeance | null> => {
      if (!memberId || !eleve) return null;
      const existing = seances.find((seance) => seance.samedi === samedi);
      if (existing && existing.nouveau_statut !== null) return existing;

      const before = etatAvant(samedi);
      if (!before) return null;
      const draft = preparerSeance(before, eleve, samedi);

      if (
        existing &&
        existing.nouveau_statut === null &&
        existing.nouveau_de === draft.nouveau_de &&
        existing.nouveau_a === draft.nouveau_a &&
        existing.recent_de === draft.recent_de &&
        existing.recent_a === draft.recent_a &&
        existing.ancien_de === draft.ancien_de &&
        existing.ancien_a === draft.ancien_a
      ) {
        return existing;
      }

      const { data, error } = await supabase
        .from("seances")
        .upsert(
          {
            eleve_id: memberId,
            samedi,
            nouveau_de: draft.nouveau_de,
            nouveau_a: draft.nouveau_a,
            recent_de: draft.recent_de,
            recent_a: draft.recent_a,
            ancien_de: draft.ancien_de,
            ancien_a: draft.ancien_a,
            nouveau_statut: existing?.nouveau_statut ?? null,
            nouveau_atteint: existing?.nouveau_atteint ?? null,
            recent_ok: existing?.recent_ok ?? null,
            ancien_ok: existing?.ancien_ok ?? null,
            note: existing?.note ?? null,
            commentaire: existing?.commentaire ?? null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "eleve_id,samedi" }
        )
        .select()
        .single();

      if (error) {
        toast.error("Impossible de préparer la séance");
        throw error;
      }
      const mapped = mapSeance(data as SeanceRow);
      setSeances((prev) =>
        sortSeances([...prev.filter((s) => s.samedi !== samedi), mapped])
      );
      return mapped;
    },
    [memberId, eleve, seances, etatAvant]
  );

  const saveSeance = useCallback(
    async (samedi: string, seance: MemoSeance) => {
      if (!memberId || !eleve) return;
      setSaving(true);
      try {
        const { error } = await supabase.from("seances").upsert(
          {
            eleve_id: memberId,
            samedi,
            nouveau_de: seance.nouveau_de,
            nouveau_a: seance.nouveau_a,
            recent_de: seance.recent_de,
            recent_a: seance.recent_a,
            ancien_de: seance.ancien_de,
            ancien_a: seance.ancien_a,
            nouveau_statut: seance.nouveau_statut,
            nouveau_atteint: seance.nouveau_atteint,
            recent_ok: seance.recent_ok,
            ancien_ok: seance.ancien_ok,
            note: seance.note,
            commentaire: seance.commentaire,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "eleve_id,samedi" }
        );
        if (error) throw error;

        const { data, error: reloadError } = await supabase
          .from("seances")
          .select("*")
          .eq("eleve_id", memberId);
        if (reloadError) throw reloadError;
        const mapped = sortSeances(
          ((data ?? []) as SeanceRow[]).map(mapSeance)
        );
        setSeances(mapped);

        const result = rejouerAvecAvertissements(eleve, mapped);
        const { error: cacheError } = await supabase
          .from("eleves_memo")
          .update({
            position: result.etat.position,
            pointeur_rev: result.etat.pointeur_rev,
            cycles_faits: result.etat.cycles_faits,
            updated_at: new Date().toISOString(),
          })
          .eq("eleve_id", memberId);
        if (cacheError) throw cacheError;

        setProfile((prev) =>
          prev
            ? {
                ...prev,
                position: result.etat.position,
                pointeur_rev: result.etat.pointeur_rev,
                cycles_faits: result.etat.cycles_faits,
              }
            : prev
        );
        toast.success("Séance enregistrée");
      } catch (error) {
        console.error("Erreur enregistrement séance:", error);
        toast.error("Impossible d'enregistrer la séance");
        throw error;
      } finally {
        setSaving(false);
      }
    },
    [memberId, eleve]
  );

  const updateProfile = useCallback(
    async (updates: Partial<MemoStartInput>) => {
      if (!memberId || !profile) return;
      const nextProfile: ProfileRow = {
        ...(profile as unknown as ProfileRow),
        ...updates,
        position_origine:
          updates.position_origine ?? profile.position_origine,
        position_depart: updates.position_depart ?? profile.position_depart,
      };
      const nextEleve = mapEleve(nextProfile);
      const result = rejouerAvecAvertissements(nextEleve, seances);

      const { error } = await supabase
        .from("eleves_memo")
        .update({
          ...updates,
          position: result.etat.position,
          pointeur_rev: result.etat.pointeur_rev,
          cycles_faits: result.etat.cycles_faits,
          updated_at: new Date().toISOString(),
        })
        .eq("eleve_id", memberId);
      if (error) {
        toast.error("Impossible de mettre à jour les réglages");
        throw error;
      }
      setProfile({
        ...nextProfile,
        riwaya: nextProfile.riwaya as Riwaya,
        sens: nextProfile.sens as Sens,
        position_origine: nextProfile.position_origine ?? 0,
        position: result.etat.position,
        pointeur_rev: result.etat.pointeur_rev,
        cycles_faits: result.etat.cycles_faits,
      });
      toast.success("Réglages mis à jour");
    },
    [memberId, profile, seances]
  );

  const deleteProfile = useCallback(async () => {
    if (!memberId) return;
    const { error: seanceError } = await supabase
      .from("seances")
      .delete()
      .eq("eleve_id", memberId);
    if (seanceError) {
      toast.error("Impossible de supprimer les séances");
      throw seanceError;
    }
    const { error } = await supabase
      .from("eleves_memo")
      .delete()
      .eq("eleve_id", memberId);
    if (error) {
      toast.error("Impossible de supprimer le suivi");
      throw error;
    }
    setProfile(null);
    setSeances([]);
    toast.success("Suivi de mémorisation supprimé");
  }, [memberId]);

  const cycleInfo = useReactMemo(() => {
    if (!profile) return { number: 1, percent: 0, zone: 0 };
    const origine = profile.position_origine ?? 0;
    const recentDe = Math.max(
      origine,
      profile.position - 4 * profile.rythme
    );
    const zone = Math.max(0, recentDe - origine);
    const percent =
      zone > 0 ? Math.min(100, Math.round((profile.pointeur_rev / zone) * 100)) : 0;
    return { number: profile.cycles_faits + 1, percent, zone };
  }, [profile]);

  return {
    profile,
    eleve,
    etat,
    avertissements,
    seances,
    reperes,
    surahs,
    legacy,
    loading,
    saving,
    cycleInfo,
    reperesFor,
    etatAvant,
    start,
    prepareSamedi,
    saveSeance,
    updateProfile,
    deleteProfile,
    reload: load,
  };
};
