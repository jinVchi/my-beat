Read and follow all files in skills/

# Beat'em Up — Multiplayer Web Game

## About

Server-authoritative multiplayer beat'em up web game. Players worldwide connect to regional game servers via WebSocket for low-latency combat. A single global server handles auth, matchmaking, and persistence.

## Tech Stack

- **Frontend:** Vite + React + Phaser 3, TypeScript
- **Global Server:** NestJS on Node.js
- **Game Server:** Node.js + ws, TypeScript
- **Auth:** Better Auth (session in PostgreSQL)
- **ORM:** Drizzle
- **Database:** PostgreSQL (single global instance)
- **Serialization:** MessagePack (binary WS messages)
- **Monorepo:** Turborepo, npm

## Project Structure

```
apps/web          → Vite + React frontend + Phaser game client
apps/server       → Global API + Matchmaker (NestJS HTTP server)
apps/game-server  → Regional WebSocket game server
packages/game-logic    → Deterministic combat/movement (shared client + server)
packages/netcode       → Clock sync, input buffer, serializer (shared)
packages/shared-types  → WS message schemas, game config, API types
```

## Architecture Rules

- `packages/game-logic` is deterministic. Same input = same output on client and server. Never put non-deterministic code (random, Date.now, network calls) here.
- Game server is server-authoritative at 60Hz. Client predicts locally using `packages/game-logic`, reconciles on server snapshots.
- Game server does NOT access the database directly for auth. It calls the global server `GET /api/auth/verify?token=...` then caches player data in an in-memory Map for the WS connection lifetime.
- Items picked up during combat stay in game server memory. Never write to DB during gameplay. Batch flush to PostgreSQL every 30 seconds and on match end.
- Sessions live in PostgreSQL only. No Redis for sessions.
- Redis is only for room/server mapping when scaling to multiple game servers per region. Not needed in dev.
- All WS messages use MessagePack binary serialization via `packages/netcode/serializer.ts`.

## Commands

```bash
npm run dev              # run all apps concurrently via Turborepo
npm run build            # build all packages and apps
npm test                 # run tests across all packages
npm run lint             # lint all packages
npm run db:generate      # generate Drizzle migrations (in apps/server)
npm run db:migrate       # run Drizzle migrations (in apps/server)
npm run db:studio        # open Drizzle Studio (in apps/server)
```

## Dev Environment

- Single region, no CDN, no Docker
- PostgreSQL runs locally (port 5432)
- Vite dev server at `http://localhost:3001` (proxies `/api/*` to the global server)
- Global server (NestJS) at `http://localhost:3002`
- Game server WS at `ws://localhost:3003`

## Code Conventions

- TypeScript strict mode everywhere
- Functional style preferred, classes only for Phaser scenes and ECS
- Named exports, no default exports (route components in `apps/web/src/routes` are an exception — React Router expects default exports there)
- All WS message types defined in `packages/shared-types/messages.ts`
- Character stats and frame data in `packages/shared-types/game-config.ts`
- Drizzle schema in `apps/server/src/db/schema.ts`
- Better Auth config in `apps/server/src/lib/auth.ts`
- NestJS bootstrap in `apps/server/src/index.ts`
- NestJS app module in `apps/server/src/app.module.ts`
- NestJS controllers in `apps/server/src/routes/`
- Shared server request/auth helpers in `apps/server/src/lib/`

## NestJS Server Notes

- Keep the global server as a NestJS HTTP app. Do not add Hono back.
- Register global server routes as NestJS controllers under `apps/server/src/routes/` and add them to `AppModule`.
- Better Auth owns `/api/auth/*` through `better-auth/node` middleware in `apps/server/src/index.ts`.
- The custom `GET /api/auth/verify` route must remain a NestJS controller route before the Better Auth catch-all behavior.
- Use `@Req()` plus `getSessionFromRequest()` from `apps/server/src/lib/request.ts` when a controller needs the current Better Auth session.
- Keep route response shapes stable for the web client and game server: `/api/game-token`, `/api/matchmaking/join`, `/api/items/batch`, and `/api/auth/verify`.

## Key Flows

### Player connects to game

1. Client calls `POST /api/auth/sign-in/email` (Better Auth) → session cookie set for `localhost`
2. Client calls `POST /api/matchmaking/join` with region → global server calls game server, returns `{ wsUrl, roomId }`
3. Client calls `GET /api/game-token` → session token for the game server
4. Client opens WebSocket to game server with `?token=...&roomId=...`
5. Game server calls `GET /api/auth/verify?token=...` on the global server → caches player in memory
6. Game loop starts at 60Hz

### Item pickup during match

1. Enemy drops item → added to room state in memory
2. Player sees item via next WS state snapshot
3. Item added to `pendingWrites` array
4. Every 30s or on match end → game server POSTs to global server `/api/items/batch` → `db.items.insertMany(pendingWrites)`

### Reconnection

1. Client stores room token in sessionStorage
2. On disconnect → client reconnects to same WS URL with auth cookie + room token
3. Game server verifies token, finds room, restores player state
4. 30-second grace period before player is removed from room
