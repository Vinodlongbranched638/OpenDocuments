import { randomUUID } from 'node:crypto'
import { Hono } from 'hono'
import { streamSSE } from 'hono/streaming'
import type { AppContext } from '../../bootstrap.js'

export function chatRoutes(ctx: AppContext) {
  const app = new Hono()

  app.post('/api/v1/chat', async (c) => {
    let body: { query: string; profile?: string; conversationId?: string }
    try {
      body = await c.req.json()
    } catch {
      return c.json({ error: 'Invalid JSON body' }, 400)
    }
    if (!body.query) return c.json({ error: 'query is required' }, 400)

    const startTime = Date.now()
    const result = await ctx.ragEngine.query({ query: body.query, profile: body.profile })
    const responseTimeMs = Date.now() - startTime

    // Query logging (Fix 8) -- write to query_logs table
    try {
      ctx.db.run(
        `INSERT INTO query_logs (id, workspace_id, query, intent, profile, confidence_score, response_time_ms, route, feedback, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [result.queryId, 'default', body.query, 'general', body.profile || 'balanced',
         result.confidence.score, responseTimeMs, result.route, null, new Date().toISOString()]
      )
    } catch {} // Don't fail the response if logging fails

    // Conversation persistence -- optionally save messages
    if (body.conversationId) {
      try {
        ctx.conversationManager.addMessage(body.conversationId, 'user', body.query)
        ctx.conversationManager.addMessage(body.conversationId, 'assistant', result.answer, {
          sources: result.sources,
          profileUsed: result.profile,
          confidenceScore: result.confidence.score,
          responseTimeMs,
        })
      } catch {} // Don't fail the response if saving fails
    }

    return c.json(result)
  })

  app.post('/api/v1/chat/stream', async (c) => {
    let body: { query: string; profile?: string; conversationId?: string }
    try {
      body = await c.req.json()
    } catch {
      return c.json({ error: 'Invalid JSON body' }, 400)
    }
    return streamSSE(c, async (stream) => {
      if (!body.query) {
        await stream.writeSSE({ data: JSON.stringify({ type: 'error', data: 'query is required' }) })
        return
      }
      for await (const event of ctx.ragEngine.queryStream({ query: body.query, profile: body.profile })) {
        await stream.writeSSE({ event: event.type, data: JSON.stringify(event.data) })
      }
    })
  })

  return app
}
