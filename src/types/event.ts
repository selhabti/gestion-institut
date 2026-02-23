export type EventType = 'vacation' | 'seminar' | 'holiday' | 'special_session' | 'maintenance';

export interface Event {
  id: string;
  title: string;
  description?: string;
  event_type: EventType;
  start_date: string;  // Format: YYYY-MM-DD
  end_date: string;    // Format: YYYY-MM-DD
  groups: string[];    // Empty array = all groups
  exclude_from_stats: boolean;
  requires_attendance: boolean;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface EventFormData {
  title: string;
  description: string;
  event_type: EventType;
  start_date: string;
  end_date: string;
  groups: string[];
  exclude_from_stats: boolean;
  requires_attendance: boolean;
}