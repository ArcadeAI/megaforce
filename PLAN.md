# Megaforce Implementation Plan

## Executive Summary

Megaforce is a multi-user content generation platform where users create personas that write content in specific styles. The app features an IDE-like interface for managing sources, personas, projects, and approving AI-generated content candidates before publishing to social platforms.

**🚀 MVP Strategy (Lean Approach):**

- **Phases 1-5 (5 weeks):** Ship working Twitter tweet flow end-to-end
- **Phases 6-14 (9 weeks):** Incrementally add features based on feedback
- **Goal:** Get user feedback fast, iterate based on real usage

**MVP Scope (Phase 5 Deliverable):**

- ✅ URL sources with simple markdown extraction
- ✅ Personas with manually-entered style profiles
- ✅ Projects with source references
- ✅ Twitter single tweet generation via OpenRouter
- ✅ Inbox-style approval workflow with Tiptap editing
- ✅ Scheduled publishing to Twitter via Arcade.dev

**Post-MVP Features (Phases 6-14):**

- Phase 6: Content calendar & analytics
- Phase 7: Automated style learning
- Phase 8: PDF support (LlamaParse + R2)
- Phase 9: Twitter threads
- Phase 10-11: LinkedIn & Reddit
- Phase 12: Blog posts
- Phase 13: Platform-specific parsers
- Phase 14: Polish & production

**Tech Stack:**

- UI: VS Code-style layout, Tiptap editor, TailwindCSS, shadcn/ui
- Backend: Elysia, Prisma, BullMQ (Redis), WebSocket
- AI: OpenRouter (per-project model selection)
- Social: Arcade.dev (NO raw APIs)
- Storage: Cloudflare R2 (Phase 8+), generic URL scraper (Phase 2)
- State: TanStack Query + React Context

---

## Implementation Phases (Lean MVP Approach)

**Strategy:** Ship fast, iterate based on feedback. Start with Twitter tweets only, add features incrementally.

### Phase 1: Foundation & Infrastructure (Week 1)

- Database schema, Redis, WebSocket
- VS Code-style layout
- BullMQ job queues
- Skip R2 and LlamaParse for now
- Implement a local development version to test the app fully locally

### Phase 2: URL Sources (Week 2)

- Simple URL-to-markdown extraction
- Text sources
- No PDFs, no platform-specific parsers

### Phase 3: Personas & Twitter (Week 3)

- Manual style profiles
- Connect Twitter via Arcade.dev
- Skip automated style learning

### Phase 4: Projects & Tweet Generation (Week 4)

- Generate single tweets via OpenRouter
- Only SINGLE_TWEET output type
- Per-project model selection

### Phase 5: Approval & Publishing (Week 5) ⭐ **MVP**

- **FULL END-TO-END FLOW WORKS!**
- Inbox, Tiptap editing, scheduling
- Publish to Twitter via Arcade.dev
- First usable version for user feedback

### Phase 6-14: Incremental Features

- Calendar & analytics (Week 6)
- Automated style learning (Week 7)
- PDF support (Week 8)
- Twitter threads, LinkedIn, Reddit (Weeks 9-11)
- Blog posts, platform parsers, polish (Weeks 12-14)

---

## 1. Database Schema

### Location

`/Users/mateo/Arcade/pg/megaforce/packages/db/prisma/schema/megaforce.prisma`

### Models to Create

**Core Entities:**

- `Workspace` - Single workspace per user, contains all resources
- `Source` - URLs, text, or PDFs (content to write about or style examples)
- `Persona` - Characters with writing styles, linked to social channels
- `SocialChannel` - Connected social accounts (Twitter, LinkedIn, Reddit)
- `Project` - Collections of sources + personas + instructions + output configs
- `OutputConfig` - Configuration for each output type (tweet, thread, LinkedIn post, etc.)

**Content Workflow:**

- `ContentCandidate` - AI-generated content awaiting approval
- `PublishedContent` - Approved content that's been published or scheduled

**Linking Tables (Many-to-Many):**

- `PersonaSource` - Links personas to sources for style learning, tracks confirmation status
- `ProjectSource` - Links projects to reference sources
- `ProjectPersona` - Links personas to projects with custom instructions
- `SocialChannel` - Links personas to social platforms via Arcade.dev

**Background Processing:**

- `JobQueue` - Tracks BullMQ jobs (ingestion, style learning, generation, publishing, analytics)
- `WebSocketConnection` - Tracks active WebSocket connections for real-time updates

**Key Enums:**

- `SourceType`: URL, TEXT, PDF
- `SocialPlatform`: TWITTER, LINKEDIN, REDDIT
- `OutputType`: TWITTER_THREAD, SINGLE_TWEET, LINKEDIN_POST, BLOG_POST, REDDIT_POST
- `CandidateStatus`: GENERATING, PENDING, APPROVED, SCHEDULED, REJECTED, PUBLISHED, FAILED
- `JobType`: SOURCE_INGESTION, STYLE_LEARNING, CONTENT_GENERATION, CONTENT_PUBLISHING, ANALYTICS_FETCH
- `StyleLearningStatus`: PENDING, CONFIRMED, REJECTED

**Style Profile Structure (JSON):**
Stored in `Persona.styleProfile` as structured attributes:

```json
{
  "tone": "casual|professional|humorous|serious",
  "formality": 1-10,
  "vocabularyLevel": "simple|intermediate|advanced",
  "sentenceLengthAvg": 15,
  "emojiUsage": "none|occasional|frequent",
  "humorStyle": "sarcastic|witty|playful|none",
  "perspectivePreference": "first-person|third-person",
  "paragraphLength": "short|medium|long",
  "punctuationStyle": "minimal|standard|expressive"
}
```

### Schema Extension for Existing Models

Update `/Users/mateo/Arcade/pg/megaforce/packages/db/prisma/schema/auth.prisma`:

Add to existing `User` model:

```prisma
workspaces     Workspace[]
wsConnections  WebSocketConnection[]
```

---

## 2. Backend Architecture

### Directory Structure

