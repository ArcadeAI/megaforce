# Eden Treaty - End-to-End Type Safety Setup

This project uses [Eden Treaty](https://elysiajs.com/eden/overview.html) to provide end-to-end type safety between the Elysia backend and the frontend.

## Overview

Eden Treaty allows the frontend to make fully type-safe API calls to the backend. When you define routes in Elysia, the types are automatically inferred and available in the frontend through the Eden client.

## What's Been Set Up

### 1. Backend Configuration (apps/server/src/index.ts)

The Elysia app instance is now exported as a type:

```typescript
const app = new Elysia()
  .use(cors({ /* ... */ }))
  .get("/", () => "OK")
  // ... more routes
  .listen(3000);

export type App = typeof app;
```

This `App` type contains all the route definitions, parameter types, and return types from your Elysia application.

### 2. Frontend API Client (apps/web/src/lib/api.ts)

A fully typed Eden Treaty client has been created:

```typescript
import { treaty } from "@elysiajs/eden";
import { env } from "@megaforce/env/web";
import type { App } from "../../../server/src/index";

export const api = treaty<App>(env.VITE_SERVER_URL);
```

The `api` object now has full TypeScript support for all backend routes.

### 3. Example Usage (apps/web/src/lib/api-example.ts)

See the example file for how to use the API client:

```typescript
import { api } from "./api";

// TypeScript knows this endpoint exists and what it returns
const { data, error } = await api.index.get();

if (error) {
  console.error("Error:", error);
  return;
}

// data is typed as "OK" based on the backend implementation
console.log(data);
```

## Benefits

1. **Compile-Time Safety**: TypeScript will error if you try to call an endpoint that doesn't exist
2. **Auto-Complete**: Your IDE will suggest available endpoints and their parameters
3. **Type-Safe Responses**: Response data is correctly typed based on what the backend returns
4. **Refactoring Support**: Renaming or changing routes on the backend will immediately show errors in the frontend
5. **No Code Generation**: Everything works through TypeScript's type inference

## Verification

Run the type safety check to verify the setup:

```bash
bun run check-eden-types
```

This script verifies:
- The backend exports the `App` type
- The frontend correctly imports and uses the `App` type
- Eden packages are installed in both projects

## Adding New Endpoints

When you add new routes to the Elysia backend:

```typescript
// In apps/server/src/index.ts
const app = new Elysia()
  .get("/users", () => [{ id: 1, name: "Alice" }])
  .post("/users", ({ body }) => {
    // handle user creation
    return { success: true };
  });
```

The frontend automatically gets type-safe access:

```typescript
// In your frontend code
import { api } from "@/lib/api";

// GET /users - TypeScript knows this returns an array of users
const { data: users } = await api.users.get();

// POST /users - TypeScript enforces the correct body structure
const { data: result } = await api.users.post({
  body: { name: "Bob" }
});
```

## Resources

- [Eden Treaty Documentation](https://elysiajs.com/eden/treaty/overview.html)
- [Elysia Documentation](https://elysiajs.com)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
