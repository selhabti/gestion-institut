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
  ArrowRightLeft,
} from "lucide-react";
import type { Member, AttendanceStatus } from "@/types/member";
import type { SessionType } from "@/types/session";
import {
  capitalize,
  getMemberAllGroups,
  isMemberInGroup,
  hasMultipleGroups,
  getSecondaryGroups,
  getPrimaryGroup,
} from "@/lib/utils";
import { useState } from "react";
import { StudentHistoryModal } from "@/components/attendance/StudentHistoryModal";
import { useStudentHistory } from "@/hooks/useStudentHistory";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { motion, AnimatePresence } from "framer-motion";

import { DAYS_FR } from "@/pages/DashboardPage/utils/constants";

// ================================
// TYPES ET PROPS
// ================================

interface MembersTableProps {
  members: Member[];
  selectedGroup: SessionType;
  currentDate: string;
  onMarkPresent: (
    memberId: string,
    date: string,
    status: AttendanceStatus,
    group?: SessionType,
    session_type?: SessionType,
    forceEdit?: boolean // ✅ Ajouté pour gérer le mode historique
  ) => void;
  onMarkPayment: (memberId: string, amount?: number) => void;
  onUnmarkPayment: (memberId: string) => void;
  isAdmin?: boolean;
  canManageMembers?: boolean;
  onDeleteMember?: (memberId: string) => void;
  shareMode?: boolean;
  className?: string;
  historicalEditMode?: boolean;
  onHistoricalEditToggle?: (enabled: boolean) => void;
  activeTransfers?: {
    memberId: string;
    fromGroup: SessionType;
    toGroup: SessionType;
    date: string;
  }[];
  onActiveTransfersChange?: React.Dispatch<
    React.SetStateAction<{
      memberId: string;
      fromGroup: SessionType;
      toGroup: SessionType;
      date: string;
    }[]>
  >;
}

