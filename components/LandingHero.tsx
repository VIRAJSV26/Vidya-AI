"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Card, Eyebrow, Icon, PATHS } from "./ui";
import { useApp } from "@/context/AppContext";
import type { UploadedDoc } from "@/lib/types";

interface LandingHeroProps {
  onTrySample: (mode: "code" | "lab") => void;
}

export default function LandingHero({ onTrySample }: LandingHeroProps) {
  const router = useRouter();
  const { addUpload } = useApp();

  const loadSample = (mode: "code" | "lab") => {
    const doc: UploadedDoc =
      mode === "code"
        ? {
            id: "sample-py",
            name: "bubble_sort.py",
            kind: "py",
            mode: "code",
            sizeBytes: 482,
            uploadedAt: new Date().toISOString(),
          }
        : {
            id: "sample-pdf",
            name: "ohms-law-lab.pdf",
            kind: "pdf",
            mode: "lab",
            sizeBytes: 184320,
            uploadedAt: new Date().toISOString(),
          };
    addUpload(doc);
    onTrySample(mode);
    router.push(`/workspace?mode=${mode}`);
  };

  return (
    <section className="relative overflow-hidden">
      <div className="paper-grid absolute inset-0" aria-hidden />
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-14 sm:pt-20 pb-10 text-center">
        <Eyebrow>Vidya · AI academic companion</Eyebrow>
        <h1 className="font-serif font-semibold tracking-tight text-[42px] leading-[1.05] sm:text-6xl mt-4 max-w-3xl mx-auto">
          Ask anything.
          <br />
          Understand everything.
        </h1>
        <p className="mt-5 text-[17px] leading-relaxed text-ink-soft dark:text-stone-300 max-w-xl mx-auto">
          Drop in a Python file or a lab manual PDF. Vidya becomes your tutor —
          explaining code line by line, or prepping you for the lab bench.
        </p>

        {/* Upload CTA front and center */}
        <Card className="mt-9 max-w-2xl mx-auto p-5 sm:p-7 text-left fade-up">
          <div className="flex flex-col sm:flex-row gap-4 items-stretch">
            <Link
              href="/upload"
              className="flex-1 group border-2 border-dashed border-stone-300 dark:border-stone-700 hover:border-spruce-500 dark:hover:border-spruce-400 rounded-2xl px-5 py-6 flex items-center gap-4 transition-colors bg-cream/60 dark:bg-stone-950"
            >
              <span className="w-12 h-12 shrink-0 rounded-2xl bg-spruce-600 text-white grid place-items-center group-hover:scale-105 transition-transform">
                <Icon d={PATHS.upload} className="w-6 h-6" />
              </span>
              <span>
                <span className="block font-semibold text-[16px]">
                  Drop your file here, or browse
                </span>
                <span className="block text-sm text-ink-soft dark:text-stone-400 mt-0.5">
                  <code className="font-mono text-[13px] bg-stone-100 dark:bg-stone-800 px-1.5 py-0.5 rounded">.py</code>{" "}
                  → Code Tutor ·{" "}
                  <code className="font-mono text-[13px] bg-stone-100 dark:bg-stone-800 px-1.5 py-0.5 rounded">.pdf</code>{" "}
                  → Lab Prep
                </span>
              </span>
            </Link>
          </div>
          <div className="mt-4 flex flex-col sm:flex-row items-center gap-2.5">
            <Button size="lg" className="w-full sm:w-auto" onClick={() => loadSample("code")}>
              <Icon d={PATHS.file} className="w-4 h-4" />
              Try a code sample
            </Button>
            <Button size="lg" variant="secondary" className="w-full sm:w-auto" onClick={() => loadSample("lab")}>
              <Icon d={PATHS.flask} className="w-4 h-4" />
              Try a lab sample
            </Button>
            <span className="text-xs text-ink-faint dark:text-stone-500 sm:ml-auto pt-1">
              No sign-up needed to try
            </span>
          </div>
        </Card>

        {/* Two modes */}
        <div className="mt-8 grid sm:grid-cols-2 gap-4 max-w-3xl mx-auto text-left">
          <ModeCard
            icon={PATHS.file}
            title="Code Explanation Tutor"
            desc="Paste or upload Python. Get plain-language explanations plus a debugger-style trace with live variables."
            cta="Open with code sample"
            onClick={() => loadSample("code")}
          />
          <ModeCard
            icon={PATHS.flask}
            title="Lab Experiment Prep"
            desc="Upload the lab-manual PDF. Get objective, materials checklist, steps, expected output & a readiness score."
            cta="Open with lab sample"
            onClick={() => loadSample("lab")}
            tone="clay"
          />
        </div>
      </div>
    </section>
  );
}

function ModeCard({
  icon,
  title,
  desc,
  cta,
  onClick,
  tone = "spruce",
}: {
  icon: string;
  title: string;
  desc: string;
  cta: string;
  onClick: () => void;
  tone?: "spruce" | "clay";
}) {
  return (
    <div className="bg-paper dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 rounded-2xl p-5 shadow-card hover:shadow-pop hover:-translate-y-0.5 transition-all">
      <span
        className={`w-10 h-10 rounded-xl grid place-items-center mb-3 ${
          tone === "spruce" ? "bg-spruce-50 dark:bg-spruce-900/40 text-spruce-700 dark:text-spruce-200" : "bg-clay-50 dark:bg-stone-800 text-clay-600 dark:text-amber-200"
        }`}
      >
        <Icon d={icon} />
      </span>
      <h3 className="font-serif font-semibold text-lg">{title}</h3>
      <p className="text-sm text-ink-soft dark:text-stone-400 mt-1 leading-relaxed">{desc}</p>
      <button
        onClick={onClick}
        className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-spruce-700 dark:text-spruce-300 hover:gap-2.5 transition-all"
      >
        {cta} <Icon d={PATHS.arrow} className="w-4 h-4" />
      </button>
    </div>
  );
}
