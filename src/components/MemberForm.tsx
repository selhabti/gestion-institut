import React, { useState } from "react";
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
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { GroupType } from "@/types/member";

// Définir l'interface des props
interface MemberFormProps {
  onAddMember: (
    firstName: string,
    lastName: string,
    city: string,
    group: GroupType
  ) => Promise<void>;
}

const MemberForm: React.FC<MemberFormProps> = ({ onAddMember }) => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [city, setCity] = useState("");
  const [group, setGroup] = useState<GroupType>("Samedi");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!firstName.trim() || !lastName.trim()) {
      toast.error("Veuillez remplir le prénom et le nom");
      return;
    }

    setIsLoading(true);
    setError(null);
    setIsSuccess(false);

    try {
      await onAddMember(firstName.trim(), lastName.trim(), city.trim(), group);

      // Succès
      setIsSuccess(true);
      toast.success(`Élève ${firstName} ${lastName} ajouté avec succès !`);

      // Reset form after successful submission
      setFirstName("");
      setLastName("");
      setCity("");
      setGroup("Samedi");

      // Réinitialiser le statut de succès après 3 secondes
      setTimeout(() => {
        setIsSuccess(false);
      }, 3000);
    } catch (error) {
      console.error("Error adding member:", error);
      const errorMessage = "Erreur lors de l'ajout de l'élève";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const getGroupDisplayName = (group: GroupType) => {
    switch (group) {
      case "Samedi":
        return "Groupe Samedi";
      case "Dimanche":
        return "Groupe Dimanche";
      case "Lundi":
        return "La méthode Nouraniya";
      default:
        return group;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Ajouter un élève
          {isSuccess && <CheckCircle className="h-5 w-5 text-green-500" />}
        </CardTitle>
        <CardDescription>
          Enregistrez un nouvel élève dans l'institut en remplissant le
          formulaire ci-dessous.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Message de succès */}
        {isSuccess && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm font-medium">
              Élève ajouté avec succès au {getGroupDisplayName(group)} !
            </span>
          </div>
        )}

        {/* Message d'erreur */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">Prénom *</Label>
            <Input
              id="firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Prénom"
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lastName">Nom *</Label>
            <Input
              id="lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Nom"
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="city">Ville</Label>
            <Input
              id="city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Ville"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="group">Groupe *</Label>
            <Select
              value={group}
              onValueChange={(value: GroupType) => setGroup(value)}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez un groupe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Samedi">Groupe Samedi</SelectItem>
                <SelectItem value="Dimanche">Groupe Dimanche</SelectItem>
                <SelectItem value="Lundi">La méthode Nouraniya</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading || !firstName.trim() || !lastName.trim()}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Ajout en cours...
              </>
            ) : (
              "Ajouter l'élève"
            )}
          </Button>

          {/* Indicateur de statut */}
          <div className="text-xs text-slate-500 text-center">
            {isLoading && "Connexion à la base de données..."}
            {isSuccess && "✓ Données sauvegardées avec succès"}
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default MemberForm;
