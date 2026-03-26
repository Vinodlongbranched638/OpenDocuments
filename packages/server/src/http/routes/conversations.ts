import { Hono } from 'hono'
import type { AppContext } from '../../bootstrap.js'

export function conversationRoutes(ctx: AppContext) {
  const app = new Hono()

  app.get('/api/v1/conversations', (c) => {
    const conversations = ctx.conversationManager.list()
    return c.json({ conversations })
  })

  app.get('/api/v1/conversations/:id/messages', (c) => {
    const messages = ctx.conversationManager.getMessages(c.req.param('id'))
    return c.json({ messages })
  })

  app.post('/api/v1/conversations', async (c) => {
    let body: { title?: string }
    try {
      body = await c.req.json()
    } catch {
      body = {}
    }
    const conversation = ctx.conversationManager.create(body.title)
    return c.json(conversation, 201)
  })

  app.delete('/api/v1/conversations/:id', (c) => {
    ctx.conversationManager.delete(c.req.param('id'))
    return c.json({ deleted: true })
  })

  return app
}