// ================================
// COMPOSANT PRINCIPAL
// ================================

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
  activeTransfers = [],
  onActiveTransfersChange,
}: MembersTableProps) {
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const { getStudentHistory } = useStudentHistory(members);

  const transfers = activeTransfers;
  const setTransfers = onActiveTransfersChange || (() => {});

  // ================================
  // UTILITAIRES
  // ================================

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

  // ================================
  // FONCTION DE MARQUAGE LOCAL
  // ================================

  const handleMarkPresent = (
    memberId: string,
    date: string,
    status: AttendanceStatus,
    group?: SessionType,
    forceEdit = false
  ) => {
    console.log("🟢 handleMarkPresent appelé", { memberId, date, status, group, selectedGroup, forceEdit });
    onMarkPresent(
      memberId,
      date,
      status,
      group || selectedGroup,
      undefined,
      forceEdit
    );
  };

  // ================================
  // TRANSFERT TEMPORAIRE ENTRE GROUPES
  // ================================

  const getTransferTarget = (): SessionType | null => {
    if (selectedGroup === "Samedi") return "Dimanche";
    if (selectedGroup === "Dimanche") return "Samedi";
    return null;
  };

  const handleTemporaryTransfer = (memberId: string) => {
    const member = members.find((m) => m.id === memberId);
    const targetGroup = getTransferTarget();
    if (!member || !targetGroup) return;

    const alreadyTransferred = transfers.find(
      (t) => t.memberId === memberId && t.date === currentDate
    );
    if (alreadyTransferred) {
      window.alert(`${capitalize(member.firstName)} est déjà transféré.`);
      return;
    }

    const confirmMsg = window.confirm(
      `↔ Transfert temporaire\n\n${capitalize(member.firstName)} ${capitalize(
        member.lastName
      )}\n\n• Sera absent justifié ici\n• Présent dans ${targetGroup}\n\nConfirmer ?`
    );

    if (confirmMsg) {
      // Appliquer les deux modifications avec forceEdit si mode historique actif
      onMarkPresent(
        memberId,
        currentDate,
        "absent_justified",
        selectedGroup,
        undefined,
        historicalEditMode // ✅ Autorise modif historique
      );
      onMarkPresent(
        memberId,
        currentDate,
        "present",
        targetGroup,
        undefined,
        historicalEditMode // ✅ Autorise modif historique
      );

      if (setTransfers) {
        setTransfers((prev) => [
          ...prev,
          {
            memberId,
            fromGroup: selectedGroup,
            toGroup: targetGroup,
            date: currentDate,
          },
        ]);
      }
    }
  };

  // ================================
  // FILTRAGE DES MEMBRES AFFICHÉS
  // ================================

  const transferredOutIds = new Set(
    transfers
      .filter((t) => t.fromGroup === selectedGroup && t.date === currentDate)
      .map((t) => t.memberId)
  );

  const displayMembers = members.filter((member) => {
    if (transferredOutIds.has(member.id)) return false;

    const isInSelectedGroup =
      member.group === selectedGroup ||
      (member.secondaryGroups && member.secondaryGroups.includes(selectedGroup));

    const isTransferredIn = transfers.some(
      (t) => t.memberId === member.id && t.toGroup === selectedGroup && t.date === currentDate
    );

    if (!isInSelectedGroup && !isTransferredIn) return false;

    if (!member.created_at) return true;

    const isPrimaryGroup = member.group === selectedGroup;

    if (isPrimaryGroup || isTransferredIn) {
      return new Date(currentDate) >= new Date(member.created_at);
    }
    return true;
  });

  // ================================
  // UTILITAIRES DE PAIEMENT
  // ================================

  const hasPaidThisMonth = (member: Member): boolean => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    return member.payments.some((p) => p.date?.startsWith(currentMonth));
  };

  const handleViewHistory = (memberId: string) => {
    const history = getStudentHistory(memberId);
    setSelectedStudent(history);
  };

  // ================================
  // TOGGLE HISTORIQUE (REMETTRE AU BON ENDROIT)
  // ================================

  const HistoricalEditToggle = () => {
    const canToggle = isAdmin && canManageMembers && !shareMode;

    const handleToggle = (checked: boolean) => {
      if (!canToggle) return;

      if (checked) {
        const confirmMsg = window.confirm(
          "⚠️ MODE ÉDITION HISTORIQUE\n\nVous allez activer la modification des présences passées.\n\nActiver ce mode ?"
        );
        if (confirmMsg && onHistoricalEditToggle) {
          onHistoricalEditToggle(true);
        }
      } else {
        if (onHistoricalEditToggle) onHistoricalEditToggle(false);
      }
    };

    return (
      <div className="flex items-center space-x-2 bg-white/80 backdrop-blur-sm rounded-lg p-2 border border-slate-200">
        <div className={`p-1.5 rounded ${canToggle ? "bg-slate-100" : "bg-slate-50"}`}>
          {historicalEditMode ? (
            <Unlock className={`h-3.5 w-3.5 ${canToggle ? "text-green-600" : "text-slate-400"}`} />
          ) : (
            <Lock className={`h-3.5 w-3.5 ${canToggle ? "text-slate-600" : "text-slate-400"}`} />
          )}
        </div>
        <div className="flex flex-col min-w-0">
          <Label
            htmlFor="historical-edit-mode"
            className={`text-xs font-medium truncate ${canToggle ? "cursor-pointer" : "cursor-not-allowed"}`}
          >
            {historicalEditMode ? "Édition historique" : "Séances passées"}
          </Label>
          <span className="text-[10px] text-slate-500 truncate">
            {canToggle
              ? historicalEditMode
                ? "Activé - Cliquez pour désactiver"
                : "Corriger les oublis"
              : "Admin requis"}
          </span>
        </div>
        <Switch
          id="historical-edit-mode"
          checked={historicalEditMode}
          onCheckedChange={handleToggle}
          disabled={!canToggle}
          className={`scale-75 ${historicalEditMode ? "bg-green-600" : ""}`}
        />
      </div>
    );
  };

  // ================================
  // BOUTON PRÉSENCE
  // ================================

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

    const canMarkInThisGroup =
      canAttendOtherGroup(member, selectedGroup) ||
      isMemberInGroup(member, selectedGroup);
    const isInOtherGroup = combined.status === "in_other_group";
    const memberGroups = getMemberAllGroups(member);

    const baseStyle: Record<AttendanceStatus, string> = {
      present: isActive
        ? "bg-green-500 text-white border-green-600 shadow-sm"
        : "bg-green-50 text-green-700 border-green-200 hover:bg-green-100",
      absent_justified: isActive
        ? "bg-blue-500 text-white border-blue-600 shadow-sm"
        : "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100",
      absent_unjustified: isActive
        ? "bg-red-500 text-white border-red-600 shadow-sm"
        : "bg-red-50 text-red-700 border-red-200 hover:bg-red-100",
    };

    let tooltipText = tooltip;
    let additionalInfo = "";
    let disabled = !enabled || shareMode;

    if (isInOtherGroup && !isActive) {
      disabled = true;
      tooltipText = `Déjà présent dans ${combined.group}`;
      additionalInfo = "Présence déjà enregistrée";
    }

    return (
      <div className="relative">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onClick(selectedGroup)}
                disabled={disabled}
                className={`h-9 w-9 p-0 transition-all ${
                  baseStyle[status]
                } ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${
                  historicalEditMode && pastDate
                    ? "ring-2 ring-purple-500"
                    : ""
                }`}
              >
                <Icon className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="font-medium">{tooltipText}</p>
              {additionalInfo && <p className="text-xs text-amber-600 mt-1">{additionalInfo}</p>}
              {historicalEditMode && pastDate && (
                <p className="text-xs text-green-600 mt-1">Mode historique actif ✓</p>
              )}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    );
  };

  // ================================
  // FILTRE ET DATE
  // ================================

  const shouldEnableButtons = (): boolean => {
    if (shareMode) return false;

    const pastDate = isPastDate(currentDate);

    if (historicalEditMode && pastDate) {
      return true; // ✅ Boutons activés même sur date passée si mode historique
    }

    if (isToday() && isCourseDay()) {
      return true;
    }

    return false;
  };

  const getDateStatus = ():
    | "today_session"
    | "future_session"
    | "past_session"
    | "not_session_day" => {
    const courseDay = isCourseDay();
    const pastDate = isPastDate(currentDate);

    if (pastDate) return "past_session";
    if (!courseDay) return "not_session_day";
    if (isToday()) return "today_session";
    if (isFutureDate()) return "future_session";

    return "past_session";
  };

  const getCombinedAttendanceStatus = (
    member: Member,
    date: string
  ): {
    status: AttendanceStatus | "not_in_group" | "in_other_group";
    isSecondaryGroup: boolean;
    group?: SessionType;
  } => {
    const attendance = member.attendances.find((a) => a.date === date);

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

  const canAttendOtherGroup = (
    member: Member,
    targetGroup: SessionType
  ): boolean => {
    if (isMemberInGroup(member, targetGroup)) return true;
    const memberGroups = getMemberAllGroups(member);
    if (memberGroups.includes("Samedi") && targetGroup === "Dimanche") return true;
    if (memberGroups.includes("Dimanche") && targetGroup === "Samedi") return true;
    if (
      memberGroups.includes("Samedi+Dimanche") &&
      ["Samedi", "Dimanche"].includes(targetGroup)
    )
      return true;
    return false;
  };

  // ================================
  // RENDU
  // ================================

  if (displayMembers.length === 0) {
    return (
      <div className="text-center py-16 text-slate-500">
        <Users className="h-16 w-16 mx-auto mb-4 text-slate-300" />
        <p className="font-semibold text-lg">Aucun élève dans ce groupe pour cette date</p>
      </div>
    );
  }

  const dateStatus = getDateStatus();

  return (
    <>
      {/* ✅ RETOUR DU TOGGLE HISTORIQUE */}
      <div className="flex justify-end mb-4">
        <HistoricalEditToggle />
      </div>

      {/* TABLEAU */}
      <div className={`overflow-hidden border border-slate-200 rounded-lg bg-white ${className}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-center p-4 font-semibold text-slate-700 border-r border-slate-200">Élève</th>
                <th className="text-center p-4 font-semibold text-slate-700 border-r border-slate-200">Ville</th>
                <th className="text-center p-4 font-semibold text-slate-700 border-r border-slate-200">Groupe(s)</th>
               
                <th className="text-center p-4 font-semibold text-slate-700 border-r border-slate-200">Paiement</th>
                <th className="text-center p-4 font-semibold text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <AnimatePresence>
                {displayMembers.map((member) => {
                  const attendance = member.attendances.find((a) => a.date === currentDate);
                  const isPresent = attendance?.status === "present";
                  const isAbsentJustified = attendance?.status === "absent_justified";
                  const isAbsentUnjustified = attendance?.status === "absent_unjustified";
                  const hasPaid = hasPaidThisMonth(member);
                  const multiGroup = hasMultipleGroups(member);
                  const secondaryGroups = getSecondaryGroups(member);

                  return (
                    <motion.tr
                      key={member.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.2 }}
                    >
                      <td className="p-4 border-r border-slate-100">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-800">{capitalize(member.firstName)}</span>
                          <span className="font-bold text-slate-900 uppercase tracking-wide">
                            {member.lastName}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 border-r border-slate-100">
                      {member.city ? capitalize(member.city.toLowerCase()) : "—"}
                      </td>
                      <td className="p-4 border-r border-slate-100">
                        <Badge variant="outline">{member.group}</Badge>
                        {secondaryGroups.length > 0 &&
                          secondaryGroups.map((g) => (
                            <Badge key={g} variant="outline" className="ml-1">
                              {g}
                            </Badge>
                          ))}
                      </td>
                      
                      <td className="p-4 border-r border-slate-100">
                        {hasPaid ? (
                          <Badge className="bg-green-500 text-white">Payé</Badge>
                        ) : (
                          <Badge variant="outline">En attente</Badge>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <AttendanceButton
                            status="present"
                            isActive={isPresent}
                            onClick={(group?: SessionType) =>
                              handleMarkPresent(
                                member.id,
                                currentDate,
                                "present",
                                group,
                                historicalEditMode // ✅ Force modif si historique
                              )
                            }
                            icon={Check}
                            tooltip="Présent"
                            member={member}
                          />
                          <AttendanceButton
                            status="absent_justified"
                            isActive={isAbsentJustified}
                            onClick={(group?: SessionType) =>
                              handleMarkPresent(
                                member.id,
                                currentDate,
                                "absent_justified",
                                group,
                                historicalEditMode // ✅ Force modif si historique
                              )
                            }
                            icon={FileQuestion}
                            tooltip="Absent justifié"
                            member={member}
                          />
                          <AttendanceButton
                            status="absent_unjustified"
                            isActive={isAbsentUnjustified}
                            onClick={(group?: SessionType) =>
                              handleMarkPresent(
                                member.id,
                                currentDate,
                                "absent_unjustified",
                                group,
                                historicalEditMode // ✅ Force modif si historique
                              )
                            }
                            icon={X}
                            tooltip="Absent non justifié"
                            member={member}
                          />

                          {/* Bouton transfert temporaire */}
                          {getTransferTarget() && shouldEnableButtons() && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleTemporaryTransfer(member.id)}
                                    className="h-9 w-9 p-0 text-orange-600 hover:bg-orange-50 border-orange-200"
                                    disabled={shareMode}
                                  >
                                    <ArrowRightLeft className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="font-medium">Transfert temporaire</p>
                                  <p className="text-xs text-slate-500">
                                    {selectedGroup} → {getTransferTarget()}
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}

                          {/* Paiement */}
                          <Button
                            size="sm"
                            variant={hasPaid ? "default" : "outline"}
                            onClick={() => {
                              if (shareMode) return alert("Mode partage actif");
                              if (hasPaid) {
                                if (window.confirm(`Annuler le paiement de ${capitalize(member.firstName)} ?`)) {
                                  onUnmarkPayment(member.id);
                                }
                              } else {
                                const input = window.prompt(
                                  `Montant reçu de ${capitalize(member.firstName)} ? (20€ par défaut)`,
                                  "20"
                                );
                                if (input !== null) {
                                  const amount = parseInt(input) || 20;
                                  onMarkPayment(member.id, amount);
                                }
                              }
                            }}
                            className="h-9 w-9 p-0"
                            disabled={shareMode}
                          >
                            <CreditCard className="h-4 w-4" />
                          </Button>

                          {/* Historique */}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewHistory(member.id)}
                            className="h-9 w-9 p-0 text-blue-600 hover:bg-blue-50"
                          >
                            <History className="h-4 w-4" />
                          </Button>

                          {/* Supprimer */}
                          {isAdmin && onDeleteMember && canManageMembers && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                window.confirm(`Supprimer ${capitalize(member.firstName)} ?`) &&
                                onDeleteMember(member.id)
                              }
                              className="h-9 w-9 p-0 text-red-600 hover:bg-red-50"
                              disabled={shareMode}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>

      <StudentHistoryModal
        student={selectedStudent}
        isOpen={!!selectedStudent}
        onClose={() => setSelectedStudent(null)}
      />
    </>
  );
}

export default MembersTable;