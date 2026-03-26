import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { healthRoutes } from './routes/health.js'
import { documentRoutes } from './routes/documents.js'
import { chatRoutes } from './routes/chat.js'
import type { AppContext } from '../bootstrap.js'

export function createApp(ctx: AppContext) {
  const app = new Hono()

  // TODO: Read CORS origins from config.security.access.allowedOrigins when implemented
  app.use('*', cors({ origin: '*' }))

  app.route('/', healthRoutes(ctx))
  app.route('/', documentRoutes(ctx))
  app.route('/', chatRoutes(ctx))

  app.onError((err, c) => {
    console.error('Unhandled error:', err.message)
    return c.json({
      error: 'Internal server error',
      // Only include message in non-production environments
      ...(process.env.NODE_ENV !== 'production' && { detail: err.message }),
    }, 500)
  })

  app.notFound((c) => {
    return c.json({ error: 'Not found' }, 404)
  })

  // TODO(Phase 2): Add WebSocket endpoint at /api/v1/ws/chat
  // Currently covered by SSE streaming at POST /api/v1/chat/stream

  return app
}
