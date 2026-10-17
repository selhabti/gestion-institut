// src/pages/LoginChoice.tsx
import { useNavigate } from "react-router-dom";
import { School, ArrowRight, BookOpen } from "lucide-react";
import {
  getInstitutList,
  setCurrentInstitut,
  type InstitutId,
} from "@/lib/institutes";

export default function LoginChoice() {
  const navigate = useNavigate();
  const instituts = getInstitutList();

  const go = (id: InstitutId) => {
    setCurrentInstitut(id);
    navigate(`/${id}/auth`);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-4xl">
        {/* Titre */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center p-4 rounded-3xl bg-primary text-white shadow-lg mb-4">
            <School className="h-10 w-10" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">
            Connexion
          </h1>
          <p className="text-slate-500 mt-2">
            Choisissez votre institut pour vous connecter.
          </p>
        </div>

        {/* Cartes instituts */}
        {instituts.length > 0 ? (
          <div
            className={`grid gap-5 ${
              instituts.length > 1 ? "sm:grid-cols-2" : "sm:grid-cols-1 sm:max-w-md sm:mx-auto"
            }`}
          >
            {instituts.map((c) => (
              <button
                key={c.id}
                onClick={() => go(c.id)}
                className="group bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all p-7 text-left"
              >
                <div className="flex items-center gap-4 mb-5">
                  {c.logoUrl ? (
                    <img
                      src={c.logoUrl}
                      alt={c.name}
                      className="h-14 w-14 rounded-2xl object-cover ring-1 ring-black/5 shadow-sm"
                    />
                  ) : (
                    <div className="h-14 w-14 rounded-2xl bg-slate-100 ring-1 ring-slate-200 flex items-center justify-center text-slate-400">
                      <BookOpen className="h-7 w-7" />
                    </div>
                  )}
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">
                      {c.name}
                    </h2>
                    <p className="text-xs text-slate-400 font-mono">
                      /{c.id}/auth
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-primary font-semibold text-sm group-hover:gap-3 transition-all">
                  Se connecter
                  <ArrowRight className="h-4 w-4" />
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="p-6 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 font-medium text-center">
            Aucun institut configuré. Renseignez les variables{" "}
            VITE_INSTITUT_*_AUTH_URL / VITE_INSTITUT_*_DATA_API_URL.
          </div>
        )}

        <p className="text-center text-xs text-slate-400 mt-8">
          URL directe : <code>/zayed/auth</code> ou <code>/attanzil/auth</code>
        </p>
      </div>
    </div>
  );
}