```
apps/server/src/
├── index.ts                    # Main entry, WebSocket + HTTP server
├── routes/                     # API route handlers
│   ├── workspaces.ts
│   ├── sources.ts
│   ├── personas.ts
│   ├── projects.ts
│   ├── candidates.ts
│   ├── publishing.ts
│   ├── social-channels.ts
│   ├── analytics.ts
│   └── upload.ts
├── services/                   # Business logic
│   ├── source-parser/
│   │   ├── index.ts           # Main parser router
│   │   ├── pdf-parser.ts      # LlamaParse integration
│   │   ├── url-parser.ts      # URL dispatcher
│   │   └── platform-parsers/
│   │       ├── twitter-parser.ts
│   │       ├── linkedin-parser.ts
│   │       ├── reddit-parser.ts
│   │       └── generic-parser.ts  # Fallback scraper
│   ├── ai/
│   │   ├── openrouter-client.ts   # OpenRouter API client
│   │   ├── style-analyzer.ts      # Extract style attributes from sources
│   │   └── content-generator.ts   # Generate content candidates
│   ├── publishing/
│   │   ├── arcade-client.ts       # Arcade.dev API client
│   │   └── platform-publishers/
│   │       ├── twitter-publisher.ts
│   │       ├── linkedin-publisher.ts
│   │       └── reddit-publisher.ts
│   ├── storage/
│   │   └── r2-client.ts           # Cloudflare R2 client
│   └── analytics/
│       └── metrics-fetcher.ts     # Fetch engagement via Arcade.dev
├── jobs/
│   ├── queue.ts                   # BullMQ setup
│   ├── workers/                   # Job workers
│   │   ├── source-ingestion-worker.ts
│   │   ├── style-learning-worker.ts
│   │   ├── content-generation-worker.ts
│   │   ├── publishing-worker.ts
│   │   └── analytics-worker.ts
│   └── processors/                # Job processors (actual work)
│       ├── source-processor.ts
│       ├── style-processor.ts
│       ├── generation-processor.ts
│       ├── publishing-processor.ts
│       └── analytics-processor.ts
├── websocket/
│   ├── server.ts                  # WebSocket server setup
│   ├── handlers.ts                # Connection handlers
│   └── events.ts                  # Event types and emitters
├── middleware/
│   ├── auth.ts                    # Better-Auth middleware (existing)
│   ├── workspace.ts               # Workspace context middleware
│   └── error-handler.ts           # Global error handler
└── utils/
    ├── retry.ts                   # Exponential backoff utility
    └── validators.ts              # Zod schemas for API validation
```

### API Routes (RESTful)

**Workspaces**

- `GET /api/workspaces` - Get user's workspace
- `PATCH /api/workspaces/:id` - Update workspace settings

**Sources**

- `GET /api/sources` - List sources (filterable by type, project)
- `POST /api/sources` - Create source (text or URL)
- `GET /api/sources/:id` - Get source details
- `PATCH /api/sources/:id` - Update source
- `DELETE /api/sources/:id` - Delete source
- `POST /api/sources/batch` - Bulk create sources
- `POST /api/sources/:id/parse` - Trigger re-parsing

**Personas**

- `GET /api/personas` - List personas
- `POST /api/personas` - Create persona
- `GET /api/personas/:id` - Get persona with style profile
- `PATCH /api/personas/:id` - Update persona
- `DELETE /api/personas/:id` - Delete persona
- `POST /api/personas/:id/sources` - Link sources
- `DELETE /api/personas/:id/sources/:sourceId` - Unlink source
- `POST /api/personas/:id/learn-style` - Trigger style learning job
- `POST /api/personas/:id/style-confirmations` - Confirm/reject style updates

**Social Channels**

- `GET /api/personas/:personaId/channels` - List channels
- `POST /api/personas/:personaId/channels` - Connect channel
- `PATCH /api/channels/:id` - Update channel
- `DELETE /api/channels/:id` - Disconnect channel
- `POST /api/channels/:id/test` - Test connection

**Projects**

- `GET /api/projects` - List projects
- `POST /api/projects` - Create project
- `GET /api/projects/:id` - Get project details
- `PATCH /api/projects/:id` - Update project (including model selection)
- `DELETE /api/projects/:id` - Delete project
- `POST /api/projects/:id/sources` - Add sources
- `DELETE /api/projects/:id/sources/:sourceId` - Remove source
- `POST /api/projects/:id/personas` - Add persona with instructions
- `PATCH /api/projects/:id/personas/:personaId` - Update instructions
- `DELETE /api/projects/:id/personas/:personaId` - Remove persona
- `POST /api/projects/:id/personas/:personaId/outputs` - Configure output type
- `PATCH /api/projects/:id/outputs/:outputId` - Update output config
- `DELETE /api/projects/:id/outputs/:outputId` - Remove output
- `POST /api/projects/:id/generate` - Trigger content generation

**Candidates**

- `GET /api/candidates` - Inbox-style list (filterable by status, persona, project)
- `GET /api/candidates/:id` - Get candidate details
- `POST /api/candidates/:id/approve` - Approve as-is
- `POST /api/candidates/:id/approve-edit` - Approve with edits (tracks diff)
- `POST /api/candidates/:id/reject` - Reject with optional feedback
- `POST /api/candidates/:id/regenerate` - Request new candidate
- `PATCH /api/candidates/:id/schedule` - Schedule approved candidate

**Publishing**

- `GET /api/published` - List published content
- `GET /api/published/:id` - Get published content details
- `POST /api/published/:id/retry` - Retry failed publish

**Analytics**

- `GET /api/analytics/overview` - Workspace analytics
- `GET /api/analytics/personas/:id` - Persona analytics
- `GET /api/analytics/content/:id` - Individual content analytics
- `POST /api/analytics/refresh` - Trigger analytics fetch

**File Upload**

- `POST /api/upload` - Get presigned R2 URL for file upload
- `POST /api/sources/:id/confirm-upload` - Confirm upload complete, trigger processing

### Background Jobs (BullMQ)

**Queues:**

1. `sourceIngestionQueue` - Priority: High
2. `styleLearningQueue` - Priority: Medium
3. `contentGenerationQueue` - Priority: High
4. `publishingQueue` - Priority: Critical
5. `analyticsQueue` - Priority: Low

**Job Workflows:**

**Source Ingestion:**

- Input: `{ sourceId, type, url?, fileUrl? }`
- Process:
  - PDF: Call LlamaParse API, store result
  - URL: Detect platform, call parser, fallback to generic
  - TEXT: Store directly
- Output: Parsed content in database
- Events: `source:parsing`, `source:parsed`, `source:failed`

**Style Learning:**

- Input: `{ personaId, sourceIds }`
- Process:
  - Fetch source contents
  - Call OpenRouter to analyze style
  - Extract structured attributes
  - Create PersonaSource with PENDING status
- Output: Style profile draft awaiting confirmation
- Events: `style:learning`, `style:ready_for_confirmation`
- User must confirm/reject via UI to update persona's styleProfile

**Content Generation:**

- Input: `{ outputConfigId, projectId, personaId, candidateCount, modelId? }`
- Process:
  - Fetch project sources, persona style, instructions
  - Call OpenRouter with context and output type requirements
  - Generate N candidates
  - Store with PENDING status
