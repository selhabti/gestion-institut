// src/services/attendanceSyncService.ts
import { supabase } from '@/lib/supabase';
import type { SessionType } from "@/types/session";
import type { Member, AttendanceStatus } from "@/types/member";

export interface SyncResult {
  success: boolean;
  message: string;
  actions: string[];
  transferredTo?: SessionType;
}

export async function syncWeekendAttendance(
  member: Member,
  date: string,
  targetGroup: SessionType,
  status: AttendanceStatus
): Promise<SyncResult> {
  try {
    const actions: string[] = [];
    
    // Vérifier si c'est un groupe weekend
    if (!(targetGroup === "Samedi" || targetGroup === "Dimanche")) {
      return {
        success: true,
        message: "Pas de synchronisation nécessaire",
        actions: ["no_sync_needed"]
      };
    }

    const otherGroup = targetGroup === "Samedi" ? "Dimanche" : "Samedi";
    
    // 1. Vérifier la présence dans l'autre groupe
    const otherAttendance = member.attendances?.find(
      a => a.date === date && a.session_type === otherGroup
    );

    // 2. Logique de synchronisation
    if (status === "present") {
      // Si on marque présent
      if (otherAttendance?.status === "present") {
        // Déjà présent dans l'autre groupe → demander transfert
        return {
          success: false,
          message: `already_present:${otherGroup}`,
          actions: ["need_transfer_confirmation"]
        };
      }
      
      // Si absent justifié dans l'autre groupe → rattrapage automatique
      if (otherAttendance?.status === "absent_justified") {
        actions.push(`rattrapage_auto_${otherGroup}`);
      }

    } else if (status === "absent_justified") {
      // Si absent justifié → proposer ajout à l'autre groupe
      if (!otherAttendance) {
        return {
          success: false,
          message: `suggest_catchup:${otherGroup}`,
          actions: ["suggest_auto_add"],
          transferredTo: otherGroup
        };
      }
    }

    return {
      success: true,
      message: "Synchronisation vérifiée",
      actions
    };

  } catch (error) {
    console.error("Erreur de synchronisation:", error);
    return {
      success: false,
      message: `Erreur: ${error instanceof Error ? error.message : "Erreur inconnue"}`,
      actions: ["error"]
    };
  }
}

// Fonction pour transférer un élève
export async function transferBetweenGroups(
  memberId: string,
  date: string,
  fromGroup: SessionType,
  toGroup: SessionType,
  reason: string = "Transfert manuel"
): Promise<{ success: boolean; message: string }> {
  try {
    console.log(`🔄 Transfert: ${fromGroup} → ${toGroup} pour ${memberId} le ${date}`);

    // 1. Vérifier si l'attendance source existe
    const { data: sourceAttendance } = await supabase
      .from("attendances")
      .select("id")
      .eq("member_id", memberId)
      .eq("date", date)
      .eq("session_type", fromGroup)
      .maybeSingle();

    if (sourceAttendance) {
      // Marquer absent dans le groupe source
      const { error: updateError } = await supabase
        .from("attendances")
        .update({
          status: "absent_unjustified",
          transfer_note: reason,
          transferred_at: new Date().toISOString()
        })
        .eq("id", sourceAttendance.id);

      if (updateError) {
        console.error("Erreur lors du marquage absent:", updateError);
        throw updateError;
      }
    }

    // 2. Vérifier si l'attendance destination existe déjà
    const { data: destAttendance } = await supabase
      .from("attendances")
      .select("id, status")
      .eq("member_id", memberId)
      .eq("date", date)
      .eq("session_type", toGroup)
      .maybeSingle();

    if (destAttendance) {
      // Mettre à jour l'existante
      const { error: updateError } = await supabase
        .from("attendances")
        .update({
          status: "present",
          transfer_note: reason,
          auto_transferred: true,
          transferred_at: new Date().toISOString()
        })
        .eq("id", destAttendance.id);

      if (updateError) {
        console.error("Erreur mise à jour destination:", updateError);
        throw updateError;
      }
    } else {
      // Créer une nouvelle attendance
      const { error: insertError } = await supabase
        .from("attendances")
        .insert({
          member_id: memberId,
          date: date,
          session_type: toGroup,
          status: "present",
          transfer_note: reason,
          auto_transferred: true,
          transferred_at: new Date().toISOString()
        });

      if (insertError) {
        // Si erreur de duplication, essayer de récupérer et mettre à jour
        if (insertError.code === '23505') { // Unique violation
          console.log("⚠️ Conflit détecté, tentative de mise à jour");
          
          const { data: existing } = await supabase
            .from("attendances")
            .select("id")
            .eq("member_id", memberId)
            .eq("date", date)
            .eq("session_type", toGroup)
            .single();

          if (existing) {
            const { error: retryError } = await supabase
              .from("attendances")
              .update({
                status: "present",
                transfer_note: reason,
                auto_transferred: true,
                transferred_at: new Date().toISOString()
              })
              .eq("id", existing.id);

            if (retryError) throw retryError;
          }
        } else {
          throw insertError;
        }
      }
    }

    return {
      success: true,
      message: `Transfert réussi: ${fromGroup} → ${toGroup}`
    };

  } catch (error) {
    console.error("❌ Erreur de transfert:", error);
    return {
      success: false,
      message: `Erreur: ${error instanceof Error ? error.message : "Erreur inconnue"}`
    };
  }
}

