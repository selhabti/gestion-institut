// pages/DashboardPage/components/AttendanceTab.tsx

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Suspense } from "react";
import { ChevronLeft, ChevronRight, CalendarDays, RotateCcw } from "lucide-react";
import type { Member, AttendanceStatus } from "@/types/member";
import type { SessionType } from "@/types/session";
import { lazyImport } from "@/utils/lazyImport";

const LazyMembersTable = lazyImport(() => import("@/components/MembersTable"));

interface AttendanceTabProps {
  filteredMembers: Member[];
  selectedGroup: SessionType;
  currentDateString: string;
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  onMarkPresent: (
    memberId: string,
    date: string,
    status: AttendanceStatus,
    session_type?: SessionType
  ) => void;
  onMarkPayment: (memberId: string) => void;
  onUnmarkPayment: (memberId: string) => void;
  shareMode: boolean;
  historicalEditMode: boolean;
  onHistoricalEditToggle: (enabled: boolean) => void;
  members: Member[];
  loading: boolean;
  onTransferAttendance?: (
    memberId: string,
    fromDate: string,
    toDate: string,
    fromGroup: SessionType,
    toGroup: SessionType
  ) => void;
  onAutoTransferAbsent?: () => void;
  activeTransfers: {
    memberId: string;
    fromGroup: SessionType;
    toGroup: SessionType;
    date: string;
  }[];
  onActiveTransfersChange: React.Dispatch<
    React.SetStateAction<
      {
        memberId: string;
        fromGroup: SessionType;
        toGroup: SessionType;
        date: string;
      }[]
    >
  >;
}

const DAYS_FR = [
  "Dimanche",
  "Lundi",
  "Mardi",
  "Mercredi",
  "Jeudi",
  "Vendredi",
  "Samedi",
];
const MONTHS_FR = [
  "janvier",
  "février",
  "mars",
  "avril",
  "mai",
  "juin",
  "juillet",
  "août",
  "septembre",
  "octobre",
  "novembre",
  "décembre",
];