- Output: Content candidates in database
- Events: `generation:started`, `generation:progress`, `generation:completed`

**Publishing:**

- Input: `{ publishedContentId, candidateId, channelId, scheduledFor? }`
- Process:
  - Wait until scheduledFor time if set
  - Call Arcade.dev for platform
  - Post content
  - Store platform response (post ID, URL)
  - Update status to PUBLISHED
- Output: Platform post ID and URL
- Events: `publishing:started`, `publishing:success`, `publishing:failed`
- Retry: 3 attempts with exponential backoff (1s, 2s, 4s)

**Analytics Fetch:**

- Input: `{ publishedContentIds }`
- Process:
  - Call Arcade.dev to fetch engagement metrics
  - Update PublishedContent.analytics
- Output: Updated metrics
- Events: `analytics:updated`
- Schedule: Periodic (every 6 hours for recent content)

### WebSocket Events

**Event Types:**

```typescript
// Sources
"source:created" | "source:parsing" | "source:parsed" | "source:failed";

// Style Learning
"style:learning" | "style:ready_for_confirmation" | "style:confirmed";

// Generation
"generation:started" | "generation:progress" | "generation:completed";

// Candidates
"candidate:created" | "candidate:updated";

// Publishing
"publishing:started" |
	"publishing:success" |
	"publishing:failed" |
	"publishing:scheduled";

// Analytics
("analytics:updated");

// Jobs
"job:progress" | "job:completed" | "job:failed";
```

**Event Rooms:**

- `user:{userId}` - User-specific events
- `workspace:{workspaceId}` - Workspace events
- `project:{projectId}` - Project-specific events

---

## 3. Frontend Architecture

### Directory Structure

```
apps/web/src/
├── routes/                          # TanStack Router file-based routes
│   ├── __root.tsx                   # Root layout (existing)
│   ├── index.tsx                    # Landing page (existing)
│   ├── login.tsx                    # Auth page (existing)
│   ├── dashboard.tsx                # Main app layout with VS Code-style UI
│   ├── dashboard/
│   │   ├── index.tsx                # Workspace overview
│   │   ├── inbox.tsx                # Approval inbox
│   │   ├── calendar.tsx             # Content calendar (month grid + timeline)
│   │   ├── analytics.tsx            # Analytics dashboard
│   │   ├── sources/
│   │   │   ├── index.tsx            # Sources list
│   │   │   ├── $sourceId.tsx        # Source detail
│   │   │   └── new.tsx              # Create source
│   │   ├── personas/
│   │   │   ├── index.tsx            # Personas list
│   │   │   ├── $personaId.tsx       # Persona detail/editor
│   │   │   └── new.tsx              # Create persona
│   │   └── projects/
│   │       ├── index.tsx            # Projects list
│   │       ├── $projectId/
│   │       │   ├── index.tsx        # Project detail (tabs)
│   │       │   ├── sources.tsx      # Sources tab
│   │       │   ├── personas.tsx     # Personas tab
│   │       │   └── outputs.tsx      # Output configs tab
│   │       └── new.tsx              # Create project
├── components/
│   ├── layouts/
│   │   ├── app-layout.tsx           # VS Code-style layout
│   │   ├── sidebar-nav.tsx          # Left sidebar navigation
│   │   ├── main-editor.tsx          # Main content area with tabs
│   │   └── properties-panel.tsx     # Right sidebar (collapsible)
│   ├── sources/
│   │   ├── source-card.tsx
│   │   ├── source-list.tsx
│   │   ├── source-upload.tsx        # Drag-and-drop file upload
│   │   ├── url-input.tsx
│   │   └── source-type-badge.tsx
│   ├── personas/
│   │   ├── persona-card.tsx
│   │   ├── persona-list.tsx
│   │   ├── persona-editor.tsx
│   │   ├── style-profile-editor.tsx # Edit structured style attributes
│   │   ├── style-confirmation-modal.tsx  # Confirm/reject style updates
│   │   ├── social-channel-connector.tsx
│   │   └── source-linker.tsx
│   ├── projects/
│   │   ├── project-card.tsx
│   │   ├── project-list.tsx
│   │   ├── project-wizard.tsx       # Multi-step project creation
│   │   ├── source-selector.tsx
│   │   ├── persona-config.tsx
│   │   ├── output-config-form.tsx   # Configure output type settings
│   │   └── model-selector.tsx       # OpenRouter model selection
│   ├── candidates/
│   │   ├── candidate-inbox.tsx      # Inbox-style queue
│   │   ├── candidate-card.tsx
│   │   ├── candidate-preview.tsx
│   │   ├── candidate-editor.tsx     # Tiptap editor for editing
│   │   ├── approval-actions.tsx     # Approve/Edit/Reject buttons
│   │   ├── rejection-modal.tsx
│   │   └── schedule-modal.tsx
│   ├── editor/
│   │   ├── tiptap-editor.tsx        # Main Tiptap component
│   │   ├── toolbar.tsx
│   │   └── extensions/
│   │       ├── twitter-thread.ts    # Custom extension for thread formatting
│   │       └── markdown-shortcuts.ts
│   ├── analytics/
│   │   ├── analytics-overview.tsx
│   │   ├── engagement-chart.tsx
│   │   ├── performance-metrics.tsx
│   │   └── platform-breakdown.tsx
│   ├── calendar/
│   │   ├── content-calendar.tsx     # Calendar wrapper
│   │   ├── month-grid.tsx           # Month view
│   │   ├── timeline-list.tsx        # Timeline list view
│   │   └── schedule-item.tsx
│   ├── shared/
│   │   ├── file-upload.tsx
│   │   ├── loading-spinner.tsx
│   │   ├── empty-state.tsx
│   │   ├── status-badge.tsx
│   │   ├── platform-icon.tsx
│   │   ├── date-picker.tsx
│   │   └── confirmation-dialog.tsx
│   ├── header.tsx (existing)
│   └── ui/ (existing shadcn components)
├── lib/
│   ├── api/                         # API client functions
│   │   ├── client.ts                # Base API client
│   │   ├── workspaces.ts
│   │   ├── sources.ts
│   │   ├── personas.ts
│   │   ├── projects.ts
│   │   ├── candidates.ts
│   │   ├── publishing.ts
│   │   └── analytics.ts
│   ├── websocket/
│   │   ├── client.ts                # WebSocket client
│   │   ├── hooks.ts                 # useWebSocket, useRealtimeUpdates
│   │   └── events.ts
│   ├── hooks/
│   │   ├── use-workspace.ts
│   │   ├── use-sources.ts
│   │   ├── use-personas.ts
│   │   ├── use-projects.ts
│   │   ├── use-candidates.ts
│   │   └── use-upload.ts
│   ├── utils.ts (existing)
│   └── auth-client.ts (existing)
└── types/
    ├── workspace.ts
    ├── source.ts
    ├── persona.ts
    ├── project.ts
    ├── candidate.ts
    └── analytics.ts
```

