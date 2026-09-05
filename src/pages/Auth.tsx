import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from '@/lib/supabase';
import { toast } from "sonner";

export default function Auth() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("admin@institut.com");
  const [password, setPassword] = useState("admin123");
  const [loading, setLoading] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log("🔐 Tentative de connexion...");
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("❌ Erreur:", error);
        throw error;
      }

      console.log("✅ Connexion réussie:", data.user?.email);
      toast.success("Connexion réussie !");
      
      // ⚠️ REDIRECTION MANUELLE EXPLICITE vers la sélection d'institut
      setTimeout(() => {
        navigate("/select", { replace: true });
      }, 1000);
      
    } catch (error: any) {
      console.error("💥 Erreur complète:", error);
      toast.error(error.message || "Erreur de connexion");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg border-slate-200">
        <CardHeader className="text-center space-y-4">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl flex items-center justify-center mx-auto">
            <span className="text-white font-bold text-2xl">GM</span>
          </div>
          <div>
            <CardTitle className="text-3xl text-slate-900">Connexion</CardTitle>
            <CardDescription className="text-slate-600 text-lg mt-2">
              Entrez vos identifiants
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSignIn} className="space-y-5">
            <div className="space-y-3">
              <Label htmlFor="email" className="text-slate-700 text-base">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@institut.com"
                required
                className="h-12 text-base border-slate-300 focus:border-blue-500"
              />
            </div>
            
            <div className="space-y-3">
              <Label htmlFor="password" className="text-slate-700 text-base">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Votre mot de passe"
                required
                className="h-12 text-base border-slate-300 focus:border-blue-500"
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full h-12 text-base bg-blue-600 hover:bg-blue-700 text-white font-semibold"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Connexion...
                </div>
              ) : (
                "Se connecter"
              )}
            </Button>
          </form>

          <div className="mt-8 p-4 bg-blue-50 rounded-xl border border-blue-200">
            <h4 className="font-semibold text-blue-900 mb-3 text-center">Compte de test</h4>
            <div className="text-sm text-blue-700 space-y-1 text-center">
              <p><strong>Email:</strong> admin@institut.com</p>
              <p><strong>Mot de passe:</strong> admin123</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}