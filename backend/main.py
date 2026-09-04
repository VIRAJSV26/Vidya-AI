import os
import uuid
from datetime import datetime
from typing import List, Optional
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from backend.models import (
    UploadedDocModel,
    ChatMessageModel,
    TraceStepModel,
    CodeDocModel,
    LabManualDocModel,
    LabPrepModel,
    ChatRequestModel,
    EmailRequestModel
)
from backend.tracer import SafeExecutionSandbox
from backend.code_analyzer import CodeAnalyzer
from backend.pdf_parser import LabPDFParser
from backend.llm_router import LLMRouter
from backend.email_service import EmailService
from backend.db import (
    save_document,
    get_document,
    list_documents,
    save_message,
    get_messages,
    log_email,
    init_db
)

load_dotenv()

app = FastAPI(title="Vidya AI Backend", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SAMPLE_CODE = """def bubble_sort(arr):
    n = len(arr)
    for i in range(n):
        swapped = False
        for j in range(0, n - i - 1):
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
                swapped = True
        if not swapped:
            break
    return arr

marks = [64, 34, 25, 12, 22]
print(bubble_sort(marks))
"""

SAMPLE_LAB_TEXT = """EXPERIMENT 4: VERIFICATION OF OHM'S LAW
AIM: To verify Ohm's law by plotting V-I characteristics of a metallic conductor and determine its resistance.
APPARATUS: Battery eliminator (0-6 V), rheostat, ammeter (0-1.5 A), voltmeter (0-3 V), unknown resistance wire, one-way key, connecting wires, sandpaper.
THEORY: At constant temperature, the current flowing through a conductor is directly proportional to the potential difference across its ends: V = IR.
PROCEDURE:
1. Clean the ends of the connecting wires with sandpaper to ensure clean contacts.
2. Connect ammeter in series and voltmeter in parallel across the unknown resistor.
3. Check polarities before closing key.
4. Vary the rheostat to record 6 sets of current (I) and voltage (V) readings.
5. Open the key between readings to avoid heating the resistance wire.
PRECAUTIONS:
1. Never close key while changing connections.
2. Don't exceed maximum range of meters.
3. Take readings with the key closed only briefly to avoid heating the wire.
4. Remove parallax error when reading pointer scales.
"""

@app.on_event("startup")
def startup_event():
    init_db()
    # Seed samples if not present
    if not get_document("sample_code"):
        save_document(
            doc_id="sample_code",
            name="bubble_sort.py",
            kind="py",
            mode="code",
            size=len(SAMPLE_CODE.encode()),
            uploaded_at=datetime.utcnow().isoformat(),
            content=SAMPLE_CODE
        )
    if not get_document("sample_lab"):
        save_document(
            doc_id="sample_lab",
            name="ohms-law-lab.pdf",
            kind="pdf",
            mode="lab",
            size=len(SAMPLE_LAB_TEXT.encode()),
            uploaded_at=datetime.utcnow().isoformat(),
            content=SAMPLE_LAB_TEXT
        )

@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "Vidya AI Backend"}

@app.post("/api/upload", response_model=UploadedDocModel)
async def upload_file(file: UploadFile = File(...)):
    filename = file.filename or "unknown"
    content_bytes = await file.read()
    size = len(content_bytes)
    lower = filename.lower()
    
    if lower.endswith(".py"):
        kind = "py"
        mode = "code"
        text_content = content_bytes.decode("utf-8", errors="replace")
    elif lower.endswith(".pdf"):
        kind = "pdf"
        mode = "lab"
        text_content = LabPDFParser.extract_text(content_bytes)
    else:
        raise HTTPException(status_code=400, detail="Only .py and .pdf files are supported")

    doc_id = f"{int(datetime.utcnow().timestamp() * 1000)}-{filename}"
    uploaded_at = datetime.utcnow().isoformat()
    
    save_document(
        doc_id=doc_id,
        name=filename,
        kind=kind,
        mode=mode,
        size=size,
        uploaded_at=uploaded_at,
        content=text_content
    )

    return UploadedDocModel(
        id=doc_id,
        name=filename,
        kind=kind,
        mode=mode,
        sizeBytes=size,
        uploadedAt=uploaded_at
    )

@app.get("/api/docs/{doc_id}", response_model=CodeDocModel)
def get_code_doc(doc_id: str, complexity: str = Query("student")):
    doc = get_document(doc_id)
    if not doc:
        # Fallback to sample if sample requested or not found
        doc = get_document("sample_code")
    content = doc["content"] if doc else SAMPLE_CODE
    filename = doc["name"] if doc else "bubble_sort.py"
    return CodeAnalyzer.analyze(content, filename=filename, complexity_level=complexity)

@app.post("/api/explain", response_model=CodeDocModel)
def explain_code(data: dict):
    doc_id = data.get("docId", "sample_code")
    complexity = data.get("complexity", "student")
    return get_code_doc(doc_id, complexity)

