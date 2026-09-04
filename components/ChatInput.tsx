"use client";

import { useState } from "react";
import { Icon, PATHS } from "./ui";

interface ChatInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export default function ChatInput({ onSend, disabled, placeholder }: ChatInputProps) {
  const [value, setValue] = useState("");

  const submit = () => {
    const text = value.trim();
    if (!text || disabled) return;
    onSend(text);
    setValue("");
  };

  return (
    <div className="border-t border-stone-200/80 dark:border-stone-800 bg-paper/95 dark:bg-stone-900/95 backdrop-blur px-3 sm:px-4 py-3">
      <div className="flex items-end gap-2">
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          rows={1}
          placeholder={placeholder ?? "Ask about your file… (Enter to send)"}
          disabled={disabled}
          className="flex-1 resize-none max-h-32 rounded-xl border border-stone-200 dark:border-stone-700 bg-cream/60 dark:bg-stone-950 px-4 py-3 text-sm placeholder:text-ink-faint dark:placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-spruce-500 focus:border-transparent disabled:opacity-60"
        />
        <button
          onClick={submit}
          disabled={disabled || !value.trim()}
          aria-label="Send message"
          className="w-11 h-11 shrink-0 grid place-items-center rounded-xl bg-spruce-600 text-white hover:bg-spruce-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
        >
          <Icon d={PATHS.send} className="w-5 h-5" />
        </button>
      </div>
      <p className="text-[11px] text-ink-faint dark:text-stone-500 mt-1.5 px-1">
        Vidya can make mistakes — verify tricky derivations with your textbook.
      </p>
    </div>
  );
}
