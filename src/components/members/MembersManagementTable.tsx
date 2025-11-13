import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Users } from "lucide-react";
import type { Member } from "@/types/member";

interface MembersManagementTableProps {
  members: Member[];
  onDeleteMember: (id: string) => void;
  shareMode: boolean;
}

export const MembersManagementTable = ({ 
  members, 
  onDeleteMember, 
  shareMode 
}: MembersManagementTableProps) => {
  if (members.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
        <p>Aucun membre dans ce groupe</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="text-left p-3 font-medium text-slate-700">Élève</th>
              <th className="text-left p-3 font-medium text-slate-700">Ville</th>
              <th className="text-left p-3 font-medium text-slate-700">Groupe</th>
              <th className="text-left p-3 font-medium text-slate-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {members.map((member) => (
              <tr key={member.id} className="hover:bg-slate-50 transition-colors">
                <td className="p-3">
                  <div className="font-medium text-slate-900">
                    {member.firstName} {member.lastName}
                  </div>
                </td>
                <td className="p-3 text-slate-600">{member.city || "-"}</td>
                <td className="p-3">
                  <Badge variant="outline" className="bg-blue-50 text-blue-700">
                    {member.group}
                  </Badge>
                </td>
                <td className="p-3">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      if (confirm(`Supprimer ${member.firstName} ${member.lastName} ?`)) {
                        onDeleteMember(member.id);
                      }
                    }}
                    className="text-slate-400 hover:text-red-600"
                    title="Supprimer"
                    disabled={shareMode}
                  >
                    <AlertCircle className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