@app.get("/api/trace", response_model=List[TraceStepModel])
def get_trace(docId: Optional[str] = Query(None)):
    doc = get_document(docId) if docId else None
    if not doc:
        doc = get_document("sample_code")
    code = doc["content"] if doc else SAMPLE_CODE
    sandbox = SafeExecutionSandbox(max_steps=50)
    steps = sandbox.trace_code(code)
    return steps

@app.get("/api/manual", response_model=LabManualDocModel)
def get_manual(docId: Optional[str] = Query(None)):
    doc = get_document(docId) if docId else None
    if not doc:
        doc = get_document("sample_lab")
    text = doc["content"] if doc else SAMPLE_LAB_TEXT
    filename = doc["name"] if doc else "ohms-law-lab.pdf"
    manual_doc, _ = LabPDFParser.parse_sections(text, filename=filename)
    return manual_doc

@app.post("/api/lab-prep", response_model=LabPrepModel)
def get_lab_prep(data: dict):
    doc_id = data.get("docId")
    doc = get_document(doc_id) if doc_id else None
    if not doc:
        doc = get_document("sample_lab")
    text = doc["content"] if doc else SAMPLE_LAB_TEXT
    filename = doc["name"] if doc else "ohms-law-lab.pdf"
    _, lab_prep = LabPDFParser.parse_sections(text, filename=filename)
    return lab_prep

@app.post("/api/chat", response_model=ChatMessageModel)
async def chat(req: ChatRequestModel):
    doc = get_document(req.docId) if req.docId else None
    doc_content = doc["content"] if doc else None
    doc_name = doc["name"] if doc else None

    # Save user message
    user_msg_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()
    save_message(user_msg_id, req.docId, "user", req.message, now)

    # Generate reply
    ai_reply = await LLMRouter.generate_reply(
        message=req.message,
        mode=req.mode,
        doc_content=doc_content,
        doc_name=doc_name,
        complexity=req.complexity or "student"
    )

    # Save AI reply
    save_message(ai_reply.id, req.docId, "ai", ai_reply.content, ai_reply.timestamp, ai_reply.suggestions)
    return ai_reply

@app.get("/api/email/preview")
async def get_email_preview(docId: str = Query(...), score: Optional[int] = Query(None)):
    doc = get_document(docId)
    doc_name = doc["name"] if doc else "document"
    mode = doc["mode"] if doc else "code"
    
    messages = get_messages(docId) if doc else []
    chat_history = ""
    for m in messages[-10:]: # last 10 messages for context
        role = "User" if m["role"] == "user" else "Tutor"
        chat_history += f"{role}: {m['content']}\n"
        
    groq_key = os.getenv("GROQ_API_KEY")
    summary = ""
    
    if groq_key:
        import httpx
        
        doc_snippet = (doc["content"][:1000] if doc and "content" in doc else "")
        
        prompt = f"You are generating a short email summary for a student's study session on '{doc_name}'.\n"
        
        if chat_history.strip():
            prompt += f"They had the following chat with their AI tutor:\n{chat_history}\n"
        else:
            prompt += f"They reviewed the document, which starts with:\n{doc_snippet}\n"
            
        if score is not None:
            prompt += f"They also took a readiness/knowledge quiz and scored {score}/10.\n"
            
        prompt += "\nBased on this session, provide a detailed summary of their learning in 4-5 well-crafted bullet points. Include key takeaways from the document/chat and highlight their quiz performance. Return ONLY the bullet points."
        
        try:
            res = httpx.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={"Authorization": f"Bearer {groq_key}"},
                json={
                    "model": os.getenv("GROQ_MODEL", "openai/gpt-oss-120b"),
                    "messages": [{"role": "user", "content": prompt}],
                    "temperature": 0.3
                },
                timeout=5.0
            )
            if res.status_code == 200:
                summary = res.json()["choices"][0]["message"]["content"].strip()
        except Exception as e:
            print(f"Failed to generate email summary: {e}")

    if not summary:
        summary = "• Reviewed the document and asked questions to clarify key concepts."

    preview_body = f"Hi there,\n\nHere is your Vidya study summary for {doc_name}.\n\nWhat you covered:\n{summary}\n"
    if score is not None:
        preview_body += f"\nQuiz Score: {score}/10 🌟\n"
        
    preview_body += "\nKeep up the great work and remember to review this material next time you log in.\n\n— Sent from Vidya"
    
    return {"preview": preview_body}

@app.post("/api/email")
def send_email(req: EmailRequestModel):
    res = EmailService.send_email(
        to=req.to,
        subject=req.subject,
        body_preview=req.bodyPreview or "",
        mode=req.mode or "code",
        doc_name=req.docName or "document"
    )
    email_id = str(uuid.uuid4())
    log_email(
        email_id=email_id,
        recipient=req.to,
        subject=req.subject,
        mode=req.mode or "code",
        doc_name=req.docName or "document",
        sent_at=datetime.utcnow().isoformat(),
        status="success" if res.get("ok") else "failed"
    )
    return {"ok": res.get("ok", False), "messageId": email_id, "detail": res}

@app.get("/api/vault", response_model=List[dict])
def get_knowledge_vault():
    return list_documents()
