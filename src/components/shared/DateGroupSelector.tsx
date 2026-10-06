// src/components/shared/DateGroupSelector.tsx
import { Button } from "@/components/ui/button";
import { Calendar, ChevronLeft, ChevronRight, Users } from "lucide-react";
import type { SessionType } from "@/types/session";
import { motion } from "framer-motion";
import { getCurrentInstitutId } from "@/lib/institutes";

const groups = [
  { value: "Samedi" as const, label: "Samedi", dot: "bg-blue-500" },
  { value: "Dimanche" as const, label: "Dimanche", dot: "bg-emerald-500" },
  { value: "Samedi+Dimanche" as const, label: "Weekend", dot: "bg-purple-500" },
  { value: "Lundi" as const, label: "Nouraniya", dot: "bg-orange-500" },
];

const formatFrenchDate = (date: Date) => {
  const days = ["DIM", "LUN", "MAR", "MER", "JEU", "VEN", "SAM"];
  const months = [
    "JAN", "FÉV", "MAR", "AVR", "MAI", "JUI",
    "JUL", "AOÛ", "SEP", "OCT", "NOV", "DÉC",
  ];
  return {
    day: days[date.getDay()],
    dateNum: date.getDate().toString(),
    monthYear: `${months[date.getMonth()]} ${date.getFullYear()}`,
  };
};

export const DateGroupSelector = ({
  selectedDate,
  selectedGroup,
  onDateChange,
  onGroupChange,
}: {
  selectedDate: Date;
  selectedGroup: SessionType;
  onDateChange: (dir: "prev" | "next") => void;
  onGroupChange: (g: SessionType) => void;
}) => {
  const { day, dateNum, monthYear } = formatFrenchDate(selectedDate);

  const isAttanzil = getCurrentInstitutId() === "attanzil";
  const visibleGroups = isAttanzil
    ? groups.filter((g) => g.value === "Samedi")
    : groups;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 flex items-center justify-between border-b border-slate-100">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-slate-100 text-slate-600">
              <Calendar className="h-5 w-5" />
            </span>
            <h2 className="font-semibold text-slate-900">Séance du jour</h2>
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="icon"
              onClick={() => onDateChange("prev")}
              className="h-9 w-9 rounded-lg border-slate-200"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => onDateChange("next")}
              className="h-9 w-9 rounded-lg border-slate-200"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Corps */}
        <div className="p-5 flex flex-col lg:flex-row lg:items-center gap-6">
          {/* Date */}
          <div className="flex items-center gap-5">
            <div className="rounded-2xl border border-slate-200 shadow-sm overflow-hidden w-36 shrink-0">
              <div className="py-4 text-center bg-slate-50">
                <p className="text-5xl font-bold text-slate-900 leading-none">
                  {dateNum}
                </p>
              </div>
              <div className="bg-slate-900 text-white py-2 text-center">
                <p className="text-xs font-semibold uppercase tracking-wider">
                  {day}
                </p>
                <p className="text-[10px] uppercase tracking-widest opacity-75">
                  {monthYear}
                </p>
              </div>
            </div>
          </div>

          {/* Groupes */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              <Users className="h-4 w-4 text-slate-500" />
              <span className="text-sm font-semibold text-slate-700">
                Groupe
              </span>
            </div>
            <div
              className={`grid gap-2 ${
                isAttanzil ? "grid-cols-1" : "grid-cols-2 sm:grid-cols-4"
              }`}
            >
              {visibleGroups.map((g) => {
                const isActive = selectedGroup === g.value;
                return (
                  <motion.button
                    key={g.value}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onGroupChange(g.value)}
                    className={`rounded-xl border px-4 py-3 text-sm font-semibold transition-colors text-left ${
                      isActive
                        ? "border-primary bg-primary text-white"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span
                        className={`h-2 w-2 rounded-full ${
                          isActive ? "bg-white" : g.dot
                        }`}
                      />
                      {g.label}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Statut */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-sm">
          <span className="text-slate-600">
            Groupe actif :{" "}
            <span className="font-semibold text-slate-900">
              {selectedGroup === "Samedi+Dimanche" ? "Weekend" : selectedGroup}
            </span>
          </span>
          <span className="px-3 py-1 bg-white rounded-full text-xs font-medium text-emerald-600 border border-emerald-100">
            Présences ouvertes
          </span>
        </div>
      </div>
    </div>
  );
};
