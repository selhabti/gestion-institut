// Path: src/components/MemberForm.tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { UserPlus, CheckCircle2, XCircle } from "lucide-react";
import { z } from "zod";
import { useMembers } from "@/hooks/useMembers";

const memberSchema = z.object({
  firstName: z.string()
    .trim()
    .min(1, { message: "Le prénom est requis" })
    .max(100, { message: "Le prénom est trop long (max 100 caractères)" })
    .transform(val => val.charAt(0).toUpperCase() + val.slice(1).toLowerCase()),
  lastName: z.string()
    .trim()
    .min(1, { message: "Le nom est requis" })
    .max(100, { message: "Le nom est trop long (max 100 caractères)" })
    .transform(val => val.charAt(0).toUpperCase() + val.slice(1).toLowerCase()),
  city: z.string()
    .trim()
    .min(1, { message: "La ville est requise" })
    .max(100, { message: "La ville est trop longue (max 100 caractères)" })
});

export function MemberForm() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [city, setCity] = useState("");
  const [group, setGroup] = useState<"Lundi" | "Samedi" | "Dimanche">("Samedi");
  const [isLoading, setIsLoading] = useState(false);
  const [lastCheck, setLastCheck] = useState<{name: string, exists: boolean} | null>(null);
  
  const { members, addMember } = useMembers();

  // Vérification en temps réel si le membre existe
  const checkMemberExists = (firstName: string, lastName: string, group: string) => {
    if (!firstName.trim() || !lastName.trim()) return null;
    
    const normalizedFirstName = firstName.toLowerCase().trim();
    const normalizedLastName = lastName.toLowerCase().trim();
    
    const exists = members.some(member => 
      member.first_name.toLowerCase().trim() === normalizedFirstName &&
      member.last_name.toLowerCase().trim() === normalizedLastName &&
      member.group_type === group
    );
    
    return exists;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setLastCheck(null);
    
    const result = memberSchema.safeParse({ firstName, lastName, city });
    
    if (!result.success) {
      toast.error(result.error.errors[0].message);
      setIsLoading(false);
      return;
    }

    const { firstName: formattedFirstName, lastName: formattedLastName, city: formattedCity } = result.data;

    try {
      await addMember({
        first_name: formattedFirstName,
        last_name: formattedLastName,
        city: formattedCity,
        group_type: group
      });

      toast.success("Membre ajouté avec succès!");
      setFirstName("");
      setLastName("");
      setCity("");
      setGroup("Samedi");
      setLastCheck(null);
      
    } catch (error: any) {
      console.error('Erreur:', error);
      
      if (error.message.includes("existe déjà")) {
        setLastCheck({
          name: `${formattedFirstName} ${formattedLastName}`,
          exists: true
        });
      }
      
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Vérification en temps réel
  const currentCheck = checkMemberExists(firstName, lastName, group);

  // Dans MemberForm.tsx - modifiez le retour JSX du formulaire
return (
  <Card className="shadow-sm border-slate-200">
    <CardHeader className="pb-4">
      <CardTitle className="flex items-center gap-2 text-slate-900">
        <UserPlus className="h-5 w-5 text-blue-600" />
        Nouveau Membre
      </CardTitle>
      <CardDescription className="text-slate-600">
        Ajouter un membre au groupe
      </CardDescription>
    </CardHeader>
    <CardContent>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="firstName" className="text-slate-700">Prénom</Label>
          <Input
            id="firstName"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="Entrez le prénom"
            disabled={isLoading}
            className="border-slate-300 focus:border-blue-500"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="lastName" className="text-slate-700">Nom</Label>
          <Input
            id="lastName"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Entrez le nom"
            disabled={isLoading}
            className="border-slate-300 focus:border-blue-500"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="city" className="text-slate-700">Ville</Label>
          <Input
            id="city"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Entrez la ville"
            disabled={isLoading}
            className="border-slate-300 focus:border-blue-500"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="group" className="text-slate-700">Groupe</Label>
          <Select value={group} onValueChange={(value: "Lundi" | "Samedi" | "Dimanche") => setGroup(value)} disabled={isLoading}>
            <SelectTrigger id="group" className="border-slate-300">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Lundi">Lundi</SelectItem>
              <SelectItem value="Samedi">Samedi</SelectItem>
              <SelectItem value="Dimanche">Dimanche</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Indicateur de vérification */}
        {firstName && lastName && (
          <div className={`p-3 rounded-lg text-sm flex items-center gap-2 ${
            currentCheck 
              ? 'bg-red-50 text-red-700 border border-red-200' 
              : 'bg-green-50 text-green-700 border border-green-200'
          }`}>
            {currentCheck ? (
              <>
                <XCircle className="h-4 w-4" />
                <span>Ce membre existe déjà dans le groupe {group}</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                <span>Ce membre peut être ajouté au groupe {group}</span>
              </>
            )}
          </div>
        )}
        
        <Button 
          type="submit" 
          className="w-full bg-blue-600 hover:bg-blue-700 text-white" 
          disabled={isLoading || currentCheck}
        >
          {isLoading ? "Ajout en cours..." : "Ajouter le membre"}
        </Button>
      </form>
    </CardContent>
  </Card>
);
}