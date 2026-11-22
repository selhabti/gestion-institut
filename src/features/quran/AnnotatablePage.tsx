import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  Eraser,
  Highlighter,
  Pencil,
  Trash2,
  Undo2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type Tool = "pen" | "highlighter" | "eraser";

interface Point {
  x: number;
  y: number;
}

interface Stroke {
  id: string;
  tool: "pen" | "highlighter";
  color: string;
  width: number;
  points: Point[];
}

const COLORS = [
  { label: "Jaune", value: "#facc15" },
  { label: "Rouge", value: "#ef4444" },
  { label: "Bleu", value: "#3b82f6" },
  { label: "Vert", value: "#22c55e" },
];

const STORAGE_PREFIX = "mushaf-annotations-v1:";
const ERASER_RADIUS = 0.03;

const makeId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const loadStrokes = (key: string): Stroke[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_PREFIX + key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Stroke[]) : [];
  } catch {
    return [];
  }
};

const saveStrokes = (key: string, strokes: Stroke[]) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(strokes));
  } catch {
    // stockage indisponible : on ignore
  }
};

const hexToRgba = (hex: string, alpha: number) => {
  const value = hex.replace("#", "");
  if (value.length !== 6) return hex;
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const distance = (a: Point, b: Point) =>
  Math.hypot(a.x - b.x, a.y - b.y);

const pointSegmentDistance = (p: Point, a: Point, b: Point) => {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  if (dx === 0 && dy === 0) return distance(p, a);
  const t = Math.max(
    0,
    Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy))
  );
  return distance(p, { x: a.x + t * dx, y: a.y + t * dy });
};

interface AnnotatablePageProps {
  src: string;
  alt: string;
  annotationKey: string;
  maxWidthClass?: string;
  onImageError?: () => void;
}

