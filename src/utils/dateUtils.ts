// src/utils/dateUtils.ts
import { format, parseISO, isValid } from 'date-fns';
import { fr } from 'date-fns/locale';

export const formatLocalDate = (dateString: string, formatString: string = 'EEEE d MMMM yyyy'): string => {
  try {
    const date = parseISO(dateString);
    if (!isValid(date)) {
      return 'Date invalide';
    }
    return format(date, formatString, { locale: fr });
  } catch (error) {
    console.error('Erreur de formatage de date:', error);
    return 'Date invalide';
  }
};

export const formatShortDate = (dateString: string): string => {
  return formatLocalDate(dateString, 'EEE d MMM');
};

export const formatDateForInput = (date: Date): string => {
  return format(date, 'yyyy-MM-dd');
};

// Export par défaut pour tous les utilitaires
export default {
  formatLocalDate,
  formatShortDate,
  formatDateForInput
};