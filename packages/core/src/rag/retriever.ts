import { DocumentStore, type SearchResult } from '../ingest/document-store.js'
import type { ModelPlugin } from '../plugin/interfaces.js'

export interface RetrieveOptions {
  k: number
  finalTopK: number
  minScore?: number
}

export class Retriever {
  constructor(
    private store: DocumentStore,
    private embedder: ModelPlugin
  ) {
    if (!embedder.embed) {
      throw new Error('Embedding model must support embed()')
    }
  }

  async retrieve(query: string, opts: RetrieveOptions): Promise<SearchResult[]> {
    const embedResult = await this.embedder.embed!([query])
    const queryEmbedding = embedResult.dense[0]
    const results = await this.store.searchChunks(queryEmbedding, opts.k, opts.minScore)
    return results.slice(0, opts.finalTopK)
  }
}
