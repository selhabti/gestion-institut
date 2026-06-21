// src/components/shared/DateGroupSelector.tsx
import { Button } from "@/components/ui/button";
import { Calendar, ChevronLeft, ChevronRight, Users } from "lucide-react";
import type { SessionType } from "@/types/session";
import { motion } from "framer-motion";

const groups = [
  {
    value: "Samedi" as const,
    label: "Samedi",
    color: "from-blue-500 to-indigo-600",
  },
  {
    value: "Dimanche" as const,
    label: "Dimanche",
    color: "from-emerald-500 to-teal-600",
  },
  {
    value: "Samedi+Dimanche" as const,
    label: "Weekend",
    color: "from-purple-500 to-pink-600",
  },
  {
    value: "Lundi" as const,
    label: "Nouraniya",
    color: "from-orange-500 to-amber-600",
  },
];

const formatFrenchDate = (date: Date) => {
  const days = ["DIM", "LUN", "MAR", "MER", "JEU", "VEN", "SAM"];
  const months = [
    "JAN",
    "FÉV",
    "MAR",
    "AVR",
    "MAI",
    "JUI",
    "JUL",
    "AOÛ",
    "SEP",
    "OCT",
    "NOV",
    "DÉC",
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

  return (
    <div className="max-w-6xl mx-auto px-4">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-xl border border-black/8 overflow-hidden"
      >
        {/* Header compact */}
        <div className="px-6 py-5 flex items-center justify-between bg-gradient-to-r from-indigo-50/70 to-purple-50/50">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-xl shadow-lg">
              <Calendar className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-geist-black text-slate-900">
                Séance du jour
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => onDateChange("prev")}
              className="h-10 w-10 rounded-xl border-slate-300 hover:bg-slate-100"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => onDateChange("next")}
              className="h-10 w-10 rounded-xl border-slate-300 hover:bg-slate-100"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Contenu principal – tout sur une ligne */}
        <div className="p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          {/* Date — cadre magique qui suit la couleur du groupe actif */}
          <div className="flex items-center gap-6">
            <div className="relative">
              {/* Glow extérieur qui suit aussi la couleur du groupe */}
              <div
                className={`
      absolute -inset-2 rounded-3xl blur-2xl -z-10 opacity-60
      ${selectedGroup === "Samedi" ? "bg-blue-400/40" : ""}
      ${selectedGroup === "Dimanche" ? "bg-emerald-400/40" : ""}
      ${selectedGroup === "Samedi+Dimanche" ? "bg-purple-400/40" : ""}
      ${selectedGroup === "Lundi" ? "bg-orange-400/40" : ""}
    `}
              />

              {/* Le cadre principal */}
              <div className="bg-white rounded-2xl shadow-2xl border-4 border-black/12 overflow-hidden w-48">
                {/* RUBAN DU HAUT — CHANGE DE COULEUR SELON LE GROUPE */}
                <div
                  className={`
        h-11 flex items-center justify-center
        ${
          selectedGroup === "Samedi"
            ? "bg-gradient-to-r from-blue-600 to-indigo-700"
            : ""
        }
        ${
          selectedGroup === "Dimanche"
            ? "bg-gradient-to-r from-emerald-600 to-teal-700"
            : ""
        }
        ${
          selectedGroup === "Samedi+Dimanche"
            ? "bg-gradient-to-r from-purple-600 to-pink-700"
            : ""
        }
        ${
          selectedGroup === "Lundi"
            ? "bg-gradient-to-r from-orange-600 to-amber-700"
            : ""
        }
      `}
                >
                  <Calendar className="h-7 w-7 text-white" />
                </div>

                {/* Jour du mois */}
                <div className="py-6 text-center bg-white">
                  <p className="text-8xl font-geist-black text-slate-900 leading-none -mt-3">
                    {dateNum}
                  </p>
                </div>

                {/* Jour + mois en bas */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white py-3 text-center">
                  <p className="text-sm font-geist-bold uppercase tracking-wider">
                    {day}
                  </p>
                  <p className="text-xs font-geist-medium uppercase tracking-widest opacity-90">
                    {monthYear}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Sélecteur de groupe – compact et parfait */}
          <div className="flex-1 max-w-2xl">
            <div className="flex items-center gap-3 mb-3">
              <Users className="h-6 w-6 text-slate-700" />
              <span className="text-lg font-geist-black text-slate-900">
                Groupe
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {groups.map((g) => (
                <motion.button
                  key={g.value}
                  whileHover={{ scale: 1.06 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => onGroupChange(g.value)}
                  className={`
                    relative overflow-hidden rounded-xl border-2 py-3 px-4 transition-all
                    h-20 flex flex-col items-center justify-center text-center
                    ${
                      selectedGroup === g.value
                        ? `bg-gradient-to-br ${g.color} text-white shadow-xl border-transparent`
                        : "bg-gray-50 border-gray-200 text-slate-800 hover:bg-gray-100 hover:border-gray-400"
                    }
                  `}
                >
                  <span
                    className={`font-geist-bold ${
                      g.label.length > 8 ? "text-base" : "text-lg"
                    } leading-tight`}
                  >
                    {g.label}
                  </span>
                  <span className="text-xs opacity-70 mt-0.5">Session</span>
                  {selectedGroup === g.value && (
                    <div className="absolute inset-0 bg-white/15 rounded-xl" />
                  )}
                </motion.button>
              ))}
            </div>
          </div>
        </div>

        {/* Barre de statut ultra fine */}
        <div className="px-6 py-3 bg-gradient-to-r from-indigo-500/8 to-purple-500/8 border-t border-indigo-100">
          <div className="flex items-center justify-between text-sm">
            <span className="font-geist-semibold text-slate-800">
              Groupe actif :{" "}
              <span className="font-geist-bold text-indigo-700">
                {selectedGroup === "Samedi+Dimanche"
                  ? "Weekend"
                  : selectedGroup}
              </span>
            </span>
            <span className="px-4 py-1.5 bg-white/90 rounded-full font-geist-bold text-slate-800 text-xs shadow">
              Présences ouvertes
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
