import { useNavigate } from "react-router-dom";
import { School, Landmark, ArrowRight, BookOpen } from "lucide-react";
import {
  INSTITUTS,
  getInstitutList,
  setCurrentInstitut,
  type InstitutId,
} from "@/lib/institutes";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const INSTITUT_ICONS: Record<InstitutId, any> = {
  zayed: Landmark,
  attanzil: BookOpen,
};

export default function SelectInstitutPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  const enabled = getInstitutList();

  const handleSelect = (id: InstitutId) => {
    const config = INSTITUTS[id];
    if (!config.url || !config.anonKey) {
      setError(
        `La configuration de ${config.name} est incomplète (URL/clé manquante dans .env).`
      );
      return;
    }
    setCurrentInstitut(id);
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-6">
      <div className="w-full max-w-4xl">
        {/* Titre */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center p-4 rounded-3xl bg-gradient-to-r from-indigo-600 to-purple-600 shadow-2xl mb-4">
            <School className="h-12 w-12 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-800">
            Institut Manager
          </h1>
          <p className="text-slate-500 mt-2 font-medium">
            Sélectionnez l'institut à gérer
          </p>
        </div>

        {/* Cards des instituts */}
        {enabled.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {enabled.map((config) => {
              const Icon = INSTITUT_ICONS[config.id];
              return (
                <button
                  key={config.id}
                  onClick={() => handleSelect(config.id)}
                  className="group relative bg-white rounded-3xl border p-8 text-left shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1 border-slate-200"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-lg">
                      <Icon className="h-8 w-8" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-800">
                      {config.name}
                    </h2>
                  </div>
                  <p className="text-slate-500 text-sm">
                    Connecté et prêt à l'emploi
                  </p>
                  <div className="mt-6 flex items-center gap-2 text-indigo-600 font-semibold text-sm group-hover:gap-3 transition-all">
                    Accéder
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="p-6 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 font-medium text-center">
            Aucun institut configuré. Renseignez les variables
            VITE_INSTITUT_*_URL / VITE_INSTITUT_*_ANON_KEY dans le fichier .env.
          </div>
        )}

        {error && (
          <div className="mt-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 font-medium text-center">
            {error}
          </div>
        )}

        <div className="mt-8 text-center">
          <Button
            variant="outline"
            onClick={() => navigate("/auth")}
            className="text-slate-500"
          >
            Page de connexion
          </Button>
        </div>
      </div>
    </div>
  );
}
