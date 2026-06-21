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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  History,
  Search,
  Users,
  UserPlus,
  Filter,
  X,
  Check,
} from "lucide-react";
import type { Member, AttendanceStatus } from "@/types/member";
import type { SessionType } from "@/types/session";
import { format, subMonths, isAfter, isBefore } from "date-fns";
import { fr } from "date-fns/locale";
import {
  formatLocalDate,
  formatShortDate,
  formatDateForInput,
} from "@/utils/dateUtils";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { capitalize } from "@/lib/utils";

// Définir l'interface Session localement
interface Session {
  id?: string;
  date: Date;
  name: string;
  group: SessionType;
  color: string;
  isToday?: boolean;
}

interface SessionManagerProps {
  members: Member[];
  selectedGroup: SessionType;
  selectedDate: string;
  onMarkPresent: (
    memberId: string,
    date: string,
    status: AttendanceStatus,
    group?: SessionType
  ) => void;
  onMarkPayment: (memberId: string) => void;
  onUnmarkPayment: (memberId: string) => void;
  onDateChange?: (date: string) => void;
  shareMode: boolean;
  isAdmin?: boolean;
  onDeleteMember?: (memberId: string) => void;
  historicalEditMode?: boolean;
  onHistoricalEditToggle?: (enabled: boolean) => void;
}

const HISTORICAL_START_DATE = new Date(2025, 9, 1);

