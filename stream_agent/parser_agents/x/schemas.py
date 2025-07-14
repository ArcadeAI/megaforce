from pydantic import BaseModel, Field
from enum import Enum
from common.schemas import DocumentCategory

class OutputSchema(BaseModel):
    post_ids: list[str] = Field(description="The list of post ids in order of best to worst")
    reasoning: str = Field(description="The reasoning for the ranking")
    document_category: list[DocumentCategory] = Field(
        description="The list document categories (tones) of the posts"
    )

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