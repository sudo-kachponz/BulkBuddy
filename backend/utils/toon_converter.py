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

from langchain_core.tools import StructuredTool

def wrap_tool_with_toon(tool):
    """Wraps a LangChain BaseTool to convert its output to TOON format."""
    
    async def async_wrapper(*args, **kwargs):
        # Pass kwargs to the original tool's ainvoke
        input_data = kwargs if kwargs else (args[0] if args else {})
        res = await tool.ainvoke(input_data)
        if hasattr(res, 'content'):
            return to_toon_format(res.content)
        return to_toon_format(res)

    def sync_wrapper(*args, **kwargs):
        input_data = kwargs if kwargs else (args[0] if args else {})
        res = tool.invoke(input_data)
        if hasattr(res, 'content'):
            return to_toon_format(res.content)
        return to_toon_format(res)

    # Return a new StructuredTool that preserves the original schema
    try:
        return StructuredTool(
            name=tool.name,
            description=tool.description,
            args_schema=tool.args_schema,
            func=sync_wrapper,
            coroutine=async_wrapper
        )
    except Exception:
        # Fallback if StructuredTool instantiation fails
        return tool
