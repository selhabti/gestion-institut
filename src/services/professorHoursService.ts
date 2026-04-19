import { supabase } from '@/lib/supabase';
import type { ProfessorSession } from '@/types/professorHours';

class ProfessorHoursService {
  
  async saveSession(session: Omit<ProfessorSession, 'id'>): Promise<ProfessorSession> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('Non authentifié');

    const { data, error } = await supabase
      .from('professor_sessions')
      .insert([{
        user_id: userData.user.id,
        date: session.date,
        start_time: session.startTime,
        end_time: session.endTime,
        actual_hours: session.actualHours,
        notes: session.notes || null,
        status: session.status || 'completed'
      }])
      .select()
      .single();

    if (error) throw error;
    
    return {
      id: data.id,
      date: data.date,
      startTime: data.start_time,
      endTime: data.end_time,
      actualHours: data.actual_hours,
      notes: data.notes,
      status: data.status
    };
  }

  async getSessionsByMonth(year: number, month: number): Promise<ProfessorSession[]> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('Non authentifié');

    const lastDay = new Date(year, month, 0).getDate();
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    const { data, error } = await supabase
      .from('professor_sessions')
      .select('*')
      .eq('user_id', userData.user.id)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: false });

    if (error) throw error;

    return (data || []).map(item => ({
      id: item.id,
      date: item.date,
      startTime: item.start_time,
      endTime: item.end_time,
      actualHours: item.actual_hours,
      notes: item.notes,
      status: item.status
    }));
  }

  async getMonthlyStats(year: number, month: number) {
    const sessions = await this.getSessionsByMonth(year, month);
    
    const totalHours = sessions
      .filter(s => s.status !== 'cancelled')
      .reduce((sum, s) => sum + s.actualHours, 0);
    
    const sessionsCount = sessions.filter(s => s.status !== 'cancelled').length;
    const averageHoursPerSession = sessionsCount > 0 ? totalHours / sessionsCount : 0;
    const uniqueDays = new Set(sessions.map(s => s.date)).size;
    
    // Calcul du breakdown par semaine
    const weeklyBreakdown: { week: number; hours: number }[] = [];
    sessions.forEach(session => {
      if (session.status !== 'cancelled') {
        const date = new Date(session.date);
        const weekNumber = this.getWeekNumber(date);
        const existingWeek = weeklyBreakdown.find(w => w.week === weekNumber);
        if (existingWeek) {
          existingWeek.hours += session.actualHours;
        } else {
          weeklyBreakdown.push({ week: weekNumber, hours: session.actualHours });
        }
      }
    });
    
    return {
      totalHours,
      sessionsCount,
      averageHoursPerSession,
      daysWorked: uniqueDays,
      weeklyBreakdown
    };
  }

  private getWeekNumber(date: Date): number {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }

  async updateSession(id: string, updates: Partial<Omit<ProfessorSession, 'id'>>): Promise<void> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('Non authentifié');

    const updateData: any = {};
    if (updates.startTime !== undefined) updateData.start_time = updates.startTime;
    if (updates.endTime !== undefined) updateData.end_time = updates.endTime;
    if (updates.actualHours !== undefined) updateData.actual_hours = updates.actualHours;
    if (updates.notes !== undefined) updateData.notes = updates.notes;
    if (updates.status !== undefined) updateData.status = updates.status;

    const { error } = await supabase
      .from('professor_sessions')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userData.user.id);

    if (error) throw error;
  }

  async deleteSession(id: string): Promise<void> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('Non authentifié');

    const { error } = await supabase
      .from('professor_sessions')
      .delete()
      .eq('id', id)
      .eq('user_id', userData.user.id);

    if (error) throw error;
  }
}

export const professorHoursService = new ProfessorHoursService();