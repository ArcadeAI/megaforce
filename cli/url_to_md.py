import argparse
from pathlib import Path
from arcadepy import Arcade
from dotenv import load_dotenv

load_dotenv()


def main(url: str, output_file: str):
    """
    Convert a URL to markdown and save to file.

    Args:
        url: The URL to convert
        output_file: The output file path
    """
    # TODO: Implement URL to markdown conversion
    client = Arcade()
    response = client.tools.execute(
        tool_name="Web.ScrapeUrl",
        input={
            "url": url,
        },
        user_id="mateo@arcade.dev",
    )
    with Path(output_file).open("w") as f:
        f.write(response.output.value["markdown"])

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Convert URL to markdown")
    parser.add_argument("-u", "--url", required=True, help="URL to convert to markdown")
    parser.add_argument("-o", "--output-file", required=True, help="Output file path")

    args = parser.parse_args()

    main(args.url, args.output_file)
