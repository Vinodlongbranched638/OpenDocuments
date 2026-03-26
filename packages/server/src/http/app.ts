import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { healthRoutes } from './routes/health.js'
import { documentRoutes } from './routes/documents.js'
import { chatRoutes } from './routes/chat.js'
import type { AppContext } from '../bootstrap.js'

export function createApp(ctx: AppContext) {
  const app = new Hono()
  app.use('*', cors())
  app.route('/', healthRoutes(ctx))
  app.route('/', documentRoutes(ctx))
  app.route('/', chatRoutes(ctx))

  app.onError((err, c) => {
    console.error('Unhandled error:', err.message)
    return c.json({ error: 'Internal server error', message: err.message }, 500)
  })

  app.notFound((c) => {
    return c.json({ error: 'Not found' }, 404)
  })

  return app
}
