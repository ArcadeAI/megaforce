from stream_agent.common.partials import DOCUMENT_CATEGORY_PARTIAL
from stream_agent.common.schemas import Document, DocumentCategory
from stream_agent.common.utils import auth_tools
from stream_agent.common.llm_provider_setup import get_llm
from stream_agent.parser_agents.reddit.tools import (
    get_top_posts_metadata_in_subreddit,
    filter_posts, expand_posts, translate_items)
import os
from pydantic import BaseModel, Field, field_validator, model_validator, create_model
from typing import List, Dict, Any
from arcadepy import AsyncArcade
from dotenv import load_dotenv
import logging

logger = logging.getLogger(__name__)

load_dotenv()

class InputSchema(BaseModel):
    subreddit: str = Field(description="The subreddit to get content from")
    time_range: str = Field(description="The time range to get content from")
    limit: int = Field(description="The number of posts to get")
    target_number: int = Field(description="The number of posts to return")
    audience_specification: str = Field(description="The audience specification")
    subreddit_description: str = Field(description="The description of the subreddit")

def create_ranking_schema(post_ids: List[str]) -> type:
    """
    Create a dynamic Pydantic model where each post ID is a field name.
    This prevents ID hallucination since the LLM can only fill in values for pre-defined fields.
    """
    # Create fields dictionary for create_model
    fields = {}

    # Add rationale field
    fields['rationale'] = (str, Field(description="The reasoning for the ranking"))

    # Add ranking field for each post ID
    for post_id in post_ids:
        # Use post_id as field name, with ranking as value
        fields[f'post_{post_id}'] = (
            int,
            Field(
                description=f"The ranking for post {post_id} (1=best, {len(post_ids)}=worst)",
                ge=1,
                le=len(post_ids)
            )
        )

    # Add document category field for each post ID
    for post_id in post_ids:
        fields[f'category_{post_id}'] = (
            DocumentCategory,
            Field(description=f"The document category for post {post_id}")
        )

    @model_validator(mode='after')
    def validate_unique_rankings(cls, values):
        """Ensure all rankings are unique"""
        # Extract ranking values
        ranking_fields = [f'post_{post_id}' for post_id in post_ids]
        rankings = [getattr(values, field) for field in ranking_fields if hasattr(values, field)]

        if len(rankings) != len(set(rankings)):
            raise ValueError("All post rankings must be unique")

        # Check that we have exactly the expected range
        expected_ranks = set(range(1, len(post_ids) + 1))
        actual_ranks = set(rankings)
        if len(rankings) == len(post_ids) and expected_ranks != actual_ranks:
            raise ValueError(f"Rankings must be exactly {expected_ranks}, got {actual_ranks}")

        return values

    # Create the dynamic model
    DynamicRankingSchema = create_model(
        'DynamicRankingSchema',
        **fields,
        __validators__={'validate_unique_rankings': validate_unique_rankings}
    )

    return DynamicRankingSchema

def extract_results_from_dynamic_response(response: Any, post_ids: List[str]) -> tuple:
    """Extract ordered post IDs and categories from dynamic response"""
    # Extract rankings
    rankings = []
    for post_id in post_ids:
        field_name = f'post_{post_id}'
        rank = getattr(response, field_name)
        rankings.append((post_id, rank))

    # Sort by rank to get ordered IDs
    rankings.sort(key=lambda x: x[1])
    ordered_ids = [post_id for post_id, _ in rankings]

    # Extract categories in the same order
    document_categories = []
    for post_id in ordered_ids:
        field_name = f'category_{post_id}'
        category = getattr(response, field_name)
        document_categories.append(category)

    return ordered_ids, document_categories

