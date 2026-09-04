"use client";

import { useMemo, useState } from "react";
import type { LabPrep } from "@/lib/types";
import { Button, Card, Eyebrow, Icon, PATHS } from "./ui";
import ReadinessRing from "./ReadinessRing";
import { useApp } from "@/context/AppContext";

interface LabPrepViewProps {
  prep: LabPrep;
  onChange?: (prep: LabPrep) => void;
  loading?: boolean;
}

export default function LabPrepView({ prep, onChange, loading }: LabPrepViewProps) {
  const { openEmail } = useApp();
  const [reviewedSteps, setReviewedSteps] = useState<number[]>([0]);

  const checkedCount = prep.materials.filter((m) => m.checked).length;
  const score = useMemo(() => {
    const mat = prep.materials.length ? (checkedCount / prep.materials.length) * 70 : 0;
    const steps = prep.steps.length ? (new Set(reviewedSteps).size / prep.steps.length) * 30 : 0;
    return Math.round(mat + steps);
  }, [checkedCount, prep.materials.length, prep.steps.length, reviewedSteps]);

  const toggleMaterial = (id: string) => {
    onChange?.({
      ...prep,
      materials: prep.materials.map((m) => (m.id === id ? { ...m, checked: !m.checked } : m)),
    });
  };

  const toggleStepReviewed = (idx: number) => {
    setReviewedSteps((prev) => (prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]));
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-3">
          <div className="h-4 w-56 bg-stone-200 dark:bg-stone-700 rounded" />
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="h-32 bg-stone-100 dark:bg-stone-800 rounded-xl" />
            <div className="h-32 bg-stone-100 dark:bg-stone-800 rounded-xl" />
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Readiness header */}
      <Card className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-5">
        <ReadinessRing score={score} />
        <div className="sm:ml-auto flex flex-col gap-2 w-full sm:w-auto">
          <div className="text-sm text-ink-soft dark:text-stone-300">
            <span className="font-semibold text-ink dark:text-white">{checkedCount}/{prep.materials.length}</span> materials packed ·{" "}
            <span className="font-semibold text-ink dark:text-white">{new Set(reviewedSteps).size}/{prep.steps.length}</span> steps reviewed
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={() => openEmail({ mode: "lab", docName: prep.experimentTitle })}>
              <Icon d={PATHS.mail} className="w-4 h-4" /> Email me this
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Objective */}
        <Card className="p-5 sm:p-6">
          <Eyebrow>Objective</Eyebrow>
          <h3 className="font-serif font-semibold text-lg mt-1">{prep.experimentTitle}</h3>
          <p className="text-[14px] leading-relaxed text-ink-soft dark:text-stone-300 mt-2">{prep.objective}</p>
        </Card>

        {/* Expected output */}
        <Card className="p-5 sm:p-6 border-l-4 !border-l-spruce-500">
          <Eyebrow>Expected output</Eyebrow>
          <p className="text-[14px] leading-relaxed mt-2">{prep.expectedOutput}</p>
        </Card>

        {/* Materials checklist */}
        <Card className="p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <Eyebrow>Materials · checklist</Eyebrow>
            <span className="text-xs font-semibold text-ink-soft dark:text-stone-400">{checkedCount}/{prep.materials.length}</span>
          </div>
          <ul className="mt-3 space-y-2">
            {prep.materials.map((m) => (
              <li key={m.id}>
                <label
                  className={`flex items-start gap-3 rounded-xl border px-3.5 py-2.5 cursor-pointer transition-colors ${
                    m.checked
                      ? "border-spruce-300 dark:border-spruce-700 bg-spruce-50/70 dark:bg-spruce-900/20"
                      : "border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-600"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={m.checked}
                    onChange={() => toggleMaterial(m.id)}
                    className="mt-1 w-4 h-4 accent-[#0E6B5E]"
                  />
                  <span className="flex-1">
                    <span className={`block text-sm font-medium ${m.checked ? "line-through opacity-70" : ""}`}>{m.label}</span>
                    {m.detail && <span className="block text-xs text-ink-soft dark:text-stone-400">{m.detail}</span>}
                  </span>
                  {m.checked && <Icon d={PATHS.check} className="w-4 h-4 text-spruce-600 mt-1" />}
                </label>
              </li>
            ))}
          </ul>
        </Card>

        {/* Steps */}
        <Card className="p-5 sm:p-6">
          <Eyebrow>Steps · in plain language</Eyebrow>
          <ol className="mt-3 space-y-3">
            {prep.steps.map((s, i) => {
              const done = reviewedSteps.includes(i);
              return (
                <li key={i} className="flex gap-3">
                  <button
                    onClick={() => toggleStepReviewed(i)}
                    title={done ? "Mark as not reviewed" : "Mark as reviewed"}
                    className={`w-7 h-7 shrink-0 rounded-full grid place-items-center text-[13px] font-bold transition-colors ${
                      done ? "bg-spruce-600 text-white" : "bg-stone-100 dark:bg-stone-800 text-ink-soft dark:text-stone-300 hover:bg-stone-200"
                    }`}
                  >
                    {done ? <Icon d={PATHS.check} className="w-3.5 h-3.5" /> : i + 1}
                  </button>
                  <p className={`text-[14px] leading-relaxed ${done ? "text-ink-soft dark:text-stone-400" : ""}`}>{s}</p>
                </li>
              );
            })}
          </ol>
        </Card>
      </div>

      {/* Precautions — color-coded by severity */}
      <Card className="p-5 sm:p-6">
        <Eyebrow>Precautions</Eyebrow>
        <div className="mt-1 flex gap-4 text-[11px] font-medium text-ink-soft dark:text-stone-400">
          <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-red-500 inline-block" /> red = safety-critical</span>
          <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-stone-400 inline-block" /> gray = procedural</span>
        </div>
        <ul className="mt-3 grid sm:grid-cols-2 gap-2.5">
          {prep.precautions.map((p) => {
            const safety = p.severity === "safety";
            return (
              <li
                key={p.id}
                className={`flex items-start gap-2.5 rounded-xl border-l-4 px-4 py-3 text-[13.5px] leading-relaxed ${
                  safety
                    ? "border-red-500 bg-red-50/70 dark:bg-red-950/30 border border-red-200 dark:border-red-900 !border-l-red-500"
                    : "border-stone-300 bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 !border-l-stone-400"
                }`}
              >
                <Icon
                  d={safety ? PATHS.warn : PATHS.check}
                  className={`w-4 h-4 shrink-0 mt-0.5 ${safety ? "text-red-600 dark:text-red-300" : "text-stone-500 dark:text-stone-400"}`}
                />
                <span>{p.text}</span>
              </li>
            );
          })}
        </ul>
      </Card>
    </div>
  );
}
