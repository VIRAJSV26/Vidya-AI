from typing import List, Optional, Dict, Any, Literal
from pydantic import BaseModel, Field
from datetime import datetime

class UploadedDocModel(BaseModel):
    id: str
    name: str
    kind: Literal["py", "pdf"]
    mode: Literal["code", "lab"]
    sizeBytes: int
    uploadedAt: str

class ChatMessageModel(BaseModel):
    id: str
    role: Literal["user", "ai"]
    content: str
    timestamp: str
    suggestions: Optional[List[str]] = None

class TraceStepModel(BaseModel):
    stepIndex: int
    line: int
    title: str
    explanation: str
    variables: Dict[str, str]
    stdout: Optional[str] = None

class QuizQuestionModel(BaseModel):
    id: str
    question: str
    options: List[str]
    correctIndex: int
    explanation: str

class CodeDocModel(BaseModel):
    filename: str
    language: Literal["python"] = "python"
    lines: List[str]
    summary: str
    concepts: List[str]
    entryPoint: Optional[int] = None
    complexity: Optional[str] = None
    quiz: Optional[List[QuizQuestionModel]] = None

class LabSectionModel(BaseModel):
    id: str
    heading: str
    body: str
    pageRef: Optional[str] = None

class LabManualDocModel(BaseModel):
    filename: str
    title: str
    course: str
    sections: List[LabSectionModel]

class MaterialItemModel(BaseModel):
    id: str
    label: str
    detail: Optional[str] = None
    checked: bool = False

class PrecautionModel(BaseModel):
    id: str
    text: str
    severity: Literal["safety", "procedural"]

class LabPrepModel(BaseModel):
    experimentTitle: str
    objective: str
    materials: List[MaterialItemModel]
    steps: List[str]
    expectedOutput: str
    precautions: List[PrecautionModel]
    readinessScore: int
    mistakes: Optional[List[str]] = None
    quiz: Optional[List[QuizQuestionModel]] = None

class ChatRequestModel(BaseModel):
    docId: Optional[str] = None
    mode: Literal["code", "lab"]
    message: str
    historyLength: Optional[int] = 0
    complexity: Optional[Literal["eli5", "student", "interview"]] = "student"

class EmailRequestModel(BaseModel):
    to: str
    subject: str
    bodyPreview: Optional[str] = ""
    mode: Optional[Literal["code", "lab"]] = "code"
    docName: Optional[str] = "document"
    docId: Optional[str] = None
    score: Optional[int] = None
