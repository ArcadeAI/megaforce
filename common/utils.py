from typing import List
from pydantic import TypeAdapter
from arcadepy import AsyncArcade
import asyncio
import json
import os
from pathlib import Path
from common.schemas import Document


async def auth_tools(
    client: AsyncArcade,
    user_id: str = None,
    tool_names: List[str] = None,
    provider: str = None,
    key: str = None
):
    # Use provided parameters or fall back to environment variables
    user_id = user_id or os.getenv("ARCADE_USER_ID") or os.getenv("USER_ID")
    provider = provider or "x"
    
    if not user_id:
        raise ValueError("user_id must be provided either as parameter or ARCADE_USER_ID/USER_ID environment variable")
    
    # Ensure user_id is a string (Arcade API requires string type)
    user_id = str(user_id)
    # collect the scopes for every tool I want to use
    tools = []
    if tool_names:
        tasks = [client.tools.get(name=tool_id) for tool_id in tool_names]
        responses = await asyncio.gather(*tasks)
        for response in responses:
            tools.append(response)

    # collect the scopes
    # TODO(Mateo): Providers can be inferred here, no need for provider parameter
    provider_to_scopes = {}
    for tool in tools:
        if tool.requirements.authorization.oauth2.scopes:
            provider = tool.requirements.authorization.provider_id
            if provider not in provider_to_scopes:
                provider_to_scopes[provider] = set()
            provider_to_scopes[provider] |= set(tool.requirements.authorization.oauth2.scopes)

    for provider, scopes in provider_to_scopes.items():
        print(f"🔐 Starting auth for provider: {provider} with scopes: {scopes}")
        print(f"🆔 Using user_id: {user_id}")
        
        # start auth
        auth_response = await client.auth.start(
            user_id=user_id,
            scopes=list(scopes),
            provider=provider
        )
        
        print(f"📋 Auth response status: {auth_response.status}")

        # show the url to the user if needed
        if auth_response.status != "completed":
            print(f"🔗 Please click here to authorize: {auth_response.url}")
            print(f"⏳ Waiting for authorization completion...")
            
            try:
                # Wait for the authorization to complete with timeout
                await asyncio.wait_for(
                    client.auth.wait_for_completion(auth_response),
                    timeout=300  # 5 minute timeout
                )
                print(f"✅ Authorization completed for provider: {provider}")
            except asyncio.TimeoutError:
                print(f"⚠️  Authorization timed out after 5 minutes")
                print(f"🔄 Please try again or check if authorization was completed")
                raise
            except Exception as e:
                print(f"⚠️  Authorization error: {e}")
                raise
        else:
            print(f"✅ Already authorized for provider: {provider}")


def load_documents_from_json(file_path: Path) -> List[Document]:
    with file_path.open("r") as f:
        data = json.load(f)
        return TypeAdapter(List[Document]).validate_python(data)