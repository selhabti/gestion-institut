// Path: src/types/session.ts
import type { Member } from "./member";

export type SessionType = "Samedi" | "Dimanche" | "Lundi" | "Samedi+Dimanche";

export interface SessionProps {
  selectedSession: SessionType;
  onSessionChange: (session: SessionType) => void;
}

export interface SessionDataProps {
  members: Member[];
  selectedSession: SessionType;
}