### VS Code-Style Layout

**Component:** `/Users/mateo/Arcade/pg/megaforce/apps/web/src/components/layouts/app-layout.tsx`

**Layout Structure:**

```
┌─────────────────────────────────────────────────────────────┐
│  Header (User menu, theme toggle)                           │
├─────────┬────────────────────────────────────┬──────────────┤
│         │                                    │              │
│ Left    │  Main Editor Area                  │ Right        │
│ Sidebar │  ┌──────────────────────────────┐  │ Sidebar      │
│         │  │ Tab 1 │ Tab 2 │ Tab 3    [+] │  │ (Properties) │
│ - Home  │  ├──────────────────────────────┤  │              │
│ - Inbox │  │                              │  │ Collapsible  │
│ Sources │  │                              │  │              │
│ Personas│  │      Active Tab Content      │  │ Context-     │
│ Projects│  │                              │  │ sensitive    │
│ Calendar│  │                              │  │ panels       │
│ Analytics  │                              │  │              │
│         │  │                              │  │              │
│         │  └──────────────────────────────┘  │              │
└─────────┴────────────────────────────────────┴──────────────┘
```

**Features:**

- Resizable panels (left sidebar 200-400px, right sidebar 250-400px)
- Tab management (open, close, switch, drag to reorder)
- Keyboard shortcuts (Cmd+B toggle sidebar, Cmd+W close tab, Cmd+T new tab)
- Persistent layout state (localStorage)
- Breadcrumb navigation

### State Management Strategy

**TanStack Query for Server State:**

- All API data fetching and caching
- Automatic refetching and cache invalidation
- Optimistic updates for better UX
- Error and loading state management

**React Context for UI State:**

- Active workspace
- Tab management (open tabs, active tab)
- Sidebar collapse state
- Theme (already implemented)

**No global state library needed** - TanStack Query + Context is sufficient.

### Real-time Updates (WebSocket)

**Hook:** `useRealtimeUpdates()`

Automatically connects to WebSocket server when user logs in, subscribes to relevant rooms, and invalidates TanStack Query cache when events arrive.

Example:

```typescript
// In candidate inbox component
useRealtimeUpdates(["candidate:created", "candidate:updated"], () => {
	queryClient.invalidateQueries({ queryKey: ["candidates"] });
});
```

---

## 4. External Integrations

### OpenRouter (AI Generation)

**Service:** `/Users/mateo/Arcade/pg/megaforce/apps/server/src/services/ai/openrouter-client.ts`

**Configuration:**

- API Key: `OPENROUTER_API_KEY` (env var)
- Per-project model selection with user override
- Suggested models:
  - Long-form content: `anthropic/claude-3.5-sonnet`
  - Short-form tweets: `openai/gpt-4o-mini` (cost-effective)
  - Style analysis: `anthropic/claude-3.5-sonnet`

**Use Cases:**

1. **Style Analysis** - Extract writing patterns from sources
2. **Content Generation** - Create candidates based on persona + sources
3. **Content Refinement** - Regenerate based on rejection feedback

**Retry Logic:** Exponential backoff with circuit breaker for API failures

### Arcade.dev (Social Publishing & Analytics)

**Service:** `/Users/mateo/Arcade/pg/megaforce/apps/server/src/services/publishing/arcade-client.ts`

library `@arcadeai/arcadejs`

**Configuration:**

- API Key: `ARCADE_API_KEY` (env var)
- Each persona will use their persona ID as the user_id with Arcade.dev
- Arcade.dev manages auth and refresh tokens, so there's no need to worry about that on our end

**Platform Operations:**

**Twitter/X:**

- Tools: https://docs.arcade.dev/en/resources/integrations/social-communication/x
- Publish single tweets or threads
- Fetch likes, retweets, replies, views

**LinkedIn:**

- Tools: https://docs.arcade.dev/en/resources/integrations/social-communication/linkedin
- Publish posts with optional link placement

**Reddit:**

- Tools: https://docs.arcade.dev/en/resources/integrations/social-communication/reddit
- Submit text or link posts to specified subreddit
- Fetch upvotes, comments, awards

**Rate Limiting:** Respect platform rate limits (stored per channel)

### LlamaParse (PDF Parsing)

**Service:** `/Users/mateo/Arcade/pg/megaforce/apps/server/src/services/source-parser/pdf-parser.ts`

**Configuration:**

- API Key: `LLAMAPARSE_API_KEY` (env var)

**Workflow:**

1. Upload PDF to LlamaParse
2. Poll for parsing completion
3. Retrieve structured content (preserves tables, layouts)
4. Store in `Source.content`

**Error Handling:** Fallback to basic text extraction if LlamaParse fails

### Cloudflare R2 (File Storage)

**Service:** `/Users/mateo/Arcade/pg/megaforce/apps/server/src/services/storage/r2-client.ts`

**Configuration:**

- Bucket: Create `megaforce-sources` bucket
- Credentials: `CLOUDFLARE_R2_ACCOUNT_ID`, `CLOUDFLARE_R2_ACCESS_KEY_ID`, `CLOUDFLARE_R2_SECRET_ACCESS_KEY`
- Path structure: `{workspaceId}/{sourceId}/{filename}`

**Upload Flow:**

1. Frontend requests presigned URL: `POST /api/upload`
2. Backend generates presigned URL (15-minute expiry)
3. Frontend uploads directly to R2
4. Frontend confirms: `POST /api/sources/:id/confirm-upload`
5. Backend triggers parsing job

**Public Access:** Enable public access for uploaded files (needed for LlamaParse)

### Redis (Job Queue & WebSocket)

**Configuration:**

- Self-hosted Docker container
- Connection: `redis://localhost:6379`

**Docker Compose:**
Add to `/Users/mateo/Arcade/pg/megaforce/docker-compose.yml`:

```yaml
services:
  postgres:
    # ... existing

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes

volumes:
  postgres_data:
  redis_data:
```

**Usage:**

- BullMQ job queues
- WebSocket adapter for multi-instance deployments (future)
- Session caching (optional)

---

## 5. Key Features Implementation

### Source Ingestion Flow

