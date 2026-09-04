"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import UploadDropzone from "@/components/UploadDropzone";
import { Button, Card, Eyebrow, Icon, PATHS } from "@/components/ui";
import { useApp } from "@/context/AppContext";
import type { UploadedDoc } from "@/lib/types";

function formatBytes(n: number): string {
  if (!n) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

export default function UploadPage() {
  const router = useRouter();
  const { uploads, setActiveDoc, clearUploads } = useApp();

  const openDoc = (doc: UploadedDoc) => {
    setActiveDoc(doc);
    router.push(`/workspace?mode=${doc.mode}`);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <Eyebrow>Step 1 · Upload</Eyebrow>
      <h1 className="font-serif font-semibold text-4xl tracking-tight mt-2">What are we studying today?</h1>
      <p className="text-[15px] text-ink-soft dark:text-stone-300 mt-2 leading-relaxed">
        Vidya auto-detects the mode from your file — <strong>.py</strong> opens the Code Tutor,{" "}
        <strong>PDF</strong> opens Lab Prep. Nothing is uploaded to a server in this prototype.
      </p>

      <div className="mt-7">
        <UploadDropzone />
      </div>

      {/* session uploads — chatbot remembers these */}
      <Card className="mt-6 p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-serif font-semibold text-lg">This session’s files</h2>
          {uploads.length > 0 && (
            <button onClick={clearUploads} className="text-xs font-semibold text-ink-soft dark:text-stone-400 hover:text-red-600">
              Clear all
            </button>
          )}
        </div>
        {uploads.length === 0 ? (
          <p className="text-sm text-ink-soft dark:text-stone-400 mt-2 leading-relaxed">
            Nothing yet — your uploads will appear here, and the floating{" "}
            <strong>Ask Vidya</strong> assistant will remember them on every screen.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {uploads.map((u) => (
              <li
                key={u.id}
                className="flex items-center gap-3 rounded-xl border border-stone-200 dark:border-stone-800 px-4 py-3 hover:border-spruce-300 transition-colors"
              >
                <span className="w-9 h-9 rounded-xl grid place-items-center bg-stone-100 dark:bg-stone-800 text-ink-soft dark:text-stone-300 shrink-0">
                  <Icon d={u.kind === "py" ? PATHS.file : PATHS.book} className="w-4 h-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-mono text-[13px] font-semibold truncate">{u.name}</span>
                  <span className="block text-xs text-ink-soft dark:text-stone-400">
                    {u.mode === "code" ? "Code Tutor" : "Lab Prep"} · {formatBytes(u.sizeBytes)}
                  </span>
                </span>
                <Button size="sm" variant="secondary" onClick={() => openDoc(u)}>
                  Open <Icon d={PATHS.arrow} className="w-3.5 h-3.5" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div className="mt-6 flex items-center justify-between text-sm">
        <Link href="/" className="font-medium text-ink-soft dark:text-stone-400 hover:text-ink dark:hover:text-white">
          ← Back home
        </Link>
        <Link href="/workspace?mode=code" className="font-semibold text-spruce-700 dark:text-spruce-300 hover:underline underline-offset-4">
          Skip & explore a sample →
        </Link>
      </div>
    </div>
  );
}
