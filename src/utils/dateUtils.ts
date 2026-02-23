// src/utils/dateUtils.ts
import { format, parseISO, isValid } from 'date-fns';
import { fr } from 'date-fns/locale';

export const formatLocalDate = (dateString: string, formatString: string = 'EEEE d MMMM yyyy'): string => {
  try {
    const date = parseISO(dateString);
    if (!isValid(date)) {
      return 'Date invalide';
    }
    const formatted = format(date, formatString, { locale: fr });
    // Capitalise la première lettre seulement
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  } catch (error) {
    console.error('Erreur de formatage de date:', error);
    return 'Date invalide';
  }
};

export const formatShortDate = (dateString: string): string => {
  const formatted = formatLocalDate(dateString, 'EEE d MMM');
  return formatted; // Déjà capitalisé par formatLocalDate
};

export const formatDateForInput = (date: Date): string => {
  return format(date, 'yyyy-MM-dd');
};

// Nouvelle fonction pour les dates françaises parfaites
export const formatFrenchDate = (dateString: string): string => {
  try {
    const date = parseISO(dateString);
    if (!isValid(date)) {
      return 'Date invalide';
    }
    
    const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    const months = [
      'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
      'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'
    ];

    const dayName = days[date.getDay()];
    const day = date.getDate();
    const monthName = months[date.getMonth()];
    const year = date.getFullYear();

    return `${dayName} ${day} ${monthName} ${year}`;
  } catch (error) {
    console.error('Erreur de formatage:', error);
    return 'Date invalide';
  }
};

// Export par défaut
export default {
  formatLocalDate,
  formatShortDate,
  formatDateForInput,
  formatFrenchDate
};