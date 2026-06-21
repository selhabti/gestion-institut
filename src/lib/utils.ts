// src/lib/utils.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Member } from "@/types/member";
import type { SessionType } from "@/types/session";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function capitalize(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

// Obtient tous les groupes d'un membre (principal + secondaires)
export function getMemberAllGroups(member: Member): SessionType[] {
  const groups: SessionType[] = [member.group];
  
  if (member.secondaryGroups && Array.isArray(member.secondaryGroups)) {
    groups.push(...member.secondaryGroups);
  }
  
  // Retourne les groupes uniques
  return [...new Set(groups)];
}

// Vérifie si un membre est dans un groupe spécifique
export function isMemberInGroup(member: Member, group: SessionType): boolean {
  return getMemberAllGroups(member).includes(group);
}

// Vérifie si un membre a plusieurs groupes
export function hasMultipleGroups(member: Member): boolean {
  return getMemberAllGroups(member).length > 1;
}

// Obtient le groupe principal (premier dans la liste)
export function getPrimaryGroup(member: Member): SessionType {
  return member.group;
}

// Obtient les groupes secondaires
export function getSecondaryGroups(member: Member): SessionType[] {
  return member.secondaryGroups || [];
}