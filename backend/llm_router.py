import os
import uuid
import ast
from datetime import datetime
from typing import Dict, Any, List, Optional
import httpx
from backend.models import ChatMessageModel

def _now_iso() -> str:
    return datetime.utcnow().isoformat() + "Z"

def _make_suggestions(mode: str, message: str) -> List[str]:
    lower = message.lower()
    if mode == "code":
        if "quiz" in lower:
            return ["Explain the algorithm", "What's the time complexity?", "Show me another example"]
        if "complex" in lower or "big o" in lower:
            return ["How can we optimize?", "Compare with merge sort", "Space complexity?"]
        if "error" in lower or "bug" in lower:
            return ["Step through the trace", "Show me the fix", "Why does this happen?"]
        return ["Quiz me on this", "Explain line by line", "What's the time complexity?", "Where does execution start?"]
    else:
        if "quiz" in lower or "viva" in lower:
            return ["More questions", "Explain the theory", "Review precautions"]
        if "precaution" in lower or "safe" in lower:
            return ["Common mistakes", "Quiz me for viva", "Explain the procedure"]
        return ["Quiz me for viva", "Explain the theory", "Safety precautions", "Expected output"]


def _build_system_prompt(mode: str, complexity: str, doc_name: Optional[str] = None) -> str:
    mode_desc = "Python Code Tutor" if mode == "code" else "Lab Preparation Assistant"
    
    tone_guide = {
        "eli5": "Explain like I'm 5 — use analogies, avoid jargon, be playful.",
        "student": "Explain at an undergraduate level — clear, structured, beginner-friendly but technically accurate.",
        "interview": "Explain at interview-prep depth — precise terminology, edge cases, complexity analysis."
    }.get(complexity, "Clear undergraduate-level explanation.")

    code_rules = """
IMPORTANT RULES for Code Tutor mode:
- Always reference SPECIFIC line numbers, function names, and variable names from the student's actual uploaded code.
- When asked "what does this do?", walk through the logic using the actual code structure.
- When asked about data flow, trace variables through the specific functions in their code.
- When asked about complexity, analyze their actual loop nesting and recursive calls.
- For "quiz me", generate 2-3 questions directly about their code's logic, not generic CS questions.
- Use markdown formatting: **bold** for key terms, `backticks` for code, numbered lists for steps.
- If the student asks about a specific line, quote that line and explain it.
- Be encouraging but precise. Never make up code that isn't in the document.
"""

    lab_rules = """
IMPORTANT RULES for Lab Prep mode:
- Reference the specific experiment, apparatus, and procedures from the uploaded manual.
- When asked about precautions, classify each as ⚠️ safety-critical or ℹ️ procedural.
- For viva/quiz questions, generate questions specific to THIS experiment, not generic physics.
- Explain WHY each step matters, not just what to do.
- Flag common mistakes students make for this specific type of experiment.
- Use markdown formatting for clarity.
"""

    return f"""You are Vidya (विद्या), an encouraging, beginner-safe AI tutor for engineering students.

Current Mode: {mode_desc}
Document: {doc_name or 'Student upload'}
Complexity Level: {complexity} — {tone_guide}

{code_rules if mode == 'code' else lab_rules}

Keep responses concise (under 250 words) but insightful. End with a natural follow-up suggestion when appropriate.
Never be condescending. Use a Socratic approach when possible — guide the student to understanding rather than just giving answers."""


def _analyze_code_for_context(code: str) -> str:
    """Extract quick structural info from code to enrich fallback responses."""
    try:
        tree = ast.parse(code)
        functions = []
        classes = []
        loops = 0
        imports = []
        for node in ast.walk(tree):
            if isinstance(node, ast.FunctionDef):
                functions.append(f"`{node.name}` (line {node.lineno})")
            elif isinstance(node, ast.ClassDef):
                classes.append(f"`{node.name}` (line {node.lineno})")
            elif isinstance(node, (ast.For, ast.While)):
                loops += 1
            elif isinstance(node, (ast.Import, ast.ImportFrom)):
                for alias in node.names:
                    imports.append(alias.name)
        
        parts = []
        if functions:
            parts.append(f"Functions: {', '.join(functions)}")
        if classes:
            parts.append(f"Classes: {', '.join(classes)}")
        if loops:
            parts.append(f"Loop count: {loops}")
        if imports:
            parts.append(f"Imports: {', '.join(imports[:5])}")
        
        lines = code.strip().splitlines()
        parts.append(f"Total lines: {len(lines)}")
        return "\n".join(parts)
    except:
        return f"Code length: {len(code)} chars"


