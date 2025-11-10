import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Check, X, Trash2 } from "lucide-react";
import type { Member } from "@/types/member";
import { capitalize } from "@/lib/utils";

interface WeekendCalendarProps {
  members: Member[];
  selectedGroup: "Lundi" | "Samedi" | "Dimanche";
  onMarkPresent: (memberId: string, date: string, present: boolean) => void;
  isAdmin?: boolean;
  onDeleteMember?: (memberId: string) => void;
}

export function WeekendCalendar({ members, selectedGroup, onMarkPresent, isAdmin, onDeleteMember }: WeekendCalendarProps) {
  const getCurrentSession = () => {
    const now = new Date();
    const currentDay = now.getDay();
    const currentDate = now.getDate();
    
    const targetDate = new Date(now);
    
    switch (selectedGroup) {
      case "Lundi":
        if (currentDay === 1) return now;
        const daysUntilMonday = currentDay <= 1 ? 1 - currentDay : 8 - currentDay;
        targetDate.setDate(currentDate + daysUntilMonday);
        return targetDate;
        
      case "Samedi":
        if (currentDay === 6) return now;
        if (currentDay === 0) {
          targetDate.setDate(currentDate - 1);
          return targetDate;
        }
        targetDate.setDate(currentDate + (6 - currentDay));
        return targetDate;
        
      case "Dimanche":
        if (currentDay === 0) return now;
        targetDate.setDate(currentDate + (7 - currentDay));
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
    });
  };

  const getDateString = (date: Date) => {
    return date.toISOString().split("T")[0];
  };

  const getAttendanceForDate = (member: Member, dateString: string) => {
    return member.attendances.find((a) => a.date === dateString);
  };

  const currentSession = getCurrentSession();
  const groupMembers = members.filter((m) => m.group === selectedGroup);
  const dateString = getDateString(currentSession);
  const isToday = dateString === new Date().toISOString().split("T")[0];

  return (
    <Card className="shadow-medium">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Session {selectedGroup}
        </CardTitle>
        <CardDescription>
          {formatDate(currentSession)}
          {isToday && " - Aujourd'hui"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {groupMembers.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            Aucun membre dans le groupe {selectedGroup}
          </p>
        ) : (
          <div className="space-y-2">
            {groupMembers.map((member) => {
              const attendance = getAttendanceForDate(member, dateString);
              const isPresent = attendance?.status === "present";
              const isAbsent = attendance?.status === "absent_justified" || attendance?.status === "absent_unjustified";
              
              return (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 rounded-md bg-secondary/50 hover:bg-secondary transition-smooth"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-medium">
                      {capitalize(member.firstName)} {capitalize(member.lastName)}
                    </span>
                    {isPresent && (
                      <Badge variant="success" className="gap-1">
                        <Check className="h-3 w-3" />
                        Présent
                      </Badge>
                    )}
                    {isAbsent && (
                      <Badge variant="destructive" className="gap-1">
                        <X className="h-3 w-3" />
                        Absent
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={isPresent ? "default" : "outline"}
                      onClick={() => onMarkPresent(member.id, dateString, true)}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant={isAbsent ? "destructive" : "outline"}
                      onClick={() => onMarkPresent(member.id, dateString, false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    {isAdmin && onDeleteMember && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          if (confirm(`Supprimer ${capitalize(member.firstName)} ${capitalize(member.lastName)} ?`)) {
                            onDeleteMember(member.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}