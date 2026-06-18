"""
Chat History Router

Provides CRUD endpoints for persisting UI-level chat sessions to Supabase.
Each session maps to a unique LangGraph thread_id so the agent's MemorySaver
context is preserved when a user re-opens a past conversation.

Endpoints:
  GET    /chat-history/              → list sessions for the current user
  POST   /chat-history/              → create a new session (returns id + thread_id)
  GET    /chat-history/{session_id}  → fetch one full session
  PUT    /chat-history/{session_id}  → update messages / working_data / title
  DELETE /chat-history/{session_id}  → delete a session
"""

import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from supabase import Client

router = APIRouter(prefix="/chat-history", tags=["chat-history"])

TABLE = "chat_sessions"
AGENT_ID = "fff649af-1f16-4027-9371-76a4d587096b"  # hardcoded BulkBuddy agent


# ── Dependency ────────────────────────────────────────────────
def get_supabase(request: Request) -> Client:
    return request.app.state.supabase


def get_user_id(request: Request) -> str:
    return request.state.user_id  # set by MockAuthMiddleware


# ── Pydantic schemas ──────────────────────────────────────────
class CreateSessionRequest(BaseModel):
    title: Optional[str] = None
    preview: Optional[str] = None
    messages: List[Dict[str, Any]] = []
    working_data: List[Dict[str, Any]] = []
    thread_id: Optional[str] = None  # if None, a new UUID is generated
    sheet_url: Optional[str] = None  # active spreadsheet URL


class UpdateSessionRequest(BaseModel):
    title: Optional[str] = None
    preview: Optional[str] = None
    messages: Optional[List[Dict[str, Any]]] = None
    working_data: Optional[List[Dict[str, Any]]] = None
    sheet_url: Optional[str] = None  # active spreadsheet URL


# ── GET /chat-history/ ────────────────────────────────────────
@router.get("/")
async def list_sessions(
    request: Request,
    supabase: Client = Depends(get_supabase),
):
    """Return all sessions for the current user (newest first, messages excluded for speed)."""
    user_id = get_user_id(request)
    try:
        resp = (
            supabase.table(TABLE)
            .select("id, user_id, agent_id, thread_id, title, preview, working_data, created_at, updated_at")
            .eq("user_id", user_id)
            .order("updated_at", desc=True)
            .execute()
        )
        return {"sessions": resp.data or []}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch sessions: {e}")


# ── POST /chat-history/ ───────────────────────────────────────
@router.post("/")
async def create_session(
    body: CreateSessionRequest,
    request: Request,
    supabase: Client = Depends(get_supabase),
):
    """Create a new chat session. Generates a fresh thread_id if not provided."""
    user_id = get_user_id(request)
    thread_id = body.thread_id or str(uuid.uuid4())

    # Auto-generate title based on date if not provided
    title = body.title
    if not title:
        today_str = datetime.now().strftime("%d/%m/%Y")
        base_title = f"SUTET PLN - {today_str}"
        try:
            resp = supabase.table(TABLE).select("title").eq("user_id", user_id).like("title", f"{base_title}%").execute()
            count = len(resp.data) if resp.data else 0
            if count == 0:
                title = base_title
            else:
                title = f"{base_title} ({count + 1})"
        except Exception:
            title = base_title

    payload = {
        "user_id": user_id,
        "agent_id": AGENT_ID,
        "thread_id": thread_id,
        "title": title or "Chat Baru",
        "preview": body.preview or "",
        "messages": body.messages,
        "working_data": body.working_data,
        "sheet_url": body.sheet_url or "",
    }
    try:
        resp = supabase.table(TABLE).insert(payload).execute()
        if not resp.data:
            raise HTTPException(status_code=500, detail="Insert returned no data")
        return resp.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create session: {e}")


# ── GET /chat-history/{session_id} ───────────────────────────
@router.get("/{session_id}")
async def get_session(
    session_id: str,
    request: Request,
    supabase: Client = Depends(get_supabase),
):
    """Return one full session including all messages."""
    user_id = get_user_id(request)
    try:
        resp = (
            supabase.table(TABLE)
            .select("*")
            .eq("id", session_id)
            .eq("user_id", user_id)
            .single()
            .execute()
        )
        if not resp.data:
            raise HTTPException(status_code=404, detail="Session not found")
        return resp.data
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch session: {e}")


# ── PUT /chat-history/{session_id} ───────────────────────────
@router.put("/{session_id}")
async def update_session(
    session_id: str,
    body: UpdateSessionRequest,
    request: Request,
    supabase: Client = Depends(get_supabase),
):
    """
    Update messages, working_data, title, or preview of an existing session.
    Only the provided fields are updated (partial update).
    """
    user_id = get_user_id(request)
    payload: Dict[str, Any] = {}

    if body.title is not None:
        payload["title"] = body.title
    if body.preview is not None:
        payload["preview"] = body.preview
    if body.messages is not None:
        payload["messages"] = body.messages
        # Auto-updating title from message is removed to preserve date-based titles
    if body.working_data is not None:
        payload["working_data"] = body.working_data
    if body.sheet_url is not None:
        payload["sheet_url"] = body.sheet_url

    # Build preview from last AI message
    if body.messages is not None and body.preview is None:
        for m in reversed(body.messages):
            if m.get("role") in ("ai", "model") and m.get("text"):
                txt = m["text"]
                payload["preview"] = (txt[:60] + "…") if len(txt) > 60 else txt
                break

    if not payload:
        return {"detail": "Nothing to update"}

    try:
        resp = (
            supabase.table(TABLE)
            .update(payload)
            .eq("id", session_id)
            .eq("user_id", user_id)
            .execute()
        )
        if not resp.data:
            raise HTTPException(status_code=404, detail="Session not found or not owned by user")
        return resp.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update session: {e}")


# ── DELETE /chat-history/{session_id} ────────────────────────
@router.delete("/{session_id}")
async def delete_session(
    session_id: str,
    request: Request,
    supabase: Client = Depends(get_supabase),
):
    """Delete a session (only if owned by the current user)."""
    user_id = get_user_id(request)
    try:
        resp = (
            supabase.table(TABLE)
            .delete()
            .eq("id", session_id)
            .eq("user_id", user_id)
            .execute()
        )
        return {"deleted": True, "id": session_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete session: {e}")
