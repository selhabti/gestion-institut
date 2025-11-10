import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ClipboardList } from "lucide-react";
import { z } from "zod";

const signUpSchema = z.object({
  email: z.string().trim().email({ message: "Email invalide" }).max(255, { message: "Email trop long" }),
  password: z.string().min(8, { message: "Minimum 8 caractères" }).max(100, { message: "Mot de passe trop long" }),
  firstName: z.string().trim().min(1, { message: "Prénom requis" }).max(100, { message: "Prénom trop long" }),
  lastName: z.string().trim().min(1, { message: "Nom requis" }).max(100, { message: "Nom trop long" })
});

const signInSchema = z.object({
  email: z.string().trim().email({ message: "Email invalide" }).max(255, { message: "Email trop long" }),
  password: z.string().min(1, { message: "Mot de passe requis" }).max(100, { message: "Mot de passe trop long" })
});

export default function Auth() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("signup-email") as string;
    const password = formData.get("signup-password") as string;
    const firstName = formData.get("first-name") as string;
    const lastName = formData.get("last-name") as string;

    const result = signUpSchema.safeParse({ email, password, firstName, lastName });
    
    if (!result.success) {
      toast.error(result.error.errors[0].message);
      setIsLoading(false);
      return;
    }

    const { error } = await supabase.auth.signUp({
      email: result.data.email,
      password: result.data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: {
          first_name: result.data.firstName,
          last_name: result.data.lastName,
        },
      },
    });

    setIsLoading(false);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Compte créé avec succès!");
      navigate("/");
    }
  };

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("signin-email") as string;
    const password = formData.get("signin-password") as string;

    const result = signInSchema.safeParse({ email, password });
    
    if (!result.success) {
      toast.error(result.error.errors[0].message);
      setIsLoading(false);
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: result.data.email,
      password: result.data.password,
    });

    setIsLoading(false);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Connexion réussie!");
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-elegant">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-3 mb-3">
            <ClipboardList className="h-10 w-10 text-primary" />
            <CardTitle className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Gestion des Présences
            </CardTitle>
          </div>
          <CardDescription>
            Suivez les présences et cotisations de vos groupes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Connexion</TabsTrigger>
              <TabsTrigger value="signup">Inscription</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    name="signin-email"
                    type="email"
                    placeholder="votre@email.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Mot de passe</Label>
                  <Input
                    id="signin-password"
                    name="signin-password"
                    type="password"
                    placeholder="••••••••"
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Connexion..." : "Se connecter"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="first-name">Prénom</Label>
                    <Input
                      id="first-name"
                      name="first-name"
                      placeholder="Votre prénom"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last-name">Nom</Label>
                    <Input
                      id="last-name"
                      name="last-name"
                      placeholder="Votre nom"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    name="signup-email"
                    type="email"
                    placeholder="votre@email.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Mot de passe</Label>
                  <Input
                    id="signup-password"
                    name="signup-password"
                    type="password"
                    placeholder="••••••••"
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Inscription..." : "S'inscrire"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
