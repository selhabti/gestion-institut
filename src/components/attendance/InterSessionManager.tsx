// src/components/attendance/InterSessionManager.tsx
// CORRIGÉ : Types explicites

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, RefreshCw, AlertTriangle, Users } from "lucide-react";
import type { Member } from "@/types/member";
import type { SessionType } from "@/types/session";

interface InterSessionManagerProps {
  members: Member[];
  selectedGroup: SessionType;
  currentDate: string;
  onTransferAttendance: (
    memberId: string,
    fromDate: string,
    toDate: string,
    fromGroup: SessionType,
    toGroup: SessionType
  ) => void;
  onAutoTransferAbsent: () => void;
  isAdmin?: boolean;
}

export const InterSessionManager = ({
  members,
  selectedGroup,
  currentDate,
  onTransferAttendance,
  onAutoTransferAbsent,
  isAdmin = false,
}: InterSessionManagerProps) => {
  
  // Vérifier si c'est un groupe weekend
  if (selectedGroup !== "Samedi" && selectedGroup !== "Dimanche") {
    return null;
  }

  const otherGroup: SessionType = selectedGroup === "Samedi" ? "Dimanche" : "Samedi";

  // Calculer les statistiques
  const getTransferStats = (): {
    absentToday: number;
    presentInOther: number;
    transferOpportunities: number;
  } => {
    const stats = {
      absentToday: 0,
      presentInOther: 0,
      transferOpportunities: 0,
    };

    members.forEach((member) => {
      const todayAttendance = member.attendances?.find(
        (a) => a.date === currentDate && a.session_type === selectedGroup
      );
      const otherAttendance = member.attendances?.find(
        (a) => a.date === currentDate && a.session_type === otherGroup
      );

      if (todayAttendance?.status === "absent_justified") {
        stats.absentToday++;

        if (!otherAttendance) {
          // Vérifier si l'élève peut aller dans l'autre groupe
          const canTransfer =
            member.group === "Samedi+Dimanche" ||
            member.group === otherGroup ||
            (member.secondaryGroups &&
              member.secondaryGroups.includes(otherGroup));

          if (canTransfer) {
            stats.transferOpportunities++;
          }
        }
      }

      if (otherAttendance?.status === "present") {
        stats.presentInOther++;
      }
    });

    return stats;
  };

  const stats = getTransferStats();

  return (
    <div className="mt-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse"></div>
          <h3 className="text-sm font-semibold text-blue-800">
            Gestion inter-séances {selectedGroup} ↔ {otherGroup}
          </h3>
        </div>

        <Badge variant="outline" className="bg-white text-blue-700">
          <Calendar className="h-3 w-3 mr-1" />
          Transfert automatique
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-white/70 backdrop-blur-sm rounded-lg p-3 border border-blue-100">
          <div className="text-xs text-blue-600 mb-1">Absents {selectedGroup}</div>
          <div className="text-2xl font-bold text-blue-800">{stats.absentToday}</div>
          <div className="text-xs text-blue-500 mt-1">élève(s) aujourd'hui</div>
        </div>

        <div className="bg-white/70 backdrop-blur-sm rounded-lg p-3 border border-indigo-100">
          <div className="text-xs text-indigo-600 mb-1">Présents {otherGroup}</div>
          <div className="text-2xl font-bold text-indigo-800">{stats.presentInOther}</div>
          <div className="text-xs text-indigo-500 mt-1">élève(s) en rattrapage</div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="text-xs text-slate-700">
          <span className="font-semibold">Règles :</span>
          <ul className="list-disc pl-4 mt-1 space-y-1">
            <li>Un élève absent {selectedGroup} peut rattraper {otherGroup}</li>
            <li>Un élève ne peut pas être présent dans les deux séances</li>
            <li>Le transfert est proposé automatiquement</li>
          </ul>
        </div>

        {isAdmin && stats.transferOpportunities > 0 && (
          <div className="pt-3 border-t border-blue-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <span className="text-sm font-medium text-slate-700">
                  {stats.transferOpportunities} élève(s) peuvent rattraper aujourd'hui
                </span>
              </div>

              <Button
                size="sm"
                onClick={onAutoTransferAbsent}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
              >
                <RefreshCw className="h-3.5 w-3.5 mr-2" />
                Transférer automatiquement
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};