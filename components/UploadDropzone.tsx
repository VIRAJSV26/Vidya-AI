"use client";

import React, { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Icon, PATHS } from "./ui";
import { useApp } from "@/context/AppContext";
import { detectModeFromFilename, uploadFileToBackend } from "@/lib/api-stubs";
import type { AppMode, UploadedDoc } from "@/lib/types";

interface UploadDropzoneProps {
  /** Called after a file is accepted & routed (for analytics / toasts later) */
  onUploaded?: (doc: UploadedDoc) => void;
}

export default function UploadDropzone({ onUploaded }: UploadDropzoneProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detected, setDetected] = useState<{ name: string; mode: AppMode } | null>(null);
  const { addUpload } = useApp();

  const acceptFile = useCallback(
    async (file: File) => {
      setError(null);
      const mode = detectModeFromFilename(file.name);
      if (!mode) {
        setError(`“${file.name}” isn’t supported yet. Please drop a .py file or a PDF lab manual.`);
        setDetected(null);
        return;
      }
      setDetected({ name: file.name, mode });
      const doc = await uploadFileToBackend(file);
      addUpload(doc);
      onUploaded?.(doc);
      // Auto-detect → enter the right mode.
      setTimeout(() => router.push(`/workspace?mode=${mode}`), 600);
    },
    [addUpload, onUploaded, router]
  );

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) acceptFile(file);
  };

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload a .py or .pdf file"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`relative rounded-3xl border-2 border-dashed p-8 sm:p-12 text-center cursor-pointer transition-all bg-paper dark:bg-stone-900 ${
          dragging
            ? "border-spruce-500 bg-spruce-50 dark:bg-spruce-900/20 scale-[1.01]"
            : "border-stone-300 dark:border-stone-700 hover:border-spruce-400"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".py,.pdf"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) acceptFile(f);
          }}
        />
        <div className="mx-auto w-14 h-14 rounded-2xl bg-spruce-600 text-white grid place-items-center shadow-sm">
          <Icon d={PATHS.upload} className="w-7 h-7" />
        </div>
        <h2 className="font-serif text-2xl font-semibold mt-5">
          {dragging ? "Drop it — I’ll take it from here" : "Drag & drop your file"}
        </h2>
        <p className="text-sm text-ink-soft dark:text-stone-400 mt-2">
          or <span className="font-semibold text-spruce-700 dark:text-spruce-300 underline underline-offset-2">browse from your device</span>
        </p>
        <div className="mt-5 flex items-center justify-center gap-2 flex-wrap">
          <span className="text-xs font-mono font-semibold px-3 py-1.5 rounded-full bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
            .py → Code Tutor
          </span>
          <span className="text-xs font-mono font-semibold px-3 py-1.5 rounded-full bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
            .pdf → Lab Prep
          </span>
        </div>

        {detected && (
          <div className="fade-up mt-6 inline-flex items-center gap-2 text-sm font-medium bg-spruce-50 dark:bg-spruce-900/40 text-spruce-700 dark:text-spruce-200 border border-spruce-200 dark:border-spruce-800 rounded-full px-4 py-2">
            <span className="w-2 h-2 rounded-full bg-spruce-500 animate-pulse" />
            Detected {detected.mode === "code" ? "Python code" : "lab manual"} — opening{" "}
            {detected.mode === "code" ? "Code Tutor" : "Lab Prep"}…
          </div>
        )}
      </div>

      {error && (
        <div className="fade-up mt-4 flex items-start gap-2.5 text-sm bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-800 dark:text-red-200 rounded-2xl px-4 py-3">
          <Icon d={PATHS.warn} className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="mt-6 flex flex-col sm:flex-row gap-2.5 justify-center">
        <Button variant="secondary" onClick={() => inputRef.current?.click()}>
          <Icon d={PATHS.file} className="w-4 h-4" /> Choose .py file
        </Button>
        <Button variant="secondary" onClick={() => inputRef.current?.click()}>
          <Icon d={PATHS.book} className="w-4 h-4" /> Choose lab PDF
        </Button>
      </div>
    </div>
  );
}
