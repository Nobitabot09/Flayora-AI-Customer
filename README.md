# Flayora AI — Customer Edition

Standalone customer-facing shopping assistant MVP. This repository is independent of the existing Flayora Development storefront.

## Stack
- Vite + React + TypeScript
- Cloudflare Pages Functions (`/api/chat`)
- Provider adapter boundary; demo mode works without an API key
- Demo catalogue separate from conversation logic
- In-memory browser conversation state only; refresh resets chat

## Run locally
```bash
npm install
npm run dev
```

## Cloudflare Pages
Build: `npm run build` · Output: `dist`

Set `AI_PROVIDER=openai` and `OPENAI_API_KEY` as server-side Cloudflare secrets to enable the API route. Never expose provider keys in frontend code or `VITE_*` variables.

## Safety
Customer assistant is read-only. It may show approved catalogue facts and calculate totals from explicit prices. No order creation, payment, admin access, or persistent chat history. Sample data is illustrative only, not live Flayora inventory or pricing.
