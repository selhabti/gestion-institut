import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Calendar, 
  Users, 
  Settings, 
  Trash2, 
  Edit, 
  Plus,
  School,
  AlertTriangle,
  CalendarDays,
  CheckCircle,
  XCircle,
  Umbrella,
  Shield,
  Briefcase
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import type { Event, EventType, EventFormData } from "@/types/event";
import { SESSION_TYPES } from "@/pages/DashboardPage/utils/constants";
import { useEvents } from "@/hooks/useEvents";

interface AdminTabProps {
  user: any;
  shareMode: boolean;
}

export const AdminTab = ({ user, shareMode }: AdminTabProps) => {
  const { events, loading, createEvent, updateEvent, deleteEvent } = useEvents();
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  
  const [formData, setFormData] = useState<EventFormData>({
    title: "",
    description: "",
    event_type: "vacation",
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    groups: [],
    exclude_from_stats: true,
    requires_attendance: false,
  });

  // Reset form when editing event changes
  useEffect(() => {
    if (editingEvent) {
      setFormData({
        title: editingEvent.title,
        description: editingEvent.description || '',
        event_type: editingEvent.event_type,
        start_date: editingEvent.start_date,
        end_date: editingEvent.end_date,
        groups: editingEvent.groups || [],
        exclude_from_stats: editingEvent.exclude_from_stats,
        requires_attendance: editingEvent.requires_attendance,
      });
      setShowForm(true);
    }
  }, [editingEvent]);

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.title.trim()) {
      toast.error("Le titre de l'événement est requis");
      return;
    }

    if (!formData.start_date || !formData.end_date) {
      toast.error("Les dates sont requises");
      return;
    }

    if (new Date(formData.start_date) > new Date(formData.end_date)) {
      toast.error("La date de fin doit être après la date de début");
      return;
    }

    try {
      if (editingEvent && user) {
        await updateEvent(editingEvent.id, formData);
        toast.success('Événement mis à jour');
      } else if (user) {
        await createEvent(formData, user.id);
        toast.success('Événement créé');
      } else {
        toast.error("Vous devez être connecté");
        return;
      }

      resetForm();
    } catch (error) {
      console.error('❌ Erreur:', error);
      toast.error('Erreur lors de la sauvegarde');
    }
  };

  // Delete event
  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cet événement ?')) return;

    try {
      await deleteEvent(id);
      toast.success('Événement supprimé');
    } catch (error) {
      console.error('❌ Erreur suppression:', error);
      toast.error('Erreur de suppression');
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      event_type: "vacation",
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date().toISOString().split('T')[0],
      groups: [],
      exclude_from_stats: true,
      requires_attendance: false,
    });
    setEditingEvent(null);
    setShowForm(false);
  };

  const eventTypeIcons = {
    vacation: Umbrella,
    seminar: School,
    holiday: CalendarDays,
    special_session: Briefcase, // Utiliser Briefcase pour special_session
    maintenance: Shield, // Utiliser Shield pour maintenance
  };

  const eventTypeColors = {
    vacation: "bg-blue-100 text-blue-800 border-blue-200",
    seminar: "bg-purple-100 text-purple-800 border-purple-200",
    holiday: "bg-green-100 text-green-800 border-green-200",
    special_session: "bg-amber-100 text-amber-800 border-amber-200",
    maintenance: "bg-red-100 text-red-800 border-red-200",
  };

  const eventTypeLabels = {
    vacation: "Vacances",
    seminar: "Séminaire",
    holiday: "Jour férié",
    special_session: "Session spéciale",
    maintenance: "Maintenance",
  };

  // Vérifiez que votre table events existe et a les bonnes colonnes
  const vacationCount = events.filter(e => e.event_type === 'vacation').length;
  const seminarCount = events.filter(e => e.event_type === 'seminar').length;
  const holidayCount = events.filter(e => e.event_type === 'holiday').length;
  const specialSessionCount = events.filter(e => e.event_type === 'special_session').length;

  if (shareMode) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Settings className="h-16 w-16 mx-auto mb-4 text-orange-500" />
          <h3 className="text-xl font-semibold text-slate-900 mb-2">
            Accès restreint
          </h3>
          <p className="text-slate-600 mb-4">
            L'administration n'est pas disponible en mode partage.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header avec stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Settings className="h-6 w-6 text-slate-700" />
            Administration - Gestion des Événements
          </CardTitle>
          <CardDescription>
            Vacances, séminaires, jours fériés et événements spéciaux
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <div className="flex items-center gap-2">
                <Umbrella className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-700">Vacances</span>
              </div>
              <p className="text-2xl font-bold text-blue-800 mt-2">
                {vacationCount}
              </p>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
              <div className="flex items-center gap-2">
                <School className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium text-purple-700">Séminaires</span>
              </div>
              <p className="text-2xl font-bold text-purple-800 mt-2">
                {seminarCount}
              </p>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg border border-green-100">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-700">Jours fériés</span>
              </div>
              <p className="text-2xl font-bold text-green-800 mt-2">
                {holidayCount}
              </p>
            </div>
            
            <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
              <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-amber-600" />
                <span className="text-sm font-medium text-amber-700">Sessions spéciales</span>
              </div>
              <p className="text-2xl font-bold text-amber-800 mt-2">
                {specialSessionCount}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bouton d'ajout */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Événements programmés</h3>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvel événement
        </Button>
      </div>

      {/* Formulaire */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingEvent ? 'Modifier événement' : 'Nouvel événement'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Titre *</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    required
                    placeholder="Vacances d'hiver, Séminaire..."
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Type d'événement *</Label>
                  <Select
                    value={formData.event_type}
                    onValueChange={(value: EventType) => 
                      setFormData({...formData, event_type: value})
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez un type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vacation">Vacances</SelectItem>
                      <SelectItem value="seminar">Séminaire</SelectItem>
                      <SelectItem value="holiday">Jour férié</SelectItem>
                      <SelectItem value="special_session">Session spéciale</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Date de début *</Label>
                  <Input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Date de fin *</Label>
                  <Input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                    required
                    min={formData.start_date}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description (optionnel)</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Détails de l'événement..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Groupes concernés (laisser vide pour tous)</Label>
                <div className="flex flex-wrap gap-2">
  {SESSION_TYPES.map((group) => (
    <Button
      key={group}
      type="button"
      size="sm"
      variant={formData.groups.includes(group) ? "default" : "outline"}
      onClick={() => {
        const newGroups = formData.groups.includes(group)
          ? formData.groups.filter(g => g !== group)
          : [...formData.groups, group];
        setFormData({...formData, groups: newGroups});
      }}
    >
      {group}
    </Button>
  ))}
</div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={formData.exclude_from_stats}
                    onCheckedChange={(checked) => 
                      setFormData({...formData, exclude_from_stats: checked})
                    }
                  />
                  <Label>Exclure des statistiques de présence</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={formData.requires_attendance}
                    onCheckedChange={(checked) => 
                      setFormData({...formData, requires_attendance: checked})
                    }
                  />
                  <Label>Nécessite prise de présence</Label>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Annuler
                </Button>
                <Button type="submit" disabled={loading}>
                  {editingEvent ? 'Mettre à jour' : 'Créer'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Liste des événements */}
      <Card>
        <CardContent className="p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-slate-600 mt-2">Chargement des événements...</p>
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-slate-300" />
              <p>Aucun événement programmé</p>
            </div>
          ) : (
            <div className="space-y-4">
              {events.map((event) => {
                const Icon = eventTypeIcons[event.event_type] || AlertTriangle;
                const today = new Date().toISOString().split('T')[0];
                const isActive = today >= event.start_date && today <= event.end_date;
                const isFuture = today < event.start_date;
                const isPast = today > event.end_date;

                return (
                  <div
                    key={event.id}
                    className={`p-4 border rounded-lg ${
                      eventTypeColors[event.event_type] || "bg-gray-100 text-gray-800 border-gray-200"
                    } ${isActive ? 'ring-2 ring-opacity-50 ring-current' : ''}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${
                          eventTypeColors[event.event_type]?.split(' ')[0] || "bg-gray-100"
                        }`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold">{event.title}</h4>
                            <Badge variant="outline" className="text-xs">
                              {eventTypeLabels[event.event_type] || event.event_type}
                            </Badge>
                          </div>
                          
                          {event.description && (
                            <p className="text-sm text-slate-600 mt-1">{event.description}</p>
                          )}
                          
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-2">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3 text-slate-500" />
                              <span className="text-sm">
                                {format(new Date(event.start_date), 'dd MMM yyyy', { locale: fr })} - 
                                {format(new Date(event.end_date), 'dd MMM yyyy', { locale: fr })}
                              </span>
                            </div>
                            
                            {event.groups && event.groups.length > 0 ? (
                              <div className="flex items-center gap-1">
                                <Users className="h-3 w-3 text-slate-500" />
                                <span className="text-sm">
                                  {event.groups.join(', ')}
                                </span>
                              </div>
                            ) : (
                              <Badge variant="outline" className="text-xs w-fit">
                                Tous les groupes
                              </Badge>
                            )}
                          </div>
                          
                          <div className="flex flex-wrap gap-2 mt-3">
                            <Badge variant={event.exclude_from_stats ? "secondary" : "outline"}>
                              {event.exclude_from_stats ? (
                                <XCircle className="h-3 w-3 mr-1" />
                              ) : (
                                <CheckCircle className="h-3 w-3 mr-1" />
                              )}
                              {event.exclude_from_stats ? 'Exclu des stats' : 'Inclu dans stats'}
                            </Badge>
                            
                            <Badge variant={event.requires_attendance ? "default" : "outline"}>
                              {event.requires_attendance ? 'Présence requise' : 'Pas de présence'}
                            </Badge>
                            
                            {isActive && (
                              <Badge className="bg-green-500">En cours</Badge>
                            )}
                            {isFuture && (
                              <Badge variant="outline" className="text-blue-600 border-blue-300">
                                À venir
                              </Badge>
                            )}
                            {isPast && (
                              <Badge variant="outline" className="text-gray-500 border-gray-300">
                                Terminé
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingEvent(event)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleDelete(event.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};