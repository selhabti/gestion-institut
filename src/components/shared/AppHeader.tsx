import { LogOut, Shield, ShieldOff, ArrowLeftRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { getCurrentInstitut } from "@/lib/institutes";

type AppHeaderProps = {
  user: any;
  shareMode: boolean;
  onShareModeChange: (checked: boolean) => void;
  onSignOut: () => void;
  extraAction?: React.ReactNode;
};

export const AppHeader = ({
  user,
  shareMode,
  onShareModeChange,
  onSignOut,
  extraAction,
}: AppHeaderProps) => {
  const navigate = useNavigate();
  const institut = getCurrentInstitut();
  const base = import.meta.env.BASE_URL || "/";

  return (
    <motion.header
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 320, damping: 32 }}
      className="sticky top-0 z-50 bg-white/85 backdrop-blur-xl border-b border-slate-200/70"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo + noms */}
          <div className="flex items-center gap-3 min-w-0">
            <img
              src={base + "coran.png"}
              alt="Logo"
              className="h-9 w-9 rounded-xl object-cover ring-1 ring-black/5 shadow-sm"
            />
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold leading-none">
                Institut Manager
              </p>
              <h1 className="text-base sm:text-lg font-bold text-slate-900 truncate leading-tight">
                {institut?.name || "Institut"}
              </h1>
            </div>
          </div>

          {/* Bannière (desktop) */}
          <img
            src={base + "Institut_logo.webp"}
            alt="Institut"
            className="hidden lg:block h-9 w-auto opacity-90 select-none"
          />

          {/* Actions */}
          <div className="flex items-center gap-2">
            {extraAction && <div className="hidden sm:block">{extraAction}</div>}

            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50/60">
              {shareMode ? (
                <ShieldOff className="h-4 w-4 text-amber-500" />
              ) : (
                <Shield className="h-4 w-4 text-emerald-500" />
              )}
              <span className="text-xs font-medium text-slate-600">
                {shareMode ? "Partagé" : "Privé"}
              </span>
              <Switch
                id="share-mode"
                checked={shareMode}
                onCheckedChange={onShareModeChange}
                className="data-[state=checked]:bg-emerald-500 scale-90"
              />
            </div>

            <Button
              onClick={() => navigate("/select")}
              variant="ghost"
              size="sm"
              className="text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              title="Changer d'institut"
            >
              <ArrowLeftRight className="h-4 w-4 sm:mr-1.5" />
              <span className="hidden sm:inline">Changer</span>
            </Button>

            <Button
              onClick={onSignOut}
              variant="ghost"
              size="sm"
              className="text-slate-600 hover:text-red-600 hover:bg-red-50"
              title="Déconnexion"
            >
              <LogOut className="h-4 w-4 sm:mr-1.5" />
              <span className="hidden sm:inline">Déconnexion</span>
            </Button>
          </div>
        </div>
      </div>
    </motion.header>
  );
};

export default AppHeader;
