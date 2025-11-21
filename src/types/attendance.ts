//Path: src/types/attendance.ts
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
    status: 'present' | 'absent' | 'not_recorded';
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
  }