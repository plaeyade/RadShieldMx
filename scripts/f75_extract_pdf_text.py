import json
import sys
from pathlib import Path

from pypdf import PdfReader

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

def main() -> int:
    if len(sys.argv) != 2:
        print(json.dumps({"ok": False, "error": "Usage: f75_extract_pdf_text.py <pdf-path>"}))
        return 2

    pdf_path = Path(sys.argv[1])
    try:
        reader = PdfReader(str(pdf_path))
        pages = []
        for index, page in enumerate(reader.pages, start=1):
            text = page.extract_text() or ""
            text = " ".join(text.split())
            if text:
                pages.append({"page": index, "text": text})

        print(json.dumps({
            "ok": True,
            "pages": len(reader.pages),
            "extractedPages": len(pages),
            "text": "\n\n".join(f"[page {page['page']}]\n{page['text']}" for page in pages),
        }, ensure_ascii=False))
        return 0
    except Exception as exc:
        print(json.dumps({"ok": False, "error": str(exc)}, ensure_ascii=False))
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
