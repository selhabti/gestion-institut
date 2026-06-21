export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type GroupType = "Lundi" | "Samedi" | "Dimanche"
export type AttendanceStatusType = "present" | "absent_justified" | "absent_unjustified"
export type EventType = "vacation" | "seminar" | "holiday" | "special_session" | "maintenance"
export type SessionStatusType = "completed" | "cancelled"

export interface Database {
  public: {
    Tables: {
      members: {
        Row: {
          id: string
          first_name: string
          last_name: string
          city: string
          group_type: GroupType
          created_by: string | null
          created_at: string | null
          updated_at: string | null
          secondary_groups: GroupType[] | null
          deleted_at: string | null
        }
        Insert: {
          id?: string
          first_name: string
          last_name: string
          city: string
          group_type?: GroupType
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
          secondary_groups?: GroupType[] | null
          deleted_at?: string | null
        }
        Update: {
          id?: string
          first_name?: string
          last_name?: string
          city?: string
          group_type?: GroupType
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
          secondary_groups?: GroupType[] | null
          deleted_at?: string | null
        }
      }
      attendances: {
        Row: {
          id: string
          member_id: string
          date: string
          status: AttendanceStatusType
          group: string | null
          session_type: string | null
          notes: string | null
          created_by: string | null
          created_at: string | null
          updated_at: string | null
          transfer_note: string | null
          sync_note: string | null
          auto_transferred: boolean | null
          transferred_at: string | null
        }
        Insert: {
          id?: string
          member_id: string
          date: string
          status: AttendanceStatusType
          group?: string | null
          session_type?: string | null
          notes?: string | null
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
          transfer_note?: string | null
          sync_note?: string | null
          auto_transferred?: boolean | null
          transferred_at?: string | null
        }
        Update: {
          id?: string
          member_id?: string
          date?: string
          status?: AttendanceStatusType
          group?: string | null
          session_type?: string | null
          notes?: string | null
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
          transfer_note?: string | null
          sync_note?: string | null
          auto_transferred?: boolean | null
          transferred_at?: string | null
        }
      }
      payments: {
        Row: {
          id: string
          member_id: string
          amount: number
          payment_date: string
          created_by: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          member_id: string
          amount?: number
          payment_date: string
          created_by?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          member_id?: string
          amount?: number
          payment_date?: string
          created_by?: string | null
          created_at?: string | null
        }
      }
      events: {
        Row: {
          id: string
          title: string
          description: string | null
          event_type: EventType
          start_date: string
          end_date: string
          groups: GroupType[] | null
          exclude_from_stats: boolean | null
          requires_attendance: boolean | null
          created_at: string | null
          updated_at: string | null
          created_by: string | null
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          event_type: EventType
          start_date: string
          end_date: string
          groups?: GroupType[] | null
          exclude_from_stats?: boolean | null
          requires_attendance?: boolean | null
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          event_type?: EventType
          start_date?: string
          end_date?: string
          groups?: GroupType[] | null
          exclude_from_stats?: boolean | null
          requires_attendance?: boolean | null
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
        }
      }
      professor_sessions: {
        Row: {
          id: string
          user_id: string
          date: string
          start_time: string
          end_time: string
          actual_hours: number
          notes: string | null
          status: SessionStatusType
          created_at: string | null
          updated_at: string | null
          created_by: string | null
          updated_by: string | null
        }
        Insert: {
          id?: string
          user_id: string
          date: string
          start_time: string
          end_time: string
          actual_hours: number
          notes?: string | null
          status?: SessionStatusType
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
          updated_by?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          start_time?: string
          end_time?: string
          actual_hours?: number
          notes?: string | null
          status?: SessionStatusType
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
          updated_by?: string | null
        }
      }
      user_groups: {
        Row: {
          id: string
          user_id: string
          group_type: GroupType
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          group_type: GroupType
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          group_type?: GroupType
          created_at?: string
        }
      }
      user_roles: {
        Row: {
          id: string
          user_id: string
          role: "admin" | "user"
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          role?: "admin" | "user"
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          role?: "admin" | "user"
          created_at?: string | null
        }
      }
    }
  }
}