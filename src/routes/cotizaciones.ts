import { Hono } from 'hono'
import { scrapeCotizaciones } from '../scrapers/cotizaciones.js'
import { cache } from '../cache/index.js'

export const cotizacionesRouter = new Hono()

const CACHE_KEY = 'cotizaciones:historico'
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/

// Obtiene los datos del scraper con caché compartida para ambos endpoints
async function getCotizaciones() {
  const cached = cache.get<Awaited<ReturnType<typeof scrapeCotizaciones>>>(CACHE_KEY)
  if (cached) return { data: cached, fromCache: true }

  const data = await scrapeCotizaciones()
  cache.set(CACHE_KEY, data)
  return { data, fromCache: false }
}

cotizacionesRouter.get('/latest', async (c) => {
  try {
    const { data, fromCache } = await getCotizaciones()

    const latest: Record<string, { compra: number | null; venta: number | null; fecha: string }> = {}
    for (const cotizacion of data.cotizaciones) {
      if (!latest[cotizacion.moneda]) {
        latest[cotizacion.moneda] = {
          compra: cotizacion.compra,
          venta: cotizacion.venta,
          fecha: cotizacion.fecha,
        }
      }
    }

    return c.json({ data: latest, fromCache })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error interno'
    return c.json({ error: message }, 500)
  }
})

cotizacionesRouter.get('/historico', async (c) => {
  const moneda = c.req.query('moneda')?.toUpperCase()
  const desde = c.req.query('desde')
  const hasta = c.req.query('hasta')

  if (desde && !DATE_REGEX.test(desde)) {
    return c.json({ error: 'El parámetro "desde" debe tener formato YYYY-MM-DD' }, 400)
  }
  if (hasta && !DATE_REGEX.test(hasta)) {
    return c.json({ error: 'El parámetro "hasta" debe tener formato YYYY-MM-DD' }, 400)
  }

  try {
    const { data } = await getCotizaciones()
    let { cotizaciones } = data

    if (moneda) cotizaciones = cotizaciones.filter((c) => c.moneda === moneda)
    if (desde) cotizaciones = cotizaciones.filter((c) => c.fecha >= desde)
    if (hasta) cotizaciones = cotizaciones.filter((c) => c.fecha <= hasta)

    return c.json({
      total: cotizaciones.length,
      filtros: { moneda: moneda ?? 'todas', desde: desde ?? 'sin limite', hasta: hasta ?? 'sin limite' },
      data: cotizaciones,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error interno'
    return c.json({ error: message }, 500)
  }
})
