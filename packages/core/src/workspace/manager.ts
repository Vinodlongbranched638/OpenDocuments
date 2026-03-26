import { randomUUID } from 'node:crypto'
import type { DB } from '../storage/db.js'

export interface Workspace {
  id: string
  name: string
  mode: 'personal' | 'team'
  settings: Record<string, unknown>
  createdAt: string
}

export class WorkspaceManager {
  constructor(private db: DB) {}

  create(name: string, mode: 'personal' | 'team' = 'personal'): Workspace {
    const existing = this.getByName(name)
    if (existing) {
      throw new Error(`Workspace "${name}" already exists`)
    }
    const id = randomUUID()
    const now = new Date().toISOString()
    this.db.run(
      'INSERT INTO workspaces (id, name, mode, settings, created_at) VALUES (?, ?, ?, ?, ?)',
      [id, name, mode, '{}', now]
    )
    return { id, name, mode, settings: {}, createdAt: now }
  }

  getByName(name: string): Workspace | undefined {
    const row = this.db.get<{
      id: string; name: string; mode: string; settings: string; created_at: string
    }>('SELECT * FROM workspaces WHERE name = ?', [name])
    if (!row) return undefined
    return {
      id: row.id,
      name: row.name,
      mode: row.mode as 'personal' | 'team',
      settings: JSON.parse(row.settings),
      createdAt: row.created_at,
    }
  }

  getById(id: string): Workspace | undefined {
    const row = this.db.get<{
      id: string; name: string; mode: string; settings: string; created_at: string
    }>('SELECT * FROM workspaces WHERE id = ?', [id])
    if (!row) return undefined
    return {
      id: row.id,
      name: row.name,
      mode: row.mode as 'personal' | 'team',
      settings: JSON.parse(row.settings),
      createdAt: row.created_at,
    }
  }

  list(): Workspace[] {
    const rows = this.db.all<{
      id: string; name: string; mode: string; settings: string; created_at: string
    }>('SELECT * FROM workspaces ORDER BY name')
    return rows.map(row => ({
      id: row.id,
      name: row.name,
      mode: row.mode as 'personal' | 'team',
      settings: JSON.parse(row.settings),
      createdAt: row.created_at,
    }))
  }

  delete(id: string): void {
    this.db.run('DELETE FROM workspaces WHERE id = ?', [id])
  }

  ensureDefault(): Workspace {
    const existing = this.getByName('default')
    if (existing) return existing
    return this.create('default', 'personal')
  }
}
