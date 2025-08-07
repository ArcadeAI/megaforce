from common.schemas import Document
from pathlib import Path
import json


def write_documents_to_json(documents: list[Document], file_path: Path | str):
    if isinstance(file_path, str):
        file_path = Path(file_path)
    file_path.parent.mkdir(parents=True, exist_ok=True)
    with file_path.open("w") as f:
        json.dump([doc.model_dump(mode="json") for doc in documents], f)

