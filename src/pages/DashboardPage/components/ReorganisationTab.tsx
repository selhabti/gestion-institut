// src/pages/DashboardPage/components/ReorganisationTab.tsx
import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, RefreshCw } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import type { Member } from "@/types/member";

interface ReorganisationTabProps {
  members: Member[];
}

export const ReorganisationTab = ({ members }: ReorganisationTabProps) => {
  const [loading, setLoading] = useState(false);

  const samediMembers = members.filter(
    (m) => m.group === "Samedi" || (m.secondaryGroups || []).includes("Samedi")
  );

  const transfer = async () => {
    if (
      !confirm(
        `Transférer ${samediMembers.length} élève(s) du groupe Samedi vers le groupe Jeudi ?`
      )
    ) {
      return;
    }

    setLoading(true);
    try {
      // 1) Groupe principal : Samedi → Jeudi
      const { error: e1 } = await supabase
        .from("members")
        .update({ group_type: "Jeudi" })
        .eq("group_type", "Samedi");
      if (e1) throw e1;

      // 2) Groupes secondaires : retirer Samedi, ajouter Jeudi
      for (const m of members) {
        const sec = m.secondaryGroups || [];
        if (sec.includes("Samedi")) {
          const next = Array.from(
            new Set([...sec.filter((g) => g !== "Samedi"), "Jeudi"])
          );
          const { error } = await supabase
            .from("members")
            .update({ secondary_groups: next })
            .eq("id", m.id);
          if (error) throw error;
        }
      }

      toast.success("Transfert effectué avec succès");
      setTimeout(() => window.location.reload(), 800);
    } catch (error) {
      console.error("Erreur transfert:", error);
      toast.error("Erreur lors du transfert");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Réorganisation — Samedi → Jeudi</CardTitle>
        <CardDescription>
          Transfère les élèves du groupe Samedi vers le nouveau groupe Jeudi
          (18h30 – 20h00). Le groupe Samedi n'existera plus pour Zayed.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex items-center gap-3 flex-wrap">
          <Badge variant="outline" className="text-sm">
            Samedi : {samediMembers.length} élève(s)
          </Badge>
          <ArrowRight className="h-4 w-4 text-slate-400" />
          <Badge className="bg-cyan-600 text-white text-sm">Jeudi</Badge>
        </div>

        <Button
          onClick={transfer}
          disabled={loading || samediMembers.length === 0}
          className="bg-cyan-600 hover:bg-cyan-700"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          {loading ? "Transfert en cours…" : "Transférer Samedi → Jeudi"}
        </Button>

        {samediMembers.length > 0 && (
          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr className="text-left text-slate-500">
                  <th className="px-3 py-2 font-medium">Élève</th>
                  <th className="px-3 py-2 font-medium">Groupe actuel</th>
                </tr>
              </thead>
              <tbody>
                {samediMembers.map((m) => (
                  <tr key={m.id} className="border-t border-slate-100">
                    <td className="px-3 py-2">
                      {m.lastName.toUpperCase()} {m.firstName}
                    </td>
                    <td className="px-3 py-2">
                      <Badge variant="outline">Samedi</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ReorganisationTab;
