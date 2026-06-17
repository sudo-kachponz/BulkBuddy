from langchain_openai import ChatOpenAI
import os
import logging

logger = logging.getLogger(__name__)

def get_llms(model_name: str="qwen3.7-plus", temperature=0):
    """
    Helper function to get LLM instance.
    
    Supports multiple model providers:
    - OpenRouter models: Cloud models with tool calling support
    - OpenAI models: Direct OpenAI API access
    - DashScope models: Alibaba Cloud Qwen models
    """
    if model_name == "custom-vlm":
        model_name = "qwen/qwen3.7-plus" # fallback to OpenRouter default

    # 1. OpenRouter Models (Primary)
    if "qwen" in model_name.lower() or "/" in model_name:
        openrouter_key = os.getenv("OPENROUTER_API_KEY")
        if not openrouter_key:
            raise ValueError("OPENROUTER_API_KEY not found in environment variables.")
        
        print(f"Using OpenRouter model: {model_name}")
        
        return ChatOpenAI(
            api_key=openrouter_key,
            base_url=os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1"),
            model=model_name,
            temperature=temperature,
            streaming=True,
            model_kwargs={
                "extra_headers": {
                    "HTTP-Referer": "https://github.com/sudo-kachponz/BulkBuddy",
                    "X-Title": "BulkBuddy Agent System"
                }
            }
        )

    # 2. Direct OpenAI access
    elif model_name.startswith("gpt-"):
        openai_key = os.getenv("OPENAI_API_KEY")
        if not openai_key:
            raise ValueError("OPENAI_API_KEY not found in environment variables.")
        
        print(f"Using OpenAI model: {model_name}")
        return ChatOpenAI(
            api_key=openai_key,
            model=model_name,
            temperature=temperature,
            streaming=True
        )
    
    else:
        raise ValueError(f"Unknown model: {model_name}")