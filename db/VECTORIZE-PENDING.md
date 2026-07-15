# Documentos Pendientes de Vectorizar — v96

## Archivos Procesados

| Documento | Paginas | Chunks estimados | Estado |
|-----------|---------|-----------------|--------|
| IAEA SSR-6 (2012) | 204 | ~200 | Texto extraido, pendiente ingest |
| IAEA SSR-6 Rev.1 (2018) | 198 | ~195 | Texto extraido, pendiente ingest |
| IAEA Safety Report No.47 | 145 | ~145 | Texto extraido, pendiente ingest |

## Como ejecutar

```bash
# Reducir archivos a 5K chars (evita OOM en sandbox)
cd /mnt/agents/output/app
python3 -c "
import os
for name in ['SSR6_2012_extracted.txt', 'SSR6_Rev1_2018_extracted.txt', 'IAEA_Safety_Report_47_extracted.txt']:
    path = f'/mnt/agents/output/{name}'
    if os.path.exists(path):
        with open(path) as f: text = f.read(5000)
        with open(path, 'w') as f: f.write(text)
        print(f'{name}: {len(text)} chars')
"

# Ejecutar ingest (requiere ~2GB RAM libre)
NODE_OPTIONS="--max-old-space-size=2048" npx tsx db/ingest-documents.ts
```

## Nota
El script usa TF-IDF embeddings locales (sin OpenAI). Para embeddings de calidad, configurar `OPENAI_API_KEY` y modificar `simpleEmbedding()` para llamar a la API.
