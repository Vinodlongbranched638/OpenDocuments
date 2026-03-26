// packages/core/tests/storage/chroma.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// Mock chromadb before importing the module under test
vi.mock('chromadb', () => {
  type DocEntry = { content: string; embedding: number[]; metadata: Record<string, string | number | boolean> }

  function cosineSimilarity(a: number[], b: number[]): number {
    let dot = 0, normA = 0, normB = 0
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i]
      normA += a[i] * a[i]
      normB += b[i] * b[i]
    }
    if (normA === 0 || normB === 0) return 0
    return dot / (Math.sqrt(normA) * Math.sqrt(normB))
  }

  class MockCollection {
    private docs = new Map<string, DocEntry>()

    constructor(public name: string) {}

    async upsert(params: { ids: string[]; documents: string[]; embeddings: number[][]; metadatas: Record<string, string | number | boolean>[] }) {
      params.ids.forEach((id, i) => {
        this.docs.set(id, {
          content: params.documents[i],
          embedding: params.embeddings[i],
          metadata: params.metadatas[i],
        })
      })
    }

    async query(params: { queryEmbeddings: number[][]; nResults: number; where?: Record<string, unknown> }) {
      const queryEmb = params.queryEmbeddings[0]

      let entries = Array.from(this.docs.entries())

      // Apply where filter if provided
      if (params.where && Object.keys(params.where).length > 0) {
        entries = entries.filter(([, doc]) => {
          return Object.entries(params.where!).every(([k, v]) => doc.metadata[k] === v)
        })
      }

      // Score by cosine distance (1 - similarity)
      const scored = entries.map(([id, doc]) => ({
        id,
        doc,
        distance: 1 - cosineSimilarity(queryEmb, doc.embedding),
      }))

      scored.sort((a, b) => a.distance - b.distance)
      const top = scored.slice(0, params.nResults)

      return {
        ids: [top.map(r => r.id)],
        documents: [top.map(r => r.doc.content)],
        distances: [top.map(r => r.distance)],
        metadatas: [top.map(r => r.doc.metadata)],
      }
    }

    async delete(params: { ids: string[] }) {
      params.ids.forEach(id => this.docs.delete(id))
    }

    async count() {
      return this.docs.size
    }
  }

  class ChromaClient {
    async getOrCreateCollection(params: { name: string }) {
      return new MockCollection(params.name)
    }
  }

  return { ChromaClient }
})

import { createChromaDB } from '../../src/storage/chroma.js'
import type { VectorDB } from '../../src/storage/vector-db.js'

describe('ChromaDB VectorDB', () => {
  let vectorDb: VectorDB
  const COLLECTION = 'test_chunks'

  beforeEach(async () => {
    vectorDb = createChromaDB()
    await vectorDb.ensureCollection(COLLECTION, 3)
  })

  afterEach(async () => {
    await vectorDb.close()
  })

  it('upserts and counts documents', async () => {
    await vectorDb.upsert(COLLECTION, [
      { id: 'chunk-1', content: 'hello world', embedding: [1, 0, 0], metadata: { source: 'test' } },
      { id: 'chunk-2', content: 'foo bar', embedding: [0, 1, 0], metadata: { source: 'test' } },
    ])
    const count = await vectorDb.count(COLLECTION)
    expect(count).toBe(2)
  })

  it('searches by embedding similarity', async () => {
    await vectorDb.upsert(COLLECTION, [
      { id: 'chunk-1', content: 'hello world', embedding: [1, 0, 0], metadata: { source: 'a' } },
      { id: 'chunk-2', content: 'foo bar', embedding: [0, 1, 0], metadata: { source: 'b' } },
    ])
    const results = await vectorDb.search(COLLECTION, {
      embedding: [1, 0, 0],
      topK: 1,
    })
    expect(results).toHaveLength(1)
    expect(results[0].id).toBe('chunk-1')
  })

  it('deletes documents', async () => {
    await vectorDb.upsert(COLLECTION, [
      { id: 'chunk-1', content: 'hello', embedding: [1, 0, 0], metadata: { source: 'test' } },
    ])
    await vectorDb.delete(COLLECTION, ['chunk-1'])
    const count = await vectorDb.count(COLLECTION)
    expect(count).toBe(0)
  })
})
