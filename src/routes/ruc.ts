import { Hono } from 'hono'
import { z } from 'zod'
import { validarRuc } from '../scrapers/ruc.js'

export const rucRouter = new Hono()

const RucSchema = z.string().regex(/^\d{1,8}-\d$|^\d{2,9}$/, {
  message: 'Formato invalido. Usa 80012345-6 o 800123456',
})

rucRouter.get('/:numero', (c) => {
  const numero = c.req.param('numero')

  const parsed = RucSchema.safeParse(numero)
  if (!parsed.success) {
    return c.json({ error: parsed.error.errors[0].message }, 400)
  }

  const resultado = validarRuc(numero)
  return c.json(resultado)
})
