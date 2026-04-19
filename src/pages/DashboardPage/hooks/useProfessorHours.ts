import { useState, useEffect, useCallback } from 'react';
import { professorHoursService } from '@/services/professorHoursService';
import type { ProfessorSession } from '@/types/professorHours';

export function useProfessorHours() {
  const [sessions, setSessions] = useState<ProfessorSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [monthlyStats, setMonthlyStats] = useState({
    totalHours: 0,
    sessionsCount: 0,
    averageHoursPerSession: 0,
    daysWorked: 0,
    weeklyBreakdown: [] as { week: number; hours: number }[]
  });

  // Charger les sessions du mois
  const loadSessions = useCallback(async () => {
    setLoading(true);
    try {
      const data = await professorHoursService.getSessionsByMonth(currentYear, currentMonth);
      setSessions(data);
      
      const stats = await professorHoursService.getMonthlyStats(currentYear, currentMonth);
      // S'assurer que stats a la même structure que monthlyStats
      setMonthlyStats({
        totalHours: stats.totalHours,
        sessionsCount: stats.sessionsCount,
        averageHoursPerSession: stats.averageHoursPerSession,
        daysWorked: stats.daysWorked,
        weeklyBreakdown: stats.weeklyBreakdown || []
      });
    } catch (error) {
      console.error('Erreur chargement sessions:', error);
    } finally {
      setLoading(false);
    }
  }, [currentYear, currentMonth]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  // Sauvegarder une nouvelle session
  const saveSession = useCallback(async (session: Omit<ProfessorSession, 'id'>) => {
    try {
      const newSession = await professorHoursService.saveSession(session);
      setSessions(prev => [newSession, ...prev]);
      await loadSessions(); // Recharger les stats
      return newSession;
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      throw error;
    }
  }, [loadSessions]);

  // Mettre à jour une session
  const updateSession = useCallback(async (id: string, updates: Partial<Omit<ProfessorSession, 'id'>>) => {
    try {
      await professorHoursService.updateSession(id, updates);
      await loadSessions();
    } catch (error) {
      console.error('Erreur mise à jour:', error);
      throw error;
    }
  }, [loadSessions]);

  // Supprimer une session
  const deleteSession = useCallback(async (id: string) => {
    try {
      await professorHoursService.deleteSession(id);
      setSessions(prev => prev.filter(s => s.id !== id));
      await loadSessions(); // Recharger les stats
    } catch (error) {
      console.error('Erreur suppression:', error);
      throw error;
    }
  }, [loadSessions]);

  return {
    sessions,
    loading,
    monthlyStats,
    currentYear,
    currentMonth,
    setCurrentYear,
    setCurrentMonth,
    saveSession,
    updateSession,
    deleteSession,
    refresh: loadSessions
  };
}