// Path: src/components/MembersTable.tsx

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Check,
  X,
  FileQuestion,
  Trash2,
  CreditCard,
  History,
} from "lucide-react";
import type { Member, AttendanceStatus } from "@/types/member";
import type { SessionType } from "@/types/session";
import { capitalize } from "@/lib/utils";
import { Users } from "lucide-react";
import { useState } from "react";
import { StudentHistoryModal } from "@/components/attendance/StudentHistoryModal";
// SUPPRIMEZ UN DE CES DEUX IMPORTS - GARDEZ SEULEMENT UN :
import { useStudentHistory } from "@/hooks/useStudentHistory"; // ← GARDEZ CELUI-CI
// import { useStudentHistory } from "@/components/attendance/useStudentHistory"; // ← SUPPRIMEZ CELUI-CI

interface MembersTableProps {
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
  isAdmin?: boolean;
  canManageMembers?: boolean;
  onDeleteMember?: (memberId: string) => void;
  shareMode?: boolean;
  className?: string;
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
}: MembersTableProps) {
  const [selectedStudent, setSelectedStudent] = useState<any>(null);

  // DEBUG: Vérifiez que le hook est bien appelé
  console.log(
    "🎯 useStudentHistory hook is being called with members:",
    members.length
  );

  const { getStudentHistory } = useStudentHistory(members);

  // DEBUG: Vérifiez que la fonction existe
  console.log("🎯 getStudentHistory function:", typeof getStudentHistory);

  // LES MEMBRES SONT DÉJÀ FILTRÉS PAR LE PARENT - UTILISER DIRECTEMENT
  const displayMembers = members;

  const getAttendanceForDate = (member: Member, date: string) => {
    return member.attendances.find((a) => a.date === date);
  };

  const hasPaidThisMonth = (member: Member) => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    return member.payments.some(
      (p) => p.date && p.date.startsWith(currentMonth)
    );
  };

  const getAttendanceBadge = (member: Member) => {
    const attendance = getAttendanceForDate(member, currentDate);

    if (!attendance) {
      return (
        <Badge
          variant="outline"
          className="bg-gray-50 text-gray-600 border-gray-200"
        >
          Non marqué
        </Badge>
      );
    }

    switch (attendance.status) {
      case "present":
        return (
          <Badge className="bg-green-500 text-white">
            <Check className="h-3 w-3 mr-1" />
            Présent
          </Badge>
        );
      case "absent_justified":
        return (
          <Badge
            variant="secondary"
            className="bg-yellow-50 text-yellow-700 border-yellow-200"
          >
            <FileQuestion className="h-3 w-3 mr-1" />
            Abs. justifié
          </Badge>
        );
      case "absent_unjustified":
        return (
          <Badge
            variant="destructive"
            className="bg-red-50 text-red-700 border-red-200"
          >
            <X className="h-3 w-3 mr-1" />
            Abs. non justifié
          </Badge>
        );
      default:
        return <Badge variant="outline">Inconnu</Badge>;
    }
  };

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

  const handleViewHistory = (memberId: string) => {
    console.log("🎯 handleViewHistory called for member:", memberId);

    // DEBUG: Vérifiez les données brutes AVANT d'appeler le hook
    const student = members.find((m) => m.id === memberId);
    console.log("📊 RAW STUDENT DATA BEFORE HOOK:", {
      name: `${student?.firstName} ${student?.lastName}`,
      payments: student?.payments,
      paymentsCount: student?.payments?.length,
      paymentDates: student?.payments?.map((p) => p.date),
      hasPayments: student?.payments && student.payments.length > 0,
    });

    // Appel du hook
    const history = getStudentHistory(memberId);

    console.log("🎯 HISTORY RESULT FROM HOOK:", history);

    setSelectedStudent(history);
  };

  if (displayMembers.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500">
        <Users className="h-16 w-16 mx-auto mb-4 text-slate-300" />
        <p className="font-medium">
          {selectedGroup === "Samedi+Dimanche"
            ? "Aucun membre dans les groupes Samedi et Dimanche"
            : `Aucun membre dans le groupe ${selectedGroup}`}
        </p>
      </div>
    );
  }

  return (
    <>
      <div
        className={`overflow-hidden border border-slate-200 rounded-lg bg-white ${className}`}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left p-4 font-semibold text-slate-700 border-r border-slate-200">
                  Élève
                </th>
                <th className="text-left p-4 font-semibold text-slate-700 border-r border-slate-200">
                  Ville
                </th>
                <th className="text-left p-4 font-semibold text-slate-700 border-r border-slate-200">
                  Groupe
                </th>
                <th className="text-left p-4 font-semibold text-slate-700 border-r border-slate-200">
                  Présence
                </th>
                <th className="text-left p-4 font-semibold text-slate-700 border-r border-slate-200">
                  Paiement
                </th>
                <th className="text-left p-4 font-semibold text-slate-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayMembers.map((member) => {
                const attendance = getAttendanceForDate(member, currentDate);
                const isPresent = attendance?.status === "present";
                const isAbsentJustified =
                  attendance?.status === "absent_justified";
                const isAbsentUnjustified =
                  attendance?.status === "absent_unjustified";
                const hasPaid = hasPaidThisMonth(member);

                return (
                  <tr
                    key={member.id}
                    className="hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-b-0"
                  >
                    {/* Colonne Élève */}
                    <td className="p-4 border-r border-slate-100">
                      <div className="font-medium text-slate-900">
                        {capitalize(member.firstName)}{" "}
                        {capitalize(member.lastName)}
                      </div>
                    </td>

                    {/* Colonne Ville */}
                    <td className="p-4 border-r border-slate-100">
                      <div className="text-slate-600">{member.city || "-"}</div>
                    </td>

                    {/* Colonne Groupe */}
                    <td className="p-4 border-r border-slate-100">
                      <Badge
                        variant="outline"
                        className={
                          member.group === "Samedi"
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : member.group === "Dimanche"
                            ? "bg-green-50 text-green-700 border-green-200"
                            : "bg-orange-50 text-orange-700 border-orange-200"
                        }
                      >
                        {member.group}
                      </Badge>
                    </td>

                    {/* Colonne Présence */}
                    <td className="p-4 border-r border-slate-100">
                      <div className="flex items-center gap-2">
                        {getAttendanceBadge(member)}
                      </div>
                    </td>

                    {/* Colonne Paiement */}
                    <td className="p-4 border-r border-slate-100">
                      <div className="flex items-center gap-2">
                        {getPaymentBadge(member)}
                      </div>
                    </td>

                    {/* Colonne Actions */}
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {/* Boutons Présence */}
                        <Button
                          size="sm"
                          variant={isPresent ? "default" : "outline"}
                          onClick={() =>
                            onMarkPresent(member.id, currentDate, "present")
                          }
                          className="h-9 w-9 p-0 border border-slate-200"
                          title="Présent"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant={isAbsentJustified ? "secondary" : "outline"}
                          onClick={() =>
                            onMarkPresent(
                              member.id,
                              currentDate,
                              "absent_justified"
                            )
                          }
                          className="h-9 w-9 p-0 border border-slate-200"
                          title="Absent justifié"
                        >
                          <FileQuestion className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant={
                            isAbsentUnjustified ? "destructive" : "outline"
                          }
                          onClick={() =>
                            onMarkPresent(
                              member.id,
                              currentDate,
                              "absent_unjustified"
                            )
                          }
                          className="h-9 w-9 p-0 border border-slate-200"
                          title="Absent non justifié"
                        >
                          <X className="h-4 w-4" />
                        </Button>

                        {/* Bouton Paiement */}
                        <Button
                          size="sm"
                          variant={hasPaid ? "default" : "outline"}
                          onClick={() => {
                            if (shareMode) {
                              alert(
                                "Mode partage activé - Modification bloquée"
                              );
                              return;
                            }

                            const action = hasPaid
                              ? "démarquer le paiement"
                              : "marquer comme payé";
                            const confirmation = confirm(
                              `Voulez-vous vraiment ${action} pour ${capitalize(
                                member.firstName
                              )} ${capitalize(member.lastName)} ?`
                            );

                            if (confirmation) {
                              hasPaid
                                ? onUnmarkPayment(member.id)
                                : onMarkPayment(member.id);
                            }
                          }}
                          className="h-9 w-9 p-0 border border-slate-200"
                          title={
                            hasPaid
                              ? "Marquer comme non payé"
                              : "Marquer comme payé"
                          }
                          disabled={shareMode}
                        >
                          <CreditCard className="h-4 w-4" />
                        </Button>

                        {/* Bouton Historique */}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewHistory(member.id)}
                          className="h-9 w-9 p-0 border border-slate-200"
                          title="Voir l'historique"
                        >
                          <History className="h-4 w-4" />
                        </Button>

                        {/* Bouton Suppression */}
                        {isAdmin && onDeleteMember && canManageMembers && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              if (
                                confirm(
                                  `Supprimer ${capitalize(
                                    member.firstName
                                  )} ${capitalize(member.lastName)} ?`
                                )
                              ) {
                                onDeleteMember(member.id);
                              }
                            }}
                            className="h-9 w-9 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200"
                            title="Supprimer"
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

      {/* Modal d'historique de l'élève */}
      <StudentHistoryModal
        student={selectedStudent}
        isOpen={!!selectedStudent}
        onClose={() => setSelectedStudent(null)}
      />
    </>
  );
}

export default MembersTable;
