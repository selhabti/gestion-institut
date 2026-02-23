// src/components/attendance/useStudentHistory.ts
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { StudentHistory, MonthlyStats, SessionDetail, PaymentStatus } from '@/types/attendance';

export function useStudentHistory(studentId: string) {
  const [history, setHistory] = useState<StudentHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!studentId) return;
    
    const fetchHistory = async () => {
      try {
        setLoading(true);
        
        const { data: member } = await supabase
          .from('members')
          .select('id, first_name, last_name, group_type')
          .eq('id', studentId)
          .single();

        if (!member) throw new Error('Member not found');

        const { data: attendances } = await supabase
          .from('attendances')
          .select('*')
          .eq('member_id', studentId)
          .order('date', { ascending: false });

        const sessionsByMonth = new Map<string, SessionDetail[]>();
        
        attendances?.forEach(att => {
          const month = att.date.substring(0, 7);
          if (!sessionsByMonth.has(month)) {
            sessionsByMonth.set(month, []);
          }
          sessionsByMonth.get(month)!.push({
            date: att.date,
            day: new Date(att.date).toLocaleDateString('fr-FR', { weekday: 'long' }),
            status: att.status,
            sessionType: att.session_type || 'default'
          });
        });

        const monthlyStats: MonthlyStats[] = [];
        
        for (const [month, sessions] of sessionsByMonth) {
          const presentSessions = sessions.filter(s => s.status === 'present').length;
          const absentJustified = sessions.filter(s => s.status === 'absent_justified').length;
          const absentUnjustified = sessions.filter(s => s.status === 'absent_unjustified').length;
          const totalSessions = sessions.length;
          
          monthlyStats.push({
            month,
            totalSessions,
            presentSessions,
            absentSessions: absentJustified + absentUnjustified,
            attendanceRate: totalSessions > 0 ? Math.round((presentSessions / totalSessions) * 100) : 0,
            paymentStatus: {
              currentMonth: month,
              status: 'unpaid'
            },
            sessions: sessions.sort((a, b) => b.date.localeCompare(a.date))
          });
        }

        monthlyStats.sort((a, b) => b.month.localeCompare(a.month));

        const totalSessions = attendances?.length || 0;
        const presentCount = attendances?.filter(a => a.status === 'present').length || 0;
        const justifiedCount = attendances?.filter(a => a.status === 'absent_justified').length || 0;
        const unjustifiedCount = attendances?.filter(a => a.status === 'absent_unjustified').length || 0;

        setHistory({
          studentId: member.id,
          firstName: member.first_name,
          lastName: member.last_name,
          group: member.group_type,
          monthlyStats,
          overallAttendance: {
            overallRate: totalSessions > 0 ? Math.round((presentCount / totalSessions) * 100) : 0,
            monthlyRate: totalSessions > 0 ? Math.round((presentCount / totalSessions) * 100) : 0,
            groupSpecificRate: totalSessions > 0 ? Math.round((presentCount / totalSessions) * 100) : 0,
            totalSessions,
            presentCount,
            absentCount: justifiedCount + unjustifiedCount,
            justifiedAbsences: justifiedCount,
            unjustifiedAbsences: unjustifiedCount
          }
        });

      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [studentId]);

  return { history, loading, error };
}