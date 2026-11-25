import json
import os
import shutil
from datetime import datetime
from typing import Optional, Dict, Set
from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, Query, UploadFile, File, Form
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.database import get_db
from app.models.chat import ChatMessage
from app.models.user import User
from app.models.order import Order
from app.services.auth_service import get_current_user, decode_token
from app.services.storage_service import upload_file_bytes
from app.config import MAX_FILE_SIZE_MB

router = APIRouter(tags=["Chat"])

# WebSocket connection manager - shared with main app
class ConnectionManager:
    def __init__(self):
        # order_id -> {user_id -> websocket}
        self.active_connections: Dict[str, Dict[int, WebSocket]] = {}
        self.online_users: Set[int] = set()

    async def connect(self, websocket: WebSocket, order_id: str, user_id: int):
        await websocket.accept()
        if order_id not in self.active_connections:
            self.active_connections[order_id] = {}
        self.active_connections[order_id][user_id] = websocket
        self.online_users.add(user_id)

    def disconnect(self, order_id: str, user_id: int):
        if order_id in self.active_connections:
            self.active_connections[order_id].pop(user_id, None)
            if not self.active_connections[order_id]:
                del self.active_connections[order_id]
        self.online_users.discard(user_id)

    async def send_to_room(self, order_id: str, message: dict, exclude_user: Optional[int] = None):
        if order_id in self.active_connections:
            dead = []
            for uid, ws in self.active_connections[order_id].items():
                if uid == exclude_user:
                    continue
                try:
                    await ws.send_json(message)
                except Exception:
                    dead.append(uid)
            for uid in dead:
                self.active_connections[order_id].pop(uid, None)

    async def broadcast_to_room(self, order_id: str, message: dict):
        await self.send_to_room(order_id, message)

    def get_online_users(self):
        return list(self.online_users)


manager = ConnectionManager()


class SendMessageRequest(BaseModel):
    order_id: Optional[int] = None
    content: str
    message_type: str = "text"
    file_url: Optional[str] = None


