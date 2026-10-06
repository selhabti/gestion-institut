import {
  LogOut,
  Shield,
  ShieldOff,
  ArrowLeftRight,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { getCurrentInstitut } from "@/lib/institutes";
import { useStaff } from "@/hooks/useStaff";

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
  const { isSuperAdmin } = useStaff();
  const base = import.meta.env.BASE_URL || "/";

  return (
    <motion.header
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 320, damping: 32 }}
      className="sticky top-0 z-50 bg-white/85 backdrop-blur-xl border-b border-slate-200/70"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between gap-4">
          {/* Logo + noms */}
          <div className="flex items-center gap-3 min-w-0">
            {institut?.logoUrl ? (
              <img
                src={institut.logoUrl}
                alt="Logo"
                className="h-12 w-12 rounded-xl object-cover ring-1 ring-black/5 shadow-sm"
              />
            ) : (
              <div className="h-12 w-12 rounded-xl bg-slate-100 ring-1 ring-slate-200 flex items-center justify-center text-slate-400">
                <BookOpen className="h-6 w-6" />
              </div>
            )}
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold leading-none">
                Institut Manager
              </p>
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 truncate leading-tight">
                {institut?.name || "Institut"}
              </h1>
              <p className="text-xs text-slate-500 truncate">{user?.email}</p>
            </div>
          </div>

          {/* Bannière (desktop, uniquement si l'institut a un logo) */}
          {institut?.logoUrl && (
            <img
              src={base + "Institut_logo.webp"}
              alt="Institut"
              className="hidden lg:block h-12 w-auto opacity-90 select-none"
            />
          )}

          {/* Actions */}
          <div className="flex items-center gap-2">
            {extraAction && <div className="hidden sm:block">{extraAction}</div>}

            <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/60">
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

            {isSuperAdmin && (
              <Button
                onClick={() => navigate("/select")}
                variant="outline"
                size="sm"
                className="border-slate-200 text-slate-700 hover:bg-slate-100"
                title="Changer d'institut"
              >
                <ArrowLeftRight className="h-4 w-4 mr-1.5" />
                <span className="hidden sm:inline">Changer d'institut</span>
              </Button>
            )}

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
