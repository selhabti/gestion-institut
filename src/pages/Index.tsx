import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import MemberForm from "@/components/MemberForm";
import MembersTable from "@/components/MembersTable";
import MonthlyStats from "@/components/MonthlyStats";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { GroupType, AttendanceStatus } from "@/types/member";
import { ClipboardList, LogOut } from "lucide-react";

interface Member {
  id: string;
  first_name: string;
  last_name: string;
  city?: string;
  group_type: "Samedi" | "Dimanche" | "Lundi";
  created_by: string;
  created_at?: string;
}

interface Attendance {
  id: string;
  member_id: string;
  date: string;
  status: AttendanceStatus;
}

interface Payment {
  id: string;
  member_id: string;
  date: string;
  amount: number;
  validated: boolean;
}

const Index = () => {
  const navigate = useNavigate();
  const { user, isAdmin, loading, signOut } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<GroupType>("Samedi");
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [userMember, setUserMember] = useState<Member | null>(null);
  const [shareMode, setShareMode] = useState(false);

  console.log("🎯 Index - Auth state:", { user, loading, isAdmin });

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  // Load data from database
  useEffect(() => {
    if (!user || loading) return;

    console.log("🎯 Loading data from database...");

    const loadData = async () => {
      setIsLoadingData(true);
      
      try {
        // Check if user is registered as member (for non-admin users)
        if (!isAdmin) {
          const { data: memberData } = await supabase
            .from("members")
            .select("*")
            .eq("created_by", user.id)
            .maybeSingle();

          setUserMember(memberData);
          
          if (!memberData) {
            console.log("🎯 No member found, redirecting to register");
            navigate("/register");
            return;
          }
        }
        
        // Load members (only for admin)
        if (isAdmin) {
          const { data: membersData, error: membersError } = await supabase
            .from("members")
            .select("*")
            .order("created_at", { ascending: true });

          if (membersError) {
            console.error("❌ Error loading members:", membersError);
            toast.error("Erreur lors du chargement des membres");
          } else {
            console.log("✅ Members loaded:", membersData?.length || 0);
            setMembers(membersData || []);
          }
        }

        // Load attendances
        const { data: attendancesData, error: attendancesError } = await supabase
          .from("attendances")
          .select("*");

        if (attendancesError) {
          console.error("❌ Error loading attendances:", attendancesError);
        } else {
          console.log("✅ Attendances loaded:", attendancesData?.length || 0);
          setAttendances(attendancesData || []);
        }

        // Load payments
        const { data: paymentsData, error: paymentsError } = await supabase
          .from("payments")
          .select("*");

        if (paymentsError) {
          console.error("❌ Error loading payments:", paymentsError);
        } else {
          console.log("✅ Payments loaded:", paymentsData?.length || 0);
          setPayments(paymentsData || []);
        }
      } catch (error) {
        console.error("💥 Error in loadData:", error);
        toast.error("Erreur lors du chargement des données");
      } finally {
        console.log("🎯 Data loading complete");
        setIsLoadingData(false);
      }
    };

    loadData();

    // Subscribe to realtime updates
    const membersChannel = supabase
      .channel("members-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "members" },
        () => {
          console.log("🔄 Members data changed, reloading...");
          loadData();
        }
      )
      .subscribe();

    const attendancesChannel = supabase
      .channel("attendances-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "attendances" },
        () => {
          console.log("🔄 Attendances data changed, reloading...");
          loadData();
        }
      )
      .subscribe();

    return () => {
      console.log("🎯 Cleaning up subscriptions");
      supabase.removeChannel(membersChannel);
      supabase.removeChannel(attendancesChannel);
    };
  }, [user, isAdmin, navigate, loading]);

  const handleAddMember = async (firstName: string, lastName: string, city: string, group: GroupType) => {
    if (!user) return;

    console.log("🎯 Adding member:", { firstName, lastName, city, group });

    const { error } = await supabase.from("members").insert({
      first_name: firstName,
      last_name: lastName,
      city,
      group_type: group,
      created_by: user.id,
    });

    if (error) {
      console.error("❌ Error adding member:", error);
      toast.error("Erreur lors de l'ajout du membre");
    } else {
      console.log("✅ Member added successfully");
      toast.success("Membre ajouté avec succès!");
    }
  };

  const handleMarkPresent = async (memberId: string, date: string, status: AttendanceStatus) => {
    if (!user) return;

    console.log("🎯 Marking attendance:", { memberId, date, status });

    try {
      const existingAttendance = attendances.find(
        (a) => a.member_id === memberId && a.date === date
      );

      if (existingAttendance) {
        if (existingAttendance.status === status) {
          // Remove if clicking the same status
          const { error } = await supabase
            .from("attendances")
            .delete()
            .eq("id", existingAttendance.id);

          if (error) throw error;
          console.log("✅ Attendance removed");
        } else {
          // Modify existing attendance
          const { error } = await supabase
            .from("attendances")
            .update({ status })
            .eq("id", existingAttendance.id);

          if (error) throw error;
          console.log("✅ Attendance updated");
          toast.success("Présence modifiée");
        }
      } else {
        // Add new attendance
        const { error } = await supabase.from("attendances").insert({
          member_id: memberId,
          date,
          status,
          created_by: user.id,
        });

        if (error) throw error;
        
        const statusText = 
          status === "present" ? "Présence enregistrée" : 
          status === "absent_justified" ? "Absence justifiée enregistrée" :
          "Absence non justifiée enregistrée";
        
        console.log("✅ New attendance added:", statusText);
        toast.success(statusText);
      }
    } catch (error) {
      console.error("❌ Error marking attendance:", error);
      toast.error("Erreur lors de l'opération");
    }
  };

  const handleShareModeToggle = (checked: boolean) => {
    console.log("🎯 Share mode toggled:", checked);
    setShareMode(checked);
    toast.success(checked ? "Mode partage activé" : "Mode partage désactivé");
  };

  const handleDeleteMember = async (memberId: string) => {
    console.log("🎯 Deleting member:", memberId);

    try {
      const { error } = await supabase
        .from("members")
        .delete()
        .eq("id", memberId);

      if (error) throw error;
      console.log("✅ Member deleted");
      toast.success("Membre supprimé");
    } catch (error) {
      console.error("❌ Error deleting member:", error);
      toast.error("Erreur lors de la suppression");
    }
  };

  const handleMarkPayment = async (memberId: string) => {
    if (!user) return;

    console.log("🎯 Marking payment for member:", memberId);

    try {
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      const member = transformedMembers.find((m) => m.id === memberId);
      if (!member) {
        console.log("❌ Member not found");
        return;
      }

      const hasPayment = member.payments.some((p) => {
        const paymentDate = new Date(p.date);
        return (
          paymentDate.getMonth() === currentMonth &&
          paymentDate.getFullYear() === currentYear
        );
      });

      if (hasPayment) {
        console.log("ℹ️ Member already paid this month");
        toast.info("Ce membre a déjà payé ce mois-ci");
        return;
      }

      const { error } = await supabase.from("payments").insert({
        member_id: memberId,
        amount: 0,
        date: now.toISOString().split("T")[0],
        validated: true,
        validated_by: user.id,
        validated_at: now.toISOString(),
        created_by: user.id,
      });

      if (error) throw error;
      console.log("✅ Payment marked");
      toast.success("Cotisation enregistrée");
    } catch (error) {
      console.error("❌ Error marking payment:", error);
      toast.error("Erreur lors de l'enregistrement");
    }
  };

  if (loading || isLoadingData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg">Chargement de l'application...</p>
          <p className="text-sm text-slate-600 mt-2">
            {loading ? "Authentification..." : "Chargement des données..."}
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  console.log("🎯 Rendering main interface with data");

  // Transform data for components
  const transformedMembers = isAdmin 
    ? members.map((m) => ({
        id: m.id,
        firstName: m.first_name,
        lastName: m.last_name,
        city: m.city,
        group: m.group_type,
        payments: payments
          .filter((p) => p.member_id === m.id)
          .map((p) => ({
            id: p.id,
            date: p.date,
            amount: p.amount,
          })),
        attendances: attendances
          .filter((a) => a.member_id === m.id)
          .map((a) => ({
            id: a.id,
            date: a.date,
            status: a.status,
          })),
      }))
    : userMember
    ? [{
        id: userMember.id,
        firstName: userMember.first_name,
        lastName: userMember.last_name,
        city: userMember.city,
        group: userMember.group_type,
        payments: payments
          .filter((p) => p.member_id === userMember.id)
          .map((p) => ({
            id: p.id,
            date: p.date,
            amount: p.amount,
          })),
        attendances: attendances
          .filter((a) => a.member_id === userMember.id)
          .map((a) => ({
            id: a.id,
            date: a.date,
            status: a.status,
          })),
      }]
    : [];

  const currentDate = new Date().toISOString().split("T")[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container max-w-7xl mx-auto py-6 px-4">
        <header className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <ClipboardList className="h-8 w-8 md:h-10 md:w-10 text-blue-600" />
              <h1 className="text-2xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                Gestion des Présences
              </h1>
            </div>
            <Button variant="outline" size="sm" onClick={signOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Déconnexion
            </Button>
          </div>
          <p className="text-slate-600 text-sm md:text-lg mb-4">
            Suivez les présences et cotisations {isAdmin && "(Admin)"}
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <div className="flex flex-wrap gap-3 justify-center">
              <Button
                size="lg"
                variant={selectedGroup === "Samedi" ? "default" : "outline"}
                onClick={() => setSelectedGroup("Samedi")}
                className="flex-1 md:flex-none min-w-[140px]"
              >
                Groupe Samedi
              </Button>
              <Button
                size="lg"
                variant={selectedGroup === "Dimanche" ? "default" : "outline"}
                onClick={() => setSelectedGroup("Dimanche")}
                className="flex-1 md:flex-none min-w-[140px]"
              >
                Groupe Dimanche
              </Button>
              <Button
                size="lg"
                variant={selectedGroup === "Lundi" ? "default" : "outline"}
                onClick={() => setSelectedGroup("Lundi")}
                className="flex-1 md:flex-none min-w-[180px]"
              >
                La méthode Nouraniya
              </Button>
            </div>
            
            {isAdmin && (
              <div className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-md bg-white/50">
                <Switch
                  id="share-mode"
                  checked={shareMode}
                  onCheckedChange={handleShareModeToggle}
                />
                <Label htmlFor="share-mode" className="text-sm cursor-pointer whitespace-nowrap">
                  Mode partage — désactiver la suppression
                </Label>
              </div>
            )}
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-4">
          {isAdmin && (
            <div className="lg:col-span-1 space-y-6">
              <MemberForm onAddMember={handleAddMember} />
              <MonthlyStats members={transformedMembers} selectedGroup={selectedGroup} />
            </div>
          )}
          
          <div className={isAdmin ? "lg:col-span-3" : "lg:col-span-4"}>
            <MembersTable
              members={transformedMembers}
              selectedGroup={isAdmin ? selectedGroup : (userMember?.group_type || "Samedi")}
              currentDate={currentDate}
              onMarkPresent={handleMarkPresent}
              onMarkPayment={handleMarkPayment}
              isAdmin={isAdmin}
              onDeleteMember={isAdmin ? handleDeleteMember : undefined}
              shareMode={shareMode}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;