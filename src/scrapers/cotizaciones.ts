import * as cheerio from 'cheerio'

export type Cotizacion = {
  fecha: string
  moneda: string
  compra: number | null
  venta: number | null
}

export type CotizacionesResult = {
  actualizadoAl: string
  cotizaciones: Cotizacion[]
}

export async function scrapeCotizaciones(): Promise<CotizacionesResult> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 15_000)

  let response: Response
  try {
    response = await fetch(
      'https://www.dnit.gov.py/web/portal-institucional/cotizaciones',
      { signal: controller.signal }
    )
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('Timeout: la DNIT no respondió en 15 segundos')
    }
    throw err
  } finally {
    clearTimeout(timeout)
  }

  if (!response.ok) {
    throw new Error(`Error al contactar la DNIT: ${response.status}`)
  }

  const html = await response.text()
  const $ = cheerio.load(html)
  const resultados: Cotizacion[] = []

  $('section.component-table').each((_, seccion) => {
    const titulo = $(seccion).find('h4').first().text().trim()
    const match = titulo.match(/(\w+)\s+(\d{4})$/)
    if (!match) return

    const tabla = $(seccion).find('table').first()

    const mes = match[1]
    const anio = match[2]
    const mesNum = mesANumero(mes)
    if (!mesNum) return

    tabla.find('tr').each((i, fila) => {
      if (i < 2) return

      const celdas = $(fila).find('td')
      if (celdas.length < 13) return

      const dia = $(celdas[0]).text().trim()
      if (!dia || isNaN(Number(dia))) return

      const fecha = `${anio}-${mesNum}-${dia.padStart(2, '0')}`

      const parsear = (idx: number): number | null => {
        const texto = $(celdas[idx]).text().trim()
        if (!texto) return null
        const valor = parseFloat(texto.replace(/\./g, '').replace(',', '.'))
        return isNaN(valor) ? null : valor
      }

      const monedas = ['USD', 'BRL', 'ARS', 'JPY', 'EUR', 'GBP']
      monedas.forEach((moneda, idx) => {
        resultados.push({
          fecha,
          moneda,
          compra: parsear(1 + idx * 2),
          venta: parsear(2 + idx * 2),
        })
      })
    })
  })

  if (resultados.length === 0) {
    throw new Error('No se encontraron cotizaciones en la pagina de la DNIT')
  }

  resultados.sort((a, b) => b.fecha.localeCompare(a.fecha))

  return {
    actualizadoAl: resultados[0].fecha,
    cotizaciones: resultados,
  }
}

function mesANumero(mes: string): string | null {
  const meses: Record<string, string> = {
    enero: '01', febrero: '02', marzo: '03', abril: '04',
    mayo: '05', junio: '06', julio: '07', agosto: '08',
    septiembre: '09', octubre: '10', noviembre: '11', diciembre: '12',
  }
  return meses[mes.toLowerCase()] ?? null
}
