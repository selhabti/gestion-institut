//Path: src/components/MonthlyStats.tsx

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { MonthlyStatsProps } from '@/types/member';

const MonthlyStats: React.FC<MonthlyStatsProps> = ({ members, selectedGroup }) => {
  const groupMembers = members.filter(member => member.group === selectedGroup);
  
  const currentMonth = new Date().toISOString().slice(0, 7);
  
  // Calculs robustes avec vérifications
  const totalMembers = groupMembers.length;
  
  const presentThisMonth = groupMembers.filter(member => {
    if (!member.attendances || !Array.isArray(member.attendances)) return false;
    return member.attendances.some(attendance => 
      attendance && 
      attendance.date && 
      attendance.date.startsWith(currentMonth) && 
      attendance.status === 'present'
    );
  }).length;
  
  const paidThisMonth = groupMembers.filter(member => {
    if (!member.payments || !Array.isArray(member.payments)) return false;
    return member.payments.some(payment => 
      payment && 
      payment.date && 
      payment.date.startsWith(currentMonth)
    );
  }).length;
  
  const attendanceRate = totalMembers > 0 ? Math.round((presentThisMonth / totalMembers) * 100) : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Statistiques - {selectedGroup}</CardTitle>
        <CardDescription>Ce mois-ci</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-100">
            <div className="text-2xl font-bold text-blue-600">{totalMembers}</div>
            <div className="text-sm text-blue-600">Membres</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg border border-green-100">
            <div className="text-2xl font-bold text-green-600">{presentThisMonth}</div>
            <div className="text-sm text-green-600">Présents</div>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg border border-purple-100">
            <div className="text-2xl font-bold text-purple-600">{paidThisMonth}</div>
            <div className="text-sm text-purple-600">Cotisations</div>
          </div>
          <div className="text-center p-3 bg-orange-50 rounded-lg border border-orange-100">
            <div className="text-2xl font-bold text-orange-600">{attendanceRate}%</div>
            <div className="text-sm text-orange-600">Taux présence</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MonthlyStats;