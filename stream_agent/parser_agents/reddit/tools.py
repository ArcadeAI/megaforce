from arcadepy import AsyncArcade
from datetime import datetime
import os
from typing import List
from stream_agent.common.schemas import Document, DocumentType, DocumentCategory, ContentType


async def get_top_posts_metadata_in_subreddit(
    client: AsyncArcade,
    subreddit: str,
    time_range: str = "TODAY",
    limit: int = 100,
) -> List[dict]:

    async def get_posts_metadata(cursor: str = None) -> dict:
        tool_input = {
            "subreddit": subreddit,
            "listing": "top",
            "time_range": time_range,
            "limit": limit,
        }

        if cursor is not None:
            tool_input["cursor"] = cursor

        return await client.tools.execute(
            tool_name="Reddit.GetPostsInSubreddit",
            input=tool_input,
            user_id=os.getenv("USER_ID"),
        )

    posts = []

    response = await get_posts_metadata()
    try:
        posts.extend(response.output.value["posts"])
    except TypeError as e:
        print(e)
        print(response)
        exit(1)

    cursor = response.output.value["cursor"]
    while cursor is not None:
        response = await get_posts_metadata(cursor=cursor)
        posts.extend(response.output.value["posts"])
        cursor = response.output.value["cursor"]

    return posts



async def filter_posts(
    posts: List[dict],
    target_number: int = 10
) -> List[dict]:
    """
    Filter posts to only include the top target_number of posts.

    The logic is:
    - only posts that are not videos
    - order by number of comments
    - order by number of upvotes
    - truncate to target_number (if there are more than target_number posts)
    """
    posts = [post for post in posts if not post["is_video"]]
    posts.sort(key=lambda x: x["num_comments"], reverse=True)
    posts.sort(key=lambda x: x["upvotes"], reverse=True)
    return posts[:target_number]


async def expand_posts(
    client: AsyncArcade,
    posts: List[dict]
) -> List[dict]:
    """
    Expand posts to include the full text of the post.
    """

    tool_input = {
        "post_identifiers": [post["id"] for post in posts],
    }

    expanded_posts = await client.tools.execute(
        tool_name="Reddit.GetContentOfMultiplePosts",
        input=tool_input,
        user_id=os.getenv("USER_ID"),
    )

    return expanded_posts.output.value["posts"]


async def translate_items(
    posts: List[dict],
    ordered_ids: List[str],
    document_categories: List[DocumentCategory],
) -> List[Document]:
    """
    Translate posts to documents.
    """
    documents = []
    post_id_to_category = {post_id: category
                           for post_id, category in
                           zip(ordered_ids, document_categories)}

    for post in posts:
        document_category = post_id_to_category[post["id"]]
        documents.append(Document(
            url=f'https://www.reddit.com{post["permalink"]}',
            type=ContentType.REDDIT,
            category=document_category,
            file_type=DocumentType.MARKDOWN,
            title=post["title"],
            author=post["author"],
            date_published=datetime.fromtimestamp(post["created_utc"]),
            content=post["body"],
            metadata={
                "subreddit": post["subreddit"],
                "upvotes": post["upvotes"],
                "num_comments": post["num_comments"],
                "url": post["url"],
            }
        ))
    return documents



