"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { AppMode, ChatMessage, UploadedDoc } from "@/lib/types";
import { MOCK_FLOATING_CHAT } from "@/lib/mock-data";

interface AppContextValue {
  theme: "light" | "dark";
  toggleTheme: () => void;
  uploads: UploadedDoc[];
  activeDoc: UploadedDoc | null;
  addUpload: (doc: UploadedDoc) => void;
  setActiveDoc: (doc: UploadedDoc | null) => void;
  clearUploads: () => void;
  chatbotOpen: boolean;
  setChatbotOpen: (open: boolean) => void;
  emailOpen: boolean;
  setEmailOpen: (open: boolean) => void;
  emailContext: { mode: AppMode; docName: string; score?: number };
  setEmailContext: (ctx: { mode: AppMode; docName: string; score?: number }) => void;
  openEmail: (ctx?: { mode: AppMode; docName: string; score?: number }) => void;
  floatingMessages: ChatMessage[];
  pushFloatingMessage: (msg: ChatMessage) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [uploads, setUploads] = useState<UploadedDoc[]>([]);
  const [activeDoc, setActiveDoc] = useState<UploadedDoc | null>(null);
  const [chatbotOpen, setChatbotOpen] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);
  const [emailContext, setEmailContext] = useState<{ mode: AppMode; docName: string; score?: number }>({
    mode: "code",
    docName: "bubble_sort.py",
  });
  const [floatingMessages, setFloatingMessages] = useState<ChatMessage[]>(MOCK_FLOATING_CHAT);

  // Apply `dark` class for Tailwind darkMode:"class" + persist choice
  useEffect(() => {
    const saved = typeof window !== "undefined" ? window.localStorage.getItem("vidya-theme") : null;
    if (saved === "dark" || saved === "light") setTheme(saved);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
    try {
      window.localStorage.setItem("vidya-theme", theme);
    } catch {}
  }, [theme]);

  // Restore session uploads (chatbot "remembers prior uploads in this session")
  useEffect(() => {
    try {
      const raw = window.sessionStorage.getItem("vidya-uploads");
      if (raw) {
        const parsed = JSON.parse(raw) as UploadedDoc[];
        setUploads(parsed);
        if (parsed.length > 0) setActiveDoc(parsed[parsed.length - 1]);
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      window.sessionStorage.setItem("vidya-uploads", JSON.stringify(uploads));
    } catch {}
  }, [uploads]);

  const toggleTheme = useCallback(
    () => setTheme((t) => (t === "light" ? "dark" : "light")),
    []
  );

  const addUpload = useCallback((doc: UploadedDoc) => {
    setUploads((prev) => [...prev.filter((d) => d.id !== doc.id), doc]);
    setActiveDoc(doc);
  }, []);

  const clearUploads = useCallback(() => {
    setUploads([]);
    setActiveDoc(null);
    try {
      window.sessionStorage.removeItem("vidya-uploads");
    } catch {}
  }, []);

  const openEmail = useCallback(
    (ctx?: { mode: AppMode; docName: string; score?: number }) => {
      if (ctx) setEmailContext(ctx);
      setEmailOpen(true);
    },
    []
  );

  const pushFloatingMessage = useCallback((msg: ChatMessage) => {
    setFloatingMessages((prev) => [...prev, msg]);
  }, []);

  const value = useMemo<AppContextValue>(
    () => ({
      theme,
      toggleTheme,
      uploads,
      activeDoc,
      addUpload,
      setActiveDoc,
      clearUploads,
      chatbotOpen,
      setChatbotOpen,
      emailOpen,
      setEmailOpen,
      emailContext,
      setEmailContext,
      openEmail,
      floatingMessages,
      pushFloatingMessage,
    }),
    [
      theme,
      toggleTheme,
      uploads,
      activeDoc,
      addUpload,
      clearUploads,
      chatbotOpen,
      emailOpen,
      emailContext,
      floatingMessages,
      pushFloatingMessage,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside <AppProvider>");
  return ctx;
}
