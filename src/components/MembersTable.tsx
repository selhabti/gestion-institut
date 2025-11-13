import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, X, FileQuestion, Trash2, Calendar, CreditCard } from "lucide-react";
import type { Member, AttendanceStatus, GroupType } from "@/types/member";
import { capitalize } from "@/lib/utils";
import { Users } from "lucide-react";

interface MembersTableProps {
  members: Member[];
  selectedGroup: GroupType;
  currentDate: string;
  onMarkPresent: (memberId: string, date: string, status: AttendanceStatus) => void;
  onMarkPayment: (memberId: string) => void;
  onUnmarkPayment: (memberId: string) => void;
  isAdmin?: boolean;
  canManageMembers?: boolean;
  onDeleteMember?: (memberId: string) => void;
  shareMode?: boolean;
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
  shareMode = false
}: MembersTableProps) {
  
  const getAttendanceForDate = (member: Member, date: string) => {
    return member.attendances.find((a) => a.date === date);
  };

  const hasPaidThisMonth = (member: Member) => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    return member.payments.some(p => p.date && p.date.startsWith(currentMonth));
  };

  const getAttendanceBadge = (member: Member) => {
    const attendance = getAttendanceForDate(member, currentDate);
    
    if (!attendance) {
      return <Badge variant="outline" className="bg-gray-100 text-gray-700">Non marqué</Badge>;
    }

    switch (attendance.status) {
      case "present":
        return <Badge className="bg-green-500 text-white"><Check className="h-3 w-3 mr-1" />Présent</Badge>;
      case "absent_justified":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><FileQuestion className="h-3 w-3 mr-1" />Abs. justifié</Badge>;
      case "absent_unjustified":
        return <Badge variant="destructive"><X className="h-3 w-3 mr-1" />Abs. non justifié</Badge>;
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
      <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-200">
        <CreditCard className="h-3 w-3 mr-1" />
        En attente
      </Badge>
    );
  };

  if (members.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
        <p>Aucun membre dans le groupe {selectedGroup}</p>
      </div>
    );
  }

  return (
    <div className="border-2 border-slate-400 rounded-lg overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="text-left p-3 font-medium text-slate-700">Élève</th>
              <th className="text-left p-3 font-medium text-slate-700">Ville</th>
              <th className="text-left p-3 font-medium text-slate-700">Présence</th>
              <th className="text-left p-3 font-medium text-slate-700">Paiement</th>
              <th className="text-left p-3 font-medium text-slate-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {members.map((member) => {
              const attendance = getAttendanceForDate(member, currentDate);
              const isPresent = attendance?.status === "present";
              const isAbsentJustified = attendance?.status === "absent_justified";
              const isAbsentUnjustified = attendance?.status === "absent_unjustified";
              const hasPaid = hasPaidThisMonth(member);

              return (
                <tr key={member.id} className="hover:bg-slate-50 transition-colors">
                  {/* Colonne Élève */}
                  <td className="p-3">
                    <div>
                      <div className="font-medium text-slate-900">
                        {capitalize(member.firstName)} {capitalize(member.lastName)}
                      </div>
                    </div>
                  </td>

                  {/* Colonne Ville */}
                  <td className="p-3">
                    <div className="text-slate-600">{member.city || "-"}</div>
                  </td>

                  {/* Colonne Présence */}
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      {getAttendanceBadge(member)}
                    </div>
                  </td>

                  {/* Colonne Paiement */}
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      {getPaymentBadge(member)}
                    </div>
                  </td>

                  {/* Colonne Actions */}
                  <td className="p-3">
                    <div className="flex items-center gap-1">
                      {/* Boutons Présence */}
                      <Button
                        size="sm"
                        variant={isPresent ? "default" : "outline"}
                        onClick={() => onMarkPresent(member.id, currentDate, "present")}
                        className="h-8 w-8 p-0"
                        title="Présent"
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant={isAbsentJustified ? "secondary" : "outline"}
                        onClick={() => onMarkPresent(member.id, currentDate, "absent_justified")}
                        className="h-8 w-8 p-0"
                        title="Absent justifié"
                      >
                        <FileQuestion className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant={isAbsentUnjustified ? "destructive" : "outline"}
                        onClick={() => onMarkPresent(member.id, currentDate, "absent_unjustified")}
                        className="h-8 w-8 p-0"
                        title="Absent non justifié"
                      >
                        <X className="h-3 w-3" />
                      </Button>

                      {/* Bouton Paiement */}
                      <Button
                        size="sm"
                        variant={hasPaid ? "default" : "outline"}
                        onClick={() => hasPaid ? onUnmarkPayment(member.id) : onMarkPayment(member.id)}
                        className="h-8 w-8 p-0"
                        title={hasPaid ? "Marquer comme non payé" : "Marquer comme payé"}
                        disabled={shareMode}
                      >
                        <CreditCard className="h-3 w-3" />
                      </Button>

                      {/* Bouton Suppression */}
                      {isAdmin && onDeleteMember && canManageMembers && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            if (confirm(`Supprimer ${capitalize(member.firstName)} ${capitalize(member.lastName)} ?`)) {
                              onDeleteMember(member.id);
                            }
                          }}
                          className="h-8 w-8 p-0 text-slate-400 hover:text-red-600"
                          title="Supprimer"
                          disabled={shareMode}
                        >
                          <Trash2 className="h-3 w-3" />
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
  );
}

export default MembersTable;