"use client";

import React from "react";

/* ---------- tiny typed UI primitives ---------- */

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "dark";
  size?: "sm" | "md" | "lg";
}

export function Button({ variant = "primary", size = "md", className = "", ...rest }: ButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-spruce-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
  const sizes = {
    sm: "text-[13px] px-3 py-1.5",
    md: "text-sm px-4 py-2.5",
    lg: "text-[15px] px-6 py-3.5",
  } as const;
  const variants = {
    primary:
      "bg-spruce-600 text-white hover:bg-spruce-700 active:bg-spruce-800 shadow-[0_2px_10px_-2px_rgba(14,107,94,0.5)]",
    secondary:
      "bg-white dark:bg-stone-900 text-ink dark:text-stone-100 border border-stone-200 dark:border-stone-700 hover:border-spruce-300 hover:bg-spruce-50 dark:hover:bg-stone-800",
    ghost: "text-ink-soft dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-ink dark:hover:text-white",
    dark: "bg-ink text-white dark:bg-white dark:text-ink hover:opacity-90",
  } as const;
  return <button className={`${base} ${sizes[size]} ${variants[variant]} ${className}`} {...rest} />;
}

export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-paper dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 rounded-2xl shadow-card ${className}`}
    >
      {children}
    </div>
  );
}

export function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-spruce-600 dark:text-spruce-300">
      {children}
    </p>
  );
}

export function ModeBadge({ mode }: { mode: "code" | "lab" }) {
  const isCode = mode === "code";
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${
        isCode
          ? "bg-spruce-50 dark:bg-spruce-900/40 text-spruce-700 dark:text-spruce-200 border-spruce-200 dark:border-spruce-800"
          : "bg-clay-50 dark:bg-stone-800 text-clay-600 dark:text-amber-200 border-clay-100 dark:border-stone-700"
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${isCode ? "bg-spruce-500" : "bg-clay-500"}`} />
      {isCode ? "Code Tutor" : "Lab Prep"}
    </span>
  );
}

/* ---------- inline SVG icons (no extra deps) ---------- */

export function Icon({ d, className = "w-5 h-5" }: { d: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d={d} />
    </svg>
  );
}

export const PATHS = {
  upload: "M12 16V4m0 0 4 4m-4-4L8 8M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3",
  chat: "M21 12a8 8 0 0 1-8 8H5l-2 2V12a8 8 0 0 1 8-8h2a8 8 0 0 1 8 8Z",
  mail: "M4 6h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1Zm0 0 8 6 8-6",
  play: "M8 5v14l11-7z",
  pause: "M9 5v14M15 5v14",
  step: "M6 5v14l8-7zM18 5v14",
  reset: "M4 10a8 8 0 1 1 2 6M4 10V4m0 6h6",
  check: "m5 12 5 5 9-11",
  file: "M14 3H7a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V8zM14 3v5h4",
  flask: "M10 3h4M10 3v5l-5 9a2 2 0 0 0 1.8 3h10.4A2 2 0 0 0 19 17l-5-9V3M8 15h8",
  sun: "M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0-15v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5M17.5 17.5 19 19M19 5l-1.5 1.5M6.5 17.5 5 19",
  moon: "M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5Z",
  x: "M6 6l12 12M18 6 6 18",
  send: "m4 11 16-7-7 16-2-7zM11 13l5-5",
  spark: "M12 3v4m0 10v4M3 12h4m10 0h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18",
  book: "M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3zM5 17a3 3 0 0 1 3-3h11",
  warn: "M12 4 2.5 20h19zM12 10v4m0 3v.5",
  arrow: "M5 12h14m-6-6 6 6-6 6",
};
