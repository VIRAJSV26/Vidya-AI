/**
 * API client layer connected to FastAPI backend.
 * Falls back gracefully to curated local mock data if the backend is unavailable.
 */
import type { ChatMessage, CodeDoc, LabManualDoc, LabPrep, TraceStep, AppMode, UploadedDoc } from "./types";
import { MOCK_CODE_DOC, MOCK_TRACE, MOCK_LAB_DOC, MOCK_LAB_PREP } from "./mock-data";

const uid = () => Math.random().toString(36).slice(2, 9);

export async function uploadFileToBackend(file: File): Promise<UploadedDoc> {
  const formData = new FormData();
  formData.append("file", file);
  try {
    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn("Upload to backend failed, using local session object:", err);
  }
  const mode = detectModeFromFilename(file.name) || "code";
  return {
    id: `${Date.now()}-${file.name}`,
    name: file.name,
    kind: mode === "code" ? "py" : "pdf",
    mode,
    sizeBytes: file.size,
    uploadedAt: new Date().toISOString(),
  };
}

/** BACKEND: GET /api/docs/:docId */
export async function fetchCodeDoc(docId: string): Promise<CodeDoc> {
  try {
    const res = await fetch(`/api/docs/${encodeURIComponent(docId)}`);
    if (res.ok) return await res.json();
  } catch (err) {
    console.warn("fetchCodeDoc fallback:", err);
  }
  return MOCK_CODE_DOC;
}

/** BACKEND: GET /api/trace?docId=... */
export async function fetchExecutionTrace(docId: string): Promise<TraceStep[]> {
  try {
    const res = await fetch(`/api/trace?docId=${encodeURIComponent(docId)}`);
    if (res.ok) return await res.json();
  } catch (err) {
    console.warn("fetchExecutionTrace fallback:", err);
  }
  return MOCK_TRACE;
}

/** BACKEND: POST /api/lab-prep */
export async function fetchLabPrep(docId: string): Promise<LabPrep> {
  try {
    const res = await fetch("/api/lab-prep", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ docId }),
    });
    if (res.ok) return await res.json();
  } catch (err) {
    console.warn("fetchLabPrep fallback:", err);
  }
  return structuredClone(MOCK_LAB_PREP);
}

/** BACKEND: GET /api/manual?docId=... */
export async function fetchManualDoc(docId: string): Promise<LabManualDoc> {
  try {
    const res = await fetch(`/api/manual?docId=${encodeURIComponent(docId)}`);
    if (res.ok) return await res.json();
  } catch (err) {
    console.warn("fetchManualDoc fallback:", err);
  }
  return MOCK_LAB_DOC;
}

/** BACKEND: POST /api/chat */
export async function sendChatMessage(
  message: string,
  mode: AppMode,
  historyLength: number,
  docId?: string
): Promise<ChatMessage> {
  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        mode,
        historyLength,
        docId: docId || "sample",
      }),
    });
    if (res.ok) return await res.json();
  } catch (err) {
    console.warn("sendChatMessage fallback:", err);
  }

  // Local fallback
  return {
    id: uid(),
    role: "ai",
    content: `I've analyzed your ${mode === "code" ? "code" : "lab manual"}. For '${message}', check the steps and traces in the bottom panel!`,
    timestamp: new Date().toISOString(),
    suggestions: ["Explain step-by-step", "Quiz me", "What are the common mistakes?"],
  };
}

/** BACKEND: GET /api/email/preview */
export async function fetchEmailPreview(docId: string, score?: number): Promise<string> {
  try {
    const url = new URL("/api/email/preview", window.location.origin);
    url.searchParams.append("docId", docId);
    if (score !== undefined) url.searchParams.append("score", score.toString());
    const res = await fetch(url.toString());
    if (res.ok) {
      const data = await res.json();
      return data.preview;
    }
  } catch (err) {
    console.warn("fetchEmailPreview fallback:", err);
  }
  return "Preview not available.";
}

/** BACKEND: POST /api/email */
export async function sendEmailSummary(
  to: string,
  subject: string,
  bodyPreview?: string,
  mode: AppMode = "code",
  docName: string = "document",
  docId?: string,
  score?: number
): Promise<{ ok: boolean; detail?: any }> {
  try {
    const res = await fetch("/api/email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to,
        subject,
        bodyPreview: bodyPreview || "",
        mode,
        docName,
        docId,
        score
      }),
    });
    if (res.ok) return await res.json();
    else return { ok: false, detail: await res.json() };
  } catch (err) {
    console.warn("sendEmailSummary fallback:", err);
  }
  return { ok: false, detail: { note: "Network error" } };
}

/** Infer workspace mode from a file name/extension. Used by the upload screen. */
export function detectModeFromFilename(name: string): AppMode | null {
  const lower = name.toLowerCase();
  if (lower.endsWith(".py")) return "code";
  if (lower.endsWith(".pdf")) return "lab";
  return null;
}
