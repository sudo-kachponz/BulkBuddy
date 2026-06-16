from langchain_openai import ChatOpenAI
import os
import logging

logger = logging.getLogger(__name__)

def get_llms(model_name: str="anthropic/claude-sonnet-4.6", temperature=0):
    """
    Helper function to get LLM instance.
    
    Supports multiple model providers:
    - OpenRouter models: Cloud models with tool calling support
    - OpenAI models: Direct OpenAI API access
    
    Args:
        model_name: The name of the model to use
                   - "anthropic/claude-sonnet-4.6" (default) for robust tool calling
                   - "google/gemma-2-9b-it" for Gemma 2 9B via OpenRouter
                   - "google/gemma-2-27b-it" for Gemma 2 27B via OpenRouter
                   - "openai/gpt-4o-mini" for GPT-4o mini via OpenRouter
                   - "anthropic/claude-3-haiku" for Claude Haiku via OpenRouter
                   - "gpt-3.5-turbo", "gpt-4" for direct OpenAI access
        temperature: Temperature setting for the model
        
    Returns:
        A configured LLM instance
    """
    if model_name == "custom-vlm":
        model_name = "anthropic/claude-sonnet-4.6" # fallback to openrouter default

    # OpenRouter models (supports tool calling)
    if "/" in model_name or model_name in ["gemma-2-9b-it", "gemma-2-27b-it"]:
        openrouter_key = os.getenv("OPENROUTER_API_KEY")
        if not openrouter_key:
            raise ValueError("OPENROUTER_API_KEY not found in environment variables.")
        
        print(f"Using OpenRouter model: {model_name}")
        
        # Check if using free model and provide helpful message
        if ":free" in model_name:
            print("💡 Using FREE OpenRouter model")
        
        return ChatOpenAI(
            api_key=openrouter_key,
            base_url=os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1"),
            model=model_name,
            temperature=temperature,
            streaming=True,
            model_kwargs={
                "extra_headers": {
                    "HTTP-Referer": "https://github.com/yourusername/ponzgen",
                    "X-Title": "Ponzgen Agent System"
                }
            }
        )
    
    # Direct OpenAI access
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