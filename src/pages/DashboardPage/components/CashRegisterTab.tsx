import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ChevronLeft, ChevronRight, Euro, Download, Search, Info } from "lucide-react";
import { supabase } from '@/lib/supabase';
import { format, addDays, subDays } from "date-fns";
import { fr } from "date-fns/locale";
import type { Member } from "@/types/member";

const DEFAULT_FEE = 20;

interface CashRegisterTabProps {
  members: Member[];
}

interface PaymentRecord {
  id: string;
  member_id: string;
  amount: number;
  payment_date: string;
  created_at: string | null;
  member_first_name?: string;
  member_last_name?: string;
}

export const CashRegisterTab = ({ members }: CashRegisterTabProps) => {
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const dateStr = format(selectedDate, "yyyy-MM-dd");
  const dateLabel = format(selectedDate, "EEEE d MMMM yyyy", { locale: fr });

  useEffect(() => {
    const loadPayments = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("payments")
          .select("id, member_id, amount, payment_date, created_at")
          .eq("payment_date", dateStr)
          .order("created_at", { ascending: true });

        if (error) throw error;
        setPayments(data || []);
      } catch (err) {
        console.error("❌ Erreur chargement encaissements:", err);
        setPayments([]);
      }
      setLoading(false);
    };
    loadPayments();
  }, [dateStr]);

  const memberMap = useMemo(() => {
    const map = new Map<string, Member>();
    members.forEach((m) => map.set(m.id, m));
    return map;
  }, [members]);

  const displayAmount = (amount: number | null | undefined) => {
    if (amount && amount > 0) return amount;
    return DEFAULT_FEE;
  };

  const enrichedPayments = useMemo(() => {
    return payments.map((p) => {
      const member = memberMap.get(p.member_id);
      return {
        ...p,
        amount: displayAmount(p.amount),
        member_first_name: member?.firstName || "Inconnu",
        member_last_name: member?.lastName || p.member_id.slice(0, 8),
      };
    });
  }, [payments, memberMap]);

  const filteredPayments = useMemo(() => {
    if (!searchQuery) return enrichedPayments;
    const q = searchQuery.toLowerCase();
    return enrichedPayments.filter(
      (p) =>
        p.member_first_name.toLowerCase().includes(q) ||
        p.member_last_name.toLowerCase().includes(q)
    );
  }, [enrichedPayments, searchQuery]);

  const dailyTotal = useMemo(
    () => enrichedPayments.reduce((sum, p) => sum + p.amount, 0),
    [enrichedPayments]
  );

  const hasNullAmounts = useMemo(
    () => payments.some((p) => !p.amount || p.amount === 0),
    [payments]
  );

  // Navigation par séance (saut de 7 jours = même jour de semaine)
  const goToPrevSession = () => setSelectedDate((d) => subDays(d, 7));
  const goToNextSession = () => setSelectedDate((d) => addDays(d, 7));
  const goToToday = () => setSelectedDate(new Date());

  const dayName = format(selectedDate, "EEEE", { locale: fr });

  const handleExportCSV = () => {
    const header = "Date;Membre;Montant (€);Heure";
    const rows = enrichedPayments.map((p) => {
      const time = p.created_at
        ? format(new Date(p.created_at), "HH:mm")
        : "";
      return `${dateStr};${p.member_last_name} ${p.member_first_name};${p.amount};${time}`;
    });
    const csv = [header, ...rows, `;;Total;${dailyTotal}€`].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `encaissements-${dateStr}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const isToday =
    format(selectedDate, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-3 text-xl">
            <Euro className="h-6 w-6 text-emerald-600" />
            Encaissements journaliers
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={enrichedPayments.length === 0}>
              <Download className="h-4 w-4 mr-1" />
              CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-6">
            <Button variant="ghost" size="icon" onClick={goToPrevSession} title={`${dayName} précédent`}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              <span className="text-lg font-semibold capitalize">{dateLabel}</span>
              {!isToday && (
                <Button variant="outline" size="sm" onClick={goToToday}>
                  Aujourd'hui
                </Button>
              )}
            </div>
            <Button variant="ghost" size="icon" onClick={goToNextSession} title={`${dayName} suivant`}>
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>

          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Rechercher par nom..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-500">Total du jour</p>
              <p className="text-2xl font-bold text-emerald-600">{dailyTotal}€</p>
            </div>
          </div>

          {hasNullAmounts && (
            <div className="flex items-center gap-2 px-4 py-2 mb-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
              <Info className="h-4 w-4 flex-shrink-0" />
              Certains anciens paiements sans montant enregistré sont comptés à {DEFAULT_FEE}€ par défaut
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="text-center py-10 text-slate-500">
              <Euro className="h-12 w-12 mx-auto mb-3 text-slate-300" />
              <p className="font-medium">
                {searchQuery
                  ? "Aucun encaissement trouvé pour cette recherche"
                  : `Aucun encaissement enregistré pour le ${dateLabel}`}
              </p>
              {!searchQuery && (
                <p className="text-sm text-slate-400 mt-1">
                  Marque les présences dans l'onglet Élèves pour enregistrer les paiements
                </p>
              )}
            </div>
          ) : (
            <div className="border rounded-xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b">
                    <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">Membre</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">Montant</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">Heure</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.map((p) => (
                    <tr key={p.id} className="border-b last:border-0 hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-medium">
                          {p.member_last_name?.toUpperCase()} {p.member_first_name}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                          {p.amount}€
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-500">
                        {p.created_at
                          ? format(new Date(p.created_at), "HH:mm")
                          : "--"}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-emerald-50 font-semibold">
                    <td className="px-4 py-3 text-emerald-800">{filteredPayments.length} encaissement{filteredPayments.length > 1 ? "s" : ""}</td>
                    <td className="px-4 py-3 text-emerald-800">{dailyTotal}€</td>
                    <td className="px-4 py-3" />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
