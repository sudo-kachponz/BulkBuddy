import os
import requests
from dotenv import load_dotenv

env_path = "/home/firania/Documents/BulkBuddy/.env"
load_dotenv(env_path)
supabase_url = os.environ.get("SUPABASE_URL")
supabase_key = os.environ.get("SUPABASE_KEY")

headers = {
    "apikey": supabase_key,
    "Authorization": f"Bearer {supabase_key}",
    "Content-Type": "application/json"
}

c_res = requests.get(f"{supabase_url}/rest/v1/companies?limit=1", headers=headers)
print("Companies:", c_res.status_code, c_res.json())

t_res = requests.get(f"{supabase_url}/rest/v1/tools?limit=1", headers=headers)
print("Tools:", t_res.status_code, t_res.json())

a_res = requests.get(f"{supabase_url}/rest/v1/agents?limit=1", headers=headers)
print("Agents:", a_res.status_code, a_res.json())