// Fonction pour ajouter automatiquement pour rattrapage
export async function addForCatchup(
  memberId: string,
  date: string,
  targetGroup: SessionType,
  reason: string = "Rattrapage automatique"
): Promise<{ success: boolean; message: string }> {
  try {
    console.log(`➕ Ajout rattrapage: ${memberId} à ${targetGroup} le ${date}`);

    // Vérifier si existe déjà
    const { data: existing } = await supabase
      .from("attendances")
      .select("id, status")
      .eq("member_id", memberId)
      .eq("date", date)
      .eq("session_type", targetGroup)
      .maybeSingle();

    if (existing) {
      // Mettre à jour l'existante
      const { error: updateError } = await supabase
        .from("attendances")
        .update({
          status: "present",
          sync_note: reason,
          auto_transferred: true,
          transferred_at: new Date().toISOString()
        })
        .eq("id", existing.id);

      if (updateError) {
        console.error("Erreur mise à jour rattrapage:", updateError);
        throw updateError;
      }
      
      console.log("✅ Rattrapage mis à jour avec succès");
    } else {
      // Créer une nouvelle attendance
      const { error: insertError } = await supabase
        .from("attendances")
        .insert({
          member_id: memberId,
          date: date,
          session_type: targetGroup,
          status: "present",
          sync_note: reason,
          auto_transferred: true,
          transferred_at: new Date().toISOString()
        });

      if (insertError) {
        // Si erreur de duplication, essayer une dernière fois
        if (insertError.code === '23505') {
          console.log("⚠️ Conflit détecté pour rattrapage, récupération...");
          
          const { data: retryExisting } = await supabase
            .from("attendances")
            .select("id")
            .eq("member_id", memberId)
            .eq("date", date)
            .eq("session_type", targetGroup)
            .single();

          if (retryExisting) {
            const { error: retryError } = await supabase
              .from("attendances")
              .update({
                status: "present",
                sync_note: reason,
                auto_transferred: true,
                transferred_at: new Date().toISOString()
              })
              .eq("id", retryExisting.id);

            if (retryError) throw retryError;
          }
        } else {
          throw insertError;
        }
      } else {
        console.log("✅ Rattrapage ajouté avec succès");
      }
    }

    return {
      success: true,
      message: `Ajouté à ${targetGroup} pour rattrapage`
    };

  } catch (error) {
    console.error("❌ Erreur d'ajout pour rattrapage:", error);
    return {
      success: false,
      message: `Erreur: ${error instanceof Error ? error.message : "Erreur inconnue"}`
    };
  }
}

// Fonction pour vérifier les opportunités de transfert
export async function getTransferOpportunities(
  members: Member[],
  selectedGroup: SessionType,
  date: string
): Promise<Array<{
  member: Member;
  reason: string;
  canTransfer: boolean;
}>> {
  try {
    const otherGroup = selectedGroup === "Samedi" ? "Dimanche" : "Samedi";
    const opportunities = [];

    for (const member of members) {
      const todayAttendance = member.attendances?.find(
        a => a.date === date && a.session_type === selectedGroup
      );
      
      const otherAttendance = member.attendances?.find(
        a => a.date === date && a.session_type === otherGroup
      );

      // Si absent justifié aujourd'hui et pas déjà dans l'autre groupe
      if (todayAttendance?.status === "absent_justified" && !otherAttendance) {
        // Vérifier si le membre peut aller dans l'autre groupe
        const canTransfer = 
          member.group === "Samedi+Dimanche" ||
          member.group === otherGroup ||
          (member.secondaryGroups && member.secondaryGroups.includes(otherGroup));

        if (canTransfer) {
          opportunities.push({
            member,
            reason: "Absence justifiée",
            canTransfer: true,
          });
        }
      }
    }

    return opportunities;

  } catch (error) {
    console.error("Erreur lors de la vérification des opportunités:", error);
    return [];
  }
}