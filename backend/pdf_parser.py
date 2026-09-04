import io
import re
import os
import json
import httpx
from typing import List, Tuple
import pypdf
from backend.models import (
    LabManualDocModel,
    LabSectionModel,
    LabPrepModel,
    MaterialItemModel,
    PrecautionModel,
    QuizQuestionModel,
)

class LabPDFParser:
    @staticmethod
    def extract_text(file_bytes: bytes) -> str:
        try:
            reader = pypdf.PdfReader(io.BytesIO(file_bytes))
            text = ""
            for page in reader.pages:
                t = page.extract_text()
                if t:
                    text += t + "\n"
            return text
        except Exception as e:
            return f"Error extracting PDF: {str(e)}"

    @staticmethod
    def _extract_with_llm(text: str, filename: str) -> Tuple[LabManualDocModel, LabPrepModel]:
        groq_key = os.getenv("GROQ_API_KEY")
        title = filename.replace(".pdf", "").replace("_", " ").title()
        
        prompt = f"""You are an AI that extracts structured data from academic lab manuals.
Below is the text of a lab manual ({title}).
Extract the key information and return it strictly as a JSON object matching this structure (no markdown blocks, just raw JSON).

{{
  "title": "Clean, descriptive title of the experiment",
  "objective_summary": "A concise 1-2 sentence summary of the objective/overview",
  "expected_output": "1-2 sentence summary of expected outcome",
  "materials": [
    {{"label": "Material name", "detail": "Short detail or context"}}
  ],
  "steps": [
    "Step 1 in plain english",
    "Step 2..."
  ],
  "precautions": [
    {{"text": "Precaution text", "severity": "safety OR procedural"}}
  ],
  "mistakes": ["Common mistake 1", "Common mistake 2"],
  "quiz": [
    // EXACTLY 10 quiz questions related to the materials, procedure, precautions, and theory
    {{
      "question": "Question text?",
      "options": ["Opt A", "Opt B", "Opt C", "Opt D"],
      "correctIndex": 0,
      "explanation": "Why this is correct"
    }}
  ],
  "sections": [
    {{"heading": "Heading (e.g. Introduction)", "body": "1 paragraph summary of this section"}}
  ]
}}

Document Text:
{text[:6000]}
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
                
                sections = []
                for idx, sec in enumerate(parsed.get("sections", [])):
                    sections.append(LabSectionModel(
                        id=f"s{idx+1}",
                        heading=sec.get("heading", "Section"),
                        body=sec.get("body", ""),
                        pageRef=f"p. {idx+1}"
                    ))
                if not sections:
                    sections.append(LabSectionModel(id="s1", heading="Overview", body=parsed.get("objective_summary", "Manual text."), pageRef="p. 1"))
                
                lab_doc = LabManualDocModel(
                    filename=filename,
                    title=parsed.get("title", title),
                    course="Undergraduate Laboratory",
                    sections=sections
                )
                
                materials = []
                for idx, m in enumerate(parsed.get("materials", [])):
                    materials.append(MaterialItemModel(id=f"m{idx+1}", label=m.get("label", ""), detail=m.get("detail", ""), checked=False))
                    
                precautions = []
                for idx, p in enumerate(parsed.get("precautions", [])):
                    precautions.append(PrecautionModel(id=f"p{idx+1}", text=p.get("text", ""), severity=p.get("severity", "procedural")))
                    
                quiz = []
                for idx, q in enumerate(parsed.get("quiz", [])):
                    quiz.append(QuizQuestionModel(
                        id=f"q{idx+1}",
                        question=q.get("question", ""),
                        options=q.get("options", []),
                        correctIndex=q.get("correctIndex", 0),
                        explanation=q.get("explanation", "")
                    ))

                lab_prep = LabPrepModel(
                    experimentTitle=parsed.get("title", title),
                    objective=parsed.get("objective_summary", "Understand the experiment."),
                    materials=materials,
                    steps=parsed.get("steps", []),
                    expectedOutput=parsed.get("expected_output", "Expected results."),
                    precautions=precautions,
                    readinessScore=70,
                    mistakes=parsed.get("mistakes", []),
                    quiz=quiz
                )
                
                return lab_doc, lab_prep
            else:
                print("Groq extraction failed with status:", res.status_code, res.text)
        except Exception as e:
            print("Groq extraction failed:", repr(e))
            import traceback
            traceback.print_exc()
        
        return None

    @staticmethod
    def parse_sections(text: str, filename: str = "lab_manual.pdf") -> Tuple[LabManualDocModel, LabPrepModel]:
        # Try LLM first if key is available
        groq_key = os.getenv("GROQ_API_KEY")
        print("GROQ_API_KEY present:", bool(groq_key))
        if groq_key:
            res = LabPDFParser._extract_with_llm(text, filename)
            if res:
                return res
            print("Fallback used because _extract_with_llm returned None.")

        # Basic fallback parsing (without hardcoded Ohm's law defaults)
        title = filename.replace(".pdf", "").replace("_", " ").title()
        
        lab_doc = LabManualDocModel(
            filename=filename,
            title=title,
            course="Undergraduate Laboratory",
            sections=[
                LabSectionModel(id="s1", heading="Manual Overview", body=text[:1500] if text else "Manual text.", pageRef="p. 1")
            ]
        )
        
        quiz = [
            QuizQuestionModel(
                id="q1",
                question=f"What is the primary objective of {title}?",
                options=["To complete the lab", "To study the material", "Unknown", "None of the above"],
                correctIndex=1,
                explanation="Review the lab manual for details."
            )
        ]
        
        lab_prep = LabPrepModel(
            experimentTitle=title,
            objective=text[:300] if text else "Objective not found.",
            materials=[MaterialItemModel(id="m1", label="General lab equipment", detail="Refer to manual", checked=False)],
            steps=["Read the manual thoroughly.", "Follow instructions provided by instructor."],
            expectedOutput="Results as described in the manual.",
            precautions=[PrecautionModel(id="p1", text="Follow standard lab safety rules.", severity="safety")],
            readinessScore=50,
            mistakes=["Not reading the instructions carefully."],
            quiz=quiz
        )
        
        return lab_doc, lab_prep
