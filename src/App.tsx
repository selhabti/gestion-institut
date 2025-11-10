// Path: src/App.tsx
import { useState } from "react";
import { MemberForm } from "./components/MemberForm";
import { MembersTable } from "./components/MembersTable";
import { WeekendCalendar } from "./components/WeekendCalendar";
import { MonthlyStats } from "./components/MonthlyStats";
import { useMembers } from "./hooks/useMembers";
import { toast, Toaster } from "./components/ui/sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import type { AttendanceStatus } from "@/types/member";

function App() {
  const { members, loading, error, refreshMembers } = useMembers();
  const [selectedGroup, setSelectedGroup] = useState<"Lundi" | "Samedi" | "Dimanche">("Samedi");
  const [activeTab, setActiveTab] = useState("tableau");

  const handleMarkPresent = async (memberId: string, date: string, status: AttendanceStatus) => {
    try {
      console.log("Marquer présence:", { memberId, date, status });
      
      // TODO: Implémenter l'appel à Supabase
      toast.success(`Présence ${status === "present" ? "marquée" : "annulée"} avec succès!`);
    } catch (error: any) {
      console.error('Erreur:', error);
      toast.error("Erreur lors du marquage de présence");
    }
  };

  const handleMarkPresentCalendar = async (memberId: string, date: string, present: boolean) => {
    const status: AttendanceStatus = present ? "present" : "absent_unjustified";
    await handleMarkPresent(memberId, date, status);
  };

  const handleMarkPayment = async (memberId: string) => {
    try {
      console.log("Marquer paiement:", memberId);
      // TODO: Implémenter l'appel à Supabase
      toast.success("Paiement marqué avec succès!");
    } catch (error: any) {
      console.error('Erreur:', error);
      toast.error("Erreur lors du marquage du paiement");
    }
  };

  const handleDeleteMember = async (memberId: string) => {
    try {
      // TODO: Implémenter la suppression dans Supabase
      toast.success("Membre supprimé avec succès!");
      refreshMembers();
    } catch (error: any) {
      console.error('Erreur:', error);
      toast.error("Erreur lors de la suppression");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 bg-blue-600 rounded-lg"></div>
            <h1 className="text-2xl font-semibold text-slate-900">Gestion des Membres</h1>
          </div>
          <div className="text-slate-600">Chargement des membres...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* En-tête épuré */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-sm">
              <span className="text-white font-semibold text-lg">GM</span>
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">Gestion des Membres</h1>
              <p className="text-slate-600 text-sm">Suivi des présences et cotisations</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-slate-700">Groupe :</span>
            <Select value={selectedGroup} onValueChange={(value: "Lundi" | "Samedi" | "Dimanche") => setSelectedGroup(value)}>
              <SelectTrigger className="w-32 bg-white border-slate-300">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Lundi">Lundi</SelectItem>
                <SelectItem value="Samedi">Samedi</SelectItem>
                <SelectItem value="Dimanche">Dimanche</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            <strong>Erreur:</strong> {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Formulaire */}
          <div className="lg:col-span-1">
            <MemberForm />
          </div>

          {/* Contenu principal */}
          <div className="lg:col-span-3">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6 bg-slate-100 p-1 rounded-lg">
                <TabsTrigger 
                  value="tableau" 
                  className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-slate-900 rounded-md"
                >
                  Tableau
                </TabsTrigger>
                <TabsTrigger 
                  value="calendrier"
                  className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-slate-900 rounded-md"
                >
                  Calendrier
                </TabsTrigger>
                <TabsTrigger 
                  value="statistiques"
                  className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-slate-900 rounded-md"
                >
                  Statistiques
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="tableau" className="space-y-6">
                <MembersTable
                  members={members.map(m => ({
                    id: m.id,
                    firstName: m.first_name,
                    lastName: m.last_name,
                    city: m.city,
                    group: m.group_type,
                    attendances: [],
                    payments: []
                  }))}
                  selectedGroup={selectedGroup}
                  currentDate={new Date().toISOString().split('T')[0]}
                  onMarkPresent={handleMarkPresent}
                  onMarkPayment={handleMarkPayment}
                  isAdmin={true}
                  onDeleteMember={handleDeleteMember}
                />
              </TabsContent>
              
              <TabsContent value="calendrier" className="space-y-6">
                <WeekendCalendar
                  members={members.map(m => ({
                    id: m.id,
                    firstName: m.first_name,
                    lastName: m.last_name,
                    city: m.city,
                    group: m.group_type,
                    attendances: [],
                    payments: []
                  }))}
                  selectedGroup={selectedGroup}
                  onMarkPresent={handleMarkPresentCalendar}
                  isAdmin={true}
                  onDeleteMember={handleDeleteMember}
                />
              </TabsContent>
              
              <TabsContent value="statistiques" className="space-y-6">
                <MonthlyStats
                  members={members.map(m => ({
                    id: m.id,
                    firstName: m.first_name,
                    lastName: m.last_name,
                    city: m.city,
                    group: m.group_type,
                    attendances: [],
                    payments: []
                  }))}
                  selectedGroup={selectedGroup}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
      <Toaster />
    </div>
  );
}

export default App;