from typing import List
from arcadepy import AsyncArcade
import asyncio


async def auth_tools(
    client: AsyncArcade,
    user_id: str,
    tool_names: List[str],
    provider: str
):
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
        # start auth
        auth_response = await client.auth.start(
            user_id=user_id,
            scopes=list(scopes),
            provider=provider
        )

        # show the url to the user if needed
        if auth_response.status != "completed":
            print(f"Please click here to authorize: {auth_response.url}")
            # Wait for the authorization to complete
            await client.auth.wait_for_completion(auth_response)