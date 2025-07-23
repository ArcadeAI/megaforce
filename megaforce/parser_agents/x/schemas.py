from pydantic import BaseModel, Field, create_model
from enum import Enum
# from megaforce.common.schemas import DocumentCategory
from typing import List, Any

class SearchType(Enum):
    KEYWORDS = "keywords"
    PHRASES = "phrases"
    HASHTAG = "hashtag"
    USER = "user"


class InputSchema(BaseModel):
    search_type: SearchType = Field(description="The type of search to perform")
    # TODO(Mateo): This could be a list of queries
    search_query: str = Field(description="The search query to perform")
    limit: int = Field(description="The number of tweets to get")
    target_number: int = Field(description="The number of tweets to rank")
    audience_specification: str = Field(description="The audience specification")


def create_scoring_schema(
    tweets: List[str],
    low_score_description: str = "Not relevant or engaging",
    high_score_description: str = "Super relevant and likely to be viral",
    ) -> type:
    """
    Create a dynamic Pydantic model where each tweet is a field name.
    This prevents ID hallucination since the LLM can only fill in values for pre-defined fields.
    """
    fields = {}
    for tweet in tweets:
        fields[f'tweet_{tweet["id"]}'] = (
            float,
            Field(
                description=f"The relevance score for tweet {tweet['id']} (0={low_score_description}, 100={high_score_description})",
                ge=0.0,
                le=100.0
            )
        )
        # TODO(Mateo): Add a field for the document category. Note: OpenAI supports up to 1000 enum values for all fields combined.
        # fields[f'category_{tweet["id"]}'] = (
        #     DocumentCategory,
        #     Field(description=f"The document category for tweet {tweet['id']}")
        # )

    DynamicScoringSchema = create_model("DynamicScoringSchema", **fields)

    return DynamicScoringSchema


def extract_results_from_dynamic_response(response: Any, tweets: List[str]) -> tuple:
    """Extract ordered post IDs and categories from dynamic response"""
    tweet_inferred_metadata = {}
    for tweet in tweets:
        if tweet["id"] not in tweet_inferred_metadata:
            tweet_inferred_metadata[tweet["id"]] = {}
        field_name = f'tweet_{tweet["id"]}'
        score = getattr(response, field_name)
        tweet_inferred_metadata[tweet["id"]]["score"] = score

        # field_name = f'category_{tweet["id"]}'
        # category = getattr(response, field_name)
        # tweet_inferred_metadata[tweet["id"]]["category"] = category

    return tweet_inferred_metadata