class LLMRouter:
    @staticmethod
    async def generate_reply(
        message: str,
        mode: str,
        doc_content: Optional[str] = None,
        doc_name: Optional[str] = None,
        complexity: str = "student"
    ) -> ChatMessageModel:
        groq_key = os.getenv("GROQ_API_KEY")
        anthropic_key = os.getenv("ANTHROPIC_API_KEY")
        now = _now_iso()

        system_prompt = _build_system_prompt(mode, complexity, doc_name)
        
        # Build document context block
        if doc_content:
            doc_block = f"--- STUDENT'S DOCUMENT ({doc_name or 'upload'}) ---\n{doc_content[:8000]}\n--- END DOCUMENT ---"
        else:
            doc_block = "(No document uploaded yet — answer based on general knowledge)"
        
        user_text = f"{doc_block}\n\nStudent's question: {message}"

        # 1. Groq API (primary — fast, cheap)
        if groq_key:
            try:
                model = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")
                async with httpx.AsyncClient(timeout=30.0) as client:
                    resp = await client.post(
                        "https://api.groq.com/openai/v1/chat/completions",
                        headers={
                            "Authorization": f"Bearer {groq_key}",
                            "Content-Type": "application/json"
                        },
                        json={
                            "model": model,
                            "messages": [
                                {"role": "system", "content": system_prompt},
                                {"role": "user", "content": user_text}
                            ],
                            "max_tokens": 1024,
                            "temperature": 0.7,
                        }
                    )
                    if resp.status_code == 200:
                        res = resp.json()
                        reply_text = res["choices"][0]["message"]["content"]
                        return ChatMessageModel(
                            id=str(uuid.uuid4()),
                            role="ai",
                            content=reply_text,
                            timestamp=now,
                            suggestions=_make_suggestions(mode, message)
                        )
                    else:
                        print(f"Groq API error {resp.status_code}: {resp.text[:300]}")
            except Exception as e:
                print(f"Groq API request failed: {e}")

        # 2. Claude API (fallback if configured)
        if anthropic_key:
            try:
                async with httpx.AsyncClient(timeout=15.0) as client:
                    resp = await client.post(
                        "https://api.anthropic.com/v1/messages",
                        headers={
                            "x-api-key": anthropic_key,
                            "anthropic-version": "2023-06-01",
                            "content-type": "application/json"
                        },
                        json={
                            "model": "claude-sonnet-4-20250514",
                            "max_tokens": 800,
                            "system": system_prompt,
                            "messages": [{"role": "user", "content": user_text}]
                        }
                    )
                    if resp.status_code == 200:
                        data = resp.json()
                        reply_text = data["content"][0]["text"]
                        return ChatMessageModel(
                            id=str(uuid.uuid4()),
                            role="ai",
                            content=reply_text,
                            timestamp=now,
                            suggestions=_make_suggestions(mode, message)
                        )
            except Exception as e:
                print(f"Claude API request failed: {e}")

        # 3. Smart offline fallback — actually analyzes the document
        return _offline_fallback(message, mode, doc_content, doc_name, now)


