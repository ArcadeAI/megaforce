from arcadepy import AsyncArcade
import os
from typing import List
from megaforce.common.schemas import Document, DocumentType, DocumentCategory, ContentType
import logging

logger = logging.getLogger(__name__)


async def get_url_content(
    client: AsyncArcade | None = None,
    url: str = "",
) -> Document:

    if client is None:
        from dotenv import load_dotenv
        load_dotenv()
        client = AsyncArcade()

    print(f"Getting tweets for {url}")
    tool_input = {
        "url": url,
    }

    response = await client.tools.execute(
        tool_name="Firecrawl.ScrapeUrl",
        input=tool_input,
        user_id=os.getenv("USER_ID"),
    )

    logger.info(f"Raw response: {response}")

    document = Document(
        url=url,
        type=ContentType.URL,
        category=DocumentCategory.CASUAL,
        file_type=DocumentType.MARKDOWN,
        content=response.output.value["markdown"],
    )
    return document