@router.get("/api/chat/messages/{order_id}")
def get_messages(
    order_id: int,
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify access
    if current_user.role == "student":
        order = db.query(Order).filter(Order.id == order_id, Order.student_id == current_user.id).first()
        if not order:
            raise HTTPException(status_code=403, detail="Access denied")

    messages = db.query(ChatMessage).filter(
        ChatMessage.order_id == order_id
    ).order_by(ChatMessage.created_at.asc()).offset(skip).limit(limit).all()

    # Mark as read
    for msg in messages:
        if msg.sender_id != current_user.id and not msg.is_read:
            msg.is_read = True
    db.commit()

    return [
        {
            "id": m.id,
            "sender_id": m.sender_id,
            "sender_name": m.sender.full_name or m.sender.username if m.sender else "Unknown",
            "sender_role": m.sender.role if m.sender else None,
            "order_id": m.order_id,
            "content": m.content,
            "message_type": m.message_type,
            "file_url": m.file_url,
            "is_read": m.is_read,
            "created_at": m.created_at.isoformat() if m.created_at else None
        }
        for m in messages
    ]


@router.post("/api/chat/messages")
def send_message(
    req: SendMessageRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Validate order access if order_id is provided
    if req.order_id and current_user.role == "student":
        order = db.query(Order).filter(Order.id == req.order_id, Order.student_id == current_user.id).first()
        if not order:
            raise HTTPException(status_code=403, detail="Access denied")

    msg = ChatMessage(
        sender_id=current_user.id,
        order_id=req.order_id,
        content=req.content,
        message_type=req.message_type,
        file_url=req.file_url,
        is_read=False
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)

    return {
        "id": msg.id,
        "sender_id": msg.sender_id,
        "sender_name": current_user.full_name or current_user.username,
        "sender_role": current_user.role,
        "order_id": msg.order_id,
        "content": msg.content,
        "message_type": msg.message_type,
        "file_url": msg.file_url,
        "is_read": msg.is_read,
        "created_at": msg.created_at.isoformat() if msg.created_at else None
    }


@router.post("/api/chat/upload-attachment")
async def upload_chat_attachment(
    file: UploadFile = File(...),
    order_id: Optional[str] = Form(None),
    orderId: Optional[str] = Form(None),
    order_id_query: Optional[str] = Query(None, alias="order_id"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    raw_order_id = order_id or orderId or order_id_query
    if not raw_order_id:
        raise HTTPException(status_code=400, detail="order_id is required")
    try:
        resolved_order_id = int(raw_order_id)
    except (ValueError, TypeError):
        raise HTTPException(status_code=400, detail="Invalid order_id format")

    # Access control: verify student ownership
    if current_user.role == "student":
        order = db.query(Order).filter(Order.id == resolved_order_id, Order.student_id == current_user.id).first()
        if not order:
            raise HTTPException(status_code=403, detail="Access denied")

    # Verify file size (up to MAX_FILE_SIZE_MB)
    file.file.seek(0, 2)
    file_size = file.file.tell()
    file.file.seek(0)
    max_bytes = MAX_FILE_SIZE_MB * 1024 * 1024
    if file_size > max_bytes:
        raise HTTPException(
            status_code=400,
            detail=f"File exceeds maximum allowed size of {MAX_FILE_SIZE_MB}MB (received {round(file_size / (1024 * 1024), 2)}MB)"
        )

    safe_filename = f"chat_{resolved_order_id}_{int(datetime.utcnow().timestamp())}_{file.filename}"
    file_bytes = await file.read()
    file_url, _ = upload_file_bytes(
        file_bytes=file_bytes,
        filename=safe_filename,
        folder="references",
        content_type=file.content_type or "application/octet-stream"
    )

    content_type = (file.content_type or "").lower()
    filename_lower = file.filename.lower()
    if content_type.startswith("audio/") or any(filename_lower.endswith(ext) for ext in [".webm", ".mp3", ".wav", ".m4a", ".ogg"]):
        msg_type = "audio"
        msg_content = f"🎙️ Voice Memo: {file.filename}"
    elif content_type.startswith("image/") or any(filename_lower.endswith(ext) for ext in [".png", ".jpg", ".jpeg", ".gif", ".webp"]):
        msg_type = "image"
        msg_content = f"🖼️ Image: {file.filename}"
    else:
        msg_type = "file"
        msg_content = f"📎 Attached file: {file.filename}"

    msg = ChatMessage(
        sender_id=current_user.id,
        order_id=resolved_order_id,
        content=msg_content,
        message_type=msg_type,
        file_url=file_url,
        is_read=False
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)

    return {
        "id": msg.id,
        "sender_id": msg.sender_id,
        "sender_name": current_user.full_name or current_user.username,
        "sender_role": current_user.role,
        "order_id": msg.order_id,
        "content": msg.content,
        "message_type": msg.message_type,
        "file_url": msg.file_url,
        "is_read": msg.is_read,
        "created_at": msg.created_at.isoformat() if msg.created_at else None
    }


@router.get("/api/chat/online-status")
def get_online_status(current_user: User = Depends(get_current_user)):
    return {
        "online_users": manager.get_online_users(),
        "count": len(manager.online_users)
    }


@router.websocket("/ws/chat/{order_id}/{user_id}")
async def websocket_chat(
    websocket: WebSocket,
    order_id: str,
    user_id: int,
    db: Session = Depends(get_db)
):
    # Try to authenticate via token query param
    token = websocket.query_params.get("token")
    authenticated_user = None
    if token:
        payload = decode_token(token)
        if payload:
            uid = payload.get("sub")
            if uid:
                authenticated_user = db.query(User).filter(User.id == int(uid)).first()

    # Enforce access control on websocket rooms
    if authenticated_user and authenticated_user.role == "student":
        try:
            oid = int(order_id)
            user_order = db.query(Order).filter(Order.id == oid, Order.student_id == authenticated_user.id).first()
            if not user_order:
                await websocket.close(code=1008)
                return
        except ValueError:
            pass

    await manager.connect(websocket, order_id, user_id)

    # Update online status in DB
    if authenticated_user:
        authenticated_user.is_online = True
        authenticated_user.last_seen = datetime.utcnow()
        db.commit()

    # Notify room of new user
    await manager.broadcast_to_room(order_id, {
        "type": "presence",
        "user_id": user_id,
        "status": "online",
        "online_users": manager.get_online_users()
    })

    try:
        while True:
            data = await websocket.receive_json()
            msg_type = data.get("type", "message")

            if msg_type == "message":
                content = data.get("content", "")
                file_url = data.get("file_url")
                message_type = data.get("message_type", "text")

                # Save to DB
                db_msg = ChatMessage(
                    sender_id=user_id,
                    order_id=int(order_id) if order_id.isdigit() else None,
                    content=content,
                    message_type=message_type,
                    file_url=file_url,
                    is_read=False
                )
                db.add(db_msg)
                db.commit()
                db.refresh(db_msg)

                sender = db.query(User).filter(User.id == user_id).first()

                broadcast_data = {
                    "type": "message",
                    "id": db_msg.id,
                    "sender_id": user_id,
                    "sender_name": sender.full_name or sender.username if sender else str(user_id),
                    "sender_role": sender.role if sender else None,
                    "content": content,
                    "message_type": message_type,
                    "file_url": file_url,
                    "order_id": db_msg.order_id,
                    "created_at": db_msg.created_at.isoformat() if db_msg.created_at else None
                }
                await manager.broadcast_to_room(order_id, broadcast_data)

            elif msg_type == "ping":
                await websocket.send_json({"type": "pong"})

    except WebSocketDisconnect:
        manager.disconnect(order_id, user_id)

        if authenticated_user:
            authenticated_user.is_online = False
            authenticated_user.last_seen = datetime.utcnow()
            db.commit()

        await manager.broadcast_to_room(order_id, {
            "type": "presence",
            "user_id": user_id,
            "status": "offline",
            "online_users": manager.get_online_users()
        })
