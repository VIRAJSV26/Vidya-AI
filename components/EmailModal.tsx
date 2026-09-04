"use client";

import { useEffect, useMemo, useState } from "react";
import { useApp } from "@/context/AppContext";
import { fetchEmailPreview, sendEmailSummary } from "@/lib/api-stubs";
import { Button, Icon, PATHS } from "./ui";

export default function EmailModal() {
  const { emailOpen, setEmailOpen, emailContext, uploads, activeDoc } = useApp();
  const [to, setTo] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [previewBody, setPreviewBody] = useState("");

  const docId = activeDoc?.id ?? "sample";

  useEffect(() => {
    if (emailOpen) {
      setSent(false);
      setError(null);
      setSending(false);
      setLoadingPreview(true);
      
      // Fetch dynamic preview from backend
      fetchEmailPreview(docId, emailContext.score)
        .then(body => {
          setPreviewBody(body);
          setLoadingPreview(false);
        })
        .catch(() => {
          setPreviewBody("Failed to load summary preview. It will still send correctly.");
          setLoadingPreview(false);
        });
    }
  }, [emailOpen, emailContext.score, docId]);

  const preview = useMemo(() => {
    const isCode = emailContext.mode === "code";
    const subject = isCode
      ? `Your Code Tutor notes — ${emailContext.docName}`
      : `Your Lab Prep sheet — ${emailContext.docName}`;
    return { subject, body: previewBody };
  }, [emailContext, previewBody]);

  if (!emailOpen) return null;

  const valid = /.+@.+\..+/.test(to.trim());

  const confirm = async () => {
    if (!valid || sending) return;
    setSending(true);
    setError(null);
    try {
      // BACKEND: Expects POST /api/email { to, subject, body, docId }
      const res = await sendEmailSummary(
        to.trim(),
        preview.subject,
        preview.body,
        emailContext.mode,
        emailContext.docName,
        docId,
        emailContext.score
      );
      if (res.ok) setSent(true);
      else setError(res.detail?.note || "Couldn’t send just now — please try again.");
    } catch {
      setError("Couldn’t send just now — please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]" onClick={() => !sending && setEmailOpen(false)} aria-hidden />
      <div className="fade-up relative w-full max-w-lg bg-paper dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-3xl shadow-pop overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-5 border-b border-stone-200 dark:border-stone-800">
          <span className="w-10 h-10 rounded-2xl bg-spruce-600 text-white grid place-items-center">
            <Icon d={PATHS.mail} className="w-5 h-5" />
          </span>
          <div className="flex-1">
            <h2 className="font-serif font-semibold text-xl">Email me this</h2>
            <p className="text-xs text-ink-soft dark:text-stone-400">Preview exactly what will be sent — confirm to send.</p>
          </div>
          <button
            onClick={() => setEmailOpen(false)}
            aria-label="Close email dialog"
            className="w-9 h-9 grid place-items-center rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800"
          >
            <Icon d={PATHS.x} />
          </button>
        </div>

        {!sent ? (
          <div className="px-6 py-5 space-y-4">
            <div>
              <label htmlFor="email-to" className="text-xs font-semibold uppercase tracking-wider text-ink-soft dark:text-stone-400">
                Send to
              </label>
              <input
                id="email-to"
                type="email"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="you@college.edu"
                className="mt-1.5 w-full rounded-xl border border-stone-200 dark:border-stone-700 bg-cream/60 dark:bg-stone-950 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-spruce-500"
              />
            </div>

            {/* preview of what will be sent */}
            <div className="rounded-2xl border border-stone-200 dark:border-stone-700 overflow-hidden">
              <div className="px-4 py-3 bg-cream/70 dark:bg-stone-950 border-b border-stone-200 dark:border-stone-700 text-[13px]">
                <p><span className="font-semibold">Subject: </span>{preview.subject}</p>
                <p className="text-ink-soft dark:text-stone-400 mt-0.5">
                  Includes: {emailContext.mode === "code" ? "summary + trace highlights" : "objective, checklist, steps & precautions"}
                  {uploads.length > 0 ? ` · ${uploads.length} session file${uploads.length > 1 ? "s" : ""} referenced` : ""}
                </p>
              </div>
              <div className="px-4 py-4 text-[13px] leading-relaxed font-sans text-ink-soft dark:text-stone-300 max-h-56 overflow-y-auto nice-scroll relative min-h-[100px]">
                {loadingPreview ? (
                  <div className="animate-pulse space-y-2">
                    <div className="h-3 w-3/4 bg-stone-200 dark:bg-stone-800 rounded"></div>
                    <div className="h-3 w-full bg-stone-200 dark:bg-stone-800 rounded"></div>
                    <div className="h-3 w-5/6 bg-stone-200 dark:bg-stone-800 rounded"></div>
                    <div className="h-3 w-1/2 bg-stone-200 dark:bg-stone-800 rounded"></div>
                  </div>
                ) : (
                  <pre className="whitespace-pre-wrap font-sans">{preview.body}</pre>
                )}
              </div>
            </div>

            {error && <p className="text-sm text-red-600 dark:text-red-300">{error}</p>}

            <div className="flex gap-2 justify-end">
              <Button variant="ghost" onClick={() => setEmailOpen(false)} disabled={sending}>Cancel</Button>
              <Button onClick={confirm} disabled={!valid || sending}>
                {sending ? "Sending…" : "Confirm & send"}
              </Button>
            </div>
            {!valid && to.length > 0 && (
              <p className="text-xs text-ink-faint dark:text-stone-500 text-right -mt-2">Enter a valid email to enable send.</p>
            )}
          </div>
        ) : (
          <div className="px-6 py-8 text-center">
            <span className="mx-auto w-14 h-14 rounded-full bg-spruce-50 dark:bg-spruce-900/40 text-spruce-600 grid place-items-center">
              <Icon d={PATHS.check} className="w-7 h-7" />
            </span>
            <h3 className="font-serif font-semibold text-xl mt-4">Sent to {to.trim()}</h3>
            <p className="text-sm text-ink-soft dark:text-stone-400 mt-1.5 max-w-sm mx-auto">
              Your {emailContext.mode === "code" ? "Code Tutor notes" : "Lab Prep sheet"} are on their way. They’ll land within a minute or two.
            </p>
            <Button className="mt-5" onClick={() => setEmailOpen(false)}>Back to studying</Button>
          </div>
        )}
      </div>
    </div>
  );
}