1. **User uploads file or adds URL**
2. **Backend creates Source record** with status PARSING
3. **Job enqueued** to `sourceIngestionQueue`
4. **Worker processes**:
   - PDF: Upload to R2 → Call LlamaParse → Store content
   - URL: Detect platform → Call parser → Store content
   - Text: Store directly
5. **WebSocket event** `source:parsed` → Frontend updates UI
6. **User can link to persona** for style learning

### Persona Style Learning Flow

1. **User links sources to persona**
2. **System triggers style learning job** (automatic)
3. **Worker analyzes sources** via OpenRouter
4. **Creates PersonaSource** with PENDING status
5. **WebSocket event** `style:ready_for_confirmation`
6. **User sees modal** with proposed style updates
7. **User confirms or rejects**:
   - Confirm: Updates `Persona.styleProfile`, status → CONFIRMED
   - Reject: Status → REJECTED, can trigger new analysis
   - Add as new style: Creates new style profile variant (future enhancement)

### Content Generation Flow

1. **User configures project**: Sources + Personas + Output types
2. **User clicks "Generate"** button
3. **Backend enqueues jobs** to `contentGenerationQueue` (one per output config)
4. **Worker generates content**:
   - Fetch project sources, persona style, instructions
   - Build prompt with context
   - Call OpenRouter (stream if long-form)
   - Create ContentCandidate with status PENDING
5. **WebSocket event** `candidate:created` → Appears in inbox
6. **User reviews in inbox**

### Approval Workflow (Inbox)

**Component:** `/Users/mateo/Arcade/pg/megaforce/apps/web/src/routes/dashboard/inbox.tsx`

**UI Design:**

- Left pane: List of pending candidates (sorted by creation date)
- Right pane: Selected candidate preview with Tiptap editor
- Actions bar: Approve | Edit & Approve | Reject | Regenerate

**Actions:**

1. **Approve**: Candidate → APPROVED status → User schedules or publishes immediately
2. **Edit & Approve**: User edits in Tiptap → Saves diff → APPROVED → Schedule/publish
3. **Reject with feedback**: Modal opens → User provides feedback → Status REJECTED → Option to regenerate
4. **Reject without feedback**: Status REJECTED → No regeneration
5. **Regenerate**: Creates new generation job with same config

**Keyboard Shortcuts:**

- `j/k` - Navigate candidates
- `a` - Approve
- `e` - Edit
- `r` - Reject
- `g` - Regenerate

### Publishing & Scheduling Flow

1. **User approves candidate** and clicks "Schedule"
2. **Schedule modal opens**: Date/time picker
3. **Backend creates PublishedContent** with scheduledFor timestamp
4. **Publishing job enqueued** with delay until scheduledFor
5. **At scheduled time, worker publishes** via Arcade.dev
6. **Platform responds** with post ID and URL
7. **WebSocket event** `publishing:success` → UI updates
8. **Status updates**: SCHEDULED → PUBLISHING → PUBLISHED

**Failed Publishing:**

- Automatic retry (3 attempts with backoff)
- If all fail: Status → FAILED, user can manually retry

### Calendar Views

**Component:** `/Users/mateo/Arcade/pg/megaforce/apps/web/src/routes/dashboard/calendar.tsx`

**Two Views:**

1. **Month Grid**:
   - Shows scheduled and published content on calendar
   - Color-coded by platform (blue = Twitter, blue-dark = LinkedIn, orange = Reddit)
   - Click date to see all content for that day
   - Drag-and-drop to reschedule (future enhancement)

2. **Timeline List**:
   - Chronological list grouped by date
   - Shows status, platform, persona, content preview
   - Inline actions (edit schedule, cancel, view analytics)
   - Pagination or infinite scroll

**Toggle:** Button in header to switch between views

### Analytics Dashboard

**Component:** `/Users/mateo/Arcade/pg/megaforce/apps/web/src/routes/dashboard/analytics.tsx`

**Metrics Displayed:**

- Workspace overview: Total posts, avg engagement, top platform
- Persona performance: Which personas perform best
- Content performance: Top posts, engagement trends over time
- Platform breakdown: Engagement by platform

**Charts:**

- Engagement over time (line chart)
- Platform comparison (bar chart)
- Persona performance (pie chart)

**Data Source:** Periodic analytics fetch jobs populate `PublishedContent.analytics`

---

## 6. Implementation Phases (Lean MVP Approach)

**Strategy:** Ship fast, iterate based on feedback. Start with Twitter tweets only, add features incrementally.

---

### Phase 1: Foundation & Infrastructure (Week 1)

**Database:**

- [ ] Create `megaforce.prisma` schema file with all models
- [ ] Update `auth.prisma` to add User relations
- [ ] Run `bun db:push` to sync schema
- [ ] Test database connections

**Docker:**

- [ ] Update `docker-compose.yml` to add Redis service
- [ ] Start Redis: `bun db:start`

**Backend Setup:**

- [ ] Install dependencies: `bullmq`, `ioredis`, `@aws-sdk/client-s3`, `ws`, `axios`, `cheerio` (for URL scraping)
- [ ] Set up BullMQ queues in `/apps/server/src/jobs/queue.ts`
- [ ] Create queue workers structure (empty processors)
- [ ] Set up WebSocket server in `/apps/server/src/websocket/server.ts`
- [ ] Create API route structure (empty handlers)
- [ ] Add authentication middleware to protect routes
- [ ] Add workspace middleware to inject workspace context

**Frontend Setup:**

- [ ] Install dependencies: `@tiptap/react`, `@tiptap/starter-kit`, `socket.io-client`, `@tanstack/react-query`, `date-fns`
- [ ] Create VS Code-style layout components
- [ ] Implement tab management system
- [ ] Create WebSocket client and hooks
- [ ] Set up TanStack Query provider
- [ ] Create API client utility functions

**Environment:**

- [ ] Add new env vars to `packages/env/src/server.ts`:
  - `REDIS_URL`, `OPENROUTER_API_KEY`, `ARCADE_API_KEY`
  - `ENCRYPTION_KEY` (32 chars, for encrypting social credentials)
- [ ] Create `.env.example` file
- [ ] Note: Skip R2, LlamaParse for now (no file uploads in MVP)

**Deliverable:** App runs with new layout, WebSocket connected, job queue initialized

**Testing:**

- [ ] Run `bun dev` → App loads without errors
- [ ] WebSocket connects successfully
- [ ] Redis queue initializes

---

### Phase 2: URL Sources (Simple Text Extraction) (Week 2)

**Backend:**

- [ ] Implement sources CRUD API routes (URLs and TEXT only, no PDFs)
- [ ] Create simple URL-to-markdown parser using `cheerio` or `@mozilla/readability`
- [ ] Implement source ingestion worker for URLs
- [ ] Add WebSocket events for parsing progress

