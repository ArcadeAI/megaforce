from megaforce.common.partials import DOCUMENT_CATEGORY_PARTIAL
from megaforce.common.schemas import Document
from megaforce.common.utils import auth_tools
from megaforce.common.llm_provider_setup import get_llm
from megaforce.parser_agents.x.schemas import (InputSchema, create_scoring_schema,
                                               SearchType, extract_results_from_dynamic_response)
from megaforce.parser_agents.x.tools import search_tweets, translate_items, get_sorted_tweets
import os
from typing import List
from arcadepy import AsyncArcade
from dotenv import load_dotenv
import logging

logger = logging.getLogger(__name__)

load_dotenv()

async def get_content(parser_agent_config: InputSchema) -> List[Document]:
    client = AsyncArcade()
    await auth_tools(
        client=client,
        user_id=os.getenv("USER_ID"),
        tool_names=["X.SearchRecentTweetsByKeywords", "X.SearchRecentTweetsByUsername"],
        provider="x"
    )

    logger.info(f"Getting top tweets for {parser_agent_config.search_query}")
    tweets = await search_tweets(
        client=client,
        search_type=parser_agent_config.search_type,
        search_query=parser_agent_config.search_query,
        audience_specification=parser_agent_config.audience_specification,
        limit=parser_agent_config.limit,
    )

    if not parser_agent_config.rank_tweets:
        return await translate_items(
            tweets=tweets,
        )

    search_type_entity = parser_agent_config.search_type.value

    match parser_agent_config.search_type:
        case SearchType.KEYWORDS:
            search_type_instructions = """
            You will be given a topic and a list of tweets from the topic.

            The topic is "{topic}".

            Here are 10 tweets from the topic.
            """

        case SearchType.USER:
            search_type_instructions = """
            You will be given a user and a list of tweets from the user.

            The user is "{user}".

            Here are 10 tweets from this user.
            """
        case _:
            raise ValueError(f"Unsupported search type: {parser_agent_config.search_type}")

    system_prompt_template = """
You are a helpful assistant that is an expert in identifying the BEST tweets from any {search_type_entity}.
Your job is to rank the tweets from best to worst.
The best tweet is the one that you think will get the most engagement (comments, upvotes, etc.).
{audience_specification}
Deprioritize tweets that are obviously spam.

{partials}

{search_type_instructions}

<tweets>
{tweets}
</tweets>
    """

    few_shot_template = """
<tweet>
<id>{id}</id>
<author>{author}</author>
<text>{text}</text>
</tweet>
    """

    few_shot_examples = []
    for tweet in tweets:
        few_shot_examples.append(
            few_shot_template.format(
                id=tweet['id'],
                author=tweet['author_name'],
                text=tweet['text']))

    few_shot_examples = "\n".join(few_shot_examples)

    partials = DOCUMENT_CATEGORY_PARTIAL

    system_prompt = system_prompt_template.format(
        search_type_entity=search_type_entity,
        audience_specification=parser_agent_config.audience_specification,
        partials=partials,
        search_type_instructions=search_type_instructions,
        tweets=few_shot_examples)

    agent = get_llm(
        provider=os.getenv("LLM_PROVIDER", "openai"),
        model=os.getenv("LLM_MODEL", "gpt-4o-2024-08-06"),
    )

    scoring_schema = create_scoring_schema(tweets)

    agent = agent.with_structured_output(scoring_schema)

    logger.info("Invoking agent...")
    ids_before = [tweet["id"] for tweet in tweets]
    logger.info(f"IDs before: {ids_before}")
    response = agent.invoke([{"role": "system", "content": system_prompt}])

    tweet_inferred_metadata = extract_results_from_dynamic_response(response, tweets)
    sorted_tweets = get_sorted_tweets(tweets, tweet_inferred_metadata, parser_agent_config.target_number)

    logger.info("Translating posts...")
    return await translate_items(
        tweets=sorted_tweets,
        tweet_inferred_metadata=tweet_inferred_metadata
    )
