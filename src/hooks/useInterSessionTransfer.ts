import { useState, useCallback } from "react";
import type { Member } from "@/types/member";
import type { SessionType } from "@/types/session";

// Définir le type localement si l'import ne correspond pas
export type TransferReason = 
  | 'absent_justified'
  | 'schedule_conflict'
  | 'teacher_request'
  | 'student_request'
  | 'other';

export interface TransferRecord {
  id: string;
  date: string;
  fromGroup: SessionType;
  toGroup: SessionType;
  reason: TransferReason;
  attendanceId?: string;
  // Rendre optionnel si non utilisé
  fromDate?: string;
  toDate?: string;
}

export function useInterSessionTransfer(members: Member[]) {
  const [transferHistory, setTransferHistory] = useState<TransferRecord[]>([]);
  
  // Vérifier si un élève peut être transféré
  const canTransfer = useCallback((member: Member, fromGroup: SessionType, toGroup: SessionType): boolean => {
    // Uniquement pour les transferts Samedi ↔ Dimanche
    if (!((fromGroup === "Samedi" && toGroup === "Dimanche") || 
          (fromGroup === "Dimanche" && toGroup === "Samedi"))) {
      return false;
    }
    
    // Vérifier les groupes de l'élève
    const memberGroups = [member.group, ...(member.secondaryGroups || [])];
    
    // L'élève doit avoir au moins un des deux groupes
    return memberGroups.includes("Samedi") || 
           memberGroups.includes("Dimanche") || 
           memberGroups.includes("Samedi+Dimanche");
  }, []);
  
  // Obtenir les statistiques de transfert
  const getTransferStats = useCallback((date: string, group: SessionType) => {
    const otherGroup = group === "Samedi" ? "Dimanche" : "Samedi";
    
    const stats = {
      absentInGroup: 0,
      presentInOther: 0,
      transferrable: 0,
    };
    
    members.forEach(member => {
      const groupAttendance = member.attendances?.find(a => a.date === date && a.session_type === group);
      const otherAttendance = member.attendances?.find(a => a.date === date && a.session_type === otherGroup);
      
      if (groupAttendance?.status === "absent_unjustified" || groupAttendance?.status === "absent_justified") {
        stats.absentInGroup++;
        
        if (!otherAttendance && canTransfer(member, group, otherGroup)) {
          stats.transferrable++;
        }
      }
      
      if (otherAttendance?.status === "present") {
        stats.presentInOther++;
      }
    });
    
    return stats;
  }, [members, canTransfer]);
  
  // Enregistrer un transfert - SOLUTION 1: Ajouter les dates manquantes
  const recordTransfer = useCallback((
    memberId: string,
    date: string,
    fromGroup: SessionType,
    toGroup: SessionType,
    reason: TransferReason,
    attendanceId?: string
  ) => {
    const newRecord: TransferRecord = {
      id: `transfer_${Date.now()}_${memberId}`,
      date,
      fromGroup,
      toGroup,
      reason,
      attendanceId,
      fromDate: date, // Ajouté
      toDate: date,   // Ajouté
    };
    
    setTransferHistory(prev => [...prev, newRecord]);
    
    // Mettre à jour le membre dans la base de données
    updateMemberTransferHistory(memberId, newRecord);
    
    return newRecord;
  }, []);
  
  // SOLUTION 2: Si vous ne voulez pas ajouter fromDate/toDate, utilisez un type partiel
  /*
  const recordTransfer = useCallback((
    memberId: string,
    date: string,
    fromGroup: SessionType,
    toGroup: SessionType,
    reason: TransferReason,
    attendanceId?: string
  ) => {
    const newRecord = {
      id: `transfer_${Date.now()}_${memberId}`,
      date,
      fromGroup,
      toGroup,
      reason,
      attendanceId,
    };
    
    setTransferHistory(prev => [...prev, newRecord as TransferRecord]);
    
    updateMemberTransferHistory(memberId, newRecord as TransferRecord);
    
    return newRecord as TransferRecord;
  }, []);
  */
  
  // Obtenir l'historique des transferts d'un élève
  const getMemberTransferHistory = useCallback((memberId: string): TransferRecord[] => {
    return transferHistory.filter(record => record.id.includes(memberId));
  }, [transferHistory]);
  
  return {
    canTransfer,
    getTransferStats,
    recordTransfer,
    getMemberTransferHistory,
    transferHistory,
  };
}

// Fonction helper pour mettre à jour l'historique
async function updateMemberTransferHistory(memberId: string, record: TransferRecord) {
  // À implémenter selon votre backend
  console.log(`🔄 Transfert enregistré pour ${memberId}:`, record);
}