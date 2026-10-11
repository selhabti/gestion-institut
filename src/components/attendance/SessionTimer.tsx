// src/components/attendance/SessionTimer.tsx
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Timer } from "lucide-react";

interface SessionTimerProps {
  sessionStart?: string; // "HH:MM"
  sessionEnd?: string;
}

const parseHM = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return { h: h || 0, m: m || 0 };
};

const pad = (n: number) => String(n).padStart(2, "0");

export function SessionTimer({
  sessionStart = "09:30",
  sessionEnd = "11:30",
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

  // Démarre automatiquement à l'heure locale de début de séance
  const elapsed = Math.max(
    0,
    Math.floor((now - start.getTime()) / 1000)
  );
  const hh = pad(Math.floor(elapsed / 3600));
  const mm = pad(Math.floor((elapsed % 3600) / 60));
  const ss = pad(elapsed % 60);

  const before = now < start.getTime();
  const during = now >= start.getTime() && now <= end.getTime();

  const status = before ? "À venir" : during ? "En cours" : "Terminée";
  const statusClass = before
    ? "bg-slate-100 text-slate-500"
    : during
    ? "bg-emerald-100 text-emerald-700"
    : "bg-slate-100 text-slate-500";

  return (
    <Card className="border-indigo-200 bg-indigo-50/60">
      <CardContent className="p-4 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-indigo-600 text-white">
            <Timer className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-700">
              Séance Samedi {sessionStart} – {sessionEnd}
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