export const SessionManager = ({
  members,
  selectedGroup,
  selectedDate,
  onMarkPresent,
  onMarkPayment,
  onUnmarkPayment,
  onDateChange,
  shareMode,
  isAdmin = false,
  onDeleteMember,
  historicalEditMode = false,
  onHistoricalEditToggle,
}: SessionManagerProps) => {
  const [viewMode, setViewMode] = useState<"current" | "other">("current");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [activeTab, setActiveTab] = useState<"table" | "search" | "calendar">("table");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchTab, setSearchTab] = useState<"group" | "all">("group");
  const [showAttendanceOptions, setShowAttendanceOptions] = useState<string | null>(null);

  const currentDate = selectedDate;

  const handleSelectSession = (sessionDate: Date) => {
    const dateString = formatDateForInput(sessionDate);
    if (onDateChange) {
      onDateChange(dateString);
    }
    if (!historicalEditMode) {
      setViewMode("current");
    }
  };

  const isSessionSelected = (sessionDate: Date) => {
    const sessionDateString = formatDateForInput(sessionDate);
    return sessionDateString === currentDate;
  };

  const getWeeklySessions = (): Session[] => {
    const today = new Date();
    const sessions: Session[] = [];

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

  const getMonthlySessions = (month: Date): Session[] => {
    const year = month.getFullYear();
    const monthNum = month.getMonth();
    const sessions: Session[] = [];

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

      if (isAfter(date, new Date()) && !historicalEditMode) continue;

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

    if (historicalEditMode) {
      return sessions.filter((session) =>
        isAfter(session.date, subMonths(HISTORICAL_START_DATE, 1))
      );
    }

    return sessions;
  };

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

  const getGroupMembers = () => {
    if (selectedGroup === "Samedi+Dimanche") {
      return members.filter(m => m.group === "Samedi" || m.group === "Dimanche");
    }
    return members.filter(m => m.group === selectedGroup);
  };

  const getFilteredMembers = () => {
    const membersToShow = searchTab === "group" ? getGroupMembers() : members;
    
    if (!searchTerm.trim()) return membersToShow;
    
    const term = searchTerm.toLowerCase();
    return membersToShow.filter(member =>
      member.firstName.toLowerCase().includes(term) ||
      member.lastName.toLowerCase().includes(term) ||
      (member.city && member.city.toLowerCase().includes(term))
    );
  };

  // Version simplifiée de canAddToTodayGroup sans utiliser attendance.group
  const canAddToTodayGroup = (member: Member) => {
    // Vérifier si déjà présent aujourd'hui
    const isPresentToday = member.attendances?.some(
      a => a.date === currentDate && a.status === "present"
    );
    
    if (isPresentToday) return false;
    
    // Règles de base
    if (member.group === "Lundi") return false;
    if (member.group === selectedGroup) return false;
    
    // Transferts autorisés
    if (member.group === "Samedi" && selectedGroup === "Dimanche") return true;
    if (member.group === "Dimanche" && selectedGroup === "Samedi") return true;
    if (member.group === "Samedi+Dimanche" && 
        (selectedGroup === "Samedi" || selectedGroup === "Dimanche")) return true;
    
    return false;
  };

  const handleQuickAttendance = (
    member: Member,
    status: AttendanceStatus,
    group?: SessionType
  ) => {
    const groupToUse = group || selectedGroup;
    const isException = groupToUse !== member.group;
    
    let message = "";
    if (status === "present") {
      message = isException 
        ? `Marquer ${capitalize(member.firstName)} comme présent dans le groupe ${groupToUse} ?\n(Présence exceptionnelle - groupe normal: ${member.group})`
        : `Marquer ${capitalize(member.firstName)} comme présent ?`;
    } else {
      message = `Marquer ${capitalize(member.firstName)} comme ${status === "absent_justified" ? "absent justifié" : "absent non justifié"} ?`;
    }
    
    if (window.confirm(message)) {
      onMarkPresent(member.id, currentDate, status, groupToUse);
      setShowAttendanceOptions(null);
    }
  };

  const handleAddToTodayGroup = (member: Member) => {
    const confirmMsg = window.confirm(
      `Ajouter ${capitalize(member.firstName)} ${capitalize(member.lastName)} au groupe ${selectedGroup} pour aujourd'hui ?\n\n` +
      `(Présence exceptionnelle - ne change pas son groupe d'inscription)`
    );
    
    if (confirmMsg) {
      onMarkPresent(member.id, currentDate, "present", selectedGroup);
    }
  };

  const weeklySessions = getWeeklySessions();
  const monthlySessions = getMonthlySessions(currentMonth);
  const stats = getAttendanceStats();
  const currentSession = weeklySessions.find(
    (s) => formatDateForInput(s.date) === currentDate
  );
  const filteredMembers = getFilteredMembers();

  const navigateMonth = (direction: "prev" | "next") => {
    const newMonth = new Date(currentMonth);
    if (direction === "prev") {
      if (
        historicalEditMode &&
        isBefore(subMonths(newMonth, 1), HISTORICAL_START_DATE)
      ) {
        alert(
          "Vous avez atteint le début de l'historique d'édition (Octobre 2025)."
        );
        return;
      }
      newMonth.setMonth(newMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1);
    }
    setCurrentMonth(newMonth);
  };

  const getBadgeColorClass = (color: string) => {
    const colorMap: { [key: string]: string } = {
      blue: "bg-blue-500",
      green: "bg-green-500",
      orange: "bg-orange-500",
    };
    return colorMap[color] || "bg-blue-500";
  };

  const getGroupColor = (group: string) => {
    switch(group) {
      case "Samedi": return "bg-blue-100 text-blue-800 border-blue-200";
      case "Dimanche": return "bg-green-100 text-green-800 border-green-200";
      case "Lundi": return "bg-orange-100 text-orange-800 border-orange-200";
      case "Samedi+Dimanche": return "bg-purple-100 text-purple-800 border-purple-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const toggleHistoricalEditMode = () => {
    if (!historicalEditMode) {
      setViewMode("other");
      setCurrentMonth(HISTORICAL_START_DATE);
    } else {
      setViewMode("current");
      setCurrentMonth(new Date());
    }
    if (onHistoricalEditToggle) {
      onHistoricalEditToggle(!historicalEditMode);
    }
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
              {historicalEditMode && (
                <Badge variant="destructive" className="ml-4">
                  MODE ÉDITION HISTORIQUE ACTIF
                </Badge>
              )}
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

      {/* Le reste du JSX reste identique jusqu'à MemberList */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
        <TabsList className="grid grid-cols-3">
          <TabsTrigger value="table" className="gap-2">
            <Users className="h-4 w-4" />
            Tableau complet
          </TabsTrigger>
          <TabsTrigger value="search" className="gap-2">
            <Search className="h-4 w-4" />
            Recherche rapide
          </TabsTrigger>
          <TabsTrigger value="calendar" className="gap-2">
            <Calendar className="h-4 w-4" />
            Navigation dates
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="table" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Liste des élèves - Groupe {selectedGroup}
                </span>
                {isAdmin && (
                  <Button
                    variant={historicalEditMode ? "destructive" : "outline"}
                    onClick={toggleHistoricalEditMode}
                    className="flex items-center gap-2"
                    size="sm"
                  >
                    <History className="h-4 w-4" />
                    {historicalEditMode
                      ? "Désactiver Édit. Historique"
                      : "Modifier Historique"}
                  </Button>
                )}
              </CardTitle>
              <CardDescription>
                Gestion complète des présences et paiements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-slate-400">
                <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="font-medium">Tableau des présences</p>
                <p className="text-sm mt-1">
                  Le tableau complet est géré par le composant MembersTable
                </p>
                <p className="text-xs text-slate-500 mt-2">
                  Utilisez l'onglet "Recherche rapide" pour ajouter facilement des élèves
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="search" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Recherche et gestion rapide
              </CardTitle>
              <CardDescription>
                Ajoutez facilement des élèves au groupe d'aujourd'hui
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Rechercher un élève par nom, prénom ou ville..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSearchTerm("")}
                  disabled={!searchTerm}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <Tabs value={searchTab} onValueChange={(v) => setSearchTab(v as any)} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="group" className="gap-2">
                    <Users className="h-4 w-4" />
                    Groupe actuel ({getGroupMembers().length})
                  </TabsTrigger>
                  <TabsTrigger value="all" className="gap-2">
                    <Filter className="h-4 w-4" />
                    Tous les élèves ({members.length})
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="group" className="mt-4">
                  <p className="text-sm text-slate-500 mb-3">
                    Élèves inscrits au groupe {selectedGroup}
                  </p>
                  <MemberList
                    members={filteredMembers}
                    currentDate={currentDate}
                    selectedGroup={selectedGroup}
                    showAttendanceOptions={showAttendanceOptions}
                    onToggleOptions={setShowAttendanceOptions}
                    onQuickAttendance={handleQuickAttendance}
                    onAddToTodayGroup={handleAddToTodayGroup}
                    onMarkPayment={onMarkPayment}
                    onUnmarkPayment={onUnmarkPayment}
                    canAddToTodayGroup={canAddToTodayGroup}
                    showAddButton={false}
                  />
                </TabsContent>
                
                <TabsContent value="all" className="mt-4">
                  <p className="text-sm text-slate-500 mb-3">
                    Tous les élèves - Vous pouvez ajouter n'importe quel élève au groupe d'aujourd'hui
                  </p>
                  <MemberList
                    members={filteredMembers}
                    currentDate={currentDate}
                    selectedGroup={selectedGroup}
                    showAttendanceOptions={showAttendanceOptions}
                    onToggleOptions={setShowAttendanceOptions}
                    onQuickAttendance={handleQuickAttendance}
                    onAddToTodayGroup={handleAddToTodayGroup}
                    onMarkPayment={onMarkPayment}
                    onUnmarkPayment={onUnmarkPayment}
                    canAddToTodayGroup={canAddToTodayGroup}
                    showAddButton={true}
                  />
                </TabsContent>
              </Tabs>

              {filteredMembers.length === 0 && searchTerm && (
                <div className="text-center py-8 text-slate-400">
                  <Search className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="font-medium">Aucun élève trouvé</p>
                  <p className="text-sm mt-1">Essayez avec un autre terme de recherche</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="calendar" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Navigation des séances
                </span>
                {isAdmin && (
                  <Button
                    variant={historicalEditMode ? "destructive" : "outline"}
                    onClick={toggleHistoricalEditMode}
                    className="flex items-center gap-2"
                    size="sm"
                  >
                    <History className="h-4 w-4" />
                    {historicalEditMode
                      ? "Désactiver Édit. Historique"
                      : "Modifier Historique"}
                  </Button>
                )}
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
                  disabled={historicalEditMode}
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
                      disabled={
                        historicalEditMode &&
                        isBefore(currentMonth, HISTORICAL_START_DATE)
                      }
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Mois précédent
                    </Button>

                    <span className="font-semibold">
                      {format(currentMonth, "MMMM yyyy", { locale: fr })}
                      {historicalEditMode && isBefore(currentMonth, new Date()) && (
                        <Badge
                          variant="secondary"
                          className="ml-2 bg-yellow-100 text-yellow-800"
                        >
                          Historique
                        </Badge>
                      )}
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
                      const isPastSession = isBefore(session.date, new Date());
                      const isActionable = isPastSession || historicalEditMode;

                      if (!isActionable && !isSelected) return null;

                      return (
                        <div
                          key={session.date.toISOString()}
                          className={`flex items-center justify-between p-3 rounded-lg border ${
                            isSelected
                              ? "bg-green-50 border-green-200 border-2"
                              : isPastSession && historicalEditMode
                              ? "bg-yellow-50 border-yellow-200"
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
                            {historicalEditMode && isPastSession && !isSelected && (
                              <Badge
                                variant="secondary"
                                className="bg-yellow-100 text-yellow-800"
                              >
                                Édit.
                              </Badge>
                            )}
                          </div>
                          <Button
                            variant={isSelected ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleSelectSession(session.date)}
                          >
                            {historicalEditMode
                              ? isSelected
                                ? "En Cours d'Édition"
                                : "Modifier Présence"
                              : isSelected
                              ? "Sélectionnée"
                              : "Sélectionner"}
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

interface MemberListProps {
  members: Member[];
  currentDate: string;
  selectedGroup: SessionType;
  showAttendanceOptions: string | null;
  onToggleOptions: (memberId: string | null) => void;
  onQuickAttendance: (member: Member, status: AttendanceStatus, group?: SessionType) => void;
  onAddToTodayGroup: (member: Member) => void;
  onMarkPayment: (memberId: string, amount?: number) => void;
  onUnmarkPayment: (memberId: string) => void;
  canAddToTodayGroup: (member: Member) => boolean;
  showAddButton: boolean;
}

function MemberList({
  members,
  currentDate,
  selectedGroup,
  showAttendanceOptions,
  onToggleOptions,
  onQuickAttendance,
  onAddToTodayGroup,
  onMarkPayment,
  onUnmarkPayment,
  canAddToTodayGroup,
  showAddButton,
}: MemberListProps) {
  // Fonctions simplifiées sans utiliser group
  const isPresentToday = (member: Member) => {
    return member.attendances?.some(a => a.date === currentDate && a.status === "present");
  };

  const isAbsentJustified = (member: Member) => {
    return member.attendances?.some(a => a.date === currentDate && a.status === "absent_justified");
  };

  const isAbsentUnjustified = (member: Member) => {
    return member.attendances?.some(a => a.date === currentDate && a.status === "absent_unjustified");
  };

  const getAttendanceStatus = (member: Member) => {
    return member.attendances?.find(a => a.date === currentDate);
  };

  const getPaymentStatus = (member: Member) => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    return member.payments?.some(p => p.date?.startsWith(currentMonth)) || false;
  };

  const getGroupColor = (group: string) => {
    switch(group) {
      case "Samedi": return "bg-blue-100 text-blue-800 border-blue-200";
      case "Dimanche": return "bg-green-100 text-green-800 border-green-200";
      case "Lundi": return "bg-orange-100 text-orange-800 border-orange-200";
      case "Samedi+Dimanche": return "bg-purple-100 text-purple-800 border-purple-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <ScrollArea className="h-[400px] pr-4">
      <div className="space-y-2">
        {members.map(member => {
          const present = isPresentToday(member);
          const absentJustified = isAbsentJustified(member);
          const absentUnjustified = isAbsentUnjustified(member);
          const attendance = getAttendanceStatus(member);
          const hasPaid = getPaymentStatus(member);
          const canAdd = canAddToTodayGroup(member);
          const isOptionsOpen = showAttendanceOptions === member.id;

          return (
            <Card key={member.id} className="p-3 hover:bg-slate-50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-medium">
                      {capitalize(member.firstName)} {capitalize(member.lastName)}
                    </span>
                    
                    <Badge variant="outline" className={`text-xs ${getGroupColor(member.group)}`}>
                      {member.group}
                    </Badge>
                    
                    {present && (
                      <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">
                        <Check className="h-3 w-3 mr-1" />
                        Présent
                      </Badge>
                    )}
                    
                    {absentJustified && (
                      <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 text-xs">
                        Absent justifié
                      </Badge>
                    )}
                    
                    {absentUnjustified && (
                      <Badge className="bg-red-100 text-red-800 border-red-200 text-xs">
                        Absent non justifié
                      </Badge>
                    )}
                    
                    {hasPaid && (
                      <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs">
                        Payé ce mois
                      </Badge>
                    )}
                  </div>
                  
                  {member.city && (
                    <p className="text-xs text-slate-500">
                      Ville: {capitalize(member.city)}
                    </p>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onToggleOptions(isOptionsOpen ? null : member.id)}
                    className="h-8 w-8 p-0"
                  >
                    <span className="text-xs">...</span>
                  </Button>
                  
                  {showAddButton && canAdd && !present && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onAddToTodayGroup(member)}
                      className="h-8 text-xs border-dashed"
                    >
                      <UserPlus className="h-3 w-3 mr-1" />
                      Ajouter
                    </Button>
                  )}
                </div>
              </div>
              
              {isOptionsOpen && (
                <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
                  <div className="grid grid-cols-3 gap-1">
                    <Button
                      size="sm"
                      variant={present ? "default" : "outline"}
                      onClick={() => onQuickAttendance(member, "present")}
                      className="text-xs h-7"
                    >
                      Présent
                    </Button>
                    <Button
                      size="sm"
                      variant={absentJustified ? "default" : "outline"}
                      onClick={() => onQuickAttendance(member, "absent_justified")}
                      className="text-xs h-7"
                    >
                      Abs. justifié
                    </Button>
                    <Button
                      size="sm"
                      variant={absentUnjustified ? "default" : "outline"}
                      onClick={() => onQuickAttendance(member, "absent_unjustified")}
                      className="text-xs h-7"
                    >
                      Abs. non justifié
                    </Button>
                  </div>
                  
                  {canAdd && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onQuickAttendance(member, "present", selectedGroup)}
                      className="w-full text-xs h-7 border-dashed"
                    >
                      <UserPlus className="h-3 w-3 mr-1" />
                      Présent dans {selectedGroup} (exceptionnel)
                    </Button>
                  )}
                  
                  <Button
                    size="sm"
                    variant={hasPaid ? "default" : "outline"}
                    onClick={() => {
                      if (hasPaid) {
                        onUnmarkPayment(member.id);
                      } else {
                        const input = window.prompt(
                          `Montant reçu de ${member.firstName} ? (20€ par défaut)`,
                          "20"
                        );
                        if (input !== null) {
                          onMarkPayment(member.id, parseInt(input) || 20);
                        }
                      }
                    }}
                    className="w-full text-xs h-7"
                  >
                    {hasPaid ? "Paiement enregistré" : "Marquer comme payé"}
                  </Button>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </ScrollArea>
  );
}