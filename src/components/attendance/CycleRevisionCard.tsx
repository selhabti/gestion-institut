import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Check,
  ChevronDown,
  ChevronUp,
  RefreshCw,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  pendingCycleInfo,
  revisionCategory,
  useMemorizationCycles,
  type RevisionCategory,
} from "@/hooks/useMemorizationCycles";
import type { MemorizationPlan } from "@/hooks/useMemorizationPlan";
import type { MemorizationEntry } from "@/types/member";

const CATEGORY_LABELS: Record<RevisionCategory, string> = {
  nouvelle: "Nouvelle",
  recente: "Récente",
  ancienne: "Ancienne",
  tres_ancienne: "Très ancienne",
};

const CATEGORY_CLASS: Record<RevisionCategory, string> = {
  nouvelle: "bg-indigo-100 text-indigo-700 border-indigo-200",
  recente: "bg-emerald-100 text-emerald-700 border-emerald-200",
  ancienne: "bg-amber-100 text-amber-700 border-amber-200",
  tres_ancienne: "bg-rose-100 text-rose-700 border-rose-200",
};

const CATEGORY_ORDER: RevisionCategory[] = [
  "nouvelle",
  "recente",
  "ancienne",
  "tres_ancienne",
];

type CyclePart = Pick<
  MemorizationEntry,
  | "id"
  | "week_start"
  | "quantity"
  | "surah_from"
  | "ayah_from"
  | "surah_to"
  | "ayah_to"
  | "status"
  | "validated"
>;

interface CycleRevisionCardProps {
  memberId: string;
  plan: MemorizationPlan | null;
  entries: MemorizationEntry[];
  enabled: boolean;
}

const formatDate = (value: string) =>
  new Date(value + "T00:00:00").toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const formatPosition = (part: CyclePart) => {
  if (!part.surah_from) return part.quantity || "—";
  const from = `${part.surah_from}${
    part.ayah_from ? ` ${part.ayah_from}` : ""
  }`;
  const to = part.ayah_to ? ` → ${part.ayah_to}` : "";
  return `${from}${to}`;
};

const daysLabel = (days: number) => {
  if (days < 0) return `en retard de ${Math.abs(days)} j`;
  if (days === 0) return "aujourd'hui";
  return `dans ${days} j`;
};