**Frontend:**

- [ ] Create sources list page
- [ ] Create source detail page
- [ ] Implement URL input component
- [ ] Implement simple text input component
- [ ] Create source cards with type badges (URL, TEXT)
- [ ] Add real-time parsing progress indicators
- [ ] Show parsed content preview

**Testing:**

- [ ] Add URL → Verify generic markdown extraction → Content appears
- [ ] Add text source → Verify direct storage
- [ ] View source list → Verify sources displayed
- [ ] Delete source → Verify removed

**Deliverable:** Users can add URLs and text sources, see extracted content

---

### Phase 3: Personas & Twitter Connection (Week 3)

**Backend:**

- [ ] Implement personas CRUD API routes
- [ ] Implement social channels API (Twitter only)
- [ ] Create Arcade.dev client service (Twitter auth & posting)
- [ ] Implement credential encryption/decryption
- [ ] Implement persona-source linking (no style learning yet)
- [ ] Store persona style profile as structured JSON (manual entry for now)

**Frontend:**

- [ ] Create personas list page
- [ ] Create persona editor page
- [ ] Implement style profile form (manual entry of tone, formality, etc.)
- [ ] Create Twitter channel connector component
- [ ] Implement source linking interface (select sources to associate with persona)
- [ ] Add persona creation wizard

**Testing:**

- [ ] Create persona → Manually enter style attributes → Save
- [ ] Link sources to persona → Verify association
- [ ] Connect Twitter account via Arcade.dev → Verify credentials stored
- [ ] Test Twitter connection → Verify API call works

**Deliverable:** Users can create personas with manual style profiles, link sources, connect Twitter

---

### Phase 4: Projects & Tweet Generation (Week 4)

**Backend:**

- [ ] Implement projects CRUD API routes
- [ ] Implement project-source linking
- [ ] Implement project-persona configuration
- [ ] Implement output configs (SINGLE_TWEET only)
- [ ] Create OpenRouter client service
- [ ] Create content generator service (for tweets)
- [ ] Implement content generation worker
- [ ] Add model selection logic (per-project)
- [ ] Add WebSocket events for generation progress

**Frontend:**

- [ ] Create projects list page
- [ ] Create project detail page (sources, personas, outputs tabs)
- [ ] Implement project creation wizard
- [ ] Create source selector (multi-select from workspace sources)
- [ ] Create persona configuration (instructions field)
- [ ] Create tweet output config form (tone, length, include link)
- [ ] Add OpenRouter model selector
- [ ] Add "Generate" button with progress indicator

**Testing:**

- [ ] Create project → Add sources → Add persona → Configure tweet output
- [ ] Select model (e.g., `openai/gpt-4o-mini`) → Click "Generate"
- [ ] Monitor WebSocket → Verify candidate created with PENDING status
- [ ] View candidate content → Verify it's a tweet (280 chars or less)

**Deliverable:** Users can generate tweet candidates for approval

---

### Phase 5: Approval & Publishing to Twitter (Week 5)

**Backend:**

- [ ] Implement candidates CRUD API routes
- [ ] Implement approval endpoints (approve, approve-edit, reject)
- [ ] Implement scheduling endpoint
- [ ] Create publishing worker (Twitter only)
- [ ] Implement Twitter publishing via Arcade.dev
- [ ] Add retry logic with exponential backoff
- [ ] Add WebSocket events for publishing status

**Frontend:**

- [ ] Create candidate inbox page (list + preview)
- [ ] Implement candidate cards
- [ ] Create Tiptap editor for editing tweets
- [ ] Implement approval actions (Approve, Edit & Approve, Reject)
- [ ] Create schedule modal (date/time picker)
- [ ] Add keyboard shortcuts (j/k navigation, a/e/r actions)

**Testing:**

- [ ] Review candidate → Approve → Schedule for 2 minutes from now
- [ ] Wait → Verify WebSocket event `publishing:success`
- [ ] Check Twitter → Verify tweet posted
- [ ] Edit candidate → Approve → Verify diff tracked
- [ ] Reject candidate → Verify status updated

**Deliverable:** **END-TO-END FLOW WORKS!** Users can generate, approve, and publish tweets to Twitter

---

### Phase 6: Content Calendar & Analytics (Week 6)

**Backend:**

- [ ] Implement analytics fetch worker
- [ ] Create Twitter metrics fetcher via Arcade.dev
- [ ] Implement analytics API routes
- [ ] Schedule periodic analytics refresh

**Frontend:**

- [ ] Create content calendar page (month grid + timeline list)
- [ ] Implement view toggle
- [ ] Show scheduled and published tweets on calendar
- [ ] Create basic analytics dashboard (tweet count, avg likes, retweets)
- [ ] Add manual analytics refresh button

**Testing:**

- [ ] View calendar → Verify scheduled tweets shown
- [ ] Publish tweet → Wait 1 hour → Fetch analytics → Verify metrics
- [ ] View analytics dashboard → Verify charts render

**Deliverable:** Users can see content calendar and basic Twitter analytics

---

### Phase 7: Automated Style Learning (Week 7)

**Backend:**

- [ ] Create OpenRouter style analyzer service
- [ ] Implement style learning worker
- [ ] Add style confirmation endpoints
- [ ] Add WebSocket events for style learning

**Frontend:**

- [ ] Create style confirmation modal
- [ ] Add "Learn from sources" button in persona editor
- [ ] Show pending style updates in UI

**Testing:**

- [ ] Link sources to persona → Click "Learn style"
- [ ] Wait for analysis → Review style confirmation modal
- [ ] Approve → Verify persona style profile updated automatically
- [ ] Reject → Verify status updated, can retry

**Deliverable:** Automated style learning with human confirmation

---

### Phase 8: PDF Sources (LlamaParse + R2) (Week 8)

**Backend:**

- [ ] Install `llamaindex` dependency
- [ ] Create R2 client service
- [ ] Create LlamaParse integration
- [ ] Implement file upload with presigned URLs
- [ ] Update source ingestion worker to handle PDFs
- [ ] Add env vars: `CLOUDFLARE_R2_*`, `LLAMAPARSE_API_KEY`

**Frontend:**

- [ ] Install `react-dropzone`
- [ ] Create file upload component (drag-and-drop)
- [ ] Add PDF source type to source creation
- [ ] Show PDF parsing progress

**Testing:**

- [ ] Upload PDF → Verify R2 upload → LlamaParse extracts content
- [ ] Use PDF as source in project → Generate tweet → Verify works

**Deliverable:** Users can upload PDFs as sources

---

