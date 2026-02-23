import { useState, useMemo } from 'react';
import { Search, UserPlus, Users, Filter, X, Check, Calendar, ArrowRightLeft, Tag } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  capitalize, 
  getMemberAllGroups, 
  isMemberInGroup, 
  hasMultipleGroups 
} from '@/lib/utils';
import type { Member, AttendanceStatus } from '@/types/member';
import type { SessionType } from '@/types/session';

interface AttendanceSearchProps {
  allMembers: Member[];
  selectedGroup: SessionType;
  currentDate: string;
  onMarkAttendance: (
    memberId: string, 
    date: string, 
    status: AttendanceStatus,
    group?: SessionType
  ) => void;
  onMarkPayment: (memberId: string) => void;
  onUnmarkPayment: (memberId: string) => void;
  isLoading?: boolean;
}

export function AttendanceSearch({
  allMembers,
  selectedGroup,
  currentDate,
  onMarkAttendance,
  onMarkPayment,
  onUnmarkPayment,
  isLoading = false,
}: AttendanceSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'current' | 'transfer' | 'weekend' | 'all'>('current');
  const [showOptions, setShowOptions] = useState<string | null>(null);

  // Déterminer le groupe "frère"
  const siblingGroup = useMemo(() => {
    if (selectedGroup === 'Samedi') return 'Dimanche';
    if (selectedGroup === 'Dimanche') return 'Samedi';
    return null;
  }, [selectedGroup]);

  // Membres du groupe actuel
  const currentGroupMembers = useMemo(() => {
    return allMembers.filter(member => isMemberInGroup(member, selectedGroup));
  }, [allMembers, selectedGroup]);

  // Membres du groupe frère
  const siblingGroupMembers = useMemo(() => {
    if (!siblingGroup) return [];
    return allMembers.filter(member => 
      isMemberInGroup(member, siblingGroup) && !isMemberInGroup(member, selectedGroup)
    );
  }, [allMembers, siblingGroup, selectedGroup]);

  // Membres des autres groupes weekend
  const weekendGroupMembers = useMemo(() => {
    if (selectedGroup === 'Lundi') return [];
    
    const weekendGroups: SessionType[] = ['Samedi', 'Dimanche', 'Samedi+Dimanche'];
    return allMembers.filter(member => 
      getMemberAllGroups(member).some(group => 
        weekendGroups.includes(group) && group !== selectedGroup
      ) && !isMemberInGroup(member, selectedGroup)
    );
  }, [allMembers, selectedGroup]);

  // Membres filtrés selon l'onglet
  const filteredMembers = useMemo(() => {
    let membersToShow: Member[] = [];
    
    switch(activeTab) {
      case 'current':
        membersToShow = currentGroupMembers;
        break;
      case 'transfer':
        membersToShow = siblingGroup ? siblingGroupMembers : [];
        break;
      case 'weekend':
        membersToShow = weekendGroupMembers;
        break;
      case 'all':
        membersToShow = allMembers;
        break;
    }
    
    if (!searchTerm.trim()) return membersToShow;
    
    const term = searchTerm.toLowerCase();
    return membersToShow.filter(member =>
      member.firstName.toLowerCase().includes(term) ||
      member.lastName.toLowerCase().includes(term) ||
      (member.city && member.city.toLowerCase().includes(term))
    );
  }, [searchTerm, activeTab, currentGroupMembers, siblingGroupMembers, weekendGroupMembers, allMembers, siblingGroup]);

  // Vérifier la présence (sans utiliser group)
  const isPresentToday = (member: Member) => {
    return member.attendances?.some(a => a.date === currentDate && a.status === 'present');
  };

  // Vérifier si absent justifié
  const isAbsentJustified = (member: Member) => {
    return member.attendances?.some(a => a.date === currentDate && a.status === 'absent_justified');
  };

  // Vérifier si absent non justifié
  const isAbsentUnjustified = (member: Member) => {
    return member.attendances?.some(a => a.date === currentDate && a.status === 'absent_unjustified');
  };

  // Vérifier si peut être ajouté
  const canAdd = (member: Member) => {
    if (isPresentToday(member)) return false;
    
    if (isMemberInGroup(member, selectedGroup)) return false;
    
    const groups = getMemberAllGroups(member);
    
    if (groups.includes('Lundi') && 
        (selectedGroup === 'Samedi' || selectedGroup === 'Dimanche')) {
      return false;
    }
    
    return true;
  };

  return (
    <div className="space-y-4">
      <Card className="p-4 bg-gradient-to-r from-blue-50 to-slate-50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-800">
              Recherche et gestion des présences
            </h3>
            <p className="text-sm text-slate-600">
              {new Date(currentDate).toLocaleDateString('fr-FR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long'
              })}
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-800">
                {currentGroupMembers.length}
              </div>
              <div className="text-xs text-slate-500">Élèves du groupe</div>
            </div>
            
            <Badge variant="outline" className="text-sm">
              <Users className="h-3 w-3 mr-1" />
              {selectedGroup}
            </Badge>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Rechercher un élève par nom, prénom ou ville..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSearchTerm('')}
            disabled={!searchTerm}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="current" className="gap-2">
              <Users className="h-4 w-4" />
              Groupe ({currentGroupMembers.length})
            </TabsTrigger>
            {siblingGroup && (
              <TabsTrigger value="transfer" className="gap-2">
                <ArrowRightLeft className="h-4 w-4" />
                {siblingGroup} ({siblingGroupMembers.length})
              </TabsTrigger>
            )}
            {(selectedGroup === 'Samedi' || selectedGroup === 'Dimanche' || selectedGroup === 'Samedi+Dimanche') && (
              <TabsTrigger value="weekend" className="gap-2">
                <Calendar className="h-4 w-4" />
                Weekend ({weekendGroupMembers.length})
              </TabsTrigger>
            )}
            <TabsTrigger value="all" className="gap-2">
              <Filter className="h-4 w-4" />
              Tous ({allMembers.length})
            </TabsTrigger>
          </TabsList>
          
          {/* Onglet Groupe actuel */}
          <TabsContent value="current" className="mt-4">
            <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm font-medium text-blue-800 mb-1">
                Élèves inscrits au groupe {selectedGroup}
              </p>
              <p className="text-xs text-blue-600">
                {currentGroupMembers.filter(m => hasMultipleGroups(m)).length > 0 && 
                  `(${currentGroupMembers.filter(m => hasMultipleGroups(m)).length} élève(s) avec plusieurs groupes)`}
              </p>
            </div>
            
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {filteredMembers.map(member => {
                const present = isPresentToday(member);
                const absentJustified = isAbsentJustified(member);
                const absentUnjustified = isAbsentUnjustified(member);
                const groups = getMemberAllGroups(member);
                const multiGroup = hasMultipleGroups(member);

                return (
                  <Card key={member.id} className={`p-3 hover:bg-slate-50 transition-colors ${multiGroup ? 'border-l-4 border-l-blue-400' : ''}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-medium">
                            {capitalize(member.firstName)} {capitalize(member.lastName)}
                            {multiGroup && (
                              <Tag className="h-3 w-3 ml-2 inline text-blue-500" />
                            )}
                          </span>
                          
                          <div className="flex flex-wrap gap-1">
                            {groups.map(group => (
                              <Badge 
                                key={group} 
                                variant="outline" 
                                className={`text-xs ${group === selectedGroup ? 'ring-2 ring-offset-1 ring-blue-300' : ''}`}
                              >
                                {group}
                                {group === member.group && ' ★'}
                              </Badge>
                            ))}
                          </div>
                          
                          {present && (
                            <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">
                              <Check className="h-3 w-3 mr-1" />
                              Présent
                            </Badge>
                          )}
                          
                          {absentJustified && (
                            <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 text-xs">
                              Absent justifié
                            </Badge>
                          )}
                          
                          {absentUnjustified && (
                            <Badge className="bg-red-100 text-red-800 border-red-200 text-xs">
                              Absent non justifié
                            </Badge>
                          )}
                        </div>
                        
                        {member.city && (
                          <p className="text-xs text-slate-500">
                            Ville: {capitalize(member.city)}
                          </p>
                        )}
                        
                        {multiGroup && (
                          <p className="text-xs text-blue-600 mt-1">
                            ⓘ Inscrit à {groups.length} groupe(s) - ★ = groupe principal
                          </p>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setShowOptions(showOptions === member.id ? null : member.id)}
                          disabled={isLoading}
                          className="h-8 w-8 p-0"
                        >
                          <span className="text-xs">...</span>
                        </Button>
                      </div>
                    </div>
                    
                    {showOptions === member.id && (
                      <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
                        <div className="grid grid-cols-3 gap-1">
                          <Button
                            size="sm"
                            variant={present ? "default" : "outline"}
                            onClick={() => onMarkAttendance(member.id, currentDate, 'present')}
                            disabled={isLoading}
                            className="text-xs h-7"
                          >
                            Présent
                          </Button>
                          <Button
                            size="sm"
                            variant={absentJustified ? "default" : "outline"}
                            onClick={() => onMarkAttendance(member.id, currentDate, 'absent_justified')}
                            disabled={isLoading}
                            className="text-xs h-7"
                          >
                            Abs. justifié
                          </Button>
                          <Button
                            size="sm"
                            variant={absentUnjustified ? "default" : "outline"}
                            onClick={() => onMarkAttendance(member.id, currentDate, 'absent_unjustified')}
                            disabled={isLoading}
                            className="text-xs h-7"
                          >
                            Abs. non justifié
                          </Button>
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })}

              {filteredMembers.length === 0 && (
                <div className="text-center py-8 text-slate-400">
                  <Search className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="font-medium">Aucun élève trouvé</p>
                  <p className="text-sm mt-1">Essayez avec un autre terme de recherche</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Onglet Transfert */}
          {siblingGroup && (
            <TabsContent value="transfer" className="mt-4">
              <div className="mb-3 p-2 bg-amber-50 border border-amber-200 rounded-md">
                <div className="flex items-center gap-2 mb-1">
                  <ArrowRightLeft className="h-4 w-4 text-amber-600" />
                  <p className="text-sm font-medium text-amber-800">
                    Transfert {siblingGroup} → {selectedGroup}
                  </p>
                </div>
                <p className="text-xs text-amber-600">
                  Élèves du {siblingGroup} (non inscrits en {selectedGroup})
                </p>
              </div>
              
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {filteredMembers.map(member => {
                  const present = isPresentToday(member);
                  const groups = getMemberAllGroups(member);

                  return (
                    <Card key={member.id} className="p-3 border-amber-200 border-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium">
                            {capitalize(member.firstName)} {capitalize(member.lastName)}
                          </div>
                          <div className="flex gap-1 mt-1">
                            {groups.map(g => (
                              <Badge key={g} variant="outline" className="text-xs">
                                {g}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        
                        <Button
                          size="sm"
                          onClick={() => onMarkAttendance(member.id, currentDate, 'present', selectedGroup)}
                          disabled={present}
                        >
                          <ArrowRightLeft className="h-4 w-4 mr-1" />
                          Transférer
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>
          )}
          
          {/* Onglet Weekend */}
          {(selectedGroup === 'Samedi' || selectedGroup === 'Dimanche' || selectedGroup === 'Samedi+Dimanche') && (
            <TabsContent value="weekend" className="mt-4">
              <div className="mb-3 p-2 bg-purple-50 border border-purple-200 rounded-md">
                <p className="text-sm font-medium text-purple-800 mb-1">
                  Autres élèves du weekend
                </p>
                <p className="text-xs text-purple-600">
                  Samedi, Dimanche et Samedi+Dimanche (sauf ceux déjà dans {selectedGroup})
                </p>
              </div>
              
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {filteredMembers.map(member => {
                  const present = isPresentToday(member);
                  const groups = getMemberAllGroups(member);

                  return (
                    <Card key={member.id} className="p-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium">
                            {capitalize(member.firstName)} {capitalize(member.lastName)}
                          </div>
                          <div className="flex gap-1 mt-1">
                            {groups.map(g => (
                              <Badge key={g} variant="outline" className="text-xs">
                                {g}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        
                        <Button
                          size="sm"
                          onClick={() => onMarkAttendance(member.id, currentDate, 'present', selectedGroup)}
                          disabled={present}
                        >
                          <UserPlus className="h-4 w-4 mr-1" />
                          Ajouter
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>
          )}
          
          {/* Onglet Tous */}
          <TabsContent value="all" className="mt-4">
            <div className="mb-3 p-2 bg-slate-50 border border-slate-200 rounded-md">
              <p className="text-sm font-medium text-slate-800 mb-1">
                Tous les élèves
              </p>
              <p className="text-xs text-slate-600">
                Recherche complète dans toute la base de données
              </p>
            </div>
            
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {filteredMembers.map(member => {
                const present = isPresentToday(member);
                const groups = getMemberAllGroups(member);

                return (
                  <Card key={member.id} className="p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium">
                          {capitalize(member.firstName)} {capitalize(member.lastName)}
                        </div>
                        <div className="flex gap-1 mt-1">
                          {groups.map(g => (
                            <Badge key={g} variant="outline" className="text-xs">
                              {g}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <Button
                        size="sm"
                        onClick={() => onMarkAttendance(member.id, currentDate, 'present', selectedGroup)}
                        disabled={present}
                      >
                        <UserPlus className="h-4 w-4 mr-1" />
                        Ajouter
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>

        {filteredMembers.length === 0 && (
          <div className="text-center py-8 text-slate-400">
            <Search className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">Aucun élève trouvé</p>
            <p className="text-sm mt-1">Essayez avec un autre terme de recherche</p>
          </div>
        )}
      </Card>
    </div>
  );
}