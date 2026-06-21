// pages/DashboardPage/utils/constants.ts

// Constantes pour les noms des jours en français
export const DAYS_FR = [
  "Dimanche",
  "Lundi",
  "Mardi",
  "Mercredi",
  "Jeudi",
  "Vendredi",
  "Samedi",
] as const;

// Constantes pour les mois en français
export const MONTHS_FR = [
  "janvier",
  "février",
  "mars",
  "avril",
  "mai",
  "juin",
  "juillet",
  "août",
  "septembre",
  "octobre",
  "novembre",
  "décembre",
] as const;

// Types des groupes/sessions disponibles
export const SESSION_TYPES = [
  "Samedi",
  "Dimanche",
  "Lundi",
  "Samedi+Dimanche",
] as const;

// Statuts de présence disponibles
export const ATTENDANCE_STATUSES = [
  "present",
  "absent_justified",
  "absent_unjustified",
] as const;

// Options pour le filtrage des élèves
export const FILTER_OPTIONS = {
  ALL: "all",
  PRESENT: "present",
  ABSENT: "absent",
  NOT_MARKED: "not_marked",
} as const;

// Configuration des couleurs par groupe
export const GROUP_COLORS = {
  Samedi: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    badge: "bg-blue-500",
  },
  Dimanche: {
    bg: "bg-green-50",
    text: "text-green-700",
    border: "border-green-200",
    badge: "bg-green-500",
  },
  Lundi: {
    bg: "bg-orange-50",
    text: "text-orange-700",
    border: "border-orange-200",
    badge: "bg-orange-500",
  },
  "Samedi+Dimanche": {
    bg: "bg-purple-50",
    text: "text-purple-700",
    border: "border-purple-200",
    badge: "bg-purple-500",
  },
} as const;

// Configuration des couleurs par statut de présence
export const ATTENDANCE_COLORS = {
  present: {
    bg: "bg-green-100",
    text: "text-green-800",
    border: "border-green-300",
    badge: "bg-green-500",
  },
  absent_justified: {
    bg: "bg-blue-100",
    text: "text-blue-800",
    border: "border-blue-300",
    badge: "bg-blue-500",
  },
  absent_unjustified: {
    bg: "bg-red-100",
    text: "text-red-800",
    border: "border-red-300",
    badge: "bg-red-500",
  },
} as const;

// Messages d'information pour les différents états
export const INFO_MESSAGES = {
  TODAY_SESSION: "Jour de cours • Marquez les présences",
  FUTURE_SESSION: "Séance à venir",
  PAST_SESSION: "Séance terminée",
  NOT_SESSION_DAY: "Aucun cours aujourd'hui",
  HISTORICAL_MODE: "Modification des séances passées activée",
} as const;

// Texte pour les tooltips
export const TOOLTIP_TEXTS = {
  PRESENT: "Marquer comme présent",
  ABSENT_JUSTIFIED: "Marquer comme absent justifié",
  ABSENT_UNJUSTIFIED: "Marquer comme absent non justifié",
  PAYMENT: "Marquer/Annuler le paiement du mois",
  HISTORY: "Voir l'historique de l'élève",
  DELETE: "Supprimer l'élève",
} as const;

// Messages de confirmation
export const CONFIRM_MESSAGES = {
  DELETE_MEMBER: (firstName: string) => `Supprimer ${firstName} ?`,
  TOGGLE_PAYMENT: (firstName: string) => 
    `Confirmez le changement de paiement pour ${firstName} ?`,
  HISTORICAL_MODE: `
    ⚠️ MODE ÉDITION HISTORIQUE
    
    Vous allez activer la modification des présences passées.
    Ce mode permet de corriger les oublis de présence.
    
    Activer ce mode ?
  `,
} as const;

// Configuration des jours de session par groupe
export const GROUP_SESSION_DAYS: Record<string, string[]> = {
  Samedi: ["Samedi"],
  Dimanche: ["Dimanche"],
  Lundi: ["Lundi"],
  "Samedi+Dimanche": ["Samedi", "Dimanche"],
} as const;

// Configuration des icônes Lucide
export const ICONS = {
  CHECK: "Check",
  X: "X",
  FILE_QUESTION: "FileQuestion",
  TRASH: "Trash2",
  CREDIT_CARD: "CreditCard",
  HISTORY: "History",
  LOCK: "Lock",
  UNLOCK: "Unlock",
  USERS: "Users",
  CALENDAR: "Calendar",
  TAG: "Tag",
  STAR: "Star",
} as const;

// Messages d'erreur
export const ERROR_MESSAGES = {
  NO_MEMBERS: "Aucun élève dans ce groupe pour cette date",
  SHARE_MODE: "Mode partage activé",
} as const;

// Labels pour l'interface
export const LABELS = {
  STUDENT: "Élève",
  CITY: "Ville",
  GROUPS: "Groupe(s)",
  ATTENDANCE: "Présence",
  PAYMENT: "Paiement",
  ACTIONS: "Actions",
  STUDENTS_COUNT: "Élèves",
} as const;

// Placeholders
export const PLACEHOLDERS = {
  SEARCH: "Rechercher un élève...",
  NO_CITY: "—",
} as const;