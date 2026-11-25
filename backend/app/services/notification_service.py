import os
import smtplib
import threading
import urllib.parse
from email.message import EmailMessage
from datetime import datetime
from typing import Optional
import requests
from sqlalchemy.orm import Session
from app.models.notification import Notification
from app.models.user import User


FRONTEND_URL = os.getenv("FRONTEND_URL", "https://campusgig-ai.vercel.app").rstrip("/")
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASS = os.getenv("SMTP_PASS", "")
FROM_EMAIL = os.getenv("FROM_EMAIL", SMTP_USER or "hadkedattatray487@gmail.com")
RESEND_API_KEY = os.getenv("RESEND_API_KEY", "")
WHATSAPP_WEBHOOK_URL = os.getenv("WHATSAPP_WEBHOOK_URL", "")


def build_whatsapp_link(phone: Optional[str], message: str) -> Optional[str]:
    """Build a direct wa.me deep link for 1-click WhatsApp notification."""
    if not phone:
        return None
    digits = "".join(c for c in phone if c.isdigit())
    if len(digits) == 10:
        digits = "91" + digits
    if len(digits) < 10:
        return None
    return f"https://wa.me/{digits}?text={urllib.parse.quote(message)}"


def _send_email_background(to_email: str, recipient_name: str, title: str, message: str, action_url: Optional[str]):
    """Send transactional email in a background thread via Resend or SMTP."""
    if not to_email:
        return

    full_link = f"{FRONTEND_URL}{action_url}" if action_url and action_url.startswith("/") else (action_url or FRONTEND_URL)
    html_body = f"""
    <div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;border:1px solid #e2e8f0;border-radius:16px;background:#ffffff;">
      <div style="font-size:18px;font-weight:800;color:#4f46e5;margin-bottom:8px;">CampusGig • Direct Academic Mentorship</div>
      <h2 style="font-size:16px;color:#0f172a;margin:0 0 12px 0;">{title}</h2>
      <p style="font-size:14px;color:#334155;line-height:1.6;">Hi {recipient_name or 'Student'},</p>
      <p style="font-size:14px;color:#334155;line-height:1.6;">{message}</p>
      <div style="margin:22px 0;">
        <a href="{full_link}" style="background:#4f46e5;color:#ffffff;padding:11px 20px;border-radius:10px;text-decoration:none;font-weight:700;font-size:13px;display:inline-block;">
          Open Order &amp; Details →
        </a>
      </div>
      <hr style="border:none;border-top:1px solid #f1f5f9;margin:20px 0;" />
      <p style="font-size:11px;color:#64748b;margin:0;">Guided by Founder &amp; Lead Mentor: Datta Hadke • +91 7020209079</p>
    </div>
    """

    # 1. Try Resend HTTP API if configured
    if RESEND_API_KEY:
        try:
            resp = requests.post(
                "https://api.resend.com/emails",
                headers={
                    "Authorization": f"Bearer {RESEND_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "from": FROM_EMAIL,
                    "to": [to_email],
                    "subject": title,
                    "html": html_body,
                    "text": f"{title}\n\n{message}\n\nView: {full_link}",
                },
                timeout=10,
            )
            print(f"[Email via Resend -> {to_email}] status={resp.status_code}")
            if resp.status_code in (200, 201):
                return
        except Exception as exc:
            print(f"[Email Resend Error -> {to_email}]: {exc}")

    # 2. Try SMTP if configured (e.g., Gmail App Password)
    if SMTP_USER and SMTP_PASS:
        try:
            msg = EmailMessage()
            msg["Subject"] = title
            msg["From"] = f"CampusGig Mentorship <{FROM_EMAIL}>"
            msg["To"] = to_email
            msg.set_content(f"Hi {recipient_name or 'Student'},\n\n{message}\n\nView: {full_link}")
            msg.add_alternative(html_body, subtype="html")

            with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=12) as server:
                server.starttls()
                server.login(SMTP_USER, SMTP_PASS)
                server.send_message(msg)
            print(f"[Email Sent via SMTP -> {to_email}]: {title}")
            return
        except Exception as exc:
            print(f"[Email SMTP Error -> {to_email}]: {exc}")


def _send_whatsapp_webhook_background(phone: Optional[str], title: str, message: str, action_url: Optional[str]):
    """Dispatch WhatsApp notification if WHATSAPP_WEBHOOK_URL is configured."""
    if not WHATSAPP_WEBHOOK_URL or not phone:
        return
    full_link = f"{FRONTEND_URL}{action_url}" if action_url and action_url.startswith("/") else (action_url or FRONTEND_URL)
    try:
        resp = requests.post(
            WHATSAPP_WEBHOOK_URL,
            json={"phone": phone, "title": title, "message": message, "url": full_link},
            timeout=10,
        )
        print(f"[WhatsApp Webhook -> {phone}] status={resp.status_code}")
    except Exception as exc:
        print(f"[WhatsApp Webhook Error -> {phone}]: {exc}")


def create_notification(
    db: Session,
    user_id: int,
    title: str,
    message: str,
    order_id: Optional[int] = None,
    channel: str = "in_app",
    action_url: Optional[str] = None
) -> Notification:
    notif = Notification(
        user_id=user_id,
        order_id=order_id,
        title=title,
        message=message,
        channel=channel,
        action_url=action_url,
        is_read=False,
        created_at=datetime.utcnow()
    )
    db.add(notif)
    db.commit()
    db.refresh(notif)

    # Dispatch real Email / WhatsApp webhook asynchronously without blocking request
    user = db.query(User).filter(User.id == user_id).first()
    if user:
        if channel in ("email", "whatsapp", "email_whatsapp") and (RESEND_API_KEY or (SMTP_USER and SMTP_PASS)):
            threading.Thread(
                target=_send_email_background,
                args=(user.email, user.full_name or user.username, title, message, action_url),
                daemon=True,
            ).start()
        if channel in ("whatsapp", "email_whatsapp") and WHATSAPP_WEBHOOK_URL and user.phone:
            threading.Thread(
                target=_send_whatsapp_webhook_background,
                args=(user.phone, title, message, action_url),
                daemon=True,
            ).start()

    print(f"[{channel.upper()} DISPATCH -> User #{user_id}]: {title} - {message}")
    return notif


def notify_admin_team(
    db: Session,
    title: str,
    message: str,
    order_id: Optional[int] = None,
    channel: str = "in_app",
    action_url: Optional[str] = None
):
    admins = db.query(User).filter(User.role == "admin").all()
    for adm in admins:
        create_notification(
            db=db,
            user_id=adm.id,
            title=title,
            message=message,
            order_id=order_id,
            channel=channel,
            action_url=action_url
        )
