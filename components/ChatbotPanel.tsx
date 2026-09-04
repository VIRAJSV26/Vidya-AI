"use client";

import { useState } from "react";
import Link from "next/link";
import { useApp } from "@/context/AppContext";
import { sendChatMessage } from "@/lib/api-stubs";
import ChatThread from "./ChatThread";
import ChatInput from "./ChatInput";
import { Icon, PATHS } from "./ui";
import type { ChatMessage } from "@/lib/types";

export default function ChatbotPanel() {
  const {
    chatbotOpen,
    setChatbotOpen,
    uploads,
    activeDoc,
    setActiveDoc,
    floatingMessages,
    pushFloatingMessage,
  } = useApp();
  const [typing, setTyping] = useState(false);

  if (!chatbotOpen) return null;

  const ask = async (text: string) => {
    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date().toISOString(),
    };
    pushFloatingMessage(userMsg);
    setTyping(true);
    try {
      const reply = await sendChatMessage(
        text,
        activeDoc?.mode ?? "code",
        floatingMessages.length,
        activeDoc?.id
      );
      pushFloatingMessage(reply);
    } finally {
      setTyping(false);
    }
  };

  return (
    <>
      {/* scrim */}
      <div
        className="fixed inset-0 z-40 bg-ink/30 backdrop-blur-[2px]"
        onClick={() => setChatbotOpen(false)}
        aria-hidden
      />
      {/* slide-over */}
      <aside className="slide-in-right fixed top-0 right-0 z-50 h-full w-full sm:w-[420px] bg-cream dark:bg-stone-950 border-l border-stone-200 dark:border-stone-800 shadow-pop flex flex-col">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-stone-200 dark:border-stone-800">
          <span className="w-9 h-9 rounded-xl bg-spruce-600 text-white grid place-items-center font-serif text-lg">वि</span>
          <div className="flex-1 min-w-0">
            <p className="font-serif font-semibold text-[17px]">Vidya assistant</p>
            <p className="text-xs text-ink-soft dark:text-stone-400">Available on every screen</p>
          </div>
          <button
            onClick={() => setChatbotOpen(false)}
            aria-label="Close assistant"
            className="w-9 h-9 grid place-items-center rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 text-ink-soft"
          >
            <Icon d={PATHS.x} className="w-5 h-5" />
          </button>
        </div>

        {/* session memory */}
        <div className="px-5 py-3 border-b border-stone-200 dark:border-stone-800 bg-paper dark:bg-stone-900">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint dark:text-stone-500">
            Remembers this session · {uploads.length} upload{uploads.length === 1 ? "" : "s"}
          </p>
          {uploads.length === 0 ? (
            <p className="text-[13px] text-ink-soft dark:text-stone-400 mt-1.5">
              No files yet. <Link href="/upload" onClick={() => setChatbotOpen(false)} className="font-semibold text-spruce-700 dark:text-spruce-300 underline underline-offset-2">Upload one</Link> and I’ll keep it in mind here.
            </p>
          ) : (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {uploads.map((u) => (
                <button
                  key={u.id}
                  onClick={() => setActiveDoc(u)}
                  title={`Switch to ${u.name}`}
                  className={`text-xs font-mono font-medium px-2.5 py-1.5 rounded-full border transition-colors ${
                    activeDoc?.id === u.id
                      ? "border-spruce-500 bg-spruce-50 dark:bg-spruce-900/40 text-spruce-700 dark:text-spruce-200"
                      : "border-stone-200 dark:border-stone-700 bg-cream dark:bg-stone-950 text-ink-soft dark:text-stone-300 hover:border-spruce-300"
                  }`}
                >
                  {u.kind === "py" ? "▸ " : "⬣ "}{u.name}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto nice-scroll px-5 py-4">
          <ChatThread messages={floatingMessages} typing={typing} onSuggestionClick={ask} />
        </div>
        <ChatInput onSend={ask} disabled={typing} placeholder="Ask anything you’re studying…" />
      </aside>
    </>
  );
}
