# RucPy API

API REST de datos públicos de Paraguay. Sin autenticación, sin base de datos.

**Base URL:** `https://rucpyapi-production.up.railway.app`

---

## Endpoints

### `GET /ruc/:numero`

Valida un RUC paraguayo usando el algoritmo oficial del dígito verificador (módulo 11). No realiza consultas externas.

**Formatos aceptados**
- Con guión: `80012345-6`
- Sin guión: `800123456`

**Ejemplo**
```
GET /ruc/80012345-6
```

```json
{
  "ruc": "80012345",
  "digitoVerificador": 6,
  "valido": true,
  "mensaje": "RUC valido"
}
```

---

### `GET /cotizaciones/latest`

Cotización más reciente de cada moneda según el portal oficial de la DNIT. Caché de 60 minutos.

**Monedas:** USD, BRL, ARS, JPY, EUR, GBP

**Ejemplo**
```
GET /cotizaciones/latest
```

```json
{
  "data": {
    "USD": { "compra": 7800, "venta": 7850, "fecha": "2026-06-09" },
    "EUR": { "compra": 8500, "venta": 8600, "fecha": "2026-06-09" }
  },
  "fromCache": false
}
```

---

### `GET /cotizaciones/historico`

Historial completo de cotizaciones, filtrable por moneda y rango de fechas. Caché de 60 minutos.

**Parámetros opcionales**

| Parámetro | Formato | Descripción |
|-----------|---------|-------------|
| `moneda` | `USD` \| `BRL` \| `ARS` \| `JPY` \| `EUR` \| `GBP` | Filtrar por moneda |
| `desde` | `YYYY-MM-DD` | Fecha de inicio |
| `hasta` | `YYYY-MM-DD` | Fecha de fin |

**Ejemplos**
```
GET /cotizaciones/historico
GET /cotizaciones/historico?moneda=USD
GET /cotizaciones/historico?moneda=EUR&desde=2026-01-01&hasta=2026-06-30
```

```json
{
  "total": 12,
  "filtros": { "moneda": "USD", "desde": "2026-01-01", "hasta": "sin limite" },
  "data": [
    { "fecha": "2026-06-09", "moneda": "USD", "compra": 7800, "venta": 7850 }
  ]
}
```

---

## Stack

| | |
|---|---|
| Runtime | Node.js 20 |
| Framework | Hono |
| HTML parsing | Cheerio |
| Validación | Zod |
| Deploy | Railway |

## Fuente de datos

Las cotizaciones provienen del portal oficial de la DNIT:  
[dnit.gov.py/web/portal-institucional/cotizaciones](https://www.dnit.gov.py/web/portal-institucional/cotizaciones)

La validación de RUC implementa el algoritmo del dígito verificador publicado por la SET, sin consultas externas.
