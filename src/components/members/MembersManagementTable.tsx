// Path: src/components/members/MembersManagementTable.tsx

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { Edit, Trash2, User, Loader2, Star, X, Tag, ArrowRightLeft } from "lucide-react";
import type { Member, GroupType } from "@/types/member";
import { toast } from "sonner";
import MemberForm from "@/components/MemberForm";

// ===================================
// INTERFACE CORRIGÉE
// ===================================
interface MembersManagementTableProps {
  members: Member[];
  loading: boolean;
  onAddMember: (
    firstName: string,
    lastName: string,
    city: string,
    primaryGroup: GroupType,
    secondaryGroups?: GroupType[]
  ) => Promise<void>;
  onDeleteMember: (memberId: string) => void;
  onUpdateMember: (memberId: string, updates: Partial<Member>) => Promise<void>;
  onAddGroupToMember?: (memberId: string, groupToAdd: GroupType) => Promise<void>;
  onRemoveGroupFromMember?: (memberId: string, groupToRemove: GroupType) => Promise<void>;
  shareMode: boolean;
}
// ===================================

export const MembersManagementTable = ({
  members,
  loading,
  onAddMember,
  onDeleteMember,
  onUpdateMember,
  onAddGroupToMember,
  onRemoveGroupFromMember,
  shareMode,
}: MembersManagementTableProps) => {
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<string | null>(null);
  const [confirmationText, setConfirmationText] = useState("");
  const [selectedGroups, setSelectedGroups] = useState<GroupType[]>([]);
  const [availableGroups, setAvailableGroups] = useState<GroupType[]>([]);

  // Initialiser les groupes lorsqu'on commence à éditer un membre
  useEffect(() => {
    if (editingMember) {
      // Groupe principal + groupes secondaires
      const allGroups: GroupType[] = [
        editingMember.group,
        ...(editingMember.secondaryGroups || [])
      ];
      setSelectedGroups([...new Set(allGroups)]); // Éviter les doublons
      
      // Tous les groupes disponibles
      const allAvailable: GroupType[] = ["Samedi", "Dimanche", "Lundi"];
      setAvailableGroups(allAvailable);
    }
  }, [editingMember]);

  const handleEdit = (member: Member) => {
    setEditingMember({ ...member });
  };

  // Gérer la sélection/désélection d'un groupe
  const toggleGroup = (group: GroupType) => {
    if (selectedGroups.includes(group)) {
      // Ne pas permettre de désélectionner le dernier groupe
      if (selectedGroups.length > 1) {
        setSelectedGroups(selectedGroups.filter(g => g !== group));
      } else {
        toast.warning("Un élève doit avoir au moins un groupe");
      }
    } else {
      setSelectedGroups([...selectedGroups, group]);
    }
  };

  // Obtenir le groupe principal (premier de la liste)
  const primaryGroup = selectedGroups[0] || editingMember?.group || "Samedi";

  const handleSaveEdit = async () => {
    if (!editingMember) return;

    try {
      // Déterminer le groupe principal et les groupes secondaires
      const newPrimaryGroup = selectedGroups[0];
      const newSecondaryGroups = selectedGroups.slice(1);

      await onUpdateMember(editingMember.id, {
        firstName: editingMember.firstName,
        lastName: editingMember.lastName,
        city: editingMember.city,
        group: newPrimaryGroup,
        secondaryGroups: newSecondaryGroups.length > 0 ? newSecondaryGroups : undefined,
      });

      setEditingMember(null);
      setSelectedGroups([]);
      
      toast.success("Élève mis à jour avec succès", {
        description: `Groupes: ${selectedGroups.join(', ')}`,
      });
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
      toast.error("Erreur lors de la mise à jour");
    }
  };

  // Ajouter un groupe à un membre existant
  const handleAddGroup = async (member: Member, group: GroupType) => {
    if (!onAddGroupToMember) {
      toast.error("Fonction d'ajout de groupe non disponible");
      return;
    }

    try {
      await onAddGroupToMember(member.id, group);
      
      toast.success("Groupe ajouté avec succès", {
        description: `${group} a été ajouté à ${member.firstName} ${member.lastName}`,
      });
    } catch (error) {
      console.error("Erreur lors de l'ajout de groupe:", error);
      toast.error("Erreur lors de l'ajout du groupe");
    }
  };

  // Supprimer un groupe d'un membre existant
  const handleRemoveGroup = async (member: Member, group: GroupType) => {
    if (!onRemoveGroupFromMember) {
      toast.error("Fonction de suppression de groupe non disponible");
      return;
    }

    // Ne pas permettre de supprimer le groupe principal
    if (member.group === group) {
      toast.warning("Impossible de supprimer le groupe principal");
      return;
    }

    if (window.confirm(`Supprimer le groupe ${group} de ${member.firstName} ${member.lastName} ?`)) {
      try {
        await onRemoveGroupFromMember(member.id, group);
        
        toast.success("Groupe supprimé avec succès", {
          description: `${group} a été retiré de ${member.firstName} ${member.lastName}`,
        });
      } catch (error) {
        console.error("Erreur lors de la suppression de groupe:", error);
        toast.error("Erreur lors de la suppression du groupe");
      }
    }
  };

  const handleDeleteClick = (memberId: string) => {
    if (shareMode) {
      console.log("🚫 Suppression bloquée - Mode partage activé");
      return;
    }
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

  // Fonction pour obtenir l'affichage des groupes
  const getGroupDisplayName = (g: GroupType): string => {
    return g === "Lundi" ? "La méthode Nouraniya" : `Groupe ${g}`;
  };

  return (
    <div className="space-y-6">
      {/* Tableau avec alignement parfait */}
      <div className="border-2 border-slate-300 rounded-lg overflow-hidden shadow-sm bg-white">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex flex-col items-center py-12 text-slate-500 bg-white">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mb-4" />
              <p className="font-medium text-slate-600">
                Chargement de la liste...
              </p>
            </div>
          ) : members.length > 0 ? (
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
                    Groupe(s)
                  </th>
                  <th className="text-left p-4 font-semibold text-slate-700 uppercase tracking-wider text-xs align-middle h-12 w-48">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {members.map((member) => {
                  const allGroups = [member.group, ...(member.secondaryGroups || [])];
                  const hasMultipleGroups = allGroups.length > 1;
                  
                  return (
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
                        <div className="flex flex-wrap gap-1">
                          {/* Groupe principal */}
                          <Badge
                            className={`
                              inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border
                              ${member.group === "Samedi"
                                ? "bg-blue-100 text-blue-800 border-blue-200"
                                : member.group === "Dimanche"
                                ? "bg-green-100 text-green-800 border-green-200"
                                : "bg-purple-100 text-purple-800 border-purple-200"
                              }
                              ${hasMultipleGroups ? 'font-bold' : ''}
                            `}
                          >
                            {member.group}
                            {hasMultipleGroups && (
                              <Star className="h-3 w-3 ml-1 fill-yellow-300 text-yellow-500" />
                            )}
                          </Badge>
                          
                          {/* Groupes secondaires */}
                          {member.secondaryGroups && member.secondaryGroups.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {member.secondaryGroups.map((group) => (
                                <Badge
                                  key={group}
                                  variant="outline"
                                  className={`
                                    text-xs px-2 py-0.5
                                    ${group === "Samedi"
                                      ? "bg-blue-50 text-blue-700 border-blue-300"
                                      : group === "Dimanche"
                                      ? "bg-green-50 text-green-700 border-green-300"
                                      : "bg-purple-50 text-purple-700 border-purple-300"
                                    }
                                  `}
                                >
                                  {group}
                                  {onRemoveGroupFromMember && !shareMode && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleRemoveGroup(member, group);
                                      }}
                                      className="ml-1 hover:bg-white/20 rounded-full p-0.5"
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  )}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        
                        {/* Boutons rapides pour ajouter des groupes */}
                        {!shareMode && onAddGroupToMember && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {["Samedi", "Dimanche", "Lundi"]
                              .filter(g => !allGroups.includes(g as GroupType))
                              .map(group => (
                                <Button
                                  key={group}
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleAddGroup(member, group as GroupType)}
                                  className="h-6 text-xs px-2"
                                >
                                  <ArrowRightLeft className="h-3 w-3 mr-1" />
                                  + {group}
                                </Button>
                              ))
                            }
                          </div>
                        )}
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
                            title="Modifier les groupes"
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
                            title="Supprimer l'élève"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            // Message quand il n'y a pas de membres
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

      {/* Modal de modification avec gestion des groupes multiples */}
      <Dialog
        open={!!editingMember}
        onOpenChange={() => {
          setEditingMember(null);
          setSelectedGroups([]);
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Modifier {editingMember?.firstName} {editingMember?.lastName}
            </DialogTitle>
            <DialogDescription>
              Modifiez les informations et les groupes de cet élève
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Informations de base */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            {/* Gestion des groupes multiples */}
            <div className="space-y-3">
              <label className="text-sm font-medium">
                Groupes *
                <span className="text-xs text-slate-500 ml-2">
                  (Cliquez pour sélectionner/désélectionner)
                </span>
              </label>
              
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div className="mb-3">
                  <p className="text-sm text-slate-600 mb-2">
                    Sélectionnez les groupes de l'élève :
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {availableGroups.map((group) => (
                      <Badge
                        key={group}
                        variant={selectedGroups.includes(group) ? "default" : "outline"}
                        className={`text-base px-4 py-2 cursor-pointer transition-all ${
                          selectedGroups.includes(group) 
                            ? (group === primaryGroup 
                                ? 'bg-indigo-600 hover:bg-indigo-700' 
                                : 'bg-slate-600 hover:bg-slate-700'
                              )
                            : ''
                        }`}
                        onClick={() => toggleGroup(group)}
                      >
                        {selectedGroups.includes(group) && group === primaryGroup && (
                          <Star className="h-4 w-4 mr-1 fill-yellow-300 text-yellow-300" />
                        )}
                        {getGroupDisplayName(group)}
                        {selectedGroups.includes(group) && group !== primaryGroup && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleGroup(group);
                            }}
                            className="ml-2 hover:bg-white/20 rounded-full p-0.5"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-start gap-2">
                    <div className="p-1.5 bg-blue-100 rounded-md">
                      <Star className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-blue-800">
                        Groupe principal
                      </p>
                      <p className="text-xs text-blue-600">
                        Le premier groupe dans la liste ({getGroupDisplayName(primaryGroup)}) est le groupe principal.
                        Faites glisser pour réorganiser.
                      </p>
                    </div>
                  </div>

                  {selectedGroups.length > 1 && (
                    <div className="mt-3 pt-3 border-t border-blue-100">
                      <p className="text-sm font-medium text-slate-700 mb-2">
                        Groupes sélectionnés ({selectedGroups.length}) :
                      </p>
                      <div className="space-y-2">
                        {selectedGroups.map((group, index) => (
                          <div 
                            key={group}
                            className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200"
                            draggable
                            onDragStart={(e) => {
                              e.dataTransfer.setData('text/plain', index.toString());
                            }}
                            onDragOver={(e) => {
                              e.preventDefault();
                              e.currentTarget.classList.add('bg-blue-50');
                            }}
                            onDragLeave={(e) => {
                              e.currentTarget.classList.remove('bg-blue-50');
                            }}
                            onDrop={(e) => {
                              e.preventDefault();
                              e.currentTarget.classList.remove('bg-blue-50');
                              const draggedIndex = parseInt(e.dataTransfer.getData('text/plain'));
                              const newGroups = [...selectedGroups];
                              const [draggedItem] = newGroups.splice(draggedIndex, 1);
                              newGroups.splice(index, 0, draggedItem);
                              setSelectedGroups(newGroups);
                            }}
                          >
                            <div className="flex items-center gap-3">
                              <div className="text-slate-400 text-sm">
                                {index + 1}.
                              </div>
                              <div className="flex items-center gap-2">
                                {index === 0 && (
                                  <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                                )}
                                <span className="font-medium">{getGroupDisplayName(group)}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  if (selectedGroups.length > 1) {
                                    if (index === 0) {
                                      toast.warning("Impossible de supprimer le groupe principal");
                                    } else {
                                      setSelectedGroups(selectedGroups.filter((_, i) => i !== index));
                                    }
                                  }
                                }}
                                className="p-1 hover:bg-slate-200 rounded-full text-slate-500"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setEditingMember(null);
                setSelectedGroups([]);
              }}
            >
              Annuler
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={!editingMember?.firstName || !editingMember?.lastName || selectedGroups.length === 0}
            >
              Sauvegarder les modifications
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

export default MembersManagementTable;