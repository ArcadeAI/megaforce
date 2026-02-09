# API Client and TanStack Query Setup

This directory contains the API client infrastructure and data fetching utilities for the Megaforce web application.

## Overview

The API layer is built with:

- **TanStack Query v5** - Data fetching, caching, and state management
- **Elysia Eden Treaty** - Type-safe API client with end-to-end TypeScript support
- **Better Auth** - Authentication and session management

## Architecture

### Base Client (`client.ts`)

The base client wraps the Eden Treaty client with:

- Automatic auth header injection from Better Auth sessions
- Credential handling for cross-origin requests
- Error handling utilities
- Typed API response format

```typescript
import { apiClient } from "@/lib/api/client";

// The apiClient automatically includes auth headers
const response = await apiClient.someEndpoint.get();
```

### API Modules

Each domain has its own API module with typed functions:

- **`workspaces.ts`** - Workspace CRUD operations
- **`sources.ts`** - Data source management (GitHub, Linear, etc.)
- **`personas.ts`** - Persona/agent management
- **`projects.ts`** - Project CRUD and operations
- **`candidates.ts`** - Content candidate management
- **`publishing.ts`** - Publishing targets and jobs
- **`analytics.ts`** - Analytics and metrics

All API functions follow the pattern:

```typescript
export const resourceApi = {
  async getAll(): Promise<ApiResponse<Resource[]>> { ... },
  async getById(id: string): Promise<ApiResponse<Resource>> { ... },
  async create(input: CreateInput): Promise<ApiResponse<Resource>> { ... },
  async update(id: string, input: UpdateInput): Promise<ApiResponse<Resource>> { ... },
  async delete(id: string): Promise<ApiResponse<void>> { ... },
};
```

## Custom Hooks (`/lib/hooks/`)

TanStack Query hooks provide automatic caching, loading states, and error handling:

### Query Hooks (Read Operations)

```typescript
import { useWorkspaces, useWorkspace } from "@/lib/hooks";

// Fetch all workspaces (cached, auto-refetches)
const { data, isLoading, error } = useWorkspaces();

// Fetch single workspace
const { data: workspace } = useWorkspace(id);
```

### Mutation Hooks (Write Operations)

```typescript
import { useCreateWorkspace, useUpdateWorkspace } from "@/lib/hooks";

// Create workspace with auto-invalidation
const createWorkspace = useCreateWorkspace({
	onSuccess: () => {
		toast.success("Workspace created!");
	},
});

await createWorkspace.mutateAsync({
	name: "My Workspace",
	slug: "my-workspace",
});
```

## Cache Invalidation Strategy

### Query Keys

Each resource uses a hierarchical query key structure:

```typescript
// Workspaces
["workspaces", "list"][("workspaces", "detail", id)][ // All workspaces // Single workspace
	// Projects
	("projects", "list", { workspaceId })
][("projects", "detail", id)][ // Projects for workspace // Single project
	// Candidates
	("candidates", "list", { projectId })
][("candidates", "detail", id)]; // Candidates for project // Single candidate
```

### Automatic Invalidation

Mutations automatically invalidate related queries:

**Create Operations:**

- Invalidate list queries for the parent resource
- Example: Creating a project invalidates `["projects", "list", { workspaceId }]`

**Update Operations:**

- Invalidate both list and detail queries
- Example: Updating a project invalidates:
  - `["projects", "list", { workspaceId }]`
  - `["projects", "detail", id]`

**Delete Operations:**

- Invalidate list queries
- Remove detail queries from cache
- Example: Deleting a project:
  - Invalidates `["projects", "list", { workspaceId }]`
  - Removes `["projects", "detail", id]`

### Manual Invalidation

For complex scenarios, use the QueryClient directly:

```typescript
import { useQueryClient } from "@tanstack/react-query";

const queryClient = useQueryClient();

// Invalidate all workspace queries
queryClient.invalidateQueries({ queryKey: ["workspaces"] });

// Invalidate specific workspace
queryClient.invalidateQueries({
	queryKey: ["workspaces", "detail", workspaceId],
});

// Remove from cache without refetching
queryClient.removeQueries({
	queryKey: ["workspaces", "detail", workspaceId],
});
```

## Configuration

QueryClient is configured in `main.tsx` with:

```typescript
const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 1000 * 60 * 5, // 5 minutes
			gcTime: 1000 * 60 * 10, // 10 minutes (cache lifetime)
			retry: 1, // Retry failed requests once
			refetchOnWindowFocus: false, // Don't refetch on window focus
		},
		mutations: {
			retry: 1, // Retry failed mutations once
		},
	},
});
```

### Stale Time vs Cache Time

- **Stale Time (5 min)**: Data is considered fresh for 5 minutes. No refetches during this time.
- **GC Time (10 min)**: Cached data is kept in memory for 10 minutes after last use.

### When to Override Defaults

```typescript
// Real-time data - shorter stale time
const { data } = useAnalytics(projectId, {
	staleTime: 1000 * 30, // 30 seconds
});

// Static data - longer stale time
const { data } = useWorkspaces({
	staleTime: 1000 * 60 * 30, // 30 minutes
});

// Disable caching for sensitive data
const { data } = useSession({
	staleTime: 0,
	gcTime: 0,
});
```

## Error Handling

All hooks throw errors that can be caught with error boundaries or handled directly:

```typescript
const { data, error, isError } = useWorkspaces();

if (isError) {
  return <ErrorMessage error={error} />;
}
```

For mutations:

```typescript
const createWorkspace = useCreateWorkspace({
	onError: (error) => {
		toast.error(error.message);
	},
});
```

## Best Practices

1. **Use query keys consistently** - Follow the hierarchical pattern
2. **Invalidate conservatively** - Only invalidate what changed
3. **Leverage stale time** - Reduce unnecessary network requests
4. **Handle loading states** - Show skeletons/loaders while fetching
5. **Type everything** - Use the generated types from API modules
6. **Optimistic updates** - For instant UI feedback on mutations
7. **Error boundaries** - Catch and display errors gracefully

## Future Enhancements

- [ ] Add optimistic updates for common mutations
- [ ] Implement infinite queries for paginated lists
- [ ] Add request deduplication for concurrent requests
- [ ] Set up query prefetching for predicted navigation
- [ ] Add offline support with persistence plugins
