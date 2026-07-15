/**
 * Vectorize documents via Drizzle ORM (direct DB insert)
 * Run: npx tsx db/ingest-documents.ts
 */
import "dotenv/config";
import fs from "fs";
import { getDb } from "../api/queries/connection";
import { documentChunks } from "@db/schema";

const STOP_WORDS = new Set([
  "el","la","los","las","un","una","de","del","al","que","en","por","para","con","sin",
  "sobre","entre","hasta","desde","durante","segun","mediante","excepto","salvo",
  "y","o","pero","aunque","porque","pues","si","no","sí","tambien","ya","mas","menos",
  "the","a","an","and","or","but","in","on","at","to","for","of","with","from","by",
  "is","are","was","were","be","been","being","have","has","had","do","does","did",
  "will","would","could","should","may","might","can","shall"
]);

function simpleEmbedding(text: string, dims = 128): number[] {
  const vec = new Array(dims).fill(0);
  const words = text.toLowerCase()
    .replace(/[^a-z\u00e1\u00e9\u00ed\u00f3\u00fa\u00fc\u00f1\s]/g, " ")
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOP_WORDS.has(w));
  const freq: Record<string, number> = {};
  words.forEach(w => { freq[w] = (freq[w] || 0) + 1; });
  const maxFreq = Math.max(...Object.values(freq), 1);
  Object.entries(freq).forEach(([word, count]) => {
    let hash = 0;
    for (let i = 0; i < word.length; i++) hash = ((hash << 5) - hash + word.charCodeAt(i)) | 0;
    const idx = Math.abs(hash) % dims;
    vec[idx] += (count / maxFreq) * 0.5 + 0.1;
  });
  const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0));
  return norm > 0 ? vec.map(v => v / norm) : vec;
}

function splitIntoChunks(text: string, chunkSize = 1000, overlap = 200): string[] {
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    let end = Math.min(start + chunkSize, text.length);
    if (end < text.length) {
      const sentenceEnd = text.lastIndexOf(". ", end);
      if (sentenceEnd > start + chunkSize / 2) end = sentenceEnd + 2;
    }
    chunks.push(text.substring(start, end).trim());
    start = end - overlap;
    if (start < 0) start = 0;
    if (start === 0 && chunks.length > 1) break;
  }
  return chunks.filter(c => c.length > 50);
}

interface DocConfig {
  filePath: string;
  source: string;
  modality?: string;
  tags: string[];
}

const DOCS: DocConfig[] = [
  {
    filePath: "/mnt/agents/output/SSR6_2012_extracted.txt",
    source: "IAEA SSR-6 (2012)",
    modality: "transporte",
    tags: ["transporte","SSR-6","IAEA","material radiactivo","seguridad"],
  },
  {
    filePath: "/mnt/agents/output/SSR6_Rev1_2018_extracted.txt",
    source: "IAEA SSR-6 Rev.1 (2018)",
    modality: "transporte",
    tags: ["transporte","SSR-6","IAEA","material radiactivo","revision"],
  },
  {
    filePath: "/mnt/agents/output/IAEA_Safety_Report_47_extracted.txt",
    source: "IAEA Safety Report No.47",
    modality: "terapia",
    tags: ["blindaje","radioterapia","IAEA","proteccion radiologica"],
  },
];

async function ingestDoc(config: DocConfig) {
  console.log(`\n📄 ${config.source}`);
  if (!fs.existsSync(config.filePath)) {
    console.log(`   ⚠️ Not found: ${config.filePath}`);
    return 0;
  }
  const text = fs.readFileSync(config.filePath, "utf-8");
  const chunks = splitIntoChunks(text, 800, 150);
  console.log(`   📊 ${text.length.toLocaleString()} chars → ${chunks.length} chunks`);

  const db = getDb();
  let inserted = 0;
  for (let i = 0; i < chunks.length; i++) {
    try {
      await db.insert(documentChunks).values({
        source: config.source,
        section: `Part ${i + 1}/${chunks.length}`,
        modality: config.modality,
        content: chunks[i],
        embedding: JSON.stringify(simpleEmbedding(chunks[i])),
        tags: JSON.stringify(config.tags),
        pageRef: `chunk_${i + 1}`,
      });
      inserted++;
      if ((i + 1) % 20 === 0 || i === chunks.length - 1) {
        process.stdout.write(`\r   ✅ ${i + 1}/${chunks.length}`);
      }
    } catch (e: any) {
      console.error(`\n   ❌ ${e.message?.substring(0, 80) || e}`);
    }
  }
  console.log(`\n   Done: ${inserted}/${chunks.length} chunks`);
  return inserted;
}

async function main() {
  console.log("══════════════════════════════════════════════════════════");
  console.log("  RadShield-MX v96 — Document Vectorization (Drizzle)");
  console.log("══════════════════════════════════════════════════════════");
  let total = 0;
  for (const doc of DOCS) total += await ingestDoc(doc);
  console.log(`\n══════════════════════════════════════════════════════════`);
  console.log(`  TOTAL: ${total} chunks vectorized`);
  console.log("══════════════════════════════════════════════════════════");
}
main().catch(console.error);
