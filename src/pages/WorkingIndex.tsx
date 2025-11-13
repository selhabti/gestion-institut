import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// Import des nouveaux composants modulaires
import { AppHeader } from "@/components/shared";
import { DateGroupSelector } from "@/components/shared";
import { AttendanceStats } from "@/components/attendance";
import { AnalyticsCharts } from "@/components/attendance";
import { MembersManagementTable } from "@/components/members";
import { MembersSearchFilters } from "@/components/members";
import { DashboardStats } from "@/components/dashboard";

// Import des composants existants
import MembersTable from "@/components/MembersTable";
import MemberForm from "@/components/MemberForm";
import MonthlyStats from "@/components/MonthlyStats";
import WeekendCalendar from "@/components/WeekendCalendar";

import { supabase } from "@/integrations/supabase/client";
import type { GroupType, AttendanceStatus, Member } from "@/types/member";
import { BarChart3, Users, Calendar, ShieldOff } from "lucide-react";

const WorkingIndex = () => {
  const navigate = useNavigate();
  
  // États de l'application
  const [user, setUser] = useState<any>(null);
  const [selectedGroup, setSelectedGroup] = useState<GroupType>("Samedi");
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [shareMode, setShareMode] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState("dashboard");

  // États pour les filtres des membres
  const [searchTerm, setSearchTerm] = useState("");
  const [filterGroup, setFilterGroup] = useState("");
  const [filterCity, setFilterCity] = useState("");
  const [sortBy, setSortBy] = useState("name_asc");

  // ============================================================================
  // GESTION DE L'AUTHENTIFICATION
  // ============================================================================

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser(session.user);
      } else {
        setUser(null);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // ============================================================================
  // GESTION DES DONNÉES
  // ============================================================================

  const loadMembers = async () => {
    setLoading(true);
    
    try {
      const { data: membersData, error: membersError } = await supabase
        .from("members")
        .select("*")
        .order("created_at", { ascending: true });

      if (membersError) throw membersError;

      const { data: attendancesData, error: attendancesError } = await supabase
        .from("attendances")
        .select("*");

      if (attendancesError) throw attendancesError;

      const { data: paymentsData, error: paymentsError } = await supabase
        .from("payments")
        .select("*");

      if (paymentsError) throw paymentsError;

      const transformedMembers: Member[] = (membersData || []).map(member => ({
        id: member.id,
        firstName: member.first_name,
        lastName: member.last_name,
        city: member.city,
        group: member.group_type,
        payments: (paymentsData || [])
          .filter(p => p.member_id === member.id)
          .map(p => ({
            id: p.id,
            date: p.payment_date,
            amount: p.amount,
          })),
        attendances: (attendancesData || [])
          .filter(a => a.member_id === member.id)
          .map(a => ({
            id: a.id,
            date: a.date,
            status: a.status as AttendanceStatus,
          })),
      }));
      
      setMembers(transformedMembers);
      
    } catch (error) {
      console.error("💥 Erreur de chargement:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    loadMembers();
  }, [user]);

  // ============================================================================
  // FONCTIONS DE GESTION
  // ============================================================================

  const handleAddMember = async (firstName: string, lastName: string, city: string, group: GroupType) => {
    try {
      const { data, error } = await supabase.from("members").insert({
        first_name: firstName,
        last_name: lastName,
        city,
        group_type: group,
        created_by: user.id,
      }).select();

      if (error) throw error;

      if (data && data[0]) {
        const newMember: Member = {
          id: data[0].id,
          firstName: data[0].first_name,
          lastName: data[0].last_name,
          city: data[0].city,
          group: data[0].group_type,
          payments: [],
          attendances: []
        };
        
        setMembers(prev => [...prev, newMember]);
      }
    } catch (error) {
      console.error("❌ Erreur ajout membre:", error);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const handleMarkPresent = async (memberId: string, date: string, status: AttendanceStatus) => {
    try {
      const { data: existingAttendance, error: checkError } = await supabase
        .from("attendances")
        .select("*")
        .eq("member_id", memberId)
        .eq("date", date)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (existingAttendance) {
        if (existingAttendance.status === status) {
          const { error } = await supabase
            .from("attendances")
            .delete()
            .eq("id", existingAttendance.id);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from("attendances")
            .update({ status })
            .eq("id", existingAttendance.id);
          if (error) throw error;
        }
      } else {
        const { error } = await supabase.from("attendances").insert({
          member_id: memberId,
          date,
          status,
          created_by: user.id,
        });
        if (error) throw error;
      }

      await loadMembers();
      
    } catch (error) {
      console.error("❌ Erreur présence:", error);
    }
  };

  const handleMarkPayment = async (memberId: string) => {
    if (shareMode) {
      console.log("🚫 Paiement bloqué - Mode partage activé");
      return;
    }

    try {
      const now = new Date();
      const currentMonth = now.toISOString().slice(0, 7);
      
      const member = members.find(m => m.id === memberId);
      if (!member) return;

      const hasPaidThisMonth = member.payments.some(p => 
        p.date && p.date.startsWith(currentMonth)
      );

      if (hasPaidThisMonth) return;

      const { error } = await supabase.from("payments").insert({
        member_id: memberId,
        amount: 0,
        payment_date: now.toISOString().split("T")[0],
        created_by: user.id,
      });

      if (error) throw error;
      await loadMembers();
    } catch (error) {
      console.error("❌ Erreur paiement:", error);
    }
  };

  const handleUnmarkPayment = async (memberId: string) => {
    if (shareMode) {
      console.log("🚫 Démarquage bloqué - Mode partage activé");
      return;
    }

    try {
      const now = new Date();
      const currentMonth = now.toISOString().slice(0, 7);
      
      const member = members.find(m => m.id === memberId);
      if (!member) return;

      const currentMonthPayment = member.payments.find(p => 
        p.date && p.date.startsWith(currentMonth)
      );

      if (!currentMonthPayment) return;

      const { error } = await supabase
        .from("payments")
        .delete()
        .eq("id", currentMonthPayment.id);

      if (error) throw error;
      await loadMembers();
    } catch (error) {
      console.error("❌ Erreur décochage:", error);
    }
  };

  const handleDeleteMember = async (memberId: string) => {
    if (shareMode) {
      console.log("🚫 Suppression bloquée - Mode partage activé");
      return;
    }

    try {
      const { error } = await supabase
        .from("members")
        .delete()
        .eq("id", memberId);

      if (error) throw error;
      setMembers(prev => prev.filter(m => m.id !== memberId));
    } catch (error) {
      console.error("❌ Erreur suppression:", error);
    }
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    if (direction === 'prev') {
      newDate.setDate(newDate.getDate() - 1);
    } else {
      newDate.setDate(newDate.getDate() + 1);
    }
    setSelectedDate(newDate);
  };

  // ============================================================================
  // FILTRES ET TRI DES MEMBRES
  // ============================================================================

  const getFilteredAndSortedMembers = () => {
    let filtered = members.filter(member => 
      member.group === selectedGroup &&
      (filterGroup === "" || member.group === filterGroup) &&
      (filterCity === "" || member.city === filterCity) &&
      (searchTerm === "" || 
        member.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (member.city && member.city.toLowerCase().includes(searchTerm.toLowerCase())))
    );
  
    // Tri
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name_asc":
          return a.lastName.localeCompare(b.lastName);
        case "name_desc":
          return b.lastName.localeCompare(a.lastName);
        case "recent":
          // Tri par ID (les IDs plus récents sont généralement plus grands)
          return b.id.localeCompare(a.id);
        case "oldest":
          // Tri par ID (les IDs plus anciens sont généralement plus petits)
          return a.id.localeCompare(b.id);
        default:
          return 0;
      }
    });
  
    return filtered;
  };

  // ============================================================================
  // VARIABLES CALCULÉES
  // ============================================================================

  const filteredMembers = getFilteredAndSortedMembers();
  const currentDateString = selectedDate.toISOString().split("T")[0];

  // ============================================================================
  // RENDU PRINCIPAL
  // ============================================================================

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
        <Card className="max-w-md w-full border-blue-200 shadow-xl">
          <CardContent className="pt-6 text-center">
            <div className="text-blue-600 mb-4">
              <div className="text-6xl">🔐</div>
            </div>
            <h2 className="text-xl font-semibold text-blue-800 mb-2">
              Non authentifié
            </h2>
            <Button 
              onClick={() => window.location.href = '/auth'}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Se connecter
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
      
      {/* HEADER PRINCIPAL */}
      <AppHeader 
        user={user} 
        shareMode={shareMode} 
        onShareModeChange={setShareMode}
        onSignOut={handleSignOut}
      />

      {/* CONTENU PRINCIPAL */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        
        {/* Sélecteur de date et groupe */}
        <DateGroupSelector
          selectedDate={selectedDate}
          selectedGroup={selectedGroup}
          onDateChange={navigateDate}
          onGroupChange={setSelectedGroup}
        />

        {/* SYSTEME DE TABS PRINCIPAL */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
          
          {/* Navigation des tabs */}
          <TabsList className="grid w-full grid-cols-3 bg-slate-100 p-1 rounded-lg sm:rounded-xl text-xs sm:text-sm border border-black border-[0.5px] shadow-md">
  <TabsTrigger 
    value="dashboard" 
    className="inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 text-primary-foreground h-9 rounded-md px-3 text-xs sm:text-sm bg-blue-600 hover:bg-blue-700 data-[state=active]:bg-blue-700 data-[state=active]:text-white"
  >
    <BarChart3 className="h-4 w-4" />
    <span className="hidden xs:inline">Tableau de Bord</span>
    <span className="xs:hidden">Dashboard</span>
  </TabsTrigger>
  <TabsTrigger 
    value="members" 
    className="inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 text-primary-foreground h-9 rounded-md px-3 text-xs sm:text-sm bg-blue-600 hover:bg-blue-700 data-[state=active]:bg-blue-700 data-[state=active]:text-white"
    disabled={shareMode}
  >
    <Users className="h-4 w-4" />
    Membres
    {shareMode && <ShieldOff className="h-4 w-4 ml-1 text-orange-500" />}
  </TabsTrigger>
  <TabsTrigger 
    value="attendance" 
    className="inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 text-primary-foreground h-9 rounded-md px-3 text-xs sm:text-sm bg-blue-600 hover:bg-blue-700 data-[state=active]:bg-blue-700 data-[state=active]:text-white"
  >
    <Calendar className="h-4 w-4" />
    Présences
  </TabsTrigger>
</TabsList>

          {/* ================================================================ */}
          {/* TAB 1: TABLEAU DE BORD */}
          {/* ================================================================ */}
          <TabsContent value="dashboard" className="space-y-4 sm:space-y-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-slate-600">Chargement des données...</p>
              </div>
            ) : (
              <>
                {/* Cartes de statistiques */}
                <DashboardStats members={members} selectedGroup={selectedGroup} />

                {/* Contenu du dashboard */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                    <MonthlyStats members={members} selectedGroup={selectedGroup} />
                  </div>
                  <div className="space-y-6">
                    <WeekendCalendar
                      members={members}
                      selectedGroup={selectedGroup}
                      onMarkPresent={handleMarkPresent}
                      isAdmin={true}
                      onDeleteMember={handleDeleteMember}
                    />
                  </div>
                </div>
              </>
            )}
          </TabsContent>

          {/* ================================================================ */}
          {/* TAB 2: GESTION DES MEMBRES */}
          {/* ================================================================ */}
          <TabsContent value="members" className="space-y-6">
            {shareMode ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <ShieldOff className="h-16 w-16 mx-auto mb-4 text-orange-500" />
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">
                    Accès restreint
                  </h3>
                  <p className="text-slate-600 mb-4">
                    La gestion des membres n'est pas disponible en mode partage.
                    Désactivez le mode partage pour accéder à cette fonctionnalité.
                  </p>
                  <Button 
                    onClick={() => setShareMode(false)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Désactiver le mode partage
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Tableau des membres avec recherche et filtres */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Gestion des membres - {selectedGroup}</span>
                      <Badge variant="secondary" className="ml-2">
                        {filteredMembers.length} membre{filteredMembers.length > 1 ? 's' : ''}
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      Administration complète des élèves (ajout et suppression uniquement)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {/* Barre de recherche et filtres */}
                    <MembersSearchFilters
                      searchTerm={searchTerm}
                      onSearchChange={setSearchTerm}
                      filterGroup={filterGroup}
                      onFilterGroupChange={setFilterGroup}
                      filterCity={filterCity}
                      onFilterCityChange={setFilterCity}
                      sortBy={sortBy}
                      onSortChange={setSortBy}
                      members={members}
                    />

                    {/* Tableau des membres */}
                    <div className="border rounded-lg overflow-hidden">
                      {loading ? (
                        <div className="text-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                          <p className="text-slate-600">Chargement des membres...</p>
                        </div>
                      ) : (
                        <MembersManagementTable 
                          members={filteredMembers}
                          onDeleteMember={handleDeleteMember}
                          shareMode={shareMode}
                        />
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Formulaire d'ajout de membre */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      Ajouter un nouveau membre
                    </CardTitle>
                    <CardDescription>
                      Inscrire un nouvel élève dans le système
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <MemberForm onAddMember={handleAddMember} />
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* ================================================================ */}
          {/* TAB 3: GESTION DES PRÉSENCES */}
          {/* ================================================================ */}
            {/* ================================================================ */}
{/* TAB 3: GESTION DES PRÉSENCES */}
{/* ================================================================ */}
<TabsContent value="attendance" className="space-y-6">
  {/* Section graphique en haut */}
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <AnalyticsCharts members={members} selectedGroup={selectedGroup} />
  </div>

  {/* Tableau des présences avec contour élégant */}
  <Card className="border-2 border-slate-600 shadow-lg">
    <CardHeader>
      <CardTitle className="flex items-center gap-2 text-lg">
        <Calendar className="h-5 w-5" />
        Marquage des présences - {selectedGroup}
      </CardTitle>
      <CardDescription>
        Pour la date sélectionnée: {selectedDate.toLocaleDateString('fr-FR', { 
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        })}
      </CardDescription>
    </CardHeader>
    <CardContent>
      <MembersTable
        members={filteredMembers}
        selectedGroup={selectedGroup}
        currentDate={currentDateString}
        onMarkPresent={handleMarkPresent}
        onMarkPayment={handleMarkPayment}
        onUnmarkPayment={handleUnmarkPayment}
        isAdmin={true}
        canManageMembers={!shareMode}
        onDeleteMember={handleDeleteMember}
        shareMode={shareMode}
      />
    </CardContent>
  </Card>

  {/* Section inférieure avec Session à venir et Statistiques */}
  

<div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-stretch"> {/* ← items-stretch pour égaliser */}
  <div className="xl:col-span-1 flex"> {/* ← flex pour prendre toute la hauteur */}
    <Card className="flex-1"> {/* ← flex-1 pour s'étendre */}
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Calendar className="h-5 w-5" />
          Session à venir
        </CardTitle>
        <CardDescription>
          Prochaine session du groupe
        </CardDescription>
      </CardHeader>
      <CardContent>
        <WeekendCalendar
          members={members}
          selectedGroup={selectedGroup}
          onMarkPresent={handleMarkPresent}
          isAdmin={true}
          onDeleteMember={handleDeleteMember}
        />
      </CardContent>
    </Card>
  </div>
  <div className="xl:col-span-2 flex"> {/* ← flex pour prendre toute la hauteur */}
    <Card className="flex-1"> {/* ← flex-1 pour s'étendre */}
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <BarChart3 className="h-5 w-5" />
          Statistiques - {selectedGroup}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <MonthlyStats members={members} selectedGroup={selectedGroup} />
      </CardContent>
    </Card>
  </div>
</div>
</TabsContent>


        </Tabs>
      </div>
    </div>
  );
};

export default WorkingIndex;