// pages/DashboardPage/DashboardPage.tsx

import { useState, useEffect, useCallback, useMemo, Suspense } from "react";
import { lazyImport } from "@/utils/lazyImport";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, BarChart3, Users, ShieldOff, Calendar, Settings, RefreshCw } from "lucide-react";

// Hooks personnalisés
import { useAuthState } from "./hooks/useAuthState";
import { useDashboardTabs } from "./hooks/useDashboardTabs";
import { useDashboardData } from "./hooks/useDashboardData";
import { useProfessorHours } from '@/hooks/useProfessorHours';

// Composants
import { HeroSection } from "./components/HeroSection";
import { DashboardTab } from "./components/DashboardTab";
import { MembersTab } from "./components/MembersTab";
import { AttendanceTab } from "./components/AttendanceTab";
import { AdminTab } from "./components/AdminTab";
import { SessionReminderModal } from '@/components/professor/SessionReminderModal';
import { SessionsTable } from '@/components/professor/SessionsTable';
import { ProfessorButton } from '@/components/professor/ProfessorButton';

// Utilitaires
import { DAYS_FR, MONTHS_FR } from "./utils/constants";

// Composants externes
import { AppHeader } from "@/components/shared";
import { ErrorBoundary } from "@/components/ErrorBoundary";

// Imports lazy
const LazyMonthlyReportModal = lazyImport(
  () => import("@/components/reports/MonthlyReportModal")
);

// Import Supabase
import { supabase } from '@/lib/supabase';

// Types
import type { SessionType } from "@/types/session";

