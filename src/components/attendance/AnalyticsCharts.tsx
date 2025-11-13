import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, PieChart } from "lucide-react";
import type { Member } from "@/types/member";

interface AnalyticsChartsProps {
  members: Member[];
  selectedGroup: string;
}

export const AnalyticsCharts = ({ members, selectedGroup }: AnalyticsChartsProps) => {
  const filteredMembers = members.filter(m => m.group === selectedGroup);
  
  // Données pour la répartition des présences
  const attendanceData = {
    excellent: filteredMembers.filter(m => 
      m.attendances.filter(a => a.status === 'present').length >= 3
    ).length,
    good: filteredMembers.filter(m => {
      const presences = m.attendances.filter(a => a.status === 'present').length;
      return presences >= 2 && presences < 3;
    }).length,
    average: filteredMembers.filter(m => {
      const presences = m.attendances.filter(a => a.status === 'present').length;
      return presences >= 1 && presences < 2;
    }).length,
    poor: filteredMembers.filter(m => 
      m.attendances.filter(a => a.status === 'present').length === 0
    ).length
  };

  // Données pour le statut des cotisations
  const paymentData = {
    paid: filteredMembers.filter(m => 
      m.payments.some(p => p.date?.startsWith(new Date().toISOString().slice(0, 7)))
    ).length,
    pending: filteredMembers.filter(m => 
      !m.payments.some(p => p.date?.startsWith(new Date().toISOString().slice(0, 7)))
    ).length
  };

  return (
    <>
      {/* Carte: Répartition des présences */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart className="h-5 w-5" />
            Répartition des présences
          </CardTitle>
          <CardDescription>
            Performance des élèves ce mois
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">Excellente (3+ séances)</span>
              <div className="flex items-center gap-2">
                <div className="w-24 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium">{attendanceData.excellent}</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">Bonne (2 séances)</span>
              <div className="flex items-center gap-2">
                <div className="w-20 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-sm font-medium">{attendanceData.good}</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">Moyenne (1 séance)</span>
              <div className="flex items-center gap-2">
                <div className="w-16 h-3 bg-yellow-500 rounded-full"></div>
                <span className="text-sm font-medium">{attendanceData.average}</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">Faible (0 séance)</span>
              <div className="flex items-center gap-2">
                <div className="w-12 h-3 bg-red-500 rounded-full"></div>
                <span className="text-sm font-medium">{attendanceData.poor}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Carte: Statut des cotisations */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5" />
            Statut des cotisations
          </CardTitle>
          <CardDescription>
            Suivi des paiements du mois en cours
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">Cotisations à jour</span>
              <div className="flex items-center gap-2">
                <div className="w-20 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium">
                  {paymentData.paid} ({Math.round((paymentData.paid / filteredMembers.length) * 100)}%)
                </span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">En attente</span>
              <div className="flex items-center gap-2">
                <div className="w-16 h-3 bg-orange-500 rounded-full"></div>
                <span className="text-sm font-medium">
                  {paymentData.pending} ({Math.round((paymentData.pending / filteredMembers.length) * 100)}%)
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
};