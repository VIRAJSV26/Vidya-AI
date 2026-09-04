import ast
import os
import json
import httpx
from typing import List, Dict, Tuple, Optional
from backend.models import CodeDocModel, QuizQuestionModel

class CodeAnalyzer:
    @staticmethod
    def _generate_quiz_with_llm(code: str, filename: str) -> List[QuizQuestionModel]:
        groq_key = os.getenv("GROQ_API_KEY")
        if not groq_key:
            return []
            
        prompt = f"""You are an expert programming tutor.
Generate EXACTLY 10 diverse quiz questions testing the user's understanding of the following Python code ({filename}).
Return the output strictly as a JSON object matching this structure:
{{
  "quiz": [
    {{
      "question": "Question text?",
      "options": ["Opt A", "Opt B", "Opt C", "Opt D"],
      "correctIndex": 0,
      "explanation": "Why this is correct"
    }}
  ]
}}

Code:
{code[:4000]}
"""
        try:
            res = httpx.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={"Authorization": f"Bearer {groq_key}"},
                json={
                    "model": os.getenv("GROQ_MODEL", "openai/gpt-oss-120b"),
                    "messages": [{"role": "user", "content": prompt}],
                    "response_format": {"type": "json_object"},
                    "temperature": 0.1
                },
                timeout=10.0
            )
            if res.status_code == 200:
                data = res.json()["choices"][0]["message"]["content"]
                parsed = json.loads(data)
                quiz = []
                for idx, q in enumerate(parsed.get("quiz", [])):
                    quiz.append(QuizQuestionModel(
                        id=f"cq{idx+1}",
                        question=q.get("question", ""),
                        options=q.get("options", []),
                        correctIndex=q.get("correctIndex", 0),
                        explanation=q.get("explanation", "")
                    ))
                return quiz
            else:
                print("Groq extraction failed with status:", res.status_code, res.text)
        except Exception as e:
            print("Groq code quiz generation failed:", repr(e))
        return []

    @staticmethod
    def analyze(code: str, filename: str = "script.py", complexity_level: str = "student") -> CodeDocModel:
        lines = code.splitlines()
        concepts = []
        entry_point = 1
        summary = ""

        try:
            tree = ast.parse(code)
            has_for = False
            has_while = False
            has_nested_loop = False
            has_recursion = False
            has_conditions = False
            function_defs = []

            for node in ast.walk(tree):
                if isinstance(node, ast.FunctionDef):
                    function_defs.append(node.name)
                    # Check recursion
                    for sub in ast.walk(node):
                        if isinstance(sub, ast.Call) and isinstance(sub.func, ast.Name) and sub.func.id == node.name:
                            has_recursion = True
                elif isinstance(node, (ast.For, ast.While)):
                    if isinstance(node, ast.For):
                        has_for = True
                    if isinstance(node, ast.While):
                        has_while = True
                    for sub in node.body:
                        if isinstance(sub, (ast.For, ast.While)):
                            has_nested_loop = True
                elif isinstance(node, (ast.If, ast.IfExp)):
                    has_conditions = True

            # Entry point detection
            for stmt in tree.body:
                if isinstance(stmt, ast.If):
                    test = stmt.test
                    if isinstance(test, ast.Compare) and isinstance(test.left, ast.Name) and test.left.id == "__name__":
                        entry_point = stmt.lineno
                        break
                elif not isinstance(stmt, (ast.FunctionDef, ast.ClassDef, ast.Import, ast.ImportFrom)):
                    entry_point = stmt.lineno
                    break

            if function_defs:
                concepts.append(f"functions ({', '.join(function_defs)})")
            if has_nested_loop:
                concepts.append("nested loops (O(n²))")
            elif has_for or has_while:
                concepts.append("loops")
            if has_recursion:
                concepts.append("recursion")
            if has_conditions:
                concepts.append("branching/conditionals")

            # Determine complexity
            time_comp = "O(n²)" if has_nested_loop else ("O(n)" if (has_for or has_while) else "O(1)")
            concepts.append(f"{time_comp} time complexity")

            if complexity_level == "eli5":
                summary = f"This code runs step by step like a recipe. It sets up instructions, inspects variables, and iterates through elements until the final answer is calculated."
            elif complexity_level == "interview":
                summary = f"Algorithmic analysis: Time complexity is {time_comp}, with in-place operations. Key characteristics include {', '.join(concepts[:3])}."
            else: # student
                summary = f"This Python program contains {len(lines)} lines. Execution begins around line {entry_point}. It implements {', '.join(concepts[:3])} to process input and display results."

        except SyntaxError as e:
            summary = f"Syntax error on line {e.lineno}: {e.msg}"
            concepts = ["syntax error"]
            entry_point = e.lineno or 1

        quiz = CodeAnalyzer._generate_quiz_with_llm(code, filename)

        return CodeDocModel(
            filename=filename,
            language="python",
            lines=lines,
            summary=summary,
            concepts=concepts,
            entryPoint=entry_point,
            complexity=complexity_level,
            quiz=quiz
        )
