import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export type AppRole = "super_admin" | "admin" | "user";

export interface StaffMember {
  id: string;
  user_id: string;
  email: string | null;
  name: string | null;
  role: AppRole;
  created_at?: string;
}

export interface RegisterStaffResult {
  role: AppRole;
  needsEmailConfirmation: boolean;
}

/**
 * Inscrit un nouveau membre du staff.
 * Le premier compte créé devient super_admin, les suivants admin.
 * (Ces deux rôles ont les mêmes droits dans l'app ; seul le super_admin
 * peut gérer les comptes.)
 */
export const registerStaff = async (
  name: string,
  email: string,
  password: string
): Promise<RegisterStaffResult> => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name } },
  });

  if (error) throw error;

  const user = data?.user;
  if (!user) {
    throw new Error("Compte créé mais session indisponible.");
  }

  const needsEmailConfirmation = !data?.session;

  if (needsEmailConfirmation) {
    return { role: "admin", needsEmailConfirmation: true };
  }

  // Compte authentifié : on peut lire les comptes existants.
  const { count, error: countError } = await supabase
    .from("user_roles")
    .select("id", { count: "exact", head: true });

  if (countError) {
    console.warn("Impossible de compter les comptes existants:", countError);
  }

  const role: AppRole = (count ?? 0) === 0 ? "super_admin" : "admin";

  const { error: roleError } = await supabase.from("user_roles").insert({
    user_id: user.id,
    email,
    name,
    role,
  });
  if (roleError) throw roleError;

  return { role, needsEmailConfirmation: false };
};

export const useStaff = () => {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const loadStaff = useCallback(async () => {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setCurrentUserId(user?.id ?? null);

      const { data, error } = await supabase
        .from("user_roles")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) throw error;
      setStaff((data || []) as StaffMember[]);
    } catch (error) {
      console.error("Erreur de chargement du staff:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStaff();
  }, [loadStaff]);

  const currentRole: AppRole | null =
    staff.find((s) => s.user_id === currentUserId)?.role ?? null;
  const isSuperAdmin = currentRole === "super_admin";

  const updateRole = useCallback(async (id: string, role: AppRole) => {
    const { error } = await supabase
      .from("user_roles")
      .update({ role })
      .eq("id", id);
    if (error) {
      toast.error("Échec de la mise à jour du rôle");
      throw error;
    }
    setStaff((prev) => prev.map((s) => (s.id === id ? { ...s, role } : s)));
    toast.success("Rôle mis à jour");
  }, []);

  const removeStaff = useCallback(async (id: string) => {
    const { error } = await supabase.from("user_roles").delete().eq("id", id);
    if (error) {
      toast.error("Échec de la suppression du compte");
      throw error;
    }
    setStaff((prev) => prev.filter((s) => s.id !== id));
    toast.success("Compte retiré de l'équipe");
  }, []);

  return {
    staff,
    loading,
    loadStaff,
    currentRole,
    isSuperAdmin,
    updateRole,
    removeStaff,
  };
};
