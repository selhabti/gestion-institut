//path: src/pages/StudentRegistration.tsx

import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import {
  RegistrationForm,
  type RegistrationData,
} from "@/components/members/RegistrationForm";

export default function StudentRegistration() {
  const navigate = useNavigate();

  const handleRegister = async (data: RegistrationData) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      toast.error("Vous devez être connecté");
      throw new Error("Not authenticated");
    }

    const { error } = await supabase.from("members").insert({
      first_name: data.firstName,
      last_name: data.lastName,
      city: data.city,
      phone: data.phone,
      email: data.email || null,
      group_type: data.group,
      created_by: user.id,
    });

    if (error) throw error;

    toast.success("Inscription réussie !");
    navigate("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-secondary/20">
      <RegistrationForm onSubmit={handleRegister} />
    </div>
  );
}
