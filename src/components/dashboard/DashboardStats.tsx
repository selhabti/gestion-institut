import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Users, TrendingUp, CheckCircle, PieChart } from "lucide-react";
import type { Member } from "@/types/member";

interface DashboardStatsProps {
  members: Member[];
  selectedGroup: string;
}

export const DashboardStats = ({ members, selectedGroup }: DashboardStatsProps) => {
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm">Total Membres</p>
              <h3 className="text-2xl font-bold text-slate-900">{filteredMembers.length}</h3>
            </div>
            <Users className="h-8 w-8 text-blue-500" />
          </div>
        </CardContent>
      </Card>

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
            <CheckCircle className="h-8 w-8 text-purple-500" />
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
              <p className="text-slate-600 text-sm">Présences Mois</p>
              <h3 className="text-2xl font-bold text-slate-900">{monthlyAttendances.length}</h3>
            </div>
            <PieChart className="h-8 w-8 text-orange-500" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
