/**
 * ═══════════════════════════════════════════════════════════
 * Vector Store — Backend (DB access + embeddings)
 * MySQL + Cosine Similarity for RAG
 * ═══════════════════════════════════════════════════════════
 */

import { eq, and, sql } from "drizzle-orm";
import { getDb } from "../queries/connection";
import { documentChunks } from "@db/schema";
import { generateEmbedding } from "@/lib/llm/client";

export interface RetrievedChunk {
  id: number;
  content: string;
  source: string;
  section: string | null;
  modality: string | null;
  tags: string[];
  similarity: number;
  energyMin: number | null;
  energyMax: number | null;
}

export interface SearchOptions {
  query: string;
  topK?: number;
  source?: string;
  modality?: string;
  energyMin?: number;
  energyMax?: number;
  tags?: string[];
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export async function retrieveChunks(options: SearchOptions): Promise<RetrievedChunk[]> {
  const { query, topK = 5, source, modality, energyMin, energyMax, tags } = options;

  const { embedding: queryEmbedding } = await generateEmbedding(query);
  const db = getDb();
  const conditions = [];

  if (source) conditions.push(eq(documentChunks.source, source));
  if (modality) conditions.push(eq(documentChunks.modality, modality));

  const candidates = conditions.length > 0
    ? await db.select().from(documentChunks).where(and(...conditions))
    : await db.select().from(documentChunks);

  const scored = candidates.map((chunk) => {
    let chunkEmbedding: number[] = [];
    try { chunkEmbedding = JSON.parse(chunk.embedding); } catch { return null; }

    let similarity = cosineSimilarity(queryEmbedding, chunkEmbedding);

    let chunkTags: string[] = [];
    try { if (chunk.tags) chunkTags = JSON.parse(chunk.tags); } catch { /* ignore */ }

    if (tags && tags.length > 0) {
      const matchingTags = tags.filter(t => chunkTags.includes(t));
      similarity += matchingTags.length * 0.05;
    }

    if (energyMin !== undefined && chunk.energyMin !== null && chunk.energyMax !== null) {
      if (chunk.energyMax < energyMin || chunk.energyMin > (energyMax || Infinity)) {
        return null;
      }
    }

    return {
      id: chunk.id,
      content: chunk.content,
      source: chunk.source,
      section: chunk.section,
      modality: chunk.modality,
      tags: chunkTags,
      similarity,
      energyMin: chunk.energyMin,
      energyMax: chunk.energyMax,
    };
  }).filter(Boolean) as RetrievedChunk[];

  return scored
    .filter(s => s.similarity > 0.25)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topK);
}

export async function keywordSearch(query: string, topK = 5, source?: string): Promise<RetrievedChunk[]> {
  const db = getDb();
  const terms = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);

  const allChunks = source
    ? await db.select().from(documentChunks).where(eq(documentChunks.source, source))
    : await db.select().from(documentChunks);

  return allChunks
    .map(chunk => {
      const content = chunk.content.toLowerCase();
      let score = 0;
      for (const term of terms) if (content.includes(term)) score += 1;
      score = score / (content.length / 100);

      let chunkTags: string[] = [];
      try { if (chunk.tags) chunkTags = JSON.parse(chunk.tags); } catch { /* ignore */ }

      return { id: chunk.id, content: chunk.content, source: chunk.source, section: chunk.section, modality: chunk.modality, tags: chunkTags, similarity: score, energyMin: chunk.energyMin, energyMax: chunk.energyMax };
    })
    .filter(s => s.similarity > 0)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topK);
}

export async function insertChunk(data: {
  source: string;
  section?: string;
  modality?: string;
  content: string;
  tags?: string[];
  energyMin?: number;
  energyMax?: number;
  pageRef?: string;
}): Promise<number> {
  const db = getDb();
  const { embedding } = await generateEmbedding(data.content);

  const result = await db.insert(documentChunks).values({
    source: data.source,
    section: data.section || null,
    modality: data.modality || null,
    content: data.content,
    embedding: JSON.stringify(embedding),
    tags: data.tags ? JSON.stringify(data.tags) : null,
    energyMin: data.energyMin || null,
    energyMax: data.energyMax || null,
    pageRef: data.pageRef || null,
  });

  return Number(result[0].insertId);
}

export async function countChunks(): Promise<number> {
  const db = getDb();
  const result = await db.select({ count: sql<number>`count(*)` }).from(documentChunks);
  return result[0]?.count || 0;
}

export async function incrementUsage(chunkId: number): Promise<void> {
  const db = getDb();
  await db.update(documentChunks).set({ usage: sql`${documentChunks.usage} + 1` }).where(eq(documentChunks.id, chunkId));
}

export async function getDocumentSources(): Promise<string[]> {
  const db = getDb();
  const results = await db.select({ source: documentChunks.source }).from(documentChunks).groupBy(documentChunks.source);
  return results.map(r => r.source);
}

export async function deleteAllChunks(source?: string): Promise<number> {
  const db = getDb();
  if (source) {
    const result = await db.delete(documentChunks).where(eq(documentChunks.source, source));
    return result[0].affectedRows || 0;
  }
  const result = await db.delete(documentChunks);
  return result[0].affectedRows || 0;
}
