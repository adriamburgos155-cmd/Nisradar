# Nasdaq Risk Radar

Terminal de inteligencia de riesgo especializado EXCLUSIVAMENTE en el Nasdaq (NQ/MNQ). Filtra ruido y muestra solo eventos con potencial de mover el índice.

## Qué hace

Un analista IA filtra noticias en tiempo real y las clasifica según 5 categorías:

1. Fed — tasas, FOMC, CPI/PPI/PCE, NFP, bonos del Tesoro
2. Trump — posts en X, aranceles, comercio, comentarios sobre la Fed
3. Geopolítica — Irán, China-Taiwán, Rusia-Ucrania, infraestructura crítica
4. Tech/IA — NVDA, MSFT, AAPL, AMZN, META, GOOGL, OpenAI, AMD, AVGO
5. Riesgo de mercado — VIX, flujos institucionales, OPEX, liquidez

Cada evento clasificado muestra: importancia, dirección de impacto, fuerza 1-10, resumen, por qué importa, activos a vigilar, probabilidad de volatilidad, y alertas inmediatas.

## Quick Start

```bash
npm install
cp .env.example .env.local
npm run dev
```

## Keys necesarias

| Key | Para qué | Dónde conseguirla |
|-----|----------|-------------------|
| GROQ_API_KEY | Clasificación IA + chat | console.groq.com/keys (gratis) |
| FINNHUB_KEY | Noticias + precios tiempo real | finnhub.io/dashboard (gratis) |
| FRED_API_KEY | Datos macro Fed (opcional) | fredaccount.stlouisfed.org (gratis) |

También se pueden agregar desde la app: Settings → API Config.

## Deploy

```bash
vercel --prod
```

## Refresh

- Volatilidad (VIX, NDX, NQ): cada 15s
- Radar de noticias: cada 60s
- FRED macro: cada hora
