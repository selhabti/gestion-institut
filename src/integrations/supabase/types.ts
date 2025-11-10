export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      members: {
        Row: {
          id: string
          first_name: string
          last_name: string
          city: string
          group_type: "Lundi" | "Samedi" | "Dimanche"
          created_by: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          first_name: string
          last_name: string
          city: string
          group_type?: "Lundi" | "Samedi" | "Dimanche"
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          first_name?: string
          last_name?: string
          city?: string
          group_type?: "Lundi" | "Samedi" | "Dimanche"
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      attendances: {
        Row: {
          id: string
          member_id: string
          date: string
          status: "present" | "absent_justified" | "absent_unjustified"
          created_by: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          member_id: string
          date: string
          status: "present" | "absent_justified" | "absent_unjustified"
          created_by?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          member_id?: string
          date?: string
          status?: "present" | "absent_justified" | "absent_unjustified"
          created_by?: string | null
          created_at?: string | null
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
      user_groups: {
        Row: {
          id: string
          user_id: string
          group_type: "Lundi" | "Samedi" | "Dimanche"
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          group_type: "Lundi" | "Samedi" | "Dimanche"
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          group_type?: "Lundi" | "Samedi" | "Dimanche"
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