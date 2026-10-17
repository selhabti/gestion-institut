// Horaires des séances par groupe
export interface SessionSchedule {
  start: string; // "HH:MM"
  end: string; // "HH:MM"
  day: number; // 0=Dimanche, 1=Lundi, 4=Jeudi, 6=Samedi
}

export const SESSION_SCHEDULE: Record<string, SessionSchedule> = {
  Samedi: { start: "09:30", end: "11:30", day: 6 },
  Dimanche: { start: "16:30", end: "18:30", day: 0 },
  Lundi: { start: "20:30", end: "21:30", day: 1 },
  Jeudi: { start: "18:30", end: "20:00", day: 4 },
};

export const getSessionSchedule = (group: string): SessionSchedule =>
  SESSION_SCHEDULE[group] ?? SESSION_SCHEDULE.Samedi;

// Groupes dont les heures prof sont comptées (Nouraniya/Lundi exclue)
export const isPaidSessionGroup = (group: string): boolean => group !== "Lundi";
