import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { DocumentStore } from '../../src/ingest/document-store.js'
import { createSQLiteDB } from '../../src/storage/sqlite.js'
import { createLanceDB } from '../../src/storage/lancedb.js'
import { runMigrations } from '../../src/storage/migrations/runner.js'
import type { DB } from '../../src/storage/db.js'
import type { VectorDB } from '../../src/storage/vector-db.js'
import { mkdtempSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

describe('DocumentStore', () => {
  let db: DB
  let vectorDb: VectorDB
  let store: DocumentStore
  let tempDir: string

  beforeEach(async () => {
    db = createSQLiteDB(':memory:')
    runMigrations(db)
    tempDir = mkdtempSync(join(tmpdir(), 'opendocs-test-'))
    vectorDb = await createLanceDB(tempDir)
    store = new DocumentStore(db, vectorDb, 'default-workspace-id')
    await store.initialize(3)
  })

  afterEach(async () => {
    db.close()
    await vectorDb.close()
    rmSync(tempDir, { recursive: true, force: true })
  })

  it('creates a document record', () => {
    const doc = store.createDocument({
      title: 'test.md',
      sourceType: 'local',
      sourcePath: '/docs/test.md',
      fileType: '.md',
    })
    expect(doc.id).toBeDefined()
    expect(doc.status).toBe('pending')
  })

  it('stores and retrieves chunks with vectors', async () => {
    const doc = store.createDocument({
      title: 'test.md', sourceType: 'local', sourcePath: '/docs/test.md', fileType: '.md',
    })
    await store.storeChunks(doc.id, [
      { content: 'Hello world', embedding: [1, 0, 0], chunkType: 'semantic', position: 0, tokenCount: 2, headingHierarchy: ['# Title'] },
      { content: 'Foo bar', embedding: [0, 1, 0], chunkType: 'semantic', position: 1, tokenCount: 2, headingHierarchy: ['# Title'] },
    ])
    const updated = store.getDocument(doc.id)
    expect(updated?.chunk_count).toBe(2)
    expect(updated?.status).toBe('indexed')
  })

  it('searches chunks by vector similarity', async () => {
    const doc = store.createDocument({
      title: 'test.md', sourceType: 'local', sourcePath: '/docs/test.md', fileType: '.md',
    })
    await store.storeChunks(doc.id, [
      { content: 'Hello', embedding: [1, 0, 0], chunkType: 'semantic', position: 0, tokenCount: 1, headingHierarchy: [] },
      { content: 'World', embedding: [0, 1, 0], chunkType: 'semantic', position: 1, tokenCount: 1, headingHierarchy: [] },
    ])
    const results = await store.searchChunks([1, 0, 0], 1)
    expect(results).toHaveLength(1)
    expect(results[0].content).toBe('Hello')
  })

  it('deletes document and its chunks', async () => {
    const doc = store.createDocument({
      title: 'test.md', sourceType: 'local', sourcePath: '/docs/test.md', fileType: '.md',
    })
    await store.storeChunks(doc.id, [
      { content: 'Hello', embedding: [1, 0, 0], chunkType: 'semantic', position: 0, tokenCount: 1, headingHierarchy: [] },
    ])
    await store.deleteDocument(doc.id)
    expect(store.getDocument(doc.id)).toBeUndefined()
    const results = await store.searchChunks([1, 0, 0], 10)
    expect(results).toHaveLength(0)
  })

  it('checks content hash for change detection', () => {
    const doc = store.createDocument({
      title: 'test.md', sourceType: 'local', sourcePath: '/docs/test.md', fileType: '.md',
    })
    store.updateContentHash(doc.id, 'abc123')
    expect(store.hasContentChanged(doc.id, 'abc123')).toBe(false)
    expect(store.hasContentChanged(doc.id, 'xyz789')).toBe(true)
  })
})
