import json
import sys
from pathlib import Path

from pypdf import PdfReader


def extract_pdf(path_text: str) -> dict:
    path = Path(path_text)
    result = {
        "path": str(path),
        "exists": path.exists(),
        "pages": [],
        "error": None,
    }
    if not path.exists():
        result["error"] = "file not found"
        return result

    try:
        reader = PdfReader(str(path))
        for index, page in enumerate(reader.pages):
            result["pages"].append(
                {
                    "page": index + 1,
                    "text": page.extract_text() or "",
                }
            )
    except Exception as exc:  # pragma: no cover - called from Node as a utility.
        result["error"] = str(exc)
    return result


if __name__ == "__main__":
    print(json.dumps(extract_pdf(sys.argv[1]), ensure_ascii=False))
