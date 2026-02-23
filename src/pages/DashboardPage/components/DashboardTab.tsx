import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Zap, Download, BarChart3, Users } from "lucide-react";
import { AttendanceStats } from "@/components/attendance";
import { SectionErrorBoundary } from "@/components/ErrorBoundary";
import { SessionInfoCard } from "./HeroSection";
import type { SessionType } from "@/types/session";
import type { Member } from "@/types/member";

interface DashboardTabProps {
  loading: boolean;
  sessionMembers: Member[];
  selectedGroup: SessionType;
  filteredMembersCount: number;
  getNextSessionDate: (group: SessionType) => { date: Date; displayText: string };
  isNextSessionToday: (group: SessionType) => boolean;
  onViewAllStudents: () => void;
  onExportData: () => void;
  onMonthlyReport: () => void;
}

export const DashboardTab = ({
  loading,
  sessionMembers,
  selectedGroup,
  filteredMembersCount,
  getNextSessionDate,
  isNextSessionToday,
  onViewAllStudents,
  onExportData,
  onMonthlyReport,
}: DashboardTabProps) => {
  if (loading) {
    return (
      <div className="flex flex-col items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-indigo-600 mb-4" />
        <p className="text-slate-600 font-geist-medium">
          Chargement des données...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <SessionInfoCard
        selectedGroup={selectedGroup}
        loading={loading}
        filteredMembersCount={filteredMembersCount}
        getNextSessionDate={getNextSessionDate}
        isNextSessionToday={isNextSessionToday}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <SectionErrorBoundary>
          <AttendanceStats
            members={sessionMembers}
            selectedGroup={selectedGroup}
            isLoading={loading}
          />
        </SectionErrorBoundary>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl border border-black/10 shadow-2xl p-8">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-4 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl shadow-xl">
              <Zap className="h-9 w-9 text-white" />
            </div>
            <h3 className="text-3xl font-geist-black text-slate-900">
              Actions rapides
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <Button
              onClick={onViewAllStudents}
              size="lg"
              variant="outline"
              className="justify-start h-16 text-left font-geist-semibold text-lg border-black/10 hover:bg-slate-50"
            >
              <Users className="h-6 w-6 mr-4" />
              Voir tous les élèves
            </Button>

            <Button
              onClick={onExportData}
              size="lg"
              variant="outline"
              className="justify-start h-16 text-left font-geist-semibold text-lg border-black/10 hover:bg-slate-50"
            >
              <Download className="h-6 w-6 mr-4" />
              Exporter les données
            </Button>

            <Button
              onClick={onMonthlyReport}
              size="lg"
              variant="outline"
              className="justify-start h-16 text-left font-geist-semibold text-lg border-black/10 hover:bg-slate-50"
            >
              <BarChart3 className="h-6 w-6 mr-4" />
              Rapport Mensuel
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};