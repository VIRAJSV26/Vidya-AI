"use client";

import { useState } from "react";
import type { CodeDoc } from "@/lib/types";
import { Icon, PATHS } from "./ui";

interface CodeViewerProps {
  doc: CodeDoc;
  /** 1-based line currently executed in the trace (null = none) */
  activeLine: number | null;
  /** Jump the trace to a line when the user clicks it */
  onLineClick?: (line: number) => void;
}

export default function CodeViewer({ doc, activeLine, onLineClick }: CodeViewerProps) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(doc.lines.join("\n"));
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {}
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-stone-200/80 dark:border-stone-800 bg-paper dark:bg-stone-900 shadow-card">
      {/* header */}
      <div className="flex items-center gap-3 px-4 sm:px-5 py-3.5 border-b border-stone-200/70 dark:border-stone-800 bg-cream/60 dark:bg-stone-950/60">
        <span className="w-8 h-8 rounded-lg bg-spruce-600/10 dark:bg-spruce-900/40 text-spruce-700 dark:text-spruce-200 grid place-items-center">
          <Icon d={PATHS.file} className="w-4 h-4" />
        </span>
        <div className="min-w-0">
          <p className="font-mono text-sm font-semibold truncate">{doc.filename}</p>
          <p className="text-xs text-ink-soft dark:text-stone-400">
            {doc.lines.length} lines · Python
          </p>
        </div>
        <button
          onClick={copy}
          className="ml-auto text-xs font-semibold px-3 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 hover:border-spruce-400 hover:text-spruce-700 dark:hover:text-spruce-300 transition-colors"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>

      {/* summary strip */}
      <div className="px-4 sm:px-5 py-3.5 border-b border-stone-200/70 dark:border-stone-800">
        <p className="text-[13.5px] leading-relaxed text-ink-soft dark:text-stone-300">{doc.summary}</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {doc.concepts.map((c) => (
            <span
              key={c}
              className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-ink-soft dark:text-stone-300"
            >
              {c}
            </span>
          ))}
        </div>
      </div>

      {/* code with line numbers */}
      <div className="overflow-x-auto nice-scroll bg-[#FFFEFB] dark:bg-stone-950">
        <pre className="text-[13.5px] leading-6 font-mono min-w-full">
          {doc.lines.map((line, i) => {
            const n = i + 1;
            const isActive = activeLine === n;
            return (
              <div
                key={n}
                onClick={() => onLineClick?.(n)}
                title="Jump trace to this line"
                className={`flex cursor-pointer transition-colors border-l-[3px] ${
                  isActive
                    ? "trace-active border-spruce-500 bg-spruce-50 dark:bg-spruce-900/30"
                    : "border-transparent hover:bg-stone-100/70 dark:hover:bg-stone-800/60"
                }`}
              >
                <span
                  className={`w-12 shrink-0 text-right pr-4 select-none ${
                    isActive ? "text-spruce-700 dark:text-spruce-300 font-bold" : "text-stone-400 dark:text-stone-600"
                  }`}
                >
                  {n}
                </span>
                <code className={`pr-6 whitespace-pre ${isActive ? "text-ink dark:text-white font-medium" : "text-stone-800 dark:text-stone-200"}`}>
                  {line === "" ? " " : line}
                </code>
                {isActive && (
                  <span className="ml-auto mr-3 self-center text-[10px] font-sans font-bold uppercase tracking-wider text-spruce-700 dark:text-spruce-300 bg-spruce-100 dark:bg-spruce-900/60 rounded px-1.5 py-0.5">
                    ▶ here
                  </span>
                )}
              </div>
            );
          })}
        </pre>
      </div>
      <p className="px-4 sm:px-5 py-2.5 text-[11px] text-ink-faint dark:text-stone-500 border-t border-stone-200/70 dark:border-stone-800">
        Tip: click any line to jump the Execution Trace to the nearest step.
      </p>
    </div>
  );
}
