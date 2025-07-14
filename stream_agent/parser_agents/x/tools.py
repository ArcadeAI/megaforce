from arcadepy import AsyncArcade
from datetime import datetime
import os
from typing import List
from common.schemas import Document, DocumentType, DocumentCategory, ContentType
from parser_agents.x.schemas import SearchType
from pprint import pprint
from time import sleep

async def search_tweets(
    client: AsyncArcade,
    search_type: SearchType,
    search_query: str,
    audience_specification: str,
    limit: int = 100,
    target_number: int = 300,
) -> List[dict]:

    async def get_tweets(next_token: str = None) -> dict:
        print(f"Getting tweets for {search_query} with next_token {next_token}")
        tool_input = {
            "keywords": [search_query],
            "max_results": limit,
        }

        if next_token is not None:
            tool_input["next_token"] = next_token

        return await client.tools.execute(
            tool_name="X.SearchRecentTweetsByKeywords",
            input=tool_input,
            user_id=os.getenv("USER_ID"),
        )

    tweets = []

    response = await get_tweets()
    try:
        tweets.extend(response.output.value["data"])
    except TypeError as e:
        print(e)
        print(response)
        exit(1)

    next_token = response.output.value["meta"]["next_token"]
    while next_token is not None and len(tweets) < target_number:
        sleep(1)
        response = await get_tweets(next_token=next_token)
        pprint(response)
        tweets.extend(response.output.value["data"])
        next_token = response.output.value["meta"]["next_token"]

    return tweets



async def filter_tweets(
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