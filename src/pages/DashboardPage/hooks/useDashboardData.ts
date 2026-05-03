import { useState, useCallback, useRef, useEffect } from "react";
import LocalCache from "@/utils/cache";
import { supabase } from '@/lib/supabase';
import type { GroupType, AttendanceStatus, Member } from "@/types/member";
import type { SessionType } from "@/types/session";
import { toast } from "sonner";
import { 
  syncWeekendAttendance, 
  transferBetweenGroups,
  addForCatchup,
  getTransferOpportunities 
} from "@/services/attendanceSyncService";

export const useDashboardData = (user: any, shareMode: boolean) => {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerms, setSearchTerms] = useState<string[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [historicalEditMode, setHistoricalEditMode] = useState(false);

  const isMountedRef = useRef(true);
  const hasLoadedRef = useRef(false);
  const loadInProgressRef = useRef(false);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const loadMembers = useCallback(
    async (forceRefresh = false) => {
      if (!isMountedRef.current) return;
      if (loadInProgressRef.current) return;
      if (!forceRefresh && hasLoadedRef.current && members.length > 0) return;

      if (!forceRefresh) {
        const cachedData = LocalCache.get<Member[]>("members_data");
        if (cachedData && cachedData.length > 0) {
          setMembers(cachedData);
          hasLoadedRef.current = true;
          setLoading(false);
          return;
        }
      }

      loadInProgressRef.current = true;
      setLoading(true);

      try {
        const startTime = performance.now();

        const [membersResponse, attendancesResponse, paymentsResponse] =
          await Promise.all([
            supabase
              .from("members")
              .select("id, first_name, last_name, city, group_type, secondary_groups, created_at")
              .order("created_at", { ascending: true }),
            supabase.from("attendances").select("*"),
            supabase.from("payments").select("*"),
          ]);

        if (!isMountedRef.current) return;

        if (membersResponse.error) throw membersResponse.error;
        if (attendancesResponse.error) throw attendancesResponse.error;
        if (paymentsResponse.error) throw paymentsResponse.error;

        const transformedMembers: Member[] = (membersResponse.data || []).map(
          (member) => ({
            id: member.id,
            firstName: member.first_name,
            lastName: member.last_name,
            city: member.city,
            group: member.group_type as SessionType,
            secondaryGroups: (member.secondary_groups || []) as SessionType[],
            registrationDate: member.created_at,
            payments: (paymentsResponse.data || [])
              .filter((p) => p.member_id === member.id)
              .map((p) => ({
                id: p.id,
                date: p.payment_date,
                amount: p.amount,
              })),
            attendances: (attendancesResponse.data || [])
              .filter((a) => a.member_id === member.id)
              .map((a) => ({
                id: a.id,
                date: a.date,
                status: a.status as AttendanceStatus,
                session_type: a.session_type as SessionType,
              })),
          })
        );

        const endTime = performance.now();

        setMembers(transformedMembers);
        hasLoadedRef.current = true;
        LocalCache.set("members_data", transformedMembers);

        console.log(
          `✅ ${transformedMembers.length} membres chargés en ${Math.round(
            endTime - startTime
          )}ms`
        );
      } catch (error) {
        console.error("💥 Erreur de chargement:", error);

        const cachedData = LocalCache.get<Member[]>("members_data");
        if (cachedData && cachedData.length > 0) {
          setMembers(cachedData);
          hasLoadedRef.current = true;
        } else {
          if (isMountedRef.current) {
            hasLoadedRef.current = false;
          }
        }
      } finally {
        if (isMountedRef.current) {
          loadInProgressRef.current = false;
          setLoading(false);
        }
      }
    },
    [members.length]
  );

  // ==================================================
  // DÉCLARATION DE handleMarkPresent AVANT SON UTILISATION
  // ==================================================

  const handleMarkPresent = useCallback(
    async (
      memberId: string,
      date: string,
      status: AttendanceStatus,
      session_type?: SessionType,
      selectedGroup?: SessionType,
      forceEdit = false
    ) => {
      try {
        const targetSessionType = session_type || selectedGroup;
  
        // Détection date passée (format YYYY-MM-DD)
        const todayStr = new Date().toISOString().split("T")[0];
        const isPastDate = date < todayStr;
  
        if (isPastDate && !forceEdit) {
          console.warn(
            "Tentative de modification d'une séance passée sans autorisation (historicalEditMode).",
            { memberId, date, status, targetSessionType }
          );
          if (typeof toast !== "undefined") {
            toast.error("La modification des séances passées nécessite le mode Édition historique.");
          } else {
            alert("La modification des séances passées nécessite le mode Édition historique.");
          }
          return;
        }
  
        // Mise à jour optimiste locale
        setMembers((prevMembers) =>
          prevMembers.map((member) => {
            if (member.id !== memberId) return member;
  
            const updatedAttendances = [...member.attendances];
            const existingIndex = updatedAttendances.findIndex(
              (a) => a.date === date && a.session_type === targetSessionType
            );
  
            if (existingIndex >= 0) {
              if (updatedAttendances[existingIndex].status === status) {
                updatedAttendances.splice(existingIndex, 1);
              } else {
                updatedAttendances[existingIndex] = {
                  ...updatedAttendances[existingIndex],
                  status,
                  id: updatedAttendances[existingIndex].id || "temp-" + Date.now(),
                };
              }
            } else {
              updatedAttendances.push({
                id: "temp-" + Date.now(),
                date,
                status,
                session_type: targetSessionType,
              });
            }
  
            return {
              ...member,
              attendances: updatedAttendances,
            };
          })
        );
  
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();
  
        if (!authUser) {
          alert("Veuillez vous reconnecter");
          return;
        }
  
        // Vérifier l'existence actuelle (read)
        const { data: existing, error: checkError } = await supabase
          .from("attendances")
          .select("id, status")
          .eq("member_id", memberId)
          .eq("date", date)
          .eq("session_type", targetSessionType)
          .maybeSingle();
  
        if (checkError && checkError.code !== "PGRST116") {
          console.warn("⚠️ Erreur vérification:", checkError);
        }
  
        let operationError = null;
  
        if (existing) {
          // Si même statut => toggle off => supprimer
          if (existing.status === status) {
            const { error } = await supabase.from("attendances").delete().eq("id", existing.id);
            operationError = error;
          } else {
            // Mise à jour normale (update)
            const { error } = await supabase
              .from("attendances")
              .update({
                status,
                session_type: targetSessionType,
                updated_at: new Date().toISOString(),
              })
              .eq("id", existing.id);
            operationError = error;
          }
        } else {
          // Pas d'existant => upsert (évite le duplicate key si insert concurent)
          const upsertPayload = {
            member_id: memberId,
            date,
            status,
            session_type: targetSessionType,
            created_by: authUser.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
  
          const { error } = await supabase
            .from("attendances")
            .upsert(upsertPayload, { onConflict: "member_id,date,session_type" }); // <- important
          operationError = error;
        }
  
        if (operationError) {
          console.error("❌ Erreur serveur:", operationError);
          // Forcer rechargement en cas d'erreur
          loadMembers(true);
        } else {
          // légère attente pour laisser le backend propager puis reload léger
          setTimeout(() => {
            loadMembers(false);
          }, 1000);
        }
      } catch (error) {
        console.error("💥 Erreur:", error);
        loadMembers(true);
  
        if (error instanceof Error && error.message.includes("permission")) {
          alert("Permission refusée. Vérifiez que vous êtes connecté.");
        } else {
          if (typeof toast !== "undefined") {
            toast.error("Erreur lors de l'enregistrement de la présence");
          }
        }
      }
    },
    [loadMembers, supabase]
  );

  // ==================================================
  // NOUVELLES FONCTIONS POUR LES TRANSFERTS
  // ==================================================

  const handleMarkPresentWithSync = useCallback(
    async (
      memberId: string,
      date: string,
      status: AttendanceStatus,
      session_type?: SessionType,
      selectedGroup?: SessionType
    ) => {
      try {
        const targetGroup = session_type || selectedGroup;
        const member = members.find((m) => m.id === memberId);
  
        if (!member) {
          console.error("Membre non trouvé:", memberId);
          return;
        }
  
        // --- Détection si la date est passée (comparer en YYYY-MM-DD pour éviter TZ issues) ---
        const todayStr = new Date().toISOString().split("T")[0];
        const isPastDate = date < todayStr;
  
        // Si c'est passé et que le mode historique n'est pas activé => bloquer et prévenir
        if (isPastDate && !historicalEditMode) {
          toast.error("La modification des séances passées nécessite le mode Édition historique.");
          console.warn("Tentative de modification d'une séance passée sans historicalEditMode");
          return;
        }
  
        // Si weekend, appliquer la logique de synchronisation habituelle
        if (targetGroup === "Samedi" || targetGroup === "Dimanche") {
          const syncResult = await syncWeekendAttendance(
            member,
            date,
            targetGroup as SessionType,
            status
          );
  
          if (!syncResult.success) {
            if (syncResult.message.startsWith("already_present:")) {
              const otherGroup = syncResult.message.split(":")[1] as SessionType;
              const confirm = window.confirm(
                `${member.firstName} est déjà présent ${otherGroup}.\n` +
                  `Voulez-vous le transférer vers ${targetGroup} ?\n\n` +
                  `(Il sera marqué absent ${otherGroup})`
              );
  
              if (confirm) {
                await transferBetweenGroups(
                  memberId,
                  date,
                  otherGroup,
                  targetGroup as SessionType,
                  "Transfert manuel"
                );
                await loadMembers();
                return;
              } else {
                return;
              }
            }
  
            if (syncResult.message.startsWith("suggest_catchup:")) {
              const otherGroup = syncResult.message.split(":")[1] as SessionType;
              const confirm = window.confirm(
                `${member.firstName} sera absent ${targetGroup} (justifié).\n` +
                  `Voulez-vous l'ajouter automatiquement à ${otherGroup} pour rattrapage ?`
              );
  
              if (confirm) {
                // On veut forcer l'ajout même si c'est une date passée et historicalEditMode est activé
                await handleMarkPresent(memberId, date, status, session_type, selectedGroup, !!historicalEditMode);
                await addForCatchup(
                  memberId,
                  date,
                  otherGroup,
                  `Rattrapage (absent ${targetGroup})`
                );
                await loadMembers();
                return;
              }
            }
          }
        }
  
        // Appel final: on transmet forceEdit = true si historicalEditMode est activé
        await handleMarkPresent(memberId, date, status, session_type, selectedGroup, !!historicalEditMode);
      } catch (error) {
        console.error("Erreur lors du marquage avec synchronisation:", error);
        toast.error("Erreur lors du marquage de la présence");
      }
    },
    // Ajout de historicalEditMode dans les dépendances
    [members, handleMarkPresent, loadMembers, historicalEditMode]
  );

  const handleTransferAttendance = useCallback(
    async (
      memberId: string,
      fromDate: string,
      toDate: string,
      fromGroup: SessionType,
      toGroup: SessionType
    ) => {
      try {
        const result = await transferBetweenGroups(
          memberId,
          fromDate,
          fromGroup,
          toGroup,
          "Transfert manuel"
        );
        
        if (result.success) {
          console.log("🔄 Transfert réussi:", result.message);
          await loadMembers();
          toast.success("Transfert effectué avec succès");
        } else {
          console.error("❌ Transfert échoué:", result.message);
          toast.error(result.message);
        }
        
      } catch (error) {
        console.error("Erreur lors du transfert:", error);
        toast.error("Erreur lors du transfert");
      }
    },
    [loadMembers]
  );

  const handleAutoTransferAbsent = useCallback(
    async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        const opportunities = await getTransferOpportunities(members, "Samedi", today);
        
        if (opportunities.length === 0) {
          toast.info("Aucun élève absent Samedi ne peut être transféré aujourd'hui.");
          return;
        }
        
        const confirmMsg = window.confirm(
          `Transférer automatiquement ${opportunities.length} élève(s) absents Samedi vers Dimanche ?\n\n` +
          "Ils seront ajoutés pour rattrapage."
        );
        
        if (!confirmMsg) return;
        
        for (const opp of opportunities) {
          await addForCatchup(
            opp.member.id,
            today,
            "Dimanche",
            `Rattrapage automatique (absent Samedi)`
          );
        }
        
        await loadMembers();
        toast.success(`${opportunities.length} élève(s) transféré(s) avec succès !`);
        
      } catch (error) {
        console.error("Erreur lors du transfert automatique:", error);
        toast.error("Erreur lors du transfert automatique");
      }
    },
    [members, loadMembers]
  );

  // ==================================================
  // FONCTIONS EXISTANTES (inchangées)
  // ==================================================

  const handleAddGroupToExistingMember = useCallback(
    async (memberId: string, groupToAdd: GroupType): Promise<void> => {
      try {
        const { data: memberData, error: memberError } = await supabase
          .from('members')
          .select('secondary_groups, group_type')
          .eq('id', memberId)
          .single();

        if (memberError) throw memberError;

        if (memberData.group_type === groupToAdd) {
          throw new Error("Ce groupe est déjà le groupe principal");
        }

        const currentSecondaryGroups = memberData.secondary_groups || [];
        if (currentSecondaryGroups.includes(groupToAdd)) {
          throw new Error("Ce groupe est déjà dans les groupes secondaires");
        }

        const updatedSecondaryGroups = [...currentSecondaryGroups, groupToAdd];

        const { error: updateError } = await supabase
          .from('members')
          .update({
            secondary_groups: updatedSecondaryGroups,
            updated_at: new Date().toISOString()
          })
          .eq('id', memberId);

        if (updateError) throw updateError;

        await loadMembers();
      } catch (error: any) {
        console.error('❌ Erreur d\'ajout de groupe:', error);
        throw error;
      }
    },
    [loadMembers]
  );

  const handleAddMember = useCallback(
    async (
      firstName: string,
      lastName: string,
      city: string,
      primaryGroup: GroupType,
      secondaryGroups?: GroupType[]
    ) => {
      try {
        const secondaryGroupsArray = secondaryGroups && secondaryGroups.length > 0 
          ? secondaryGroups 
          : null;

        const { data, error } = await supabase
          .from("members")
          .insert({
            first_name: firstName,
            last_name: lastName,
            city: city || null,
            group_type: primaryGroup,
            secondary_groups: secondaryGroupsArray,
            created_by: user?.id,
          })
          .select();

        if (error) {
          if (error.code === '23505') {
            const { data: existingMember } = await supabase
              .from('members')
              .select('id')
              .eq('first_name', firstName)
              .eq('last_name', lastName)
              .single();

            if (existingMember) {
              toast.warning('Cet élève existe déjà', {
                description: `Voulez-vous ajouter ${primaryGroup} comme groupe secondaire ?`,
                action: {
                  label: 'Ajouter',
                  onClick: async () => {
                    await handleAddGroupToExistingMember(existingMember.id, primaryGroup);
                  }
                }
              });
            }
            return;
          }
          throw error;
        }

        if (data && data[0]) {
          const newMember: Member = {
            id: data[0].id,
            firstName: data[0].first_name,
            lastName: data[0].last_name,
            city: data[0].city,
            group: data[0].group_type,
            secondaryGroups: data[0].secondary_groups || [],
            payments: data[0].payments || [],
            attendances: data[0].attendances || [],
            created_at: data[0].created_at,
          };

          setMembers((prev) => [...prev, newMember]);
          const updatedMembers = [...members, newMember];
          LocalCache.set("members_data", updatedMembers);

          setTimeout(() => loadMembers(), 500);
          toast.success('Élève ajouté avec succès');
        }
      } catch (error) {
        console.error('❌ Erreur d\'ajout de membre:', error);
        toast.error('Impossible d\'ajouter l\'élève');
        throw error;
      }
    },
    [user, loadMembers, members, handleAddGroupToExistingMember]
  );


  const handleDeleteMember = useCallback(async (memberId: string) => {
    setLoading(true);
    try {
      // Supprimer le membre directement
      const { error } = await supabase
        .from('members')
        .delete()
        .eq('id', memberId);  // ← Utiliser 'id'
  
      if (error) throw error;
      
      setMembers(prev => prev.filter(m => m.id !== memberId));
      toast.success('Membre supprimé avec succès');
      await loadMembers();
      
    } catch (error: any) {
      console.error('❌ Erreur de suppression:', error);
      toast.error(error.message || 'Erreur lors de la suppression');
    } finally {
      setLoading(false);
    }
  }, [loadMembers]);

  const handleUpdateMember = useCallback(
    async (memberId: string, updates: Partial<Member>) => {
      try {
        const supabaseUpdates: any = {};
        if (updates.firstName) supabaseUpdates.first_name = updates.firstName;
        if (updates.lastName) supabaseUpdates.last_name = updates.lastName;
        if (updates.city !== undefined) supabaseUpdates.city = updates.city;
        if (updates.group) supabaseUpdates.group_type = updates.group;

        setMembers((prev) =>
          prev.map((member) =>
            member.id === memberId ? { ...member, ...updates } : member
          )
        );

        const updatedMembers = members.map((member) =>
          member.id === memberId ? { ...member, ...updates } : member
        );
        LocalCache.set("members_data", updatedMembers);

        const { error } = await supabase
          .from("members")
          .update(supabaseUpdates)
          .eq("id", memberId);

        if (error) throw error;
      } catch (error) {
        console.error("❌ Erreur de mise à jour:", error);
        loadMembers();
      }
    },
    [loadMembers, members]
  );

  const handleAddGroupToMember = useCallback(
    async (memberId: string, groupToAdd: GroupType) => {
      try {
        const { data: memberData, error: memberError } = await supabase
          .from('members')
          .select('secondary_groups')
          .eq('id', memberId)
          .single();

        if (memberError) throw memberError;

        const currentSecondaryGroups = memberData.secondary_groups || [];
        if (currentSecondaryGroups.includes(groupToAdd)) {
          toast.warning('Ce groupe est déjà attribué à cet élève');
          return;
        }

        const updatedSecondaryGroups = [...currentSecondaryGroups, groupToAdd];

        const { error: updateError } = await supabase
          .from('members')
          .update({
            secondary_groups: updatedSecondaryGroups,
            updated_at: new Date().toISOString()
          })
          .eq('id', memberId);

        if (updateError) throw updateError;

        await loadMembers();
        toast.success('Groupe ajouté avec succès');
      } catch (error) {
        console.error('❌ Erreur d\'ajout de groupe:', error);
        throw error;
      }
    },
    [loadMembers]
  );

  const handleRemoveGroupFromMember = useCallback(
    async (memberId: string, groupToRemove: GroupType) => {
      try {
        const { data: memberData, error: memberError } = await supabase
          .from('members')
          .select('group_type, secondary_groups')
          .eq('id', memberId)
          .single();
  
        if (memberError) throw memberError;
        if (!memberData) throw new Error("Membre non trouvé");
  
        if (memberData.group_type === groupToRemove) {
          toast.error('Impossible de supprimer le groupe principal');
          return;
        }
  
        const currentSecondaryGroups = memberData.secondary_groups || [];
        const updatedSecondaryGroups = currentSecondaryGroups.filter(
          (group: string) => group !== groupToRemove
        );
  
        const { error: updateError } = await supabase
          .from('members')
          .update({
            secondary_groups: updatedSecondaryGroups,
            updated_at: new Date().toISOString()
          })
          .eq('id', memberId);
  
        if (updateError) throw updateError;
  
        await loadMembers();
        toast.success('Groupe retiré avec succès');
        
      } catch (error) {
        console.error('❌ Erreur de suppression de groupe:', error);
        toast.error('Erreur lors de la suppression du groupe');
        throw error;
      }
    },
    [loadMembers]
  );

  const handleMarkPayment = useCallback(
    async (memberId: string) => {
      if (shareMode) {
        console.log("🚫 Paiement bloqué - Mode partage actif");
        return;
      }

      const now = new Date();
      const currentMonth = now.toISOString().slice(0, 7);
      const member = members.find((m) => m.id === memberId);
      if (!member) return;

      const hasPaidThisMonth = member.payments.some(
        (p) => p.date && p.date.startsWith(currentMonth)
      );

      if (hasPaidThisMonth) {
        console.log("🛑 Blocage: Paiement déjà enregistré localement pour ce mois.");
        return;
      }

      const tempPaymentId = "temp-payment-" + Date.now();
      const newPayment = {
        id: tempPaymentId,
        member_id: memberId,
        date: now.toISOString().split("T")[0],
      };

      setMembers((prevMembers) =>
        prevMembers.map((m) =>
          m.id === memberId
            ? { ...m, payments: [...m.payments, newPayment] }
            : m
        )
      );

      try {
        const { error } = await supabase.from("payments").insert({
          member_id: memberId,
          payment_date: now.toISOString().split("T")[0],
          created_by: user?.id,
        });

        if (error) throw error;

        await loadMembers(true);
      } catch (error) {
        console.error("❌ Erreur serveur lors du paiement. Rollback...", error);
        loadMembers(true);
      }
    },
    [shareMode, members, user, loadMembers]
  );

  const handleUnmarkPayment = useCallback(
    async (memberId: string) => {
      if (shareMode) {
        console.log("🚫 Annulation bloquée - Mode partage actif");
        return;
      }

      const now = new Date();
      const currentMonth = now.toISOString().slice(0, 7);
      const member = members.find((m) => m.id === memberId);
      if (!member) return;

      const paymentToRemove = member.payments.find(
        (p) => p.date && p.date.startsWith(currentMonth)
      );

      if (!paymentToRemove) return;

      const confirmation = window.prompt(
        "Êtes-vous sûr de vouloir annuler ce paiement ? Veuillez taper 'je confirme' pour procéder à la suppression :"
      );

      if (confirmation !== "je confirme") {
        console.log("❌ Annulation annulée par l'utilisateur.");
        return;
      }

      setMembers((prevMembers) =>
        prevMembers.map((m) =>
          m.id === memberId
            ? {
                ...m,
                payments: m.payments.filter((p) => p.id !== paymentToRemove.id),
              }
            : m
        )
      );

      try {
        const { error } = await supabase
          .from("payments")
          .delete()
          .eq("id", paymentToRemove.id);

        if (error) throw error;

        await loadMembers(true);
      } catch (error) {
        console.error("❌ Erreur serveur lors de l'annulation. Rollback...", error);
        loadMembers(true);
      }
    },
    [shareMode, members, loadMembers]
  );

  return {
    members,
    loading,
    searchTerms,
    searchInput,
    historicalEditMode,
    setSearchTerms,
    setSearchInput,
    setHistoricalEditMode,
    loadMembers,
    handleAddMember,
    handleDeleteMember,
    handleUpdateMember,
    handleAddGroupToMember,
    handleRemoveGroupFromMember,
    handleMarkPresent,
    handleMarkPresentWithSync, 
    handleMarkPayment,
    handleUnmarkPayment,
    handleAddGroupToExistingMember,
    handleTransferAttendance,
    handleAutoTransferAbsent,
  } as const;
};