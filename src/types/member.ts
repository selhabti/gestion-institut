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
  date: string;  // ⚠️ C'est bien "date" et non "payment_date"
  amount: number;
}

// Pour les props des composants
export interface MemberFormProps {
  onAddMember: (firstName: string, lastName: string, city: string, group: GroupType) => Promise<void>;
}

export interface MembersTableProps {
  members: Member[];
  selectedGroup: GroupType;
  currentDate: string;
  onMarkPresent: (memberId: string, date: string, status: AttendanceStatus) => void;
  onMarkPayment: (memberId: string) => void;
  isAdmin: boolean;
  onDeleteMember?: (memberId: string) => void;
  shareMode?: boolean;
}

export interface MonthlyStatsProps {
  members: Member[];
  selectedGroup: GroupType;
}