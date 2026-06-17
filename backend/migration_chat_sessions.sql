-- ============================================================
-- BulkBuddy — chat_sessions table migration
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.chat_sessions (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     TEXT NOT NULL,
    agent_id    TEXT,                          -- which agent was used
    thread_id   TEXT NOT NULL,                 -- LangGraph MemorySaver key
    title       TEXT,                          -- first message snippet
    preview     TEXT,                          -- last AI reply snippet
    messages    JSONB NOT NULL DEFAULT '[]',   -- full React UI messages (incl. previews/base64)
    working_data JSONB NOT NULL DEFAULT '[]',  -- extracted nasabah rows
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Fast lookup: list sessions for a user, newest first
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_updated
    ON public.chat_sessions (user_id, updated_at DESC);

-- Auto-update updated_at on row change
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_chat_sessions_updated_at ON public.chat_sessions;
CREATE TRIGGER trg_chat_sessions_updated_at
    BEFORE UPDATE ON public.chat_sessions
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
