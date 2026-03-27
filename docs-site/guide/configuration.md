# Configuration

OpenDocs is configured via `opendocs.config.ts`:

```typescript
import { defineConfig } from '@opendocs/core'

export default defineConfig({
  workspace: 'my-team',
  mode: 'personal',
  model: { provider: 'ollama', llm: 'qwen2.5:14b', embedding: 'bge-m3' },
  rag: { profile: 'balanced' },
  storage: { db: 'sqlite', vectorDb: 'lancedb', dataDir: '~/.opendocs' },
})
```
