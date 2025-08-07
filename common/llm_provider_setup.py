from typing import Optional
from langchain_openai import ChatOpenAI
from langchain_anthropic import ChatAnthropic
from langchain_google_genai import ChatGoogleGenerativeAI

def get_llm(provider: str, model: Optional[str] = None, temperature: float = 0.7, api_key: Optional[str] = None):
    """
    Initializes and returns an LLM client from the specified provider.

    Args:
        provider: The name of the LLM provider (e.g., 'openai', 'anthropic', 'google_genai').
        model: The specific model to use.
        temperature: The sampling temperature for the model.
        api_key: The API key for the provider. If None, the client will
                 look for the corresponding environment variable.

    Returns:
        An instance of the specified LLM client.
    """
    if provider == "openai":
        model_name = model or "gpt-4o-2024-08-06"
        return ChatOpenAI(model=model_name, temperature=temperature, api_key=api_key)
    
    elif provider == "anthropic":
        model_name = model or "claude-3-opus-20240229"
        return ChatAnthropic(model=model_name, temperature=temperature, api_key=api_key)

    elif provider == "google_genai":
        model_name = model or "gemini-1.5-pro-latest"
        return ChatGoogleGenerativeAI(model=model_name, temperature=temperature, api_key=api_key)

    else:
        raise ValueError(f"Unsupported LLM provider: {provider}")
