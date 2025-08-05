from megaforce.common.utils import load_documents_from_json, auth_tools
from megaforce.common.schemas import (
    Document, DocumentCategory, ContentType, OutputSchema, OutputType,
    StyleTransferRequest, ContentGenerationResponse, ReferenceStyle,
)
from megaforce.style_agent.agent import generate_related_content
from pathlib import Path
from textual.app import App, ComposeResult
from textual.containers import Container, VerticalScroll, Horizontal, Vertical
from textual.widgets import Header, Static, Button, TextArea, ListView, ListItem
from textual_datepicker import DateSelect
from datetime import datetime, timedelta
from arcadepy import Arcade
from dotenv import load_dotenv
from megaforce.experiments.scheduler import Scheduler


load_dotenv()
client = Arcade()
USER_ID = "mateo@arcade.dev"
scheduler = Scheduler()
scheduler.start()
style_documents_file = Path(__file__).parent / "output_data" / "2025-07-23" / "x-torresmateo_content.json"
style_documents = load_documents_from_json(style_documents_file)
reference_style = ReferenceStyle(
    name="Tweet's by torresmateo",
    documents=style_documents,
    description="Tweets by torresmateo, a developer who is interested in the future of AI",
    confidence=0.9,
    categories=["AI", "Developer", "Tech", "AI", "Twitter"],
)

output_schemas = [
    OutputSchema(
        name="tweet_single_agreeing",
        format="text",
        output_type=OutputType.TWEET_SINGLE,
        description="An opinionated tweet agreeing with the target content",
        max_length=280,
        min_length=100,
        platform="Twitter"
    ),
    OutputSchema(
        name="tweet_single_disagreeing",
        format="text",
        output_type=OutputType.TWEET_SINGLE,
        description="An opinionated tweet disagreeing with the target content",
        max_length=280,
        min_length=100,
        platform="Twitter"
    ),
    OutputSchema(
        name="tweet_single_neutral",
        format="text",
        output_type=OutputType.TWEET_SINGLE,
        description="An opinionated tweet neutral to the target content",
        max_length=280,
        min_length=100,
        platform="Twitter"
    ),
]


def schedule_tweet(content: str, in_seconds: int, events_area: TextArea) -> None:
    events_area.text += f"Tweet scheduled for {datetime.now() + timedelta(seconds=in_seconds)}:\n{content}\n\n"
    def _task(content: str, events_area: TextArea) -> None:
        tweet_text(content)
        events_area.text += f"Tweet sent at {datetime.now()}\n"
    scheduler.schedule(func=_task,
                       run_at=datetime.now() + timedelta(seconds=in_seconds),
                       content=content,
                       events_area=events_area)




def tweet_text(content: str) -> None:
    auth_tools(user_id=USER_ID, client=client, tool_names=["X.PostTweet"])
    input = {
        "tweet_text": content,
    }
    # tweet_time = datetime.now() + timedelta(minutes=2)
    response = client.tools.execute(
        tool_name="X.PostTweet",
        input=input,
        user_id=USER_ID,
        # TODO(Mateo): Add a way to schedule tweets through Arcade.
        # run_at=tweet_time.strftime("%Y-%m-%d %H:%M:%S"),
    )
    return response.output


class TweetItem(Static):
    def __init__(self, tweet: Document):
        super().__init__(f"\n{tweet.author}:\n {tweet.content}\n")
        self.tweet = tweet


class CombiningLayoutsExample(App):
    CSS_PATH = "layout.tcss"

    def __init__(self, tweets: list[Document]):
        self.text_area = TextArea("Placeholder")
        self.events_area = TextArea("Events will be displayed here\n")
        self.tweets = tweets
        self.tweet_view: ListView | None = None
        self.drafts: list[Document] = []
        self.draft_view: ListView | None = None
        super().__init__()

    def compose(self) -> ComposeResult:
        yield Header()
        with Container(id="app-grid"):
            with VerticalScroll(id="left-pane"):
                self.tweet_view = ListView(
                    *[ListItem(TweetItem(tweet)) for tweet in self.tweets],
                    id="tweet-list"
                )
                yield self.tweet_view
            with VerticalScroll(id="middle-pane"):
                self.draft_view = ListView(
                    *[ListItem(TweetItem(tweet)) for tweet in self.drafts],
                    id="draft-list"
                )
                yield self.draft_view

            with VerticalScroll(id="right-pane"):
                yield DateSelect(
                    placeholder="please select",
                    format="YYYY-MM-DD",
                    picker_mount="#right-pane"
                )
                yield self.text_area
                with Vertical():
                    with Horizontal():
                        yield Button("Tweet", id="tweet-button")
                        yield Button("Tweet in 2 minutes", id="schedule-button")
                    with Horizontal():
                        yield Button("AI Draft", id="ai-draft-button")
                        yield Button("Inspect Target", id="inspect-target-button")
                        # yield Button("Inspect Drafts", id="inspect-draft-button")
                    with Horizontal():
                        yield Button("Exit", id="exit-button")
                yield self.events_area


    def on_list_view_selected(self, event: ListView.Selected) -> None:
        self.text_area.text = str(event.item.children[0].tweet.content)

    async def on_button_pressed(self, event: Button.Pressed) -> None:
        if event.button.id == "tweet-button":
            tweet_text(self.text_area.text)
        elif event.button.id == "schedule-button":
            schedule_tweet(self.text_area.text, 2, self.events_area)
        elif event.button.id == "ai-draft-button":
            r = StyleTransferRequest(
                reference_style=[reference_style],
                intent="Make a tweet that is a response to the target content, absolutely no marketing or sales oriented tweets",
                focus="Focus on the technical aspects of the content and the implications for the future of the AI industry",
                target_content=[self.tweet_view.highlighted_child.children[0].tweet],
                target_schemas=output_schemas,
            )
            responses = await generate_related_content(r, "openai", "gpt-4o-mini")
            for response in responses:
                tweet = Document(
                    content=response.content,
                    url="http://example.com",
                    type=ContentType.TWITTER,
                    category=DocumentCategory.CASUAL,
                )
                self.drafts.append(tweet)
                self.draft_view.append(ListItem(TweetItem(tweet)))
        elif event.button.id == "exit-button":
            self.exit()
        elif event.button.id == "inspect-draft-button":
            self.events_area.text += f"Drafts in memory: {len(self.drafts)}\n"
            self.events_area.text += f"Drafts in view: {len(self.draft_view.children)}\n"
        elif event.button.id == "inspect-target-button":
            self.events_area.text += f"Selected target: {self.tweet_view.highlighted_child.children[0].tweet}\n"


if __name__ == "__main__":

    mcp_tweets = load_documents_from_json(Path("output_data/2025-07-23/x-mcp_content.json"))

    for tweet in mcp_tweets:
        print(tweet.author)
        print(tweet.content[:100])
        print(tweet.url)
        print("-" * 20)

    app = CombiningLayoutsExample(tweets=mcp_tweets)
    app.run()