### Phase 9: Twitter Threads (Week 9)

**Backend:**

- [ ] Add `TWITTER_THREAD` to OutputType enum
- [ ] Update content generator to handle threads
- [ ] Update Twitter publisher to post threads via Arcade.dev
- [ ] Update analytics fetcher for thread metrics

**Frontend:**

- [ ] Create Twitter thread output config form (num tweets, tone)
- [ ] Update Tiptap editor with thread visualization
- [ ] Show thread structure in candidate preview

**Testing:**

- [ ] Configure thread output (5 tweets) → Generate → Verify thread created
- [ ] Approve thread → Publish → Verify all tweets posted in sequence
- [ ] View analytics → Verify thread metrics

**Deliverable:** Users can generate and publish Twitter threads

---

### Phase 10: LinkedIn Integration (Week 10)

**Backend:**

- [ ] Update Arcade.dev client for LinkedIn
- [ ] Add LinkedIn to SocialPlatform enum
- [ ] Implement LinkedIn publisher
- [ ] Add `LINKEDIN_POST` to OutputType enum
- [ ] Update content generator for LinkedIn posts
- [ ] Implement LinkedIn analytics fetcher

**Frontend:**

- [ ] Add LinkedIn to channel connector
- [ ] Create LinkedIn post output config form
- [ ] Update inbox to show LinkedIn candidates

**Testing:**

- [ ] Connect LinkedIn account → Generate post → Approve → Publish
- [ ] Verify post appears on LinkedIn
- [ ] Fetch analytics → Verify likes/comments/shares

**Deliverable:** LinkedIn support (posts + analytics)

---

### Phase 11: Reddit Integration (Week 11)

**Backend:**

- [ ] Update Arcade.dev client for Reddit
- [ ] Add Reddit to SocialPlatform enum
- [ ] Implement Reddit publisher
- [ ] Add `REDDIT_POST` to OutputType enum
- [ ] Update content generator for Reddit posts
- [ ] Implement Reddit analytics fetcher

**Frontend:**

- [ ] Add Reddit to channel connector
- [ ] Create Reddit post output config form (subreddit selection)
- [ ] Update inbox for Reddit candidates

**Testing:**

- [ ] Connect Reddit → Generate post → Approve → Publish to subreddit
- [ ] Verify post appears on Reddit
- [ ] Fetch analytics → Verify upvotes/comments

**Deliverable:** Reddit support (posts + analytics)

---

### Phase 12: Blog Posts (Week 12)

**Backend:**

- [ ] Add `BLOG_POST` to OutputType enum
- [ ] Update content generator for long-form blog posts
- [ ] Add blog post storage (no publishing, just export)

**Frontend:**

- [ ] Create blog post output config form (length, sections)
- [ ] Enhance Tiptap editor for long-form content
- [ ] Add export options (Markdown, HTML)

**Testing:**

- [ ] Generate blog post → Verify 500-1000 words
- [ ] Export as Markdown → Verify formatting preserved

**Deliverable:** Blog post generation with export

---

### Phase 13: Platform-Specific Parsers (Week 13)

**Backend:**

- [ ] Implement Twitter URL parser (extract tweets, threads)
- [ ] Implement LinkedIn URL parser
- [ ] Implement Reddit URL parser
- [ ] Update URL router to detect platform and use specialized parser

**Frontend:**

- [ ] Add platform badges in source cards
- [ ] Show platform-specific metadata (author, date, engagement)

**Testing:**

- [ ] Add Twitter URL → Verify specialized extraction
- [ ] Add LinkedIn URL → Verify specialized extraction
- [ ] Add unknown URL → Verify generic fallback

**Deliverable:** Better source parsing for Twitter, LinkedIn, Reddit

---

### Phase 14: Polish & Production (Week 14)

**Backend:**

- [ ] Add comprehensive error handling
- [ ] Implement rate limiting
- [ ] Add input validation to all routes
- [ ] Set up error tracking (Sentry)
- [ ] Optimize database queries
- [ ] Add database backups

**Frontend:**

- [ ] Add loading skeletons
- [ ] Add empty states
- [ ] Implement error boundaries
- [ ] Add onboarding flow
- [ ] Optimize bundle size
- [ ] Mobile responsiveness

**Documentation:**

- [ ] README with setup
- [ ] Environment variables guide
- [ ] Deployment guide
- [ ] User guide

**Deliverable:** Production-ready application

---

## 7. Critical Files & Paths

### Backend

- `/packages/db/prisma/schema/megaforce.prisma` - Core data model
- `/packages/db/prisma/schema/auth.prisma` - Update User model
- `/apps/server/src/index.ts` - Main entry, register routes and WebSocket
- `/apps/server/src/jobs/queue.ts` - BullMQ configuration
- `/apps/server/src/services/ai/openrouter-client.ts` - OpenRouter integration
- `/apps/server/src/services/publishing/arcade-client.ts` - Arcade.dev integration
- `/apps/server/src/services/storage/r2-client.ts` - Cloudflare R2 client
- `/apps/server/src/websocket/server.ts` - WebSocket server setup
- `/docker-compose.yml` - Add Redis service

### Frontend

- `/apps/web/src/components/layouts/app-layout.tsx` - VS Code-style layout
- `/apps/web/src/routes/dashboard.tsx` - Main app shell
- `/apps/web/src/routes/dashboard/inbox.tsx` - Approval inbox
- `/apps/web/src/routes/dashboard/calendar.tsx` - Content calendar
- `/apps/web/src/components/editor/tiptap-editor.tsx` - Tiptap integration
- `/apps/web/src/lib/websocket/client.ts` - WebSocket client
- `/apps/web/src/lib/api/client.ts` - API client wrapper

### Environment

- `/packages/env/src/server.ts` - Server environment validation
- `.env` - Add all new environment variables

---

## 8. Verification & Testing

### MVP End-to-End Flow Test (Phase 5 Deliverable)

**Goal:** Verify core workflow - URL source to published Twitter tweet

**Steps:**

1. **Create URL Source**
   - Add URL (e.g., blog post, article) → Verify parsing job starts
   - Monitor WebSocket → Verify `source:parsed` event
   - Check source detail → Verify markdown content extracted

2. **Create Persona (Manual Style)**
   - Create new persona "Tech Commentator"
   - Manually enter style attributes: tone=witty, formality=5, emojiUsage=occasional
   - Link source from step 1 to persona → Verify association

3. **Connect Twitter**
   - Connect Twitter account via Arcade.dev → Verify OAuth flow
   - Verify credentials stored encrypted in database
   - Test connection → Verify API call succeeds

