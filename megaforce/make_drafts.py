from megaforce.common.schemas import StyleTransferRequest, Document, OutputSchema, OutputType
from megaforce.style_agent.agent import generate_related_content
import json
from pathlib import Path
from typing import List
import asyncio

def load_documents(documents_file: Path) -> List[Document]:
    with open(documents_file, "r") as f:
        request = json.load(f)
    docs = []
    for document in request:
        docs.append(Document(**document))
    return docs


async def generate_and_print_single(request: StyleTransferRequest):
    out = f"Generating related content for {request.target_content}\n"
    responses = await generate_related_content(request, "openai", "gpt-4o-mini")
    for i, response in enumerate(responses):
        out += f"Tweet {i}: {response.content}\n"
    print(out)


async def main():
    request_file = Path(__file__).parent / "agent_style_transfer" / "fixtures" / "document-based-request.json"
    with open(request_file, "r") as f:
        request = json.load(f)

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

    documents_file = Path(__file__).parent / "output_data" / "2025-07-22" / "x-mcp_content.json"
    tweets = load_documents(documents_file)
    for tweet in tweets[:5]:
        r = StyleTransferRequest(**request)
        print(r.focus)
        r.target_schemas.extend(output_schemas)
        r.target_content = [tweet]
        await generate_and_print_single(r)


if __name__ == "__main__":
    asyncio.run(main())