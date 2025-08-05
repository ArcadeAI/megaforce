from megaforce.common.utils import load_documents_from_json, auth_tools
from megaforce.common.schemas import Document
from pathlib import Path
from textual.app import App, ComposeResult
from textual.containers import Container, VerticalScroll, Horizontal
from textual.widgets import Header, Static, Button, TextArea, ListView, ListItem
from textual_datepicker import DateSelect
from typing import Any
from datetime import datetime, timedelta
from arcadepy import Arcade
from dotenv import load_dotenv
from megaforce.experiments.scheduler import Scheduler


load_dotenv()
client = Arcade()
USER_ID = "mateo@arcade.dev"
scheduler = Scheduler()


def schedule_tweet(content: str, in_minutes: int, events_area: TextArea) -> None:
    events_area.text += f"Tweet scheduled for {datetime.now() + timedelta(minutes=in_minutes)}:\n{content}\n\n"
    def _task(content: str, events_area: TextArea) -> None:
        tweet_text(content)
        events_area.text += f"Tweet sent at {datetime.now()}\n"
    scheduler.schedule(func=_task,
                       run_at=datetime.now() + timedelta(minutes=in_minutes),
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
        super().__init__()

    def compose(self) -> ComposeResult:
        yield Header()
        with Container(id="app-grid"):
            with VerticalScroll(id="left-pane"):
                list_items = []
                for tweet in self.tweets:
                    list_items.append(ListItem(TweetItem(tweet)))
                yield ListView(*list_items)
            with VerticalScroll(id="right-pane"):
                yield DateSelect(
                    placeholder="please select",
                    format="YYYY-MM-DD",
                    picker_mount="#right-pane"
                )
                yield self.text_area
                with Horizontal():
                    yield Button("Tweet", id="tweet-button")
                    yield Button("Tweet in 2 minutes", id="schedule-button")
                    yield Button("Exit", id="exit-button")
                yield self.events_area


    def on_list_view_selected(self, event: ListView.Selected) -> None:
        self.text_area.text = str(event.item.children[0].tweet.content)

    def on_button_pressed(self, event: Button.Pressed) -> None:
        if event.button.id == "tweet-button":
            tweet_text(self.text_area.text)
        elif event.button.id == "schedule-button":
            schedule_tweet(self.text_area.text, 2, self.events_area)
        elif event.button.id == "exit-button":
            self.exit()


if __name__ == "__main__":

    mcp_tweets = load_documents_from_json(Path("output_data/2025-07-23/x-mcp_content.json"))

    for tweet in mcp_tweets:
        print(tweet.author)
        print(tweet.content[:100])
        print(tweet.url)
        print("-" * 20)

    app = CombiningLayoutsExample(tweets=mcp_tweets)
    app.run()
