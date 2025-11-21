// Path: src/components/attendance/SessionManager.tsx
import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Users,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
} from "lucide-react";
import type { Member, AttendanceStatus } from "@/types/member";
import type { SessionType } from "@/types/session";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  formatLocalDate,
  formatShortDate,
  formatDateForInput,
} from "@/utils/dateUtils";

interface SessionManagerProps {
  members: Member[];
  selectedGroup: SessionType;
  currentDate: string;
  onMarkPresent: (
    memberId: string,
    date: string,
    status: AttendanceStatus
  ) => void;
  onMarkPayment: (memberId: string) => void;
  onUnmarkPayment: (memberId: string) => void;
  onDateChange?: (date: string) => void;
}

export const SessionManager = ({
  members,
  selectedGroup,
  currentDate,
  onMarkPresent,
  onMarkPayment,
  onUnmarkPayment,
  onDateChange,
}: SessionManagerProps) => {
  const [viewMode, setViewMode] = useState<"current" | "other">("current");
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Fonction pour gérer la sélection d'une séance
  const handleSelectSession = (sessionDate: Date) => {
    const dateString = formatDateForInput(sessionDate);
    if (onDateChange) {
      onDateChange(dateString);
    }
  };

  // Fonction pour vérifier si une séance est sélectionnée
  const isSessionSelected = (sessionDate: Date) => {
    const sessionDateString = formatDateForInput(sessionDate);
    return sessionDateString === currentDate;
  };

  // Fonction pour obtenir les séances de la semaine
  const getWeeklySessions = () => {
    const today = new Date();
    const sessions = [];

    const sessionsConfig = [
      { day: 6, name: "Samedi", group: "Samedi" as SessionType, color: "blue" },
      {
        day: 0,
        name: "Dimanche",
        group: "Dimanche" as SessionType,
        color: "green",
      },
      { day: 1, name: "Lundi", group: "Lundi" as SessionType, color: "orange" },
    ];

    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);

      sessionsConfig.forEach((session) => {
        if (date.getDay() === session.day) {
          sessions.push({
            date: new Date(date),
            name: session.name,
            group: session.group,
            color: session.color,
            isToday: date.toDateString() === today.toDateString(),
          });
        }
      });
    }

    return sessions.sort((a, b) => a.date.getTime() - b.date.getTime());
  };

  // Fonction pour obtenir les séances d'un mois
  const getMonthlySessions = (month: Date) => {
    const year = month.getFullYear();
    const monthNum = month.getMonth();
    const sessions = [];

    const sessionsConfig = [
      { day: 6, name: "Samedi", group: "Samedi" as SessionType, color: "blue" },
      {
        day: 0,
        name: "Dimanche",
        group: "Dimanche" as SessionType,
        color: "green",
      },
      { day: 1, name: "Lundi", group: "Lundi" as SessionType, color: "orange" },
    ];

    const firstDay = new Date(year, monthNum, 1);
    const lastDay = new Date(year, monthNum + 1, 0);

    for (let day = firstDay.getDate(); day <= lastDay.getDate(); day++) {
      const date = new Date(year, monthNum, day);

      sessionsConfig.forEach((session) => {
        if (date.getDay() === session.day) {
          sessions.push({
            date: new Date(date),
            name: session.name,
            group: session.group,
            color: session.color,
            isToday: date.toDateString() === new Date().toDateString(),
          });
        }
      });
    }

    return sessions;
  };

  // Statistiques de présence pour la séance du jour
  const getAttendanceStats = () => {
    const groupMembers =
      selectedGroup === "Samedi+Dimanche"
        ? members.filter((m) => m.group === "Samedi" || m.group === "Dimanche")
        : members.filter((m) => m.group === selectedGroup);

    const totalMembers = groupMembers.length;
    if (totalMembers === 0) return { present: 0, absent: 0, rate: 0 };

    const presentCount = groupMembers.filter((member) =>
      member.attendances.some(
        (att) => att.date === currentDate && att.status === "present"
      )
    ).length;

    const rate = Math.round((presentCount / totalMembers) * 100);

    return {
      present: presentCount,
      absent: totalMembers - presentCount,
      rate: rate,
    };
  };

  const weeklySessions = getWeeklySessions();
  const monthlySessions = getMonthlySessions(currentMonth);
  const stats = getAttendanceStats();
  const currentSession = weeklySessions.find(
    (s) => formatDateForInput(s.date) === currentDate // ← CORRIGÉ
  );

  // Navigation entre mois
  const navigateMonth = (direction: "prev" | "next") => {
    const newMonth = new Date(currentMonth);
    if (direction === "prev") {
      newMonth.setMonth(newMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1);
    }
    setCurrentMonth(newMonth);
  };

  // Fonction pour obtenir la classe de couleur du badge
  const getBadgeColorClass = (color: string) => {
    const colorMap: { [key: string]: string } = {
      blue: "bg-blue-500",
      green: "bg-green-500",
      orange: "bg-orange-500",
    };
    return colorMap[color] || "bg-blue-500";
  };

  return (
    <div className="space-y-6">
      {/* Séance du jour */}
      {currentSession && (
        <Card className="border-2 border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <Calendar className="h-5 w-5" />
              Séance du jour - {currentSession.name}
            </CardTitle>
            <CardDescription className="text-blue-700">
              {formatLocalDate(formatDateForInput(currentSession.date))}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Badge
                  className={`${getBadgeColorClass(
                    currentSession.color
                  )} text-white`}
                >
                  {currentSession.name}
                </Badge>
                <div className="text-sm text-blue-800">
                  {stats.present} présents sur {stats.present + stats.absent}{" "}
                  élèves
                </div>
              </div>
              <Badge variant="outline" className="bg-white">
                {stats.rate}% de présence
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation des séances */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Navigation des séances
          </CardTitle>
          <CardDescription>
            Sélectionnez une séance pour voir et gérer les présences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Button
              variant={viewMode === "current" ? "default" : "outline"}
              onClick={() => setViewMode("current")}
              className="flex items-center gap-2"
            >
              <Calendar className="h-4 w-4" />
              Semaine en cours
            </Button>
            <Button
              variant={viewMode === "other" ? "default" : "outline"}
              onClick={() => setViewMode("other")}
              className="flex items-center gap-2"
            >
              <Calendar className="h-4 w-4" />
              Autres mois
            </Button>
          </div>

          {viewMode === "current" ? (
            <div className="space-y-3">
              <h4 className="font-semibold text-slate-900">
                Prochaines séances cette semaine :
              </h4>
              {weeklySessions.map((session) => {
                const isSelected = isSessionSelected(session.date);
                return (
                  <div
                    key={session.date.toISOString()}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      session.isToday
                        ? "bg-blue-50 border-blue-200"
                        : isSelected
                        ? "bg-green-50 border-green-200 border-2"
                        : "bg-slate-50 border-slate-200"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Badge
                        className={`${getBadgeColorClass(
                          session.color
                        )} text-white`}
                      >
                        {session.name}
                      </Badge>
                      <span className="font-medium">
                        {formatLocalDate(
                          formatDateForInput(session.date),
                          "EEEE d MMMM"
                        )}
                      </span>
                      {session.isToday && (
                        <Badge
                          variant="secondary"
                          className="bg-green-100 text-green-800"
                        >
                          Aujourd'hui
                        </Badge>
                      )}
                      {isSelected && (
                        <Badge
                          variant="secondary"
                          className="bg-green-100 text-green-800 flex items-center gap-1"
                        >
                          <CheckCircle className="h-3 w-3" />
                          Sélectionnée
                        </Badge>
                      )}
                    </div>
                    <Button
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleSelectSession(session.date)}
                    >
                      {isSelected ? "Sélectionnée" : "Voir"}
                    </Button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateMonth("prev")}
                  className="flex items-center gap-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Mois précédent
                </Button>

                <span className="font-semibold">
                  {format(currentMonth, "MMMM yyyy", { locale: fr })}
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateMonth("next")}
                  className="flex items-center gap-1"
                >
                  Mois suivant
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {monthlySessions.map((session) => {
                  const isSelected = isSessionSelected(session.date);
                  return (
                    <div
                      key={session.date.toISOString()}
                      className={`flex items-center justify-between p-3 rounded-lg border ${
                        isSelected
                          ? "bg-green-50 border-green-200 border-2"
                          : "border-slate-200 bg-white"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Badge
                          className={`${getBadgeColorClass(
                            session.color
                          )} text-white`}
                        >
                          {session.name}
                        </Badge>
                        <span className="text-sm">
                          {formatShortDate(formatDateForInput(session.date))}
                        </span>
                        {isSelected && (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        )}
                      </div>
                      <Button
                        variant={isSelected ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleSelectSession(session.date)}
                      >
                        {isSelected ? "Sélectionnée" : "Sélectionner"}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
