# OCR sidecars for RAG

Place UTF-8 OCR text files here when a PDF is scanned and has no extractable text.

Expected file name:

```text
{documentId}.txt
```

Current F76 pending IDs:

- `ncrp-49-structural-shielding.txt`
- `zumaya-memoria-al.txt`

After adding a sidecar, run:

```bash
npm run prepare:f75:pdf-rag
```

The generated RAG chunks and DB draft will include the OCR text without modifying the original PDF.
