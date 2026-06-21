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
  loading,
  filteredMembersCount,
  onDateChange,
  onGroupChange,
  getNextSessionDate,
  isNextSessionToday,
}: HeroSectionProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: "easeOut" }}
      className="mb-12"
    >
      <div className="text-center mb-10">
        <h1 className="text-5xl md:text-6xl font-geist-black tracking-tight">
          <span className="bg-gradient-to-r from-primary via-primary/80 to-indigo-600 bg-clip-text text-transparent">
            Suivi des Élèves
          </span>
        </h1>
        <p className="mt-4 text-xl text-muted-foreground font-geist-medium">
          Gestion intelligente • Présences • Paiements • Statistiques
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="
            backdrop-blur-xl 
            bg-white/80 
            border border-black/10 
            shadow-2xl
            rounded-2xl
            overflow-hidden
            mt-6
          "
        >
          <div className="p-6">
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-xl">
                <Calendar className="h-7 w-7 text-white" />
              </div>
              <h2 className="text-2xl font-black tracking-tight">
                <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
                  Sélection de la séance
                </span>
              </h2>
            </div>

            <DateGroupSelector
              selectedDate={selectedDate}
              selectedGroup={selectedGroup}
              onDateChange={onDateChange}
              onGroupChange={onGroupChange}
            />
          </div>
        </motion.div>
      </div>

      <div className="flex justify-center mt-10">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: "200px" }}
          transition={{ delay: 0.8, duration: 1.2 }}
          className="h-1 bg-gradient-to-r from-transparent via-primary to-transparent rounded-full"
        />
      </div>
    </motion.div>
  );
};

export const SessionInfoCard = ({
  selectedGroup,
  filteredMembersCount,
  loading,
  getNextSessionDate,
  isNextSessionToday,
}: Partial<HeroSectionProps> & { selectedGroup: SessionType; loading: boolean; filteredMembersCount: number }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-emerald-50/60 via-teal-50/40 to-emerald-50/30 rounded-2xl border border-emerald-200/50 shadow-sm p-6"
    >
      <div className="flex items-stretch justify-between gap-6">
        <div className="flex items-center gap-4 border-l-4 border-l-teal-500 bg-white/90 backdrop-blur-md rounded-xl px-6 py-4 shadow-md border border-black/60 flex-1 h-32">
          <Calendar className="h-8 w-8 text-emerald-600 flex-shrink-0" />
          <div className="flex flex-col justify-center flex-1">
            <p className="text-sm text-slate-700 font-geist-medium mb-1">
              Prochaine séance
            </p>
            <div className="flex items-center gap-2 mb-1">
              <p className="text-lg font-geist-bold text-emerald-700 leading-tight">
                {getNextSessionDate?.(selectedGroup).displayText}
              </p>
              {isNextSessionToday?.(selectedGroup) && (
                <span className="px-2 py-1 bg-teal-600 text-white text-xs font-geist-bold rounded-full whitespace-nowrap">
                  Aujourd'hui
                </span>
              )}
            </div>
            <p className="text-xs text-slate-600 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              17h00 – 19h00
            </p>
          </div>
        </div>

        <div className="w-80 h-32 rounded-xl overflow-hidden border-l-4 border-l-black border-white shadow-lg bg-white border border-black/60 flex items-center justify-center">
          <ErrorBoundary>
            <LazyImage
              src={SalemImage}
              alt="Équipe"
              className="max-w-full max-h-full object-contain"
              placeholder={
                <div className="w-full h-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center">
                  <Calendar className="h-12 w-12 text-slate-400" />
                </div>
              }
            />
          </ErrorBoundary>
        </div>

        <div className="flex items-center gap-4 border-l-4 border-l-teal-500 bg-white/70 backdrop-blur-sm rounded-xl px-6 py-4 shadow-sm border border-black/60 flex-1 h-32 justify-center">
          <UserCheck className="h-10 w-10 text-emerald-600 flex-shrink-0" />
          <div className="flex flex-col items-center text-center">
            <p className="text-3xl font-geist-black text-emerald-700 leading-none">
              {loading ? 0 : filteredMembersCount}
            </p>
            <p className="text-xs text-slate-600 font-geist-medium mt-1">
              élève{filteredMembersCount > 1 ? "s" : ""} attendu
              {filteredMembersCount > 1 ? "s" : ""}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};