// src/components/MembersTable.tsx

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Check,
  X,
  FileQuestion,
  Trash2,
  CreditCard,
  History,
  Lock,
  Unlock,
  Users,
  Tag,
  Star,
  RefreshCw,
  Calendar,
  AlertTriangle,
} from "lucide-react";
import type { Member, AttendanceStatus } from "@/types/member";
import type { SessionType } from "@/types/session";
import { capitalize, getMemberAllGroups, isMemberInGroup, hasMultipleGroups, getSecondaryGroups, getPrimaryGroup } from "@/lib/utils";
import { useState, useRef, useEffect } from "react";
import { StudentHistoryModal } from "@/components/attendance/StudentHistoryModal";
import { useStudentHistory } from "@/hooks/useStudentHistory";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { DAYS_FR } from "@/pages/DashboardPage/utils/constants";

interface MembersTableProps {
  members: Member[];
  selectedGroup: SessionType;
  currentDate: string;
  onMarkPresent: (
    memberId: string,
    date: string,
    status: AttendanceStatus,
    group?: SessionType
  ) => void;
  onMarkPayment: (memberId: string) => void;
  onUnmarkPayment: (memberId: string) => void;
  isAdmin?: boolean;
  canManageMembers?: boolean;
  onDeleteMember?: (memberId: string) => void;
  shareMode?: boolean;
  className?: string;
  historicalEditMode?: boolean;
  onHistoricalEditToggle?: (enabled: boolean) => void;
  onTransferAttendance?: (
    memberId: string,
    fromDate: string,
    toDate: string,
    fromGroup: SessionType,
    toGroup: SessionType
  ) => void;
  onAutoTransferAbsent?: () => void;
}