async def get_content(parser_agent_config: InputSchema) -> List[Document]:
    client = AsyncArcade()
    await auth_tools(
        client=client,
        user_id=os.getenv("USER_ID"),
        tool_names=["Reddit.GetContentOfMultiplePosts",
                    "Reddit.GetPostsInSubreddit"],
        provider="reddit"
    )

    logger.info(f"Getting top posts metadata in subreddit {parser_agent_config.subreddit}")
    posts = await get_top_posts_metadata_in_subreddit(
        client=client,
        subreddit=parser_agent_config.subreddit,
        time_range=parser_agent_config.time_range,
        limit=parser_agent_config.limit
    )
    posts = await filter_posts(
        posts=posts,
        target_number=parser_agent_config.target_number
    )

    logger.info("Expanding posts...")
    posts = await expand_posts(
        client=client,
        posts=posts
    )

    subreddit = parser_agent_config.subreddit
    subreddit_description = parser_agent_config.subreddit_description
    post_ids = [post['id'] for post in posts]

    # Create field descriptions for the system prompt
    ranking_fields_desc = []
    category_fields_desc = []

    for post_id in post_ids:
        ranking_fields_desc.append(f"- post_{post_id}: The ranking (1-{len(post_ids)}) for post {post_id}")
        category_fields_desc.append(f"- category_{post_id}: The document category for post {post_id}")

    ranking_fields_text = "\n".join(ranking_fields_desc)
    category_fields_text = "\n".join(category_fields_desc)

    system_prompt_template = """
    You are a helpful assistant that is an expert in identifying the BEST Reddit posts from any subreddit.
    Your job is to rank the posts from best to worst.
    The best post is the one that you think will get the most engagement (comments, upvotes, etc.).
    {audience_specification}
    Deprioritize posts that are obviously spam.

    {partials}

    You will be given a subreddit and a list of posts from the subreddit.

    The subreddit is "{subreddit}".

    A detailed description of the subreddit is provided below.

    <subreddit_description>
    {subreddit_description}
    </subreddit_description>

    Here are {num_posts} posts from the subreddit.

    <posts>
    {posts}
    </posts>

    IMPORTANT: You must rank ALL posts by assigning unique ranks from 1 to {num_posts}.
    - Rank 1 = best post (most likely to get engagement)
    - Rank {num_posts} = worst post (least likely to get engagement)
    - Each post must have a unique rank

    You must fill in the following fields:
    - rationale: Your reasoning for the ranking

    Ranking fields (each must be a unique integer from 1 to {num_posts}):
    {ranking_fields}

    Category fields (each must be a valid DocumentCategory):
    {category_fields}
    """

    few_shot_template = """
    <post>
    <id>
    {id}
    </id>
    <title>
    {title}
    </title>
    <body>
    {body}
    </body>
    </post>
    """

    few_shot_examples = []
    for post in posts:
        few_shot_examples.append(
            few_shot_template.format(
                id=post['id'],
                title=post['title'],
                body=post['body']))

    few_shot_examples = "\n".join(few_shot_examples)

    partials = DOCUMENT_CATEGORY_PARTIAL

    system_prompt = system_prompt_template.format(
        subreddit=subreddit,
        audience_specification=parser_agent_config.audience_specification,
        partials=partials,
        subreddit_description=subreddit_description,
        posts=few_shot_examples,
        num_posts=len(posts),
        ranking_fields=ranking_fields_text,
        category_fields=category_fields_text
    )

    # Create dynamic schema with post IDs as field names
    DynamicRankingSchema = create_ranking_schema(post_ids)

    agent = get_llm(
        provider=os.getenv("LLM_PROVIDER", "openai"),
        model=os.getenv("LLM_MODEL", "gpt-4o-2024-08-06"),
    )
    agent = agent.with_structured_output(DynamicRankingSchema)

    logger.info("Invoking agent...")
    ids_before = [post["id"] for post in posts]
    logger.info(f"IDs before: {ids_before}")

    response = agent.invoke([{"role": "system", "content": system_prompt}])

    logger.info(f"Response received: {response}")

    # Extract ordered IDs and categories from dynamic response
    ordered_ids, document_categories = extract_results_from_dynamic_response(response, post_ids)

    logger.info(f"IDs after: {ordered_ids}")

    # This validation is now redundant but keeping for safety
    if set(ids_before) != set(ordered_ids):
        logger.warning("IDs before and after are different, this is not expected")
        logger.warning(f"IDs before: {ids_before}")
        logger.warning(f"IDs after: {ordered_ids}")
        logger.warning("This is not expected, please investigate")
        raise RuntimeError("IDs before and after are different, this is not expected")

    logger.info("Translating posts...")
    return await translate_items(
        posts=posts,
        ordered_ids=ordered_ids,
        document_categories=document_categories
    )
