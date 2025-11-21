// Path: components/attendance/AttendanceStats.tsx
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  TrendingUp,
  CheckCircle,
  Target,
  PieChart,
  Users,
  Activity,
  CreditCard,
} from "lucide-react";
import type { Member } from "@/types/member";

interface AttendanceStatsProps {
  members: Member[];
  selectedGroup: string;
}

export const AttendanceStats = ({
  members,
  selectedGroup,
}: AttendanceStatsProps) => {
  const filteredMembers = members.filter((m) => m.group === selectedGroup);
  const currentMonth = new Date().toISOString().slice(0, 7);

  // Calcul des présences
  const monthlyAttendances = filteredMembers.flatMap((m) =>
    m.attendances.filter((a) => a.date?.startsWith(currentMonth))
  );
  const presentAttendances = monthlyAttendances.filter(
    (a) => a.status === "present"
  );
  const presenceRate =
    monthlyAttendances.length > 0
      ? Math.round(
          (presentAttendances.length / monthlyAttendances.length) * 100
        )
      : 0;

  // Calcul des paiements
  const monthlyPayments = filteredMembers.flatMap((m) =>
    m.payments.filter((p) => p.date?.startsWith(currentMonth))
  );
  const paymentRate =
    filteredMembers.length > 0
      ? Math.round((monthlyPayments.length / filteredMembers.length) * 100)
      : 0;

  // Statistiques d'assiduité
  const attendanceStats = filteredMembers.reduce(
    (acc, member) => {
      const monthlyPresences = member.attendances.filter(
        (a) => a.date?.startsWith(currentMonth) && a.status === "present"
      ).length;

      if (monthlyPresences >= 3) acc.excellent++;
      else if (monthlyPresences >= 2) acc.good++;
      else if (monthlyPresences >= 1) acc.average++;
      else acc.poor++;

      return acc;
    },
    { excellent: 0, good: 0, average: 0, poor: 0 }
  );

  // Taux d'assiduité moyen par élève
  const averageAttendancePerStudent =
    filteredMembers.length > 0
      ? Math.round((presentAttendances.length / filteredMembers.length) * 100)
      : 0;

  return (
    <div className="space-y-4">
      {/* Titre de section */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-100 rounded-lg">
          <TrendingUp className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-slate-900">
            Performance du mois
          </h3>
          <p className="text-sm text-slate-600">
            Groupe {selectedGroup} - {filteredMembers.length} élèves
          </p>
        </div>
      </div>

      {/* Grille de cartes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Carte Présence */}
        <Card className="border-l-4 border-l-green-500 shadow-sm hover:shadow-md transition-shadow duration-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-slate-600 text-sm font-medium mb-1">
                  Taux de Présence
                </p>
                <h3 className="text-2xl font-bold text-slate-900 mb-1">
                  {presenceRate}%
                </h3>
                <p className="text-xs text-slate-500">
                  {presentAttendances.length}/{monthlyAttendances.length}{" "}
                  séances
                </p>
              </div>
              <div className="p-2 bg-green-100 rounded-full flex-shrink-0">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
            </div>
            <div className="mt-3">
              <Progress value={presenceRate} className="h-2 bg-slate-200">
                <div
                  className="h-full bg-green-500 rounded-full transition-all duration-500"
                  style={{ width: `${presenceRate}%` }}
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
                  {paymentRate}%
                </h3>
                <p className="text-xs text-slate-500">
                  {monthlyPayments.length}/{filteredMembers.length} élèves
                </p>
              </div>
              <div className="p-2 bg-blue-100 rounded-full flex-shrink-0">
                <CreditCard className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            <div className="mt-3">
              <Progress value={paymentRate} className="h-2 bg-slate-200">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-500"
                  style={{ width: `${paymentRate}%` }}
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
                  {attendanceStats.excellent}
                </h3>
                <p className="text-xs text-slate-500">
                  {Math.round(
                    (attendanceStats.excellent / filteredMembers.length) * 100
                  )}
                  % des élèves
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
                  Sessions du Mois
                </p>
                <h3 className="text-2xl font-bold text-slate-900 mb-1">
                  {monthlyAttendances.length}
                </h3>
                <p className="text-xs text-slate-500">Total des séances</p>
              </div>
              <div className="p-2 bg-orange-100 rounded-full flex-shrink-0">
                <Activity className="h-5 w-5 text-orange-600" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-sm text-slate-600">
                <span className="font-medium text-green-600">
                  {presentAttendances.length}
                </span>{" "}
                présences
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Légende des niveaux d'assiduité */}
      <div className="flex flex-wrap gap-4 justify-center text-xs text-slate-600">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
          <span>Excellente (≥3): {attendanceStats.excellent}</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <span>Bonne (2): {attendanceStats.good}</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
          <span>Moyenne (1): {attendanceStats.average}</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          <span>Faible (0): {attendanceStats.poor}</span>
        </div>
      </div>
    </div>
  );
};
