// Tarifs de cotisation mensuelle par groupe
export const DEFAULT_MONTHLY_FEE = 20;

const GROUP_FEES: Record<string, number> = {
  Jeudi: 10,
  Dimanche: 20,
  Lundi: 20,
  Samedi: 20,
  "Samedi+Dimanche": 20,
};

export const getGroupFee = (group: string): number =>
  GROUP_FEES[group] ?? DEFAULT_MONTHLY_FEE;
