//Pages/DashboardPage/AttendanceStats.tsx
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, Target, Activity, CreditCard, Calendar, AlertCircle } from "lucide-react";
import type { Member } from "@/types/member";
import { SessionType } from "@/types/session";
import { useEvents } from "@/hooks/useEvents";
import { useState, useEffect, useMemo } from "react";

interface AttendanceStatsProps {
  members: Member[];
  selectedGroup: SessionType;
  isLoading?: boolean;
}

export const AttendanceStats = ({
  members,
  selectedGroup,
  isLoading = false,
}: AttendanceStatsProps) => {
  const { isDateExcludedFromStats } = useEvents();
  const [currentMonth, setCurrentMonth] = useState(() => new Date().toISOString().slice(0, 7));
  
  // Mettre à jour le mois courant chaque minute (au cas où minuit passe)
  useEffect(() => {
    const interval = setInterval(() => {
      const newMonth = new Date().toISOString().slice(0, 7);
      if (newMonth !== currentMonth) {
        setCurrentMonth(newMonth);
      }
    }, 60000); // Vérifie toutes les minutes

    return () => clearInterval(interval);
  }, [currentMonth]);

  const filteredMembers = useMemo(() => 
    members.filter((m) => 
      m.group === selectedGroup || 
      (m.secondaryGroups && m.secondaryGroups.includes(selectedGroup))
    ), 
    [members, selectedGroup]
  );

  // Calcul des statistiques ADJUSTÉES (excluant les vacances)
  const adjustedStats = useMemo(() => {
    let totalPresent = 0;
    let totalAttendances = 0;
    let totalExcludedDays = 0;
    
    // Statistiques d'assiduité ajustées
    const attendanceStats = {
      excellent: 0,
      good: 0,
      average: 0,
      poor: 0
    };

    // Paiements du mois
    const monthlyPayments = filteredMembers.flatMap((m) =>
      m.payments.filter((p) => p.date?.startsWith(currentMonth))
    );

    // Calcul pour chaque membre
    filteredMembers.forEach((member) => {
      // Présences du mois filtrées par jour de semaine de la date
      const monthlyAttendances = member.attendances.filter((a) => {
        if (!a.date?.startsWith(currentMonth)) return false;
        const day = new Date(a.date).getDay(); // 0=Dim, 1=Lun, 6=Sam
        if (selectedGroup === "Samedi+Dimanche")
          return day === 0 || day === 6;
        if (selectedGroup === "Samedi") return day === 6;
        if (selectedGroup === "Dimanche") return day === 0;
        if (selectedGroup === "Lundi") return day === 1;
        return true;
      });

      let memberPresentCount = 0;
      let memberTotalValidDays = 0;

      monthlyAttendances.forEach((attendance) => {
        // Vérifier si la date est exclue (vacances)
        if (!isDateExcludedFromStats(attendance.date, selectedGroup)) {
          memberTotalValidDays++;
          if (attendance.status === "present") {
            memberPresentCount++;
            totalPresent++;
          }
          totalAttendances++;
        } else {
          totalExcludedDays++;
        }
      });

      // Classer l'assiduité du membre
      if (memberTotalValidDays > 0) {
        const attendanceRate = memberPresentCount / memberTotalValidDays;
        
        if (memberPresentCount >= 3) attendanceStats.excellent++;
        else if (memberPresentCount >= 2) attendanceStats.good++;
        else if (memberPresentCount >= 1) attendanceStats.average++;
        else attendanceStats.poor++;
      } else {
        attendanceStats.poor++;
      }
    });

    // Calcul des taux
    const presenceRate = totalAttendances > 0 
      ? Math.round((totalPresent / totalAttendances) * 100)
      : 0;

    const paymentRate = filteredMembers.length > 0
      ? Math.round((monthlyPayments.length / filteredMembers.length) * 100)
      : 0;

    return {
      presenceRate,
      paymentRate,
      attendanceStats,
      totalPresent,
      totalAttendances,
      totalExcludedDays,
      monthlyPayments: monthlyPayments.length
    };
  }, [filteredMembers, currentMonth, selectedGroup, isDateExcludedFromStats]);

  console.log('📊 AttendanceStats debug:', {
    selectedGroup,
    totalMembers: members.length,
    filteredMembersCount: filteredMembers.length,
    currentMonth,
    adjustedStats
  });

  // Formatage du mois en français
  const monthName = useMemo(() => {
    const date = new Date();
    date.setMonth(parseInt(currentMonth.split('-')[1]) - 1);
    return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  }, [currentMonth]);

  return (
    <div className="space-y-6">
      {/* Titre de section avec info mois */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <TrendingUp className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              Performance du mois
            </h3>
            <p className="text-sm text-slate-600">
              Groupe {selectedGroup} • {filteredMembers.length} élèves • {monthName}
            </p>
          </div>
        </div>
        
        {/* Indicateur d'exclusion des vacances */}
        {adjustedStats.totalExcludedDays > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg border border-blue-200">
            <Calendar className="h-4 w-4 text-blue-600" />
            <div>
              <p className="text-xs font-medium text-blue-700">
                {adjustedStats.totalExcludedDays} jour(s) exclu(s)
              </p>
              <p className="text-[10px] text-blue-600">
                Vacances non comptabilisées
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Grille de cartes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Carte Présence */}
        <Card className="border-l-4 border-l-green-500 shadow-sm hover:shadow-md transition-shadow duration-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-slate-600 text-sm font-medium">
                    Taux de Présence
                  </p>
                  {adjustedStats.totalExcludedDays > 0 && (
                    <AlertCircle className="h-3 w-3 text-blue-500" aria-label="Vacances exclues" />
                  )}
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-1">
                  {adjustedStats.presenceRate}%
                </h3>
                <p className="text-xs text-slate-500">
                  {adjustedStats.totalPresent}/{adjustedStats.totalAttendances} séances
                  {adjustedStats.totalExcludedDays > 0 && (
                    <span className="text-blue-500 ml-2">
                      ({adjustedStats.totalExcludedDays} jour(s) exclu(s))
                    </span>
                  )}
                </p>
              </div>
              <div className="p-2 bg-green-100 rounded-full flex-shrink-0">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
            </div>
            <div className="mt-3">
              <Progress value={adjustedStats.presenceRate} className="h-2 bg-slate-200">
                <div
                  className="h-full bg-green-500 rounded-full transition-all duration-500"
                  style={{ width: `${adjustedStats.presenceRate}%` }}
                />
              </Progress>
            </div>
          </CardContent>
        </Card>

        {/* Carte Cotisations */}
        <Card className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow duration-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-slate-600 text-sm font-medium mb-1">
                  Cotisations
                </p>
                <h3 className="text-2xl font-bold text-slate-900 mb-1">
                  {adjustedStats.paymentRate}%
                </h3>
                <p className="text-xs text-slate-500">
                  {adjustedStats.monthlyPayments}/{filteredMembers.length} élèves
                </p>
              </div>
              <div className="p-2 bg-blue-100 rounded-full flex-shrink-0">
                <CreditCard className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            <div className="mt-3">
              <Progress value={adjustedStats.paymentRate} className="h-2 bg-slate-200">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-500"
                  style={{ width: `${adjustedStats.paymentRate}%` }}
                />
              </Progress>
            </div>
          </CardContent>
        </Card>

        {/* Carte Assiduité Excellente */}
        <Card className="border-l-4 border-l-purple-500 shadow-sm hover:shadow-md transition-shadow duration-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-slate-600 text-sm font-medium mb-1">
                  Excellente Assiduité
                </p>
                <h3 className="text-2xl font-bold text-slate-900 mb-1">
                  {adjustedStats.attendanceStats.excellent}
                </h3>
                <p className="text-xs text-slate-500">
                  {filteredMembers.length > 0 
                    ? Math.round((adjustedStats.attendanceStats.excellent / filteredMembers.length) * 100)
                    : 0}% des élèves
                </p>
              </div>
              <div className="p-2 bg-purple-100 rounded-full flex-shrink-0">
                <Target className="h-5 w-5 text-purple-600" />
              </div>
            </div>
            <div className="mt-2">
              <div className="flex justify-between text-xs text-slate-600">
                <span>≥ 3 présences</span>
                <span className="font-medium text-purple-600">Excellente</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Carte Engagement */}
        <Card className="border-l-4 border-l-orange-500 shadow-sm hover:shadow-md transition-shadow duration-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-slate-600 text-sm font-medium mb-1">
                  Sessions Valides
                </p>
                <h3 className="text-2xl font-bold text-slate-900 mb-1">
                  {adjustedStats.totalAttendances}
                </h3>
                <p className="text-xs text-slate-500">
                  Total des séances (vacances exclues)
                </p>
              </div>
              <div className="p-2 bg-orange-100 rounded-full flex-shrink-0">
                <Activity className="h-5 w-5 text-orange-600" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-sm text-slate-600">
                <span className="font-medium text-green-600">
                  {adjustedStats.totalPresent}
                </span>{" "}
                présences validées
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Détails et légende */}
      <div className="space-y-4">
        {/* Légende des niveaux d'assiduité */}
        <div className="flex flex-wrap gap-4 justify-center text-xs text-slate-600">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
            <span>Excellente (≥3): {adjustedStats.attendanceStats.excellent}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>Bonne (2): {adjustedStats.attendanceStats.good}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span>Moyenne (1): {adjustedStats.attendanceStats.average}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span>Faible (0): {adjustedStats.attendanceStats.poor}</span>
          </div>
        </div>

        {/* Note d'information */}
        {adjustedStats.totalExcludedDays > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
            <p className="text-sm text-blue-700">
              <Calendar className="h-3 w-3 inline mr-1" />
              Les statistiques excluent automatiquement {adjustedStats.totalExcludedDays} jour(s) de vacances/seminaire.
              Les taux sont calculés uniquement sur les jours de cours effectifs.
            </p>
          </div>
        )}

        {/* Indicateur de mise à jour */}
        <div className="text-center">
          <p className="text-xs text-slate-500">
            Statistiques du mois de {monthName} • Mise à jour automatique
          </p>
        </div>
      </div>
    </div>
  );
};