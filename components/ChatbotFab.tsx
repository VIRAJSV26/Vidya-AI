"use client";

import { useApp } from "@/context/AppContext";
import { Icon, PATHS } from "./ui";

export default function ChatbotFab() {
  const { chatbotOpen, setChatbotOpen, uploads } = useApp();
  if (chatbotOpen) return null;

  return (
    <button
      onClick={() => setChatbotOpen(true)}
      aria-label="Open Vidya assistant"
      className="fixed bottom-5 right-5 z-40 group flex items-center gap-2.5 bg-ink dark:bg-white text-white dark:text-ink pl-4 pr-5 py-3.5 rounded-full shadow-pop hover:scale-[1.03] active:scale-95 transition-transform"
    >
      <span className="relative">
        <Icon d={PATHS.chat} className="w-5 h-5" />
        {uploads.length > 0 && (
          <span className="absolute -top-1.5 -right-1.5 w-3 h-3 rounded-full bg-spruce-400 border-2 border-ink dark:border-white" />
        )}
      </span>
      <span className="text-sm font-semibold">Ask Vidya</span>
    </button>
  );
}
