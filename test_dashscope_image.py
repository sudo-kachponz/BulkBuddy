import os
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage
import sys

def test_dashscope_image():
    load_dotenv()
    dashscope_key = os.getenv("DASHSCOPE_API_KEY")
        
    # 20x20 transparent GIF base64
    b64_image = "data:image/gif;base64,R0lGODlhFAAUAIAAAP///wAAACH5BAEAAAAALAAAAAAUABQAAAIRhI+py+0Po5y02ouz3rz7rxUAOw=="
    
    messages = [
        HumanMessage(content=[
            {"type": "text", "text": "Describe this image:"},
            {"type": "image_url", "image_url": {"url": b64_image}}
        ])
    ]
    
    print("Testing qwen3.7-plus with image...")
    llm = ChatOpenAI(
        api_key=dashscope_key,
        base_url="https://dashscope-intl.aliyuncs.com/compatible-mode/v1",
        model="qwen3.7-plus",
        temperature=0,
    )
    try:
        res = llm.invoke(messages)
        print("Success qwen3.7-plus! Response:", res.content)
    except Exception as e:
        print("Error with qwen3.7-plus:", e)
        
    print("\nTesting qwen-vl-plus with image...")
    llm_vl = ChatOpenAI(
        api_key=dashscope_key,
        base_url="https://dashscope-intl.aliyuncs.com/compatible-mode/v1",
        model="qwen-vl-plus",
        temperature=0
    )
    try:
        res = llm_vl.invoke(messages)
        print("Success qwen-vl-plus! Response:", res.content)
    except Exception as e:
        print("Error with qwen-vl-plus:", e)

if __name__ == "__main__":
    test_dashscope_image()
