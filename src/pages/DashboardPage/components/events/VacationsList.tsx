import React, { useState } from "react";
import { useEvents } from "@/hooks/useEvents";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Pencil, Trash2, Calendar, Users, BarChart } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import EditVacationModal from "./EditVacationModal";

const VacationsList: React.FC = () => {
  const { getVacations, deleteEvent, loading } = useEvents();
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  
  const vacations = getVacations();

  const handleDelete = async (eventId: string, eventName: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer les vacances "${eventName}" ?`)) {
      return;
    }

    try {
      await deleteEvent(eventId);
      toast.success("Vacances supprimées avec succès");
    } catch (error) {
      toast.error("Erreur lors de la suppression");
      console.error(error);
    }
  };

  const formatDateRange = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    
    if (format(startDate, 'yyyy-MM-dd') === format(endDate, 'yyyy-MM-dd')) {
      return format(startDate, "d MMMM yyyy", { locale: fr });
    }
    
    return `${format(startDate, "d MMM", { locale: fr })} au ${format(endDate, "d MMMM yyyy", { locale: fr })}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (vacations.length === 0) {
    return (
      <div className="text-center py-12">
        <Calendar className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-4 text-sm font-semibold text-gray-900">Aucune vacance</h3>
        <p className="mt-1 text-sm text-gray-500">
          Commencez par créer des périodes de vacances.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4">
        {vacations.map((vacation) => (
          <div
            key={vacation.id}
            className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-medium text-gray-900">
                    {vacation.title}
                  </h3>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    Vacances
                  </Badge>
                </div>
                
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>{formatDateRange(vacation.start_date, vacation.end_date)}</span>
                  </div>
                  
                  {vacation.groups && vacation.groups.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <div className="flex flex-wrap gap-1">
                        {vacation.groups.map((group) => (
                          <Badge
                            key={group}
                            variant="secondary"
                            className="text-xs"
                          >
                            {group}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {vacation.exclude_from_stats && (
                    <div className="flex items-center gap-2">
                      <BarChart className="h-4 w-4" />
                      <span className="text-amber-600">Exclu des statistiques</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2 ml-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingEventId(vacation.id)}
                  className="h-8 w-8 p-0"
                  title="Modifier"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(vacation.id, vacation.title)}
                  className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                  title="Supprimer"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {editingEventId && (
        <EditVacationModal
          eventId={editingEventId}
          isOpen={true}
          onClose={() => setEditingEventId(null)}
          onSuccess={() => setEditingEventId(null)}
        />
      )}
    </div>
  );
};

export default VacationsList;