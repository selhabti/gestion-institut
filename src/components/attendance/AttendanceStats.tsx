import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, CheckCircle, Target, PieChart } from "lucide-react";
import type { Member } from "@/types/member";

interface AttendanceStatsProps {
  members: Member[];
  selectedGroup: string;
}

export const AttendanceStats = ({ members, selectedGroup }: AttendanceStatsProps) => {
  const filteredMembers = members.filter(m => m.group === selectedGroup);
  const currentMonth = new Date().toISOString().slice(0, 7);
  
  const monthlyAttendances = filteredMembers.flatMap(m => 
    m.attendances.filter(a => a.date?.startsWith(currentMonth))
  );
  const presenceRate = monthlyAttendances.length > 0 
    ? Math.round((monthlyAttendances.filter(a => a.status === 'present').length / monthlyAttendances.length) * 100)
    : 0;

  const monthlyPayments = filteredMembers.flatMap(m =>
    m.payments.filter(p => p.date?.startsWith(currentMonth))
  );
  const paymentRate = filteredMembers.length > 0
    ? Math.round((monthlyPayments.length / filteredMembers.length) * 100)
    : 0;

  const attendanceStats = filteredMembers.reduce((acc, member) => {
    const monthlyPresences = member.attendances.filter(a => 
      a.date?.startsWith(currentMonth) && a.status === 'present'
    ).length;
    
    if (monthlyPresences >= 3) acc.excellent++;
    else if (monthlyPresences >= 2) acc.good++;
    else if (monthlyPresences >= 1) acc.average++;
    else acc.poor++;
    
    return acc;
  }, { excellent: 0, good: 0, average: 0, poor: 0 });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm">Taux de Présence</p>
              <h3 className="text-2xl font-bold text-slate-900">{presenceRate}%</h3>
            </div>
            <TrendingUp className="h-8 w-8 text-green-500" />
          </div>
          <div className="mt-3">
            <Progress value={presenceRate} className="h-2" />
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm">Cotisations</p>
              <h3 className="text-2xl font-bold text-slate-900">{paymentRate}%</h3>
            </div>
            <CheckCircle className="h-8 w-8 text-blue-500" />
          </div>
          <div className="mt-3">
            <Progress value={paymentRate} className="h-2" />
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm">Excellente Assiduité</p>
              <h3 className="text-2xl font-bold text-slate-900">{attendanceStats.excellent}</h3>
            </div>
            <Target className="h-8 w-8 text-purple-500" />
          </div>
          <div className="mt-3 text-sm text-slate-600">
            {Math.round((attendanceStats.excellent / filteredMembers.length) * 100)}% des élèves
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm">Sessions du Mois</p>
              <h3 className="text-2xl font-bold text-slate-900">{monthlyAttendances.length}</h3>
            </div>
            <PieChart className="h-8 w-8 text-orange-500" />
          </div>
          <div className="mt-3 text-sm text-slate-600">
            Présences totales
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
