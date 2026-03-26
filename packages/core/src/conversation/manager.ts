import { randomUUID } from 'node:crypto'
import type { DB } from '../storage/db.js'

export interface Conversation {
  id: string
  workspaceId: string
  title: string | null
  createdAt: string
  updatedAt: string
}

export interface Message {
  id: string
  conversationId: string
  role: 'user' | 'assistant'
  content: string
  sources?: string  // JSON
  profileUsed?: string
  confidenceScore?: number
  responseTimeMs?: number
  createdAt: string
}

export class ConversationManager {
  constructor(private db: DB, private workspaceId: string) {}

  create(title?: string): Conversation {
    const id = randomUUID()
    const now = new Date().toISOString()
    this.db.run(
      'INSERT INTO conversations (id, workspace_id, title, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
      [id, this.workspaceId, title || null, now, now]
    )
    return { id, workspaceId: this.workspaceId, title: title || null, createdAt: now, updatedAt: now }
  }

  addMessage(conversationId: string, role: 'user' | 'assistant', content: string, meta?: {
    sources?: unknown
    profileUsed?: string
    confidenceScore?: number
    responseTimeMs?: number
  }): Message {
    const id = randomUUID()
    const now = new Date().toISOString()
    this.db.run(
      `INSERT INTO messages (id, conversation_id, role, content, sources, profile_used, confidence_score, response_time_ms, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, conversationId, role, content, meta?.sources ? JSON.stringify(meta.sources) : null,
       meta?.profileUsed || null, meta?.confidenceScore ?? null, meta?.responseTimeMs ?? null, now]
    )
    // Update conversation timestamp
    this.db.run('UPDATE conversations SET updated_at = ? WHERE id = ?', [now, conversationId])
    return { id, conversationId, role, content, sources: meta?.sources ? JSON.stringify(meta.sources) : undefined, profileUsed: meta?.profileUsed, confidenceScore: meta?.confidenceScore, responseTimeMs: meta?.responseTimeMs, createdAt: now }
  }

  getMessages(conversationId: string): Message[] {
    return this.db.all<any>(
      'SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC',
      [conversationId]
    ).map(row => ({
      id: row.id,
      conversationId: row.conversation_id,
      role: row.role,
      content: row.content,
      sources: row.sources,
      profileUsed: row.profile_used,
      confidenceScore: row.confidence_score,
      responseTimeMs: row.response_time_ms,
      createdAt: row.created_at,
    }))
  }

  list(): Conversation[] {
    return this.db.all<any>(
      'SELECT * FROM conversations WHERE workspace_id = ? AND deleted_at IS NULL ORDER BY updated_at DESC',
      [this.workspaceId]
    ).map(row => ({
      id: row.id,
      workspaceId: row.workspace_id,
      title: row.title,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }))
  }

  delete(id: string): void {
    this.db.run('UPDATE conversations SET deleted_at = ? WHERE id = ?', [new Date().toISOString(), id])
  }
}
