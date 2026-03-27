import { Hono } from 'hono'
import type { AppContext } from '../../bootstrap.js'
import { requireRole, requireScope } from '../middleware/auth.js'

export function adminRoutes(ctx: AppContext) {
  const app = new Hono()

  app.get('/api/v1/admin/audit-logs', requireRole('admin'), requireScope('admin'), (c) => {
    const limit = parseInt(c.req.query('limit') || '100', 10)
    const offset = parseInt(c.req.query('offset') || '0', 10)
    const eventType = c.req.query('eventType') || undefined
    const workspaceId = c.req.query('workspaceId') || undefined

    const entries = ctx.auditLogger.query({ limit, offset, eventType, workspaceId })
    return c.json({ entries })
  })

  app.get('/api/v1/admin/stats', requireRole('admin'), requireScope('admin'), (c) => {
    const docs = ctx.store.listDocuments()
    const totalChunks = docs.reduce((sum, d) => sum + (d.chunk_count || 0), 0)

    // Source type distribution
    const sourceDistribution: Record<string, number> = {}
    for (const doc of docs) {
      sourceDistribution[doc.source_type] = (sourceDistribution[doc.source_type] || 0) + 1
    }

    // Status distribution
    const statusDistribution: Record<string, number> = {}
    for (const doc of docs) {
      statusDistribution[doc.status] = (statusDistribution[doc.status] || 0) + 1
    }

    // File type distribution
    const fileTypeDistribution: Record<string, number> = {}
    for (const doc of docs) {
      const ft = doc.file_type || 'unknown'
      fileTypeDistribution[ft] = (fileTypeDistribution[ft] || 0) + 1
    }

    return c.json({
      documents: docs.length,
      chunks: totalChunks,
      workspaces: ctx.workspaceManager.list().length,
      plugins: ctx.registry.listAll().length,
      sourceDistribution,
      statusDistribution,
      fileTypeDistribution,
    })
  })

  app.get('/api/v1/admin/search-quality', requireRole('admin'), requireScope('admin'), (c) => {
    const logs = ctx.db.all<any>(
      'SELECT * FROM query_logs ORDER BY created_at DESC LIMIT 1000'
    )

    const totalQueries = logs.length
    const avgConfidence = logs.length > 0
      ? logs.reduce((sum: number, l: any) => sum + (l.confidence_score || 0), 0) / logs.length
      : 0

    // Intent distribution
    const intentDistribution: Record<string, number> = {}
    for (const log of logs) {
      const intent = log.intent || 'general'
      intentDistribution[intent] = (intentDistribution[intent] || 0) + 1
    }

    // Route distribution
    const routeDistribution: Record<string, number> = {}
    for (const log of logs) {
      const route = log.route || 'unknown'
      routeDistribution[route] = (routeDistribution[route] || 0) + 1
    }

    // Feedback stats
    const positive = logs.filter((l: any) => l.feedback === 'positive').length
    const negative = logs.filter((l: any) => l.feedback === 'negative').length

    // Avg response time
    const avgResponseTime = logs.length > 0
      ? logs.reduce((sum: number, l: any) => sum + (l.response_time_ms || 0), 0) / logs.length
      : 0

    return c.json({
      totalQueries,
      avgConfidence: Math.round(avgConfidence * 100) / 100,
      avgResponseTimeMs: Math.round(avgResponseTime),
      intentDistribution,
      routeDistribution,
      feedback: { positive, negative, total: positive + negative },
    })
  })

  app.get('/api/v1/admin/query-logs', requireRole('admin'), requireScope('admin'), (c) => {
    const limit = parseInt(c.req.query('limit') || '50')
    const offset = parseInt(c.req.query('offset') || '0')
    const intent = c.req.query('intent')
    const route = c.req.query('route')

    let sql = 'SELECT * FROM query_logs WHERE 1=1'
    const params: unknown[] = []

    if (intent) { sql += ' AND intent = ?'; params.push(intent) }
    if (route) { sql += ' AND route = ?'; params.push(route) }

    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
    params.push(limit, offset)

    const logs = ctx.db.all<any>(sql, params)
    const total = ctx.db.get<any>('SELECT COUNT(*) as count FROM query_logs')

    return c.json({ logs, total: total?.count || 0, limit, offset })
  })

  app.get('/api/v1/admin/plugins', requireRole('admin'), requireScope('admin'), async (c) => {
    const plugins = ctx.registry.listAll()
    const details = await Promise.all(
      plugins.map(async (p) => {
        const plugin = ctx.registry.get(p.name)
        let health: { healthy: boolean; message?: string } = { healthy: true, message: 'Unknown' }
        let metrics = {}

        try {
          if (plugin?.healthCheck) health = await plugin.healthCheck()
        } catch (err) {
          health = { healthy: false, message: (err as Error).message }
        }

        try {
          if (plugin?.metrics) metrics = await plugin.metrics()
        } catch {}

        return { ...p, health, metrics }
      })
    )

    return c.json({ plugins: details })
  })

  app.get('/api/v1/admin/connectors', requireRole('admin'), requireScope('admin'), (c) => {
    const connectors = ctx.connectorManager.listConnectors()
    return c.json({ connectors })
  })

  return app
}
