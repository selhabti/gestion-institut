import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, TrendingUp, Users } from "lucide-react";
import type { Member } from "@/types/member";

interface MonthlyStatsProps {
  members: Member[];
  selectedGroup: "Samedi" | "Dimanche" | "Lundi";
}

export function MonthlyStats({ members, selectedGroup }: MonthlyStatsProps) {
  const getWeekendsCountOfCurrentMonth = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    let count = 0;
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dayOfWeek = date.getDay();
      
    if (
      (selectedGroup === "Samedi" && dayOfWeek === 6) ||
      (selectedGroup === "Dimanche" && dayOfWeek === 0) ||
      (selectedGroup === "Lundi" && dayOfWeek === 1)
    ) {
      count++;
    }
    }
    
    return count;
  };

  const getCurrentMonthStats = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    
    const groupMembers = members.filter((m) => m.group === selectedGroup);
    const totalWeekends = getWeekendsCountOfCurrentMonth();
    
    let totalPresences = 0;
    let totalAbsences = 0;
    let totalPaid = 0;
    
    groupMembers.forEach((member) => {
      const monthAttendances = member.attendances.filter((a) => {
        const date = new Date(a.date);
        return date.getFullYear() === year && date.getMonth() === month;
      });
      
      monthAttendances.forEach((a) => {
        if (a.status === "present") {
          totalPresences++;
        } else {
          totalAbsences++;
        }
      });
      
      const monthPayments = member.payments.filter((p) => {
        const date = new Date(p.date);
        return date.getFullYear() === year && date.getMonth() === month;
      });
      
      if (monthPayments.length > 0) {
        totalPaid++;
      }
    });
    
    const attendanceRate =
      groupMembers.length > 0 && totalWeekends > 0
        ? ((totalPresences / (groupMembers.length * totalWeekends)) * 100).toFixed(1)
        : "0";
    
    const paymentRate =
      groupMembers.length > 0 ? ((totalPaid / groupMembers.length) * 100).toFixed(1) : "0";
    
    return {
      totalMembers: groupMembers.length,
      totalPresences,
      totalAbsences,
      totalPaid,
      attendanceRate,
      paymentRate,
      totalWeekends,
    };
  };

  const stats = getCurrentMonthStats();
  const currentMonth = new Date().toLocaleDateString("fr-FR", { month: "long", year: "numeric" });

  return (
    <Card className="shadow-medium">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Statistiques - {selectedGroup}
        </CardTitle>
        <CardDescription>
          Période : {currentMonth} ({stats.totalWeekends} {selectedGroup.toLowerCase()}s)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-secondary/50 border">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Membres</span>
            </div>
            <p className="text-3xl font-bold">{stats.totalMembers}</p>
          </div>
          
          <div className="p-4 rounded-lg bg-secondary/50 border">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Taux de présence</span>
            </div>
            <p className="text-3xl font-bold">{stats.attendanceRate}%</p>
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg bg-success/10 border border-success/20">
            <span className="font-medium">Présences totales</span>
            <Badge variant="success" className="text-lg px-3 py-1">
              {stats.totalPresences}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <span className="font-medium">Absences totales</span>
            <Badge variant="destructive" className="text-lg px-3 py-1">
              {stats.totalAbsences}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between p-3 rounded-lg bg-warning/10 border border-warning/20">
            <span className="font-medium">Cotisations payées</span>
            <Badge variant="warning" className="text-lg px-3 py-1">
              {stats.totalPaid} / {stats.totalMembers}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10 border border-primary/20">
            <span className="font-medium">Taux de paiement</span>
            <Badge variant="default" className="text-lg px-3 py-1">
              {stats.paymentRate}%
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
