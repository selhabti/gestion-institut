import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { registerStaff } from "@/hooks/useStaff";
import {
  INSTITUTS,
  getCurrentInstitut,
  getInstitutList,
  setCurrentInstitut,
  type InstitutId,
} from "@/lib/institutes";

export default function StaffRegistration() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const instituts = getInstitutList();
  const [institutId, setInstitutId] = useState<InstitutId | null>(
    getCurrentInstitut()?.id ?? (instituts.length === 1 ? instituts[0].id : null)
  );

  const currentInstitut = institutId ? INSTITUTS[institutId] : null;

  const handlePickInstitut = (id: InstitutId) => {
    setCurrentInstitut(id);
    setInstitutId(id);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!institutId) {
      toast.error("Veuillez d'abord choisir l'institut.");
      return;
    }
    if (!name.trim()) {
      toast.error("Le nom est requis");
      return;
    }
    if (password.length < 8) {
      toast.error("Le mot de passe doit contenir au moins 8 caractères");
      return;
    }

    setIsLoading(true);
    try {
      const { role, needsEmailConfirmation } = await registerStaff(
        name.trim(),
        email.trim(),
        password
      );

      if (needsEmailConfirmation) {
        toast.success("Compte créé", {
          description:
            "Vérifiez votre email pour activer le compte, puis connectez-vous.",
        });
        navigate("/auth");
        return;
      }

      toast.success(
        role === "super_admin"
          ? "Compte super administrateur créé !"
          : "Compte créé !",
        {
          description: `Institut : ${currentInstitut?.name} — vous êtes connecté.`,
        }
      );
      navigate("/select");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erreur lors de l'inscription";
      toast.error(message, {
        description: currentInstitut
          ? `Institut ciblé : ${currentInstitut.name}`
          : undefined,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 to-indigo-50">
      <Card className="w-full max-w-md shadow-lg border-slate-200">
        <CardHeader>
          <CardTitle>Créer un compte staff</CardTitle>
          <CardDescription>
            Le premier compte d'un institut devient super administrateur. Les
            suivants sont gestionnaires.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Institut</Label>
              {instituts.length > 1 ? (
                <div className="flex flex-wrap gap-2">
                  {instituts.map((c) => (
                    <Button
                      key={c.id}
                      type="button"
                      size="sm"
                      variant={institutId === c.id ? "default" : "outline"}
                      onClick={() => handlePickInstitut(c.id)}
                    >
                      {c.name}
                    </Button>
                  ))}
                </div>
              ) : (
                <Badge variant="outline" className="text-sm">
                  {instituts[0]?.name ?? "Aucun institut configuré"}
                </Badge>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="staff-name">Nom complet</Label>
              <Input
                id="staff-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Saïd / Takoua"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="staff-email">Email</Label>
              <Input
                id="staff-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="prenom@institut.com"
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="staff-password">Mot de passe</Label>
              <Input
                id="staff-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Au moins 8 caractères"
                required
                disabled={isLoading}
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || !institutId}
            >
              {isLoading
                ? "Création..."
                : `Créer le compte${currentInstitut ? ` — ${currentInstitut.name}` : ""}`}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => navigate("/auth")}
              className="text-sm text-slate-500 hover:text-indigo-600 underline"
            >
              J'ai déjà un compte — se connecter
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
