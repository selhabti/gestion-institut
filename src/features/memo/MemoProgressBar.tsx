import {
  MEMO_AVANT,
  MEMO_AVENIR,
  MEMO_COLORS,
  positionPct,
} from "./colors";

interface MemoProgressBarProps {
  origine: number;
  position: number;
  ancienDe: number | null;
  ancienA: number | null;
  recentDe: number;
  recentA: number;
  nouveauDe: number;
  nouveauA: number;
  compact?: boolean;
}

const clamp = (value: number) => Math.max(0, Math.min(480, value));

export function MemoProgressBar({
  origine,
  position,
  ancienDe,
  ancienA,
  recentDe,
  recentA,
  nouveauDe,
  nouveauA,
  compact,
}: MemoProgressBarProps) {
  const origin = clamp(origine);
  const pos = clamp(position);
  const recentStart = clamp(recentDe);
  const recentEnd = clamp(recentA);
  const newStart = clamp(nouveauDe);
  const newEnd = clamp(nouveauA);

  const segments = [
    {
      start: origin,
      end: recentStart,
      color: MEMO_COLORS.ancien.hex,
    },
    {
      start: recentStart,
      end: recentEnd,
      color: MEMO_COLORS.recent.hex,
    },
    {
      start: newStart,
      end: newEnd,
      color: MEMO_COLORS.nouveau.hex,
    },
    {
      start: newEnd,
      end: 480,
      color: MEMO_AVENIR.hex,
    },
  ].filter((segment) => segment.end > segment.start);

  const sliceStart =
    ancienDe !== null ? Math.max(origin, clamp(ancienDe)) : null;
  const sliceEnd =
    ancienA !== null && ancienDe !== null
      ? Math.min(recentStart, clamp(ancienA))
      : null;
  const hasSlice =
    sliceStart !== null &&
    sliceEnd !== null &&
    sliceEnd > sliceStart;

  return (
    <div className={compact ? "space-y-1.5" : "space-y-2"}>
      <div className="flex items-center justify-between text-[10px] font-medium uppercase tracking-wide text-slate-400">
        <span>Al-Fatiha</span>
        <span>An-Nas</span>
      </div>

      <div
        className={`relative w-full overflow-hidden rounded-full bg-slate-100 ${
          compact ? "h-3" : "h-5"
        }`}
        role="img"
        aria-label={`Progression de ${origin} à ${pos} sur 480`}
      >
        {origin > 0 && (
          <div
            className="absolute inset-y-0 left-0"
            style={{
              width: `${positionPct(origin)}%`,
              backgroundColor: MEMO_AVANT.hex,
              backgroundImage:
                "repeating-linear-gradient(45deg, #cbd5e1 0, #cbd5e1 3px, #f8fafc 3px, #f8fafc 7px)",
            }}
          />
        )}
        {segments.map((segment, index) => (
          <div
            key={index}
            className="absolute inset-y-0"
            style={{
              left: `${positionPct(segment.start)}%`,
              width: `${positionPct(segment.end - segment.start)}%`,
              backgroundColor: segment.color,
            }}
          />
        ))}
        {hasSlice && (
          <div
            className="absolute inset-y-0"
            style={{
              left: `${positionPct(sliceStart)}%`,
              width: `${positionPct(sliceEnd - sliceStart)}%`,
              backgroundColor: MEMO_COLORS.ancien.dark,
            }}
          />
        )}
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
        <span className="inline-flex items-center gap-1">
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: MEMO_COLORS.ancien.hex }}
          />
          Ancien
        </span>
        <span className="inline-flex items-center gap-1">
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: MEMO_COLORS.recent.hex }}
          />
          Récent
        </span>
        <span className="inline-flex items-center gap-1">
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: MEMO_COLORS.nouveau.hex }}
          />
          Nouveau
        </span>
        <span className="inline-flex items-center gap-1">
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: MEMO_AVENIR.hex }}
          />
          À venir
        </span>
        {hasSlice && (
          <span className="inline-flex items-center gap-1 text-teal-700">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: MEMO_COLORS.ancien.dark }}
            />
            tranche du samedi
          </span>
        )}
        {origin > 0 && (
          <span className="text-slate-400">
            hachuré = avant l'origine
          </span>
        )}
      </div>
    </div>
  );
}
