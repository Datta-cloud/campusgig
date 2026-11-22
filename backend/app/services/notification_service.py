from datetime import datetime
from typing import Optional, List
from sqlalchemy.orm import Session
from app.models.notification import Notification
from app.models.user import User


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

    # Simulated dispatch for WhatsApp & Email channels
    print(f"[🔔 {channel.upper()} DISPATCH to User #{user_id}]: {title} - {message}")
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
