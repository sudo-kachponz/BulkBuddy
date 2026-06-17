import os
import sys
from dotenv import load_dotenv
from supabase import create_client, Client
from datetime import datetime

env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '.env')
load_dotenv(env_path)

supabase_url = os.environ.get("SUPABASE_URL")
supabase_key = os.environ.get("SUPABASE_KEY")
supabase = create_client(supabase_url, supabase_key)

# Fetch all sessions, ordered by created_at ascending so we can number them sequentially
resp = supabase.table("chat_sessions").select("id, created_at").order("created_at", desc=False).execute()

sessions = resp.data
if not sessions:
    print("No sessions found.")
    sys.exit(0)

# Group by date
date_counts = {}

for session in sessions:
    created_at_str = session.get("created_at")
    try:
        # Handle ISO format
        dt = datetime.fromisoformat(created_at_str.replace("Z", "+00:00"))
        date_str = dt.strftime("%d/%m/%Y")
    except Exception:
        date_str = datetime.now().strftime("%d/%m/%Y")
        
    if date_str not in date_counts:
        date_counts[date_str] = 1
        new_title = f"SUTET PLN - {date_str}"
    else:
        date_counts[date_str] += 1
        new_title = f"SUTET PLN - {date_str} ({date_counts[date_str]})"
        
    # Update title in DB
    supabase.table("chat_sessions").update({"title": new_title}).eq("id", session["id"]).execute()
    print(f"Updated session {session['id'][:8]} -> {new_title}")

print("Done renaming all sessions!")
