"use client";

import Link from "next/link";
import { useState } from "react";
import LandingHero from "@/components/LandingHero";
import { Button, Card, Eyebrow, Icon, PATHS } from "@/components/ui";

export default function LandingPage() {
  const [lastSample, setLastSample] = useState<string | null>(null);

  return (
    <div>
      <LandingHero onTrySample={(mode) => setLastSample(mode)} />

      {lastSample && (
        <p className="text-center text-xs text-ink-faint dark:text-stone-500 -mt-4" aria-live="polite">
          Opening {lastSample === "code" ? "Code Tutor" : "Lab Prep"} sample…
        </p>
      )}

      {/* How it works — 3 calm steps */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="text-center max-w-xl mx-auto">
          <Eyebrow>How it works</Eyebrow>
          <h2 className="font-serif font-semibold text-3xl mt-2 tracking-tight">Three steps to clarity</h2>
          <p className="text-[15px] text-ink-soft dark:text-stone-300 mt-2">
            No sign-up wall. No setup. Just bring the thing you’re stuck on.
          </p>
        </div>
        <div className="mt-8 grid sm:grid-cols-3 gap-4">
          <StepCard
            n="1"
            title="Upload"
            desc="Drop a .py file or a PDF lab manual. Vidya detects the type and opens the right tutor automatically."
          />
          <StepCard
            n="2"
            title="Explore"
            desc="Read alongside the AI — trace code like a debugger, or work through prep cards with a readiness score."
          />
          <StepCard
            n="3"
            title="Keep it"
            desc="Chat to go deeper, then hit “Email me this” to get your notes and prep sheet in your inbox."
          />
        </div>

        <Card className="mt-8 p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <div className="flex-1">
            <h3 className="font-serif font-semibold text-2xl tracking-tight">Ready when you are.</h3>
            <p className="text-sm text-ink-soft dark:text-stone-300 mt-1.5 leading-relaxed">
              Start with an upload, or jump straight into a sample workspace. Your files stay in this
              session — the floating assistant remembers them on every screen.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2.5 w-full sm:w-auto">
            <Link href="/upload" className="w-full sm:w-auto">
              <Button size="lg" className="w-full">
                <Icon d={PATHS.upload} className="w-4 h-4" /> Upload a file
              </Button>
            </Link>
            <Link href="/workspace?mode=code" className="w-full sm:w-auto">
              <Button size="lg" variant="secondary" className="w-full">
                Open workspace <Icon d={PATHS.arrow} className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </Card>

        {/* classroom note */}
        <p className="text-center text-xs text-ink-faint dark:text-stone-500 mt-8 max-w-lg mx-auto leading-relaxed">
          Built for students: generous whitespace, one calm accent, readable type. Dark mode included
          for late-night lab reports.
        </p>
      </section>
    </div>
  );
}

function StepCard({ n, title, desc }: { n: string; title: string; desc: string }) {
  return (
    <div className="bg-paper dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 rounded-2xl p-6 shadow-card">
      <span className="w-9 h-9 rounded-full bg-spruce-600 text-white grid place-items-center font-serif font-semibold text-lg">{n}</span>
      <h3 className="font-serif font-semibold text-lg mt-4">{title}</h3>
      <p className="text-sm text-ink-soft dark:text-stone-400 mt-1.5 leading-relaxed">{desc}</p>
    </div>
  );
}
