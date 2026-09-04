import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import httpx
from typing import Dict, Any

class EmailService:
    @staticmethod
    def send_email(to: str, subject: str, body_preview: str, mode: str, doc_name: str) -> Dict[str, Any]:
        resend_api_key = os.getenv("RESEND_API_KEY")
        smtp_user = os.getenv("SMTP_USER")
        smtp_pass = os.getenv("SMTP_PASSWORD")
        smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
        smtp_port = int(os.getenv("SMTP_PORT", "587"))

        # 1. Try Resend if configured
        if resend_api_key:
            try:
                res = httpx.post(
                    "https://api.resend.com/emails",
                    headers={"Authorization": f"Bearer {resend_api_key}"},
                    json={
                        "from": os.getenv("RESEND_FROM", "Vidya AI <tutor@vidya.ai>"),
                        "to": [to],
                        "subject": subject,
                        "text": body_preview,
                    },
                    timeout=5.0
                )
                if res.status_code in (200, 201):
                    return {"ok": True, "provider": "resend", "id": res.json().get("id")}
            except Exception as e:
                print(f"Resend send failed: {e}")

        # 2. Try SMTP if configured
        if smtp_user and smtp_pass:
            try:
                msg = MIMEMultipart()
                msg["From"] = smtp_user
                msg["To"] = to
                msg["Subject"] = subject
                msg.attach(MIMEText(body_preview, "plain"))

                with smtplib.SMTP(smtp_host, smtp_port) as server:
                    server.starttls()
                    server.login(smtp_user, smtp_pass)
                    server.sendmail(smtp_user, to, msg.as_string())
                return {"ok": True, "provider": "smtp"}
            except Exception as e:
                error_msg = f"SMTP send failed: {str(e)}"
                print(error_msg)
                return {"ok": False, "provider": "smtp", "note": error_msg}

        # 3. Graceful simulation/demo mode
        print(f"[EmailService Mock] Simulated send to '{to}' | Subject: '{subject}' | Doc: '{doc_name}'")
        return {"ok": False, "provider": "simulated", "note": "Email credentials not configured in backend .env (SMTP_USER/PASS or RESEND_API_KEY)."}
