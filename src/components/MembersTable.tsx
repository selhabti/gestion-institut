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
  Calendar,
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
  // FONCTIONS SIMPLIFIÉES SANS TRANSFERT
  // ==================================================

  const isWeekendGroup = (group: SessionType): boolean => {
    return group === "Samedi" || group === "Dimanche";
  };

  const handleMarkPresent = (
    memberId: string,
    date: string,
    status: AttendanceStatus,
    group?: SessionType
  ) => {
    onMarkPresent(memberId, date, status, group || selectedGroup);
  };

  // Ajouter au samedi SANS toucher au dimanche
  const handleAddToSaturdayOnly = (memberId: string) => {
    const member = members.find(m => m.id === memberId);
    if (!member || selectedGroup !== "Samedi") return;

    // Marquer présent en samedi
    onMarkPresent(memberId, currentDate, "present", "Samedi");
  };

  // Retirer du samedi SANS toucher au dimanche
  const handleRemoveFromSaturdayOnly = (memberId: string) => {
    const member = members.find(m => m.id === memberId);
    if (!member || selectedGroup !== "Samedi") return;

    // Marquer absent non justifié en samedi
    onMarkPresent(memberId, currentDate, "absent_unjustified", "Samedi");
  };

  // ==================================================
  // COMPOSANT STATISTIQUES (optionnel, peut être supprimé)
  // ==================================================

  const WeekdayStats = () => {
    if (!isWeekendGroup(selectedGroup)) return null;

    const otherGroup = selectedGroup === "Samedi" ? "Dimanche" : "Samedi";
    
    const stats = {
      presentInSelected: 0,
      presentInOther: 0,
      bothPresent: 0,
    };
    
    members.forEach(member => {
      const selectedAttendance = member.attendances.find(a => a.date === currentDate && a.session_type === selectedGroup);
      const otherAttendance = member.attendances.find(a => a.date === currentDate && a.session_type === otherGroup);
      
      if (selectedAttendance?.status === "present") stats.presentInSelected++;
      if (otherAttendance?.status === "present") stats.presentInOther++;
      if (selectedAttendance?.status === "present" && otherAttendance?.status === "present") stats.bothPresent++;
    });

    return (
      <div className="mt-4 bg-gradient-to-r from-slate-50 to-gray-50 border border-slate-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-2 w-2 rounded-full bg-blue-500"></div>
          <h3 className="text-sm font-semibold text-slate-700">
            Statistiques du jour
          </h3>
        </div>
        
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-3 border border-slate-100">
            <div className="text-xs text-blue-600 mb-1">Présents {selectedGroup}</div>
            <div className="text-2xl font-bold text-blue-800">{stats.presentInSelected}</div>
          </div>
          
          <div className="bg-white rounded-lg p-3 border border-slate-100">
            <div className="text-xs text-green-600 mb-1">Présents {otherGroup}</div>
            <div className="text-2xl font-bold text-green-800">{stats.presentInOther}</div>
          </div>
          
          <div className="bg-white rounded-lg p-3 border border-slate-100">
            <div className="text-xs text-purple-600 mb-1">Présents les 2 jours</div>
            <div className="text-2xl font-bold text-purple-800">{stats.bothPresent}</div>
          </div>
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
                • ★ = Groupe principal
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
                          onClick={(group?: SessionType) => handleMarkPresent(member.id, currentDate, "present", group || selectedGroup)}
                          icon={Check}
                          tooltip="Présent"
                          member={member}
                        />
                        <AttendanceButton
                          status="absent_justified"
                          isActive={isAbsentJustified}
                          onClick={(group?: SessionType) => handleMarkPresent(member.id, currentDate, "absent_justified", group || selectedGroup)}
                          icon={FileQuestion}
                          tooltip="Absent justifié"
                          member={member}
                        />
                        <AttendanceButton
                          status="absent_unjustified"
                          isActive={isAbsentUnjustified}
                          onClick={(group?: SessionType) => handleMarkPresent(member.id, currentDate, "absent_unjustified", group || selectedGroup)}
                          icon={X}
                          tooltip="Absent non justifié"
                          member={member}
                        />

                        {/* BOUTON + POUR SAMEDI (ajouter au samedi sans retirer du dimanche) */}
                        {selectedGroup === "Samedi" && shouldEnableButtons() && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAddToSaturdayOnly(member.id)}
                            className="h-9 w-9 p-0 text-emerald-600 hover:bg-emerald-50 border-emerald-200 font-bold text-lg"
                            disabled={shareMode || isPresent}
                            title="Ajouter au Samedi (ne modifie pas le Dimanche)"
                          >
                            +
                          </Button>
                        )}

                        {/* BOUTON - POUR SAMEDI (retirer du samedi seulement) */}
                        {selectedGroup === "Samedi" && shouldEnableButtons() && isPresent && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRemoveFromSaturdayOnly(member.id)}
                            className="h-9 w-9 p-0 text-amber-600 hover:bg-amber-50 border-amber-200 font-bold text-lg"
                            disabled={shareMode}
                            title="Retirer du Samedi seulement"
                          >
                            −
                          </Button>
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

      {/* STATISTIQUES SIMPLES */}
      <WeekdayStats />

      <StudentHistoryModal
        student={selectedStudent}
        isOpen={!!selectedStudent}
        onClose={() => setSelectedStudent(null)}
      />
    </>
  );
}

export default MembersTable;