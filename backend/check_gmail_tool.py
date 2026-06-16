import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()
supabase_url = os.environ.get("SUPABASE_URL")
supabase_key = os.environ.get("SUPABASE_KEY")
client = create_client(supabase_url, supabase_key)

tools = client.table('tools').select('*').like('name', '%gmail%').execute()
for tool in tools.data:
    print("Tool Name:", tool.get("name"))
    print("Description:", tool.get("description"))
    print("Schema:")
    print(tool.get("versions", [{}])[0].get("schema", "No schema found"))
