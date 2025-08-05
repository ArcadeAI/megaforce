from megaforce.common.utils import load_documents_from_json, auth_tools
from megaforce.common.schemas import Document
from pathlib import Path
from textual.app import App, ComposeResult
from textual.containers import Container, VerticalScroll, Horizontal
from textual.widgets import Header, Static, Button, TextArea
from textual_datepicker import DateSelect
from datetime import datetime, timedelta
from arcadepy import Arcade
from dotenv import load_dotenv

load_dotenv()
client = Arcade()
USER_ID = "mateo@arcade.dev"

def tweet_text(content: str) -> None:
    auth_tools(user_id=USER_ID, client=client, tool_names=["X.PostTweet"])
    input = {
        "tweet_text": content,
    }
    tweet_time = datetime.now() + timedelta(minutes=2)
    response = client.tools.execute(
        tool_name="X.PostTweet",
        input=input,
        user_id=USER_ID,
        run_at=tweet_time.strftime("%Y-%m-%d %H:%M:%S"),
    )
    return response.output


class CombiningLayoutsExample(App):
    CSS_PATH = "layout.tcss"

    def __init__(self, tweets: list[Document]):
        self.text_area = TextArea(f"Placeholder")
        self.tweets = tweets
        super().__init__()

    def compose(self) -> ComposeResult:
        yield Header()
        with Container(id="app-grid"):
            with VerticalScroll(id="left-pane"):
                for tweet in self.tweets:
                    yield Static(f"{tweet.author}:\n {tweet.content}")
            with VerticalScroll(id="right-pane"):
                yield DateSelect(
                    placeholder="please select",
                    format="YYYY-MM-DD",
                    picker_mount="#right-pane"
                )
                yield self.text_area
                with Horizontal():
                    yield Button(f"Tweet", id="tweet-button")
                    yield Button(f"Exit", id="exit-button")


    def on_button_pressed(self, event: Button.Pressed) -> None:
        if event.button.id == "tweet-button":
            tweet_text(self.text_area.text)
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
