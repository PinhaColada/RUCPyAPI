# RucPy API — Contexto del proyecto

## Que es esto

API REST de datos publicos de Paraguay. Sin base de datos, sin autenticacion por ahora.
Dos funcionalidades principales:

1. **Validacion de RUC** — calculo matematico del digito verificador, sin consultas externas
2. **Cotizaciones oficiales** — scraping del portal de la DNIT (fetch + cheerio, sin Playwright)

## Stack

- Node.js + TypeScript
- Hono (framework HTTP, mas liviano que Express)
- Cheerio (parseo de HTML, como jQuery en el servidor)
- Zod (validacion de parametros)
- Cache en memoria (clase simple con Map + TTL)

## Estructura

```
src/
  scrapers/
    ruc.ts           — validacion matematica del DV del RUC (algoritmo modulo 11)
    cotizaciones.ts  — scraping del portal DNIT, devuelve cotizaciones por fecha y moneda
  routes/
    ruc.ts           — GET /ruc/:numero
    cotizaciones.ts  — GET /cotizaciones/latest y GET /cotizaciones/historico
  cache/
    index.ts         — cache en memoria con TTL configurable
  index.ts           — servidor principal, monta los routers
```

## Endpoints

```
GET /
  Documentacion basica de la API

GET /ruc/:numero
  Valida un RUC paraguayo matematicamente
  Acepta: 80012345-6 o 800123451
  Responde: { ruc, digitoVerificador, valido, mensaje }

GET /cotizaciones/latest
  Cotizacion mas reciente de cada moneda (USD, BRL, ARS, JPY, EUR, GBP)
  Datos de: https://www.dnit.gov.py/web/portal-institucional/cotizaciones
  Cache: 60 minutos

GET /cotizaciones/historico
  Historial completo, filtrable por query params:
  ?moneda=USD
  ?desde=2026-01-01
  ?hasta=2026-06-30
  Cache: 60 minutos
```

## Decisiones de diseno importantes

**Por que no Playwright para cotizaciones:**
La pagina de la DNIT devuelve las tablas en HTML estatico. No necesita JavaScript para cargar.
Un fetch simple + cheerio es suficiente, mas rapido y sin overhead de abrir un navegador.

**Por que no scraping para RUC:**
El portal de la DNIT tiene CAPTCHA en cada busqueda. En vez de resolver el CAPTCHA,
implementamos el algoritmo oficial del digito verificador (modulo 11). Valida el formato
del RUC sin consultar ningun servidor externo.

**Por que cache en memoria y no Redis:**
Para esta etapa es suficiente. Los datos de cotizaciones cambian una vez por dia.
Si el servidor se reinicia se pierde la cache, pero el proximo request la reconstruye.
Migrar a Redis en el futuro es facil — solo hay que cambiar la implementacion de cache/index.ts.

**Por que Hono y no Express:**
Hono es mas moderno, mas liviano, y tiene mejor soporte para TypeScript nativo.
Funciona igual de bien en Railway.

## Correr localmente

```bash
npm install
npm run dev
```

Servidor en http://localhost:3000

## Deploy

Railway + Dockerfile incluido en la raiz.
El Dockerfile no instala Chromium porque ya no usamos Playwright.
Solo Node.js + dependencias npm.

Pasos:
1. git push al repo en GitHub
2. Railway detecta el push y redespliega automaticamente

## Proximos pasos posibles

- Agregar rate limiting (evitar abuso)
- Agregar endpoint /cotizaciones/fecha/:fecha para consulta puntual
- Agregar API keys para monetizacion (requeriria Supabase o similar para la BD)
- Agregar mas monedas si la DNIT las incorpora
