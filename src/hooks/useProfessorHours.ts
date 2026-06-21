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
    cancelledCount: 0,
    averageHoursPerSession: 0,
    daysWorked: 0
  });

  // Charger les sessions du mois
  const loadSessions = useCallback(async () => {
    setLoading(true);
    try {
      const data = await professorHoursService.getSessionsByMonth(currentYear, currentMonth);
      setSessions(data);
      
      const stats = await professorHoursService.getMonthlyStats(currentYear, currentMonth);
      
      // Calculer cancelledCount à partir des sessions
      const cancelledCount = data.filter(s => s.status === 'cancelled').length;
      
      setMonthlyStats({
        totalHours: stats.totalHours,
        sessionsCount: stats.sessionsCount,
        cancelledCount: cancelledCount,
        averageHoursPerSession: stats.averageHoursPerSession,
        daysWorked: stats.daysWorked
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
      await loadSessions();
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
      await loadSessions();
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