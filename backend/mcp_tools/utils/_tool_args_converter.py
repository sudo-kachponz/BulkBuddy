def _env_to_str(env_dict: dict) -> str:
    """Convert an env dict to mcp-proxy -e flag string."""
    return " ".join(f"-e {k} {v}" for k, v in env_dict.items())


def tool_args_converter(tools: list) -> list:
    """
    Convert a list of tool dicts (from Supabase) into full mcp-proxy commands.

    Returns:
        List of dicts with keys: full_cmd, required_env
    """
    result = []
    for tool in tools:
        try:
            tool_cfg = tool["versions"][-1]["released"]
            args = tool_cfg.get("args", "")
            port_value = tool_cfg.get("port", "")

            try:
                port = str(int(port_value)) if port_value else ""
            except (ValueError, TypeError):
                print(f"Invalid port value: {port_value!r} for tool {tool.get('name', 'unknown')}. Skipping.")
                continue

            required_env = tool_cfg.get("required_env", "")
            env = tool_cfg.get("env", {})

            env_str = (_env_to_str(env) + " ") if env else ""

        except Exception as e:
            print(f"Error processing tool {tool.get('tool_id', '?')}: {e}")
            continue

        result.append({
            "full_cmd": f"mcp-proxy --sse-port={port} {env_str}-- {args}".replace("  ", " "),
            "required_env": required_env,
        })

    return result
