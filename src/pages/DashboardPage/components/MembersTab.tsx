import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ShieldOff, Search, X, Users } from "lucide-react";
import { Suspense } from "react";
import MemberForm from "@/components/MemberForm";
import { MembersManagementTable } from "@/components/members";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import type { Member } from "@/types/member";
import type { GroupType } from "@/types/member"; 

interface MembersTabProps {
  shareMode: boolean;
  selectedGroup: string;
  loading: boolean;
  members: Member[];
  searchTerms: string[];
  searchInput: string;
  filteredMembers: Member[];
  onShareModeChange: (mode: boolean) => void;
  onAddMember: (
    firstName: string,
    lastName: string,
    city: string,
    primaryGroup: GroupType,
    secondaryGroups?: GroupType[]
  ) => Promise<void>;
  onDeleteMember: (memberId: string) => void;
  onUpdateMember: (memberId: string, updates: Partial<Member>) => Promise<void>; // <-- Changé en Promise<void>
  onAddGroupToMember: (memberId: string, groupToAdd: GroupType) => Promise<void>;
  onRemoveGroupFromMember: (memberId: string, groupToRemove: GroupType) => Promise<void>;
  onAddGroupToExistingMember: (memberId: string, groupToAdd: GroupType) => Promise<void>;
  setSearchTerms: (terms: string[]) => void;
  setSearchInput: (input: string) => void;
}

export const MembersTab = ({
  shareMode,
  selectedGroup,
  loading,
  members,
  searchTerms,
  searchInput,
  filteredMembers,
  onShareModeChange,
  onAddMember,
  onDeleteMember,
  onUpdateMember,
  onAddGroupToMember,
  onRemoveGroupFromMember,
  onAddGroupToExistingMember,
  setSearchTerms,
  setSearchInput,
}: MembersTabProps) => {
  if (shareMode) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <ShieldOff className="h-16 w-16 mx-auto mb-4 text-orange-500" />
          <h3 className="text-xl font-semibold text-slate-900 mb-2">
            Accès restreint
          </h3>
          <p className="text-slate-600 mb-4">
            La gestion des membres n'est pas disponible en mode partage.
          </p>
          <Button
            onClick={() => onShareModeChange(false)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Désactiver le mode partage
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="flex flex-col items-center justify-center text-center space-y-3">
            <div className="flex items-center gap-3">
              <Users className="h-6 w-6 text-blue-600" />
              <span className="text-2xl font-bold text-slate-900">
                Gestion des membres
              </span>
            </div>
            <div className="flex items-center gap-4">
              <Badge
                variant="outline"
                className="text-sm px-3 py-1 border-blue-200 bg-blue-50 text-blue-700"
              >
                Groupe {selectedGroup}
              </Badge>
              <Badge className="text-sm px-3 py-1 bg-blue-600 text-white">
                {loading
                  ? "Chargement..."
                  : `${filteredMembers.length} membre${
                      filteredMembers.length > 1 ? "s" : ""
                    }`}
              </Badge>
            </div>
          </CardTitle>
          <CardDescription>
            {loading
              ? "Chargement des données..."
              : "Administration complète des élèves"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <Label
              htmlFor="tag-search"
              className="text-sm font-medium text-slate-700 mb-2 block"
            >
              🔍 Rechercher un élève
            </Label>

            <div className="border border-slate-300 rounded-lg bg-white p-3 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                {searchTerms.map((term, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-1 bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium shadow-sm"
                  >
                    <span>{term}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setSearchTerms(searchTerms.filter((_, i) => i !== index));
                      }}
                      className="ml-1 hover:text-blue-200 text-xs font-bold transition-colors"
                      title="Supprimer ce terme"
                    >
                      ×
                    </button>
                  </div>
                ))}

                <div className="flex-1 flex items-center min-w-[150px]">
                  <Search className="h-4 w-4 text-slate-400 ml-2" />
                  <Input
                    id="tag-search"
                    value={searchInput}
                    placeholder={
                      loading
                        ? "Chargement des données..."
                        : searchTerms.length === 0
                        ? "Nom, prénom, ville..."
                        : "Ajouter un autre terme..."
                    }
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && searchInput.trim()) {
                        e.preventDefault();
                        const newTerm = searchInput.trim();
                        if (newTerm && !searchTerms.includes(newTerm)) {
                          setSearchTerms([...searchTerms, newTerm]);
                        }
                        setSearchInput("");
                      }
                      if (
                        e.key === "Backspace" &&
                        searchInput === "" &&
                        searchTerms.length > 0
                      ) {
                        setSearchTerms(searchTerms.slice(0, -1));
                      }
                    }}
                    disabled={loading}
                    className="flex-1 border-0 outline-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent"
                  />
                  {searchInput && (
                    <button
                      onClick={() => setSearchInput("")}
                      className="p-1 hover:bg-slate-100 rounded-full"
                    >
                      <X className="h-4 w-4 text-slate-400" />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                <div className="text-xs text-slate-500">
                  {loading ? (
                    "Chargement en cours..."
                  ) : searchTerms.length === 0 ? (
                    "Tapez un terme et appuyez sur Entrée pour l'ajouter"
                  ) : (
                    <span className="text-green-600 font-medium">
                      {filteredMembers.length} résultat(s) trouvé(s)
                    </span>
                  )}
                </div>

                {!loading && searchTerms.length > 0 && (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSearchTerms(searchTerms.slice(0, -1));
                        setSearchInput("");
                      }}
                      className="text-xs text-slate-500 hover:text-slate-700 underline"
                    >
                      Retirer dernier
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSearchTerms([]);
                        setSearchInput("");
                      }}
                      className="text-xs text-red-500 hover:text-red-700 underline font-medium"
                    >
                      Tout effacer
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <Suspense
              fallback={
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-3 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-slate-700 font-medium">
                    Chargement de la table des membres...
                  </p>
                  <p className="text-slate-500 text-sm mt-2">
                    Cette opération peut prendre quelques secondes
                  </p>
                </div>
              }
            >
              <ErrorBoundary
                fallback={
                  <div className="p-8 text-center">
                    <p className="text-red-600 mb-4">
                      Erreur de chargement du tableau
                    </p>
                    <Button onClick={() => window.location.reload()}>
                      Réessayer
                    </Button>
                  </div>
                }
              >
                <MembersManagementTable
                  members={filteredMembers}
                  loading={loading}
                  onAddMember={onAddMember}
                  onDeleteMember={onDeleteMember}
                  onUpdateMember={onUpdateMember}
                  onAddGroupToMember={onAddGroupToMember}
                  onRemoveGroupFromMember={onRemoveGroupFromMember}
                  shareMode={shareMode}
                />
              </ErrorBoundary>
            </Suspense>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Ajouter un nouvel élève</CardTitle>
        </CardHeader>
        <CardContent>
          <MemberForm 
            onAddMember={onAddMember} 
            onAddGroupToExistingMember={onAddGroupToExistingMember}
          />
        </CardContent>
      </Card>
    </>
  );
};