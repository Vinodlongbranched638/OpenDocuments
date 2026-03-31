# TypeScript SDK Guide

The OpenDocuments SDK provides a simple TypeScript client for the REST API.

## Installation

```bash
npm install opendocuments-client
```

## Quick Start

```typescript
import { OpenDocumentsClient } from 'opendocuments-client'

const client = new OpenDocumentsClient({
  baseUrl: 'http://localhost:3000',
  // apiKey: 'od_live_...'  // Required in team mode
})

// Ask a question
const result = await client.ask('How does authentication work?')
console.log(result.answer)
console.log(result.sources)

// List indexed documents
const { documents } = await client.listDocuments()

// Upload a document
const file = new File(['# Hello'], 'hello.md', { type: 'text/markdown' })
await client.uploadDocument(file)

// Delete a document
await client.deleteDocument('doc-id')
```

## API Reference

### `ask(query, options?)`
Ask a question about indexed documents.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| query | string | required | The question to ask |
| options.profile | string | 'balanced' | RAG profile: fast, balanced, precise |

Returns: `Promise<QueryResult>` with `answer`, `sources`, `confidence`

### `listDocuments()`
Returns all indexed documents.

### `uploadDocument(file)`
Upload and index a document file.

### `deleteDocument(id)`
Soft-delete a document by ID.

## Error Handling

```typescript
try {
  const result = await client.ask('query')
} catch (err) {
  // err.message contains the server error message
  console.error('Query failed:', err.message)
}
```

## Team Mode Authentication

```typescript
const client = new OpenDocumentsClient({
  baseUrl: 'https://docs.company.com',
  apiKey: process.env.OPENDOCUMENTS_API_KEY,
})
```
