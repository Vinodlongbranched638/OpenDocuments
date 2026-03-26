import { join } from 'node:path'
import { mkdirSync } from 'node:fs'
import {
  loadConfig,
  type OpenDocsConfig,
  createSQLiteDB,
  runMigrations,
  createLanceDB,
  PluginRegistry,
  EventBus,
  MiddlewareRunner,
  WorkspaceManager,
  DocumentStore,
  IngestPipeline,
  RAGEngine,
  MarkdownParser,
  type DB,
  type VectorDB,
  type ModelPlugin,
  type PluginContext,
  type EmbeddingResult,
  type RerankResult,
  type GenerateOpts,
  type HealthStatus,
} from '@opendocs/core'

const EMBEDDING_DIMENSIONS = 384

export interface BootstrapOptions {
  dataDir?: string
  projectDir?: string
}

export interface AppContext {
  config: OpenDocsConfig
  db: DB
  vectorDb: VectorDB
  registry: PluginRegistry
  eventBus: EventBus
  middleware: MiddlewareRunner
  workspaceManager: WorkspaceManager
  store: DocumentStore
  pipeline: IngestPipeline
  ragEngine: RAGEngine
  shutdown: () => Promise<void>
}

function createStubEmbedder(): ModelPlugin {
  return {
    name: '@opendocs/stub-embedder',
    type: 'model',
    version: '0.1.0',
    coreVersion: '^0.1.0',
    capabilities: { embedding: true },
    async setup(_ctx: PluginContext): Promise<void> {},
    async teardown(): Promise<void> {},
    async healthCheck(): Promise<HealthStatus> {
      return { healthy: true, message: 'Stub embedder' }
    },
    async embed(texts: string[]): Promise<EmbeddingResult> {
      const dense = texts.map(() => new Array(EMBEDDING_DIMENSIONS).fill(0))
      return { dense }
    },
  }
}

function createStubLLM(): ModelPlugin {
  return {
    name: '@opendocs/stub-llm',
    type: 'model',
    version: '0.1.0',
    coreVersion: '^0.1.0',
    capabilities: { llm: true },
    async setup(_ctx: PluginContext): Promise<void> {},
    async teardown(): Promise<void> {},
    async healthCheck(): Promise<HealthStatus> {
      return { healthy: true, message: 'Stub LLM' }
    },
    async *generate(_prompt: string, _opts?: GenerateOpts): AsyncIterable<string> {
      yield 'This is a placeholder response. Configure a real LLM model plugin for actual generation.'
    },
  }
}

export async function bootstrap(opts: BootstrapOptions = {}): Promise<AppContext> {
  // 1. Load config
  const projectDir = opts.projectDir || process.cwd()
  const config = loadConfig(projectDir)

  // Resolve dataDir
  const dataDir = opts.dataDir || config.storage.dataDir.replace(/^~/, process.env.HOME || '~')
  mkdirSync(dataDir, { recursive: true })

  // 2. Create SQLite DB
  const dbPath = join(dataDir, 'opendocs.db')
  let db: DB | null = null
  let vectorDb: VectorDB | null = null

  try {
    db = createSQLiteDB(dbPath)

    // 3. Run migrations
    runMigrations(db)

    // 4. Create LanceDB
    const vectorDir = join(dataDir, 'vectors')
    mkdirSync(vectorDir, { recursive: true })
    vectorDb = await createLanceDB(vectorDir)

    // 5. Create PluginRegistry, EventBus, MiddlewareRunner
    const registry = new PluginRegistry()
    const eventBus = new EventBus()
    const middleware = new MiddlewareRunner()

    // 6. Create plugin context for setup calls
    const pluginCtx: PluginContext = {
      config: {},
      dataDir,
      log: {
        ok: (msg: string) => console.log(`[ok] ${msg}`),
        fail: (msg: string) => console.error(`[fail] ${msg}`),
        info: (msg: string) => console.log(`[info] ${msg}`),
        wait: (msg: string) => console.log(`[wait] ${msg}`),
      },
    }

    // 7. Register built-in MarkdownParser
    const markdownParser = new MarkdownParser()
    await registry.register(markdownParser, pluginCtx)

    // 8. Register stub embedder and LLM
    const stubEmbedder = createStubEmbedder()
    const stubLLM = createStubLLM()
    await registry.register(stubEmbedder, pluginCtx)
    await registry.register(stubLLM, pluginCtx)

    // 9. Create WorkspaceManager, ensure default workspace
    const workspaceManager = new WorkspaceManager(db)
    const defaultWorkspace = workspaceManager.ensureDefault()

    // 10. Create DocumentStore (with workspace ID from default workspace)
    const store = new DocumentStore(db, vectorDb, defaultWorkspace.id)
    await store.initialize(EMBEDDING_DIMENSIONS)

    // 11. Create IngestPipeline and RAGEngine
    const pipeline = new IngestPipeline({
      store,
      registry,
      eventBus,
      middleware,
      embeddingDimensions: EMBEDDING_DIMENSIONS,
    })

    // Capture for shutdown closure
    const dbRef = db
    const vectorDbRef = vectorDb

    const ragEngine = new RAGEngine({
      store,
      llm: stubLLM,
      embedder: stubEmbedder,
      eventBus,
      defaultProfile: config.rag.profile,
    })

    // Shutdown function
    const shutdown = async (): Promise<void> => {
      await registry.teardownAll()
      eventBus.removeAllListeners()
      await vectorDbRef.close()
      dbRef.close()
    }

    return {
      config,
      db,
      vectorDb,
      registry,
      eventBus,
      middleware,
      workspaceManager,
      store,
      pipeline,
      ragEngine,
      shutdown,
    }
  } catch (err) {
    // Cleanup partially initialized resources
    if (vectorDb) await vectorDb.close().catch(() => {})
    if (db) db.close()
    throw err
  }
}
