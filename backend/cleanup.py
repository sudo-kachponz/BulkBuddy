import os
import sys
from dotenv import load_dotenv
from supabase import create_client, Client

env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '.env')
load_dotenv(env_path)

supabase_url = os.environ.get("SUPABASE_URL")
supabase_key = os.environ.get("SUPABASE_KEY")
supabase = create_client(supabase_url, supabase_key)

resp = supabase.table("chat_sessions").delete().eq("title", "Chat Baru").execute()
print(f"Deleted {len(resp.data)} 'Chat Baru' sessions.")

# Also rename any existing sessions today to SUTET PLN - DD/MM/YYYY? 
# The user just said: "Tolong dong chat historynya diformat kayak SUTET PLN - 17/06/2026 ... Yang tulisannya masih "Chat Baru" dihapus aja"
# Let's just delete the 'Chat Baru' ones.
