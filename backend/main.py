import os
import sys
import gc
import tracemalloc
import resource
import logging
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client, Client
from dotenv import load_dotenv
from starlette.middleware.base import BaseHTTPMiddleware
import jwt

# Ensure backend folder is in path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from agent_boilerplate.routes.agent_invoke import router as agent_invoke_router
from agent_boilerplate.routes.agent_api import router as agent_api_router
from mcp_tools.routes.mcp_tools import router as mcp_tools_router, refresh_tools
from mcp_tools.routes.reports import router as reports_router, cleanup_old_reports
from mcp_tools.routes.chat_history import router as chat_history_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("bulkbuddy")

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
# Ambil URL frontend dari environment, jika tidak ada gunakan wildcard (*)
frontend_url = os.environ.get("FRONTEND_URL", "*")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_url, "http://localhost:5173", "http://127.0.0.1:5173"] if frontend_url != "*" else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Exclude CORS preflight, docs, and debug endpoints from auth checks
        if request.method == "OPTIONS" or request.url.path in ["/", "/health", "/docs", "/openapi.json", "/redoc", "/debug/memory", "/debug/gc"]:
            return await call_next(request)
            
        auth_header = request.headers.get("Authorization")
        api_key_header = request.headers.get("X-API-Key")
        
        user_id = None
        
        # 1. API Key Check
        api_key_env = os.environ.get("BULKBUDDY_API_KEY")
        if api_key_env and api_key_header == api_key_env:
            user_id = "12b673cf-c6a3-4d80-afc4-30b6566b3690"
            
        # 2. Supabase JWT Check
        elif auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
            jwt_secret = os.environ.get("JWT_SECRET")
            if jwt_secret:
                try:
                    payload = jwt.decode(token, jwt_secret, algorithms=["HS256"], options={"verify_aud": False})
                    user_id = payload.get("sub")
                except Exception as e:
                    logger.warning(f"Failed to decode JWT: {e}")
                    
        # 3. Development Fallback
        if not user_id:
            env = os.environ.get("ENV", "development")
            if env == "development":
                user_id = "12b673cf-c6a3-4d80-afc4-30b6566b3690"
            else:
                from fastapi.responses import JSONResponse
                return JSONResponse(status_code=401, content={"detail": "Unauthorized: Missing or invalid authentication"})
                
        request.state.user_id = user_id
        return await call_next(request)

app.add_middleware(AuthMiddleware)

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


# ── Startup & Shutdown Lifecycle ──────────────────────────────────────

