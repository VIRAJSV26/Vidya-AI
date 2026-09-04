import type {
  ChatMessage,
  CodeDoc,
  LabManualDoc,
  LabPrep,
  TraceStep,
} from "./types";

/** Placeholder code sample shown when the user picks "Try a code sample". */
export const MOCK_CODE_DOC: CodeDoc = {
  filename: "bubble_sort.py",
  language: "python",
  summary:
    "Bubble sort repeatedly steps through the list, compares adjacent items and swaps them if they are in the wrong order. After each pass the largest unsorted item “bubbles” to the end.",
  concepts: ["loops", "swapping", "O(n²) time", "in-place sort"],
  lines: [
    "def bubble_sort(arr):",
    "    n = len(arr)",
    "    for i in range(n):",
    "        swapped = False",
    "        for j in range(0, n - i - 1):",
    "            if arr[j] > arr[j + 1]:",
    "                arr[j], arr[j + 1] = arr[j + 1], arr[j]",
    "                swapped = True",
    "        if not swapped:",
    "            break",
    "    return arr",
    "",
    "",
    "marks = [64, 34, 25, 12, 22]",
    "print(bubble_sort(marks))",
  ],
};

/** Step-by-step debugger-style trace for the sample above. */
export const MOCK_TRACE: TraceStep[] = [
  {
    stepIndex: 0,
    line: 14,
    title: "Initialise the list",
    explanation:
      "The list `marks` is created in memory. Nothing is sorted yet — think of this as laying out five cards on a desk.",
    variables: { marks: "[64, 34, 25, 12, 22]", n: "—", i: "—", j: "—" },
  },
  {
    stepIndex: 1,
    line: 2,
    title: "Measure the list",
    explanation:
      "`n = len(arr)` counts the items. The outer loop will need at most n passes — one per item.",
    variables: { marks: "[64, 34, 25, 12, 22]", n: "5", i: "—", j: "—" },
  },
  {
    stepIndex: 2,
    line: 3,
    title: "Start pass 1 (i = 0)",
    explanation:
      "Outer loop begins. `swapped` is set to False so we can detect if this pass does any work at all.",
    variables: { marks: "[64, 34, 25, 12, 22]", n: "5", i: "0", j: "—", swapped: "False" },
  },
  {
    stepIndex: 3,
    line: 6,
    title: "Compare first pair",
    explanation:
      "Inner loop compares `arr[0]=64` with `arr[1]=34`. Since 64 > 34, they are out of order and will swap.",
    variables: { marks: "[64, 34, 25, 12, 22]", n: "5", i: "0", j: "0", swapped: "False" },
    stdout: "comparing 64 and 34 → swap",
  },
  {
    stepIndex: 4,
    line: 7,
    title: "Swap them",
    explanation:
      "Python's tuple swap puts 34 before 64. The larger value moves one step right — the “bubble”.",
    variables: { marks: "[34, 64, 25, 12, 22]", n: "5", i: "0", j: "0", swapped: "True" },
  },
  {
    stepIndex: 5,
    line: 5,
    title: "Keep sweeping",
    explanation:
      "The inner loop continues across the unsorted part. Each comparison either swaps or leaves the pair alone.",
    variables: { marks: "[34, 25, 12, 22, 64]", n: "5", i: "0", j: "3", swapped: "True" },
    stdout: "end of pass 1 → largest (64) is now last",
  },
  {
    stepIndex: 6,
    line: 15,
    title: "Sorted output",
    explanation:
      "After the passes finish (and an early `break` when a pass makes no swaps), the function returns the sorted list.",
    variables: { marks: "[12, 22, 25, 34, 64]", n: "5", i: "2", j: "—", swapped: "False" },
    stdout: "[12, 22, 25, 34, 64]",
  },
];

export const MOCK_CODE_CHAT: ChatMessage[] = [
  {
    id: "c1",
    role: "ai",
    timestamp: new Date().toISOString(),
    content: "Upload a Python file and I'll analyze it for you! I can explain functions, trace execution, and quiz you on the logic.",
    suggestions: ["Explain line by line", "What is the time complexity?", "Quiz me"],
  },
];

