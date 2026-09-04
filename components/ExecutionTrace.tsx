"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { TraceStep } from "@/lib/types";
import { Card, Eyebrow, Icon, PATHS } from "./ui";

interface ExecutionTraceProps {
  steps: TraceStep[];
  /** Controlled cursor — CodeViewer highlights this step's line */
  current: number;
  onChange: (index: number) => void;
  loading?: boolean;
}

export default function ExecutionTrace({ steps, current, onChange, loading }: ExecutionTraceProps) {
  const [playing, setPlaying] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentRef = useRef(current);
  currentRef.current = current;
  const step = steps[current];

  const stop = useCallback(() => {
    setPlaying(false);
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
  }, []);

  const play = useCallback(() => {
    if (steps.length === 0) return;
    // restart from the beginning if we finished
    if (currentRef.current >= steps.length - 1) onChange(0);
    setPlaying(true);
    if (timer.current) clearInterval(timer.current);
    timer.current = setInterval(() => {
      const next = currentRef.current + 1;
      if (next >= steps.length) {
        if (timer.current) clearInterval(timer.current);
        timer.current = null;
        setPlaying(false);
        return;
      }
      onChange(next);
    }, 1800);
  }, [steps.length, onChange]);

  useEffect(() => () => stop(), [stop]);

  const toggle = () => (playing ? stop() : play());

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-3">
          <div className="h-4 w-48 bg-stone-200 dark:bg-stone-700 rounded" />
          <div className="h-20 bg-stone-100 dark:bg-stone-800 rounded-xl" />
        </div>
        <p className="text-xs text-ink-faint mt-3">Building execution trace…</p>
      </Card>
    );
  }

  if (!step) return null;

  const progress = ((current + 1) / steps.length) * 100;

  return (
    <Card className="overflow-hidden">
      <div className="px-4 sm:px-6 pt-5 pb-4 border-b border-stone-200/70 dark:border-stone-800">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <Eyebrow>Execution trace · debugger view</Eyebrow>
            <h3 className="font-serif font-semibold text-xl mt-1">
              Step {current + 1} of {steps.length} — {step.title}
            </h3>
          </div>
          {/* play / pause / step controls */}
          <div className="ml-auto flex items-center gap-1.5" role="group" aria-label="Trace controls">
            <ControlBtn label="Restart" icon={PATHS.reset} onClick={() => { stop(); onChange(0); }} />
            <ControlBtn
              label="Previous step"
              icon={PATHS.step}
              flip
              onClick={() => { stop(); onChange(Math.max(0, current - 1)); }}
              disabled={current === 0}
            />
            <button
              onClick={toggle}
              aria-label={playing ? "Pause trace" : "Play trace"}
              className="h-10 px-5 inline-flex items-center gap-2 rounded-xl bg-spruce-600 text-white text-sm font-semibold hover:bg-spruce-700 transition-colors"
            >
              <Icon d={playing ? PATHS.pause : PATHS.play} className="w-4 h-4" />
              {playing ? "Pause" : "Play"}
            </button>
            <ControlBtn
              label="Next step"
              icon={PATHS.step}
              onClick={() => { stop(); onChange(Math.min(steps.length - 1, current + 1)); }}
              disabled={current === steps.length - 1}
            />
          </div>
        </div>
        {/* progress */}
        <div className="mt-4 h-1.5 rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden">
          <div className="h-full bg-spruce-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
        <div className="mt-2 flex gap-1.5 flex-wrap">
          {steps.map((s, i) => (
            <button
              key={s.stepIndex}
              onClick={() => { stop(); onChange(i); }}
              aria-label={`Go to step ${i + 1}`}
              title={`Step ${i + 1}: ${s.title} (line ${s.line})`}
              className={`h-2 flex-1 min-w-6 rounded-full transition-colors ${
                i === current ? "bg-spruce-600" : i < current ? "bg-spruce-300" : "bg-stone-200 dark:bg-stone-700 hover:bg-stone-300"
              }`}
            />
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-5 gap-0">
        {/* explanation */}
        <div className="md:col-span-3 px-4 sm:px-6 py-5">
          <p className="text-sm font-mono font-semibold text-spruce-700 dark:text-spruce-300">
            → line {step.line}
          </p>
          <p className="mt-2 text-[15px] leading-relaxed">{step.explanation}</p>
          {step.stdout && (
            <div className="mt-4 rounded-xl bg-stone-950 text-stone-100 font-mono text-[13px] px-4 py-3 overflow-x-auto">
              <span className="text-stone-500">$ output · </span>{step.stdout}
            </div>
          )}
        </div>
        {/* variables side table */}
        <div className="md:col-span-2 border-t md:border-t-0 md:border-l border-stone-200/70 dark:border-stone-800 bg-cream/50 dark:bg-stone-950/60 px-4 sm:px-6 py-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint dark:text-stone-500">
            Variables · after this line
          </p>
          <table className="mt-3 w-full text-sm">
            <tbody>
              {Object.entries(step.variables).map(([k, v]) => (
                <tr key={k} className="border-b border-stone-200/60 dark:border-stone-800 last:border-0">
                  <td className="py-2 pr-3 font-mono font-semibold text-spruce-700 dark:text-spruce-300 whitespace-nowrap">{k}</td>
                  <td className="py-2 font-mono text-[13px] break-all text-ink dark:text-stone-100">{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Card>
  );
}

function ControlBtn({
  label,
  icon,
  onClick,
  disabled,
  flip,
}: {
  label: string;
  icon: string;
  onClick: () => void;
  disabled?: boolean;
  flip?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className="w-10 h-10 grid place-items-center rounded-xl border border-stone-200 dark:border-stone-700 text-ink-soft dark:text-stone-300 hover:border-spruce-400 hover:text-spruce-700 dark:hover:text-spruce-300 disabled:opacity-35 transition-colors bg-white dark:bg-stone-900"
    >
      <span className={flip ? "-scale-x-100 inline-block" : "inline-block"}>
        <Icon d={icon} className="w-4 h-4" />
      </span>
    </button>
  );
}
