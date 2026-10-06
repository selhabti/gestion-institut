// src/components/attendance/SessionTimer.tsx
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, RotateCcw, Timer, Check } from "lucide-react";
import { useProfessorHours } from "@/hooks/useProfessorHours";
import { useStaff } from "@/hooks/useStaff";

interface SessionTimerProps {
  sessionStart?: string; // "HH:MM"
  sessionEnd?: string;
  actualHours?: number;
}

const parseHM = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return { h: h || 0, m: m || 0 };
};

export function SessionTimer({
  sessionStart = "09:30",
  sessionEnd = "11:30",
  actualHours = 2,
}: SessionTimerProps) {
  const todayStr = new Date().toISOString().split("T")[0];
  const key = `session_start_${todayStr}`;

  const [startedAt, setStartedAt] = useState<number | null>(() => {
    const v = typeof window !== "undefined" ? localStorage.getItem(key) : null;
    return v ? parseInt(v, 10) : null;
  });
  const [now, setNow] = useState(Date.now());

  const { saveSession } = useProfessorHours();
  const { isSuperAdmin } = useStaff();
  const [closed, setClosed] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // Démarrage automatique le samedi dès l'heure de début de séance
  useEffect(() => {
    if (startedAt) return;
    const d = new Date();
    if (d.getDay() !== 6) return;
    const { h, m } = parseHM(sessionStart);
    const start = new Date();
    start.setHours(h, m, 0, 0);
    if (d.getTime() >= start.getTime()) {
      const t = start.getTime();
      localStorage.setItem(key, String(t));
      setStartedAt(t);
    }
  }, [startedAt, sessionStart, key]);

  const start = () => {
    const t = Date.now();
    localStorage.setItem(key, String(t));
    setStartedAt(t);
  };

  const reset = () => {
    localStorage.removeItem(key);
    setStartedAt(null);
    setClosed(false);
  };

  const closeSession = async () => {
    try {
      await saveSession({
        date: todayStr,
        startTime: sessionStart,
        endTime: sessionEnd,
        actualHours,
        notes: "Séance (Attanzil)",
        status: "completed",
      });
      setClosed(true);
    } catch {
      // géré par le hook
    }
  };

  const elapsed = startedAt ? Math.max(0, Math.floor((now - startedAt) / 1000)) : 0;
  const hh = String(Math.floor(elapsed / 3600)).padStart(2, "0");
  const mm = String(Math.floor((elapsed % 3600) / 60)).padStart(2, "0");
  const ss = String(elapsed % 60).padStart(2, "0");

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
        <div className="flex items-center gap-2 flex-wrap">
          {!startedAt ? (
            <Button onClick={start}>
              <Play className="h-4 w-4 mr-1" />
              Démarrer la séance
            </Button>
          ) : (
            <Button variant="outline" onClick={reset}>
              <RotateCcw className="h-4 w-4 mr-1" />
              Réinitialiser
            </Button>
          )}

          {isSuperAdmin && (
            <Button
              variant={closed ? "outline" : "default"}
              onClick={closeSession}
              disabled={closed}
            >
              <Check className="h-4 w-4 mr-1" />
              {closed
                ? `Clôturée (${actualHours}h = ${actualHours * 30}€)`
                : `Clôturer (${actualHours}h × 30€)`}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default SessionTimer;

