import { motion } from "framer-motion";
import { Calendar, Clock, UserCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DateGroupSelector } from "@/components/shared";
import LazyImage from "@/components/LazyImage";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import SalemImage from "@/public/Salem.webp";
import type { SessionType } from "@/types/session";

interface HeroSectionProps {
  selectedDate: Date;
  selectedGroup: SessionType;
  loading: boolean;
  filteredMembersCount: number;
  onDateChange: (direction: "prev" | "next") => void;
  onGroupChange: (group: SessionType) => void;
  getNextSessionDate: (group: SessionType) => { date: Date; displayText: string };
  isNextSessionToday: (group: SessionType) => boolean;
}

export const HeroSection = ({
  selectedDate,
  selectedGroup,
  onDateChange,
  onGroupChange,
}: HeroSectionProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="mb-10"
    >
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900">
          Suivi des élèves
        </h1>
        <p className="mt-2 text-slate-500">
          Présences • Paiements • Statistiques
        </p>
      </div>

      <DateGroupSelector
        selectedDate={selectedDate}
        selectedGroup={selectedGroup}
        onDateChange={onDateChange}
        onGroupChange={onGroupChange}
      />
    </motion.div>
  );
};

export const SessionInfoCard = ({
  selectedGroup,
  filteredMembersCount,
  loading,
  getNextSessionDate,
  isNextSessionToday,
}: Partial<HeroSectionProps> & {
  selectedGroup: SessionType;
  loading: boolean;
  filteredMembersCount: number;
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-slate-200/70 shadow-sm p-6"
    >
      <div className="flex items-stretch justify-between gap-6">
        <div className="flex items-center gap-4 bg-slate-50 rounded-xl px-6 py-4 flex-1 h-32">
          <Calendar className="h-8 w-8 text-primary flex-shrink-0" />
          <div className="flex flex-col justify-center flex-1">
            <p className="text-sm text-slate-600 font-medium mb-1">
              Prochaine séance
            </p>
            <div className="flex items-center gap-2 mb-1">
              <p className="text-lg font-semibold text-slate-900 leading-tight">
                {getNextSessionDate?.(selectedGroup).displayText}
              </p>
              {isNextSessionToday?.(selectedGroup) && (
                <span className="px-2 py-1 bg-primary text-white text-xs font-semibold rounded-full whitespace-nowrap">
                  Aujourd'hui
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              17h00 – 19h00
            </p>
          </div>
        </div>

        <div className="w-80 h-32 rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-white flex items-center justify-center">
          <ErrorBoundary>
            <LazyImage
              src={SalemImage}
              alt="Équipe"
              className="max-w-full max-h-full object-contain"
              placeholder={
                <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                  <Calendar className="h-12 w-12 text-slate-400" />
                </div>
              }
            />
          </ErrorBoundary>
        </div>

        <div className="flex items-center gap-4 bg-slate-50 rounded-xl px-6 py-4 flex-1 h-32 justify-center">
          <UserCheck className="h-10 w-10 text-primary flex-shrink-0" />
          <div className="flex flex-col items-center text-center">
            <p className="text-3xl font-bold text-slate-900 leading-none">
              {loading ? 0 : filteredMembersCount}
            </p>
            <p className="text-xs text-slate-600 font-medium mt-1">
              élève{filteredMembersCount > 1 ? "s" : ""} attendu
              {filteredMembersCount > 1 ? "s" : ""}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
