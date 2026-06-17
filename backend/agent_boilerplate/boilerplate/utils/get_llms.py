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
        model_name = "qwen3.7-plus" # fallback to dashscope default

    # 1. DashScope (Alibaba Qwen) Models
    if "qwen" in model_name.lower():
        dashscope_key = os.getenv("DASHSCOPE_API_KEY")
        if not dashscope_key:
            raise ValueError("DASHSCOPE_API_KEY not found in environment variables.")
        
        print(f"Using DashScope model: {model_name}")
        
        kwargs = {
            "api_key": dashscope_key,
            "base_url": "https://dashscope-intl.aliyuncs.com/compatible-mode/v1",
            "model": model_name,
            "temperature": temperature,
            "streaming": True,
        }
        
        # Only enable thinking mode for non-VL qwen models (e.g. qwen3.7-plus)
        if "-vl-" not in model_name.lower():
            kwargs["model_kwargs"] = {"extra_body": {"enable_thinking": True}}
            
        return ChatOpenAI(**kwargs)

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