import { LogOut, Shield, ShieldOff, School } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";

type AppHeaderProps = {
  user: any;
  shareMode: boolean;
  onShareModeChange: (checked: boolean) => void;
  onSignOut: () => void;
  extraAction?: React.ReactNode; // ← Ajoutez cette ligne
};

export const AppHeader = ({
  user,
  shareMode,
  onShareModeChange,
  onSignOut,
  extraAction, // ← Ajoutez cette ligne
}: AppHeaderProps) => {
  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="sticky top-0 z-50 
             backdrop-blur-xl 
             bg-gradient-to-r from-indigo-600/90 via-purple-600/90 to-indigo-700/90 
             border-b border-white/10 
             shadow-2xl
             rounded-b-3xl               /* ← coins arrondis en bas */
             overflow-hidden
             border       /* ← contour noir ultra-fin tout autour */"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between gap-6">
          {/* GAUCHE — Logo petit + Titre */}
          <div className="flex items-center gap-4 flex-shrink-0">
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              className="relative"
            >
              <div className="absolute inset-0 bg-white/30 rounded-2xl blur-xl scale-150 -z-10" />
              <div className="bg-white/20 backdrop-blur-md p-3 rounded-2xl border border-white/30">
                <img
                  src="/coran.png"
                  alt="Logo"
                  className="h-10 w-10 rounded-lg shadow-lg"
                />
              </div>
            </motion.div>

            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                <span className="bg-gradient-to-r from-white via-indigo-100 to-white bg-clip-text text-transparent">
                  Institut Manager
                </span>
              </h1>
              <p className="text-white/70 text-sm font-medium">{user?.email}</p>
            </div>
          </div>

          {/* CENTRE — TON LOGO BANNER (2286×492) */}
          <div className="hidden md:block flex-1 max-w-4xl mx-8">
            <div className="relative">
              {/* Ombre douce + glow */}
              <div className="absolute inset-0 bg-white/20 rounded-3xl blur-3xl scale-105 -z-10" />

              <img
                src="/Institut_logo.webp"
                alt="Institut Al-Qur'an"
                className="w-full h-auto rounded-2xl shadow-2xl border-4 border-black/30"
                style={{
                  objectFit: "contain",
                  objectPosition: "center",
                }}
              />
            </div>
          </div>

          {/* DROITE — Extra Action + Switch + Déconnexion */}
          <div className="flex items-center gap-4 flex-shrink-0">
            {/* Action supplémentaire */}
            {extraAction && (
              <div className="hidden sm:block">{extraAction}</div>
            )}

            <div className="flex items-center gap-3 px-4 py-2.5 bg-white/10 backdrop-blur-md rounded-xl border border-white/20">
              {shareMode ? (
                <ShieldOff className="h-5 w-5 text-orange-300" />
              ) : (
                <Shield className="h-5 w-5 text-emerald-300" />
              )}
              <Switch
                id="share-mode"
                checked={shareMode}
                onCheckedChange={(newValue) => {
                  console.log(
                    "🟡 Tentative de changement shareMode:",
                    newValue
                  ); // AJOUTER CECI
                  onShareModeChange(newValue);
                }}
                className="data-[state=checked]:bg-emerald-400"
              />
              <Label
                htmlFor="share-mode"
                className="text-white/90 font-medium text-sm cursor-pointer select-none"
              >
                {shareMode ? "Partagé" : "Privé"}
              </Label>
            </div>

            <Button
              onClick={onSignOut}
              variant="ghost"
              size="sm"
              className="bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white hover:text-white rounded-xl"
            >
              <LogOut className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Déconnexion</span>
            </Button>
          </div>
        </div>

        {/* Version mobile : logo banner en dessous */}
        <div className="md:hidden mt-6 px-8">
          <img
            src="/salem_logo.webp"
            alt="Salem"
            className="w-full h-auto rounded-2xl shadow-2xl border-4 border-white/20"
          />
        </div>
      </div>
    </motion.header>
  );
};
