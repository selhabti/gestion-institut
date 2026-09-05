// src/components/MemberForm.tsx
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertCircle, Loader2, UserPlus, Star, X, Users } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import type { GroupType } from "@/types/member";
import { MemberFormDuplicateCheck } from "./MemberFormDuplicateCheck";
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

interface MemberFormProps {
  onAddMember: (
    firstName: string,
    lastName: string,
    city: string,
    phone: string,
    email: string,
    primaryGroup: GroupType,
    secondaryGroups?: GroupType[]
  ) => Promise<void>;
  onAddGroupToExistingMember?: (
    memberId: string,
    groupToAdd: GroupType
  ) => Promise<void>; // Promise<void> au lieu de Promise<{ success: boolean }>
}

const MemberForm: React.FC<MemberFormProps> = ({ 
  onAddMember,
  onAddGroupToExistingMember 
}) => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [selectedGroups, setSelectedGroups] = useState<GroupType[]>(["Samedi"]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  // États pour la gestion des doublons
  const [existingMemberId, setExistingMemberId] = useState<string | null>(null);
  const [showAddGroupDialog, setShowAddGroupDialog] = useState(false);
  const [duplicateMember, setDuplicateMember] = useState<any>(null);

  // Tous les groupes disponibles
  const allGroups: GroupType[] = ["Samedi", "Dimanche", "Lundi"];

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

  // Le premier groupe est le groupe principal
  const primaryGroup = selectedGroups[0];

  // Fonction pour gérer la découverte d'un doublon
  const handleDuplicateFound = (member: any) => {
    setDuplicateMember(member);
    setExistingMemberId(member.id);
    
    // Afficher un toast d'avertissement
    toast.warning(`"${member.first_name} ${member.last_name}" existe déjà`, {
      description: 'Voulez-vous ajouter un nouveau groupe à cet élève existant ?',
      action: {
        label: 'Oui',
        onClick: () => setShowAddGroupDialog(true)
      },
      duration: 10000, // 10 secondes
    });
  };

  // Fonction pour ajouter un groupe à un membre existant
  const handleAddGroupToExisting = async () => {
    if (!existingMemberId || !primaryGroup || !onAddGroupToExistingMember) {
      toast.error("Impossible d'ajouter le groupe");
      return;
    }

    setIsLoading(true);
    try {
      await onAddGroupToExistingMember(existingMemberId, primaryGroup);
      
      toast.success("Groupe ajouté avec succès", {
        description: `${primaryGroup} a été ajouté aux groupes de ${duplicateMember?.first_name} ${duplicateMember?.last_name}`,
        icon: <CheckCircle className="h-5 w-5" />,
      });

      // Réinitialiser le formulaire
      setFirstName("");
      setLastName("");
      setCity("");
      setPhone("");
      setEmail("");
      setSelectedGroups(["Samedi"]);
      setExistingMemberId(null);
      setDuplicateMember(null);
      setShowAddGroupDialog(false);
      
    } catch (err) {
      toast.error("Impossible d'ajouter le groupe", {
        description: "Vérifiez votre connexion ou réessayez plus tard",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Si un doublon a été détecté, proposer d'ajouter le groupe
    if (duplicateMember) {
      setShowAddGroupDialog(true);
      return;
    }

    if (!firstName.trim() || !lastName.trim()) {
      toast.error("Prénom et nom sont obligatoires");
      return;
    }

    if (!phone.trim()) {
      toast.error("Le numéro de téléphone est obligatoire");
      return;
    }

    if (selectedGroups.length === 0) {
      toast.error("Veuillez sélectionner au moins un groupe");
      return;
    }

    setIsLoading(true);
    try {
      const secondaryGroups = selectedGroups.slice(1); // Tous sauf le premier
      
      await onAddMember(
        firstName.trim(), 
        lastName.trim(), 
        city.trim(), 
        phone.trim(), 
        email.trim(), 
        primaryGroup,
        secondaryGroups.length > 0 ? secondaryGroups : undefined
      );

      const groupDescription = selectedGroups.length === 1 
        ? `Inscrit au ${getGroupDisplayName(primaryGroup)}`
        : `Inscrit à ${selectedGroups.length} groupes : ${selectedGroups.map(g => getGroupDisplayName(g)).join(", ")}`;

      toast.success(`${firstName} ${lastName} ajouté avec succès !`, {
        description: groupDescription,
        icon: <CheckCircle className="h-5 w-5" />,
      });

      setIsSuccess(true);
      setFirstName("");
      setLastName("");
      setCity("");
      setPhone("");
      setEmail("");
      setSelectedGroups(["Samedi"]);
      setDuplicateMember(null);

      setTimeout(() => setIsSuccess(false), 4000);
    } catch (err: any) {
      // Gérer les erreurs spécifiques de contrainte d'unicité
      if (err.code === '23505') {
        toast.error("Cet élève existe déjà", {
          description: "Veuillez vérifier si l'élève est déjà inscrit",
          action: {
            label: 'Voir la liste',
            onClick: () => {
              // Option: naviguer vers la liste des membres
              window.location.href = '/members';
            }
          }
        });
      } else {
        toast.error("Impossible d'ajouter l'élève", {
          description: "Vérifiez votre connexion ou réessayez plus tard",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getGroupDisplayName = (g: GroupType) => {
    return g === "Lundi" ? "La méthode Nouraniya" : `Groupe ${g}`;
  };

  // Fonction pour formater les groupes d'un membre
  const formatMemberGroups = (member: any) => {
    const groups = [member.group_type];
    if (member.secondary_groups && Array.isArray(member.secondary_groups)) {
      groups.push(...member.secondary_groups);
    }
    return groups.join(', ');
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white/95 backdrop-blur-xl rounded-2xl border border-black/10 shadow-2xl overflow-hidden"
      >
        <div className="p-8 pb-6 text-center border-b border-black/5">
          <div className="inline-flex p-4 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl shadow-2xl mb-5">
            <UserPlus className="h-10 w-10 text-white" />
          </div>
          <h2 className="text-4xl font-geist-black text-slate-900 mb-2">
            Ajouter un élève
          </h2>
          <p className="text-slate-600 font-geist-medium text-lg">
            Enregistrement d'un nouvel élève dans l'institut
          </p>
        </div>

        <div className="p-8">
          {/* Succès animé */}
          {isSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-5 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl flex items-center gap-4 shadow-inner"
            >
              <div className="p-3 bg-emerald-500 rounded-2xl">
                <CheckCircle className="h-8 w-8 text-white" />
              </div>
              <div className="text-left">
                <p className="font-geist-bold text-emerald-900">
                  Élève ajouté avec succès !
                </p>
                <p className="text-sm text-emerald-700 font-geist-medium">
                  {firstName} {lastName} est maintenant inscrit à {selectedGroups.length} groupe(s)
                </p>
              </div>
            </motion.div>
          )}

          {/* Message d'information sur les groupes multiples */}
          {!duplicateMember && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <div className="flex items-start gap-3">
                <Users className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-800">
                    💡 Système anti-doublon activé
                  </p>
                  <p className="text-sm text-blue-600 mt-1">
                    Si vous essayez d'ajouter un élève déjà existant, le système vous proposera d'ajouter 
                    le groupe comme groupe secondaire au lieu de créer un doublon.
                  </p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-7">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-lg font-geist-bold text-slate-800">
                  Prénom *
                </Label>
                <Input
                  value={firstName}
                  onChange={(e) => {
                    setFirstName(e.target.value);
                    // Réinitialiser la détection de doublon si le nom change
                    if (duplicateMember) {
                      setDuplicateMember(null);
                      setExistingMemberId(null);
                    }
                  }}
                  placeholder="Prénom"
                  disabled={isLoading}
                  className="h-14 text-lg font-geist-medium border-black/10 focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-lg font-geist-bold text-slate-800">
                  Nom *
                </Label>
                <Input
                  value={lastName}
                  onChange={(e) => {
                    setLastName(e.target.value);
                    // Réinitialiser la détection de doublon si le nom change
                    if (duplicateMember) {
                      setDuplicateMember(null);
                      setExistingMemberId(null);
                    }
                  }}
                  placeholder="Nom de famille"
                  disabled={isLoading}
                  className="h-14 text-lg font-geist-medium border-black/10 focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-lg font-geist-bold text-slate-800">
                Ville
              </Label>
              <Input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Ville de résidence"
                disabled={isLoading}
                className="h-14 text-lg font-geist-medium border-black/10 focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-lg font-geist-bold text-slate-800">
                  Téléphone *
                </Label>
                <Input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Numéro de téléphone"
                  disabled={isLoading}
                  className="h-14 text-lg font-geist-medium border-black/10 focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-lg font-geist-bold text-slate-800">
                  Email
                </Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Adresse email (optionnel)"
                  disabled={isLoading}
                  className="h-14 text-lg font-geist-medium border-black/10 focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Détection des doublons */}
            <MemberFormDuplicateCheck
              firstName={firstName}
              lastName={lastName}
              onDuplicateFound={handleDuplicateFound}
            />

            {/* Message d'avertissement si doublon détecté */}
            {duplicateMember && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-amber-800">
                      ⚠️ Élève déjà existant détecté
                    </p>
                    <div className="mt-2 p-3 bg-white rounded-lg border border-amber-100">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">
                            {duplicateMember.first_name} {duplicateMember.last_name}
                          </p>
                          <p className="text-sm text-slate-600 mt-1">
                            {duplicateMember.city && `Ville: ${duplicateMember.city} • `}
                            Groupes actuels: {formatMemberGroups(duplicateMember)}
                          </p>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(`/member/${duplicateMember.id}`, '_blank')}
                        >
                          Voir fiche
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-amber-700 mt-2">
                      Cliquez sur "Ajouter l'élève" pour ajouter {getGroupDisplayName(primaryGroup)} comme groupe secondaire.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <Label className="text-lg font-geist-bold text-slate-800">
                Groupes *
              </Label>
              
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="mb-3">
                  <p className="text-sm text-slate-600 font-geist-medium mb-2">
                    Sélectionnez les groupes de l'élève :
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {allGroups.map((group) => (
                      <Badge
                        key={group}
                        variant={selectedGroups.includes(group) ? "default" : "outline"}
                        className={`text-base px-4 py-2 cursor-pointer transition-all ${selectedGroups.includes(group) ? (group === primaryGroup ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-slate-600 hover:bg-slate-700') : ''}`}
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
                      <p className="text-sm font-geist-bold text-blue-800">
                        Groupe principal
                      </p>
                      <p className="text-xs text-blue-600">
                        Le premier groupe sélectionné ({getGroupDisplayName(primaryGroup)}) est le groupe principal. 
                        Faites glisser pour réorganiser.
                      </p>
                    </div>
                  </div>

                  {selectedGroups.length > 1 && (
                    <div className="mt-3 pt-3 border-t border-blue-100">
                      <p className="text-sm font-geist-bold text-slate-700 mb-2">
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
                                <span className="font-geist-medium">{getGroupDisplayName(group)}</span>
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
            

            <Button
              type="submit"
              size="lg"
              disabled={isLoading || !firstName.trim() || !lastName.trim() || !phone.trim() || selectedGroups.length === 0}
              className="w-full h-16 text-xl font-geist-black bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-xl disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-7 w-7 animate-spin mr-3" />
                  {duplicateMember ? "Ajout du groupe..." : "Ajout en cours..."}
                </>
              ) : (
                <>
                  <UserPlus className="h-7 w-7 mr-3" />
                  {duplicateMember ? `Ajouter ${getGroupDisplayName(primaryGroup)} comme groupe secondaire` : "Ajouter l'élève"}
                </>
              )}
            </Button>
          </form>
        </div>
      </motion.div>

      {/* Dialog pour confirmer l'ajout de groupe à un membre existant */}
      <AlertDialog open={showAddGroupDialog} onOpenChange={setShowAddGroupDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ajouter un groupe à un élève existant</AlertDialogTitle>
            <AlertDialogDescription>
              Vous allez ajouter <span className="font-semibold">{getGroupDisplayName(primaryGroup)}</span> comme groupe secondaire à :
              <div className="mt-3 p-3 bg-slate-50 rounded-lg">
                <p className="font-medium">
                  {duplicateMember?.first_name} {duplicateMember?.last_name}
                </p>
                <p className="text-sm text-slate-600 mt-1">
                  Groupes actuels: {duplicateMember ? formatMemberGroups(duplicateMember) : ''}
                </p>
              </div>
              <p className="mt-3 text-amber-600">
                Cette action ne créera pas de nouvel élève, mais ajoutera simplement un nouveau groupe à l'élève existant.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={async () => {
                setIsLoading(true);
                try {
                  await handleAddGroupToExisting();
                  setShowAddGroupDialog(false);
                } catch (error) {
                  // L'erreur est déjà gérée dans handleAddGroupToExisting
                } finally {
                  setIsLoading(false);
                }
              }}
              disabled={isLoading}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Ajout en cours...
                </>
              ) : (
                `Ajouter ${getGroupDisplayName(primaryGroup)}`
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default MemberForm;