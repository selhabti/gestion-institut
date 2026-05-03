import React, { useState } from "react";
import { useEvents } from "@/hooks/useEvents";
import type { EventFormData } from "@/types/event";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "lucide-react";
import { SESSION_TYPES } from "@/pages/DashboardPage/utils/constants";

interface CreateVacationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreateVacationModal: React.FC<CreateVacationModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { user } = useAuth(); 
  const { createEvent, loading } = useEvents();
  const [formData, setFormData] = useState<EventFormData>({
    title: "",
    description: "",
    event_type: "vacation",
    start_date: "",
    end_date: "",
    exclude_from_stats: false,
    requires_attendance: false,
    groups: [],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error("Vous devez être connecté");
      return;
    }

    if (!formData.title || !formData.start_date || !formData.end_date) {
      toast.error("Le titre et les dates sont obligatoires");
      return;
    }

    if (new Date(formData.start_date) > new Date(formData.end_date)) {
      toast.error("La date de fin doit être après la date de début");
      return;
    }

    setIsSubmitting(true);
    
    try {
      await createEvent(formData, user.id);
      toast.success("Vacances créées avec succès");
      
      // Réinitialiser le formulaire
      setFormData({
        title: "",
        description: "",
        event_type: "vacation",
        start_date: "",
        end_date: "",
        exclude_from_stats: false,
        requires_attendance: false,
        groups: [],
      });
      
      onClose();
    } catch (error) {
      toast.error("Erreur lors de la création des vacances");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGroupToggle = (group: string) => {
    setFormData(prev => ({
      ...prev,
      groups: prev.groups.includes(group)
        ? prev.groups.filter(g => g !== group)
        : [...prev.groups, group]
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Nouvelle période de vacances
          </DialogTitle>
          <DialogDescription>
            Créez une nouvelle période de vacances pour l'institut
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="title">Titre des vacances *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              placeholder="Ex: Vacances d'été 2024"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">Date de début *</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="end_date">Date de fin *</Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Groupes concernés</Label>
            <div className="flex flex-wrap gap-2">
              {SESSION_TYPES.map((group) => (
                <Button
                  key={group}
                  type="button"
                  variant={formData.groups.includes(group) ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleGroupToggle(group)}
                >
                  {group}
                </Button>
              ))}
            </div>
            <p className="text-xs text-gray-500">
              Si aucun groupe n'est sélectionné, les vacances s'appliqueront à tous les groupes
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="exclude-from-stats"
              checked={formData.exclude_from_stats}
              onCheckedChange={(checked) => 
                setFormData({...formData, exclude_from_stats: checked === true})
              }
            />
            <Label htmlFor="exclude-from-stats" className="text-sm">
              Exclure ces dates des statistiques de présence
            </Label>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting || loading}>
              {isSubmitting ? "Création..." : "Créer les vacances"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateVacationModal;