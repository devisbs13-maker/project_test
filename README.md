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
- Установите ngrok (добавьте в PATH) или укажите путь к исполняемому файлу.
- Выполните: `npm run dev:all:tunnel`
- Возьмите https-URL из ngrok и пропишите в `apps/bot/.env` → `WEBAPP_URL=<https-url>`
- Перезапустите бота: `npm run start:bot` (или перезапустите `dev:all:tunnel`).
