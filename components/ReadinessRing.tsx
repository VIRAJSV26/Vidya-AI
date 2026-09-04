"use client";

interface ReadinessRingProps {
  /** 0–100 */
  score: number;
  size?: number;
}

export default function ReadinessRing({ score, size = 120 }: ReadinessRingProps) {
  const stroke = 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  const offset = c - (clamped / 100) * c;

  const tone = clamped >= 80 ? "#0E6B5E" : clamped >= 50 ? "#C97B3D" : "#A8A29E";
  const label = clamped >= 80 ? "Lab-ready" : clamped >= 50 ? "Almost there" : "Just started";

  return (
    <div className="flex items-center gap-4">
      <div className="relative shrink-0" style={{ width: size, height: size }} role="img" aria-label={`Readiness score ${clamped} out of 100`}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className="stroke-stone-200 dark:stroke-stone-700" />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={tone}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 0.6s ease, stroke 0.4s ease" }}
          />
        </svg>
        <div className="absolute inset-0 grid place-items-center text-center">
          <div>
            <p className="font-serif font-semibold text-3xl leading-none">{clamped}</p>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-ink-faint dark:text-stone-500 mt-0.5">/ 100</p>
          </div>
        </div>
      </div>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-faint dark:text-stone-500">Readiness score</p>
        <p className="font-serif font-semibold text-xl mt-0.5">{label}</p>
        <p className="text-[13px] text-ink-soft dark:text-stone-400 mt-1 max-w-[220px] leading-snug">
          Tick the materials checklist & review the steps to push this higher.
        </p>
      </div>
    </div>
  );
}