export const MOCK_LAB_DOC: LabManualDoc = {
  filename: "ohms-law-lab.pdf",
  title: "Experiment 4 — Verification of Ohm’s Law",
  course: "B.Sc. Physics · Electricity & Magnetism Lab",
  sections: [
    {
      id: "s1",
      heading: "Aim (p.1)",
      body: "To verify Ohm’s law by plotting V–I characteristics of a metallic conductor and to determine its resistance.",
      pageRef: "p. 1",
    },
    {
      id: "s2",
      heading: "Apparatus (p.1)",
      body: "Battery eliminator (0–6 V), rheostat, ammeter (0–1.5 A), voltmeter (0–3 V), unknown resistance wire, one-way key, connecting wires, sandpaper.",
      pageRef: "p. 1",
    },
    {
      id: "s3",
      heading: "Circuit diagram (p.2)",
      body: "Ammeter in series with the resistor and rheostat; voltmeter in parallel across the resistor only. Key in series. Check polarities before closing the key.",
      pageRef: "p. 2",
    },
    {
      id: "s4",
      heading: "Theory (p.2–3)",
      body: "At constant temperature, V = IR. A straight-line V–I plot through the origin confirms Ohm’s law; its slope gives R.",
      pageRef: "pp. 2–3",
    },
    {
      id: "s5",
      heading: "Observation table (p.4)",
      body: "Record at least 6 readings of V and I by sliding the rheostat. Least counts: ammeter 0.02 A, voltmeter 0.05 V.",
      pageRef: "p. 4",
    },
  ],
};

export const MOCK_LAB_PREP: LabPrep = {
  experimentTitle: "Verification of Ohm’s Law",
  objective:
    "Verify that current through a metallic conductor is directly proportional to the voltage across it (V ∝ I), and find the unknown resistance from the slope of the V–I graph.",
  materials: [
    { id: "m1", label: "Battery eliminator (0–6 V)", detail: "Mains-powered DC source", checked: true },
    { id: "m2", label: "Rheostat", detail: "To vary current smoothly", checked: true },
    { id: "m3", label: "Ammeter (0–1.5 A)", detail: "In series", checked: false },
    { id: "m4", label: "Voltmeter (0–3 V)", detail: "Across resistor only", checked: false },
    { id: "m5", label: "Unknown resistance wire", detail: "Clean ends with sandpaper", checked: false },
    { id: "m6", label: "One-way key + connecting wires", detail: "Tight, clean contacts", checked: false },
  ],
  steps: [
    "Clean the wire ends with sandpaper and make neat, tight connections — loose wires are the #1 cause of bad readings.",
    "Connect the ammeter in series and the voltmeter in parallel across the resistor only. Match + to + and − to −.",
    "Keep the rheostat at maximum resistance, close the key, and adjust until the meters show small, on-scale deflections.",
    "Slide the rheostat in steps to take at least 6 pairs of (V, I) readings across the full scale.",
    "Open the key between readings so the wire doesn’t heat up (heating changes resistance).",
    "Plot V on the y-axis vs I on the x-axis, draw the best-fit straight line, and compute slope = R = V/I.",
  ],
  expectedOutput:
    "A straight line through the origin on the V–I graph. Slope ≈ the unknown resistance (typically 2–5 Ω for this kit). Viva question to expect: “Why must temperature stay constant?”",
  precautions: [
    { id: "p1", text: "Never close the key while changing connections — open the circuit first.", severity: "safety" },
    { id: "p2", text: "Don’t exceed the voltmeter / ammeter ranges; start from high rheostat resistance.", severity: "safety" },
    { id: "p3", text: "Thick connecting wires only — thin wires add their own resistance.", severity: "procedural" },
    { id: "p4", text: "Take readings with the key closed only briefly to avoid heating the wire.", severity: "procedural" },
    { id: "p5", text: "Remove parallax error: read each meter with your eye level with the needle.", severity: "procedural" },
  ],
  readinessScore: 68,
};

export const MOCK_LAB_CHAT: ChatMessage[] = [
  {
    id: "l1",
    role: "ai",
    timestamp: new Date().toISOString(),
    content: "Upload a lab manual (PDF) and I'll extract the objective, materials, steps, and generate viva questions for you!",
    suggestions: ["Quiz me for viva", "Safety precautions", "Expected results"],
  },
];

export const MOCK_FLOATING_CHAT: ChatMessage[] = [
  {
    id: "f1",
    role: "ai",
    timestamp: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
    content:
      "Hi, I’m your Vidya companion. I remember what you’ve uploaded this session — ask me about your code or lab, or anything you’re studying.",
  },
];
