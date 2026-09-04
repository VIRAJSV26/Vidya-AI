import sqlite3
import json
import os
from typing import Optional, List, Dict, Any

DB_PATH = os.path.join(os.path.dirname(__file__), "vidya.db")

def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS documents (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        kind TEXT NOT NULL,
        mode TEXT NOT NULL,
        size_bytes INTEGER,
        uploaded_at TEXT NOT NULL,
        content TEXT NOT NULL,
        metadata_json TEXT
    )
    """)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        doc_id TEXT,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        suggestions_json TEXT
    )
    """)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS email_logs (
        id TEXT PRIMARY KEY,
        recipient TEXT NOT NULL,
        subject TEXT NOT NULL,
        mode TEXT,
        doc_name TEXT,
        sent_at TEXT NOT NULL,
        status TEXT NOT NULL
    )
    """)
    conn.commit()
    conn.close()

def save_document(doc_id: str, name: str, kind: str, mode: str, size: int, uploaded_at: str, content: str, meta: Optional[dict] = None):
    conn = get_connection()
    conn.execute(
        "INSERT OR REPLACE INTO documents (id, name, kind, mode, size_bytes, uploaded_at, content, metadata_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        (doc_id, name, kind, mode, size, uploaded_at, content, json.dumps(meta or {}))
    )
    conn.commit()
    conn.close()

def get_document(doc_id: str) -> Optional[dict]:
    conn = get_connection()
    row = conn.execute("SELECT * FROM documents WHERE id = ?", (doc_id,)).fetchone()
    conn.close()
    if not row:
        return None
    res = dict(row)
    if res.get("metadata_json"):
        res["meta"] = json.loads(res["metadata_json"])
    return res

def list_documents() -> List[dict]:
    conn = get_connection()
    rows = conn.execute("SELECT id, name, kind, mode, size_bytes, uploaded_at FROM documents ORDER BY uploaded_at DESC").fetchall()
    conn.close()
    return [dict(r) for r in rows]

def save_message(msg_id: str, doc_id: Optional[str], role: str, content: str, timestamp: str, suggestions: Optional[list] = None):
    conn = get_connection()
    conn.execute(
        "INSERT OR REPLACE INTO messages (id, doc_id, role, content, timestamp, suggestions_json) VALUES (?, ?, ?, ?, ?, ?)",
        (msg_id, doc_id, role, content, timestamp, json.dumps(suggestions or []))
    )
    conn.commit()
    conn.close()

def get_messages(doc_id: Optional[str] = None) -> List[dict]:
    conn = get_connection()
    if doc_id:
        rows = conn.execute("SELECT * FROM messages WHERE doc_id = ? ORDER BY timestamp ASC", (doc_id,)).fetchall()
    else:
        rows = conn.execute("SELECT * FROM messages ORDER BY timestamp ASC").fetchall()
    conn.close()
    res = []
    for r in rows:
        d = dict(r)
        d["suggestions"] = json.loads(d["suggestions_json"]) if d.get("suggestions_json") else []
        res.append(d)
    return res

def log_email(email_id: str, recipient: str, subject: str, mode: str, doc_name: str, sent_at: str, status: str):
    conn = get_connection()
    conn.execute(
        "INSERT INTO email_logs (id, recipient, subject, mode, doc_name, sent_at, status) VALUES (?, ?, ?, ?, ?, ?, ?)",
        (email_id, recipient, subject, mode, doc_name, sent_at, status)
    )
    conn.commit()
    conn.close()

init_db()
