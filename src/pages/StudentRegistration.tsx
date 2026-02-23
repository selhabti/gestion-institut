//path: src/pages/StudentRegistration.tsx

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from '@/lib/supabase';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { GroupType } from "@/types/member";
import { z } from "zod";

const studentSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(1, { message: "Le prénom est requis" })
    .max(100, { message: "Le prénom est trop long (max 100 caractères)" })
    .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, {
      message: "Le prénom contient des caractères invalides",
    }),
  lastName: z
    .string()
    .trim()
    .min(1, { message: "Le nom est requis" })
    .max(100, { message: "Le nom est trop long (max 100 caractères)" })
    .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, {
      message: "Le nom contient des caractères invalides",
    }),
  city: z
    .string()
    .trim()
    .min(1, { message: "La ville est requise" })
    .max(100, { message: "La ville est trop longue (max 100 caractères)" })
    .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, {
      message: "La ville contient des caractères invalides",
    }),
});

export default function StudentRegistration() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [city, setCity] = useState("");
  const [group, setGroup] = useState<GroupType>("Samedi");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = studentSchema.safeParse({ firstName, lastName, city });

    if (!result.success) {
      toast.error(result.error.errors[0].message);
      return;
    }

    setIsLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Vous devez être connecté");
        return;
      }

      const { error } = await supabase.from("members").insert({
        first_name: result.data.firstName,
        last_name: result.data.lastName,
        city: result.data.city,
        group_type: group,
        created_by: user.id,
      });

      if (error) throw error;

      toast.success("Inscription réussie !");
      navigate("/");
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("Error:", error);
      }
      toast.error("Erreur lors de l'inscription");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-secondary/20">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Inscription Élève</CardTitle>
          <CardDescription>
            Inscrivez-vous en remplissant le formulaire ci-dessous
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">Prénom</Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Votre prénom"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">Nom</Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Votre nom"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">Ville</Label>
              <Input
                id="city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Votre ville"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="group">Groupe</Label>
              <Select
                value={group}
                onValueChange={(value) => setGroup(value as GroupType)}
              >
                <SelectTrigger id="group">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Samedi">Samedi</SelectItem>
                  <SelectItem value="Dimanche">Dimanche</SelectItem>
                  <SelectItem value="Lundi">La méthode Nouraniya</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Inscription..." : "S'inscrire"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
