// src/components/members/RegistrationForm.tsx
import { useState } from "react";
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
import type { GroupType } from "@/types/member";
import { z } from "zod";

const studentRegistrationSchema = z.object({
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
  phone: z
    .string()
    .trim()
    .min(8, { message: "Le numéro de téléphone doit contenir au moins 8 caractères" })
    .max(20, { message: "Le numéro de téléphone est trop long (max 20 caractères)" })
    .regex(/^[0-9+\s().-]+$/, {
      message: "Le numéro de téléphone contient des caractères invalides",
    }),
  email: z
    .string()
    .trim()
    .email({ message: "L'adresse email est invalide" })
    .max(255, { message: "L'adresse email est trop longue" })
    .or(z.literal("")),
});

export interface RegistrationData {
  firstName: string;
  lastName: string;
  city: string;
  phone: string;
  email: string;
  group: GroupType;
}

interface RegistrationFormProps {
  onSubmit: (data: RegistrationData) => Promise<void>;
  title?: string;
  description?: string;
  submitLabel?: string;
  initialGroup?: GroupType;
}

export const RegistrationForm = ({
  onSubmit,
  title = "Inscription Élève",
  description = "Inscrivez-vous en remplissant le formulaire ci-dessous",
  submitLabel = "S'inscrire",
  initialGroup = "Samedi",
}: RegistrationFormProps) => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [group, setGroup] = useState<GroupType>(initialGroup);
  const [isLoading, setIsLoading] = useState(false);

  const resetForm = () => {
    setFirstName("");
    setLastName("");
    setCity("");
    setPhone("");
    setEmail("");
    setGroup(initialGroup);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = studentRegistrationSchema.safeParse({
      firstName,
      lastName,
      city,
      phone,
      email,
    });

    if (!result.success) {
      toast.error(result.error.errors[0].message);
      return;
    }

    setIsLoading(true);

    try {
      await onSubmit({
        firstName: result.data.firstName,
        lastName: result.data.lastName,
        city: result.data.city,
        phone: result.data.phone,
        email: result.data.email || "",
        group,
      });
      resetForm();
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("Error:", error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reg-firstName">Prénom</Label>
            <Input
              id="reg-firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Votre prénom"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reg-lastName">Nom</Label>
            <Input
              id="reg-lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Votre nom"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reg-city">Ville</Label>
            <Input
              id="reg-city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Votre ville"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reg-phone">Téléphone *</Label>
            <Input
              id="reg-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Votre numéro de téléphone"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reg-email">Email</Label>
            <Input
              id="reg-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Votre adresse email (optionnel)"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reg-group">Groupe</Label>
            <Select
              value={group}
              onValueChange={(value) => setGroup(value as GroupType)}
              disabled={isLoading}
            >
              <SelectTrigger id="reg-group">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Samedi">Samedi</SelectItem>
                <SelectItem value="Dimanche">Dimanche</SelectItem>
                <SelectItem value="Lundi">La méthode Nouraniya</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading || !phone.trim()}
          >
            {isLoading ? "Inscription..." : submitLabel}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default RegistrationForm;
