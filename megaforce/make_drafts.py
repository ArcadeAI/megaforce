from megaforce.common.schemas import StyleTransferRequest, Document, OutputSchema, OutputType, ReferenceStyle
from megaforce.style_agent.agent import generate_related_content
from megaforce.common.utils import load_documents_from_json
import json
from pathlib import Path
from typing import List
import asyncio

async def generate_and_print_single(request: StyleTransferRequest):
    out = f"Generating related content for {request.target_content}\n"
    responses = await generate_related_content(request, "openai", "gpt-4o-mini")
    for i, response in enumerate(responses):
        out += f"Tweet {i}: {response.content}\n"
    print(out)


async def main():
    style_documents_file = Path(__file__).parent / "output_data" / "2025-07-23" / "x-torresmateo_content.json"
    style_documents = load_documents_from_json(style_documents_file)

    reference_style = ReferenceStyle(
        name="Tweet's by torresmateo",
        documents=style_documents,
        description="Tweets by torresmateo, a developer who is interested in the future of AI",
        confidence=0.9,
        categories=["AI", "Developer", "Tech", "AI", "Twitter"],
    )

    output_schemas = [
        OutputSchema(
            name="tweet_single_agreeing",
            format="text",
            output_type=OutputType.TWEET_SINGLE,
            description="An opinionated tweet agreeing with the target content",
            max_length=280,
            min_length=100,
            platform="Twitter"
        ),
        OutputSchema(
            name="tweet_single_disagreeing",
            format="text",
            output_type=OutputType.TWEET_SINGLE,
            description="An opinionated tweet disagreeing with the target content",
            max_length=280,
            min_length=100,
            platform="Twitter"
        ),
        OutputSchema(
            name="tweet_single_neutral",
            format="text",
            output_type=OutputType.TWEET_SINGLE,
            description="An opinionated tweet neutral to the target content",
            max_length=280,
            min_length=100,
            platform="Twitter"
        ),
    ]

    documents_file = Path(__file__).parent / "output_data" / "2025-07-23" / "x-mcp_content.json"
    tweets = load_documents_from_json(documents_file)
    for tweet in tweets[:5]:
        r = StyleTransferRequest(
            reference_style=[reference_style],
            intent="Make a tweet that is a response to the target content, absolutely no marketing or sales oriented tweets",
            focus="Focus on the technical aspects of the content and the implications for the future of the AI industry",
            target_content=[tweet],
            target_schemas=output_schemas,
        )
        await generate_and_print_single(r)


if __name__ == "__main__":
    asyncio.run(main())