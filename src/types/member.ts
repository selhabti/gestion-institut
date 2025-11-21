// Path: src/types/member.ts
import type { SessionType } from "./session";

export type GroupType = "Samedi" | "Dimanche" | "Lundi";
export type AttendanceStatus = "present" | "absent_justified" | "absent_unjustified";

export interface Member {
  id: string;
  firstName: string;
  lastName: string;
  city?: string;
  group: GroupType;
  payments: Payment[];
  attendances: Attendance[];
}

export interface Attendance {
  id: string;
  date: string;
  status: AttendanceStatus;
}

export interface Payment {
  id: string;
  date: string;
  amount: number;
}

// Pour les props des composants (CHANGER GroupType en SessionType)
export interface MemberFormProps {
  onAddMember: (firstName: string, lastName: string, city: string, group: GroupType) => Promise<void>;
}

export interface MembersTableProps {
  members: Member[];
  selectedGroup: SessionType; // ← CHANGÉ : GroupType → SessionType
  currentDate: string;
  onMarkPresent: (memberId: string, date: string, status: AttendanceStatus) => void;
  onMarkPayment: (memberId: string) => void;
  isAdmin: boolean;
  onDeleteMember?: (memberId: string) => void;
  shareMode?: boolean;
}

export interface MonthlyStatsProps {
  members: Member[];
  selectedGroup: SessionType; // ← CHANGÉ : GroupType → SessionType
}

// AJOUTEZ ces interfaces si elles n'existent pas
export interface WeekendCalendarProps {
  members: Member[];
  selectedGroup: SessionType; // ← SessionType
  onMarkPresent: (memberId: string, date: string, status: AttendanceStatus) => void;
  isAdmin: boolean;
  onDeleteMember?: (memberId: string) => void;
}

export interface DashboardStatsProps {
  members: Member[];
  selectedGroup: SessionType; // ← SessionType
}

export interface AttendanceStatsProps {
  members: Member[];
  selectedGroup: SessionType; // ← SessionType
}