"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { AppMode, ChatMessage, CodeDoc, LabManualDoc, LabPrep, TraceStep } from "@/lib/types";
import { MOCK_CODE_CHAT, MOCK_LAB_CHAT } from "@/lib/mock-data";
import { fetchCodeDoc, fetchExecutionTrace, fetchLabPrep, fetchManualDoc, sendChatMessage } from "@/lib/api-stubs";
import { useApp } from "@/context/AppContext";
import CodeViewer from "./CodeViewer";
import ManualViewer from "./ManualViewer";
import ChatThread from "./ChatThread";
import ChatInput from "./ChatInput";
import ExecutionTrace from "./ExecutionTrace";
import LabPrepView from "./LabPrepView";
import QuizModal from "./QuizModal";
import { Button, Icon, ModeBadge, PATHS } from "./ui";

interface WorkspaceViewProps {
  mode: AppMode;
}

export default function WorkspaceView({ mode }: WorkspaceViewProps) {
  const { activeDoc, openEmail } = useApp();

  const [codeDoc, setCodeDoc] = useState<CodeDoc | null>(null);
  const [manualDoc, setManualDoc] = useState<LabManualDoc | null>(null);
  const [trace, setTrace] = useState<TraceStep[]>([]);
  const [labPrep, setLabPrep] = useState<LabPrep | null>(null);
  const [loadingDoc, setLoadingDoc] = useState(true);

  const [messages, setMessages] = useState<ChatMessage[]>(mode === "code" ? MOCK_CODE_CHAT : MOCK_LAB_CHAT);
  const [typing, setTyping] = useState(false);
  const [traceIndex, setTraceIndex] = useState(0);

  const [quizOpen, setQuizOpen] = useState(false);
  const [quizScore, setQuizScore] = useState<number | undefined>(undefined);

  const docName = activeDoc?.name ?? (mode === "code" ? "bubble_sort.py" : "ohms-law-lab.pdf");
  const docId = activeDoc?.id ?? "sample";

  // Load the left-panel document + bottom panel data (stubbed API calls)
  useEffect(() => {
    let alive = true;
    setLoadingDoc(true);
    (async () => {
      try {
        if (mode === "code") {
          // BACKEND: GET /api/docs/:docId + GET /api/trace?docId=
          const [cd, tr] = await Promise.all([fetchCodeDoc(docId), fetchExecutionTrace(docId)]);
          if (!alive) return;
          setCodeDoc(cd);
          setTrace(tr);
          setTraceIndex(0);
        } else {
          // BACKEND: GET /api/manual?docId= + POST /api/lab-prep
          const [md, lp] = await Promise.all([fetchManualDoc(docId), fetchLabPrep(docId)]);
          if (!alive) return;
          setManualDoc(md);
          setLabPrep(lp);
        }
      } finally {
        if (alive) setLoadingDoc(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [mode, docId]);

  // Reset chat when switching modes
  useEffect(() => {
    setMessages(mode === "code" ? MOCK_CODE_CHAT : MOCK_LAB_CHAT);
  }, [mode]);

  const activeLine = useMemo(
    () => (mode === "code" && trace[traceIndex] ? trace[traceIndex].line : null),
    [mode, trace, traceIndex]
  );

  const send = async (text: string) => {
    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date().toISOString(),
    };
    setMessages((p) => [...p, userMsg]);
    setTyping(true);
    try {
      // BACKEND: POST /api/chat { docId, mode, message, history }
      const reply = await sendChatMessage(text, mode, messages.length, docId);
      setMessages((p) => [...p, reply]);
    } finally {
      setTyping(false);
    }
  };

  const jumpToLine = (line: number) => {
    // find nearest trace step at/before that line
    let best = 0;
    trace.forEach((s, i) => {
      if (s.line <= line) best = i;
    });
    // if clicked line is itself a step, prefer exact match
    const exact = trace.findIndex((s) => s.line === line);
    setTraceIndex(exact >= 0 ? exact : best);
    document.getElementById("trace-panel")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  };

  const otherMode: AppMode = mode === "code" ? "lab" : "code";

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
      {/* workspace header */}
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/upload" className="text-sm font-medium text-ink-soft dark:text-stone-400 hover:text-ink dark:hover:text-white">
          ← Uploads
        </Link>
        <span className="text-stone-300 dark:text-stone-700">/</span>
        <ModeBadge mode={mode} />
        <h1 className="font-mono text-sm font-semibold truncate max-w-[40vw]">{docName}</h1>
        <div className="ml-auto flex items-center gap-2">
          <Button size="sm" variant="secondary" onClick={() => setQuizOpen(true)} className="hidden sm:inline-flex bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg> Take Quiz
          </Button>
          <Link href={`/workspace?mode=${otherMode}`}>
            <Button variant="secondary" size="sm">
              Switch to {otherMode === "code" ? "Code Tutor" : "Lab Prep"}
            </Button>
          </Link>
          <Button size="sm" variant="secondary" onClick={() => openEmail({ mode, docName, score: quizScore })} className="hidden sm:inline-flex">
            <Icon d={PATHS.mail} className="w-4 h-4" /> Email me this
          </Button>
        </div>
      </div>

      {/* split layout: left document, right chat */}
      <div className="mt-5 grid lg:grid-cols-12 gap-4 items-start">
        <div className="lg:col-span-7">
          {mode === "code" ? (
            codeDoc ? (
              <CodeViewer doc={codeDoc} activeLine={activeLine} onLineClick={jumpToLine} />
            ) : (
              <DocSkeleton label="Loading code…" />
            )
          ) : manualDoc ? (
            <ManualViewer doc={manualDoc} />
          ) : (
            <DocSkeleton label="Parsing manual…" />
          )}
        </div>

        <div className="lg:col-span-5 lg:sticky lg:top-20 overflow-hidden rounded-2xl border border-stone-200/80 dark:border-stone-800 bg-cream/40 dark:bg-stone-950/40 shadow-card flex flex-col min-h-[480px] max-h-[78vh]">
          <div className="px-4 sm:px-5 py-3.5 border-b border-stone-200/70 dark:border-stone-800 bg-paper dark:bg-stone-900">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-faint dark:text-stone-500">
              Chat with your tutor
            </p>
            <p className="font-serif font-semibold text-[17px]">
              {mode === "code" ? "Ask about this code" : "Ask about this experiment"}
            </p>
          </div>
          <div className="flex-1 overflow-y-auto nice-scroll px-4 sm:px-5 py-4">
            <ChatThread messages={messages} typing={typing} onSuggestionClick={send} />
          </div>
          <ChatInput
            onSend={send}
            disabled={typing}
            placeholder={mode === "code" ? "e.g. Explain line 7…" : "e.g. Why must the wire stay cool?"}
          />
        </div>
      </div>

      {/* bottom panel: trace OR lab prep */}
      <div id="trace-panel" className="mt-4 scroll-mt-24">
        {mode === "code" ? (
          <ExecutionTrace steps={trace} current={traceIndex} onChange={setTraceIndex} loading={loadingDoc} />
        ) : labPrep ? (
          <LabPrepView prep={labPrep} onChange={setLabPrep} loading={false} />
        ) : (
          <DocSkeleton label="Building prep cards…" />
        )}
      </div>

      {/* mobile email CTA */}
      <div className="mt-4 sm:hidden flex gap-2">
        <Button variant="secondary" className="flex-1" onClick={() => setQuizOpen(true)}>
          Take Quiz
        </Button>
        <Button variant="secondary" className="flex-1" onClick={() => openEmail({ mode, docName, score: quizScore })}>
          <Icon d={PATHS.mail} className="w-4 h-4" /> Email me this
        </Button>
      </div>

      {quizOpen && (
        <QuizModal 
          quiz={mode === "code" ? codeDoc?.quiz : labPrep?.quiz} 
          onClose={() => setQuizOpen(false)} 
          onComplete={(score) => setQuizScore(score)}
          onEmailScore={(score) => openEmail({ mode, docName, score })}
        />
      )}
    </div>
  );
}

function DocSkeleton({ label }: { label: string }) {
  return (
    <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-paper dark:bg-stone-900 p-6">
      <div className="animate-pulse space-y-3">
        <div className="h-4 w-40 bg-stone-200 dark:bg-stone-700 rounded" />
        <div className="h-3 w-full bg-stone-100 dark:bg-stone-800 rounded" />
        <div className="h-3 w-5/6 bg-stone-100 dark:bg-stone-800 rounded" />
        <div className="h-3 w-4/6 bg-stone-100 dark:bg-stone-800 rounded" />
      </div>
      <p className="text-xs text-ink-faint mt-4">{label}</p>
    </div>
  );
}