const DashboardPage = () => {
  // États
  const [selectedGroup, setSelectedGroup] = useState<SessionType>(() => {
    const today = new Date().getDay();
    if (today === 6) return "Samedi";
    if (today === 0) return "Dimanche";
    if (today === 1) return "Lundi";
    return "Samedi";
  });
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [shareMode, setShareMode] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [transferHistory, setTransferHistory] = useState<any[]>([]);
  const [activeTransfers, setActiveTransfers] = useState<
    { memberId: string; fromGroup: SessionType; toGroup: SessionType; date: string }[]
  >([]);

const [showProfessorReminder, setShowProfessorReminder] = useState(false);

  // Hooks personnalisés
  const { user } = useAuthState();
  const isAdmin = true;

  const { activeTab, handleTabChange } = useDashboardTabs();
  // Ajouter après useDashboardData
const { saveSession: saveProfessorSession } = useProfessorHours();
  const {
    members,
    loading,
    searchTerms,
    searchInput,
    historicalEditMode,
    setSearchTerms,
    setSearchInput,
    setHistoricalEditMode,
    loadMembers,
    handleAddMember,
    handleDeleteMember,
    handleUpdateMember,
    handleAddGroupToMember,
    handleRemoveGroupFromMember,
    handleMarkPresentWithSync,
    handleMarkPayment,
    handleUnmarkPayment,
    handleAddGroupToExistingMember,
    handleTransferAttendance,
    handleAutoTransferAbsent,
    handleRestoreMember,
    archivedMembers,
    loadingArchived,
    loadArchivedMembers,
  } = useDashboardData(user, shareMode);

  // Chargement initial
  useEffect(() => {
    if (user && members.length === 0) {
      const timer = setTimeout(() => {
        loadMembers();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [user, loadMembers, members.length]);

// Rappel automatique pour les heures professeur (18h25-18h35)
useEffect(() => {
  const checkSessionEnd = () => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    
    // Vérifier entre 18:25 et 18:35
    if ((hours === 18 && minutes >= 25) || (hours === 18 && minutes <= 35)) {
      const lastNotified = localStorage.getItem('last_professor_notification_date');
      const today = new Date().toISOString().split('T')[0];
      
      if (lastNotified !== today) {
        setShowProfessorReminder(true);
        localStorage.setItem('last_professor_notification_date', today);
      }
    }
  };

  const interval = setInterval(checkSessionEnd, 60000);
  return () => clearInterval(interval);
}, []);
  // Utilitaires de date
  const formatFrenchDateSimple = useCallback((date: Date): string => {
    return `${DAYS_FR[date.getDay()]} ${date.getDate()} ${
      MONTHS_FR[date.getMonth()]
    } ${date.getFullYear()}`;
  }, []);

  const getNextSessionDate = useCallback(
    (group: SessionType): { date: Date; displayText: string } => {
      const today = new Date();
      const todayDay = today.getDay();

      let targetDay: number;
      switch (group) {
        case "Lundi":
          targetDay = 1;
          break;
        case "Samedi":
          targetDay = 6;
          break;
        case "Dimanche":
          targetDay = 0;
          break;
        case "Samedi+Dimanche":
          targetDay = 6;
          break;
        default:
          targetDay = 6;
      }

      const daysUntilTarget = (targetDay - todayDay + 7) % 7;
      const nextSessionDate = new Date(today);
      nextSessionDate.setDate(
        today.getDate() + (daysUntilTarget === 0 ? 7 : daysUntilTarget)
      );

      let displayText: string;
      if (daysUntilTarget === 0) {
        displayText = "Aujourd'hui";
      } else {
        displayText = formatFrenchDateSimple(nextSessionDate);
      }

      return {
        date: nextSessionDate,
        displayText,
      };
    },
    [formatFrenchDateSimple]
  );

  const isNextSessionToday = useCallback((group: SessionType): boolean => {
    const today = new Date().getDay();
    if (group === "Lundi" && today === 1) return true;
    if (group === "Samedi" && today === 6) return true;
    if (group === "Dimanche" && today === 0) return true;
    if (group === "Samedi+Dimanche" && (today === 6 || today === 0))
      return true;
    return false;
  }, []);

  // Calculs mémoïsés
  const sessionMembers = useMemo(() => {
    if (members.length === 0) return [];

    const today = new Date().getDay();
    const isClassDay = today === 6 || today === 0 || today === 1;

    // Si on est sur l'onglet Élèves et pas un jour de cours → tous les membres
    if (activeTab === "members" && !isClassDay) {
      return members;
    }

    if (selectedGroup === "Samedi+Dimanche") {
      return members.filter(
        (member) =>
          member.group === "Samedi" ||
          member.group === "Dimanche" ||
          (member.secondaryGroups &&
            (member.secondaryGroups.includes("Samedi") ||
              member.secondaryGroups.includes("Dimanche")))
      );
    }

    return members.filter(
      (member) =>
        member.group === selectedGroup ||
        (member.secondaryGroups && member.secondaryGroups.includes(selectedGroup))
    );
  }, [members, selectedGroup, activeTab]);

  // Filtrage par recherche (utilisé par tous les onglets)
  const filteredMembers = useMemo(() => {
    if (sessionMembers.length === 0) return [];

    let filtered = sessionMembers;

    if (searchTerms.length > 0) {
      const lowerSearchTerms = searchTerms.map((term) => term.toLowerCase());

      filtered = filtered.filter((member) =>
        lowerSearchTerms.some((term) => {
          return (
            member.firstName.toLowerCase().includes(term) ||
            member.lastName.toLowerCase().includes(term) ||
            (member.city && member.city.toLowerCase().includes(term)) ||
            `${member.firstName} ${member.lastName}`
              .toLowerCase()
              .includes(term)
          );
        })
      );
    }

    return filtered.sort((a, b) => a.lastName.localeCompare(b.lastName));
  }, [sessionMembers, searchTerms]);

  // Label du groupe affiché aujourd'hui pour l'onglet Élèves
  const todayGroupLabel = useMemo(() => {
    const today = new Date().getDay();
    if (today === 6) return "Samedi";
    if (today === 0) return "Dimanche";
    if (today === 1) return "Lundi";
    return "Tous les groupes";
  }, []);

  const currentDateString = selectedDate.toISOString().split("T")[0];

  // Handlers
  const navigateDate = useCallback(
    (direction: "prev" | "next") => {
      const newDate = new Date(selectedDate);
      if (direction === "prev") {
        newDate.setDate(newDate.getDate() - 1);
      } else {
        newDate.setDate(newDate.getDate() + 1);
      }
      setSelectedDate(newDate);
    },
    [selectedDate]
  );

  const handleSignOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const handleViewAllStudents = useCallback(() => {
    handleTabChange("members");
  }, [handleTabChange]);

  const handleExportData = useCallback(() => {
    const csvData =
      "Nom,Prénom,Groupe,Ville,Cotisation à jour\n" +
      members
        .map((m) => {
          const hasPaid = m.payments.some((p) =>
            p.date?.startsWith(new Date().toISOString().slice(0, 7))
          );
          return `${m.lastName},${m.firstName},${m.group},${m.city || ""},${
            hasPaid ? "Oui" : "Non"
          }`;
        })
        .join("\n");

    const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `eleves-institut-${
      new Date().toISOString().split("T")[0]
    }.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [members]);

  const handleMonthlyReport = useCallback(() => {
    setShowReportModal(true);
  }, []);

  const handleHistoricalEditToggle = useCallback((enabled: boolean) => {
    setHistoricalEditMode(enabled);
    console.log(`📝 Mode historique ${enabled ? 'activé' : 'désactivé'}`);
  }, [setHistoricalEditMode]);

const handleSaveProfessorSession = useCallback((session: { startTime: string; endTime: string; actualHours: number; notes: string }) => {
  saveProfessorSession({
    date: new Date().toISOString().split('T')[0],
    ...session
  });
}, [saveProfessorSession]);
  // Écran de connexion
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50/20">
      <ErrorBoundary>
      <div className="flex items-center justify-between">
  <AppHeader
    user={user}
    shareMode={shareMode}
    onShareModeChange={setShareMode}
    onSignOut={handleSignOut}
  />
  <ProfessorButton variant="outline" size="sm" className="ml-4" />
</div>
      </ErrorBoundary>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <div className="flex items-center text-sm text-slate-500 bg-white/50 backdrop-blur-sm rounded-lg px-4 py-2 border border-slate-200/50">
          <span className="font-medium text-slate-700">Institut</span>
          <ChevronRight className="h-3 w-3 mx-2 text-slate-400" />
          <span className="capitalize font-medium text-blue-600">
            {activeTab === 'dashboard' ? 'Tableau de bord' : 
             activeTab === 'members' ? 'Élèves' : 
             activeTab === 'attendance' ? 'Présences' : 
             activeTab === 'admin' ? 'Administration' : ''}
          </span>
          {activeTab === 'members' ? (
            <>
              <ChevronRight className="h-3 w-3 mx-2 text-slate-400" />
              <Badge variant="outline" className="text-xs">
                {todayGroupLabel}
              </Badge>
            </>
          ) : (
            selectedGroup !== 'Samedi' && activeTab !== 'admin' && (
              <>
                <ChevronRight className="h-3 w-3 mx-2 text-slate-400" />
                <Badge variant="outline" className="text-xs">
                  {selectedGroup}
                </Badge>
              </>
            )
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-20">
        <HeroSection
          selectedDate={selectedDate}
          selectedGroup={selectedGroup}
          loading={loading}
          filteredMembersCount={filteredMembers.length}
          onDateChange={navigateDate}
          onGroupChange={setSelectedGroup}
          getNextSessionDate={getNextSessionDate}
          isNextSessionToday={isNextSessionToday}
        />

        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
          className="space-y-4 sm:space-y-6"
        >
          <TabsList className="grid grid-cols-4 w-full h-16 bg-white/95 backdrop-blur-xl rounded-3xl border border-black/10 shadow-2xl p-3 gap-3">
            {/* Tab Tableau de bord */}
            <TabsTrigger
              value="dashboard"
              className="relative rounded-2xl font-geist-bold text-slate-700 data-[state=active]:text-white transition-all"
            >
              {activeTab === "dashboard" && (
                <motion.div
                  layoutId="activeTabPill"
                  className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl border-2 border-black shadow-lg"
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                />
              )}
              <div className="relative z-10 flex items-center justify-center gap-3">
                <BarChart3 className="h-5 w-5" />
                <span className="hidden sm:inline">Tableau de bord</span>
                <span className="sm:hidden">Dashboard</span>
              </div>
            </TabsTrigger>

            {/* Tab Élèves */}
            <TabsTrigger
              value="members"
              disabled={shareMode}
              className="relative rounded-2xl font-geist-bold text-slate-700 data-[state=active]:text-white data-[disabled]:opacity-50 transition-all"
            >
              {activeTab === "members" && (
                <motion.div
                  layoutId="activeTabPill"
                  className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl border-2 border-black shadow-lg"
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                />
              )}
              <div className="relative z-10 flex items-center justify-center gap-3">
                <Users className="h-5 w-5" />
                <span>Élèves</span>
                {shareMode && (
                  <ShieldOff className="h-4 w-4 ml-1 text-orange-500" />
                )}
              </div>
            </TabsTrigger>

            {/* Tab Présences */}
            <TabsTrigger
              value="attendance"
              className="relative rounded-2xl font-geist-bold text-slate-700 data-[state=active]:text-white transition-all"
            >
              {activeTab === "attendance" && (
                <motion.div
                  layoutId="activeTabPill"
                  className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl border-2 border-black shadow-lg"
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                />
              )}
              <div className="relative z-10 flex items-center justify-center gap-3">
                <Calendar className="h-5 w-5" />
                <span>Présences</span>
              </div>
            </TabsTrigger>

            {/* Tab Administration */}
            <TabsTrigger
              value="admin"
              disabled={shareMode}
              className="relative rounded-2xl font-geist-bold text-slate-700 data-[state=active]:text-white data-[disabled]:opacity-50 transition-all"
            >
              {activeTab === "admin" && (
                <motion.div
                  layoutId="activeTabPill"
                  className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl border-2 border-black shadow-lg"
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                />
              )}
              <div className="relative z-10 flex items-center justify-center gap-3">
                <Settings className="h-5 w-5" />
                <span className="hidden sm:inline">Admin</span>
                <span className="sm:hidden">Admin</span>
                {shareMode && (
                  <ShieldOff className="h-4 w-4 ml-1 text-orange-500" />
                )}
              </div>
            </TabsTrigger>
          </TabsList>

          {/* Tab Dashboard */}
          <TabsContent value="dashboard" className="mt-8">
            <DashboardTab
              loading={loading}
              sessionMembers={sessionMembers}
              selectedGroup={selectedGroup}
              filteredMembersCount={filteredMembers.length}
              getNextSessionDate={getNextSessionDate}
              isNextSessionToday={isNextSessionToday}
              onViewAllStudents={handleViewAllStudents}
              onExportData={handleExportData}
              onMonthlyReport={handleMonthlyReport}
            />
          </TabsContent>

          {/* Tab Members */}
          <TabsContent value="members" className="mt-8">
            <MembersTab
              shareMode={shareMode}
              selectedGroup={todayGroupLabel}
              loading={loading}
              members={filteredMembers}
              searchTerms={searchTerms}
              searchInput={searchInput}
              filteredMembers={filteredMembers}
              onShareModeChange={setShareMode}
              onAddMember={handleAddMember}
              onDeleteMember={(memberId) => handleDeleteMember(memberId)}
              onUpdateMember={handleUpdateMember}
              onAddGroupToMember={handleAddGroupToMember}
              onRemoveGroupFromMember={handleRemoveGroupFromMember}
              onAddGroupToExistingMember={handleAddGroupToExistingMember}
              setSearchTerms={setSearchTerms}
              setSearchInput={setSearchInput}
            />
          </TabsContent>

          {/* Tab Attendance */}
{/* Tab Attendance */}
<TabsContent value="attendance" className="mt-8">
  <AttendanceTab
    filteredMembers={filteredMembers}
    selectedGroup={selectedGroup}
    currentDateString={currentDateString}
    selectedDate={selectedDate}
    onDateChange={(date: Date) => setSelectedDate(date)}
    onMarkPresent={handleMarkPresentWithSync}
    onMarkPayment={(memberId) => handleMarkPayment(memberId)}
    onUnmarkPayment={(memberId) => handleUnmarkPayment(memberId)}
    shareMode={shareMode}
    historicalEditMode={historicalEditMode}
    onHistoricalEditToggle={handleHistoricalEditToggle}
    members={members}
    loading={loading}
    onTransferAttendance={handleTransferAttendance}
    onAutoTransferAbsent={handleAutoTransferAbsent}
    // <-- Ajout requis pour la gestion des transferts persistants
    activeTransfers={activeTransfers}
    onActiveTransfersChange={setActiveTransfers}
  />
</TabsContent>

          {/* Tab Admin */}
          <TabsContent value="admin" className="mt-8">
  <div className="space-y-6">
    <AdminTab
      user={user}
      shareMode={shareMode}
      members={members}
      onRestoreMember={handleRestoreMember}
      archivedMembers={archivedMembers}
      loadingArchived={loadingArchived}
      onLoadArchived={loadArchivedMembers}
    />
    <SessionsTable />
  </div>
</TabsContent>
                </Tabs>
              </div>

      {showReportModal && (
        <Suspense fallback={null}>
          <LazyMonthlyReportModal
            members={members}
            open={showReportModal}
            onOpenChange={(open: boolean) => {
              setShowReportModal(open);
            }}
          />
        </Suspense>
      )}
      <SessionReminderModal
        isOpen={showProfessorReminder}
        onClose={() => setShowProfessorReminder(false)}
        onSave={handleSaveProfessorSession}
        defaultStartTime="16:30"
        defaultEndTime="18:30"
      />
    </div>
  );
};

export default DashboardPage;