import type { MiddlewareHandler } from 'hono'

// Ventana fija: máximo `limit` requests por IP en `windowMs` milisegundos
export function rateLimiter(options: { windowMs: number; limit: number }): MiddlewareHandler {
  const { windowMs, limit } = options
  const hits = new Map<string, { count: number; resetAt: number }>()

  // Limpia entradas expiradas cada vez que entra una request, evita memory leak
  function cleanup(now: number) {
    for (const [key, entry] of hits) {
      if (now > entry.resetAt) hits.delete(key)
    }
  }

  return async (c, next) => {
    const ip =
      c.req.header('x-forwarded-for')?.split(',')[0].trim() ??
      c.req.header('x-real-ip') ??
      'unknown'

    const now = Date.now()
    cleanup(now)

    const entry = hits.get(ip)
    if (!entry || now > entry.resetAt) {
      hits.set(ip, { count: 1, resetAt: now + windowMs })
    } else {
      entry.count++
      if (entry.count > limit) {
        return c.json({ error: 'Demasiadas solicitudes. Intenta de nuevo en unos minutos.' }, 429)
      }
    }

    await next()
  }
}