@app.on_event("startup")
async def startup_event():
    # Start tracemalloc for memory debugging only in development
    if os.environ.get("ENV", "development") == "development":
        tracemalloc.start(10)  # Track top 10 frames
        logger.info("🧠 tracemalloc started for memory monitoring")
    else:
        logger.info("🧠 tracemalloc disabled in production to save RAM")

    # Make supabase available in app.state for the routers
    app.state.supabase = supabase_client

    # Generate credentials for google-mcp
    setup_google_credentials()
    
    # Clean up any stale temp report files from previous runs
    cleanup_old_reports(max_age_hours=2)
    
    # Start the MCP proxy manager to spawn background MCP servers
    print("Starting MCP proxy manager...")
    try:
        await refresh_tools(force_refresh=True)
    except Exception as e:
        print(f"Failed to start MCP proxy manager: {e}")

    logger.info("✅ BulkBuddy Backend started successfully")


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup resources on shutdown to prevent zombie processes."""
    logger.info("🛑 BulkBuddy Backend shutting down...")
    
    # Stop all MCP proxy processes
    try:
        from mcp_tools.routes.mcp_tools import manager
        manager.stop_all()
        logger.info("✅ All MCP proxy processes stopped")
    except Exception as e:
        logger.warning("⚠️  Error stopping MCP processes: %s", e)
    
    # Stop tracemalloc
    if tracemalloc.is_tracing():
        tracemalloc.stop()
        logger.info("🧠 tracemalloc stopped")
    
    # Force garbage collection
    gc.collect()
    logger.info("🛑 Shutdown complete")


# ── Routers ───────────────────────────────────────────────────────────

app.include_router(agent_invoke_router)
app.include_router(agent_api_router)
app.include_router(mcp_tools_router)
app.include_router(reports_router)
app.include_router(chat_history_router)


# ── Health & Debug Endpoints ──────────────────────────────────────────

@app.get("/")
def read_root():
    return {"message": "BulkBuddy Backend is up and running!"}


@app.get("/health")
def health_check():
    """Lightweight liveness probe — no auth, no DB call."""
    return {"ok": True}


@app.get("/debug/memory")
async def debug_memory():
    """
    Memory debugging endpoint — hit this from browser to monitor RAM usage.
    
    Returns:
        - RSS: Total physical memory used by this process (in MB)
        - tracemalloc_top: Top 10 code locations consuming the most memory
        - agent_memories: Number of agent conversation memories in RAM
        - gc_stats: Python garbage collector statistics
    """
    result = {}
    
    # 1. Process RSS memory (via resource module — no psutil needed)
    try:
        # getrusage returns maxrss in KB on Linux
        rusage = resource.getrusage(resource.RUSAGE_SELF)
        result["rss_mb"] = round(rusage.ru_maxrss / 1024, 2)
    except Exception as e:
        result["rss_mb"] = f"Error: {e}"
    
    # 2. Try psutil for more accurate current RSS (optional dependency)
    try:
        import psutil
        process = psutil.Process()
        mem_info = process.memory_info()
        result["rss_current_mb"] = round(mem_info.rss / (1024 * 1024), 2)
        result["vms_mb"] = round(mem_info.vms / (1024 * 1024), 2)
        
        # System-wide memory
        sys_mem = psutil.virtual_memory()
        result["system_memory"] = {
            "total_mb": round(sys_mem.total / (1024 * 1024), 2),
            "available_mb": round(sys_mem.available / (1024 * 1024), 2),
            "percent_used": sys_mem.percent,
        }
    except ImportError:
        result["rss_current_mb"] = "psutil not installed (pip install psutil for accurate RSS)"
    
    # 3. tracemalloc top memory consumers
    if tracemalloc.is_tracing():
        snapshot = tracemalloc.take_snapshot()
        # Filter out importlib and tracemalloc internal frames
        snapshot = snapshot.filter_traces([
            tracemalloc.Filter(False, "<frozen importlib._bootstrap>"),
            tracemalloc.Filter(False, "<frozen importlib._bootstrap_external>"),
            tracemalloc.Filter(False, tracemalloc.__file__),
        ])
        top_stats = snapshot.statistics("lineno")
        result["tracemalloc_top_10"] = [
            {
                "file": str(stat.traceback),
                "size_kb": round(stat.size / 1024, 2),
                "count": stat.count,
            }
            for stat in top_stats[:10]
        ]
        current, peak = tracemalloc.get_traced_memory()
        result["tracemalloc_current_mb"] = round(current / (1024 * 1024), 2)
        result["tracemalloc_peak_mb"] = round(peak / (1024 * 1024), 2)
    else:
        result["tracemalloc"] = "Not tracing (start with tracemalloc.start())"
    
    # 4. Agent memories count
    try:
        from agent_boilerplate.boilerplate.agent_boilerplate import agent_boilerplate
        result["agent_memories_count"] = len(agent_boilerplate.agent_memories)
        result["agent_memories_max"] = agent_boilerplate.MAX_AGENT_MEMORIES
        result["agent_memory_ids"] = list(agent_boilerplate.agent_memories.keys())
    except Exception as e:
        result["agent_memories"] = f"Error: {e}"
    
    # 5. MCP proxy process count
    try:
        from mcp_tools.routes.mcp_tools import manager as mcp_manager
        result["mcp_processes"] = {
            "count": len(mcp_manager._processes),
            "ports": list(mcp_manager._processes.keys()),
        }
    except Exception as e:
        result["mcp_processes"] = f"Error: {e}"

    # 6. GC stats
    result["gc_stats"] = {
        f"gen{i}": gc.get_count()[i] for i in range(3)
    }
    result["gc_thresholds"] = gc.get_threshold()
    
    return result


@app.get("/debug/gc")
async def debug_gc():
    """Force a garbage collection cycle and return stats."""
    before = gc.get_count()
    collected = gc.collect()
    after = gc.get_count()
    return {
        "collected_objects": collected,
        "before": before,
        "after": after,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
