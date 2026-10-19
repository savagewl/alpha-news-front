# Alpha News — фронтенд

Хакатон Альфа-Банка: ИИ-сервис, превращающий поток новостей в бизнес-решения
(значимые события, риски и возможности для конкретного бизнеса).

Стек: React 19 + Vite + TypeScript, React Router, TanStack Query.

## Старт

```bash
nvm use            # Node 22
npm install
cp .env.example .env
npm run dev
```

В dev запросы на `/api/*` проксируются на `VITE_PROXY_TARGET` (по умолчанию `http://localhost:8000`).

## Скрипты

| команда                           | что делает              |
| --------------------------------- | ----------------------- |
| `npm run dev`                     | dev-сервер              |
| `npm run build`                   | typecheck + прод-сборка |
| `npm run lint`                    | oxlint                  |
| `npm run format` / `format:check` | prettier                |
| `npm run typecheck`               | tsc                     |
| `npm test`                        | vitest                  |

## Структура

```
src/
  api/
    client.ts      fetch-обёртка, ApiError
    types.ts       типы контракта с бэкендом (предположительные!)
    endpoints.ts   функции запросов по ресурсам
    hooks.ts       react-query хуки
  pages/           страницы
```

Все запросы идут на `/api/...`. Типы в `src/api/types.ts` надо сверить с реальным
контрактом бэкенда; если есть OpenAPI — можно сгенерировать (`openapi-typescript`).

## Работа в команде

Ветки от `main` → PR → merge.
