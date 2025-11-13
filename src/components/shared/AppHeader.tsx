import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Shield, ShieldOff, LogOut, Users } from "lucide-react";

interface AppHeaderProps {
  user: any;
  shareMode: boolean;
  onShareModeChange: (checked: boolean) => void;
  onSignOut: () => void;
}

export const AppHeader = ({ user, shareMode, onShareModeChange, onSignOut }: AppHeaderProps) => {
  return (
    <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-blue-600 to-purple-600 p-2 rounded-xl">
              <Users className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Gestion Institut</h1>
              <p className="text-slate-600 text-xs sm:text-sm">{user.email}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 rounded-lg">
              {shareMode ? (
                <ShieldOff className="h-4 w-4 text-orange-500" />
              ) : (
                <Shield className="h-4 w-4 text-green-500" />
              )}
              <Switch
                id="share-mode"
                checked={shareMode}
                onCheckedChange={onShareModeChange}
              />
              <Label htmlFor="share-mode" className="text-sm text-slate-700 cursor-pointer whitespace-nowrap">
                {shareMode ? "Partage activé" : "Partage désactivé"}
              </Label>
            </div>
            
            <Button 
              onClick={onSignOut}
              variant="outline" 
              size="sm"
              className="border-slate-300 text-xs sm:text-sm"
            >
              <LogOut className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              Déconnexion
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};
