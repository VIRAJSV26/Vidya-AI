"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import WorkspaceView from "@/components/WorkspaceView";
import type { AppMode } from "@/lib/types";

function WorkspaceContent() {
  const params = useSearchParams();
  const raw = params.get("mode");
  const mode: AppMode = raw === "lab" ? "lab" : "code";
  return <WorkspaceView key={mode} mode={mode} />;
}

export default function WorkspacePage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
          <div className="animate-pulse space-y-3">
            <div className="h-5 w-52 bg-stone-200 dark:bg-stone-700 rounded" />
            <div className="h-64 bg-stone-100 dark:bg-stone-800 rounded-2xl" />
          </div>
        </div>
      }
    >
      <WorkspaceContent />
    </Suspense>
  );
}
