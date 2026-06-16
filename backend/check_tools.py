import asyncio
import os
import sys

# Ensure backend folder is in path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from agent_boilerplate.utils.mcp_client import MultiServerMCPClient
from argparse import Namespace

async def main():
    args = Namespace(command="none", db=False, api=True, dev=False)
    client = MultiServerMCPClient(args)
    tools = await client.get_tools()
    for tool in tools:
        if "gmail" in tool.name.lower():
            print(f"Tool: {tool.name}")
            print(f"Schema: {tool.inputSchema}")

asyncio.run(main())
