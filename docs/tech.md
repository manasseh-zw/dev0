# Technical Audit Report: Dev0 Agentic Engineering Platform

## Executive Summary

Dev0 is an agentic engineering platform that transforms software engineers from hands-on coders into project managers and technical leads. The platform orchestrates AI coding agents (powered by Google's Gemini models) within isolated E2B sandboxes to execute tasks autonomously, creating pull requests for human review and merge.

**Core Workflow:**

1. Engineer provides project idea (voice or text)
2. Preview Agent generates project name, description, and tech stack recommendation
3. Planner Agent creates task breakdown with dependencies and model assignments
4. Execution Orchestrator runs tasks sequentially in E2B sandboxes using Gemini CLI
5. Each completed task generates a GitHub PR for review
6. Engineer reviews and merges PRs

---

## Tech Stack Overview

### Frontend Framework

- **TanStack Router** (`@tanstack/react-router`) - Type-safe file-based routing
- **React 19** - Latest React with concurrent features
- **Vite** - Build tool and dev server

### UI Libraries

- **shadcn/ui** - Component library built on Radix UI primitives
- **Tailwind CSS 4** (`@tailwindcss/vite`) - Utility-first CSS framework
- **Motion** (`motion`) - Animation library (Framer Motion successor)
- **Lucide React** - Icon library
- **Streamdown** - Markdown rendering with code highlighting

### Backend & Database

- **PostgreSQL** - Primary database (via Neon/Supabase)
- **Drizzle ORM** (`drizzle-orm`) - Type-safe SQL query builder
- **Drizzle Kit** (`drizzle-kit`) - Database migrations and introspection

### AI & ML

- **Google Gemini 3 Series** - Primary AI models
  - `gemini-3-pro-preview` - Complex reasoning tasks
  - `gemini-3-flash-preview` - Fast, efficient tasks
- **AI SDK** (`ai`, `@ai-sdk/google`) - Vercel AI SDK for structured outputs
- **Gemini CLI** - Autonomous coding agent running in sandboxes

### Sandbox & Infrastructure

- **E2B** (`e2b`) - Secure, isolated sandbox environments
- **Docker** - Containerization for E2B templates

### Real-time Communication

- **Upstash Realtime** (`@upstash/realtime`) - Pub/sub over Redis
- **Upstash Redis** (`@upstash/redis`) - Serverless Redis

### Git & Version Control

- **Octokit** (`octokit`) - GitHub API client
- **Git CLI** - Executed within sandboxes

### Development Tools

- **TypeScript 5.7** - Type safety
- **Vitest** - Testing framework
- **Prettier** - Code formatting
- **Bun** - Runtime and package manager

---

## Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (TanStack React)               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │ Task Board   │  │ Review View  │  │ Preview View  │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP/SSE
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Server Actions & API Routes                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │ Execution    │  │ Review       │  │ Project      │    │
│  │ Actions      │  │ Actions      │  │ Actions      │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ Orchestrator │  │   Gemini     │  │   GitHub     │
│              │  │   Agents     │  │   Provider   │
└──────────────┘  └──────────────┘  └──────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────┐
│              E2B Sandbox Provider                           │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Sandbox Instance (Docker Container)                  │  │
│  │  ┌──────────────────────────────────────────────┐   │  │
│  │  │ Gemini CLI (YOLO mode)                       │   │  │
│  │  │ Git Repository                                │   │  │
│  │  │ Project Files                                 │   │  │
│  │  └──────────────────────────────────────────────┘   │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
                    ┌──────────────┐
                    │   GitHub     │
                    │  Repository  │
                    └──────────────┘
```

### Data Flow

1. **Project Creation Flow:**
   - User input → Preview Agent (Gemini 3 Flash) → Project metadata
   - Project metadata → Planner Agent (Gemini 3 Pro) → Task breakdown
   - Tasks stored in PostgreSQL via Drizzle ORM

2. **Task Execution Flow:**
   - User triggers execution → Orchestrator claims task
   - Orchestrator gets/creates E2B sandbox → Clones repo
   - Gemini CLI executes task in sandbox → Streams JSONL events
   - Events parsed and emitted via Upstash Realtime → Frontend updates
   - On completion → Git commit → Push branch → Create PR → Update task status

3. **Real-time Updates:**
   - Orchestrator emits events → Upstash Realtime → Redis Pub/Sub
   - Frontend subscribes via SSE → React state updates → UI re-renders

---

## Core Components Analysis

### 1. Execution Orchestrator (`src/lib/execution/orchestrator.ts`)

**Purpose:** Central coordinator for task execution lifecycle

**Key Responsibilities:**

- Task claiming and state management
- Sandbox lifecycle management
- Gemini CLI execution coordination
- Git operations (commit, push, PR creation)
- Event emission for real-time updates

**Design Patterns:**

- **State Machine Pattern:** Tasks transition through states (PENDING → RUNNING → REVIEW/FAILED)
- **Orchestrator Pattern:** Coordinates multiple subsystems (sandbox, git, AI)
- **Observer Pattern:** Emits events for real-time subscribers

**Key Functions:**

```typescript
// Task claiming with optimistic locking
async function claimTaskForExecution(projectId: string, taskId?: string)

// Main execution loop
async function runTaskExecution(
  projectId: string,
  task: Task,
  sandboxId: string,
)

// Git workflow automation
async function finalizeTaskChanges(
  sandboxId,
  task,
  project,
  agentResult,
  logger,
)
```

**Clever Implementation Details:**

1. **Dependency Resolution:** `getNextRunnableTask()` implements topological sorting to ensure tasks execute only when dependencies are complete.

2. **Task Claiming:** Uses database-level optimistic locking (`claimPendingTask`) to prevent race conditions when multiple workers attempt to claim the same task.

3. **In-Memory State Tracking:** `projectState` Map tracks running tasks per project to prevent concurrent executions.

4. **Streaming Event Parsing:** Buffers stdout chunks and parses JSONL lines incrementally, handling partial JSON gracefully.

5. **Git Workflow Automation:** Automatically rebases on default branch before committing, handles merge conflicts, and creates PRs with proper metadata.

### 2. E2B Sandbox Provider (`src/lib/sandbox/providers/e2b.ts`)

**Purpose:** Abstraction layer for E2B sandbox operations

**Key Responsibilities:**

- Sandbox creation and lifecycle management
- Command execution (sync and streaming)
- Gemini CLI integration
- File system operations
- Dev server management

**Design Patterns:**

- **Provider Pattern:** Abstract interface (`SandboxProvider`) allows swapping implementations
- **Adapter Pattern:** Adapts E2B SDK to application's needs
- **Factory Pattern:** Creates sandboxes with project-specific configurations

**Key Features:**

1. **Sandbox Reuse:** Checks for existing sandboxes by task ID before creating new ones, reducing costs.

2. **Command Escaping:** Sophisticated escaping for shell commands (`escapeForSingleQuotes`, `escapeForDoubleQuotes`) prevents injection attacks.

3. **Streaming Execution:** `executeCommandStreaming` provides real-time stdout/stderr via callbacks while maintaining full output buffers.

4. **Gemini CLI Integration:** `executeGeminiStreaming` wraps Gemini CLI with proper environment variables and JSONL output parsing.

5. **Error Handling:** Gracefully handles `CommandExitError` exceptions, returning structured results instead of throwing.

**Clever Implementation Details:**

- **Secret Redaction:** `redactSecret()` function removes API keys from error messages before logging.
- **Connection Pooling:** Reuses sandbox connections via `connectSandbox()` with timeout management.
- **Template-Based Setup:** Clones project-specific templates and configures Gemini CLI settings automatically.

### 3. Gemini Integration

#### 3.1 Preview Agent (`src/lib/ai/preview-agent.ts`)

**Model:** `gemini-3-flash-preview`

**Purpose:** Transforms user "vibe" input into structured project metadata

**Output Schema:**

- Project name (2-4 words, PascalCase or spaced)
- Tagline (max 10 words)
- Technical description
- Recommended tech stack (TanStack React only)

**Implementation:**

- Uses Vercel AI SDK's `generateText` with structured output (`Output.object`)
- Zod schema validation via `previewOutputSchema`
- Temperature: 0.7 for creative naming

#### 3.2 Planner Agent (`src/lib/ai/planner-agent.ts`)

**Model:** `gemini-3-pro-preview`

**Purpose:** Generates comprehensive project plan with task breakdown

**Output Schema:**

- Project specification (overview, features, technical notes)
- Task breakdown (5-20 atomic tasks)
- Task dependencies (using task IDs, not indices)
- Phase assignments (Foundation → Core → Secondary → Polish → Launch)
- Model assignments (`gemini-3-flash-preview` for simple, `gemini-3-pro-preview` for complex)

**Implementation:**

- Complex system prompt with detailed guidelines
- Structured output with `plannerOutputSchema`
- Task complexity analysis for model selection

#### 3.3 Gemini CLI Integration

**Location:** Executed within E2B sandboxes via `executeGeminiStreaming()`

**Configuration:**

- **YOLO Mode:** `--yolo` flag enables autonomous execution
- **Model Selection:** Per-task model assignment (`gemini-3-pro-preview` or `gemini-3-flash-preview`)
- **Output Format:** `--output-format stream-json` for structured event streaming
- **API Key:** Injected via environment variable (`AGENT_GEMINI_API_KEY`)

**Event Streaming:**

The Gemini CLI emits JSONL events that are parsed in real-time:

```typescript
// Event types from Gemini CLI
type GeminiStreamEvent =
  | GeminiInitEvent // Session initialization
  | GeminiMessageEvent // User/assistant messages
  | GeminiToolUseEvent // Tool invocation
  | GeminiToolResultEvent // Tool execution result
  | GeminiErrorEvent // Non-fatal errors
  | GeminiResultEvent // Final result with stats
```

**Event Processing:**

1. **Buffering:** Stdout chunks are buffered and split by newlines
2. **Parsing:** Each line parsed as JSON, validated via `isGeminiEvent()`
3. **Filtering:** User messages filtered out (only assistant messages emitted)
4. **Persistence:** Events collected and stored in `task_logs` table
5. **Real-time Emission:** Events emitted via Upstash Realtime for frontend consumption

**Clever Implementation:**

- **Incremental Parsing:** Handles partial JSON gracefully with buffer management
- **Event Deduplication:** Filters duplicate user prompts from stream
- **Stats Extraction:** Extracts token counts and duration from result events
- **Error Recovery:** Continues processing even if individual events fail to parse

### 4. Real-time Pub/Sub Implementation

#### 4.1 Server-Side (`src/lib/realtime/server.ts`)

**Technology:** Upstash Realtime + Redis

**Architecture:**

```typescript
const redis = new Redis({
  url: env.UPSTASH_REDIS_REST_URL,
  token: env.UPSTASH_REDIS_REST_TOKEN,
})

export const realtime = new Realtime({
  schema: executionEventSchema,
  redis,
  verbose: env.isDev,
})
```

**Event Schema:**

- `execution.task_started` - Task begins execution
- `execution.task_log` - Real-time log output (stdout/stderr)
- `execution.task_review` - Task completed, PR created
- `execution.task_failed` - Task execution failed

**Channel Naming:**

- Format: `execution:{projectId}`
- Allows per-project subscriptions
- Frontend subscribes to project-specific channels

#### 4.2 Client-Side (`src/lib/realtime/client.ts`)

**Hook:** `useRealtime()` from `@upstash/realtime/client`

**Usage Pattern:**

```typescript
useRealtime({
  channels: [getExecutionChannel(projectId)],
  events: ['execution.task_log', 'execution.task_started'],
  onData: (payload) => {
    // Update React state
  },
})
```

**Frontend Integration:**

1. **Task Board** (`src/components/task/board/task-board.tsx`):
   - Subscribes to status change events
   - Updates task status optimistically
   - Invalidates router cache for data refresh

2. **Task Logs** (`src/components/task/sheet/task-logs.tsx`):
   - Subscribes to `execution.task_log` events
   - Filters events by task ID
   - Renders Gemini events via `GeminiEventRenderer`
   - Maintains scroll position for live updates

**SSE Endpoint:** `/api/events/$projectId`

- Handles Upstash Realtime SSE connections
- Routes to appropriate channel based on project ID

**Clever Implementation:**

- **Event Filtering:** Frontend filters events by task ID to prevent cross-task updates
- **Optimistic Updates:** UI updates immediately on event receipt, then syncs with database
- **Log Bounded Buffer:** Task logs component limits to 500 entries to prevent memory issues
- **Historical + Live:** Combines persisted logs from database with live streaming events

### 5. Database Schema (`src/lib/db/schema.ts`)

**ORM:** Drizzle ORM with PostgreSQL

**Tables:**

1. **projects**
   - Core project metadata
   - Status enum: `PLANNING | READY | ACTIVE | PAUSED | COMPLETED | ARCHIVED`
   - Tech stack, repo info, spec content

2. **tasks**
   - Task breakdown with dependencies
   - Status enum: `PENDING | RUNNING | REVIEW | DONE | FAILED | SKIPPED`
   - Phase and order for sequencing
   - Gemini model assignment
   - PR URL and number
   - Attempt tracking (for retries)

3. **sandboxes**
   - E2B sandbox instances
   - Links to projects and optionally tasks
   - Status enum: `READY | RUNNING | STOPPED`
   - Public URL for preview access

4. **task_logs**
   - Execution logs stored as JSONB
   - Gemini stream events array
   - Summary, token counts, duration
   - Tool call counts
   - Lazy-loaded to avoid N+1 queries

**Indexes:**

- `projects_status_idx` - Fast status filtering
- `tasks_project_idx` - Project task queries
- `tasks_status_idx` - Status filtering
- `tasks_project_phase_order_idx` - Composite index for task ordering
- `sandboxes_project_idx` - Project sandbox lookup
- `task_logs_task_id_idx` - Log retrieval

**Relations:**

- Projects → Tasks (one-to-many)
- Projects → Sandboxes (one-to-many)
- Tasks → Sandboxes (one-to-one, optional)
- Tasks → TaskLogs (one-to-one)

**Clever Implementation:**

- **JSONB for Events:** Stores Gemini stream events as JSONB for flexible querying
- **Cascade Deletes:** Projects cascade delete tasks and sandboxes
- **Unique Constraints:** Task logs have unique task_id (one log per task)
- **Timestamps:** Auto-updating `updatedAt` via `$onUpdate` hook

### 6. GitHub Integration (`src/lib/git/github.ts`)

**Client:** Octokit

**Key Operations:**

1. **Repository Creation:**
   - `createFromTemplate()` - Creates repo from template
   - `createInitialFiles()` - Batch file uploads via Git API

2. **Pull Request Management:**
   - `getPullRequest()` - Fetch PR details
   - `listPullRequests()` - List PRs with filtering
   - `createPullRequest()` - Create PR (also done via `gh` CLI in sandbox)
   - `mergePullRequest()` - Merge PR with configurable method

3. **File Operations:**
   - `uploadFile()` - Create/update files via API
   - `listPullRequestFiles()` - Get PR file diff

4. **Comparison:**
   - `compareCommits()` - Get diff between branches

**Authentication:**

- Uses GitHub token from environment
- Injects token into git URLs: `https://x-access-token:TOKEN@github.com/...`

**Clever Implementation:**

- **Template Mapping:** Maps tech stack names to template repository names
- **Branch Detection:** Automatically detects default branch (master/main)
- **File Update Logic:** Checks for existing files and updates SHA for updates
- **Error Handling:** Comprehensive error messages with context

### 7. Frontend Architecture

#### 7.1 Routing (`src/router.tsx`)

**Framework:** TanStack Router

**Route Structure:**

```
/                           → Landing page
/new                        → Project creation
/project/:projectId          → Project dashboard
/project/:projectId/preview → Preview view
/project/:projectId/review  → PR review list
/project/:projectId/review/:taskId → PR detail view
/project/:projectId/review/:taskId/diff → PR diff view
```

**Features:**

- File-based routing
- Type-safe route params
- View transitions enabled
- Scroll restoration

#### 7.2 State Management

**Pattern:** Server state via TanStack Router + Local React state

**Server State:**

- Fetched via route loaders
- Cached and invalidated on mutations
- Type-safe with TypeScript

**Client State:**

- React `useState` for UI state (modals, sheets, filters)
- Optimistic updates for real-time events
- Local state for form inputs

#### 7.3 Component Architecture

**Layout Components:**

- `AppSidebar` - Navigation sidebar
- `ProjectHeader` - Project-specific header
- `TaskSubheader` - Task board header with filters

**Feature Components:**

1. **Task Board** (`task-board.tsx`):
   - Kanban-style board with columns
   - Drag-and-drop (via React DnD or similar)
   - Real-time status updates
   - Task filtering and sorting

2. **Review Components:**
   - `AllPRs` - List of all PRs
   - `ReviewDetailContent` - PR detail view
   - `DiffViewer` - Code diff visualization
   - `MergeConfirmDialog` - PR merge confirmation

3. **Task Sheet** (`task-sheet.tsx`):
   - Slide-out panel with task details
   - `TaskLogs` - Real-time execution logs
   - `GeminiEventRenderer` - Renders Gemini CLI events
   - `TaskInfo` - Task metadata

**UI Components:**

- shadcn/ui primitives (Button, Dialog, Sheet, etc.)
- Custom components (CodeBlock, FileTree, etc.)

---

## Design Patterns Analysis

### 1. Orchestrator Pattern

**Location:** `src/lib/execution/orchestrator.ts`

**Purpose:** Coordinates multiple subsystems (sandbox, git, AI, database)

**Implementation:**

- Central `startTask()` function coordinates workflow
- Manages state transitions
- Handles error recovery
- Emits events for observers

**Benefits:**

- Single point of control
- Clear execution flow
- Easy to add new subsystems
- Centralized error handling

### 2. Provider Pattern

**Location:** `src/lib/sandbox/provider-interface.ts`, `src/lib/sandbox/providers/e2b.ts`

**Purpose:** Abstract sandbox operations for testability and flexibility

**Implementation:**

```typescript
interface SandboxProvider {
  createSandbox(config): Promise<SandboxInstance>
  executeCommand(sandboxId, command): Promise<CommandResult>
  // ... other methods
}
```

**Benefits:**

- Easy to swap implementations (E2B, local Docker, etc.)
- Testable via mocks
- Clear contract definition

### 3. Observer Pattern

**Location:** Real-time event system

**Implementation:**

- Orchestrator emits events → Upstash Realtime → Redis Pub/Sub
- Frontend components subscribe via `useRealtime()`
- React state updates trigger re-renders

**Benefits:**

- Decoupled event producers and consumers
- Real-time updates without polling
- Scalable to multiple subscribers

### 4. Factory Pattern

**Location:** Sandbox creation, template selection

**Implementation:**

- `getTemplate(techStack)` returns template config
- `createSandbox(config)` creates sandbox with template-specific setup
- `GitHubProvider.createFromTemplate()` creates repos from templates

**Benefits:**

- Encapsulates creation logic
- Consistent initialization
- Easy to add new templates

### 5. Strategy Pattern

**Location:** Model selection for tasks

**Implementation:**

- Planner Agent selects model based on task complexity
- `task.geminiModel` field stores strategy
- Orchestrator uses assigned model for execution

**Benefits:**

- Flexible model selection
- Cost optimization (Flash for simple, Pro for complex)
- Easy to add new models

### 6. Repository Pattern

**Location:** Database operations via Drizzle ORM

**Implementation:**

- Drizzle queries abstract SQL
- Type-safe database operations
- Centralized schema definition

**Benefits:**

- Type safety
- Database-agnostic queries
- Easy migrations

### 7. Adapter Pattern

**Location:** E2B SDK adapter, GitHub API adapter

**Implementation:**

- `e2bProvider` adapts E2B SDK to `SandboxProvider` interface
- `GitHubProvider` adapts Octokit to application needs

**Benefits:**

- Consistent interfaces
- Easy to swap dependencies
- Testability

---

## Clever Implementation Details

### 1. Task Dependency Resolution

**Location:** `getNextRunnableTask()` in orchestrator

**Implementation:**

- Topological sort algorithm
- Checks all dependencies are complete
- Ensures phase ordering
- Prevents circular dependencies

**Why It's Clever:**

- Handles complex dependency graphs
- Efficient O(n²) algorithm
- Prevents race conditions

### 2. Optimistic Task Claiming

**Location:** `claimPendingTask()` in orchestrator

**Implementation:**

- Database-level atomic update: `UPDATE tasks SET status = 'RUNNING' WHERE id = ? AND status = 'PENDING'`
- Returns boolean indicating success
- Prevents concurrent claims

**Why It's Clever:**

- Race-condition free
- No distributed locking needed
- Database handles concurrency

### 3. Streaming Event Parsing

**Location:** `runTaskExecution()` stdout handler

**Implementation:**

- Buffers stdout chunks
- Splits by newlines incrementally
- Parses JSONL lines individually
- Handles partial JSON gracefully

**Why It's Clever:**

- Real-time event processing
- Handles network chunking
- Resilient to malformed lines

### 4. Sandbox Reuse Strategy

**Location:** `getOrCreateProjectSandbox()` in E2B provider

**Implementation:**

- Checks for existing sandbox by task ID
- Reuses if still active
- Falls back to project sandbox
- Creates new only if needed

**Why It's Clever:**

- Reduces E2B costs
- Faster task execution
- Maintains state between tasks

### 5. Git Workflow Automation

**Location:** `finalizeTaskChanges()` in orchestrator

**Implementation:**

- Automatically rebases on default branch
- Handles merge conflicts gracefully
- Creates feature branch with naming convention
- Configures git user for commits
- Pushes and creates PR in single flow

**Why It's Clever:**

- Fully automated git workflow
- Handles edge cases (no changes, rebase failures)
- Consistent branch naming
- Proper commit messages from agent

### 6. Secret Management

**Location:** Environment variable handling

**Implementation:**

- Separate API keys for backend (`GOOGLE_GENERATIVE_AI_API_KEY`) and sandbox (`AGENT_GEMINI_API_KEY`)
- Secret redaction in error messages
- Environment variable injection into sandboxes

**Why It's Clever:**

- Security isolation
- Prevents key leakage in logs
- Sandbox-specific credentials

### 7. Event Filtering and Deduplication

**Location:** `runTaskExecution()` event handler

**Implementation:**

- Filters user messages from stream
- Only emits assistant messages
- Deduplicates events
- Maintains event order

**Why It's Clever:**

- Reduces noise in frontend
- Prevents duplicate updates
- Clean event stream

### 8. Log Persistence Strategy

**Location:** `persistTaskLogs()` in orchestrator

**Implementation:**

- Collects events during execution
- Persists on completion or error
- Extracts stats from result event
- Stores summary from last assistant message
- Uses upsert to handle retries

**Why It's Clever:**

- Efficient batch persistence
- Handles partial failures
- Rich metadata extraction
- Retry-safe

### 9. Command Escaping

**Location:** `escapeForSingleQuotes()`, `escapeForDoubleQuotes()` in E2B provider

**Implementation:**

- Proper shell escaping for different quote types
- Handles special characters ($, `, \, ")
- Prevents injection attacks

**Why It's Clever:**

- Security-critical
- Handles edge cases
- Prevents command injection

### 10. Real-time Event Batching

**Location:** Frontend `TaskLogs` component

**Implementation:**

- Bounded buffer (500 entries)
- Auto-scrolls to bottom
- Combines historical and live events
- Filters by task ID

**Why It's Clever:**

- Prevents memory leaks
- Smooth UX with auto-scroll
- Efficient rendering

---

## Gemini Technology Usage

### 1. Voice Transcription

**Model:** `gemini-3-flash-preview`

**Usage:** Audio file → Transcription text

**Location:** `src/lib/ai/transcribe.ts`

**Implementation:**

- Uses Google AI SDK's audio transcription
- Processes audio attachments
- Returns text for preview agent

### 2. Preview Agent

**Model:** `gemini-3-flash-preview`

**Purpose:** Project ideation and tech stack recommendation

**Input:** User "vibe" text
**Output:** Structured project metadata (name, tagline, description, tech stack)

**Why Flash:**

- Fast response time
- Sufficient for creative naming
- Cost-effective

### 3. Planner Agent

**Model:** `gemini-3-pro-preview`

**Purpose:** Comprehensive project planning

**Input:** Project metadata from preview agent
**Output:** Task breakdown with dependencies, phases, and model assignments

**Why Pro:**

- Complex reasoning required
- Understanding code structure
- Dependency analysis
- Model selection logic

### 4. Gemini CLI (Task Execution)

**Models:** `gemini-3-pro-preview` or `gemini-3-flash-preview` (per task)

**Purpose:** Autonomous code generation and execution

**Mode:** YOLO (autonomous execution)

**Features:**

- Reads project context
- Understands task requirements
- Generates and modifies code
- Runs tests and validations
- Creates commits and PRs

**Why Both Models:**

- **Flash:** Simple tasks (UI components, styling, basic CRUD)
- **Pro:** Complex tasks (auth, state management, architecture)

**Streaming Output:**

- JSONL format for structured events
- Real-time progress updates
- Tool use tracking
- Token usage statistics

---

## E2B Sandbox Integration

### Sandbox Lifecycle

1. **Creation:**
   - Template selection based on tech stack
   - Environment variable injection
   - Repository cloning
   - Gemini CLI configuration

2. **Execution:**
   - Command execution (sync and streaming)
   - File system operations
   - Dev server management
   - Preview URL generation

3. **Cleanup:**
   - Pause (beta feature) for reuse
   - Kill for termination
   - Status tracking in database

### Template System

**Templates:**

- `dev0-universal` - Default E2B template
- Custom Dockerfiles per tech stack
- Pre-installed tools (git, bun, Gemini CLI)

**Configuration:**

- `e2b.toml` - Template metadata
- Dockerfile-based builds
- Snapshot creation for faster startup

### Command Execution

**Sync Execution:**

- `executeCommand()` - Simple command execution
- Returns exit code, stdout, stderr
- Timeout support

**Streaming Execution:**

- `executeCommandStreaming()` - Real-time output
- Callbacks for stdout/stderr
- Full output buffering
- Completion callback

**Gemini CLI Execution:**

- `executeGeminiStreaming()` - Wraps Gemini CLI
- JSONL output parsing
- Event extraction
- Error handling

### Security Considerations

- Isolated containers
- No persistent storage between runs
- Network access controlled
- API key injection via environment variables
- Secret redaction in logs

---

## Testing Strategy

### Test Files

1. **`tests/db.test.ts`** - Database operations
2. **`tests/github.test.ts`** - GitHub API integration
3. **`tests/planner-agent.test.ts`** - Planner agent logic
4. **`tests/preview-agent.test.ts`** - Preview agent logic
5. **`tests/sandbox.test.ts`** - Sandbox operations

### Testing Tools

- **Vitest** - Test runner
- **Testing Library** - React component testing
- **jsdom** - DOM simulation

---

## Performance Considerations

### Database Optimization

- Indexed queries for common operations
- JSONB for flexible event storage
- Lazy loading of task logs
- Cascade deletes for cleanup

### Frontend Optimization

- Route-based code splitting
- Optimistic updates for instant feedback
- Bounded buffers for logs
- Memoization for expensive computations

### Sandbox Optimization

- Sandbox reuse for multiple tasks
- Template snapshots for faster creation
- Connection pooling
- Timeout management

### Real-time Optimization

- Per-project channels (not global)
- Event filtering on client side
- Bounded log buffers
- Efficient JSON parsing

---

## Security Considerations

### API Key Management

- Separate keys for backend and sandbox
- Environment variable injection
- Secret redaction in logs
- No hardcoded credentials

### Sandbox Isolation

- Docker container isolation
- No persistent storage
- Network access control
- Resource limits

### Input Validation

- Zod schemas for all inputs
- Command escaping for shell safety
- SQL injection prevention via Drizzle ORM
- XSS prevention via React

### Authentication

- GitHub token for repo access
- E2B API key for sandbox creation
- Upstash tokens for Redis access

---

## Deployment Architecture

### Build Process

1. **Frontend Build:**
   - Vite builds React app
   - TanStack Router handles client-side routing
   - Static assets optimized

2. **Server Build:**
   - Not applicable (client-only React + Vite)

### Environment Variables

**Required:**

- `DATABASE_URL` - PostgreSQL connection
- `E2B_API_KEY` - E2B sandbox access
- `GOOGLE_GENERATIVE_AI_API_KEY` - Backend Gemini access
- `AGENT_GEMINI_API_KEY` - Sandbox Gemini access
- `GITHUB_TOKEN` - GitHub API access
- `UPSTASH_REDIS_REST_URL` - Redis connection
- `UPSTASH_REDIS_REST_TOKEN` - Redis authentication

**Optional:**

- `DATABASE_PROVIDER` - Database provider (default: supabase)
- `E2B_TEMPLATE` - E2B template name (default: dev0-universal)
- `GITHUB_BOT_USERNAME` - GitHub bot username (default: dev0-agent)
- `APP_URL` - Application URL (default: http://localhost:3000)

---

## Future Considerations

### Scalability

- **Horizontal Scaling:** Stateless server design allows multiple instances
- **Database Scaling:** Consider read replicas for heavy query loads
- **Sandbox Pooling:** Pre-create sandboxes for faster task starts
- **Event Streaming:** Consider Kafka for high-volume event streams

### Monitoring

- **Observability:** Add structured logging with correlation IDs
- **Metrics:** Track task execution times, success rates, model usage
- **Alerting:** Monitor failed tasks, sandbox errors, API rate limits
- **Tracing:** Distributed tracing for request flows

### Feature Enhancements

- **Parallel Execution:** Run independent tasks concurrently
- **Task Retries:** Automatic retry with exponential backoff
- **Preview Environments:** Staging environments for PR previews
- **Collaboration:** Multi-user project access
- **Webhooks:** GitHub webhook integration for PR updates

---

## Conclusion

Dev0 is a sophisticated agentic engineering platform that successfully orchestrates AI coding agents within isolated sandboxes. The architecture demonstrates:

1. **Clean Separation of Concerns:** Frontend, backend, sandbox, and AI layers are well-separated
2. **Robust Orchestration:** Complex task execution workflows are handled reliably
3. **Real-time Updates:** Pub/sub architecture enables responsive UI
4. **Type Safety:** TypeScript and Drizzle ORM provide end-to-end type safety
5. **Security:** Proper isolation, secret management, and input validation
6. **Extensibility:** Provider patterns allow easy swapping of implementations

The platform effectively transforms engineers into project managers by automating code generation, execution, and PR creation while maintaining human oversight through the review process.

---

## Appendix: Key Files Reference

### Core Orchestration

- `src/lib/execution/orchestrator.ts` - Task execution coordinator
- `src/lib/actions/execution.ts` - Server actions for execution

### Sandbox Integration

- `src/lib/sandbox/providers/e2b.ts` - E2B sandbox provider
- `src/lib/sandbox/provider-interface.ts` - Sandbox abstraction
- `src/lib/sandbox/client.ts` - Sandbox client utilities

### AI Agents

- `src/lib/ai/planner-agent.ts` - Project planning agent
- `src/lib/ai/preview-agent.ts` - Project preview agent
- `src/lib/ai/models.ts` - Model definitions
- `src/lib/ai/schemas.ts` - Agent output schemas

### Real-time

- `src/lib/realtime/server.ts` - Server-side realtime setup
- `src/lib/realtime/client.ts` - Client-side realtime hook
- `src/lib/realtime/schema.ts` - Event schemas

### Database

- `src/lib/db/schema.ts` - Database schema definitions
- `src/lib/db.ts` - Database connection

### GitHub Integration

- `src/lib/git/github.ts` - GitHub API client

### Frontend Components

- `src/components/task/board/task-board.tsx` - Task kanban board
- `src/components/task/sheet/task-logs.tsx` - Real-time task logs
- `src/components/review/` - PR review components

### Configuration

- `package.json` - Dependencies
- `vite.config.ts` - Build configuration
- `drizzle.config.ts` - Database configuration
- `e2b.toml` - E2B template configuration