4. **Create Project**
   - Create project "Daily Tech Commentary"
   - Add source from step 1 as reference
   - Add persona with instructions: "Write engaging tech commentary for developers"
   - Configure output: Single Tweet, 3 candidates, tone=professional
   - Select model: `openai/gpt-4o-mini`
   - Click "Generate" → Monitor WebSocket

5. **Review & Approve**
   - Verify 3 candidates appear in inbox with PENDING status
   - Open first candidate → Read tweet (verify ≤280 chars)
   - Edit in Tiptap if needed → Click "Approve"
   - Schedule for 2 minutes from now

6. **Publish**
   - Wait 2 minutes → Monitor WebSocket for `publishing:started`
   - Verify `publishing:success` event received
   - Check Twitter feed → Verify tweet appears
   - Verify PublishedContent record has platformPostId and platformUrl

7. **Verify Database State**
   - Source: status=parsed, content populated
   - Persona: has styleProfile JSON
   - Project: has sources, personas, outputConfigs
   - ContentCandidate: status=PUBLISHED
   - PublishedContent: platformPostId set, publishedAt timestamp

**Success Criteria:**

- ✅ URL content extracted successfully
- ✅ Tweet generated based on source + persona style
- ✅ Tweet published to Twitter at scheduled time
- ✅ All WebSocket events received
- ✅ No errors in logs

---

## 9. Security Considerations

### Data Protection

- [ ] Encrypt social platform credentials in database (use `ENCRYPTION_KEY`)
- [ ] Store API keys in environment variables, never commit to git
- [ ] Use httpOnly, secure cookies for session management (already configured)
- [ ] Validate and sanitize all user inputs (Zod schemas)
- [ ] Implement CORS with strict origin validation (already configured)

### Rate Limiting

- [ ] Per-user rate limits on generation (max N requests per hour)
- [ ] Per-user rate limits on publishing (respect platform limits)
- [ ] Global rate limiting on expensive operations (style learning)

### File Upload Security

- [ ] Validate file types (only allow PDFs)
- [ ] Limit file sizes (10MB max)
- [ ] Scan uploads for malware (optional, use ClamAV or similar)
- [ ] Use presigned URLs with short expiry (15 minutes)

### Content Safety

- [ ] Sanitize user-generated content to prevent XSS
- [ ] Consider content moderation API for generated text (optional)
- [ ] Respect platform terms of service and rate limits

---

## 10. Performance Optimization

### Database

- [ ] Add indexes on foreign keys, status fields, date ranges (already in schema)
- [ ] Use Prisma connection pooling
- [ ] Implement cursor-based pagination for all lists
- [ ] Use `select` and `include` carefully to avoid over-fetching

### Caching

- [ ] Use Redis for job queue
- [ ] Cache frequently accessed data (workspace, personas)
- [ ] Implement TanStack Query cache with appropriate stale times

### Frontend

- [ ] Code splitting for routes (automatic with Vite)
- [ ] Lazy load heavy components (Tiptap, calendar, charts)
- [ ] Optimize images (use WebP, lazy loading)
- [ ] Minimize bundle size (tree shaking, no unused dependencies)

### Background Jobs

- [ ] Process jobs concurrently (multiple workers)
- [ ] Use job priorities (publishing > generation > analytics)
- [ ] Implement job progress tracking for long-running tasks

---

## 11. Future Enhancements (Post-MVP)

- **Multi-workspace support** - Users can create/join multiple workspaces
- **Team collaboration** - Invite members, assign roles, share personas
- **Image generation** - Generate images for posts using DALL-E/Midjourney
- **Image sources** - Extract content from images in sources
- **Video sources** - Transcribe YouTube videos for content
- **More platforms** - Instagram, Facebook, TikTok, Medium, Substack
- **A/B testing** - Generate multiple versions, test performance
- **Content templates** - Save frequently used configurations
- **Bulk operations** - Approve/reject multiple candidates at once
- **Advanced scheduling** - Optimal posting times based on analytics
- **Content recycling** - Suggest old content to repost
- **Notifications** - Email/Slack when candidates ready or published
- **Mobile app** - React Native app for on-the-go approvals
- **Chrome extension** - Quickly save sources while browsing
- **Zapier integration** - Trigger generation from external events

---

## Success Metrics

### Technical

- ✅ All database migrations run successfully
- ✅ WebSocket connections stable, events delivered reliably
- ✅ Job queue processes tasks without failures
- ✅ API response times < 200ms for CRUD operations
- ✅ File uploads complete in < 10 seconds for 10MB PDF
- ✅ Content generation completes in < 30 seconds per candidate

### User Experience

- ✅ User can create first persona and link sources in < 5 minutes
- ✅ User can generate and approve first candidate in < 2 minutes
- ✅ Published content appears on platform within 1 minute of scheduled time
- ✅ Analytics refresh within 1 hour of publishing
- ✅ Zero data loss on job failures (retries work)

---

## Notes

- **Monorepo structure:** Leverage existing Turborepo setup, avoid duplicating dependencies
- **Type safety:** Use Zod for runtime validation, TypeScript for compile-time safety
- **Error handling:** Always provide clear error messages to users via toast notifications
- **WebSocket fallback:** Consider polling fallback if WebSocket unavailable
- **Graceful degradation:** Show stale data when services unavailable, retry in background
- **Testing strategy:** Focus on integration tests for critical flows, E2E for main user journey
- **Deployment:** Consider Vercel for frontend, Railway/Render for backend, Cloudflare for R2

---

## Questions & Assumptions

### Assumptions Made:

1. Single workspace per user simplifies MVP (can add multi-workspace later)
2. Tiptap's WYSIWYG mode is preferred over raw markdown editing
3. Cloudflare R2 chosen for zero egress fees (ideal for serving files to LlamaParse)
4. Self-hosted Redis in Docker is acceptable for development (can migrate to Upstash for production)
5. Month grid calendar provides better overview than pure list view
6. Structured style attributes allow for better control than free-form descriptions
7. Automatic style learning with confirmation strikes balance between automation and control

### Clarified with User:

- ✅ Per-project model selection (not per-persona)
- ✅ Style learning requires human confirmation before overwriting
- ✅ Option to add new writing style instead of overwriting existing
- ✅ Social platforms: Twitter, LinkedIn, Reddit (no raw APIs, all via Arcade.dev)
- ✅ Both calendar views: month grid + timeline list
- ✅ WebSocket for real-time updates (not polling)
- ✅ Analytics fetched from platforms periodically

---

This plan provides a comprehensive roadmap for implementing Megaforce. Each phase builds on the previous, ensuring a stable foundation before adding complexity. The phased approach allows for iterative testing and refinement.
