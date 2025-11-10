// Path: src/types/member.ts
export type GroupType = "Lundi" | "Samedi" | "Dimanche";
export type AttendanceStatus = "present" | "absent_justified" | "absent_unjustified";

export interface Attendance {
  id: string;
  member_id: string;
  date: string;
  status: AttendanceStatus;
  present?: boolean;
  created_at?: string;
}

export interface Payment {
  id: string;
  member_id: string;
  amount: number;
  payment_date: string;  
  date?: string;         
  created_at?: string;
}

export interface Member {
  id: string;
  firstName: string;
  lastName: string;
  city: string;
  group: GroupType;
  attendances: Attendance[];
  payments: Payment[];
}