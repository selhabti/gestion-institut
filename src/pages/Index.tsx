import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MemberForm } from "@/components/MemberForm";
import { MembersTable } from "@/components/MembersTable";
import { MonthlyStats } from "@/components/MonthlyStats";
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

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  // Load data from database
  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      setIsLoadingData(true);
      
      // Check if user is registered as member
      if (!isAdmin) {
        const { data: memberData } = await supabase
          .from("members")
          .select("*")
          .eq("created_by", user.id)
          .maybeSingle();

        setUserMember(memberData);
        
        if (!memberData) {
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
          toast.error("Erreur lors du chargement des membres");
          if (import.meta.env.DEV) {
            console.error(membersError);
          }
        } else {
          setMembers(membersData || []);
        }
      }

      // Load attendances
      const { data: attendancesData, error: attendancesError } = await supabase
        .from("attendances")
        .select("*");

      if (attendancesError) {
        toast.error("Erreur lors du chargement des présences");
        if (import.meta.env.DEV) {
          console.error(attendancesError);
        }
      } else {
        setAttendances(attendancesData || []);
      }

      // Load payments
      const { data: paymentsData, error: paymentsError } = await supabase
        .from("payments")
        .select("*");

      if (paymentsError && import.meta.env.DEV) {
        console.error(paymentsError);
      } else {
        setPayments(paymentsData || []);
      }

      setIsLoadingData(false);
    };

    loadData();

    // Subscribe to realtime updates
    const membersChannel = supabase
      .channel("members-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "members" },
        () => loadData()
      )
      .subscribe();

    const attendancesChannel = supabase
      .channel("attendances-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "attendances" },
        () => loadData()
      )
      .subscribe();

    const paymentsChannel = supabase
      .channel("payments-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "payments" },
        () => loadData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(membersChannel);
      supabase.removeChannel(attendancesChannel);
      supabase.removeChannel(paymentsChannel);
    };
  }, [user, isAdmin, navigate]);

  const handleAddMember = async (firstName: string, lastName: string, city: string, group: GroupType) => {
    if (!user) return;

    const { error } = await supabase.from("members").insert({
      first_name: firstName,
      last_name: lastName,
      city,
      group_type: group,
      created_by: user.id,
    });

    if (error) {
      toast.error("Erreur lors de l'ajout du membre");
      if (import.meta.env.DEV) {
        console.error(error);
      }
    } else {
      toast.success("Membre ajouté avec succès!");
    }
  };

  const handleMarkPresent = async (memberId: string, date: string, status: AttendanceStatus) => {
    if (!user) return;

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

        if (error) {
          toast.error("Erreur lors de la suppression");
          if (import.meta.env.DEV) {
            console.error(error);
          }
        }
      } else {
        // Modify existing attendance - RLS enforces admin-only access
        const { error } = await supabase
          .from("attendances")
          .delete()
          .eq("id", existingAttendance.id);

        if (error) {
          toast.error("Vous n'avez pas les permissions nécessaires");
          if (import.meta.env.DEV) {
            console.error(error);
          }
        } else {
          const { error: insertError } = await supabase.from("attendances").insert({
            member_id: memberId,
            date,
            status,
            created_by: user.id,
          });

          if (insertError) {
            toast.error("Erreur lors de la modification");
            if (import.meta.env.DEV) {
              console.error(insertError);
            }
          } else {
            toast.success("Présence modifiée");
          }
        }
      }
    } else {
      // Add new attendance
      const { error } = await supabase.from("attendances").insert({
        member_id: memberId,
        date,
        status,
        created_by: user.id,
      });

      if (error) {
        toast.error("Erreur lors de l'enregistrement");
        if (import.meta.env.DEV) {
          console.error(error);
        }
      } else {
        const statusText = 
          status === "present" ? "Présence enregistrée" : 
          status === "absent_justified" ? "Absence justifiée enregistrée" :
          "Absence non justifiée enregistrée";
        toast.success(statusText);
      }
    }
  };

  const handleShareModeToggle = (checked: boolean) => {
    setShareMode(checked);
    if (checked) {
      toast.success("Mode partage activé");
    }
  };

  const handleDeleteMember = async (memberId: string) => {
    // RLS enforces admin-only access
    const { error } = await supabase
      .from("members")
      .delete()
      .eq("id", memberId);

    if (error) {
      toast.error("Vous n'avez pas les permissions nécessaires");
      if (import.meta.env.DEV) {
        console.error(error);
      }
    } else {
      toast.success("Membre supprimé");
    }
  };

  const handleMarkPayment = async (memberId: string) => {
    if (!user) return;

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const member = transformedMembers.find((m) => m.id === memberId);
    if (!member) return;

    const hasPayment = member.payments.some((p) => {
      const paymentDate = new Date(p.date);
      return (
        paymentDate.getMonth() === currentMonth &&
        paymentDate.getFullYear() === currentYear
      );
    });

    if (hasPayment) {
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

    if (error) {
      toast.error("Vous n'avez pas les permissions nécessaires");
      if (import.meta.env.DEV) {
        console.error(error);
      }
    } else {
      toast.success("Cotisation enregistrée");
    }
  };

  if (loading || isLoadingData) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <p className="text-lg">Chargement...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

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
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container max-w-7xl mx-auto py-6 px-4">
        <header className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <ClipboardList className="h-8 w-8 md:h-10 md:w-10 text-primary" />
              <h1 className="text-2xl md:text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Gestion des Présences
              </h1>
            </div>
            <Button variant="outline" size="sm" onClick={signOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Déconnexion
            </Button>
          </div>
          <p className="text-muted-foreground text-sm md:text-lg mb-4">
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
              <div className="flex items-center gap-2 px-4 py-2 border border-border rounded-md bg-background/50">
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
