import { useState, useEffect, useCallback } from 'react';

const API_BASE = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL}/chat-history` 
  : 'http://localhost:8000/chat-history';

export function useChatHistory() {
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load all sessions (metadata only) for the sidebar
  const loadSessions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      
      const formatted = (data.sessions || []).map(s => {
        const d = new Date(s.updated_at)
        return {
          ...s,
          time: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      })
      setSessions(formatted);
    } catch (err) {
      console.error('Failed to load chat history:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch full details of one session
  const getSession = useCallback(async (sessionId) => {
    try {
      const res = await fetch(`${API_BASE}/${sessionId}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.error('Failed to load session details:', err);
      return null;
    }
  }, []);

  // Create a new session
  const createSession = useCallback(async ({ messages = [], workingData = [], title = '', preview = '', thread_id, sheet_url = '' }) => {
    try {
      const res = await fetch(`${API_BASE}/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages, working_data: workingData, title, preview, thread_id, sheet_url }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const newSession = await res.json();
      
      const d = new Date(newSession.updated_at || Date.now())
      newSession.time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

      // prepend to local state
      setSessions(prev => [newSession, ...prev]);
      return newSession;
    } catch (err) {
      console.error('Failed to create session:', err);
      return null;
    }
  }, []);

  // Update an existing session
  const updateSession = useCallback(async (sessionId, { messages, workingData, title, preview, sheet_url }) => {
    try {
      const payload = {};
      if (messages !== undefined) payload.messages = messages;
      if (workingData !== undefined) payload.working_data = workingData;
      if (title !== undefined) payload.title = title;
      if (preview !== undefined) payload.preview = preview;
      if (sheet_url !== undefined) payload.sheet_url = sheet_url;

      const res = await fetch(`${API_BASE}/${sessionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const updated = await res.json();
      
      const d = new Date(updated.updated_at || Date.now())
      updated.time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

      // Update local state to reflect new title/preview/time
      setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, ...updated } : s));
      return updated;
    } catch (err) {
      console.error('Failed to update session:', err);
      return null;
    }
  }, []);

  // Delete a session
  const deleteSession = useCallback(async (sessionId) => {
    try {
      const res = await fetch(`${API_BASE}/${sessionId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      return true;
    } catch (err) {
      console.error('Failed to delete session:', err);
      return false;
    }
  }, []);

  return {
    sessions,
    isLoading,
    error,
    loadSessions,
    getSession,
    createSession,
    updateSession,
    deleteSession
  };
}
