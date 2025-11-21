// Path: src/pages/DashboardPage.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";

// Import des composants existants
import MembersTable from "@/components/MembersTable";
import MemberForm from "@/components/MemberForm";
import WeekendCalendar from "@/components/WeekendCalendar";
import { SessionManager } from "@/components/attendance/SessionManager";
import { formatLocalDate } from "@/utils/dateUtils";

// Import des nouveaux composants modulaires
import { AppHeader } from "@/components/shared";
import { DateGroupSelector } from "@/components/shared";
import { AttendanceStats } from "@/components/attendance";
import { MembersManagementTable } from "@/components/members";
import { supabase } from "@/integrations/supabase/client";
import type { GroupType, AttendanceStatus, Member } from "@/types/member";
import type { SessionType } from "@/types/session";
import {
  Zap,
  Download,
  BarChart3,
  Users,
  ShieldOff,
  Calendar,
  CheckCircle,
  TrendingUp,
  CreditCard,
} from "lucide-react";

const DashboardPage = () => {
  const navigate = useNavigate();

  // ============================================
  // ÉTATS DE L'APPLICATION
  // ============================================
  const [user, setUser] = useState<any>(null);
  const [selectedGroup, setSelectedGroup] = useState<SessionType>("Samedi");
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [shareMode, setShareMode] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState("dashboard");

  // États pour les filtres des membres
  const [searchTerms, setSearchTerms] = useState<string[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [filterGroup, setFilterGroup] = useState("");
  const [filterCity, setFilterCity] = useState("");
  const [sortBy, setSortBy] = useState("name_asc");

  // ============================================
  // GESTION DE L'AUTHENTIFICATION
  // ============================================
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
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

  // ============================================
  // CHARGEMENT DES DONNÉES
  // ============================================
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

      const transformedMembers: Member[] = (membersData || []).map(
        (member) => ({
          id: member.id,
          firstName: member.first_name,
          lastName: member.last_name,
          city: member.city,
          group: member.group_type,
          payments: (paymentsData || [])
            .filter((p) => p.member_id === member.id)
            .map((p) => ({
              id: p.id,
              date: p.payment_date,
              amount: p.amount,
            })),
          attendances: (attendancesData || [])
            .filter((a) => a.member_id === member.id)
            .map((a) => ({
              id: a.id,
              date: a.date,
              status: a.status as AttendanceStatus,
            })),
        })
      );

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

  // ============================================
  // FONCTIONS DE GESTION DES MEMBRES
  // ============================================
  const handleAddMember = async (
    firstName: string,
    lastName: string,
    city: string,
    group: GroupType
  ) => {
    try {
      const { data, error } = await supabase
        .from("members")
        .insert({
          first_name: firstName,
          last_name: lastName,
          city,
          group_type: group,
          created_by: user.id,
        })
        .select();

      if (error) throw error;

      if (data && data[0]) {
        const newMember: Member = {
          id: data[0].id,
          firstName: data[0].first_name,
          lastName: data[0].last_name,
          city: data[0].city,
          group: data[0].group_type,
          payments: [],
          attendances: [],
        };

        setMembers((prev) => [...prev, newMember]);
      }
    } catch (error) {
      console.error("❌ Erreur ajout membre:", error);
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
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
    } catch (error) {
      console.error("❌ Erreur suppression:", error);
    }
  };

  const handleUpdateMember = async (
    memberId: string,
    updates: Partial<Member>
  ) => {
    try {
      const supabaseUpdates: any = {};
      if (updates.firstName) supabaseUpdates.first_name = updates.firstName;
      if (updates.lastName) supabaseUpdates.last_name = updates.lastName;
      if (updates.city !== undefined) supabaseUpdates.city = updates.city;
      if (updates.group) supabaseUpdates.group_type = updates.group;

      const { error } = await supabase
        .from("members")
        .update(supabaseUpdates)
        .eq("id", memberId);

      if (error) throw error;

      setMembers((prev) =>
        prev.map((member) =>
          member.id === memberId ? { ...member, ...updates } : member
        )
      );
    } catch (error) {
      console.error("❌ Erreur modification:", error);
    }
  };

  // ============================================
  // FONCTIONS DE GESTION DES PRÉSENCES
  // ============================================
  const handleMarkPresent = async (
    memberId: string,
    date: string,
    status: AttendanceStatus
  ) => {
    try {
      const { data: existingAttendance, error: checkError } = await supabase
        .from("attendances")
        .select("*")
        .eq("member_id", memberId)
        .eq("date", date)
        .single();

      if (checkError && checkError.code !== "PGRST116") {
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

  // ============================================
  // FONCTIONS DE GESTION DES PAIEMENTS
  // ============================================
  const handleMarkPayment = async (memberId: string) => {
    if (shareMode) {
      console.log("🚫 Paiement bloqué - Mode partage activé");
      return;
    }

    try {
      const now = new Date();
      const currentMonth = now.toISOString().slice(0, 7);

      const member = members.find((m) => m.id === memberId);
      if (!member) return;

      const hasPaidThisMonth = member.payments.some(
        (p) => p.date && p.date.startsWith(currentMonth)
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

      const member = members.find((m) => m.id === memberId);
      if (!member) return;

      const currentMonthPayment = member.payments.find(
        (p) => p.date && p.date.startsWith(currentMonth)
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

  // ============================================
  // FONCTIONS UTILITAIRES
  // ============================================
  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const navigateDate = (direction: "prev" | "next") => {
    const newDate = new Date(selectedDate);
    if (direction === "prev") {
      newDate.setDate(newDate.getDate() - 1);
    } else {
      newDate.setDate(newDate.getDate() + 1);
    }
    setSelectedDate(newDate);
  };

  const getMembersForSession = (session: SessionType): Member[] => {
    if (session === "Samedi+Dimanche") {
      return members.filter(
        (member) => member.group === "Samedi" || member.group === "Dimanche"
      );
    }
    return members.filter((member) => member.group === session);
  };

  // REMPLACEZ la fonction getFilteredAndSortedMembers par :
  const getFilteredAndSortedMembers = () => {
    let filtered = getMembersForSession(selectedGroup);

    // Filtrage par termes de recherche
    if (searchTerms.length > 0) {
      filtered = filtered.filter((member) =>
        searchTerms.some((term) => {
          const searchTerm = term.toLowerCase();
          return (
            member.firstName.toLowerCase().includes(searchTerm) ||
            member.lastName.toLowerCase().includes(searchTerm) ||
            (member.city && member.city.toLowerCase().includes(searchTerm)) ||
            `${member.firstName} ${member.lastName}`
              .toLowerCase()
              .includes(searchTerm)
          );
        })
      );
    }

    return filtered.sort((a, b) => a.lastName.localeCompare(b.lastName));
  };
  // Fonctions utilitaires pour les statistiques
  const calculateMonthlyPresenceRate = (group: SessionType) => {
    const groupMembers = getMembersForSession(group);
    const currentMonth = new Date().toISOString().slice(0, 7);

    const monthlyAttendances = groupMembers.flatMap((m) =>
      m.attendances.filter((a) => a.date?.startsWith(currentMonth))
    );
    const presentAttendances = monthlyAttendances.filter(
      (a) => a.status === "present"
    );

    const rate =
      monthlyAttendances.length > 0
        ? Math.round(
            (presentAttendances.length / monthlyAttendances.length) * 100
          )
        : 0;

    return rate;
  };

  const calculatePaymentRate = (group: SessionType) => {
    const groupMembers = getMembersForSession(group);
    const currentMonth = new Date().toISOString().slice(0, 7);

    const monthlyPayments = groupMembers.flatMap((m) =>
      m.payments.filter((p) => p.date?.startsWith(currentMonth))
    );

    const rate =
      groupMembers.length > 0
        ? Math.round((monthlyPayments.length / groupMembers.length) * 100)
        : 0;

    return rate;
  };
  // ============================================
  // VARIABLES CALCULÉES
  // ============================================
  const filteredMembers = getFilteredAndSortedMembers();
  const currentDateString = selectedDate.toISOString().split("T")[0];
  const sessionMembers = getMembersForSession(selectedGroup);

  // ============================================
  // RENDU - ÉCRAN DE CONNEXION
  // ============================================
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
              onClick={() => (window.location.href = "/auth")}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Se connecter
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ============================================
  // RENDU PRINCIPAL
  // ============================================
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
      {/* En-tête de l'application */}
      <AppHeader
        user={user}
        shareMode={shareMode}
        onShareModeChange={setShareMode}
        onSignOut={handleSignOut}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Sélecteur de date et groupe */}
        <DateGroupSelector
          selectedDate={selectedDate}
          selectedGroup={
            selectedGroup === "Samedi+Dimanche" ? "Samedi" : selectedGroup
          }
          onDateChange={navigateDate}
          onGroupChange={setSelectedGroup}
        />

        {/* Système d'onglets principal */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-4 sm:space-y-6"
        >
          {/* Liste des onglets avec contour noir */}

          <TabsList className="h-12 items-center justify-center text-muted-foreground grid w-full grid-cols-3 bg-slate-100 p-1 rounded-xl text-sm border border-slate-700 gap-1">
            <TabsTrigger
              value="dashboard"
              className="flex items-center justify-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:border-2 data-[state=active]:border-black py-2 transition-colors h-full rounded-lg hover:bg-slate-200 border border-transparent"
            >
              <BarChart3 className="h-4 w-4" />
              <span className="hidden xs:inline">Tableau de Bord</span>
              <span className="xs:hidden">Dashboard</span>
            </TabsTrigger>

            <TabsTrigger
              value="members"
              className="flex items-center justify-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:border-2 data-[state=active]:border-black py-2 transition-colors h-full rounded-lg hover:bg-slate-200 border border-transparent"
              disabled={shareMode}
            >
              <Users className="h-4 w-4" />
              <span>Elèves</span>
              {shareMode && (
                <ShieldOff className="h-3 w-3 ml-1 text-orange-500" />
              )}
            </TabsTrigger>

            <TabsTrigger
              value="attendance"
              className="flex items-center justify-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:border-2 data-[state=active]:border-black py-2 transition-colors h-full rounded-lg hover:bg-slate-200 border border-transparent"
            >
              <Calendar className="h-4 w-4" />
              <span>Présences</span>
            </TabsTrigger>
          </TabsList>

          {/* ============================================ */}
          {/* TAB 1: TABLEAU DE BORD */}
          {/* ============================================ */}
          <TabsContent value="dashboard" className="space-y-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-slate-600">Chargement des données...</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Ligne 1 : Cartes principales côte à côte */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Carte Résumé du groupe */}
                  <Card className="border-slate-200 shadow-sm bg-gradient-to-br from-blue-50 to-indigo-50">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Users className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-900">
                            Groupe {selectedGroup}
                          </h3>
                          <p className="text-sm text-slate-600">
                            {filteredMembers.length} élèves inscrits
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-slate-900">
                            {filteredMembers.length}
                          </div>
                          <div className="text-xs text-slate-600">
                            Élèves total
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">
                            {
                              filteredMembers.filter((m) =>
                                m.payments.some((p) =>
                                  p.date?.startsWith(
                                    new Date().toISOString().slice(0, 7)
                                  )
                                )
                              ).length
                            }
                          </div>
                          <div className="text-xs text-slate-600">
                            Cotisations
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Carte Prochaine séance */}
                  <Card className="border-slate-200 shadow-sm bg-gradient-to-br from-green-50 to-emerald-50">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <Calendar className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-900">
                            Prochaine séance
                          </h3>
                          <p className="text-sm text-slate-600">À venir</p>
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-slate-900 mb-2">
                          {selectedGroup === "Samedi" ? "Samedi" : "Dimanche"}{" "}
                          prochain
                        </div>
                        <div className="text-sm text-slate-600">
                          {filteredMembers.length} élèves attendus
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Ligne 2 : Statistiques de performance */}
                <AttendanceStats
                  members={sessionMembers}
                  selectedGroup={selectedGroup}
                />

                {/* Ligne 3 : Calendrier et actions rapides */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                    <WeekendCalendar
                      members={sessionMembers}
                      selectedGroup={selectedGroup}
                      onMarkPresent={handleMarkPresent}
                      isAdmin={true}
                    />
                  </div>

                  {/* Carte Actions rapides */}
                  <Card className="border-slate-200 shadow-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Zap className="h-5 w-5 text-orange-500" />
                        Actions rapides
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Button
                        className="w-full justify-start"
                        variant="outline"
                      >
                        <Users className="h-4 w-4 mr-2" />
                        Voir tous les élèves
                      </Button>
                      <Button
                        className="w-full justify-start"
                        variant="outline"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Exporter les données
                      </Button>
                      <Button
                        className="w-full justify-start"
                        variant="outline"
                      >
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Rapport mensuel
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </TabsContent>
          {/* ============================================ */}
          {/* TAB 2: GESTION DES MEMBRES */}
          {/* ============================================ */}
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
                {/* Liste des membres avec recherche par tag uniquement */}
                <Card>
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
                          {filteredMembers.length} membre
                          {filteredMembers.length > 1 ? "s" : ""}
                        </Badge>
                      </div>
                    </CardTitle>
                    <CardDescription>
                      Administration complète des élèves
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {/* Recherche par tags avec style amélioré */}
                    <div className="mb-6">
                      <Label
                        htmlFor="tag-search"
                        className="text-sm font-medium text-slate-700 mb-2 block"
                      >
                        🔍 Rechercher un élève
                      </Label>

                      {/* Container principal */}
                      <div className="border border-slate-300 rounded-lg bg-white p-3 shadow-sm hover:shadow-md transition-shadow">
                        {/* Ligne des tags + input */}
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          {/* Tags */}
                          {searchTerms.map((term, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-1 bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium shadow-sm"
                            >
                              <span>{term}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  setSearchTerms((prev) =>
                                    prev.filter((_, i) => i !== index)
                                  );
                                }}
                                className="ml-1 hover:text-blue-200 text-xs font-bold transition-colors"
                                title="Supprimer ce terme"
                              >
                                ×
                              </button>
                            </div>
                          ))}

                          {/* Input */}
                          <input
                            id="tag-search"
                            value={searchInput}
                            placeholder={
                              searchTerms.length === 0
                                ? "Nom, prénom, ville..."
                                : "Ajouter un autre terme..."
                            }
                            onChange={(e) => setSearchInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && searchInput.trim()) {
                                e.preventDefault();
                                const newTerm = searchInput.trim();
                                if (newTerm && !searchTerms.includes(newTerm)) {
                                  setSearchTerms((prev) => [...prev, newTerm]);
                                }
                                setSearchInput("");
                              }
                              if (
                                e.key === "Backspace" &&
                                searchInput === "" &&
                                searchTerms.length > 0
                              ) {
                                setSearchTerms((prev) => prev.slice(0, -1));
                              }
                            }}
                            className="flex-1 min-w-[150px] outline-none bg-transparent text-slate-700 placeholder-slate-400"
                          />
                        </div>

                        {/* Instructions et actions */}
                        <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                          <div className="text-xs text-slate-500">
                            {searchTerms.length === 0 ? (
                              "Tapez un terme et appuyez sur Entrée pour l'ajouter"
                            ) : (
                              <span className="text-green-600 font-medium">
                                {filteredMembers.length} résultat(s) trouvé(s)
                              </span>
                            )}
                          </div>

                          {searchTerms.length > 0 && (
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setSearchTerms((prev) => prev.slice(0, -1));
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

                    <div className="border rounded-lg overflow-hidden mt-4">
                      {loading ? (
                        <div className="text-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                          <p className="text-slate-600">
                            Chargement des membres...
                          </p>
                        </div>
                      ) : (
                        <MembersManagementTable
                          members={filteredMembers}
                          onDeleteMember={handleDeleteMember}
                          onUpdateMember={handleUpdateMember}
                          shareMode={shareMode}
                        />
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Formulaire d'ajout de membre */}
                <Card>
                  <CardContent>
                    <MemberForm onAddMember={handleAddMember} />
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* ============================================ */}
          {/* TAB 3: GESTION DES PRÉSENCES */}
          {/* ============================================ */}
          <TabsContent value="attendance" className="space-y-6">
            {/* Ligne 1 : Cartes de statistiques côte à côte */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Carte Séance du jour */}
              <Card className="border border-slate-300 bg-white shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-slate-900">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    Séance du jour
                  </CardTitle>
                  <CardDescription className="text-slate-600">
                    {formatLocalDate(currentDateString)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-100">
                      <div className="flex items-center gap-3">
                        <Users className="h-5 w-5 text-blue-600" />
                        <div>
                          <p className="text-sm font-medium text-blue-900">
                            Groupe actif
                          </p>
                          <p className="text-xs text-blue-700">
                            {selectedGroup}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="bg-white">
                        {getMembersForSession(selectedGroup).length} élèves
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-100">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="text-sm font-medium text-green-900">
                            Présences
                          </p>
                          <p className="text-xs text-green-700">Aujourd'hui</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-green-900">
                          {
                            getMembersForSession(selectedGroup).filter(
                              (member) =>
                                member.attendances.some(
                                  (att) =>
                                    att.date === currentDateString &&
                                    att.status === "present"
                                )
                            ).length
                          }
                        </div>
                        <div className="text-xs text-green-700 font-medium">
                          élèves présents
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Carte Statistiques de présence */}
              <Card className="border border-slate-300 bg-white shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-slate-900">
                    <BarChart3 className="h-5 w-5 text-green-600" />
                    Statistiques du mois
                  </CardTitle>
                  <CardDescription className="text-slate-600">
                    Performance du groupe {selectedGroup}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <TrendingUp className="h-5 w-5 text-blue-600" />
                        <div>
                          <p className="text-sm font-medium text-slate-900">
                            Taux de présence
                          </p>
                          <p className="text-xs text-slate-600">Ce mois-ci</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-blue-900">
                          {calculateMonthlyPresenceRate(selectedGroup)}%
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CreditCard className="h-5 w-5 text-purple-600" />
                        <div>
                          <p className="text-sm font-medium text-slate-900">
                            Cotisations
                          </p>
                          <p className="text-xs text-slate-600">
                            Membres à jour
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-purple-900">
                          {calculatePaymentRate(selectedGroup)}%
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Ligne 2 : Tableau des présences - SANS LE TITRE EN DOUBLON */}
            <Card className="border border-slate-300 shadow-sm">
              <CardContent className="p-0">
                {/* SUPPRIMER LE CardHeader QUI CRÉE LE DOUBLON */}
                <MembersTable
                  members={filteredMembers}
                  selectedGroup={selectedGroup}
                  currentDate={currentDateString}
                  onMarkPresent={handleMarkPresent}
                  onMarkPayment={handleMarkPayment}
                  onUnmarkPayment={handleUnmarkPayment}
                  isAdmin={true}
                  canManageMembers={false}
                  shareMode={shareMode}
                />
              </CardContent>
            </Card>

            {/* Ligne 3 : Navigation des séances */}
            <SessionManager
              members={members}
              selectedGroup={selectedGroup}
              currentDate={currentDateString}
              onMarkPresent={handleMarkPresent}
              onMarkPayment={handleMarkPayment}
              onUnmarkPayment={handleUnmarkPayment}
              onDateChange={(newDate) => {
                // Mettre à jour la date sélectionnée
                setSelectedDate(new Date(newDate));
              }}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default DashboardPage;
