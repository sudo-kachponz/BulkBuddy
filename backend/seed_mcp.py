import os
import json
import uuid
import requests
from dotenv import load_dotenv

env_path = "/home/firania/Documents/BulkBuddy/.env"
load_dotenv(env_path)

supabase_url = os.environ.get("SUPABASE_URL")
supabase_key = os.environ.get("SUPABASE_KEY")

headers = {
    "apikey": supabase_key,
    "Authorization": f"Bearer {supabase_key}",
    "Content-Type": "application/json",
    "Prefer": "return=representation"
}

user_id = "12b673cf-c6a3-4d80-afc4-30b6566b3690"
company_id = None

def upsert_tool(name, description, args, port, on_status="Active"):
    # Check if tool exists
    res = requests.get(f"{supabase_url}/rest/v1/tools?name=eq.{name}", headers=headers)
    existing_tools = res.json() if res.status_code == 200 else []
    
    payload = {
        "user_id": user_id,
        "company_id": company_id,
        "name": name,
        "description": description,
        "versions": [
            {
                "version": "1.0.0",
                "released": {
                    "env": {},
                    "args": args,
                    "port": port,
                    "method": "sse",
                    "required_env": []
                }
            }
        ],
        "on_status": on_status
    }
    
    if existing_tools:
        tool_id = existing_tools[0]["tool_id"]
        # Update existing
        update_res = requests.patch(f"{supabase_url}/rest/v1/tools?tool_id=eq.{tool_id}", headers=headers, json=payload)
        if update_res.status_code in [200, 204]:
            print(f"Tool {name} updated with ID: {tool_id}")
            return tool_id
        else:
            print(f"Failed to update tool {name}: {update_res.status_code} - {update_res.text}")
            return None
    else:
        # Insert new
        tool_id = str(uuid.uuid4())
        payload["tool_id"] = tool_id
        insert_res = requests.post(f"{supabase_url}/rest/v1/tools", headers=headers, json=payload)
        if insert_res.status_code in [200, 201]:
            print(f"Tool {name} created with ID: {tool_id}")
            return tool_id
        else:
            print(f"Failed to create tool {name}: {insert_res.status_code} - {insert_res.text}")
            return None

def upsert_agent(name, description, style, tool_ids):
    # Check if agent exists
    res = requests.get(f"{supabase_url}/rest/v1/agents?agent_name=eq.{name}", headers=headers)
    existing_agents = res.json() if res.status_code == 200 else []
    
    payload = {
        "user_id": user_id,
        "company_id": company_id,
        "agent_name": name,
        "description": description,
        "agent_style": style,
        "on_status": True,
        "tools": tool_ids,
        "share_editor_with": []
    }
    
    if existing_agents:
        agent_id = existing_agents[0]["agent_id"]
        # Update existing
        update_res = requests.patch(f"{supabase_url}/rest/v1/agents?agent_id=eq.{agent_id}", headers=headers, json=payload)
        if update_res.status_code in [200, 204]:
            print(f"Agent {name} updated with ID: {agent_id}")
            return agent_id
        else:
            print(f"Failed to update agent {name}: {update_res.status_code} - {update_res.text}")
            return None
    else:
        # Insert new
        agent_id = str(uuid.uuid4())
        payload["agent_id"] = agent_id
        insert_res = requests.post(f"{supabase_url}/rest/v1/agents", headers=headers, json=payload)
        if insert_res.status_code in [200, 201]:
            print(f"Agent {name} created with ID: {agent_id}")
            return agent_id
        else:
            print(f"Failed to create agent {name}: {insert_res.status_code} - {insert_res.text}")
            return None

def mark_offline(names):
    for name in names:
        res = requests.get(f"{supabase_url}/rest/v1/tools?name=eq.{name}", headers=headers)
        existing_tools = res.json() if res.status_code == 200 else []
        if existing_tools:
            tool_id = existing_tools[0]["tool_id"]
            patch_res = requests.patch(f"{supabase_url}/rest/v1/tools?tool_id=eq.{tool_id}", headers=headers, json={"on_status": "Offline"})
            if patch_res.status_code in [200, 204]:
                print(f"Tool {name} marked as Offline")
            else:
                print(f"Failed to mark tool {name} as Offline: {patch_res.status_code}")

def main():
    print(f"Using User ID: {user_id}")
    
    # 1. Mark legacy tools as Offline
    mark_offline(["mcp-google-sheets", "mcp-gmail"])
    
    # 2. Insert/Update google-mcp Tool
    google_mcp_id = upsert_tool(
        "google-mcp", 
        "MCP Server untuk mengakses layanan Google (Sheets, Gmail, Calendar, Drive, dll).", 
        "npx -y @pegasusheavy/google-mcp", 
        "10010"
    )
    
    # 3. Insert/Update Agent
    if google_mcp_id:
        upsert_agent(
            "BulkBuddy Google Agent",
            "Agent untuk pelaporan via Gmail dan penyimpanan data nasabah via Sheets",
            "Kamu adalah asisten profesional Bank Mandiri bernama BulkBuddy. Tugas utamamu mencakup menyimpan data OCR nasabah ke Google Sheets, dan membuat/mengirimkan email laporan ke CTO dengan format yang tepat beserta attachment-nya. Manfaatkan tools google-mcp yang tersedia untuk berinteraksi dengan Sheets dan Gmail secara otomatis.",
            [google_mcp_id]
        )

if __name__ == "__main__":
    main()
