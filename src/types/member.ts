// src/types/member.ts - VERSION AVEC SUIVI INTER-SÉANCES
import type { SessionType } from "./session";
export type GroupType = "Samedi" | "Dimanche" | "Lundi" | "Samedi+Dimanche";
export type AttendanceStatus = "present" | "absent_justified" | "absent_unjustified" ;

export interface Attendance {
  id: string;
  date: string;
  status: AttendanceStatus;
  session_type?: SessionType; 
}

export interface MonthlyStatsProps {
  members: Member[];
  selectedGroup: SessionType;
}

export interface Member {
  id: string;
  firstName: string;
  lastName: string;
  city?: string;
  group: SessionType;
  secondaryGroups?: SessionType[];
  payments: Payment[];
  attendances: Attendance[];
  created_at?: string;
  // Nouveau champ pour le suivi des transferts
  transferHistory?: TransferRecord[];
}

export interface Payment {
  id: string;
  date: string;
  amount?: number;
}

// Nouveau type pour les enregistrements de transfert
export interface TransferRecord {
  id: string;
  date: string;
  fromDate: string;
  toDate: string;
  fromGroup: SessionType;
  toGroup: SessionType;
  reason: TransferReason;
  attendanceId?: string;
  created_at?: string;
}

// Raisons possibles pour un transfert
export type TransferReason = 
  | 'auto_transfer'      // Transfert automatique d'absence
  | 'manual_catchup'     // Rattrapage manuel
  | 'admin_override'     // Modification administrateur
  | 'schedule_change'    // Changement d'horaire
  | 'emergency'          // Situation d'urgence
  | 'other';             // Autre raison

export type UnifiedMember = Member;

// Interface étendue pour MembersTable avec gestion des transferts
export interface MembersTableProps {
  members: Member[];
  selectedGroup: SessionType;
  currentDate: string;
  onMarkPresent: (
    memberId: string, 
    date: string, 
    status: AttendanceStatus,
    group?: SessionType
  ) => void;
  onMarkPayment: (memberId: string) => void;
  onUnmarkPayment: (memberId: string) => void;
  isAdmin?: boolean;
  canManageMembers?: boolean;
  onDeleteMember?: (memberId: string) => void;
  shareMode?: boolean;
  className?: string;
  historicalEditMode?: boolean;
  onHistoricalEditToggle?: (enabled: boolean) => void;
  // Nouvelles props pour le suivi inter-séances
  onTransferAttendance?: (
    memberId: string,
    fromDate: string,
    toDate: string,
    fromGroup: SessionType,
    toGroup: SessionType
  ) => void;
  onAutoTransferAbsent?: () => void;
}

// Interface pour les statistiques de transfert
export interface TransferStats {
  absentToday: number;           // Absents dans le groupe actuel aujourd'hui
  presentInOther: number;        // Présents dans l'autre groupe weekend
  transferOpportunities: number; // Élèves pouvant être transférés
  autoTransferred: number;       // Élèves transférés automatiquement
  transferHistory: TransferRecord[]; // Historique des transferts
}

// Interface pour les options de transfert
export interface TransferOptions {
  memberId: string;
  currentGroup: SessionType;
  targetGroup: SessionType;
  currentDate: string;
  targetDate?: string;
  reason?: TransferReason;
  forceTransfer?: boolean;
}

// Interface pour la réponse d'un transfert
export interface TransferResponse {
  success: boolean;
  message: string;
  transfer?: TransferRecord;
  error?: string;
}

// Interface pour le composant de gestion des transferts
export interface InterSessionManagerProps {
  members: Member[];
  selectedGroup: SessionType;
  currentDate: string;
  onTransferAttendance: (
    memberId: string,
    fromDate: string,
    toDate: string,
    fromGroup: SessionType,
    toGroup: SessionType
  ) => void;
  onAutoTransferAbsent: () => void;
  isAdmin?: boolean;
  transferStats?: TransferStats;
}

// Interface pour les règles de transfert
export interface TransferRule {
  fromGroup: SessionType;
  toGroup: SessionType;
  allowed: boolean;
  conditions?: string[];
  autoTransfer?: boolean;
  requireConfirmation?: boolean;
}

// Fonction utilitaire pour déterminer si un groupe est un groupe weekend
export type WeekendGroup = "Samedi" | "Dimanche";

// Vérifie si un groupe fait partie des groupes weekend
export const isWeekendGroup = (group: SessionType): group is WeekendGroup => {
  return group === "Samedi" || group === "Dimanche";
};

// Obtient l'autre groupe weekend
export const getOtherWeekendGroup = (group: WeekendGroup): WeekendGroup => {
  return group === "Samedi" ? "Dimanche" : "Samedi";
};

// Configuration des règles de transfert par défaut
export const DEFAULT_TRANSFER_RULES: TransferRule[] = [
  {
    fromGroup: "Samedi",
    toGroup: "Dimanche",
    allowed: true,
    conditions: ["Absence justifiée", "Pas déjà présent Dimanche"],
    autoTransfer: true,
    requireConfirmation: true
  },
  {
    fromGroup: "Dimanche",
    toGroup: "Samedi",
    allowed: true,
    conditions: ["Absence justifiée", "Pas déjà présent Samedi"],
    autoTransfer: true,
    requireConfirmation: true
  },
  {
    fromGroup: "Lundi",
    toGroup: "Samedi",
    allowed: false,
    conditions: ["Transfert inter-semaine non autorisé"]
  },
  {
    fromGroup: "Lundi",
    toGroup: "Dimanche",
    allowed: false,
    conditions: ["Transfert inter-semaine non autorisé"]
  },
  {
    fromGroup: "Samedi+Dimanche",
    toGroup: "Samedi",
    allowed: true,
    conditions: ["Élève déjà présent un des deux jours"]
  },
  {
    fromGroup: "Samedi+Dimanche",
    toGroup: "Dimanche",
    allowed: true,
    conditions: ["Élève déjà présent un des deux jours"]
  }
];

// Type pour les statistiques d'utilisation des transferts
export interface TransferUsageStats {
  totalTransfers: number;
  successfulTransfers: number;
  failedTransfers: number;
  mostCommonReason: TransferReason;
  busiestDay: string;
  mostActiveMember?: string;
}