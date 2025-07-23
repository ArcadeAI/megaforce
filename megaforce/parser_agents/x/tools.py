from arcadepy import AsyncArcade
from datetime import datetime
import os
from typing import List
from megaforce.common.schemas import Document, DocumentType, DocumentCategory, ContentType
from megaforce.parser_agents.x.schemas import SearchType
from pprint import pprint
from time import sleep


def _enrich_tweets(tweets: List[dict], includes: dict) -> List[dict]:
    """
    Enrich tweets with users and other metadata.
    """
    authors_id_to_meta = {
        user["id"]: user for user in includes["users"]
    }
    for tweet in tweets:
        if "author_name" not in tweet:
            if tweet["author_id"] in authors_id_to_meta:
                author_meta = authors_id_to_meta[tweet["author_id"]]
                tweet["author_name"] = author_meta["name"]
                tweet["author_username"] = author_meta["username"]
            else:
                tweet["author_name"] = "Unknown"
                tweet["author_username"] = "Unknown"


async def search_tweets(
    client: AsyncArcade,
    search_type: SearchType,
    search_query: str,
    audience_specification: str,
    limit: int = 100,
) -> List[dict]:

    async def get_tweets_by_keywords(next_token: str = None) -> dict:
        print(f"Getting tweets for {search_query} with next_token {next_token}")
        tool_input = {
            "keywords": [search_query],
            "max_results": 100,
        }

        if next_token is not None:
            tool_input["next_token"] = next_token

        return await client.tools.execute(
            tool_name="X.SearchRecentTweetsByKeywords",
            input=tool_input,
            user_id=os.getenv("USER_ID"),
        )

    async def get_tweets_by_user(next_token: str = None) -> dict:
        print(f"Getting tweets for {search_query} with next_token {next_token}")
        tool_input = {
            "username": search_query,
            "max_results": 100,
        }
        if next_token is not None:
            tool_input["next_token"] = next_token

        return await client.tools.execute(
            tool_name="X.SearchRecentTweetsByUsername",
            input=tool_input,
            user_id=os.getenv("USER_ID"),
        )

    tweets = []
    print(f"Getting tweets for {search_type} {search_query}")

    if search_type == SearchType.KEYWORDS:
        print("Getting tweets by keywords")
        get_tweets = get_tweets_by_keywords
    elif search_type == SearchType.USER:
        print("Getting tweets by user")
        get_tweets = get_tweets_by_user
    else:
        raise ValueError(f"Unsupported search type: {search_type}")

    # TODO(Mateo): Add handlers for other search types
    response = await get_tweets()
    try:
        tweets.extend(response.output.value["data"])
        _enrich_tweets(tweets, response.output.value["includes"])
    except TypeError as e:
        print(e)

    next_token = response.output.value["meta"].get("next_token", None)
    while next_token is not None and len(tweets) < limit:
        sleep(0.5)
        response = await get_tweets(next_token=next_token)
        tweets.extend(response.output.value["data"])
        _enrich_tweets(tweets, response.output.value["includes"])
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


def get_sorted_tweets(
    tweets: List[dict],
    tweet_inferred_metadata: dict,
    target_number: int,
) -> List[str]:
    """
    Get sorted tweet ids based on the inferred metadata.
    """
    sorted_tweets = []
    sorted_metadata = sorted(
        tweet_inferred_metadata.items(),
        key=lambda x: x[1]["score"], reverse=True)
    sorted_ids = [tweet_id for tweet_id, _ in sorted_metadata][:target_number]
    filtered_tweets = [tweet for tweet in tweets if tweet["id"] in sorted_ids]

    for tweet_id in sorted_ids:
        for tweet in filtered_tweets:
            if tweet["id"] == tweet_id:
                sorted_tweets.append(tweet)
                break
    return sorted_tweets

async def translate_items(
    tweets: List[dict],  # filtered tweets (top 10 or something)
    tweet_inferred_metadata: dict,
) -> List[Document]:
    """
    Translate posts to documents.
    """
    documents = []

    for tweet in tweets:
        # document_category = tweet_inferred_metadata[tweet["id"]]["category"]
        document_category = DocumentCategory.CASUAL
        documents.append(Document(
            url=tweet["tweet_url"],
            type=ContentType.TWITTER,
            category=document_category,
            file_type=DocumentType.TXT,
            title=f'tweet by {tweet["author_name"]}',
            author=tweet["author_username"],
            content=tweet["text"],
        ))
    return documents