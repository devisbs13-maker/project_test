# Project Monorepo

Monorepo using npm workspaces with the following packages:

- apps/web
- apps/api
- apps/bot
- packages/shared

Scripts are orchestrated from the root `package.json`.

Quick start:

- Install deps: `npm install`
- Start all apps: `npm run dev`
- Start one app: `npm run dev:web` | `npm run dev:api` | `npm run dev:bot`
- Build all: `npm run build`
- Build one: `npm run build:web` | `npm run build:api` | `npm run build:bot` | `npm run build:shared`

Notes:

- Root TypeScript config: `tsconfig.base.json`
- ESLint config: `.eslintrc.cjs`
- Prettier config: `.prettierrc`
- Workspaces: `apps/*`, `packages/*`
- Shared import path alias: `@repo/shared/*`

## Р‘С‹СЃС‚СЂС‹Р№ СЃС‚Р°СЂС‚

- РЈСЃС‚Р°РЅРѕРІРєР° Р·Р°РІРёСЃРёРјРѕСЃС‚РµР№: `npm i`
- Р—Р°РїСѓСЃРє С„СЂРѕРЅС‚Р° Рё Р±РѕС‚Р° РІРјРµСЃС‚Рµ: `npm run dev:all`
- РћС‚РєСЂС‹С‚СЊ С„СЂРѕРЅС‚: http://127.0.0.1:5173

Р•СЃР»Рё РЅСѓР¶РµРЅ Telegram WebApp:
- РЈСЃС‚Р°РЅРѕРІРёС‚Рµ ngrok (РґРѕР±Р°РІСЊС‚Рµ РІ PATH) РёР»Рё СѓРєР°Р¶РёС‚Рµ РїСѓС‚СЊ Рє РёСЃРїРѕР»РЅСЏРµРјРѕРјСѓ С„Р°Р№Р»Сѓ.
- Р’С‹РїРѕР»РЅРёС‚Рµ: `npm run dev:all:tunnel`
- Р’РѕР·СЊРјРёС‚Рµ https-URL РёР· ngrok Рё РїСЂРѕРїРёС€РёС‚Рµ РІ `apps/bot/.env` в†’ `WEBAPP_URL=<https-url>`
- РџРµСЂРµР·Р°РїСѓСЃС‚РёС‚Рµ Р±РѕС‚Р°: `npm run start:bot` (РёР»Рё РїРµСЂРµР·Р°РїСѓСЃС‚РёС‚Рµ `dev:all:tunnel`).
