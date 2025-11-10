//Path: src/components/MembersTable.tsx

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Check, X, FileQuestion, Euro, Trash2 } from "lucide-react";
import type { Member, AttendanceStatus } from "@/types/member";
import { capitalize } from "@/lib/utils";

interface MembersTableProps {
  members: Member[];
  selectedGroup: "Samedi" | "Dimanche" | "Lundi";
  currentDate: string;
  onMarkPresent: (memberId: string, date: string, status: AttendanceStatus) => void;
  onMarkPayment: (memberId: string) => void;
  isAdmin?: boolean;
  onDeleteMember?: (memberId: string) => void;
  shareMode?: boolean;
}

export function MembersTable({
  members,
  selectedGroup,
  currentDate,
  onMarkPresent,
  onMarkPayment,
  isAdmin,
  onDeleteMember,
  shareMode = false,
}: MembersTableProps) {
  const groupMembers = members.filter((m) => m.group === selectedGroup);

  const getAttendanceForDate = (member: Member, dateString: string) => {
    return member.attendances.find((a) => a.date === dateString);
  };

  const hasPaymentThisMonth = (member: Member) => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    return member.payments.some((p) => {
      const paymentDate = new Date(p.date);
      return (
        paymentDate.getMonth() === currentMonth &&
        paymentDate.getFullYear() === currentYear
      );
    });
  };

  return (
    <Card className="shadow-sm border-slate-200">
      <CardHeader>
        <CardTitle>Groupe {selectedGroup}</CardTitle>
      </CardHeader>
      <CardContent>
        {groupMembers.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            Aucun membre dans le groupe {selectedGroup}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Prénom</TableHead>
                  <TableHead>Ville</TableHead>
                  <TableHead className="text-center">Présence</TableHead>
                  <TableHead className="text-center">Cotisation</TableHead>
                  {isAdmin && !shareMode && <TableHead className="text-center">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {groupMembers.map((member) => {
                  const attendance = getAttendanceForDate(member, currentDate);
                  const isPresent = attendance?.status === "present";
                  const isAbsentJustified = attendance?.status === "absent_justified";
                  const isAbsentUnjustified = attendance?.status === "absent_unjustified";
                  const hasPaid = hasPaymentThisMonth(member);

                  return (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">
                        {capitalize(member.lastName)}
                      </TableCell>
                      <TableCell>{capitalize(member.firstName)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {member.city || "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-2 flex-wrap">
                          <Button
                            size="sm"
                            variant={isPresent ? "default" : "outline"}
                            onClick={() => onMarkPresent(member.id, currentDate, "present")}
                            className="h-8 w-8 p-0"
                            title="Présent"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant={isAbsentJustified ? "secondary" : "outline"}
                            onClick={() => onMarkPresent(member.id, currentDate, "absent_justified")}
                            className="h-8 w-8 p-0"
                            title="Absence justifiée"
                          >
                            <FileQuestion className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant={isAbsentUnjustified ? "destructive" : "outline"}
                            onClick={() => onMarkPresent(member.id, currentDate, "absent_unjustified")}
                            className="h-8 w-8 p-0"
                            title="Absence non justifiée"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                          {isPresent && (
                            <Badge variant="success" className="ml-2">
                              Présent
                            </Badge>
                          )}
                          {isAbsentJustified && (
                            <Badge variant="secondary" className="ml-2">
                              Absent (J)
                            </Badge>
                          )}
                          {isAbsentUnjustified && (
                            <Badge variant="destructive" className="ml-2">
                              Absent (NJ)
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            size="sm"
                            variant={hasPaid ? "default" : "outline"}
                            onClick={() => onMarkPayment(member.id)}
                            className="gap-2"
                            disabled={!isAdmin}
                          >
                            <Euro className="h-4 w-4" />
                            {hasPaid ? "Payé" : "Marquer"}
                          </Button>
                        </div>
                      </TableCell>
                      {isAdmin && !shareMode && onDeleteMember && (
                        <TableCell>
                          <div className="flex justify-center">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                if (
                                  confirm(
                                    `Supprimer ${capitalize(member.firstName)} ${capitalize(member.lastName)} ?`
                                  )
                                ) {
                                  onDeleteMember(member.id);
                                }
                              }}
                              className="h-8 w-8 p-0"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
