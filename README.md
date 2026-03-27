# OpenDocuments

**Self-hosted open-source RAG platform that unifies scattered organizational documents and answers natural language queries with accurate, source-cited responses.**

[![CI](https://github.com/joungminsung/OpenDocuments/actions/workflows/ci.yml/badge.svg)](https://github.com/joungminsung/OpenDocuments/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-20%2B-green.svg)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5%2B-blue.svg)](https://www.typescriptlang.org)

---

## What is OpenDocuments?

OpenDocuments is a **self-hosted RAG (Retrieval-Augmented Generation) platform** that:

- **Unifies** documents scattered across GitHub, Notion, Google Drive, Confluence, S3, local files, and more into a single searchable index
- **Answers** natural language questions with accurate, source-cited responses powered by your choice of LLM
- **Runs** entirely on your machine or server -- your data never leaves your infrastructure unless you choose a cloud LLM provider

### Key Features

- **22+ file formats** supported (Markdown, PDF, DOCX, XLSX, HTML, Jupyter, Email, Code, PPTX, JSON, YAML, and more)
- **9 data sources** (Local files, Upload, GitHub, Notion, Google Drive, S3/GCS, Confluence, Swagger/OpenAPI, Web Crawler)
- **5 LLM providers** (Ollama local, OpenAI, Anthropic Claude, Google Gemini, xAI Grok)
- **3 interfaces** -- Web UI, CLI, and MCP Server (for Claude Code, Cursor, etc.)
- **Plugin architecture** -- extend with custom parsers, connectors, and model providers
- **Team mode** with API key authentication, RBAC (admin/member/viewer), and workspace isolation
- **Advanced RAG** with intent classification, multi-query decomposition, cross-lingual search (Korean/English), reranking, hallucination guard, and 3-tier caching

---

## Quick Start

### Install

```bash
npm install -g @opendocuments/cli
```

### Initialize

```bash
opendocuments init
```

The interactive setup wizard will:
1. Detect your system specs (CPU, RAM, OS)
2. Ask you to choose a model backend (local Ollama or cloud provider)
3. Recommend the optimal LLM model based on your hardware
4. Let you pick a plugin preset (Developer / Enterprise / All / Custom)
5. Select a RAG profile (fast / balanced / precise)
6. Generate `opendocuments.config.ts`

### Start

```bash
opendocuments start
```

Open **http://localhost:3000** in your browser. You'll see the Web UI with:
- Chat interface with SSE streaming
- Document management with drag-and-drop upload
- Connector management
- Admin dashboard with search quality metrics

### Index Documents

```bash
# Index a directory (recursively finds supported files)
opendocuments index ./docs

# Index with file watching (auto-reindex on changes)
opendocuments index ./docs --watch

# Force re-index even if unchanged
opendocuments index ./docs --reindex
```

### Ask Questions

```bash
# Single question (streaming output)
opendocuments ask "How does authentication work in our API?"

# With specific RAG profile
opendocuments ask "2024년 예산 현황" --profile precise

# JSON output for scripting
opendocuments ask "List all API endpoints" --json

# Interactive REPL mode
opendocuments ask
# > Type questions interactively, /quit to exit

# Search without LLM generation (vector search only)
opendocuments search "Redis configuration"
```

### Use as MCP Server

For **Claude Code**, **Cursor**, or any MCP-compatible AI tool:

```bash
opendocuments start --mcp-only
```

Or add to your MCP config:

```json
{
  "mcpServers": {
    "opendocuments": {
      "command": "opendocuments",
      "args": ["start", "--mcp-only"]
    }
  }
}
```

**19 MCP tools available:** ask, search, index, document management, connector sync, workspace switching, config, stats, doctor, and more.

---

## Architecture

```
opendocuments/
├── packages/
│   ├── core/          # Business logic: plugin system, RAG engine, ingest pipeline, storage
│   ├── server/        # HTTP API (Hono), SSE streaming, MCP server, auth middleware
│   ├── cli/           # CLI binary with 17 commands
│   ├── web/           # React SPA (Vite + Tailwind) with 7 pages
│   └── client/        # TypeScript SDK (@opendocuments/client)
│
├── plugins/
│   ├── model-*        # LLM providers (5): Ollama, OpenAI, Anthropic, Google, Grok
│   ├── parser-*       # File parsers (9): PDF, DOCX, XLSX, HTML, Jupyter, Email, Code, PPTX, Structured
│   └── connector-*    # Data sources (8): GitHub, Notion, GDrive, S3, Confluence, Swagger, WebCrawler, WebSearch
│
├── docs-site/         # VitePress documentation
├── Dockerfile         # Production Docker image
└── docker-compose.yml # Docker Compose with optional Ollama
```

### Design Principles

1. **Plugin Registry is central** -- parsers, connectors, models, and middleware all register through the same interface
2. **Storage Layer abstraction** -- SQLite + LanceDB by default; PostgreSQL + Qdrant for production (config switch)
3. **Server is thin** -- all business logic in `@opendocuments/core`; server handles protocol translation only
4. **Config as Code** -- `opendocuments.config.ts` is the single source of truth, version-controllable via git
5. **Event-driven** -- typed event bus decouples components; plugins communicate through events

---

## Supported File Formats

| Format | Extension | Parser | Notes |
|--------|-----------|--------|-------|
| Markdown | `.md`, `.mdx` | Built-in | Code-fence aware, heading hierarchy |
| Plain Text | `.txt` | Built-in | |
| PDF | `.pdf` | `@opendocuments/parser-pdf` | Page-level chunking, OCR fallback |
| Word | `.docx` | `@opendocuments/parser-docx` | HTML conversion, heading detection |
| Excel/CSV | `.xlsx`, `.xls`, `.csv` | `@opendocuments/parser-xlsx` | Sheet-aware, table chunking |
| HTML | `.html`, `.htm` | `@opendocuments/parser-html` | Strips nav/scripts, preserves structure |
| Jupyter | `.ipynb` | `@opendocuments/parser-jupyter` | Markdown + code cells separated |
| Email | `.eml` | `@opendocuments/parser-email` | Headers + body extraction |
| Source Code | `.js`, `.ts`, `.py`, `.java`, `.go`, `.rs`, etc. | `@opendocuments/parser-code` | Function/class-level chunking, import extraction |
| PowerPoint | `.pptx` | `@opendocuments/parser-pptx` | Slide-level chunking |
| Structured | `.json`, `.yaml`, `.yml`, `.toml` | Built-in | Config/schema indexing |
| Archive | `.zip` | Built-in | Placeholder (extract support planned) |

**Parser Fallback Chain:** Configure fallback parsers in `opendocuments.config.ts`:

```typescript
parserFallbacks: {
  '.hwp': ['@opendocuments/parser-hwp', '@opendocuments/parser-libreoffice', '@opendocuments/parser-ocr'],
  '.pdf': ['@opendocuments/parser-pdf', '@opendocuments/parser-ocr'],
}
```

---

## Data Sources (Connectors)

| Source | Plugin | Auth | Sync |
|--------|--------|------|------|
| **Local Directory** | Built-in | None | File watch (`--watch`) |
| **File Upload** | Built-in | None | Drag & drop in Web UI |
| **GitHub** | `@opendocuments/connector-github` | Personal Access Token | Webhook/polling |
| **Notion** | `@opendocuments/connector-notion` | Integration Token | Polling |
| **Google Drive** | `@opendocuments/connector-gdrive` | OAuth / Service Account | Polling |
| **S3 / GCS** | `@opendocuments/connector-s3` | AWS/GCP credentials | Polling |
| **Confluence** | `@opendocuments/connector-confluence` | API Token + Email | Polling |
| **Swagger/OpenAPI** | `@opendocuments/connector-swagger` | None (public specs) | Manual trigger |
| **Web Crawler** | `@opendocuments/connector-web-crawler` | Optional (cookies/headers) | Periodic |
| **Web Search** | `@opendocuments/connector-web-search` | Tavily API Key | Real-time (query-time) |

### Connector Configuration

```typescript
// opendocuments.config.ts
export default defineConfig({
  connectors: [
    { type: 'github', repo: 'org/repo', token: process.env.GITHUB_TOKEN, branch: 'main' },
    { type: 'notion', token: process.env.NOTION_TOKEN },
    { type: 'gdrive', accessToken: process.env.GDRIVE_ACCESS_TOKEN, folderId: 'folder-id' },
    { type: 'web-crawler', urls: ['https://docs.example.com'], syncInterval: 3600 },
  ],
})
```

---

## Model Providers

| Provider | LLM | Embedding | Vision | Plugin |
|----------|-----|-----------|--------|--------|
| **Ollama** (local) | Qwen, Llama, Gemma, EXAONE, etc. | BGE-M3 | Via Vision models | `@opendocuments/model-ollama` |
| **OpenAI** | GPT-4o, GPT-4.1 | text-embedding-3-small | GPT-4o Vision | `@opendocuments/model-openai` |
| **Anthropic** | Claude Sonnet/Opus | -- (use separate provider) | Claude Vision | `@opendocuments/model-anthropic` |
| **Google** | Gemini 2.5 Flash/Pro | text-embedding-004 | Gemini Vision | `@opendocuments/model-google` |
| **Grok** (xAI) | Grok-3 | Grok embedding | -- | `@opendocuments/model-grok` |

### Model Configuration

```typescript
export default defineConfig({
  model: {
    provider: 'ollama',           // or 'openai', 'anthropic', 'google', 'grok'
    llm: 'qwen2.5:14b',          // model name
    embedding: 'bge-m3',         // embedding model
    // For cloud providers:
    apiKey: process.env.OPENAI_API_KEY,
    // For Anthropic (no embedding API -- use separate provider):
    embeddingProvider: 'openai',
    embeddingApiKey: process.env.OPENAI_API_KEY,
  },
})
```

### Auto-Recommendation

`opendocuments init` detects your system specs and recommends:

| RAM | Recommended LLM | Recommended Embedding |
|-----|-----------------|----------------------|
| 32GB+ | Qwen 2.5 14B (Vision) | BGE-M3 |
| 16GB+ | Qwen 2.5 7B | BGE-M3 |
| <16GB | Gemma 3 4B | nomic-embed-text |

---

## RAG Engine

### Pipeline

```
Query → L1 Cache Check → Intent Classification → Route
  ↓ (if RAG)
  → Query Decomposition (precise profile)
  → Cross-Lingual Expansion (ko↔en)
  → Hybrid Search (Dense vectors + FTS5 sparse)
  → RRF Merge
  → Reranking (keyword overlap + model-based)
  → Context Window Fitting
  → Confidence Scoring
  → LLM Generation (intent-specific prompts)
  → Hallucination Guard (source grounding check)
  → L1 Cache Store → Return
```

### RAG Profiles

| Setting | `fast` | `balanced` | `precise` |
|---------|--------|------------|-----------|
| Search depth (k) | 10 | 20 | 50 |
| Min similarity | 0.5 | 0.3 | 0.15 |
| Final results | 3 | 5 | 10 |
| Context tokens | 2048 | 4096 | 8192 |
| Reranker | Off | On | On |
| Cross-lingual | Off | On | On |
| Query decomposition | Off | Off | On |
| Web search | Off | Fallback | Always |
| Hallucination guard | Off | On | Strict |
| Best for | Low-spec, 8B models | General use | High-spec, cloud API |

Switch profiles in CLI (`--profile fast`), Web UI (toggle in chat), or config.

### Intent Classification

Queries are automatically classified into: `code`, `concept`, `config`, `data`, `search`, `compare`, or `general`. Each intent uses an optimized prompt template for the best answer format.

### Confidence Scoring

Every answer includes a confidence score (high/medium/low/none) based on:
- Retrieval similarity scores (40%)
- Reranking scores (30%)
- Source document count (15%)
- Query keyword coverage (15%)

Low-confidence answers honestly admit when the context is insufficient.

---

## Security & Authentication

### Personal Mode (default)

No authentication required. Single workspace. Localhost only. Perfect for individual use.

### Team Mode

Enable in config: `mode: 'team'`

| Feature | Description |
|---------|-------------|
| **API Keys** | `od_live_` prefixed, SHA-256 hashed, scoped permissions, expiration |
| **Roles** | `admin` (all), `member` (read/write), `viewer` (read-only) |
| **Rate Limiting** | 60 req/min default, per-key override |
| **PII Redaction** | Auto-mask email, phone, credit card, IP, custom patterns |
| **Audit Logging** | auth:login, auth:failed, document:accessed, config:changed |
| **Security Alerts** | Brute-force detection, unusual export, API abuse |
| **OAuth** | Google and GitHub SSO (HttpOnly cookie session) |
| **Workspace Isolation** | Vector search enforced with workspace_id filter |

### API Key Management

```bash
opendocuments auth create-key --name "CI Bot" --role member
# Output: od_live_a1b2c3... (shown once, never stored in plaintext)

opendocuments auth list-keys
opendocuments auth revoke-key "CI Bot"
```

### PII Redaction Configuration

```typescript
security: {
  dataPolicy: {
    autoRedact: {
      enabled: true,
      patterns: ['email', 'phone', 'credit-card', 'ip-address'],
      method: 'replace',       // 'replace' | 'hash' | 'remove'
      replacement: '[REDACTED]',
    },
  },
}
```

---

## Web UI

### Pages

| Page | Features |
|------|----------|
| **Chat** | SSE streaming, markdown rendering, source citations, confidence badges, answer feedback (thumbs up/down), profile toggle, source filter |
| **Documents** | Document list with status, drag-and-drop upload, document detail with metadata, soft delete with trash/restore |
| **Connectors** | Connector status, last sync time |
| **Plugins** | Installed plugins with health indicators |
| **Workspaces** | Workspace list |
| **Settings** | Theme (system/light/dark), RAG profile, version info |
| **Admin** | Stats cards, search quality metrics, query log viewer, plugin health, connector status |

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + K` | Open Command Palette |
| `Cmd/Ctrl + 1-5` | Navigate to page (Chat/Documents/Connectors/Settings/Admin) |
| `Escape` | Close Command Palette |
| `Enter` | Send message / execute command |

---

## CLI Reference

### Core Commands

```bash
opendocuments init                    # Interactive setup wizard with system detection
opendocuments start                   # Start server (Web UI + REST API + MCP)
opendocuments start --mcp-only        # MCP server only (stdio for Claude Code/Cursor)
opendocuments start --no-web          # API + MCP only, no Web UI
opendocuments start --port 8080       # Custom port
opendocuments stop                    # Stop running server
opendocuments doctor                  # System health diagnostics
opendocuments upgrade                 # Upgrade to latest version
```

### Query & Search

```bash
opendocuments ask "question"          # Ask with streaming output
opendocuments ask "question" --profile precise
opendocuments ask "question" --json   # JSON output for scripting
opendocuments ask                     # Interactive REPL mode
opendocuments search "keyword" --top 10  # Vector search without LLM
```

### Document Management

```bash
opendocuments index ./docs            # Index files/directory (recursive)
opendocuments index ./docs --watch    # Watch for file changes
opendocuments index ./docs --reindex  # Force re-index
opendocuments document list           # List indexed documents
opendocuments document get <id>       # Document details
opendocuments document delete <id>    # Soft delete (trash)
opendocuments document restore <id>   # Restore from trash
opendocuments document trash          # View trash
```

### Connector Management

```bash
opendocuments connector list          # List registered connectors
opendocuments connector sync          # Sync all connectors
opendocuments connector sync <name>   # Sync specific connector
opendocuments connector status        # Show sync status
opendocuments connector add <type>    # Configuration guidance
opendocuments connector remove <name> # Remove guidance
```

### Authentication

```bash
opendocuments auth create-key --name "key-name" --role admin
opendocuments auth list-keys
opendocuments auth revoke-key "key-name"
opendocuments auth login              # Interactive API key login
```

### Plugin Management

```bash
opendocuments plugin list             # List with health status
opendocuments plugin create my-parser --type parser  # Scaffold plugin
opendocuments plugin test             # Run plugin tests
opendocuments plugin dev              # Watch mode development
opendocuments plugin publish          # Publish to npm
opendocuments plugin add <name>       # Install from npm
opendocuments plugin remove <name>    # Uninstall
opendocuments plugin search <query>   # Search npm registry
opendocuments plugin update           # Update all plugins
```

### Workspace Management

```bash
opendocuments workspace list
opendocuments workspace create <name> --mode team
opendocuments workspace switch <name>
opendocuments workspace delete <name>
```

### Configuration & Data

```bash
opendocuments config                  # Show full config
opendocuments config rag.profile      # Show specific key
opendocuments config edit             # Open in $EDITOR
opendocuments config reset            # Reset to defaults
opendocuments export --output ./backup  # Export data
opendocuments import ./backup         # Import from backup
opendocuments completion install      # Install shell completions (zsh/bash)
```

---

## REST API

Base URL: `http://localhost:3000/api/v1`

### Chat

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/chat` | Ask a question (non-streaming) |
| `POST` | `/chat/stream` | Ask with SSE streaming |
| `POST` | `/chat/feedback` | Submit answer feedback |

### Documents

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/documents` | List all documents |
| `GET` | `/documents/:id` | Get document details |
| `POST` | `/documents/upload` | Upload file (multipart) |
| `DELETE` | `/documents/:id` | Soft delete |
| `POST` | `/documents/:id/restore` | Restore from trash |
| `GET` | `/documents/trash` | List deleted documents |

### Tags & Collections

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET/POST/DELETE` | `/tags` | Tag CRUD |
| `POST/DELETE` | `/documents/:docId/tags/:tagId` | Tag/untag document |
| `GET/POST/DELETE` | `/collections` | Collection CRUD |
| `POST` | `/collections/:id/documents/:docId` | Add to collection |

### Conversations

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/conversations` | List conversations |
| `POST` | `/conversations` | Create conversation |
| `GET` | `/conversations/:id/messages` | Get messages |
| `PATCH` | `/conversations/:id` | Update title |
| `DELETE` | `/conversations/:id` | Delete |
| `POST` | `/conversations/:id/share` | Generate share link |

### Admin (requires admin role in team mode)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/admin/stats` | Indexing statistics |
| `GET` | `/admin/search-quality` | Search quality metrics |
| `GET` | `/admin/query-logs` | Paginated query logs |
| `GET` | `/admin/plugins` | Plugin health & metrics |
| `GET` | `/admin/connectors` | Connector status |
| `GET` | `/admin/audit-logs` | Audit event log |
| `GET` | `/workspaces` | List workspaces |

### Health

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Server health |
| `GET` | `/stats` | Quick stats |

### Authentication (OAuth)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/auth/login/:provider` | Start OAuth flow (google/github) |
| `GET` | `/auth/callback/:provider` | OAuth callback |

---

## MCP Server

**19 tools** available when running as MCP server:

| Tool | Description |
|------|-------------|
| `opendocuments_ask` | Ask a question about indexed documents |
| `opendocuments_search` | Vector search (no LLM generation) |
| `opendocuments_index_path` | Index local file/directory |
| `opendocuments_index_status` | Get indexing status |
| `opendocuments_document_list` | List indexed documents |
| `opendocuments_document_get` | Get document details |
| `opendocuments_document_delete` | Soft delete document |
| `opendocuments_document_reindex` | Mark for re-indexing |
| `opendocuments_connector_list` | List connectors |
| `opendocuments_connector_sync` | Trigger connector sync |
| `opendocuments_plugin_list` | List installed plugins |
| `opendocuments_plugin_add` | Install plugin guidance |
| `opendocuments_plugin_remove` | Remove plugin guidance |
| `opendocuments_workspace_list` | List workspaces |
| `opendocuments_workspace_switch` | Switch workspace info |
| `opendocuments_config_get` | Read configuration |
| `opendocuments_config_set` | Config guidance |
| `opendocuments_stats` | System statistics |
| `opendocuments_doctor` | Health diagnostics |

**MCP Resources:** `opendocuments://documents`, `opendocuments://stats`

---

## Configuration

### `opendocuments.config.ts`

```typescript
import { defineConfig } from '@opendocuments/core'

export default defineConfig({
  // Project
  workspace: 'my-team',
  mode: 'personal',                    // 'personal' | 'team'

  // Model
  model: {
    provider: 'ollama',                // 'ollama' | 'openai' | 'anthropic' | 'google' | 'grok'
    llm: 'qwen2.5:14b',
    embedding: 'bge-m3',
    apiKey: process.env.OPENAI_API_KEY,
  },

  // RAG
  rag: {
    profile: 'balanced',               // 'fast' | 'balanced' | 'precise' | 'custom'
    custom: {
      retrieval: { k: 20, minScore: 0.3, finalTopK: 5 },
      context: { maxTokens: 4096, historyMaxTokens: 1024 },
    },
  },

  // Connectors
  connectors: [
    { type: 'github', repo: 'org/repo', token: process.env.GITHUB_TOKEN },
    { type: 'notion', token: process.env.NOTION_TOKEN },
  ],

  // Plugins
  plugins: [
    '@opendocuments/parser-pdf',
    '@opendocuments/parser-docx',
    '@opendocuments/connector-github',
  ],

  // Parser Fallbacks
  parserFallbacks: {
    '.pdf': ['@opendocuments/parser-pdf', '@opendocuments/parser-ocr'],
  },

  // Security
  security: {
    dataPolicy: {
      allowCloudProcessing: true,
      autoRedact: { enabled: true, patterns: ['email', 'phone'] },
    },
    audit: { enabled: true },
  },

  // Storage
  storage: {
    db: 'sqlite',                      // 'sqlite' | 'postgres'
    vectorDb: 'lancedb',               // 'lancedb' | 'qdrant'
    dataDir: '~/.opendocuments',
  },

  // UI
  ui: { locale: 'auto', theme: 'auto' },

  // Telemetry (opt-in)
  telemetry: { enabled: false },
})
```

---

## Docker Deployment

### Quick Start with Docker

```bash
docker compose up -d
```

### With Ollama (local LLM)

```bash
docker compose --profile with-ollama up -d
```

### docker-compose.yml

```yaml
services:
  opendocuments:
    build: .
    ports: ["3000:3000"]
    volumes: ["opendocuments-data:/data"]
    environment:
      - OPENDOCUMENTS_DATA_DIR=/data
      - NODE_ENV=production

  ollama:  # Optional
    image: ollama/ollama:latest
    ports: ["11434:11434"]
    volumes: ["ollama_models:/root/.ollama"]
    profiles: ["with-ollama"]

volumes:
  opendocuments-data:
  ollama_models:
```

---

## Plugin Development

### Create a Plugin

```bash
opendocuments plugin create my-parser --type parser
cd my-parser
npm install
npm run test
npm run dev    # Watch mode
```

### Plugin Types

| Type | Interface | Purpose |
|------|-----------|---------|
| `parser` | `ParserPlugin` | Convert file formats to text chunks |
| `connector` | `ConnectorPlugin` | Fetch documents from external sources |
| `model` | `ModelPlugin` | LLM, embedding, and reranker providers |
| `middleware` | `MiddlewarePlugin` | Hook into pipeline stages |

### Plugin Interface Example (Parser)

```typescript
import type { ParserPlugin, RawDocument, ParsedChunk } from '@opendocuments/core'

export class MyParser implements ParserPlugin {
  name = 'my-parser'
  type = 'parser' as const
  version = '0.1.0'
  coreVersion = '^0.1.0'
  supportedTypes = ['.xyz']

  async setup(ctx) {}

  async *parse(raw: RawDocument): AsyncIterable<ParsedChunk> {
    const content = typeof raw.content === 'string' ? raw.content : raw.content.toString('utf-8')
    yield { content, chunkType: 'semantic', headingHierarchy: [] }
  }
}

export default MyParser
```

### Publishing

```bash
opendocuments plugin publish    # npm publish
```

Community plugins follow the naming convention: `opendocuments-plugin-*`

---

## TypeScript SDK

```typescript
import { OpenDocumentsClient } from '@opendocuments/client'

const client = new OpenDocumentsClient({
  baseUrl: 'http://localhost:3000',
  apiKey: 'od_live_...',   // optional, for team mode
})

const result = await client.ask('How does auth work?')
console.log(result.answer)
console.log(result.sources)
console.log(result.confidence)

const docs = await client.listDocuments()
const stats = await client.getStats()
```

---

## Embeddable Widget

Add the OpenDocuments chat widget to any website:

```html
<script src="http://localhost:3000/widget.js"></script>
<script>
  OpenDocuments.widget({
    server: 'http://localhost:3000',
    apiKey: 'od_live_...',       // for team mode
    workspace: 'public-docs',
  })
</script>
```

---

## Development

### Prerequisites

- Node.js 20+
- npm 10+

### Setup

```bash
git clone https://github.com/joungminsung/OpenDocuments.git
cd OpenDocuments
npm run setup    # Install dependencies + build all packages
```

### Commands

```bash
npm run build    # Build all packages (Turborepo)
npm run test     # Run all tests (51 test suites)
npm run dev      # Development mode (watch)
```

### Project Structure

```
packages/
  core/       # 159 tests -- Plugin system, RAG engine, ingest pipeline, storage
  server/     # 27 tests  -- HTTP API, MCP server, auth middleware
  cli/        # 3 tests   -- 17 CLI commands
  web/        #            -- React SPA with 7 pages
  client/     # 3 tests   -- TypeScript SDK

plugins/
  model-*/      # 41 tests -- 5 LLM providers
  parser-*/     # 37 tests -- 9 file format parsers
  connector-*/  # 38 tests -- 8 data source connectors
```

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js (TypeScript) |
| Monorepo | Turborepo + npm workspaces |
| HTTP | Hono |
| Database | SQLite (better-sqlite3) + FTS5 |
| Vector DB | LanceDB (embedded) |
| Frontend | React 19 + Vite 6 + Tailwind CSS |
| State | Zustand |
| Config | Zod + jiti |
| Testing | Vitest |
| MCP | @modelcontextprotocol/sdk |
| CI/CD | GitHub Actions + Changesets |

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup, coding conventions, and PR guidelines.

## License

[MIT](LICENSE)
