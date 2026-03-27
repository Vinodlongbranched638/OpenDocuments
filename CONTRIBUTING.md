# Contributing to OpenDocuments

OpenDocuments에 기여해 주셔서 감사합니다! 이 문서는 프로젝트에 기여하기 위한 전체 가이드입니다.

---

## Table of Contents

- [개발 환경 설정](#개발-환경-설정)
- [프로젝트 구조 이해](#프로젝트-구조-이해)
- [기여 워크플로우](#기여-워크플로우)
- [코드 컨벤션](#코드-컨벤션)
- [테스트 작성 가이드](#테스트-작성-가이드)
- [플러그인 개발 가이드](#플러그인-개발-가이드)
- [커밋 메시지 컨벤션](#커밋-메시지-컨벤션)
- [PR 가이드](#pr-가이드)
- [이슈 리포팅](#이슈-리포팅)
- [릴리즈 프로세스](#릴리즈-프로세스)

---

## 개발 환경 설정

### 필수 요구사항

- **Node.js** 20 이상
- **npm** 10 이상
- **Git**

### 셋업

```bash
# 1. 레포지토리 클론
git clone https://github.com/joungminsung/OpenDocuments.git
cd OpenDocuments

# 2. 의존성 설치 + 빌드 (one-command)
npm run setup

# 3. 테스트 실행 (51개 test suite)
npm run test

# 4. 개발 모드 (watch)
npm run dev
```

### 주요 스크립트

| 명령어 | 설명 |
|--------|------|
| `npm run setup` | 의존성 설치 + 전체 빌드 |
| `npm run build` | 전체 패키지 빌드 (Turborepo) |
| `npm run test` | 전체 테스트 실행 |
| `npm run dev` | 전체 패키지 watch 모드 |
| `npx turbo build --filter=@opendocuments/core` | 특정 패키지만 빌드 |
| `npx turbo test --filter=@opendocuments/core` | 특정 패키지만 테스트 |

### Ollama 없이 개발하기

모델 플러그인 (Ollama, OpenAI 등)이 설치되어 있지 않아도 개발할 수 있습니다. Bootstrap이 자동으로 **stub 모델**로 fallback하므로 인덱싱과 검색의 기본 흐름은 정상 동작합니다. Stub 모델은 제로 벡터 임베딩과 placeholder 텍스트를 반환합니다.

```
[!!] Model plugin @opendocuments/model-ollama embed probe failed. Using stub models.
```

이 메시지는 정상입니다. 실제 LLM 응답이 필요한 기능을 개발할 때만 Ollama 설치가 필요합니다.

---

## 프로젝트 구조 이해

```
OpenDocuments/
├── packages/                   # 코어 패키지 (5개)
│   ├── core/                   # 비즈니스 로직 전체 (플러그인, RAG, 인제스트, 스토리지)
│   │   ├── src/
│   │   │   ├── auth/           # API Key 관리, OAuth
│   │   │   ├── config/         # Zod 스키마, 설정 로더 (jiti)
│   │   │   ├── connector/      # ConnectorManager (커넥터 오케스트레이션)
│   │   │   ├── conversation/   # 대화 히스토리 관리
│   │   │   ├── document/       # 버전관리, 태그, 컬렉션, 청크 관계
│   │   │   ├── events/         # 타입드 EventBus (18개 이벤트)
│   │   │   ├── ingest/         # 파이프라인 (parse→chunk→embed→store), 청커, 문서 스토어
│   │   │   ├── parsers/        # 빌트인 파서 (Markdown, PlainText, Structured, Archive)
│   │   │   ├── plugin/         # 플러그인 레지스트리, 로더, 호환성 검사
│   │   │   ├── rag/            # RAG 엔진, 리트리버, 제너레이터, 프로필, 캐시, 의도분류, 리랭킹, 할루시네이션가드
│   │   │   ├── security/       # PII 마스킹, 감사 로그, 보안 알림
│   │   │   ├── storage/        # DB 추상화 (SQLite), VectorDB 추상화 (LanceDB), 마이그레이션
│   │   │   ├── telemetry/      # 텔레메트리 수집기
│   │   │   ├── utils/          # 로거, 해시, fetchWithTimeout, 파일 탐색, 파일 워치
│   │   │   └── workspace/      # 워크스페이스 CRUD
│   │   └── tests/              # 31개 테스트 파일, 159개 테스트
│   │
│   ├── server/                 # HTTP 서버 (Hono), MCP 서버, 인증 미들웨어
│   │   ├── src/
│   │   │   ├── bootstrap.ts    # 전체 컴포넌트 초기화 오케스트레이터
│   │   │   ├── http/
│   │   │   │   ├── app.ts      # Hono 앱 (CORS, auth, rate limit, static serving)
│   │   │   │   ├── middleware/  # auth.ts (API Key/OAuth), rate-limit.ts
│   │   │   │   └── routes/     # 9개 라우트 파일 (35개 엔드포인트)
│   │   │   ├── mcp/            # MCP 서버 (19개 도구, 2개 리소스)
│   │   │   └── widget/         # 임베더블 채팅 위젯
│   │   └── tests/              # 7개 테스트 파일, 27개 테스트
│   │
│   ├── cli/                    # CLI 바이너리 (Commander.js)
│   │   └── src/commands/       # 17개 커맨드 파일
│   │
│   ├── web/                    # React SPA (Vite + Tailwind)
│   │   └── src/
│   │       ├── components/     # 7개 페이지 (Chat, Documents, Connectors, Plugins, Workspaces, Settings, Admin)
│   │       ├── stores/         # Zustand (appStore, chatStore)
│   │       └── lib/            # API 클라이언트, SSE 헬퍼, i18n, 타입
│   │
│   └── client/                 # TypeScript SDK (@opendocuments/client)
│
├── plugins/                    # 플러그인 (21개)
│   ├── model-*/                # LLM 프로바이더 (5): Ollama, OpenAI, Anthropic, Google, Grok
│   ├── parser-*/               # 파서 (9): PDF, DOCX, XLSX, HTML, Jupyter, Email, Code, PPTX, Structured
│   └── connector-*/            # 커넥터 (8): GitHub, Notion, GDrive, S3, Confluence, Swagger, WebCrawler, WebSearch
│
├── docs-site/                  # VitePress 문서 사이트
├── templates/                  # 플러그인 스캐폴딩 템플릿
├── benchmarks/                 # RAG 품질 벤치마크 (미구현)
├── Dockerfile                  # 프로덕션 Docker 이미지
└── docker-compose.yml          # Docker Compose (+ 선택적 Ollama)
```

### 핵심 원칙

1. **`@opendocuments/core`에 비즈니스 로직 집중** -- server는 프로토콜 변환만 담당
2. **모든 확장은 플러그인으로** -- 파서, 커넥터, 모델, 미들웨어 모두 동일한 플러그인 인터페이스
3. **Config as Code** -- `opendocuments.config.ts`가 single source of truth
4. **이벤트 기반 디커플링** -- 컴포넌트 간 직접 호출 대신 EventBus 사용
5. **Storage 추상화** -- SQLite/LanceDB는 인터페이스 뒤에 숨김, 설정만 바꾸면 전환 가능

---

## 기여 워크플로우

### 1. 이슈 확인 또는 생성

- 기존 이슈를 확인하거나 새 이슈를 생성합니다
- `good first issue` 라벨이 붙은 이슈는 처음 기여하기 좋습니다
- 큰 변경은 먼저 이슈에서 논의해 주세요

### 2. 브랜치 생성

```bash
git checkout main
git pull origin main
git checkout -b feat/my-feature    # 기능
git checkout -b fix/my-bugfix      # 버그 수정
git checkout -b docs/my-docs       # 문서
```

### 3. 개발

```bash
# 변경한 패키지만 빌드/테스트
npx turbo build --filter=@opendocuments/core
npx turbo test --filter=@opendocuments/core

# 또는 전체
npm run build
npm run test
```

### 4. Changeset 생성

버전에 영향을 주는 변경은 changeset을 생성해야 합니다:

```bash
npx changeset
```

프롬프트에서:
- 변경된 패키지 선택 (스페이스바로 토글)
- 변경 유형 선택: `patch` (버그 수정) / `minor` (기능 추가) / `major` (브레이킹 변경)
- 변경 설명 작성

이렇게 하면 `.changeset/` 디렉토리에 마크다운 파일이 생성됩니다. **이 파일도 커밋에 포함하세요.**

### 5. PR 제출

```bash
git add -A
git commit -m "feat(core): add my feature"
git push origin feat/my-feature
```

GitHub에서 Pull Request를 생성합니다. PR 템플릿을 따라 작성해 주세요.

### 6. CI 확인

PR을 올리면 GitHub Actions가 자동으로 실행됩니다:
- `npm ci` (의존성 설치)
- `npx turbo build` (전체 빌드)
- `npx turbo typecheck` (타입 체크)
- `npx turbo test` (전체 테스트)

Node.js 20과 22 두 버전에서 실행됩니다. **CI가 통과해야 머지 가능합니다.**

---

## 코드 컨벤션

### TypeScript

- **strict 모드** 필수 (`tsconfig.base.json`에 `"strict": true`)
- **ESM 모듈** (`"type": "module"` in package.json)
- import 경로에 `.js` 확장자 필수 (ESM 요구사항)
  ```typescript
  // Good
  import { sha256 } from './utils/hash.js'

  // Bad
  import { sha256 } from './utils/hash'
  ```
- `any` 타입 최소화 -- `unknown` 또는 적절한 타입 사용
  ```typescript
  // Good
  const data = await res.json() as { items: string[] }

  // Bad
  const data = await res.json() as any
  ```
- 공개 API에는 JSDoc 작성

### 네이밍

| 대상 | 컨벤션 | 예시 |
|------|--------|------|
| 파일 | kebab-case | `document-store.ts` |
| 클래스 | PascalCase | `DocumentStore` |
| 함수/변수 | camelCase | `getDocumentBySourcePath` |
| 인터페이스/타입 | PascalCase | `PluginContext` |
| 상수 | UPPER_SNAKE_CASE | `MAX_ALERTS` |
| DB 컬럼 | snake_case | `workspace_id` |
| 환경 변수 | UPPER_SNAKE_CASE | `OPENDOCUMENTS_DATA_DIR` |

### CLI 출력

- **이모지 금지** -- ANSI 심볼만 사용
- `@opendocuments/core`의 `log` 유틸리티 사용:
  ```typescript
  import { log } from '@opendocuments/core'

  log.ok('Operation succeeded')       // [ok] 초록색
  log.fail('Operation failed')        // [!!] 빨간색
  log.info('Information')             // [--] 파란색
  log.arrow('Next step')              // [->] 시안색
  log.wait('Processing...')           // [..] 노란색
  log.heading('Section Title')        // 볼드 흰색 + 구분선
  log.dim('Secondary info')           // 회색
  ```

### 에러 처리

- **핵심 경로에서 에러 삼키지 않기** -- 최소한 로깅
- **사용자 대면 에러는 actionable하게** -- "무엇이 잘못됐고 어떻게 해결하는지"
- **프로덕션에서 내부 정보 노출 금지**:
  ```typescript
  // Good
  return c.json({ error: 'Document not found' }, 404)

  // Bad (내부 정보 노출)
  return c.json({ error: err.stack }, 500)
  ```

### 보안

- **API 키를 코드에 하드코딩 금지** -- 환경 변수 사용
- **SQL 쿼리는 파라미터화** -- `?` placeholder 사용
- **LanceDB 필터는 `buildWhereClause()` 사용** -- raw string 금지
- **FTS5 쿼리는 `escapeFTS5Query()` 사용** -- 사용자 입력 직접 전달 금지
- **새 엔드포인트는 인증 필요 여부 확인** -- 팀 모드에서 보호되는지

---

## 테스트 작성 가이드

### 테스트 프레임워크

- **Vitest** 사용 (Jest 호환 API)
- 테스트 파일 위치: `tests/` 디렉토리 (각 패키지 내)
- 파일 네이밍: `*.test.ts`
- globals 활성화 (`describe`, `it`, `expect`, `vi` 별도 import 불필요)

### 테스트 구조

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

describe('MyModule', () => {
  let db: DB

  beforeEach(() => {
    db = createSQLiteDB(':memory:')
    runMigrations(db)
  })

  afterEach(() => {
    db.close()
  })

  it('does something specific', () => {
    // Arrange
    const input = 'test'

    // Act
    const result = myFunction(input)

    // Assert
    expect(result).toBe('expected')
  })
})
```

### 테스트 원칙

1. **실제 SQLite 사용** -- `:memory:` 모드로 인메모리 DB 생성
2. **실제 LanceDB 사용** -- 임시 디렉토리 생성, afterEach에서 정리
3. **외부 API는 mock** -- `vi.stubGlobal('fetch', vi.fn())` 사용
4. **각 테스트 독립적** -- 공유 상태 금지, beforeEach에서 초기화
5. **happy path + error path** 모두 테스트
6. **리소스 정리 필수** -- DB close, temp dir 삭제

### LanceDB 테스트 패턴

```typescript
import { mkdtempSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

let tempDir: string
let vectorDb: VectorDB

beforeEach(async () => {
  tempDir = mkdtempSync(join(tmpdir(), 'opendocuments-test-'))
  vectorDb = await createLanceDB(tempDir)
  await vectorDb.ensureCollection('test', 3)
})

afterEach(async () => {
  await vectorDb.close()
  rmSync(tempDir, { recursive: true, force: true })
})
```

### 외부 API Mock 패턴

```typescript
// Mock fetch globally
vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
  ok: true,
  json: async () => ({ data: 'test' }),
}))

// Clean up after test
afterEach(() => vi.unstubAllGlobals())
```

### fetchWithTimeout Mock 패턴 (플러그인)

```typescript
vi.mock('@opendocuments/core', async () => {
  const actual = await vi.importActual('@opendocuments/core')
  return { ...actual, fetchWithTimeout: vi.fn() }
})

import { fetchWithTimeout } from '@opendocuments/core'

// In test:
;(fetchWithTimeout as any).mockResolvedValue({ ok: true, json: async () => ({}) })
```

---

## 플러그인 개발 가이드

### 플러그인 생성

```bash
opendocuments plugin create my-parser --type parser
cd my-parser
npm install
```

생성되는 파일:
```
my-parser/
├── package.json          # peerDependency: @opendocuments/core ^0.1.0
├── tsconfig.json
├── vitest.config.ts
├── src/
│   └── index.ts          # 플러그인 구현 (타입별 보일러플레이트)
├── tests/
│   └── index.test.ts     # 기본 테스트 (메타데이터, healthCheck)
└── README.md
```

### 플러그인 타입별 인터페이스

#### Parser (파서)

```typescript
interface ParserPlugin extends OpenDocsPlugin {
  type: 'parser'
  supportedTypes: string[]     // ['.pdf', '.docx']
  multimodal?: boolean
  parse(raw: RawDocument): AsyncIterable<ParsedChunk>
}
```

`parse`는 **AsyncIterable**을 반환해야 합니다 (`async function*` 사용).

#### Connector (커넥터)

```typescript
interface ConnectorPlugin extends OpenDocsPlugin {
  type: 'connector'
  discover(): AsyncIterable<DiscoveredDocument>
  fetch(docRef: DocumentRef): Promise<RawDocument>
  watch?(onChange: (event: ChangeEvent) => void): Promise<Disposable>
  auth?(): Promise<AuthResult>
}
```

#### Model (모델 프로바이더)

```typescript
interface ModelPlugin extends OpenDocsPlugin {
  type: 'model'
  capabilities: { llm?: boolean; embedding?: boolean; reranker?: boolean; vision?: boolean }
  generate?(prompt: string, opts?: GenerateOpts): AsyncIterable<string>
  embed?(texts: string[]): Promise<EmbeddingResult>
  rerank?(query: string, docs: string[]): Promise<RerankResult>
  describeImage?(image: Buffer): Promise<string>
}
```

#### Middleware (미들웨어)

```typescript
interface MiddlewarePlugin extends OpenDocsPlugin {
  type: 'middleware'
  hooks: {
    stage: PipelineStage    // 'before:parse' | 'after:chunk' | etc.
    handler: (data: unknown) => Promise<unknown>
  }[]
}
```

### 플러그인 공통 필수 필드

```typescript
{
  name: string              // '@opendocuments/parser-pdf' 또는 'opendocuments-plugin-my-plugin'
  type: PluginType          // 'parser' | 'connector' | 'model' | 'middleware'
  version: string           // semver
  coreVersion: string       // '^0.1.0' (호환 core 버전)

  setup(ctx: PluginContext): Promise<void>       // 초기화 (필수)
  teardown?(): Promise<void>                     // 정리 (선택)
  healthCheck?(): Promise<HealthStatus>          // 상태 진단 (권장)
  metrics?(): Promise<PluginMetrics>             // 메트릭 (선택)
}
```

### 네이밍 규칙

| 유형 | 공식 플러그인 | 커뮤니티 플러그인 |
|------|-------------|-----------------|
| 파서 | `@opendocuments/parser-<format>` | `opendocuments-plugin-parser-<format>` |
| 커넥터 | `@opendocuments/connector-<service>` | `opendocuments-plugin-connector-<service>` |
| 모델 | `@opendocuments/model-<provider>` | `opendocuments-plugin-model-<provider>` |
| 미들웨어 | `@opendocuments/middleware-<name>` | `opendocuments-plugin-middleware-<name>` |

### 개발 → 테스트 → 배포

```bash
# 개발 (watch 모드)
opendocuments plugin dev

# 테스트
opendocuments plugin test

# npm에 배포
opendocuments plugin publish
```

### HTTP 요청 시 주의사항

- **`fetchWithTimeout`을 `@opendocuments/core`에서 import해서 사용** -- 직접 `fetch` 호출 금지
- 타임아웃: healthCheck 10초, embed 30초, generate(streaming) 120초
- 에러 메시지에 API 키나 URL 크레덴셜 포함 금지

```typescript
import { fetchWithTimeout } from '@opendocuments/core'

const res = await fetchWithTimeout('https://api.example.com/v1/data', {
  headers: { 'Authorization': `Bearer ${this.apiKey}` },
}, 30000)  // 30초 타임아웃
```

---

## 커밋 메시지 컨벤션

[Conventional Commits](https://www.conventionalcommits.org/) 형식을 따릅니다:

```
<type>(<scope>): <description>
```

### Type

| Type | 설명 | 예시 |
|------|------|------|
| `feat` | 새 기능 | `feat(core): add intent classification` |
| `fix` | 버그 수정 | `fix(server): handle invalid JSON in chat endpoint` |
| `docs` | 문서 변경 | `docs: update README with MCP tools` |
| `test` | 테스트 추가/수정 | `test(core): add retriever hybrid search test` |
| `refactor` | 기능 변경 없는 코드 개선 | `refactor: rename OpenDocs to OpenDocuments` |
| `chore` | 빌드/도구/설정 | `chore: update turbo.json pipeline` |
| `ci` | CI/CD | `ci: add Node 22 to test matrix` |

### Scope

| Scope | 패키지 |
|-------|--------|
| `core` | `@opendocuments/core` |
| `server` | `@opendocuments/server` |
| `cli` | `@opendocuments/cli` |
| `web` | `@opendocuments/web` |
| `client` | `@opendocuments/client` |
| (없음) | 여러 패키지 또는 루트 |

### 예시

```
feat(core): add FTS5 sparse search with RRF merge
fix(server): escape FTS5 query to prevent operator injection
docs: add plugin development guide to CONTRIBUTING.md
test(core): add hallucination guard grounding tests
refactor(cli): extract file discovery to shared utility
chore: add CHANGELOG.md
ci: fix CI build with variable-based dynamic import
feat: add Google Drive and S3 connector plugins
```

---

## PR 가이드

### PR 체크리스트

PR 생성 시 다음을 확인해 주세요:

- [ ] 코드가 프로젝트 컨벤션을 따르는가
- [ ] 새 기능에 대한 테스트를 추가했는가
- [ ] 기존 테스트가 모두 통과하는가 (`npm run test`)
- [ ] 빌드가 성공하는가 (`npm run build`)
- [ ] TypeScript 타입 체크가 통과하는가 (`npx turbo typecheck`)
- [ ] Changeset을 생성했는가 (`npx changeset`)
- [ ] CLI 출력에 이모지를 사용하지 않았는가
- [ ] 새 엔드포인트에 적절한 인증이 적용되었는가

### PR 크기

- **작을수록 좋습니다** -- 하나의 PR에 하나의 논리적 변경
- 대규모 리팩토링은 여러 PR로 분리
- 새 플러그인은 하나의 PR로 제출 가능

### 리뷰 프로세스

1. CI가 통과해야 리뷰가 시작됩니다
2. 최소 1명의 maintainer 승인이 필요합니다
3. 리뷰 코멘트에 대응 후 re-request review
4. 승인 후 squash merge

---

## 이슈 리포팅

### 버그 리포트

이슈 템플릿 (`Bug Report`)을 사용하여:

1. **설명** -- 무엇이 잘못되었는지
2. **재현 단계** -- 1, 2, 3 순서로
3. **예상 동작** -- 어떻게 동작해야 하는지
4. **실제 동작** -- 실제로 어떻게 동작하는지
5. **환경** -- OS, Node 버전, OpenDocuments 버전

```bash
# 환경 정보 수집
opendocuments doctor
node --version
npm --version
```

### 기능 요청

이슈 템플릿 (`Feature Request`)을 사용하여:

1. **설명** -- 어떤 기능인지
2. **사용 사례** -- 왜 필요한지
3. **제안하는 구현** (선택) -- 어떻게 구현하면 좋을지

---

## 릴리즈 프로세스

Changesets 기반 자동 릴리즈:

1. PR이 머지되면 changeset 파일이 축적됩니다
2. `npx changeset version`으로 버전 범프 + CHANGELOG 생성
3. `npx changeset publish`로 npm에 배포
4. GitHub Release 자동 생성

### 버전 정책

- `patch` (0.1.x): 버그 수정, 문서 업데이트
- `minor` (0.x.0): 새 기능, 새 플러그인
- `major` (x.0.0): 브레이킹 변경 (플러그인 인터페이스 변경 등)

### 플러그인 호환성

모든 플러그인은 `coreVersion: '^0.1.0'`을 선언합니다. Core의 마이너 업데이트는 플러그인 호환성을 유지해야 합니다. 브레이킹 변경 시 `checkCompatibility()`가 자동으로 비호환 플러그인을 거부합니다.

---

## 도움이 필요하면

- [GitHub Issues](https://github.com/joungminsung/OpenDocuments/issues)에서 질문
- `good first issue` 라벨로 시작하기 좋은 이슈 찾기
- PR에 `help wanted` 라벨이 있으면 기여 환영

감사합니다!
