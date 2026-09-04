"use client";

import { useState } from "react";
import type { LabManualDoc } from "@/lib/types";
import { Icon, PATHS } from "./ui";

interface ManualViewerProps {
  doc: LabManualDoc;
}

export default function ManualViewer({ doc }: ManualViewerProps) {
  const [open, setOpen] = useState<string>(doc.sections[0]?.id ?? "");

  return (
    <div className="overflow-hidden rounded-2xl border border-stone-200/80 dark:border-stone-800 bg-paper dark:bg-stone-900 shadow-card">
      <div className="px-4 sm:px-5 py-4 border-b border-stone-200/70 dark:border-stone-800 bg-cream/60 dark:bg-stone-950/60">
        <div className="flex items-center gap-3">
          <span className="w-9 h-9 rounded-xl bg-clay-500/10 dark:bg-stone-800 text-clay-600 dark:text-amber-200 grid place-items-center">
            <Icon d={PATHS.book} className="w-5 h-5" />
          </span>
          <div className="min-w-0">
            <p className="font-serif font-semibold text-[17px] leading-snug truncate">{doc.title}</p>
            <p className="text-xs text-ink-soft dark:text-stone-400 font-mono truncate">
              {doc.filename} · {doc.course}
            </p>
          </div>
        </div>
      </div>

      <div className="p-3 sm:p-4 space-y-2">
        <p className="px-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint dark:text-stone-500">
          Extracted sections · {doc.sections.length}
        </p>
        {doc.sections.map((s, idx) => {
          const isOpen = open === s.id;
          return (
            <div
              key={s.id}
              className={`rounded-xl border transition-colors ${
                isOpen
                  ? "border-spruce-300 dark:border-spruce-700 bg-spruce-50/50 dark:bg-stone-950"
                  : "border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700"
              }`}
            >
              <button
                onClick={() => setOpen(isOpen ? "" : s.id)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left"
              >
                <span
                  className={`w-6 h-6 shrink-0 rounded-full grid place-items-center text-[11px] font-bold ${
                    isOpen ? "bg-spruce-600 text-white" : "bg-stone-100 dark:bg-stone-800 text-ink-soft dark:text-stone-300"
                  }`}
                >
                  {idx + 1}
                </span>
                <span className="font-medium text-sm flex-1">{s.heading}</span>
                <span className="text-[11px] font-mono text-ink-faint dark:text-stone-500">{s.pageRef}</span>
                <span className={`transition-transform ${isOpen ? "rotate-180" : ""}`}>▾</span>
              </button>
              {isOpen && (
                <div className="px-4 pb-4 pl-[52px]">
                  <p className="text-[13.5px] leading-relaxed text-ink-soft dark:text-stone-300">{s.body}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <p className="px-4 sm:px-5 py-2.5 text-[11px] text-ink-faint dark:text-stone-500 border-t border-stone-200/70 dark:border-stone-800">
        Parsed from PDF — page references point back to your manual.
      </p>
    </div>
  );
}
