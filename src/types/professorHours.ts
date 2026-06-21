//Path: src/types/professorHours.ts

export interface ProfessorSession {
    id: string;
    date: string;
    startTime: string;
    endTime: string;
    actualHours: number;
    notes?: string;
    status?: 'completed' | 'cancelled';
  }
  
  export interface ProfessorMonthlyHours {
    month: string; // YYYY-MM
    totalHours: number;
    sessions: ProfessorSession[];
  }
  export interface ProfessorSessionDB extends ProfessorSession {
    user_id: string;
    created_at: string;
    updated_at: string;
    created_by?: string;
    updated_by?: string;
  }
  export interface ProfessorReminderSettings {
    enabled: boolean;
    defaultStartTime: string; // "16:30"
    defaultEndTime: string;   // "18:30"
    reminderTime: number; // minutes before end to remind
  }
  export interface ProfessorSessionWithId extends ProfessorSession {
    user_id: string;        
    updated_at: string;
  }