export function CycleRevisionCard({
  memberId,
  plan,
  entries,
  enabled,
}: CycleRevisionCardProps) {
  const { cycles, loading, markTotalRevision, clearTotalRevision } =
    useMemorizationCycles(memberId, enabled && Boolean(plan));
  const [expanded, setExpanded] = useState(false);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const target = useMemo(() => {
    if (!plan) return null;
    const pending = pendingCycleInfo(plan.start_date, cycles);
    return {
      cycle: pending.cycle,
      overdue: pending.overdue,
      dueSoon: !pending.overdue && pending.cycle.daysLeft <= 7,
    };
  }, [plan, cycles]);

  const targetRow = target
    ? cycles.find((cycle) => cycle.cycle_start === target.cycle.start)
    : null;
  const isDone = Boolean(targetRow?.total_revision_done_at);

  useEffect(() => {
    setNotes(targetRow?.notes ?? "");
  }, [targetRow?.id, targetRow?.notes]);

  if (!plan || !target) return null;

  const cycleEntries = entries
    .filter((entry) => entry.week_start <= target.cycle.end)
    .sort((a, b) => a.week_start.localeCompare(b.week_start));

  const snapshot = targetRow?.parts_snapshot ?? [];
  const parts: CyclePart[] =
    isDone && snapshot.length > 0 ? snapshot : cycleEntries;

  const groups = CATEGORY_ORDER.map((category) => ({
    category,
    parts: parts.filter(
      (part) => revisionCategory(part.week_start, target.cycle.start) === category
    ),
  })).filter((group) => group.parts.length > 0);

  const statusBadge = isDone ? (
    <Badge className="bg-emerald-100 text-emerald-700">Faite</Badge>
  ) : target.overdue ? (
    <Badge className="bg-rose-100 text-rose-700">En retard</Badge>
  ) : target.dueSoon ? (
    <Badge className="bg-amber-100 text-amber-800">À faire</Badge>
  ) : (
    <Badge variant="outline">Cycle en cours</Badge>
  );

  const handleMarkDone = async () => {
    setSaving(true);
    try {
      await markTotalRevision({
        cycleNumber: target.cycle.number,
        cycleStart: target.cycle.start,
        cycleEnd: target.cycle.end,
        entries: cycleEntries,
        notes,
      });
      setExpanded(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card
      className={
        target.overdue
          ? "border-rose-200"
          : target.dueSoon
          ? "border-amber-200"
          : undefined
      }
    >
      <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
        <CardTitle className="flex items-center gap-3">
          <div
            className={`rounded-2xl p-3 text-white ${
              target.overdue
                ? "bg-rose-600"
                : target.dueSoon
                ? "bg-amber-500"
                : "bg-slate-600"
            }`}
          >
            <CalendarDays className="h-6 w-6" />
          </div>
          <div>
            <span>Révision totale du cycle</span>
            <p className="text-xs font-normal text-muted-foreground">
              Cycle {target.cycle.number} · {formatDate(target.cycle.start)} →{" "}
              {formatDate(target.cycle.end)} ·{" "}
              {daysLabel(target.cycle.daysLeft)}
            </p>
          </div>
        </CardTitle>
        {statusBadge}
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-xs text-muted-foreground">
          Les 30 répétitions par partie restent orales. Ici, on valide la
          révision totale de fin de cycle.
        </p>

        {(target.overdue || target.dueSoon) && !isDone && (
          <div
            className={`rounded-xl border p-3 text-sm ${
              target.overdue
                ? "border-rose-200 bg-rose-50 text-rose-700"
                : "border-amber-200 bg-amber-50 text-amber-800"
            }`}
          >
            {target.overdue
              ? "Le cycle est terminé. La révision totale doit être faite."
              : "La révision totale est à prévoir avant la fin du cycle."}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <Badge variant="outline">{parts.length} partie(s)</Badge>
          {groups.map((group) => (
            <Badge
              key={group.category}
              variant="outline"
              className={CATEGORY_CLASS[group.category]}
            >
              {CATEGORY_LABELS[group.category]} : {group.parts.length}
            </Badge>
          ))}
          {isDone && targetRow?.total_revision_done_at && (
            <span className="text-emerald-700">
              Faite le{" "}
              {new Date(targetRow.total_revision_done_at).toLocaleDateString(
                "fr-FR",
                { day: "2-digit", month: "long", year: "numeric" }
              )}
            </span>
          )}
        </div>

        {isDone ? (
          <div className="space-y-3">
            {targetRow?.notes && (
              <p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
                {targetRow.notes}
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setExpanded((value) => !value)}
              >
                {expanded ? (
                  <ChevronUp className="mr-1 h-4 w-4" />
                ) : (
                  <ChevronDown className="mr-1 h-4 w-4" />
                )}
                {expanded ? "Masquer les parties" : "Voir les parties"}
              </Button>
              {targetRow && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => void clearTotalRevision(targetRow.id)}
                >
                  <RefreshCw className="mr-1 h-4 w-4" />
                  Rouvrir
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <Textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Note sur la révision totale (facultatif)"
              className="min-h-16"
            />
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                onClick={() => void handleMarkDone()}
                disabled={saving || cycleEntries.length === 0}
              >
                <Check className="mr-1 h-4 w-4" />
                {saving ? "Enregistrement…" : "Marquer la révision totale faite"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setExpanded((value) => !value)}
              >
                {expanded ? (
                  <ChevronUp className="mr-1 h-4 w-4" />
                ) : (
                  <ChevronDown className="mr-1 h-4 w-4" />
                )}
                {expanded ? "Masquer les parties" : "Voir les parties"}
              </Button>
            </div>
          </div>
        )}

        {expanded && (
          <div className="max-h-80 space-y-3 overflow-y-auto rounded-xl border border-slate-200 bg-white p-3">
            {loading ? (
              <p className="text-sm text-muted-foreground">Chargement…</p>
            ) : groups.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Aucune partie mémorisée sur ce cycle.
              </p>
            ) : (
              groups.map((group) => (
                <div key={group.category} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={CATEGORY_CLASS[group.category]}
                    >
                      {CATEGORY_LABELS[group.category]}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {group.parts.length} partie(s)
                    </span>
                  </div>
                  <div className="divide-y divide-slate-100 rounded-lg border border-slate-100">
                    {group.parts.map((part) => (
                      <div
                        key={part.id}
                        className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-medium">
                            {formatPosition(part)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Semaine du {formatDate(part.week_start)} ·{" "}
                            {part.quantity || "—"}
                          </p>
                        </div>
                        {part.validated && (
                          <Badge className="bg-emerald-100 text-emerald-700">
                            Validé
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
