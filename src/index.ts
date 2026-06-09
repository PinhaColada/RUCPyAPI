import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { secureHeaders } from 'hono/secure-headers'
import { rucRouter } from './routes/ruc.js'
import { cotizacionesRouter } from './routes/cotizaciones.js'
import { rateLimiter } from './middleware/rateLimiter.js'
import { logger } from './logger.js'

const app = new Hono()

// Headers de seguridad HTTP en todas las respuestas
app.use('*', secureHeaders())

// Rate limiting global: 60 requests por IP cada 60 segundos
app.use('*', rateLimiter({ windowMs: 60_000, limit: 60 }))

// Logging de cada request entrante
app.use('*', async (c, next) => {
  const start = Date.now()
  await next()
  logger.info('request', {
    method: c.req.method,
    path: c.req.path,
    status: c.res.status,
    ms: Date.now() - start,
  })
})

app.route('/ruc', rucRouter)
app.route('/cotizaciones', cotizacionesRouter)

app.get('/', (c) => {
  return c.json({
    name: 'RucPy API',
    description: 'API de datos públicos de Paraguay',
    version: '1.0.0',
    endpoints: [
      {
        path: '/ruc/:numero',
        method: 'GET',
        description: 'Valida un RUC paraguayo',
        example: '/ruc/80012345-6',
      },
      {
        path: '/cotizaciones/latest',
        method: 'GET',
        description: 'Cotización más reciente de cada moneda (DNIT)',
        example: '/cotizaciones/latest',
      },
      {
        path: '/cotizaciones/historico',
        method: 'GET',
        description: 'Historial completo, filtrable por moneda y rango de fechas',
        example: '/cotizaciones/historico?moneda=USD&desde=2026-01-01&hasta=2026-06-30',
        params: {
          moneda: 'Código de moneda: USD, BRL, ARS, JPY, EUR, GBP',
          desde: 'Fecha de inicio en formato YYYY-MM-DD',
          hasta: 'Fecha de fin en formato YYYY-MM-DD',
        },
      },
    ],
  })
})

// Manejo de errores no capturados — evita proceso zombie en Railway
process.on('unhandledRejection', (reason) => {
  logger.error('unhandledRejection', { reason: String(reason) })
})

process.on('uncaughtException', (err) => {
  logger.error('uncaughtException', { error: err.message, stack: err.stack })
  process.exit(1)
})

const port = Number(process.env.PORT) || 3000

serve({ fetch: app.fetch, port }, () => {
  logger.info('server started', { port })
})
