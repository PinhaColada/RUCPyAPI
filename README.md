# RucPy API

API de datos públicos de Paraguay: validación de RUC y cotizaciones oficiales de la DNIT.

## Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/` | Documentación de la API |
| GET | `/ruc/:numero` | Valida un RUC paraguayo |
| GET | `/cotizaciones/latest` | Cotización más reciente por moneda |
| GET | `/cotizaciones/historico` | Historial completo, filtrable |

### GET /ruc/:numero

Valida el dígito verificador de un RUC usando el algoritmo módulo 11 oficial. No realiza consultas externas.

```
GET /ruc/80012345-6
GET /ruc/800123456
```

Respuesta:
```json
{
  "ruc": "80012345",
  "digitoVerificador": 6,
  "valido": true,
  "mensaje": "RUC valido"
}
```

### GET /cotizaciones/latest

Cotización más reciente de cada moneda (USD, BRL, ARS, JPY, EUR, GBP) según el portal de la DNIT. Caché de 60 minutos.

```
GET /cotizaciones/latest
```

### GET /cotizaciones/historico

Historial completo con filtros opcionales. Caché de 60 minutos.

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `moneda` | string | Código de moneda: `USD`, `BRL`, `ARS`, `JPY`, `EUR`, `GBP` |
| `desde` | string | Fecha de inicio en formato `YYYY-MM-DD` |
| `hasta` | string | Fecha de fin en formato `YYYY-MM-DD` |

```
GET /cotizaciones/historico
GET /cotizaciones/historico?moneda=USD
GET /cotizaciones/historico?desde=2026-01-01&hasta=2026-06-30
GET /cotizaciones/historico?moneda=EUR&desde=2026-03-01
```

## Instalación y desarrollo

```bash
npm install
npm run dev
```

Servidor en `http://localhost:3000`

## Deploy en Railway

1. Subí el código a GitHub
2. Creá un proyecto en [railway.app](https://railway.app) conectando el repo
3. Railway detecta el Dockerfile automáticamente y hace el deploy
4. La variable `PORT` la setea Railway automáticamente

## Stack

- **Hono** — framework HTTP liviano con soporte nativo para TypeScript
- **Cheerio** — parsing de HTML estático (sin navegador headless)
- **Zod** — validación de parámetros de entrada
- **Cache en memoria** — TTL de 60 minutos, sin dependencias externas