export function AnnotatablePage({
  src,
  alt,
  annotationKey,
  maxWidthClass = "max-w-lg",
  onImageError,
}: AnnotatablePageProps) {
  const [annotating, setAnnotating] = useState(false);
  const [tool, setTool] = useState<Tool>("pen");
  const [color, setColor] = useState(COLORS[0].value);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null);
  const [ready, setReady] = useState(false);

  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointerActive = useRef(false);

  useEffect(() => {
    setReady(false);
    setStrokes(loadStrokes(annotationKey));
    setReady(true);
  }, [annotationKey]);

  useEffect(() => {
    if (!ready) return;
    const timer = setTimeout(() => saveStrokes(annotationKey, strokes), 250);
    return () => clearTimeout(timer);
  }, [strokes, annotationKey, ready]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    const all = currentStroke ? [...strokes, currentStroke] : strokes;
    for (const stroke of all) {
      if (stroke.points.length === 0) continue;
      const lineWidth = stroke.width * Math.min(width, height);
      const strokeStyle =
        stroke.tool === "highlighter"
          ? hexToRgba(stroke.color, 0.35)
          : stroke.color;

      if (stroke.points.length === 1) {
        const point = stroke.points[0];
        ctx.beginPath();
        ctx.fillStyle = strokeStyle;
        ctx.arc(point.x * width, point.y * height, lineWidth / 2, 0, Math.PI * 2);
        ctx.fill();
        continue;
      }

      ctx.beginPath();
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.lineWidth = lineWidth;
      ctx.strokeStyle = strokeStyle;
      const first = stroke.points[0];
      ctx.moveTo(first.x * width, first.y * height);
      for (let i = 1; i < stroke.points.length; i += 1) {
        const point = stroke.points[i];
        ctx.lineTo(point.x * width, point.y * height);
      }
      ctx.stroke();
    }
  }, [strokes, currentStroke]);

  useEffect(() => {
    draw();
  }, [draw]);

  const fitCanvas = () => {
    const image = imageRef.current;
    const canvas = canvasRef.current;
    if (!image || !canvas) return;
    canvas.width = image.naturalWidth || 1000;
    canvas.height = image.naturalHeight || 1500;
    draw();
  };

  const normalize = (event: ReactPointerEvent<HTMLCanvasElement>): Point => {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width)),
      y: Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height)),
    };
  };

  const eraseAt = (point: Point) => {
    setStrokes((previous) =>
      previous.filter(
        (stroke) =>
          !stroke.points.some((current, index) => {
            if (index === 0) return distance(point, current) <= ERASER_RADIUS;
            return (
              pointSegmentDistance(
                point,
                stroke.points[index - 1],
                current
              ) <= ERASER_RADIUS
            );
          })
      )
    );
  };

  const handlePointerDown = (
    event: ReactPointerEvent<HTMLCanvasElement>
  ) => {
    if (!annotating) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    pointerActive.current = true;
    const point = normalize(event);

    if (tool === "eraser") {
      eraseAt(point);
      return;
    }

    setCurrentStroke({
      id: makeId(),
      tool,
      color,
      width: tool === "pen" ? 0.006 : 0.028,
      points: [point],
    });
  };

  const handlePointerMove = (
    event: ReactPointerEvent<HTMLCanvasElement>
  ) => {
    if (!annotating || !pointerActive.current) return;
    event.preventDefault();
    const point = normalize(event);

    if (tool === "eraser") {
      eraseAt(point);
      return;
    }

    setCurrentStroke((previous) =>
      previous
        ? { ...previous, points: [...previous.points, point] }
        : previous
    );
  };

  const finishStroke = (
    event: ReactPointerEvent<HTMLCanvasElement>
  ) => {
    pointerActive.current = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    if (currentStroke) {
      setStrokes((previous) => [...previous, currentStroke]);
      setCurrentStroke(null);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-1.5">
        <Button
          type="button"
          size="sm"
          variant={annotating ? "default" : "outline"}
          onClick={() => setAnnotating((value) => !value)}
        >
          <Pencil className="mr-1 h-4 w-4" />
          Annoter
        </Button>

        {annotating && (
          <>
            <Button
              type="button"
              size="sm"
              variant={tool === "pen" ? "default" : "outline"}
              onClick={() => setTool("pen")}
            >
              <Pencil className="mr-1 h-4 w-4" />
              Stylo
            </Button>
            <Button
              type="button"
              size="sm"
              variant={tool === "highlighter" ? "default" : "outline"}
              onClick={() => setTool("highlighter")}
            >
              <Highlighter className="mr-1 h-4 w-4" />
              Surligneur
            </Button>
            <Button
              type="button"
              size="sm"
              variant={tool === "eraser" ? "default" : "outline"}
              onClick={() => setTool("eraser")}
            >
              <Eraser className="mr-1 h-4 w-4" />
              Gomme
            </Button>

            <div className="flex items-center gap-1">
              {COLORS.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  aria-label={item.label}
                  title={item.label}
                  onClick={() => setColor(item.value)}
                  className={`h-6 w-6 rounded-full border border-slate-300 transition ${
                    color === item.value
                      ? "ring-2 ring-slate-800 ring-offset-1"
                      : ""
                  }`}
                  style={{ backgroundColor: item.value }}
                />
              ))}
            </div>

            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setStrokes((previous) => previous.slice(0, -1))}
              disabled={strokes.length === 0}
            >
              <Undo2 className="mr-1 h-4 w-4" />
              Annuler
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setStrokes([])}
              disabled={strokes.length === 0}
            >
              <Trash2 className="mr-1 h-4 w-4" />
              Effacer
            </Button>
          </>
        )}
      </div>

      <div className={`relative mx-auto w-full ${maxWidthClass}`}>
        <img
          ref={imageRef}
          src={src}
          alt={alt}
          loading="lazy"
          draggable={false}
          onLoad={fitCanvas}
          onError={onImageError}
          className="block h-auto w-full select-none"
        />
        <canvas
          ref={canvasRef}
          className={`absolute inset-0 h-full w-full ${
            annotating
              ? "cursor-crosshair touch-none"
              : "pointer-events-none"
          }`}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={finishStroke}
          onPointerCancel={finishStroke}
        />
      </div>
    </div>
  );
}
