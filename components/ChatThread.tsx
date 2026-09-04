"use client";

import { useEffect, useRef } from "react";
import type { ChatMessage } from "@/lib/types";

interface ChatThreadProps {
  messages: ChatMessage[];
  typing: boolean;
  onSuggestionClick?: (suggestion: string) => void;
  compact?: boolean;
}

function timeAgo(iso: string): string {
  const mins = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m ago`;
  const h = Math.round(mins / 60);
  if (h < 24) return `${h}h ago`;
  return new Date(iso).toLocaleDateString();
}

/** Renders **bold** + line breaks simply (no md dep needed for the mock). */
function renderInline(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) =>
    p.startsWith("**") && p.endsWith("**") ? (
      <strong key={i} className="font-semibold">{p.slice(2, -2)}</strong>
    ) : (
      <span key={i}>
        {p.split("\n").map((line, j, arr) => (
          <span key={j}>
            {line}
            {j < arr.length - 1 && <br />}
          </span>
        ))}
      </span>
    )
  );
}

export default function ChatThread({ messages, typing, onSuggestionClick }: ChatThreadProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, typing]);

  return (
    <div className="flex flex-col gap-4">
      {messages.map((m) => {
        const isUser = m.role === "user";
        return (
          <div key={m.id} className={`flex gap-2.5 ${isUser ? "flex-row-reverse" : ""}`}>
            {!isUser && (
              <span className="w-8 h-8 shrink-0 rounded-xl bg-spruce-600 text-white grid place-items-center font-serif text-base mt-0.5">
                वि
              </span>
            )}
            <div className={`max-w-[85%] ${isUser ? "items-end flex flex-col" : ""}`}>
              <div
                className={`px-4 py-3 rounded-2xl text-[14px] leading-relaxed shadow-sm ${
                  isUser
                    ? "bg-spruce-600 text-white rounded-br-md"
                    : "bg-white dark:bg-stone-800 border border-stone-200/80 dark:border-stone-700 text-ink dark:text-stone-100 rounded-bl-md"
                }`}
              >
                {renderInline(m.content)}
              </div>
              <p className="text-[11px] text-ink-faint dark:text-stone-500 mt-1 px-1">
                {isUser ? "You" : "Vidya"} · {timeAgo(m.timestamp)}
              </p>
              {!isUser && m.suggestions && m.suggestions.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {m.suggestions.map((s) => (
                    <button
                      key={s}
                      onClick={() => onSuggestionClick?.(s)}
                      className="text-xs font-medium px-3 py-1.5 rounded-full border border-spruce-200 dark:border-spruce-800 bg-spruce-50 dark:bg-spruce-900/30 text-spruce-700 dark:text-spruce-200 hover:bg-spruce-100 dark:hover:bg-spruce-900/60 transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}

      {typing && (
        <div className="flex gap-2.5">
          <span className="w-8 h-8 shrink-0 rounded-xl bg-spruce-600 text-white grid place-items-center font-serif text-base">
            वि
          </span>
          <div className="bg-white dark:bg-stone-800 border border-stone-200/80 dark:border-stone-700 px-4 py-3.5 rounded-2xl rounded-bl-md flex gap-1.5">
            <span className="typing-dot w-2 h-2 rounded-full bg-stone-400" />
            <span className="typing-dot w-2 h-2 rounded-full bg-stone-400" />
            <span className="typing-dot w-2 h-2 rounded-full bg-stone-400" />
          </div>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}
