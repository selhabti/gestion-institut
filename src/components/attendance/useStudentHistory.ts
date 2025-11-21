// src/hooks/useStudentHistory.ts
import { useMemo } from 'react';
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import type { Member, AttendanceStatus } from '@/types/member';
import type { StudentHistory, MonthlyStats, SessionDetail, PaymentStatus, AttendanceStats } from '@/types/attendance';

export const useStudentHistory = (members: Member[]) => {
  const getStudentHistory = (studentId: string): StudentHistory | null => {
    const student = members.find(m => m.id === studentId);
    if (!student) return null;

    const monthlyStats = calculateMonthlyStats(student);
    const paymentStatus = calculatePaymentStatus(student);
    const overallAttendance = calculateOverallAttendance(student, monthlyStats);

    return {
      studentId: student.id,
      firstName: student.firstName,
      lastName: student.lastName,
      group: student.group,
      monthlyStats,
      paymentStatus,
      overallAttendance
    };
  };

  const calculateMonthlyStats = (student: Member): MonthlyStats[] => {
    const months: MonthlyStats[] = [];
    const startDate = new Date(2024, 9, 1); // 1er octobre 2024
    const endDate = new Date(); // Aujourd'hui

    let currentDate = startOfMonth(startDate);
    
    while (currentDate <= endDate) {
      const monthKey = format(currentDate, 'yyyy-MM');
      const monthSessions = getSessionsForMonth(student, currentDate);
      
      const presentSessions = monthSessions.filter(s => s.status === 'present').length;
      const absentSessions = monthSessions.filter(s => s.status === 'absent').length;
      const totalSessions = monthSessions.length;
      const attendanceRate = totalSessions > 0 ? Math.round((presentSessions / totalSessions) * 100) : 0;

      months.push({
        month: monthKey,
        totalSessions,
        presentSessions,
        absentSessions,
        attendanceRate,
        sessions: monthSessions
      });

      currentDate = startOfMonth(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    }

    return months;
  };

  const getSessionsForMonth = (student: Member, month: Date): SessionDetail[] => {
    const sessions: SessionDetail[] = [];
    const start = startOfMonth(month);
    const end = endOfMonth(month);
    
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
    const dayOfWeek = date.getDay();
    
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
    return days[date.getDay()];
  };

  const calculatePaymentStatus = (student: Member): PaymentStatus => {
    const currentMonth = format(new Date(), 'yyyy-MM');
    const currentMonthPayments = student.payments.filter(p => 
      p.date && p.date.startsWith(currentMonth)
    );

    const amountPaid = currentMonthPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
    const monthlyFee = 0; // À adapter selon votre logique de tarification
    const amountDue = monthlyFee - amountPaid;

    let status: PaymentStatus['status'] = 'unpaid';
    if (amountPaid >= monthlyFee) {
      status = 'paid';
    } else if (amountPaid > 0) {
      status = 'partially_paid';
    }

    return {
      currentMonth,
      status,
      amountDue: Math.max(0, amountDue),
      amountPaid,
      dueDate: format(endOfMonth(new Date()), 'yyyy-MM-dd')
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

    // Taux spécifique au groupe
    const groupSessions = allSessions.filter(s => s.sessionType === student.group);
    const groupPresentSessions = groupSessions.filter(s => s.status === 'present').length;
    const groupSpecificRate = groupSessions.length > 0 ? 
      Math.round((groupPresentSessions / groupSessions.length) * 100) : 0;

    return {
      overallRate,
      monthlyRate,
      groupSpecificRate,
      totalSessions,
      presentCount: presentSessions,
      absentCount: absentSessions
    };
  };

  const getAllStudentsHistory = (): StudentHistory[] => {
    return members.map(member => getStudentHistory(member.id)!)
                  .filter(history => history !== null);
  };

  return {
    getStudentHistory,
    getAllStudentsHistory
  };
};