def _offline_fallback(
    message: str,
    mode: str,
    doc_content: Optional[str],
    doc_name: Optional[str],
    timestamp: str
) -> ChatMessageModel:
    lower = message.lower()
    reply = ""
    suggestions: List[str] = []

    if mode == "code" and doc_content:
        code_info = _analyze_code_for_context(doc_content)
        code_lines = doc_content.strip().splitlines()

        if "quiz" in lower or "test" in lower:
            # Generate code-specific quiz from AST
            try:
                tree = ast.parse(doc_content)
                funcs = [n.name for n in ast.walk(tree) if isinstance(n, ast.FunctionDef)]
                questions = []
                if funcs:
                    questions.append(f"**Q1.** What does the function `{funcs[0]}()` return, and what is its purpose?")
                    if len(funcs) > 1:
                        questions.append(f"**Q2.** How does `{funcs[1]}()` interact with `{funcs[0]}()`?")
                    else:
                        questions.append(f"**Q2.** What happens if you call `{funcs[0]}()` with an empty list?")
                    questions.append(f"**Q3.** What is the time complexity of the main logic? Explain why.")
                else:
                    questions = [
                        "**Q1.** What is the main purpose of this script?",
                        "**Q2.** Identify the key data transformation — where does input become output?",
                        "**Q3.** What would happen if the input were empty or None?"
                    ]
                reply = "🎯 **Quick Quiz — test your understanding:**\n\n" + "\n\n".join(questions) + "\n\nTry answering each, then ask me to check!"
                suggestions = ["Check my answers", "Give me hints", "Explain the algorithm"]
            except:
                reply = "Let me quiz you:\n1. What is the main purpose of this code?\n2. What are the key variables?\n3. What's the expected output?"
                suggestions = ["Explain the code", "Show the trace"]

        elif "entry" in lower or "start" in lower or "begin" in lower or "where" in lower:
            try:
                tree = ast.parse(doc_content)
                entry_line = None
                for stmt in tree.body:
                    if not isinstance(stmt, (ast.FunctionDef, ast.ClassDef, ast.Import, ast.ImportFrom)):
                        entry_line = stmt.lineno
                        break
                if entry_line and entry_line <= len(code_lines):
                    reply = f"**Execution starts at line {entry_line}:** `{code_lines[entry_line-1].strip()}`\n\nPython runs top-to-bottom, skipping `def` and `class` definitions (those just register the function/class in memory). The first executable statement outside a definition is where the program begins.\n\n📊 Code structure:\n{code_info}"
                else:
                    reply = f"The code defines functions/classes that need to be called. Check for a `if __name__ == '__main__':` block or a direct function call at the bottom.\n\n📊 Structure:\n{code_info}"
                suggestions = ["Step through the trace", "What does each function do?"]
            except:
                reply = "Execution begins at the first top-level statement outside function definitions."
                suggestions = ["Show the trace", "Explain the code"]

        elif "complex" in lower or "o(n" in lower or "big o" in lower or "time" in lower:
            try:
                tree = ast.parse(doc_content)
                loop_depth = 0
                max_depth = 0
                has_recursion = False
                for node in ast.walk(tree):
                    if isinstance(node, (ast.For, ast.While)):
                        loop_depth += 1
                        inner_loops = sum(1 for sub in ast.walk(node) if isinstance(sub, (ast.For, ast.While))) - 1
                        max_depth = max(max_depth, 1 + inner_loops)
                    if isinstance(node, ast.FunctionDef):
                        for sub in ast.walk(node):
                            if isinstance(sub, ast.Call) and isinstance(sub.func, ast.Name) and sub.func.id == node.name:
                                has_recursion = True

                if has_recursion:
                    reply = f"This code uses **recursion**. The complexity depends on the recurrence relation — typically O(2ⁿ) for naive recursion, O(n) with memoization.\n\n📊 Structure:\n{code_info}"
                elif max_depth >= 2:
                    reply = f"With **{max_depth} levels of nested loops**, the time complexity is approximately **O(n{'²' if max_depth == 2 else '³' if max_depth == 3 else '^' + str(max_depth)})** where n is the input size.\n\n📊 Structure:\n{code_info}"
                elif max_depth == 1:
                    reply = f"With a **single loop** over the data, the time complexity is **O(n)** — linear in the input size.\n\n📊 Structure:\n{code_info}"
                else:
                    reply = f"No loops detected — the operations run in **O(1) constant time**.\n\n📊 Structure:\n{code_info}"
                suggestions = ["How to optimize?", "Space complexity?", "Compare with other approaches"]
            except:
                reply = "I'll need to analyze the loop structure. Could you step through the Execution Trace panel below?"
                suggestions = ["Show the trace", "Explain line by line"]

        elif "line" in lower or "explain" in lower or "what does" in lower or "how does" in lower:
            # Try to find a specific line number in the question
            import re
            line_match = re.search(r'line\s*(\d+)', lower)
            if line_match:
                ln = int(line_match.group(1))
                if 1 <= ln <= len(code_lines):
                    code_line = code_lines[ln - 1].strip()
                    reply = f"**Line {ln}:** `{code_line}`\n\n"
                    if "def " in code_line:
                        reply += f"This defines a function. Everything indented below is the function body — it only runs when called."
                    elif "for " in code_line:
                        reply += f"This starts a `for` loop that iterates over a sequence. Each iteration assigns the next value to the loop variable."
                    elif "if " in code_line:
                        reply += f"This is a conditional check. The indented block runs only when the condition evaluates to `True`."
                    elif "return" in code_line:
                        reply += f"This sends a value back to wherever the function was called and exits the function."
                    elif "print" in code_line:
                        reply += f"This outputs the evaluated expression to the console."
                    elif "=" in code_line and "==" not in code_line:
                        reply += f"This assigns a value to a variable. The right side is evaluated first, then stored in the left side."
                    else:
                        reply += f"This line executes the expression `{code_line}`. Check the Execution Trace to see its effect on variables."
                    suggestions = [f"What about line {min(ln+1, len(code_lines))}?", "Explain the whole function", "Quiz me"]
                else:
                    reply = f"Line {ln} is outside the file range (1–{len(code_lines)}). Which line would you like me to explain?"
                    suggestions = ["Explain line 1", f"Explain line {len(code_lines)}", "Explain the algorithm"]
            else:
                # General explanation using code structure
                reply = f"Here's an overview of **{doc_name or 'your code'}** ({len(code_lines)} lines):\n\n{code_info}\n\nThe code's main logic flows through the functions and statements listed above. Use the **Execution Trace** panel below to step through line by line and watch variables change in real-time."
                suggestions = ["Explain line 1", "What's the entry point?", "Quiz me"]

        elif "swap" in lower:
            reply = "In Python, `a, b = b, a` performs a **tuple swap** — no temporary variable needed. Python evaluates the right side `(b, a)` into a tuple first, then unpacks into `a` and `b`. This is a common Python idiom for swapping values efficiently."
            suggestions = ["Why does tuple unpacking work?", "Step through the trace"]

        elif "error" in lower or "bug" in lower or "fix" in lower or "wrong" in lower:
            reply = f"Let's debug **{doc_name or 'the code'}**. Common issues to check:\n\n1. **Off-by-one errors** — verify loop ranges (`range(n)` vs `range(n-1)`)\n2. **Variable scope** — ensure variables are defined before use\n3. **Type mismatches** — check if you're comparing/operating on compatible types\n4. **Missing return** — functions without `return` implicitly return `None`\n\nStep through the **Execution Trace** below to see exactly where variables diverge from expectations."
            suggestions = ["Step through trace", "Check for edge cases", "Show me variable values"]

        else:
            # Smart default: analyze the actual code
            reply = f"Let me analyze **{doc_name or 'your code'}**:\n\n{code_info}\n\n"
            try:
                tree = ast.parse(doc_content)
                funcs = [n for n in ast.walk(tree) if isinstance(n, ast.FunctionDef)]
                if funcs:
                    main_func = funcs[0]
                    reply += f"The main function `{main_func.name}()` starts at line {main_func.lineno}. "
                    # Check for key patterns
                    body_text = doc_content[main_func.col_offset:]
                    if any(isinstance(n, (ast.For, ast.While)) for n in ast.walk(main_func)):
                        reply += "It uses loops to iterate through the data. "
                    if any(isinstance(n, ast.If) for n in ast.walk(main_func)):
                        reply += "It contains conditional logic to handle different cases. "
                    reply += "\n\nWant me to walk you through it step by step?"
                else:
                    reply += "This is a script-style program (no function definitions). It executes top-to-bottom."
            except:
                reply += "Use the Execution Trace below to step through line by line."
            suggestions = ["Explain line by line", "What's the time complexity?", "Quiz me", "Where does it start?"]

    elif mode == "code":
        reply = "Upload a Python file first and I'll analyze it for you! I can explain functions, trace execution, quiz you on the logic, and help you understand the complexity."
        suggestions = ["Go to upload", "Try a sample"]

    elif mode == "lab" and doc_content:
        if "quiz" in lower or "viva" in lower:
            reply = "🎯 **Viva Preparation Questions:**\n\n**Q1.** What is the primary objective of this experiment?\n\n**Q2.** Why is it important to follow the precautions listed?\n\n**Q3.** What would happen if you deviated from the prescribed procedure?\n\nTry answering these, then ask me to check your responses!"
            suggestions = ["Check my answers", "More viva questions", "Explain the theory"]
        elif "precaution" in lower or "safe" in lower:
            reply = "⚠️ **Key Safety & Procedural Precautions:**\n\n1. Always verify connections before applying power\n2. Never exceed instrument rated ranges\n3. Keep circuit energized only during actual measurement\n4. Use proper personal protective equipment\n\nReview the full precaution cards below for experiment-specific warnings."
            suggestions = ["Common mistakes", "Quiz me for viva"]
        else:
            reply = f"I've analyzed **{doc_name or 'your lab manual'}**. Check the prep cards below for materials, steps, and precautions. Your Readiness Score updates as you tick off the materials checklist.\n\nWhat would you like to focus on — the procedure, viva prep, or safety review?"
            suggestions = ["Quiz me for viva", "Explain the procedure", "Safety precautions", "Expected results"]
    else:
        reply = "Upload a lab manual (PDF) and I'll extract the objective, materials, steps, precautions, and generate viva questions for you!"
        suggestions = ["Go to upload", "Try a sample"]

    return ChatMessageModel(
        id=str(uuid.uuid4()),
        role="ai",
        content=reply,
        timestamp=timestamp,
        suggestions=suggestions
    )
