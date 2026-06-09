// Un Map es como un diccionario en memoria: clave -> valor
// Lo usamos para no repetir el scraping si alguien consulta el mismo RUC dos veces
type CacheEntry<T> = {
  data: T
  savedAt: number // timestamp en milisegundos (Date.now())
}

class Cache {
  private store = new Map<string, CacheEntry<unknown>>()
  private ttl: number // tiempo de vida en milisegundos

  constructor(ttlMinutes: number) {
    this.ttl = ttlMinutes * 60 * 1000
  }

  get<T>(key: string): T | null {
    const entry = this.store.get(key)

    if (!entry) return null

    // Si pasó más tiempo del ttl, el dato está desactualizado, lo borramos
    const isExpired = Date.now() - entry.savedAt > this.ttl
    if (isExpired) {
      this.store.delete(key)
      return null
    }

    return entry.data as T
  }

  set<T>(key: string, data: T): void {
    this.store.set(key, {
      data,
      savedAt: Date.now(),
    })
  }
}

// Una sola instancia compartida por toda la app, los resultados viven 60 minutos
export const cache = new Cache(60)
