import asyncio
from datetime import datetime
import megaforce.parser_agents.reddit.agent as reddit_agent
import megaforce.parser_agents.x.agent as x_agent
import megaforce.parser_agents.x.schemas as x_schemas
from megaforce.common.writers import write_documents_to_json
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(name)s] %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)

async def main_reddit():
    logger.info("Getting content for MCP subreddit")

    today = datetime.now().strftime("%Y-%m-%d")
    subreddits_to_process = [
        reddit_agent.InputSchema( subreddit="mcp", time_range="TODAY", limit=100, target_number=10, audience_specification="Deprioritize posts that are obviously marketing oriented, everyone is trying to sell something, we want developer-oriented content instead.",
            subreddit_description=open("stream_agent/input_sources/reddit/mcp/subreddit_info.txt").read(),
        ),
        reddit_agent.InputSchema( subreddit="modelcontextprotocol", time_range="TODAY", limit=100, target_number=10, audience_specification="Deprioritize posts that are obviously marketing oriented, everyone is trying to sell something, we want developer-oriented content instead.",
            subreddit_description=open("stream_agent/input_sources/reddit/mcp/subreddit_info.txt").read(),
        ),
        reddit_agent.InputSchema( subreddit="AgentsOfAI", time_range="TODAY", limit=100, target_number=10, audience_specification="Deprioritize posts that are obviously marketing oriented, everyone is trying to sell something, we want developer-oriented content instead.",
            subreddit_description=open("stream_agent/input_sources/reddit/AgentsOfAI/subreddit_info.txt").read(),
        ),
        reddit_agent.InputSchema( subreddit="Anthropic", time_range="TODAY", limit=100, target_number=10, audience_specification="Deprioritize posts that are obviously marketing oriented, everyone is trying to sell something, we want developer-oriented content instead.",
            subreddit_description=open("stream_agent/input_sources/reddit/Anthropic/subreddit_info.txt").read(),
        ),
        reddit_agent.InputSchema( subreddit="AI_Agents", time_range="TODAY", limit=100, target_number=10, audience_specification="Deprioritize posts that are obviously marketing oriented, everyone is trying to sell something, we want developer-oriented content instead.",
            subreddit_description=open("stream_agent/input_sources/reddit/AI_Agents/subreddit_info.txt").read(),
        ),
        reddit_agent.InputSchema( subreddit="aiagents", time_range="TODAY", limit=100, target_number=10, audience_specification="Deprioritize posts that are obviously marketing oriented, everyone is trying to sell something, we want developer-oriented content instead.",
            subreddit_description=open("stream_agent/input_sources/reddit/aiagents/subreddit_info.txt").read(),
        ),
        reddit_agent.InputSchema( subreddit="agentdevelopmentkit", time_range="TODAY", limit=100, target_number=10, audience_specification="Deprioritize posts that are obviously marketing oriented, everyone is trying to sell something, we want developer-oriented content instead.",
            subreddit_description=open("stream_agent/input_sources/reddit/agentdevelopmentkit/subreddit_info.txt").read(),
        ),
        reddit_agent.InputSchema( subreddit="LLMDevs", time_range="TODAY", limit=100, target_number=10, audience_specification="Deprioritize posts that are obviously marketing oriented, everyone is trying to sell something, we want developer-oriented content instead.",
            subreddit_description=open("stream_agent/input_sources/reddit/LLMDevs/subreddit_info.txt").read(),
        ),
        reddit_agent.InputSchema( subreddit="LangChain", time_range="TODAY", limit=100, target_number=10, audience_specification="Deprioritize posts that are obviously marketing oriented, everyone is trying to sell something, we want developer-oriented content instead.",
            subreddit_description=open("stream_agent/input_sources/reddit/langchain/subreddit_info.txt").read(),
        ),
        reddit_agent.InputSchema( subreddit="PydanticAI", time_range="TODAY", limit=100, target_number=10, audience_specification="Deprioritize posts that are obviously marketing oriented, everyone is trying to sell something, we want developer-oriented content instead.",
            subreddit_description=open("stream_agent/input_sources/reddit/PydanticAI/subreddit_info.txt").read(),
        ),
    ]
    for subreddit in subreddits_to_process[:1]:
        try:
            content = await reddit_agent.get_content(
                parser_agent_config=subreddit
            )
            logger.info(f"Writing content for {subreddit.subreddit} subreddit")
            write_documents_to_json(content, f"output_data/{today}/reddit-{subreddit.subreddit}_content.json")
        except RuntimeError as e:
            logger.error(f"Error getting content for {subreddit.subreddit} subreddit: {e}")

async def main_x():
    logger.info("Getting content for MCP from twitter")

    today = datetime.now().strftime("%Y-%m-%d")
    topics_to_process = [
        x_schemas.InputSchema(search_type=x_schemas.SearchType.KEYWORDS, search_query="mcp", limit=100, target_number=30, audience_specification="Deprioritize tweets that are obviously marketing oriented, everyone is trying to sell something, we want developer-oriented content instead.",),
        x_schemas.InputSchema(search_type=x_schemas.SearchType.USER, search_query="torresmateo", limit=100, target_number=30, audience_specification="Deprioritize tweets that are obviously marketing oriented, everyone is trying to sell something, we want developer-oriented content instead.",),
    ]
    for topic in topics_to_process:
        try:
            content = await x_agent.get_content(
                parser_agent_config=topic
            )
            logger.info(f"Writing content for {topic.search_query} twitter")
            write_documents_to_json(content, f"output_data/{today}/x-{topic.search_query}_content.json")
        except RuntimeError as e:
            logger.error(f"Error getting content for {topic.search_query} twitter: {e}")

if __name__ == "__main__":
    asyncio.run(main_x())