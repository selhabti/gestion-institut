// src/components/attendance/SessionTimer.tsx
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Timer } from "lucide-react";

interface SessionTimerProps {
  sessionStart?: string; // "HH:MM"
  sessionEnd?: string;
  sessionDays?: number[]; // 0=Dim, 1=Lun, 4=Jeu, 6=Sam ; vide = tous les jours
  label?: string;
}

const parseHM = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return { h: h || 0, m: m || 0 };
};

const pad = (n: number) => String(n).padStart(2, "0");

export function SessionTimer({
  sessionStart = "09:30",
  sessionEnd = "11:30",
  sessionDays = [],
  label = "Séance",
}: SessionTimerProps) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const s = parseHM(sessionStart);
  const e = parseHM(sessionEnd);

  const start = new Date();
  start.setHours(s.h, s.m, 0, 0);
  const end = new Date();
  end.setHours(e.h, e.m, 0, 0);

  const isSessionToday =
    sessionDays.length === 0 || sessionDays.includes(new Date().getDay());

  // Se fige à la fin de la séance
  const capped = Math.min(now, end.getTime());
  const elapsed = isSessionToday
    ? Math.max(0, Math.floor((capped - start.getTime()) / 1000))
    : 0;
  const hh = pad(Math.floor(elapsed / 3600));
  const mm = pad(Math.floor((elapsed % 3600) / 60));
  const ss = pad(elapsed % 60);

  const before = now < start.getTime();
  const during = now >= start.getTime() && now <= end.getTime();

  let status = "Pas de séance aujourd'hui";
  let statusClass = "bg-slate-100 text-slate-500";
  if (isSessionToday) {
    if (before) {
      status = "À venir";
      statusClass = "bg-slate-100 text-slate-500";
    } else if (during) {
      status = "En cours";
      statusClass = "bg-emerald-100 text-emerald-700";
    } else {
      status = "Terminée";
      statusClass = "bg-slate-100 text-slate-500";
    }
  }

  return (
    <Card className="border-indigo-200 bg-indigo-50/60">
      <CardContent className="p-4 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-indigo-600 text-white">
            <Timer className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-700">
              {label} {sessionStart} – {sessionEnd}
            </p>
            <p className="text-3xl font-black text-indigo-700 tabular-nums">
              {hh}:{mm}:{ss}
            </p>
          </div>
        </div>
        <Badge className={statusClass}>{status}</Badge>
      </CardContent>
    </Card>
  );
}

export default SessionTimer;