export const AttendanceTab = ({
  filteredMembers,
  selectedGroup,
  currentDateString,
  selectedDate,
  onDateChange,
  onMarkPresent,
  onMarkPayment,
  onUnmarkPayment,
  shareMode,
  historicalEditMode,
  onHistoricalEditToggle,
  onTransferAttendance,
  onAutoTransferAbsent,
  activeTransfers,
  onActiveTransfersChange,
}: AttendanceTabProps) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const selected = new Date(selectedDate);
  selected.setHours(0, 0, 0, 0);

  const isToday = selected.getTime() === today.getTime();
  const isPast = selected < today;
  const isFuture = selected > today;

  const isSessionDay = (date: Date): boolean => {
    const day = date.getDay();
    return day === 6 || day === 0 || day === 1;
  };

  const navigateDate = (direction: "prev" | "next") => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + (direction === "prev" ? -1 : 1));
    onDateChange(newDate);

    const newToday = new Date();
    newToday.setHours(0, 0, 0, 0);
    newDate.setHours(0, 0, 0, 0);
    if (newDate < newToday && !historicalEditMode) {
      onHistoricalEditToggle(true);
    }
  };

  const navigateToSessionDay = (direction: "prev" | "next") => {
    const newDate = new Date(selectedDate);
    const step = direction === "prev" ? -1 : 1;

    for (let i = 0; i < 7; i++) {
      newDate.setDate(newDate.getDate() + step);
      if (isSessionDay(newDate)) {
        onDateChange(newDate);

        const newToday = new Date();
        newToday.setHours(0, 0, 0, 0);
        const check = new Date(newDate);
        check.setHours(0, 0, 0, 0);
        if (check < newToday && !historicalEditMode) {
          onHistoricalEditToggle(true);
        }
        return;
      }
    }
  };

  const goToToday = () => {
    onDateChange(new Date());
    if (historicalEditMode) {
      onHistoricalEditToggle(false);
    }
  };

  const formatDate = (date: Date): string => {
    return `${DAYS_FR[date.getDay()]} ${date.getDate()} ${
      MONTHS_FR[date.getMonth()]
    } ${date.getFullYear()}`;
  };

  const getSessionDayForDate = (date: Date): string | null => {
    const day = date.getDay();
    if (day === 6) return "Samedi";
    if (day === 0) return "Dimanche";
    if (day === 1) return "Lundi";
    return null;
  };

  const sessionDay = getSessionDayForDate(selectedDate);

  return (
    <div className="space-y-4">
      {/* NAVIGATION DE DATE */}
      <div className="bg-white/90 backdrop-blur-xl rounded-2xl border border-slate-200/60 shadow-lg p-4">
        <div className="flex items-center justify-between">
          {/* Boutons gauche */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateToSessionDay("prev")}
              className="h-9 px-3 text-slate-600 hover:text-slate-900 hover:bg-slate-100 border-slate-200"
              title="Séance précédente"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline text-xs">Séance préc.</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateDate("prev")}
              className="h-9 w-9 p-0 text-slate-500 hover:text-slate-700"
              title="Jour précédent"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>

          {/* Date centrale */}
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-blue-600" />
              <span className="font-geist-bold text-base text-slate-800">
                {formatDate(selectedDate)}
              </span>
            </div>
            <div className="flex items-center gap-2 flex-wrap justify-center">
              {isToday && (
                <Badge className="bg-emerald-500 text-white text-xs px-2 py-0.5">
                  Aujourd'hui
                </Badge>
              )}
              {isPast && !isToday && (
                <Badge
                  variant="outline"
                  className="bg-amber-50 text-amber-700 border-amber-200 text-xs px-2 py-0.5"
                >
                  Passé
                </Badge>
              )}
              {isFuture && (
                <Badge
                  variant="outline"
                  className="bg-blue-50 text-blue-700 border-blue-200 text-xs px-2 py-0.5"
                >
                  À venir
                </Badge>
              )}
              {sessionDay ? (
                <Badge
                  variant="outline"
                  className="bg-indigo-50 text-indigo-700 border-indigo-200 text-xs px-2 py-0.5"
                >
                  Cours {sessionDay}
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="bg-slate-50 text-slate-500 border-slate-200 text-xs px-2 py-0.5"
                >
                  Pas de cours
                </Badge>
              )}
              {isPast && historicalEditMode && (
                <Badge className="bg-purple-500 text-white text-xs px-2 py-0.5">
                  📝 Édition active
                </Badge>
              )}
            </div>
          </div>

          {/* Boutons droite */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateDate("next")}
              className="h-9 w-9 p-0 text-slate-500 hover:text-slate-700"
              title="Jour suivant"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateToSessionDay("next")}
              className="h-9 px-3 text-slate-600 hover:text-slate-900 hover:bg-slate-100 border-slate-200"
              title="Séance suivante"
            >
              <span className="hidden sm:inline text-xs">Séance suiv.</span>
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>

        {/* Bouton retour aujourd'hui */}
        {!isToday && (
          <div className="flex justify-center mt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={goToToday}
              className="h-8 px-4 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 border-blue-200"
            >
              <RotateCcw className="h-3 w-3 mr-1.5" />
              Revenir à aujourd'hui
            </Button>
          </div>
        )}
      </div>

      {/* TABLEAU */}
      <Card className="border border-slate-300 shadow-sm">
        <CardContent className="p-0">
          <Suspense
            fallback={
              <div className="flex items-center justify-center p-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-slate-600">
                  Chargement du tableau...
                </span>
              </div>
            }
          >
            <LazyMembersTable
              members={filteredMembers}
              selectedGroup={selectedGroup}
              currentDate={currentDateString}
              onMarkPresent={onMarkPresent}
              onMarkPayment={onMarkPayment}
              onUnmarkPayment={onUnmarkPayment}
              isAdmin={true}
              canManageMembers={true}
              shareMode={shareMode}
              historicalEditMode={historicalEditMode}
              onHistoricalEditToggle={onHistoricalEditToggle}
              onTransferAttendance={onTransferAttendance}
              onAutoTransferAbsent={onAutoTransferAbsent}
              activeTransfers={activeTransfers}
              onActiveTransfersChange={onActiveTransfersChange}
            />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
};