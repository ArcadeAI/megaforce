# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development - run all apps (uses Turborepo)
bun dev                    # all apps
bun dev:server             # server only (Elysia on :3000)
bun dev:web                # web only (Vite on :5173)

# Database (Prisma + Docker PostgreSQL)
bun db:start               # start postgres container
bun db:push                # push schema to db (no migration)
bun db:migrate             # create/apply migration
bun db:generate            # regenerate Prisma client
bun db:studio              # open Prisma Studio

# Linting (Biome)
bun check                  # lint + format entire repo

# Type checking
bun check-types            # typecheck all packages
bun check-eden-types       # verify Eden treaty types match server

# Build
bun build                  # build all packages
```

## Architecture

**Monorepo** managed by Bun workspaces + Turborepo.

### Apps

- **`apps/server`** — Elysia (Bun runtime) REST API + WebSocket server on port 3000
  - Routes in `src/routes/` as Elysia plugins with `prefix` option
  - Auth middleware chain: `requireAuth` → `requireWorkspace` via `.derive()` in `/api/protected` group
  - Better Auth handles `/api/auth/*` via `.onRequest()` interceptor
  - WebSocket at `/ws` using Elysia native `.ws()` (Bun WebSocket, not Socket.IO)
  - `type App = typeof app` exported for Eden treaty client

- **`apps/web`** — React 19 + Vite + TanStack Router (file-based routing in `src/routes/`)
  - API calls via Eden treaty client (`@elysiajs/eden`) — end-to-end type-safe with server
  - Auth via `better-auth/react` client (`src/lib/auth-client.ts`)
  - State: TanStack Query for server state, React Context for UI state (tabs)
  - UI: Tailwind CSS v4 + shadcn/ui components + Tiptap editor
  - WebSocket singleton client initialized at root layout level (`__root.tsx`)

### Packages

- **`packages/db`** — Prisma client with PostgreSQL (via `@prisma/adapter-pg`). Multi-file schema in `prisma/schema/`. Generated client in `prisma/generated/`.
- **`packages/auth`** — Better Auth server config with Prisma adapter. Auth schema in `prisma/schema/auth.prisma`.
- **`packages/env`** — Type-safe env validation via `@t3-oss/env-core`. Exports `@megaforce/env/server` and `@megaforce/env/web`.
- **`packages/config`** — Shared TypeScript config.

### Key Patterns

- **Eden treaty**: Web client imports `type App` from server for type-safe API calls. The API client (`apps/web/src/lib/api/client.ts`) auto-attaches auth bearer token.
- **API layer**: Each domain has three files — server route (`apps/server/src/routes/`), client wrapper (`apps/web/src/lib/api/`), and React Query hook (`apps/web/src/lib/hooks/`).
- **Query keys**: Follow factory pattern (e.g., `workspaceKeys.detail(id)`).
- **WebSocket gotcha**: Elysia `.ws()` creates different wrapper objects per callback (open/message/close). Connection ID is stored on `ws.data.__connectionId` to persist across callbacks. Do NOT use WeakMap/Map keyed by `ws` reference.
- **Tab system**: `TabProvider` context with localStorage persistence. Tab IDs should be deterministic (e.g., `file-${fileName}`) for deduplication.

## Code Style

- **Formatter**: Biome — tabs for indentation, double quotes for JS/TS
- **Package manager**: Bun (not npm/npx)
- **Env vars**: Root `.env` loaded first, then app-local `.env` overrides. Web vars prefixed with `VITE_`.
- **Prisma schema**: Split across `packages/db/prisma/schema/` (schema.prisma, auth.prisma, megaforce.prisma)
