import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users } from "lucide-react";
import type { Member, AttendanceStatus } from "@/types/member";
import type { SessionType } from "@/types/session"; // ← AJOUTEZ CET IMPORT

interface WeekendCalendarProps {
  members: Member[];
  selectedGroup: SessionType; // ← CHANGEZ ICI : GroupType → SessionType
  onMarkPresent: (memberId: string, date: string, status: AttendanceStatus) => void;
  isAdmin?: boolean;
  canMarkAttendance?: boolean; 
  onDeleteMember?: (memberId: string) => void;
  showMembersList?: boolean;
}

export function WeekendCalendar({ 
  members, 
  selectedGroup, 
  onMarkPresent, 
  isAdmin, 
  onDeleteMember,
  showMembersList = true
}: WeekendCalendarProps) {
  
  // Calcul de la date de la prochaine session
  const getNextSessionDate = () => {
    const now = new Date();
    const currentDay = now.getDay();
    const currentDate = now.getDate();
    
    const targetDate = new Date(now);
    
    // Pour "Samedi+Dimanche", on prend la date du samedi
    const effectiveGroup = selectedGroup === "Samedi+Dimanche" ? "Samedi" : selectedGroup;
    
    switch (effectiveGroup) {
      case "Lundi":
        if (currentDay === 1) return now;
        const daysUntilMonday = currentDay <= 1 ? 1 - currentDay : 8 - currentDay;
        targetDate.setDate(currentDate + daysUntilMonday);
        return targetDate;
        
      case "Samedi":
        if (currentDay === 6) return now;
        const daysUntilSaturday = currentDay <= 6 ? 6 - currentDay : 13 - currentDay;
        targetDate.setDate(currentDate + daysUntilSaturday);
        return targetDate;
        
      case "Dimanche":
        if (currentDay === 0) return now;
        const daysUntilSunday = currentDay === 6 ? 1 : 7 - currentDay;
        targetDate.setDate(currentDate + daysUntilSunday);
        return targetDate;
        
      default:
        return now;
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("fr-FR", {
      weekday: 'long',
      day: "2-digit",
      month: "long",
      year: "numeric"
    });
  };

  const nextSession = getNextSessionDate();
  
  // Filtrer les membres selon la session sélectionnée
  const groupMembers = selectedGroup === "Samedi+Dimanche" 
    ? members.filter(m => m.group === "Samedi" || m.group === "Dimanche")
    : members.filter(m => m.group === selectedGroup);
    
  const isToday = nextSession.toISOString().split("T")[0] === new Date().toISOString().split("T")[0];

  return (
    <Card className="shadow-sm border-blue-200">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Calendar className="h-5 w-5" />
          Session à venir
        </CardTitle>
        <CardDescription>
          {formatDate(nextSession)}
          {isToday && (
            <Badge variant="default" className="ml-2 bg-green-500">
              Aujourd'hui
            </Badge>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Statistiques rapides sans la liste des élèves */}
        <div className="text-center py-4">
          <Users className="h-12 w-12 mx-auto mb-3 text-blue-500" />
          <h3 className="font-semibold text-slate-900">
            {groupMembers.length} élève{groupMembers.length > 1 ? 's' : ''} inscrit{groupMembers.length > 1 ? 's' : ''}
          </h3>
          <p className="text-sm text-slate-600 mt-1">
            {selectedGroup === "Samedi+Dimanche" ? "Weekend (Samedi + Dimanche)" : `Groupe ${selectedGroup}`}
          </p>
          {isToday && (
            <Badge variant="secondary" className="mt-2 bg-green-100 text-green-800">
              Session aujourd'hui
            </Badge>
          )}
        </div>

        {/* Note informative */}
        <div className="text-xs text-slate-500 text-center pt-2 border-t border-slate-100">
          Utilisez le tableau principal pour marquer les présences
        </div>
      </CardContent>
    </Card>
  );
}

export default WeekendCalendar;