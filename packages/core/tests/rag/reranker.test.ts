import { describe, it, expect } from 'vitest'
import { rerankResults } from '../../src/rag/reranker.js'
import type { SearchResult } from '../../src/ingest/document-store.js'

const mockResults: SearchResult[] = [
  { chunkId: '1', content: 'Python tutorial for beginners', score: 0.8, documentId: 'd1', chunkType: 'semantic', headingHierarchy: [], sourcePath: '/a.md', sourceType: 'local' },
  { chunkId: '2', content: 'Redis configuration and setup guide', score: 0.75, documentId: 'd2', chunkType: 'semantic', headingHierarchy: [], sourcePath: '/b.md', sourceType: 'local' },
  { chunkId: '3', content: 'Database configuration for production', score: 0.7, documentId: 'd3', chunkType: 'semantic', headingHierarchy: [], sourcePath: '/c.md', sourceType: 'local' },
]

describe('rerankResults', () => {
  it('reranks by keyword overlap', async () => {
    const reranked = await rerankResults('Redis configuration', mockResults)
    expect(reranked[0].content).toContain('Redis')
  })

  it('returns single result unchanged', async () => {
    const single = [mockResults[0]]
    const result = await rerankResults('test', single)
    expect(result).toEqual(single)
  })

  it('returns empty array for empty input', async () => {
    const result = await rerankResults('test', [])
    expect(result).toEqual([])
  })

  it('preserves all results', async () => {
    const reranked = await rerankResults('database', mockResults)
    expect(reranked).toHaveLength(3)
  })
})
