import os
import json
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage
from langchain_core.tools import tool

@tool
def dummy_tool(x: int) -> int:
    """Returns the number."""
    return x

def test_qwen_tool():
    load_dotenv()
    openrouter_key = os.getenv("OPENROUTER_API_KEY")
    
    llm = ChatOpenAI(
        api_key=openrouter_key,
        base_url="https://openrouter.ai/api/v1",
        model="qwen/qwen3.7-plus",
        temperature=0,
    )
    
    llm_with_tools = llm.bind_tools([dummy_tool])
    
    messages = [
        HumanMessage(content="What is the result of dummy_tool with 5?")
    ]
    
    print("Testing qwen/qwen3.7-plus with tools on OpenRouter...")
    try:
        res = llm_with_tools.invoke(messages)
        print("Success! Response:", res.content)
        if res.tool_calls:
            print("Tool calls:", res.tool_calls)
    except Exception as e:
        print("Error:", e)

if __name__ == "__main__":
    test_qwen_tool()
