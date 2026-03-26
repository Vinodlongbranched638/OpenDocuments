// packages/core/src/storage/chroma.ts
import { ChromaClient } from 'chromadb'
import type { VectorDB, VectorDocument, VectorSearchOpts, VectorSearchResult } from './vector-db.js'

export function createChromaDB(url?: string): VectorDB {
  const client = new ChromaClient(url ? { path: url } : undefined)
  const collections = new Map<string, Awaited<ReturnType<ChromaClient['getOrCreateCollection']>>>()

  async function getCollection(name: string) {
    let col = collections.get(name)
    if (!col) {
      col = await client.getOrCreateCollection({ name })
      collections.set(name, col)
    }
    return col
  }

  return {
    async ensureCollection(name: string, _dimensions: number): Promise<void> {
      await getCollection(name)
    },

    async upsert(collectionName: string, documents: VectorDocument[]): Promise<void> {
      const col = await getCollection(collectionName)
      await col.upsert({
        ids: documents.map(d => d.id),
        documents: documents.map(d => d.content),
        embeddings: documents.map(d => d.embedding),
        metadatas: documents.map(d => d.metadata),
      })
    },

    async search(collectionName: string, opts: VectorSearchOpts): Promise<VectorSearchResult[]> {
      const col = await getCollection(collectionName)
      const results = await col.query({
        queryEmbeddings: [opts.embedding],
        nResults: opts.topK,
        where: opts.filter as any,
      })

      if (!results.ids[0]) return []

      return results.ids[0].map((id, i) => ({
        id,
        content: results.documents[0]?.[i] ?? '',
        score: results.distances?.[0]?.[i] != null ? 1 - results.distances[0][i] : 0,
        metadata: (results.metadatas?.[0]?.[i] ?? {}) as Record<string, string | number | boolean>,
      })).filter(r => !opts.minScore || r.score >= opts.minScore)
    },

    async delete(collectionName: string, ids: string[]): Promise<void> {
      const col = await getCollection(collectionName)
      await col.delete({ ids })
    },

    async count(collectionName: string): Promise<number> {
      const col = await getCollection(collectionName)
      return await col.count()
    },

    async close(): Promise<void> {
      collections.clear()
    },
  }
}
