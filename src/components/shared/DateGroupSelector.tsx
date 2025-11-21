// Path: src/components/shared/DateGroupSelector.tsx
import { Button } from "@/components/ui/button";
import { Calendar, Combine } from "lucide-react";
import type { SessionType } from "@/types/session";

interface DateGroupSelectorProps {
  selectedDate: Date;
  selectedGroup: SessionType;
  onDateChange: (direction: 'prev' | 'next') => void;
  onGroupChange: (group: SessionType) => void;
}

export const DateGroupSelector = ({
  selectedDate,
  selectedGroup,
  onDateChange,
  onGroupChange,
}: DateGroupSelectorProps) => {
  return (
    <div className="space-y-4 mb-6">
      {/* Sélecteur de session */}
      <div className="flex flex-wrap gap-2 items-center p-4 bg-white rounded-lg border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 mr-4">
          <Calendar className="h-4 w-4 text-blue-600" />
          <span className="font-medium text-sm">Session :</span>
        </div>
        
        <Button
          variant={selectedGroup === "Samedi" ? "default" : "outline"}
          size="sm"
          onClick={() => onGroupChange("Samedi")}
          className={selectedGroup === "Samedi" ? "bg-blue-600 hover:bg-blue-700" : ""}
        >
          Samedi
        </Button>
        
        <Button
          variant={selectedGroup === "Dimanche" ? "default" : "outline"}
          size="sm"
          onClick={() => onGroupChange("Dimanche")}
          className={selectedGroup === "Dimanche" ? "bg-green-600 hover:bg-green-700" : ""}
        >
          Dimanche
        </Button>
        
        <Button
          variant={selectedGroup === "Samedi+Dimanche" ? "default" : "outline"}
          size="sm"
          onClick={() => onGroupChange("Samedi+Dimanche")}
          className={`flex items-center gap-1 ${selectedGroup === "Samedi+Dimanche" ? "bg-purple-600 hover:bg-purple-700" : ""}`}
        >
          <Combine className="h-3 w-3" />
          Weekend
        </Button>
        
        <Button
          variant={selectedGroup === "Lundi" ? "default" : "outline"}
          size="sm"
          onClick={() => onGroupChange("Lundi")}
          className={selectedGroup === "Lundi" ? "bg-orange-600 hover:bg-orange-700" : ""}
        >
          Nouraniya
        </Button>
      </div>

      {/* Sélecteur de date - VERSION SIMPLIFIÉE sans Précédent/Suivant */}
      <div className="flex items-center justify-center p-4 bg-white rounded-lg border border-slate-200 shadow-sm">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            <div className="font-semibold text-lg">
              {`${selectedDate.toLocaleDateString('fr-FR', { weekday: 'long' }).charAt(0).toUpperCase()}${selectedDate.toLocaleDateString('fr-FR', { weekday: 'long' }).slice(1)} ${selectedDate.toLocaleDateString('fr-FR', { day: 'numeric' })} ${selectedDate.toLocaleDateString('fr-FR', { month: 'long' }).charAt(0).toUpperCase()}${selectedDate.toLocaleDateString('fr-FR', { month: 'long' }).slice(1)} ${selectedDate.getFullYear()}`}
            </div>
          </div>
          <div className="text-sm text-slate-600">
            {selectedGroup === "Samedi+Dimanche" 
              ? "Session Weekend - Groupes réunis" 
              : `Session ${selectedGroup}`
            }
          </div>
        </div>
      </div>
    </div>
  );
};