from stream_agent.common.partials import DOCUMENT_CATEGORY_PARTIAL
from stream_agent.common.schemas import Document
from stream_agent.common.utils import auth_tools
from stream_agent.common.llm_provider_setup import get_llm
from stream_agent.parser_agents.x.schemas import InputSchema, OutputSchema
from stream_agent.parser_agents.x.tools import search_tweets
import os
from typing import List
from arcadepy import AsyncArcade
from dotenv import load_dotenv
import logging
from pprint import pprint

logger = logging.getLogger(__name__)

load_dotenv()

async def get_content(parser_agent_config: InputSchema) -> List[Document]:
    client = AsyncArcade()
    await auth_tools(
        client=client,
        user_id=os.getenv("USER_ID"),
        tool_names=["X.SearchRecentTweetsByKeywords"],
        provider="x"
    )

    logger.info(f"Getting top tweets for {parser_agent_config.search_query}")
    tweets = await search_tweets(
        client=client,
        search_type=parser_agent_config.search_type,
        search_query=parser_agent_config.search_query,
        audience_specification=parser_agent_config.audience_specification,
        limit=parser_agent_config.limit,
        target_number=parser_agent_config.target_number
    )

    pprint(tweets)
    print(f"Number of tweets: {len(tweets)}")
    exit(1)

    subreddit = parser_agent_config.subreddit
    subreddit_description = parser_agent_config.subreddit_description

    system_prompt_template = """
    You are a helpful assistant that is an expert in identifying the BEST tweets from any topic.
    Your job is to rank the tweets from best to worst.
    The best tweet is the one that you think will get the most engagement (comments, upvotes, etc.).
    {audience_specification}
    Deprioritize tweets that are obviously spam.

    {partials}

    You will be given a topic and a list of tweets from the topic.

    The topic is "{topic}".

    A detailed description of the topic is provided below.

    <topic_description>
    {topic_description}
    </topic_description>

    Here are 10 tweets from the topic.

    <tweets>
    {tweets}
    </tweets>

    """

    few_shot_template = """
    <tweet>
    <id>
    {id}
    </id>
    <title>
    {title}
    </title>
    <body>
    {body}
    </body>
    </tweet>
    """

    few_shot_examples = []
    for tweet in tweets:
        few_shot_examples.append(
            few_shot_template.format(
                id=tweet['id'],
                title=tweet['title'],
                body=tweet['body']))

    few_shot_examples = "\n".join(few_shot_examples)

    partials = DOCUMENT_CATEGORY_PARTIAL

    system_prompt = system_prompt_template.format(
        subreddit=subreddit,
        audience_specification=parser_agent_config.audience_specification,
        partials=partials,
        subreddit_description=subreddit_description,
        posts=few_shot_examples)

    agent = get_llm(
        provider=os.getenv("LLM_PROVIDER", "openai"),
        model=os.getenv("LLM_MODEL", "gpt-4o-2024-08-06"),
    )
    agent = agent.with_structured_output(OutputSchema)

    logger.info("Invoking agent...")
    ids_before = [post["id"] for post in posts]
    logger.info(f"IDs before: {ids_before}")
    response = agent.invoke([{"role": "system", "content": system_prompt}])

    logger.info(f"IDs after: {response.post_ids}")
    if set(ids_before) != set(response.post_ids):
        logger.warning("IDs before and after are different, this is not expected")
        logger.warning(f"IDs before: {ids_before}")
        logger.warning(f"IDs after: {response.post_ids}")
        logger.warning("This is not expected, please investigate")
        raise RuntimeError("IDs before and after are different, this is not expected")

    logger.info("Translating posts...")
    return await translate_items(
        posts=posts,
        ordered_ids=response.post_ids,
        document_categories=response.document_category
    )
