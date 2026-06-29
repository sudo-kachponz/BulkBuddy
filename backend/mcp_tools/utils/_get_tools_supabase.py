import os
from typing import List, Dict, Any
from dotenv import load_dotenv, find_dotenv
from supabase import create_client


def get_all_tools() -> List[Dict[str, Any]]:
    """
    Get all tools from Supabase (tools_with_decrypted_keys view).
    
    Returns:
        List of tool dictionaries from the database with decrypted API keys
    """
    load_dotenv(find_dotenv())

    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_KEY")

    if not supabase_url or not supabase_key:
        raise ValueError("SUPABASE_URL and SUPABASE_KEY must be set in environment variables")

    supabase = create_client(supabase_url, supabase_key)

    response = (
        supabase.table("tools_with_decrypted_keys")
        .select("*")
        .eq("name", "google-mcp")
        .execute()
    )

    return response.data