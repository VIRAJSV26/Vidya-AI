/**
 * Shared domain types for Vidya.
 * Every component receives typed props from these interfaces so a
 * backend can be wired in later without restructuring UI code.
 */

export type AppMode = "code" | "lab";

export type FileKind = "py" | "pdf";

export interface UploadedDoc {
  id: string;
  /** Original file name, e.g. "bubble_sort.py" */
  name: string;
  kind: FileKind;
  /** Derived from file extension — drives which workspace mode opens */
  mode: AppMode;
  sizeBytes: number;
  uploadedAt: string; // ISO timestamp
}

export interface ChatMessage {
  id: string;
  role: "user" | "ai";
  content: string;
  timestamp: string; // ISO timestamp
  /** Optional follow-up chips the tutor suggests */
  suggestions?: string[];
}

/** One debugger-like step in the Execution Trace view */
export interface TraceStep {
  stepIndex: number;
  /** 1-based line number in the source file */
  line: number;
  title: string;
  explanation: string;
  /** Variable snapshot AFTER this line executes */
  variables: Record<string, string>;
  stdout?: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface CodeDoc {
  filename: string;
  language: "python";
  /** Raw source lines (no line numbers — CodeViewer adds them) */
  lines: string[];
  summary: string;
  concepts: string[];
  quiz?: QuizQuestion[];
}

export interface LabSection {
  id: string;
  heading: string;
  body: string;
  pageRef?: string;
}

export interface LabManualDoc {
  filename: string;
  title: string;
  course: string;
  sections: LabSection[];
}

export interface MaterialItem {
  id: string;
  label: string;
  detail?: string;
  checked: boolean;
}

export interface Precaution {
  id: string;
  text: string;
  /** red = safety-critical, gray = procedural */
  severity: "safety" | "procedural";
}

export interface LabPrep {
  experimentTitle: string;
  objective: string;
  materials: MaterialItem[];
  steps: string[];
  expectedOutput: string;
  precautions: Precaution[];
  /** 0–100, derived from materials checklist + steps reviewed */
  readinessScore: number;
  quiz?: QuizQuestion[];
}

export interface EmailPayload {
  to: string;
  subject: string;
  /** Rendered preview body (plain text / markdown-ish) */
  bodyPreview: string;
  mode: AppMode;
  docName: string;
}
