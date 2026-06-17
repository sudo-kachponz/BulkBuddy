import json
from typing import Any

def to_toon_format(data: Any) -> str:
    """Converts a JSON-like object or string into a TOON tabular representation."""
    if isinstance(data, str):
        try:
            parsed = json.loads(data)
            if isinstance(parsed, (list, dict)):
                return to_toon_format(parsed)
            return data
        except json.JSONDecodeError:
            return data
            
    if isinstance(data, list) and len(data) > 0 and isinstance(data[0], dict):
        keys = list(data[0].keys())
        header = " | ".join(str(k) for k in keys)
        rows = []
        for item in data:
            row = " | ".join(str(item.get(k, "")).replace("\n", " ") for k in keys)
            rows.append(row)
            
        return f"[TOON_DATA]\n{header}\n" + "\n".join(rows) + "\n[END_TOON]"
        
    if isinstance(data, dict):
        keys = list(data.keys())
        header = " | ".join(str(k) for k in keys)
        row = " | ".join(str(data.get(k, "")).replace("\n", " ") for k in keys)
        return f"[TOON_DATA]\n{header}\n{row}\n[END_TOON]"

    # Fallback for other types
    try:
        return json.dumps(data, indent=2)
    except:
        return str(data)

def wrap_tool_with_toon(tool):
    """Wraps a LangChain BaseTool to convert its output to TOON format."""
    # We patch the standard execution methods used by LangChain/LangGraph
    original_ainvoke = getattr(tool, "ainvoke", None)
    original_invoke = getattr(tool, "invoke", None)
    original_arun = getattr(tool, "_arun", None)
    original_run = getattr(tool, "_run", None)
    
    if original_ainvoke:
        async def new_ainvoke(*args, **kwargs):
            res = await original_ainvoke(*args, **kwargs)
            if hasattr(res, 'content'):
                res.content = to_toon_format(res.content)
                return res
            return to_toon_format(res)
        # Bind the function to the instance
        tool.ainvoke = new_ainvoke.__get__(tool, type(tool))
        
    if original_invoke:
        def new_invoke(*args, **kwargs):
            res = original_invoke(*args, **kwargs)
            if hasattr(res, 'content'):
                res.content = to_toon_format(res.content)
                return res
            return to_toon_format(res)
        tool.invoke = new_invoke.__get__(tool, type(tool))
        
    if original_arun:
        async def new_arun(*args, **kwargs):
            res = await original_arun(*args, **kwargs)
            return to_toon_format(res)
        tool._arun = new_arun.__get__(tool, type(tool))
        
    if original_run:
        def new_run(*args, **kwargs):
            res = original_run(*args, **kwargs)
            return to_toon_format(res)
        tool._run = new_run.__get__(tool, type(tool))
        
    return tool
