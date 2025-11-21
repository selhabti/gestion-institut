// src/hooks/useStudentHistory.ts
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay } from 'date-fns';
import type { Member } from '@/types/member';
import type { StudentHistory, MonthlyStats, SessionDetail, PaymentStatus, AttendanceStats } from '@/types/attendance';

export const useStudentHistory = (members: Member[]) => {
  const getStudentHistory = (studentId: string): StudentHistory | null => {
    const student = members.find(m => m.id === studentId);
    if (!student) {
      return null;
    }

    const monthlyStats = calculateMonthlyStats(student);
    const overallAttendance = calculateOverallAttendance(student, monthlyStats);

    return {
      studentId: student.id,
      firstName: student.firstName,
      lastName: student.lastName,
      group: student.group,
      monthlyStats,
      overallAttendance
    };
  };

  const calculateMonthlyStats = (student: Member): MonthlyStats[] => {
    const months: MonthlyStats[] = [];
    
    // Toujours inclure les 3 derniers mois (à partir d'octobre 2025)
    const currentMonth = format(new Date(), 'yyyy-MM');
    const prevMonth1 = format(new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1), 'yyyy-MM');
    const prevMonth2 = format(new Date(new Date().getFullYear(), new Date().getMonth() - 2, 1), 'yyyy-MM');
    
    // Liste des mois à afficher (3 derniers mois)
    const monthsToShow = [currentMonth, prevMonth1, prevMonth2];
    
    // Filtrer pour garder seulement les mois à partir d'octobre 2025
    const filteredMonths = monthsToShow.filter(month => {
      const monthDate = new Date(month + '-01');
      const instituteStartDate = new Date('2025-10-01');
      return monthDate >= instituteStartDate;
    });
  
    // Pour chaque mois, calculer les statistiques (même s'il n'y a pas de données)
    filteredMonths.forEach(month => {
      const monthStats = calculateStatsForMonth(student, month);
      if (monthStats) {
        months.push(monthStats);
      }
    });
  
    return months;
  };

  const calculateStatsForMonth = (student: Member, month: string): MonthlyStats => {
    // Filtrer les présences du mois
    const monthAttendances = student.attendances.filter(att => 
      att.date && att.date.startsWith(month)
    );
    
    const presentSessions = monthAttendances.filter(att => att.status === 'present').length;
    const absentSessions = monthAttendances.filter(att => 
      att.status === 'absent_justified' || att.status === 'absent_unjustified'
    ).length;
    const totalSessions = presentSessions + absentSessions;
    const attendanceRate = totalSessions > 0 ? Math.round((presentSessions / totalSessions) * 100) : 0;

    // Calculer le statut de paiement
    const paymentStatus = calculatePaymentStatusForMonth(student, month);

    // Générer les sessions théoriques du mois
    const sessions = generateSessionsForMonth(student, month);

    return {
      month,
      totalSessions,
      presentSessions,
      absentSessions,
      attendanceRate,
      sessions,
      paymentStatus
    };
  };

  const generateSessionsForMonth = (student: Member, month: string): SessionDetail[] => {
    const sessions: SessionDetail[] = [];
    const start = startOfMonth(new Date(month + '-01'));
    const end = endOfMonth(start);
    
    const allDays = eachDayOfInterval({ start, end });

    allDays.forEach(day => {
      // Vérifier si c'est un jour de séance pour le groupe de l'élève
      const isSessionDay = isStudentSessionDay(day, student.group);
      if (!isSessionDay) return;

      const dateString = format(day, 'yyyy-MM-dd');
      const attendance = student.attendances.find(a => a.date === dateString);
      
      let status: SessionDetail['status'] = 'not_recorded';
      if (attendance) {
        status = attendance.status === 'present' ? 'present' : 'absent';
      }

      sessions.push({
        date: dateString,
        day: getFrenchDayName(day),
        status,
        sessionType: student.group
      });
    });

    return sessions;
  };

  const isStudentSessionDay = (date: Date, group: string): boolean => {
    const dayOfWeek = getDay(date);
    
    switch (group) {
      case 'Samedi':
        return dayOfWeek === 6; // Samedi
      case 'Dimanche':
        return dayOfWeek === 0; // Dimanche
      case 'Lundi':
        return dayOfWeek === 1; // Lundi
      default:
        return false;
    }
  };

  const getFrenchDayName = (date: Date): string => {
    const days = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
    return days[getDay(date)];
  };

  const calculatePaymentStatusForMonth = (student: Member, month: string): PaymentStatus => {
    const hasPayment = student.payments.some(p => 
      p.date && p.date.startsWith(month)
    );

    return {
      currentMonth: month,
      status: hasPayment ? 'paid' : 'unpaid',
      dueDate: format(endOfMonth(new Date(month + '-01')), 'yyyy-MM-dd')
    };
  };

  const calculateOverallAttendance = (student: Member, monthlyStats: MonthlyStats[]): AttendanceStats => {
    const allSessions = monthlyStats.flatMap(m => m.sessions);
    const presentSessions = allSessions.filter(s => s.status === 'present').length;
    const absentSessions = allSessions.filter(s => s.status === 'absent').length;
    const totalSessions = allSessions.length;

    const overallRate = totalSessions > 0 ? Math.round((presentSessions / totalSessions) * 100) : 0;
    
    // Taux du mois en cours
    const currentMonth = format(new Date(), 'yyyy-MM');
    const currentMonthStats = monthlyStats.find(m => m.month === currentMonth);
    const monthlyRate = currentMonthStats?.attendanceRate || 0;

    return {
      overallRate,
      monthlyRate,
      groupSpecificRate: overallRate,
      totalSessions,
      presentCount: presentSessions,
      absentCount: absentSessions
    };
  };

  return {
    getStudentHistory
  };
};