export type MemoBlocKey = "nouveau" | "recent" | "ancien";

export interface MemoColor {
  label: string;
  hex: string;
  dark: string;
  light: string;
  text: string;
  border: string;
  bg: string;
}

export const MEMO_COLORS: Record<MemoBlocKey, MemoColor> = {
  ancien: {
    label: "Ancien",
    hex: "#14b8a6",
    dark: "#0f766e",
    light: "#ccfbf1",
    text: "text-teal-800",
    border: "border-teal-300",
    bg: "bg-teal-50",
  },
  recent: {
    label: "Récent",
    hex: "#8b5cf6",
    dark: "#6d28d9",
    light: "#ede9fe",
    text: "text-violet-800",
    border: "border-violet-300",
    bg: "bg-violet-50",
  },
  nouveau: {
    label: "Nouveau",
    hex: "#f97316",
    dark: "#c2410c",
    light: "#ffedd5",
    text: "text-orange-800",
    border: "border-orange-300",
    bg: "bg-orange-50",
  },
};

export const MEMO_AVENIR = {
  hex: "#cbd5e1",
  light: "#f1f5f9",
  label: "À venir",
};

export const MEMO_AVANT = {
  hex: "#e2e8f0",
  label: "Avant l'origine",
};

export const MEMO_BLOC_LABELS: Record<MemoBlocKey, string> = {
  nouveau: "NOUVEAU",
  recent: "RÉCENT",
  ancien: "ANCIEN",
};

export const MEMO_BLOC_HELP: Record<MemoBlocKey, string> = {
  nouveau: "Ce qu'il s'était engagé à apprendre cette semaine.",
  recent: "Ses 4 dernières semaines, pour les consolider.",
  ancien: "Une tranche de tout le reste ; elle change chaque semaine.",
};

export const MEMO_BLOC_ORDER: MemoBlocKey[] = ["nouveau", "recent", "ancien"];

export const positionPct = (position: number): number =>
  (Math.max(0, Math.min(480, position)) / 480) * 100;
