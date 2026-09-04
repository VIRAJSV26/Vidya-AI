# Vidya — AI Academic Companion (frontend prototype)

Next.js 14 (App Router) + TypeScript + Tailwind CSS. No backend, no DB, no auth — all data is mocked locally so the UI can be wired to real APIs later without restructuring.

## Run it

```bash
cd vidya
npm install
npm run dev      # → http://localhost:3000 (bind 0.0.0.0 for previews)
npm run build
```

## Screens

| Route | Screen |
|---|---|
| `/` | Landing — “Ask anything. Understand everything.” + upload CTA front & center, no sign-up wall |
| `/upload` | Drag-and-drop for `.py` / `.pdf`, auto-detects mode from extension, session file list |
| `/workspace?mode=code` | Split layout: `CodeViewer` (left) + `ChatThread` + `ChatInput` (right) + `ExecutionTrace` below |
| `/workspace?mode=lab` | Split layout: `ManualViewer` (left) + chat (right) + `LabPrepView` cards below |
| every screen | `ChatbotFab` → `ChatbotPanel` slide-over (remembers session uploads), `EmailModal` via “Email me this” |

## Components (one per screen/section, typed props)

```
components/
  Navbar.tsx            ThemeToggle included
  LandingHero.tsx       props: { onTrySample(mode) }
  UploadDropzone.tsx    props: { onUploaded?(doc) }
  CodeViewer.tsx        props: { doc: CodeDoc; activeLine: number|null; onLineClick?(line) }
  ManualViewer.tsx      props: { doc: LabManualDoc }
  ChatThread.tsx        props: { messages: ChatMessage[]; typing: boolean; onSuggestionClick?(s) }
  ChatInput.tsx         props: { onSend(text); disabled?; placeholder? }
  ExecutionTrace.tsx    props: { steps: TraceStep[]; current: number; onChange(i); loading? }
  LabPrepView.tsx       props: { prep: LabPrep; onChange?(prep); loading? }
  ReadinessRing.tsx     props: { score: 0–100; size? }
  ChatbotFab.tsx / ChatbotPanel.tsx   (global, via AppContext)
  EmailModal.tsx        (global, via AppContext.openEmail({mode, docName}))
  WorkspaceView.tsx     props: { mode: AppMode } — composes the split layout
  ui.tsx                Button, Card, Eyebrow, ModeBadge, Icon
```

All data shapes live in `lib/types.ts` (`UploadedDoc`, `ChatMessage`, `TraceStep`, `CodeDoc`, `LabManualDoc`, `LabPrep`, `EmailPayload`, …).

## Backend wiring (stubbed)

`lib/api-stubs.ts` is the **only file the backend team needs to replace**. Each function is commented with the endpoint it expects:

| Stub | Expects |
|---|---|
| `fetchCodeDoc(docId)` | `POST /api/explain` `{docId, mode}` |
| `fetchExecutionTrace(docId)` | `GET /api/trace?docId=…` |
| `fetchManualDoc(docId)` | `GET /api/manual?docId=…` |
| `fetchLabPrep(docId)` | `POST /api/lab-prep` `{docId}` |
| `sendChatMessage(msg, mode, histLen)` | `POST /api/chat` `{docId, mode, message, history}` |
| `sendEmailSummary(to, subject)` | `POST /api/email` `{to, subject, body, docId}` |
| `detectModeFromFilename(name)` | pure helper (`.py`→code, `.pdf`→lab) — keep as-is |

Mock payloads live in `lib/mock-data.ts`. Session state (uploads, active doc, floating chat, theme, modals) lives in `context/AppContext.tsx` (persisted to `sessionStorage` / `localStorage`).

## Design

Warm off-white (`#FAF7F1`), one confident spruce-teal accent (`#0E6B5E` — never purple), generous whitespace, Fraunces serif display + Inter body. Dark mode via `darkMode: "class"` + `ThemeToggle` (persisted). Responsive: split layouts collapse to a single column on mobile; trace controls, prep cards, and slide-over are all touch-friendly.
