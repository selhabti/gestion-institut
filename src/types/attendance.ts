export interface StudentHistory {
  studentId: string;
  firstName: string;
  lastName: string;
  group: string;
  monthlyStats: MonthlyStats[];
  overallAttendance: AttendanceStats;
}

export interface MonthlyStats {
  month: string; 
  totalSessions: number;
  presentSessions: number;
  absentSessions: number;
  attendanceRate: number;
  paymentStatus: PaymentStatus;
  sessions: SessionDetail[];
}

export interface SessionDetail {
  date: string;
  day: string;
  status: 'present' | 'absent' | 'absent_justified' | 'absent_unjustified' | 'not_recorded';
  sessionType: string;
}

export interface PaymentStatus {
  currentMonth: string;
  status: 'paid' | 'partially_paid' | 'unpaid';
  dueDate?: string;
}

export interface AttendanceStats {
  overallRate: number;
  monthlyRate: number;
  groupSpecificRate: number;
  totalSessions: number;
  presentCount: number;
  absentCount: number;
  justifiedAbsences?: number;
  unjustifiedAbsences?: number;
}

export interface Attendance {
  id: string;
  member_id: string;
  date: string;
  status: 'present' | 'absent_justified' | 'absent_unjustified';
  group?: string;
  session_type?: string;
  notes?: string;
  transfer_note?: string;
  sync_note?: string;
  auto_transferred?: boolean;
  transferred_at?: string;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
}
