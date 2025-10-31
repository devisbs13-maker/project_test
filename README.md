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

## Быстрый старт

- Установка зависимостей: `npm i`
- Запуск фронта и бота вместе: `npm run dev:all`
- Открыть фронт: http://127.0.0.1:5173

Если нужен Telegram WebApp:
- Для локальной разработки без HTTPS используйте кнопку "Open in browser".
- Для продакшена опубликуйте фронтенд на GitHub Pages (см. раздел ниже) и пропишите его HTTPS‑URL в `apps/bot/.env` → `WEBAPP_URL=<pages-url>`.
- Бота перезапускайте: `npm run start:bot`.

## Деплой Web на GitHub Pages

- Готовый workflow: `.github/workflows/deploy-web.yml` — собирает `apps/web` и публикует на Pages при пуше в `main`/`master`.
- Для корректных путей Vite уже настраивает `base`, когда `GH_PAGES=true` (см. `apps/web/vite.config.ts`).
- При необходимости задайте переменную репозитория `VITE_API_URL` (Settings → Variables → Actions), чтобы фронтенд знал адрес прод‑API.
- После первого деплоя возьмите URL GitHub Pages и укажите его в `apps/bot/.env` как `WEBAPP_URL`.

Важно: GitHub Pages — только для статического фронтенда. `apps/api` и `apps/bot` требуют постоянного хостинга (Render/Railway/Fly.io/Vercel Functions/VPS) и корректного CORS.
