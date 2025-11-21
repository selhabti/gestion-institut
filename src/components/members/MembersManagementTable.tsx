// Path: src/components/members/MembersManagementTable.tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Edit, Trash2, User } from "lucide-react";
import type { Member, GroupType } from "@/types/member";

interface MembersManagementTableProps {
  members: Member[];
  onDeleteMember: (memberId: string) => void;
  onUpdateMember: (memberId: string, updates: Partial<Member>) => Promise<void>;
  shareMode: boolean;
}

export const MembersManagementTable = ({
  members,
  onDeleteMember,
  onUpdateMember,
  shareMode,
}: MembersManagementTableProps) => {
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<string | null>(null);
  const [confirmationText, setConfirmationText] = useState("");

  const handleEdit = (member: Member) => {
    setEditingMember({ ...member });
  };

  const handleSaveEdit = async () => {
    if (!editingMember) return;

    try {
      await onUpdateMember(editingMember.id, {
        firstName: editingMember.firstName,
        lastName: editingMember.lastName,
        city: editingMember.city,
        group: editingMember.group,
      });

      setEditingMember(null);
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
    }
  };

  const handleDeleteClick = (memberId: string) => {
    setMemberToDelete(memberId);
    setDeleteConfirmOpen(true);
    setConfirmationText("");
  };

  const confirmDelete = () => {
    if (memberToDelete && confirmationText.toLowerCase() === "supprimer") {
      onDeleteMember(memberToDelete);
      setDeleteConfirmOpen(false);
      setMemberToDelete(null);
      setConfirmationText("");
    }
  };

  return (
    <div className="space-y-4">
      {/* Tableau avec alignement parfait */}
      <div className="border-2 border-slate-300 rounded-lg overflow-hidden shadow-sm bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead className="bg-slate-50 border-b-2 border-slate-200">
              <tr>
                <th className="text-left p-4 font-semibold text-slate-700 uppercase tracking-wider text-xs align-middle h-12">
                  Nom
                </th>
                <th className="text-left p-4 font-semibold text-slate-700 uppercase tracking-wider text-xs align-middle h-12">
                  Prénom
                </th>
                <th className="text-left p-4 font-semibold text-slate-700 uppercase tracking-wider text-xs align-middle h-12">
                  Ville
                </th>
                <th className="text-left p-4 font-semibold text-slate-700 uppercase tracking-wider text-xs align-middle h-12">
                  Groupe
                </th>
                <th className="text-left p-4 font-semibold text-slate-700 uppercase tracking-wider text-xs align-middle h-12 w-32">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {members.map((member) => (
                <tr
                  key={member.id}
                  className="border-b border-slate-100 hover:bg-slate-50 transition-colors duration-150"
                >
                  <td className="p-4 font-medium text-slate-900 align-middle h-14">
                    {member.lastName}
                  </td>
                  <td className="p-4 text-slate-700 align-middle h-14">
                    {member.firstName}
                  </td>
                  <td className="p-4 text-slate-600 align-middle h-14">
                    {member.city || (
                      <span className="text-slate-400 italic">-</span>
                    )}
                  </td>
                  <td className="p-4 align-middle h-14">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                        member.group === "Samedi"
                          ? "bg-blue-100 text-blue-800 border border-blue-200"
                          : member.group === "Dimanche"
                          ? "bg-green-100 text-green-800 border border-green-200"
                          : "bg-purple-100 text-purple-800 border border-purple-200"
                      }`}
                    >
                      {member.group}
                    </span>
                  </td>
                  <td className="p-4 align-middle h-14">
                    <div className="flex items-center gap-2">
                      {/* Bouton Modifier */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(member)}
                        className="h-8 w-8 p-0 border-slate-300 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 text-slate-600 transition-all duration-200 flex items-center justify-center"
                        disabled={shareMode}
                        title="Modifier"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>

                      {/* Bouton Supprimer */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteClick(member.id)}
                        className="h-8 w-8 p-0 border-slate-300 hover:bg-red-50 hover:border-red-300 hover:text-red-600 text-slate-600 transition-all duration-200 flex items-center justify-center"
                        disabled={shareMode}
                        title="Supprimer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {members.length === 0 && (
            <div className="text-center py-12 text-slate-500 bg-white">
              <User className="h-16 w-16 mx-auto mb-4 text-slate-300" />
              <p className="font-medium text-slate-600">Aucun membre trouvé</p>
              <p className="text-sm text-slate-500 mt-1">
                Aucun élève ne correspond à votre recherche
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal de modification */}
      <Dialog
        open={!!editingMember}
        onOpenChange={() => setEditingMember(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Modifier le profil
            </DialogTitle>
            <DialogDescription>
              Modifiez les informations de {editingMember?.firstName}{" "}
              {editingMember?.lastName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Prénom *</label>
              <Input
                value={editingMember?.firstName || ""}
                onChange={(e) =>
                  setEditingMember((prev) =>
                    prev ? { ...prev, firstName: e.target.value } : null
                  )
                }
                placeholder="Prénom de l'élève"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Nom *</label>
              <Input
                value={editingMember?.lastName || ""}
                onChange={(e) =>
                  setEditingMember((prev) =>
                    prev ? { ...prev, lastName: e.target.value } : null
                  )
                }
                placeholder="Nom de l'élève"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Ville</label>
              <Input
                value={editingMember?.city || ""}
                onChange={(e) =>
                  setEditingMember((prev) =>
                    prev ? { ...prev, city: e.target.value } : null
                  )
                }
                placeholder="Ville (optionnel)"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Groupe *</label>
              <select
                value={editingMember?.group || ""}
                onChange={(e) =>
                  setEditingMember((prev) =>
                    prev
                      ? { ...prev, group: e.target.value as GroupType }
                      : null
                  )
                }
                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="Samedi">Samedi</option>
                <option value="Dimanche">Dimanche</option>
                <option value="Lundi">Lundi</option>
              </select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingMember(null)}>
              Annuler
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={!editingMember?.firstName || !editingMember?.lastName}
            >
              Sauvegarder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de confirmation de suppression */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. L'élève sera définitivement
              supprimé du système.
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm font-medium text-red-800 mb-2">
                  ⚠️ Pour confirmer, tapez "supprimer" ci-dessous :
                </p>
                <Input
                  value={confirmationText}
                  onChange={(e) => setConfirmationText(e.target.value)}
                  placeholder='Tapez "supprimer"'
                  className="border-red-300 focus:border-red-500"
                />
                {confirmationText &&
                  confirmationText.toLowerCase() !== "supprimer" && (
                    <p className="text-red-600 text-xs mt-2">
                      Le texte ne correspond pas
                    </p>
                  )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmationText("")}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={confirmationText.toLowerCase() !== "supprimer"}
              className="bg-red-600 hover:bg-red-700 disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed"
            >
              Supprimer définitivement
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
