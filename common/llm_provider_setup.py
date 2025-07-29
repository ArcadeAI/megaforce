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

"""LLM provider setup and configuration using LangChain model factories."""

from typing import Optional

from dotenv import load_dotenv
from langchain.chat_models import init_chat_model

# Load environment variables from .env file
load_dotenv()


def get_llm(provider: str, model: Optional[str] = None, temperature: float = 0.7):
    """Get the appropriate LLM instance using LangChain's model factory.

    Args:
        provider: Model provider (openai, anthropic, google_genai)
        model: Model name. If None, will use provider defaults.
        temperature: Model temperature (0.0 to 1.0). Defaults to 0.7.

    Returns:
        ChatModel instance
    """

    # Set default models for each provider if not specified
    if model is None:
        default_models = {
            "openai": "gpt-3.5-turbo",
            "anthropic": "claude-3-haiku-20240307",
            "google_genai": "gemini-1.5-flash",
        }
        model = default_models.get(provider)

    # Use LangChain's model factory with automatic provider inference
    # The factory will handle API key loading automatically from environment variables
    return init_chat_model(
        model=model, model_provider=provider, temperature=temperature
    )