import os
import sys
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client, Client
from dotenv import load_dotenv
from starlette.middleware.base import BaseHTTPMiddleware

# Ensure backend folder is in path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from agent_boilerplate.routes.agent_invoke import router as agent_invoke_router
from agent_boilerplate.routes.agent_api import router as agent_api_router
from mcp_tools.routes.mcp_tools import router as mcp_tools_router, refresh_tools

# Load environment variables from the project root .env
env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env')
load_dotenv(env_path)

supabase_url = os.environ.get("SUPABASE_URL")
supabase_key = os.environ.get("SUPABASE_KEY")

if not supabase_url or not supabase_key:
    print("Warning: SUPABASE_URL or SUPABASE_KEY not found in .env. Agents won't be able to fetch configurations.")

# Initialize supabase client
supabase_client: Client = create_client(supabase_url, supabase_key) if supabase_url and supabase_key else None

app = FastAPI(title="BulkBuddy Backend", description="Backend using agent_boilerplate to serve MCP agents.")

# Add CORS Middleware to allow React frontend connection
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class MockAuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # We hardcode the user_id matching the one used in seed_mcp.py
        request.state.user_id = "12b673cf-c6a3-4d80-afc4-30b6566b3690"
        return await call_next(request)

app.add_middleware(MockAuthMiddleware)

def setup_google_credentials():
    import json
    client_id = os.environ.get("GOOGLE_CLIENT_ID")
    client_secret = os.environ.get("GOOGLE_CLIENT_SECRET")
    project_id = os.environ.get("GOOGLE_PROJECT_ID")
    
    if not client_id or not client_secret:
        print("Warning: GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET not found. Skipping credentials.json generation.")
        return
        
    creds_dir = os.path.expanduser("~/.config/google-mcp")
    os.makedirs(creds_dir, exist_ok=True)
    creds_path = os.path.join(creds_dir, "credentials.json")
    
    creds_data = {
      "installed": {
        "client_id": client_id,
        "project_id": project_id or "bulkbuddy-mcp",
        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
        "token_uri": "https://oauth2.googleapis.com/token",
        "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
        "client_secret": client_secret,
        "redirect_uris": [
            "http://localhost:3001/oauth2callback",
            "http://localhost:3002/oauth2callback",
            "http://localhost:3003/oauth2callback",
            "http://localhost:3004/oauth2callback",
            "http://localhost:3005/oauth2callback",
            "http://localhost:3006/oauth2callback"
        ]
      }
    }
    
    with open(creds_path, 'w') as f:
        json.dump(creds_data, f, indent=2)
    print(f"Generated Google MCP credentials at {creds_path}")

@app.on_event("startup")
async def startup_event():
    # Make supabase available in app.state for the routers
    app.state.supabase = supabase_client
    # Generate credentials for google-mcp
    setup_google_credentials()
    
    # Start the MCP proxy manager to spawn background MCP servers
    print("Starting MCP proxy manager...")
    try:
        await refresh_tools(force_refresh=True)
    except Exception as e:
        print(f"Failed to start MCP proxy manager: {e}")

# Include routers from the agent boilerplate
app.include_router(agent_invoke_router)
app.include_router(agent_api_router)
app.include_router(mcp_tools_router)

@app.get("/")
def read_root():
    return {"message": "BulkBuddy Backend is up and running!"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