export function MembersTable({
  members,
  selectedGroup,
  currentDate,
  onMarkPresent,
  onMarkPayment,
  onUnmarkPayment,
  isAdmin = false,
  canManageMembers = true,
  onDeleteMember,
  shareMode = false,
  className = "",
  historicalEditMode = false,
  onHistoricalEditToggle,
  onTransferAttendance,
  onAutoTransferAbsent,
}: MembersTableProps) {
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [showGroupSelector, setShowGroupSelector] = useState<string | null>(null);
  const { getStudentHistory } = useStudentHistory(members);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fermer le sélecteur si on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowGroupSelector(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ==================================================
  // FONCTIONS UTILITAIRES DE BASE
  // ==================================================

  const getGroupSessionDays = (): string[] => {
    const groupDays: Record<SessionType, string[]> = {
      Samedi: ["Samedi"],
      Dimanche: ["Dimanche"],
      Lundi: ["Lundi"],
      "Samedi+Dimanche": ["Samedi", "Dimanche"],
    };
    return groupDays[selectedGroup] || [];
  };

  const getFrenchDayName = (dateString: string): string => {
    return DAYS_FR[new Date(dateString).getDay()];
  };

  const isCourseDay = (): boolean => {
    const sessionDays = getGroupSessionDays();
    const currentDay = getFrenchDayName(currentDate);
    return sessionDays.includes(currentDay);
  };

  const isToday = (): boolean => {
    const today = new Date().toISOString().split("T")[0];
    return currentDate === today;
  };

  const isFutureDate = (): boolean => {
    return new Date(currentDate) > new Date();
  };

  const isPastDate = (dateString: string): boolean => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const date = new Date(dateString);
    date.setHours(23, 59, 59, 999);
    return date < today;
  };

  const getNextSessionDay = (): string | null => {
    const sessionDays = getGroupSessionDays();
    const today = new Date();

    for (let i = 1; i <= 7; i++) {
      const next = new Date(today);
      next.setDate(today.getDate() + i);
      const dayName = getFrenchDayName(next.toISOString().split("T")[0]);
      if (sessionDays.includes(dayName)) {
        return next.toISOString().split("T")[0];
      }
    }
    return null;
  };

  // ==================================================
  // FONCTIONS POUR LE SUIVI INTER-SÉANCES
  // ==================================================

  const isWeekendGroup = (group: SessionType): boolean => {
    return group === "Samedi" || group === "Dimanche";
  };

  const getOtherWeekendGroup = (group: SessionType): SessionType => {
    return group === "Samedi" ? "Dimanche" : "Samedi";
  };

  const canTransferBetweenWeekend = (member: Member, fromGroup: SessionType, toGroup: SessionType): boolean => {
    if (!isWeekendGroup(fromGroup) || !isWeekendGroup(toGroup)) return false;
    
    const memberGroups = getMemberAllGroups(member);
    return memberGroups.includes("Samedi") || 
           memberGroups.includes("Dimanche") || 
           memberGroups.includes("Samedi+Dimanche");
  };

  // ==================================================
  // NOUVELLES FONCTIONS POUR LES TRANSFERTS +/-
  // ==================================================

  const handleRemoveFromSaturday = (memberId: string) => {
    const member = members.find(m => m.id === memberId);
    if (!member || selectedGroup !== "Samedi") return;

    const today = currentDate;

    // Vérifier si l'élève peut aller en dimanche
    if (!canTransferBetweenWeekend(member, "Samedi", "Dimanche")) {
      alert(`${capitalize(member.firstName)} ne peut pas être transféré en Dimanche (pas inscrit dans ce groupe).`);
      return;
    }

    // Vérifier s'il est déjà présent en samedi
    const saturdayAttendance = member.attendances.find(
      a => a.date === today && a.session_type === "Samedi" && a.status === "present"
    );

    if (!saturdayAttendance) {
      alert(`${capitalize(member.firstName)} n'est pas présent en Samedi aujourd'hui.`);
      return;
    }

    const confirmMsg = window.confirm(
      `Retirer ${capitalize(member.firstName)} de la séance Samedi et l'ajouter automatiquement en Dimanche ?\n\n` +
      `• Samedi : deviendra absent non justifié\n` +
      `• Dimanche : deviendra présent\n\n` +
      `Cette action est irréversible.`
    );

    if (!confirmMsg) return;

    // 1. Marquer absent non justifié le samedi
    onMarkPresent(memberId, today, "absent_unjustified", "Samedi");

    // 2. Marquer présent le dimanche
    onMarkPresent(memberId, today, "present", "Dimanche");

    // 3. Notifier le transfert
    if (onTransferAttendance) {
      onTransferAttendance(memberId, today, today, "Samedi", "Dimanche");
    }
  };

  const handleAddToSaturday = (memberId: string) => {
    const member = members.find(m => m.id === memberId);
    if (!member || selectedGroup !== "Samedi") return;

    const today = currentDate;

    // Vérifier si l'élève peut aller en samedi
    if (!canTransferBetweenWeekend(member, "Dimanche", "Samedi")) {
      alert(`${capitalize(member.firstName)} ne peut pas être ajouté en Samedi (pas inscrit dans ce groupe).`);
      return;
    }

    // Vérifier s'il est déjà présent en dimanche
    const sundayAttendance = member.attendances.find(
      a => a.date === today && a.session_type === "Dimanche" && a.status === "present"
    );

    if (!sundayAttendance) {
      alert(`${capitalize(member.firstName)} n'est pas présent en Dimanche aujourd'hui.`);
      return;
    }

    const confirmMsg = window.confirm(
      `Ajouter ${capitalize(member.firstName)} à la séance Samedi et le retirer automatiquement du Dimanche ?\n\n` +
      `• Dimanche : deviendra absent non justifié\n` +
      `• Samedi : deviendra présent\n\n` +
      `Cette action est irréversible.`
    );

    if (!confirmMsg) return;

    // 1. Marquer absent non justifié le dimanche
    onMarkPresent(memberId, today, "absent_unjustified", "Dimanche");

    // 2. Marquer présent le samedi
    onMarkPresent(memberId, today, "present", "Samedi");

    // 3. Notifier le transfert
    if (onTransferAttendance) {
      onTransferAttendance(memberId, today, today, "Dimanche", "Samedi");
    }
  };

  const handleMarkPresentWithTransfer = (
    memberId: string,
    date: string,
    status: AttendanceStatus,
    group?: SessionType
  ) => {
    const member = members.find(m => m.id === memberId);
    if (!member) return;
    
    const targetGroup = group || selectedGroup;
    
    // Si on marque présent dans un groupe weekend
    if (isWeekendGroup(targetGroup) && status === "present") {
      const otherGroup = getOtherWeekendGroup(targetGroup);
      
      // Vérifier si l'élève est déjà marqué présent dans l'autre groupe ce jour
      const existingAttendance = member.attendances.find(
        a => a.date === date && a.session_type === otherGroup && a.status === "present"
      );
      
      if (existingAttendance && canTransferBetweenWeekend(member, otherGroup, targetGroup)) {
        // Demander confirmation pour le transfert
        if (window.confirm(
          `${capitalize(member.firstName)} est déjà marqué présent ${otherGroup}.\n` +
          `Voulez-vous le transférer vers ${targetGroup} ?\n\n` +
          `(L'ancienne présence ${otherGroup} sera marquée absente non justifiée)`
        )) {
          // D'abord marquer absent dans l'autre groupe
          onMarkPresent(memberId, date, "absent_unjustified", otherGroup);
          // Puis marquer présent dans le groupe cible
          onMarkPresent(memberId, date, status, targetGroup);
          
          // Appeler le callback de transfert si disponible
          if (onTransferAttendance) {
            onTransferAttendance(memberId, date, date, otherGroup, targetGroup);
          }
          return;
        } else {
          return; // Annuler si l'utilisateur refuse
        }
      }
    }
    
    // Comportement normal
    onMarkPresent(memberId, date, status, targetGroup);
  };

  const handleMarkAbsentWithTransfer = (
    memberId: string,
    date: string,
    status: "absent_justified" | "absent_unjustified",
    group?: SessionType
  ) => {
    const member = members.find(m => m.id === memberId);
    if (!member) return;
    
    const targetGroup = group || selectedGroup;
    
    // Marquer l'absence
    onMarkPresent(memberId, date, status, targetGroup);
    
    // Si c'est un groupe weekend, aujourd'hui, et absence justifiée
    if (isWeekendGroup(targetGroup) && isToday() && status === "absent_justified") {
      const otherGroup = getOtherWeekendGroup(targetGroup);
      
      // Vérifier si l'élève peut automatiquement rattraper
      if (canTransferBetweenWeekend(member, targetGroup, otherGroup)) {
        // Demander si on veut transférer vers l'autre groupe
        setTimeout(() => {
          if (window.confirm(
            `${capitalize(member.firstName)} est absent ${targetGroup} (justifié).\n` +
            `Voulez-vous l'ajouter automatiquement à la séance de ${otherGroup} pour rattrapage ?`
          )) {
            onMarkPresent(memberId, date, "present", otherGroup);
            if (onTransferAttendance) {
              onTransferAttendance(memberId, date, date, targetGroup, otherGroup);
            }
          }
        }, 500);
      }
    }
  };

  const handleAutoTransferAllAbsent = () => {
    if (!onAutoTransferAbsent || !onTransferAttendance) return;
    
    const today = new Date().toISOString().split('T')[0];
    const otherGroup = getOtherWeekendGroup(selectedGroup);
    
    // Filtrer les élèves absents aujourd'hui qui peuvent rattraper
    const absentMembers = members.filter(member => {
      const todayAttendance = member.attendances.find(a => a.date === today && a.session_type === selectedGroup);
      const otherAttendance = member.attendances.find(a => a.date === today && a.session_type === otherGroup);
      
      return (
        isToday() &&
        isWeekendGroup(selectedGroup) &&
        (todayAttendance?.status === "absent_unjustified" || todayAttendance?.status === "absent_justified") &&
        !otherAttendance && // Pas déjà présent dans l'autre groupe
        canTransferBetweenWeekend(member, selectedGroup, otherGroup)
      );
    });
    
    if (absentMembers.length === 0) {
      alert(`Aucun élève absent ${selectedGroup} ne peut être transféré vers ${otherGroup} aujourd'hui.`);
      return;
    }
    
    const confirmMsg = window.confirm(
      `Voulez-vous transférer automatiquement ${absentMembers.length} élève(s) absents ${selectedGroup} vers ${otherGroup} ?\n\n` +
      "Cette action est irréversible.\n" +
      "Les élèves seront marqués présents dans l'autre groupe."
    );
    
    if (!confirmMsg) return;
    
    // Appliquer les transferts
    absentMembers.forEach(member => {
      onMarkPresent(member.id, today, "present", otherGroup);
      if (onTransferAttendance) {
        onTransferAttendance(member.id, today, today, selectedGroup, otherGroup);
      }
    });
    
    onAutoTransferAbsent();
  };

  // ==================================================
  // COMPOSANT INTER-SESSION MANAGER (EXISTANT)
  // ==================================================

  const InterSessionManager = () => {
    const otherGroup = getOtherWeekendGroup(selectedGroup);
    
    if (!isWeekendGroup(selectedGroup)) {
      return null;
    }
    
    // Calcul des statistiques
    const getTransferStats = () => {
      const stats = {
        absentToday: 0,
        presentInOther: 0,
        transferOpportunities: 0,
      };
      
      members.forEach(member => {
        const todayAttendance = member.attendances.find(a => a.date === currentDate && a.session_type === selectedGroup);
        const otherAttendance = member.attendances.find(a => a.date === currentDate && a.session_type === otherGroup);
        
        if (todayAttendance?.status === "absent_unjustified" || todayAttendance?.status === "absent_justified") {
          stats.absentToday++;
          
          // Vérifie si l'élève peut rattraper dans l'autre groupe
          if (!otherAttendance && canTransferBetweenWeekend(member, selectedGroup, otherGroup)) {
            stats.transferOpportunities++;
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
              Gestion inter-séances Samedi ↔ Dimanche
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
              <li>Le transfert est automatique lors du marquage</li>
              {isToday() && (
                <li className="text-amber-600 font-semibold">
                  Transfert automatique disponible aujourd'hui
                </li>
              )}
            </ul>
          </div>
          
          {isAdmin && isToday() && stats.transferOpportunities > 0 && (
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
                  onClick={handleAutoTransferAllAbsent}
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

  // ==================================================
  // NOUVEAU COMPOSANT SYSTÈME DE TRANSFERT DIMANCHE → SAMEDI
  // ==================================================

  const SaturdayTransferSystem = () => {
    if (selectedGroup !== "Samedi" || !isToday()) return null;

    const getSundayPresentMembers = () => {
      return members.filter(member => {
        const sundayAttendance = member.attendances.find(
          a => a.date === currentDate && a.session_type === "Dimanche" && a.status === "present"
        );
        const saturdayAttendance = member.attendances.find(
          a => a.date === currentDate && a.session_type === "Samedi"
        );

        return (
          sundayAttendance && 
          !saturdayAttendance && 
          canTransferBetweenWeekend(member, "Dimanche", "Samedi")
        );
      });
    };

    const sundayPresentMembers = getSundayPresentMembers();

    const handleBatchAddToSaturday = () => {
      if (sundayPresentMembers.length === 0) {
        alert("Aucun élève présent en Dimanche à transférer.");
        return;
      }

      const confirmMsg = window.confirm(
        `Ajouter ${sundayPresentMembers.length} élève(s) à la séance Samedi ?\n\n` +
        `Ces élèves seront retirés de la séance Dimanche et ajoutés en Samedi.\n` +
        `Cette action est irréversible.`
      );

      if (!confirmMsg) return;

      sundayPresentMembers.forEach(member => {
        // Retirer du dimanche
        onMarkPresent(member.id, currentDate, "absent_unjustified", "Dimanche");
        // Ajouter au samedi
        onMarkPresent(member.id, currentDate, "present", "Samedi");

        if (onTransferAttendance) {
          onTransferAttendance(member.id, currentDate, currentDate, "Dimanche", "Samedi");
        }
      });

      alert(`${sundayPresentMembers.length} élève(s) transféré(s) avec succès !`);
    };

    if (sundayPresentMembers.length === 0) return null;

    return (
      <div className="mt-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse"></div>
            <h3 className="text-sm font-semibold text-amber-800">
              Transfert Dimanche → Samedi
            </h3>
          </div>
          
          <Badge variant="outline" className="bg-white text-amber-700">
            <RefreshCw className="h-3 w-3 mr-1" />
            {sundayPresentMembers.length} élève(s) disponible(s)
          </Badge>
        </div>

        <p className="text-xs text-slate-600 mb-3">
          Ces élèves sont actuellement présents en Dimanche. En les transférant vers Samedi, 
          ils seront automatiquement retirés du Dimanche (absents non justifiés).
        </p>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-3">
          {sundayPresentMembers.map(member => (
            <div key={member.id} className="flex items-center justify-between gap-2 bg-white/70 backdrop-blur-sm rounded-lg p-2 border border-amber-100">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span className="text-sm font-medium">
                  {capitalize(member.firstName)} {capitalize(member.lastName)}
                </span>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleAddToSaturday(member.id)}
                className="h-6 w-6 p-0 text-amber-600 hover:bg-amber-50 font-bold text-lg"
                title="Transférer vers Samedi"
              >
                +
              </Button>
            </div>
          ))}
        </div>

        <div className="flex justify-end">
          <Button
            size="sm"
            onClick={handleBatchAddToSaturday}
            className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white"
          >
            <span className="mr-2">+</span>
            Transférer tout vers Samedi
          </Button>
        </div>
      </div>
    );
  };

  // ==================================================
  // FONCTIONS POUR LA GESTION MULTI-GROUPES
  // ==================================================

  const canAttendOtherGroup = (member: Member, targetGroup: SessionType): boolean => {
    if (isMemberInGroup(member, targetGroup)) {
      return true;
    }
    
    const memberGroups = getMemberAllGroups(member);
    
    if (memberGroups.includes("Samedi") && targetGroup === "Dimanche") return true;
    if (memberGroups.includes("Dimanche") && targetGroup === "Samedi") return true;
    
    if (memberGroups.includes("Samedi+Dimanche") && 
        (targetGroup === "Samedi" || targetGroup === "Dimanche")) {
      return true;
    }
    
    if (memberGroups.includes("Lundi") && 
        (targetGroup === "Samedi" || targetGroup === "Dimanche" || targetGroup === "Samedi+Dimanche")) {
      return false;
    }
    
    return false;
  };

  const getAttendanceForDate = (member: Member, date: string) => {
    return member.attendances.find((a) => a.date === date);
  };

  const getCombinedAttendanceStatus = (
    member: Member,
    date: string
  ): {
    status: AttendanceStatus | "not_in_group" | "in_other_group";
    isSecondaryGroup: boolean;
    group?: SessionType;
  } => {
    const attendance = getAttendanceForDate(member, date);
    
    if (!attendance) {
      const isInGroup = isMemberInGroup(member, selectedGroup);
      
      return {
        status: "not_in_group",
        isSecondaryGroup: member.group !== selectedGroup,
        group: selectedGroup,
      };
    }
    
    if (!isMemberInGroup(member, selectedGroup)) {
      return {
        status: "in_other_group",
        isSecondaryGroup: true,
        group: attendance.session_type || getPrimaryGroup(member),
      };
    }
    
    return {
      status: attendance.status,
      isSecondaryGroup: false,
      group: selectedGroup,
    };
  };

  // ==================================================
  // FONCTIONS POUR LES BOUTONS ET LE STATUT
  // ==================================================

  const getDateStatus = ():
    | "today_session"
    | "future_session"
    | "past_session"
    | "not_session_day" => {
    
    const courseDay = isCourseDay();
    const pastDate = isPastDate(currentDate);
    
    if (pastDate) {
      return "past_session";
    }
    
    if (!courseDay) {
      return "not_session_day";
    }
    
    if (isToday()) return "today_session";
    if (isFutureDate()) return "future_session";
    
    return "past_session";
  };

  const shouldEnableButtons = (): boolean => {
    if (shareMode) return false;
    
    const pastDate = isPastDate(currentDate);
    
    if (historicalEditMode && pastDate) {
      return true;
    }
    
    if (isToday() && isCourseDay()) {
      return true;
    }
    
    return false;
  };

  // ==================================================
  // FILTRAGE MEMBRES
  // ==================================================

  const displayMembers = members.filter((member) => {
    const isInSelectedGroup = 
      member.group === selectedGroup || 
      (member.secondaryGroups && member.secondaryGroups.includes(selectedGroup));
    
    if (!isInSelectedGroup) return false;
    
    if (!member.created_at) return true;
    
    const isPrimaryGroup = member.group === selectedGroup;
    
    if (isPrimaryGroup) {
      return new Date(currentDate) >= new Date(member.created_at);
    } else {
      return true;
    }
  });

  // ==================================================
  // HELPERS PAIEMENT
  // ==================================================

  const hasPaidThisMonth = (member: Member): boolean => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    return member.payments.some((p) => p.date?.startsWith(currentMonth));
  };

  const handleViewHistory = (memberId: string) => {
    const history = getStudentHistory(memberId);
    setSelectedStudent(history);
  };

  // ==================================================
  // SÉLECTEUR DE GROUPE MODAL
  // ==================================================

  const GroupSelectorModal = ({ member, onSelect }: { 
    member: Member; 
    onSelect: (group: SessionType) => void;
  }) => {
    const availableGroups: SessionType[] = ["Samedi", "Dimanche", "Lundi", "Samedi+Dimanche"];
    const memberGroups = getMemberAllGroups(member);
    const primaryGroup = getPrimaryGroup(member);
    
    return (
      <div className="absolute z-50 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg p-2 min-w-[250px]">
        <div className="text-xs font-semibold text-slate-700 mb-2 px-2">
          Choisir le groupe pour {capitalize(member.firstName)}:
        </div>
        
        {availableGroups.map((group) => {
          const canSelect = canAttendOtherGroup(member, group) || isMemberInGroup(member, group);
          const isMemberGroup = isMemberInGroup(member, group);
          const isCurrentSession = group === selectedGroup;
          const isPrimary = group === primaryGroup;
          
          return (
            <button
              key={group}
              onClick={() => canSelect && onSelect(group)}
              disabled={!canSelect}
              className={`
                w-full text-left px-3 py-2 rounded text-sm mb-1 transition-colors
                ${canSelect 
                  ? 'hover:bg-slate-100 text-slate-800' 
                  : 'opacity-50 cursor-not-allowed text-slate-400'
                }
                ${isMemberGroup ? 'bg-blue-50 hover:bg-blue-100' : ''}
                ${isCurrentSession ? 'border-l-2 border-blue-500' : ''}
                ${isPrimary ? 'font-semibold' : ''}
              `}
            >
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  {group}
                  {isPrimary && <Star className="h-3 w-3 fill-yellow-300 text-yellow-500" />}
                </span>
                <div className="flex items-center gap-1">
                  {isMemberGroup && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                      {isPrimary ? 'Principal' : 'Secondaire'}
                    </span>
                  )}
                  {!canSelect && (
                    <span className="text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
                      Non autorisé
                    </span>
                  )}
                </div>
              </div>
              {group === selectedGroup && (
                <div className="text-xs text-slate-500 mt-1">
                  Groupe actuellement sélectionné
                </div>
              )}
            </button>
          );
        })}
        
        <div className="text-xs text-slate-500 px-2 mt-3 pt-2 border-t border-slate-100">
          <div className="font-semibold mb-1 flex items-center gap-1">
            <Tag className="h-3 w-3" />
            Groupes de {capitalize(member.firstName)}:
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs px-2 py-0.5">
                {primaryGroup} ★
              </Badge>
              <span className="text-xs">(Groupe principal)</span>
            </div>
            {getSecondaryGroups(member).length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {getSecondaryGroups(member).map(group => (
                  <Badge key={group} variant="outline" className="text-xs px-2 py-0.5">
                    {group}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ==================================================
  // COMPOSANT TOGGLE HISTORIQUE
  // ==================================================

  const HistoricalEditToggle = () => {
    const canToggle = isAdmin && canManageMembers && !shareMode;
    
    const handleToggle = (checked: boolean) => {
      if (!canToggle) return;
      
      if (checked) {
        const confirmMsg = window.confirm(
          "⚠️ MODE ÉDITION HISTORIQUE\n\n" +
          "Vous allez activer la modification des présences passées.\n" +
          "Ce mode permet de corriger les oublis de présence.\n\n" +
          "Activer ce mode ?"
        );
        
        if (confirmMsg && onHistoricalEditToggle) {
          onHistoricalEditToggle(true);
        }
      } else {
        if (onHistoricalEditToggle) {
          onHistoricalEditToggle(false);
        }
      }
    };

    return (
      <div className="flex items-center space-x-2 bg-white/80 backdrop-blur-sm rounded-lg p-2 border border-slate-200">
        <div className={`p-1.5 rounded ${canToggle ? 'bg-slate-100' : 'bg-slate-50'}`}>
          {historicalEditMode ? (
            <Unlock className={`h-3.5 w-3.5 ${canToggle ? 'text-green-600' : 'text-slate-400'}`} />
          ) : (
            <Lock className={`h-3.5 w-3.5 ${canToggle ? 'text-slate-600' : 'text-slate-400'}`} />
          )}
        </div>
        
        <div className="flex flex-col min-w-0">
          <Label 
            htmlFor="historical-edit-mode" 
            className={`text-xs font-medium truncate ${canToggle ? 'cursor-pointer' : 'cursor-not-allowed'}`}
          >
            {historicalEditMode ? "Édition historique" : "Séances passées"}
          </Label>
          <span className="text-[10px] text-slate-500 truncate">
            {canToggle 
              ? (historicalEditMode ? "Activé - Cliquez pour désactiver" : "Corriger les oublis")
              : "Admin requis"
            }
          </span>
        </div>
        
        <Switch
          id="historical-edit-mode"
          checked={historicalEditMode}
          onCheckedChange={handleToggle}
          disabled={!canToggle}
          className={`scale-75 ${historicalEditMode ? 'bg-green-600' : ''}`}
        />
      </div>
    );
  };

  // ==================================================
  // BADGES DE PRÉSENCE
  // ==================================================

  const getAttendanceBadge = (member: Member) => {
    const combined = getCombinedAttendanceStatus(member, currentDate);
    const pastDate = isPastDate(currentDate);
    const attendance = getAttendanceForDate(member, currentDate);

    if (combined.status === "in_other_group") {
      return (
        <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-300">
          <Users className="h-3 w-3 mr-1" />
          Présent dans {combined.group}
        </Badge>
      );
    }

    if (!attendance) {
      if (isFutureDate()) {
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-600">
            À venir
          </Badge>
        );
      } else if (pastDate) {
        return historicalEditMode ? (
          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-300">
            <History className="h-3 w-3 mr-1" />
            Non marqué (historique)
          </Badge>
        ) : (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
            <History className="h-3 w-3 mr-1" />
            Non marqué
          </Badge>
        );
      } else {
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-600">
            Non marqué
          </Badge>
        );
      }
    }

    const config: Record<string, any> = {
      present: {
        icon: Check,
        class: historicalEditMode && pastDate 
          ? "bg-green-100 text-green-800 border-green-300" 
          : "bg-green-500 text-white",
        label: historicalEditMode && pastDate ? "Présent (hist.)" : "Présent",
      },
      absent_justified: {
        icon: FileQuestion,
        class: historicalEditMode && pastDate 
          ? "bg-blue-100 text-blue-800 border-blue-300" 
          : "bg-blue-500 text-white",
        label: historicalEditMode && pastDate ? "Abs. justifié (hist.)" : "Abs. justifié",
      },
      absent_unjustified: {
        icon: X,
        class: historicalEditMode && pastDate 
          ? "bg-red-100 text-red-800 border-red-300" 
          : "bg-red-500 text-white",
        label: historicalEditMode && pastDate ? "Abs. non justifié (hist.)" : "Abs. non justifié",
      },
    };

    const { icon: Icon, class: cls, label } = config[attendance.status] || {};
    if (!Icon) return null;

    return (
      <Badge className={cls}>
        <Icon className="h-3 w-3 mr-1" />
        {label}
      </Badge>
    );
  };

  // ==================================================
  // BADGE DE PAIEMENT
  // ==================================================

  const getPaymentBadge = (member: Member) => {
    const paid = hasPaidThisMonth(member);
    return paid ? (
      <Badge className="bg-green-500 text-white">
        <CreditCard className="h-3 w-3 mr-1" />
        Payé
      </Badge>
    ) : (
      <Badge
        variant="outline"
        className="bg-orange-50 text-orange-700 border-orange-200"
      >
        <CreditCard className="h-3 w-3 mr-1" />
        En attente
      </Badge>
    );
  };

  // ==================================================
  // BOUTON DE PRÉSENCE AVEC SÉLECTEUR
  // ==================================================

  interface AttendanceButtonProps {
    status: AttendanceStatus;
    isActive: boolean;
    onClick: (group?: SessionType) => void;
    icon: any;
    tooltip: string;
    member: Member;
  }

  const AttendanceButton = ({
    status,
    isActive,
    onClick,
    icon: Icon,
    tooltip,
    member,
  }: AttendanceButtonProps) => {
    const enabled = shouldEnableButtons();
    const pastDate = isPastDate(currentDate);
    const combined = getCombinedAttendanceStatus(member, currentDate);
    
    const canMarkInThisGroup = canAttendOtherGroup(member, selectedGroup) || isMemberInGroup(member, selectedGroup);
    const isInOtherGroup = combined.status === "in_other_group";
    const memberGroups = getMemberAllGroups(member);
    
    const baseStyle = {
      present: isActive
        ? "bg-green-500 text-white border-green-600 shadow-sm"
        : "bg-green-50 text-green-700 border-green-200 hover:bg-green-100",
      absent_justified: isActive
        ? "bg-blue-500 text-white border-blue-600 shadow-sm"
        : "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100",
      absent_unjustified: isActive
        ? "bg-red-500 text-white border-red-600 shadow-sm"
        : "bg-red-50 text-red-700 border-red-200 hover:bg-red-100",
    }[status];
  
    let tooltipText = tooltip;
    let additionalInfo = "";
    let disabled = !enabled || shareMode;
    let showDropdown = false;
    
    if (isInOtherGroup && !isActive) {
      disabled = true;
      tooltipText = `Élève déjà présent dans le groupe ${combined.group}`;
      additionalInfo = "Présence déjà enregistrée";
    } else if (!canMarkInThisGroup && !isActive && !isMemberInGroup(member, selectedGroup)) {
      showDropdown = true;
      disabled = false;
      tooltipText = `Choisir le groupe pour marquer ${tooltip.toLowerCase()}`;
      additionalInfo = `Groupes: ${memberGroups.join(', ')}`;
    }
  
    const handleClick = () => {
      if (showDropdown) {
        setShowGroupSelector(member.id + status);
      } else {
        onClick(selectedGroup);
      }
    };
  
    return (
      <div className="relative" ref={dropdownRef}>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                onClick={handleClick}
                disabled={disabled}
                className={`h-9 w-9 p-0 transition-all ${baseStyle} ${
                  disabled ? 'opacity-50 cursor-not-allowed' : ''
                } ${historicalEditMode && pastDate ? 'ring-2 ring-purple-500' : ''}
                ${showDropdown ? 'border-dashed' : ''}
                ${showDropdown && showGroupSelector === member.id + status ? 'ring-2 ring-blue-500' : ''}`}
              >
                <Icon className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="font-medium">{tooltipText}</p>
              {additionalInfo && (
                <p className="text-xs text-amber-600 mt-1">{additionalInfo}</p>
              )}
              {showDropdown && (
                <p className="text-xs text-blue-600 mt-1">Cliquez pour choisir le groupe</p>
              )}
              {historicalEditMode && pastDate && (
                <p className="text-xs text-green-600 mt-1">Mode historique actif ✓</p>
              )}
              {hasMultipleGroups(member) && (
                <p className="text-xs text-indigo-600 mt-1 flex items-center gap-1">
                  <Tag className="h-3 w-3" />
                  Multi-groupes: {memberGroups.length} groupe(s)
                </p>
              )}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        {showDropdown && showGroupSelector === member.id + status && (
          <GroupSelectorModal
            member={member}
            onSelect={(group) => {
              onClick(group);
              setShowGroupSelector(null);
            }}
          />
        )}
      </div>
    );
  };

  // ==================================================
  // SI AUCUN MEMBRE
  // ==================================================

  if (displayMembers.length === 0) {
    return (
      <div className="text-center py-16 text-slate-500">
        <Users className="h-16 w-16 mx-auto mb-4 text-slate-300" />
        <p className="font-semibold text-lg">
          Aucun élève dans ce groupe pour cette date
        </p>
        {members.length > 0 && (
          <p className="text-sm mt-2">
            Les élèves affichés n'étaient pas encore inscrits à cette date.
          </p>
        )}
      </div>
    );
  }

  const dateStatus = getDateStatus();
  const nextSession = getNextSessionDay();

  // ==================================================
  // RENDU FINAL
  // ==================================================

  return (
    <>
      {/* BANNIÈRE DE STATUT AVEC TOGGLE */}
      <div className="mb-5">
        <div className="relative rounded-xl overflow-hidden bg-white/70 backdrop-blur-xl border border-white/40 shadow-lg">
          <div
            className={`
              absolute inset-0 -z-10 blur-3xl opacity-50
              ${dateStatus === "today_session" ? "bg-emerald-400" : ""}
              ${dateStatus === "future_session" ? "bg-blue-400" : ""}
              ${dateStatus === "not_session_day" ? "bg-slate-300" : ""}
              ${dateStatus === "past_session" ? "bg-amber-400" : ""}
              ${historicalEditMode ? "!bg-purple-400" : ""}
            `}
          />

          <div className="px-5 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`
                  h-3 w-3 rounded-full shadow-md flex-shrink-0
                  ${
                    dateStatus === "today_session"
                      ? "bg-emerald-500 animate-pulse ring-4 ring-emerald-300/40"
                      : ""
                  }
                  ${
                    dateStatus === "future_session"
                      ? "bg-blue-500 ring-4 ring-blue-300/40"
                      : ""
                  }
                  ${dateStatus === "not_session_day" ? "bg-slate-400" : ""}
                  ${
                    dateStatus === "past_session"
                      ? "bg-amber-500 ring-4 ring-amber-300/40"
                      : ""
                  }
                  ${historicalEditMode ? "!bg-purple-500 ring-4 ring-purple-300/40" : ""}
                `}
              />

              <div>
                <h3
                  className={`text-base font-geist-bold leading-none
                    ${dateStatus === "today_session" ? "text-emerald-900" : ""}
                    ${dateStatus === "future_session" ? "text-blue-900" : ""}
                    ${dateStatus === "not_session_day" ? "text-slate-600" : ""}
                    ${dateStatus === "past_session" ? "text-amber-900" : ""}
                    ${historicalEditMode ? "!text-purple-900" : ""}
                  `}
                >
                  {historicalEditMode && "📝 Édition historique - "}
                  {dateStatus === "today_session" && "Présence ouverte"}
                  {dateStatus === "future_session" && "Séance à venir"}
                  {dateStatus === "not_session_day" && "Aucun cours aujourd'hui"}
                  {dateStatus === "past_session" && "Séance terminée"}
                </h3>

                <p className="text-xs text-slate-600 mt-1 font-geist-medium">
                  {historicalEditMode && "Modification des séances passées activée • "}
                  {dateStatus === "today_session" && "Jour de cours • Marquez les présences"}
                  {dateStatus === "future_session" &&
                    new Date(currentDate).toLocaleDateString("fr-FR", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    })}
                  {dateStatus === "not_session_day" &&
                    nextSession &&
                    `Prochaine séance : ${new Date(
                      nextSession
                    ).toLocaleDateString("fr-FR", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                    })}`}
                  {dateStatus === "past_session" && 
                    `Séance du ${new Date(currentDate).toLocaleDateString("fr-FR", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric"
                    })} • ${historicalEditMode ? "📝 Modification historique autorisée" : "👁️ Consultation seulement"}
                  `}
                </p>
              </div>
            </div>

            <div className="flex flex-col items-end gap-2">
              {isAdmin && !shareMode && <HistoricalEditToggle />}
              
              <div className="text-right">
                <p className="text-xs text-slate-500 uppercase tracking-wider font-geist-medium">
                  Élèves
                </p>
                <p className="text-2xl font-geist-black text-slate-800">
                  {displayMembers.length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {displayMembers.length < members.length && (
          <p className="text-center text-[11px] text-slate-500 mt-2">
            {members.length - displayMembers.length} élève(s) inscrit(s) après
            cette date
          </p>
        )}
        
        {historicalEditMode && isPastDate(currentDate) && (
          <div className="mt-3 bg-purple-50 border border-purple-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-purple-500 animate-pulse"></div>
              <span className="text-sm font-medium text-purple-800">
                Mode édition historique actif
              </span>
              <span className="text-xs text-purple-700">
                • Vous pouvez modifier les présences de cette séance passée
              </span>
            </div>
          </div>
        )}
        
        {members.filter(m => hasMultipleGroups(m)).length > 0 && (
          <div className="mt-3 bg-indigo-50 border border-indigo-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse"></div>
              <span className="text-sm font-medium text-indigo-800">
                {members.filter(m => hasMultipleGroups(m)).length} élève(s) avec plusieurs groupes
              </span>
              <span className="text-xs text-indigo-700">
                • ★ = Groupe principal • Cliquez sur "Avancé" pour plus d'options
              </span>
            </div>
          </div>
        )}
      </div>

      {/* TABLEAU PRINCIPAL */}
      <div
        className={`overflow-hidden border border-slate-200 rounded-lg bg-white ${className}`}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-center p-4 font-semibold text-slate-700 border-r border-slate-200">
                  Élève
                </th>
                <th className="text-center p-4 font-semibold text-slate-700 border-r border-slate-200">
                  Ville
                </th>
                <th className="text-center p-4 font-semibold text-slate-700 border-r border-slate-200">
                  Groupe(s)
                </th>
                <th className="text-center p-4 font-semibold text-slate-700 border-r border-slate-200">
                  Présence
                </th>
                <th className="text-center p-4 font-semibold text-slate-700 border-r border-slate-200">
                  Paiement
                </th>
                <th className="text-center p-4 font-semibold text-slate-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayMembers.map((member) => {
                const attendance = getAttendanceForDate(member, currentDate);
                const isPresent = attendance?.status === "present";
                const isAbsentJustified = attendance?.status === "absent_justified";
                const isAbsentUnjustified = attendance?.status === "absent_unjustified";
                const hasPaid = hasPaidThisMonth(member);
                const multiGroup = hasMultipleGroups(member);
                const secondaryGroups = getSecondaryGroups(member);

                // Vérification pour les boutons +/-
                const isPresentInSunday = member.attendances.find(
                  a => a.date === currentDate && a.session_type === "Dimanche" && a.status === "present"
                );

                return (
                  <tr
                    key={member.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="p-4 border-r border-slate-100">
                      <div className="font-medium text-slate-900">
                        {capitalize(member.firstName)}{" "}
                        {capitalize(member.lastName)}
                        {member.created_at && (
                          <div className="text-xs text-slate-500 mt-1">
                            Inscrit le{" "}
                            {new Date(
                              member.created_at
                            ).toLocaleDateString("fr-FR")}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-4 border-r border-slate-100 text-slate-600">
                      {member.city ? capitalize(member.city) : "—"}
                    </td>
                    <td className="p-4 border-r border-slate-100">
                      <div className="flex flex-wrap gap-1">
                        <Badge
                          variant="outline"
                          className={`
                            ${member.group === "Samedi"
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : member.group === "Dimanche"
                              ? "bg-green-50 text-green-700 border-green-200"
                              : member.group === "Lundi"
                              ? "bg-orange-50 text-orange-700 border-orange-200"
                              : "bg-purple-50 text-purple-700 border-purple-200"
                            }
                            ${multiGroup ? 'font-semibold' : ''}
                          `}
                        >
                          {member.group}
                          {member.group === "Samedi+Dimanche" && (
                            <span className="ml-1 text-xs">(2 jours)</span>
                          )}
                          {multiGroup && (
                            <Star className="h-3 w-3 ml-1 fill-yellow-300 text-yellow-500" />
                          )}
                        </Badge>
                        
                        {secondaryGroups.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {secondaryGroups.map((group) => (
                              <Badge
                                key={group}
                                variant="outline"
                                className={`
                                  text-xs px-2 py-0.5 bg-slate-50 text-slate-600 border-slate-200
                                  ${group === "Samedi" ? 'bg-blue-100 text-blue-800 border-blue-300' : ''}
                                  ${group === "Dimanche" ? 'bg-green-100 text-green-800 border-green-300' : ''}
                                  ${group === "Lundi" ? 'bg-orange-100 text-orange-800 border-orange-300' : ''}
                                  ${group === "Samedi+Dimanche" ? 'bg-purple-100 text-purple-800 border-purple-300' : ''}
                                `}
                              >
                                {group}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-4 border-r border-slate-100">
                      {getAttendanceBadge(member)}
                    </td>
                    <td className="p-4 border-r border-slate-100">
                      {getPaymentBadge(member)}
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <AttendanceButton
                          status="present"
                          isActive={isPresent}
                          onClick={(group?: SessionType) => handleMarkPresentWithTransfer(member.id, currentDate, "present", group || selectedGroup)}
                          icon={Check}
                          tooltip="Présent"
                          member={member}
                        />
                        <AttendanceButton
                          status="absent_justified"
                          isActive={isAbsentJustified}
                          onClick={(group?: SessionType) => handleMarkAbsentWithTransfer(member.id, currentDate, "absent_justified", group || selectedGroup)}
                          icon={FileQuestion}
                          tooltip="Absent justifié"
                          member={member}
                        />
                        <AttendanceButton
                          status="absent_unjustified"
                          isActive={isAbsentUnjustified}
                          onClick={(group?: SessionType) => handleMarkAbsentWithTransfer(member.id, currentDate, "absent_unjustified", group || selectedGroup)}
                          icon={X}
                          tooltip="Absent non justifié"
                          member={member}
                        />

                        {/* BOUTONS + ET - POUR SAMEDI */}
                        {selectedGroup === "Samedi" && shouldEnableButtons() && (
                          <>
                            {/* Bouton - : Retirer du samedi (si présent en samedi) */}
                            {isPresent && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRemoveFromSaturday(member.id)}
                                className="h-9 w-9 p-0 text-amber-600 hover:bg-amber-50 border-amber-200 font-bold text-lg"
                                disabled={shareMode}
                                title="Retirer de la séance Samedi → Ajouter automatiquement en Dimanche"
                              >
                                −
                              </Button>
                            )}

                            {/* Bouton + : Ajouter au samedi (si présent en dimanche) */}
                            {isPresentInSunday && !isPresent && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleAddToSaturday(member.id)}
                                className="h-9 w-9 p-0 text-emerald-600 hover:bg-emerald-50 border-emerald-200 font-bold text-lg"
                                disabled={shareMode}
                                title="Ajouter à la séance Samedi ← Retirer automatiquement du Dimanche"
                              >
                                +
                              </Button>
                            )}
                          </>
                        )}
                        
                        <Button
                          size="sm"
                          variant={hasPaid ? "default" : "outline"}
                          onClick={() => {
                            if (shareMode) return alert("Mode partage activé");
                            if (
                              confirm(
                                `Confirmez le changement de paiement pour ${capitalize(
                                  member.firstName
                                )} ?`
                              )
                            ) {
                              hasPaid
                                ? onUnmarkPayment(member.id)
                                : onMarkPayment(member.id);
                            }
                          }}
                          className="h-9 w-9 p-0"
                          disabled={shareMode}
                        >
                          <CreditCard className="h-4 w-4" />
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewHistory(member.id)}
                          className="h-9 w-9 p-0 text-blue-600 hover:bg-blue-50"
                        >
                          <History className="h-4 w-4" />
                        </Button>

                        {isAdmin && onDeleteMember && canManageMembers && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              confirm(
                                `Supprimer ${capitalize(member.firstName)} ?`
                              ) && onDeleteMember(member.id)
                            }
                            className="h-9 w-9 p-0 text-red-600 hover:bg-red-50"
                            disabled={shareMode}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* COMPOSANT INTER-SESSION MANAGER EXISTANT */}
      <InterSessionManager />

      {/* NOUVEAU COMPOSANT TRANSFERT DIMANCHE → SAMEDI */}
      <SaturdayTransferSystem />

      <StudentHistoryModal
        student={selectedStudent}
        isOpen={!!selectedStudent}
        onClose={() => setSelectedStudent(null)}
      />
    </>
  );
}

export default MembersTable;