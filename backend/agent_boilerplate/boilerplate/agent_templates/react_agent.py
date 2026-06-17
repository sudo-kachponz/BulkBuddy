from langgraph.prebuilt import create_react_agent
from langchain_core.messages import SystemMessage
import sys
import os

# Fix the import path
from ..utils.get_llms import get_llms

def get_react_agent(model_name="custom-vlm", temperature=0, langchain_tools=[], memory=None):
    """
    Create a ReAct agent with the specified model, tools, and memory.
    
    Args:
        model_name: The name of the LLM to use
        temperature: The temperature setting for the model (0-1)
        langchain_tools: List of LangChain tools to provide to the agent
        memory: Memory instance for maintaining conversation state
        
    Returns:
        A configured ReAct agent
    """
    # model_name = "anthropic/claude-sonnet-4.6" # for tools, one of the most general model
    model = get_llms(model_name, temperature)
    
    def state_modifier(state):
        messages = state["messages"]
        # Sliding Window: Keep only the last 10 messages to save tokens
        truncated_messages = messages[-10:] if len(messages) > 10 else messages
        
        # Compressed System Prompt
        content = "You are a helpful AI assistant."
        if langchain_tools:
            content += "\n- ALWAYS use tools immediately when requested. DO NOT describe intent.\n- Format output clearly and concisely."
            
        # Ephemeral Prompt Caching for Anthropic
        system_message = SystemMessage(
            content=content,
            additional_kwargs={"cache_control": {"type": "ephemeral"}}
        )
        return [system_message] + truncated_messages
    
    return create_react_agent(model, langchain_tools, checkpointer=memory, state_modifier=state_modifier)
# Example usage
if __name__ == "__main__":
    from langgraph.checkpoint.memory import MemorySaver
    
    # Create memory and agent
    memory = MemorySaver()
    agent = get_react_agent(model_name="custom-vlm", memory=memory)
    
    # First interaction
    query = "My name is firania"
    config = {'thread_id': "1"}
    try:
        response = agent.invoke({"messages": query}, {"configurable": config})
        ai_message = response['messages'][-1].content
        print(ai_message)
    except Exception as e:
        print(f"Error: {e}")
    
    # Follow up question (demonstrates memory persistence)
    query = "What is my name?"
    config = {'thread_id': "1"}
    try:
        response = agent.invoke({"messages": query}, {"configurable": config})
        ai_message = response['messages'][-1].content
        print(ai_message)
    except Exception as e:
        print(f"Error: {e}")