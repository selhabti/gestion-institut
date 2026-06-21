// src/components/attendance/EditMemberGroupsModal.tsx
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, X } from 'lucide-react';
import { toast } from 'sonner';
import type { Member, GroupType } from '@/types/member';
import type { SessionType } from '@/types/session';

interface EditMemberGroupsModalProps {
  member: Member;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (memberId: string, primaryGroup: SessionType, secondaryGroups?: SessionType[]) => Promise<void>;
}

const EditMemberGroupsModal: React.FC<EditMemberGroupsModalProps> = ({
  member,
  open,
  onOpenChange,
  onSave,
}) => {
  // Fonction pour obtenir tous les groupes d'un membre
  const getMemberAllGroups = (): SessionType[] => {
    const groups: SessionType[] = [member.group];
    
    if (member.secondaryGroups && Array.isArray(member.secondaryGroups)) {
      groups.push(...member.secondaryGroups);
    }
    
    // Retourne les groupes uniques
    return [...new Set(groups)];
  };

  // Fonction pour obtenir les groupes secondaires
  const getSecondaryGroups = (): SessionType[] => {
    return member.secondaryGroups || [];
  };

  // Fonction pour obtenir le groupe principal
  const getPrimaryGroup = (): SessionType => {
    return member.group;
  };

  // Initialiser les groupes sélectionnés
  const [selectedGroups, setSelectedGroups] = useState<SessionType[]>(() => {
    return getMemberAllGroups();
  });
  
  const [isLoading, setIsLoading] = useState(false);

  // Tous les groupes disponibles (inclut Samedi+Dimanche)
  const allGroups: SessionType[] = ['Samedi', 'Dimanche', 'Lundi', 'Samedi+Dimanche'];
  
  // Le groupe principal est le premier dans la liste
  const primaryGroup = selectedGroups[0] || member.group;

  // Gérer la sélection/désélection d'un groupe
  const toggleGroup = (group: SessionType) => {
    if (selectedGroups.includes(group)) {
      // Ne pas permettre de désélectionner le dernier groupe
      if (selectedGroups.length > 1) {
        setSelectedGroups(selectedGroups.filter(g => g !== group));
      } else {
        toast.warning('Un élève doit avoir au moins un groupe');
      }
    } else {
      // Si on ajoute un nouveau groupe, le mettre en fin de liste
      setSelectedGroups([...selectedGroups, group]);
    }
  };

  // Obtenir le nom d'affichage d'un groupe
  const getGroupDisplayName = (group: SessionType): string => {
    switch(group) {
      case 'Samedi': return 'Groupe Samedi';
      case 'Dimanche': return 'Groupe Dimanche';
      case 'Lundi': return 'La méthode Nouraniya';
      case 'Samedi+Dimanche': return 'Groupe Weekend (Samedi+Dimanche)';
      default: return group;
    }
  };

  const handleSubmit = async () => {
    if (selectedGroups.length === 0) {
      toast.error('Veuillez sélectionner au moins un groupe');
      return;
    }

    setIsLoading(true);
    try {
      // Le premier groupe est le groupe principal
      const primaryGroup = selectedGroups[0];
      
      // Les autres groupes sont les groupes secondaires
      const secondaryGroups = selectedGroups.slice(1);
      
      await onSave(member.id, primaryGroup, secondaryGroups.length > 0 ? secondaryGroups : undefined);
      
      toast.success('Groupes mis à jour avec succès');
      onOpenChange(false);
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
      console.error('Erreur:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            Modifier les groupes de {member.firstName} {member.lastName}
          </DialogTitle>
          <DialogDescription>
            Sélectionnez les groupes auxquels cet élève appartient. Le premier groupe dans la liste sera le groupe principal.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <p className="text-sm text-slate-600 mb-3">
              Sélectionnez les groupes de cet élève :
            </p>
            <div className="flex flex-wrap gap-2 mb-4">
              {allGroups.map((group) => {
                const isSelected = selectedGroups.includes(group);
                const isPrimary = group === primaryGroup;
                
                return (
                  <Badge
                    key={group}
                    variant={isSelected ? "default" : "outline"}
                    className={`
                      cursor-pointer px-3 py-1.5
                      ${isSelected 
                        ? (isPrimary 
                            ? 'bg-indigo-600 hover:bg-indigo-700 text-white' 
                            : 'bg-slate-600 hover:bg-slate-700 text-white'
                          )
                        : 'bg-white hover:bg-slate-50'
                      }
                    `}
                    onClick={() => toggleGroup(group)}
                  >
                    <div className="flex items-center gap-1">
                      {isSelected && isPrimary && (
                        <Star className="h-3 w-3 fill-yellow-300 text-yellow-300" />
                      )}
                      {getGroupDisplayName(group)}
                      {isSelected && !isPrimary && (
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
                    </div>
                  </Badge>
                );
              })}
            </div>

            {selectedGroups.length > 0 && (
              <div className="bg-slate-50 rounded-lg p-3">
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
                        {index > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedGroups(selectedGroups.filter((_, i) => i !== index));
                            }}
                            className="p-1 hover:bg-slate-200 rounded-full text-slate-500"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  ★ = Groupe principal (le premier dans la liste).<br />
                  Faites glisser pour réorganiser l'ordre des groupes.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditMemberGroupsModal;