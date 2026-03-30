# Beat'em Up — Multiplayer Web Game

## About

Server-authoritative multiplayer beat'em up web game. Players worldwide connect to regional game servers via WebSocket for low-latency combat. Global server handles auth, matchmaking, and persistence.

## Tech Stack

- **Frontend:** Next.js (App Router) + Phaser 3, TypeScript
- **Global Server:** Next.js API routes
- **Game Server:** Node.js + uWebSockets.js, TypeScript
- **Auth:** Better Auth (session in PostgreSQL)
- **ORM:** Drizzle
- **Database:** PostgreSQL (single global instance)
- **Serialization:** MessagePack (binary WS messages)
- **Monorepo:** Turborepo, npm

## Project Structure

```
apps/web          → Next.js frontend + Phaser game client
apps/server       → Global API + Matchmaker (Next.js API routes)
apps/game-server  → Regional WebSocket game server (uWebSockets.js)
packages/game-logic    → Deterministic combat/movement (shared client + server)
packages/netcode       → Clock sync, input buffer, serializer (shared)
packages/shared-types  → WS message schemas, game config, API types
```

## Architecture Rules

- `packages/game-logic` is deterministic. Same input = same output on client and server. Never put non-deterministic code (random, Date.now, network calls) here.
- Game server is server-authoritative at 60Hz. Client predicts locally using `packages/game-logic`, reconciles on server snapshots.
- Game server does NOT access the database directly for auth. It calls Global API `GET /auth/verify` with the player's token, then caches player data in an in-memory Map for the WS connection lifetime.
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
npm run db:generate      # generate Drizzle migrations
npm run db:migrate       # run Drizzle migrations
npm run db:studio        # open Drizzle Studio
```

## Dev Environment

- Single region, no CDN, no Docker
- PostgreSQL runs locally (port 5432)
- Next.js server at `http://localhost:3001`
- Game server WS at `ws://localhost:3002`

## Code Conventions

- TypeScript strict mode everywhere
- Functional style preferred, classes only for Phaser scenes and ECS
- Named exports, no default exports
- All WS message types defined in `packages/shared-types/messages.ts`
- Character stats and frame data in `packages/shared-types/game-config.ts`
- Drizzle schema in `apps/server/src/db/schema.ts`

## Key Flows

### Player connects to game

1. Client calls `POST /auth/login` → gets session cookie
2. Client calls `POST /matchmaking/join` with region → gets `ws://localhost:3002/room/<roomId>`
3. Client opens WebSocket to game server with auth cookie
4. Game server calls `GET /auth/verify` → caches player in memory
5. Game loop starts at 60Hz

### Item pickup during match

1. Enemy drops item → added to room state in memory
2. Player sees item via next WS state snapshot
3. Item added to `pendingWrites` array
4. Every 30s or on match end → `db.items.insertMany(pendingWrites)`

### Reconnection

1. Client stores room token in sessionStorage
2. On disconnect → client reconnects to same WS URL with auth cookie + room token
3. Game server verifies token, finds room, restores player state
4. 30-second grace period before player is removed from room
