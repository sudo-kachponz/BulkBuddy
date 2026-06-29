import os
import json
from dotenv import load_dotenv
from supabase import create_client

load_dotenv(".env")

url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_KEY")
supabase = create_client(url, key)

data = [
    {
        "version": "1.0.0",
        "released": {
            "transport": "stdio",
            "command": "npx",
            "args": ["-y", "@pegasusheavy/google-mcp"]
        }
    }
]

result = supabase.table("tools").update({"versions": data}).eq("tool_id", "ea584a54-4bc7-43ca-a7c2-3a27d1976219").execute()
print("Berhasil update ke STDIO!")
