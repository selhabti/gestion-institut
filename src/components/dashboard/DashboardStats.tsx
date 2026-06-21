// DashboardStats.tsx - Version sans duplication
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Users, CheckCircle, Calendar, Star, Target, CreditCard } from "lucide-react";
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
  const presentAttendances = monthlyAttendances.filter(a => a.status === 'present');
  const monthlyPayments = filteredMembers.flatMap(m =>
    m.payments.filter(p => p.date?.startsWith(currentMonth))
  );

  const presenceRate = monthlyAttendances.length > 0 
    ? Math.round((presentAttendances.length / monthlyAttendances.length) * 100)
    : 0;

  const paymentRate = filteredMembers.length > 0
    ? Math.round((monthlyPayments.length / filteredMembers.length) * 100)
    : 0;

  // Statistiques UNIQUES - pas de duplication
  const stats = [
    {
      title: "Élèves inscrits",
      value: filteredMembers.length,
      description: `Groupe ${selectedGroup}`,
      icon: Users,
      color: "text-blue-500",
      showProgress: false
    },
    {
      title: "Taux de Présence",
      value: `${presenceRate}%`,
      description: "Ce mois-ci",
      icon: Star,
      color: "text-green-500",
      showProgress: true,
      progressValue: presenceRate
    },
    {
      title: "Cotisations",
      value: `${paymentRate}%`,
      description: "Membres à jour",
      icon: CreditCard,
      color: "text-purple-500",
      showProgress: true,
      progressValue: paymentRate
    },
    {
      title: "Séances actives",
      value: monthlyAttendances.length,
      description: "Ce mois-ci",
      icon: Calendar,
      color: "text-orange-500",
      showProgress: false
    },
    {
      title: "Présences validées",
      value: presentAttendances.length,
      description: "Séances avec présence",
      icon: CheckCircle,
      color: "text-green-600",
      showProgress: false
    },
    {
      title: "Objectif mensuel",
      value: presenceRate >= 80 ? "Atteint" : `${presenceRate}%`,
      description: "Objectif 80%",
      icon: Target,
      color: "text-red-500",
      showProgress: true,
      progressValue: presenceRate
    }
  ];

  return (
    <div className="space-y-6">
      {/* Grille principale - 6 stats uniques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((stat, index) => (
          <Card key={index} className="border-slate-200 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 text-sm font-medium">{stat.title}</p>
                  <h3 className="text-2xl font-bold text-slate-900">{stat.value}</h3>
                  <p className="text-slate-500 text-xs mt-1">{stat.description}</p>
                </div>
                <stat.icon className={`h-8 w-8 ${stat.color}`} />
              </div>
              {stat.showProgress && (
                <div className="mt-3">
                  <Progress value={stat.progressValue} className="h-2" />
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Message informatif */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="text-center">
            <p className="text-blue-800 font-medium">
              {filteredMembers.length} élèves inscrits - Groupe {selectedGroup}
            </p>
            <p className="text-blue-600 text-sm mt-1">
              Utilisez le tableau des présences pour marquer les élèves
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};