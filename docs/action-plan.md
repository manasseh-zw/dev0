# dev0 Action Plan

> **Mission:** Build the Operating System for "Vibe Coding" - Transform developers from syntax writers to Technical Leads.
>
> **Strategy:** Guest Mode First - Zero-friction demo with platform-controlled task execution.

---

## Phase Overview

| Phase | Name                | Focus                         | Key Deliverable                           |
| ----- | ------------------- | ----------------------------- | ----------------------------------------- |
| 1     | **Foundation**      | Infrastructure & Core Setup   | Sandbox can execute code and report back  |
| 2     | **The Architect**   | Planning AI & Project Genesis | Natural language → GitHub repo with tasks |
| 3     | **The Engine**      | Platform-Controlled Execution | Full task execution cycle working         |
| 4     | **Mission Control** | Dashboard & Real-time UI      | Live task tracking & preview              |
| 5     | **Polish & Ship**   | UX, Demo & Submission         | Production-ready demo video               |

---

## Phase 1: Foundation ✅

**Goal:** Establish core infrastructure - database, sandbox execution, and basic project structure.

### 1.1 Project Infrastructure Setup ✅

- [x] **Initialize TanStack Start project with Bun**
  - Run `bun create tanstack-app@latest` with start template
  - Configure TypeScript strict mode
  - Set up path aliases (`@/` for `src/`)

- [x] **Install core dependencies**
  - `@daytonaio/sdk` - Sandbox orchestration
  - `ai` + `@ai-sdk/google` - Vercel AI SDK for agents
  - `prisma` + `@prisma/client` - Database ORM
  - `zod` - Schema validation
  - `octokit` - GitHub API

- [x] **Configure environment setup**
  - Create `.env.local` with all required keys
  - Implement typed env config (`src/lib/env.ts`)
  - Add `requireEnv()` and `optionalEnv()` helpers

### 1.2 Database Layer ✅

- [x] **Initialize Drizzle ORM**
  - Install `drizzle-orm`, `drizzle-kit`, and `@neondatabase/serverless`
  - Configure PostgreSQL (Neon) connection in `src/lib/db.ts`
  - Create `drizzle.config.ts` for migration management

- [x] **Create database schema**
  - Implemented in `src/lib/db/schema.ts` using `pgTable` and `pgEnum`
  - `Project` model (id, name, description, status, repoUrl, techStack, theme, vibeInput, specContent)
  - `Task` model (id, projectId, title, description, phase, order, status, dependencies, prUrl, logs)
  - `Sandbox` model (id, projectId, daytonaId, status, taskId)
  - Defined enums: `ProjectStatus`, `TaskStatus`, `SandboxStatus`, `GeminiModel`

- [x] **Run initial migration**
  - Generated initial SQL migration via `drizzle-kit generate`
  - Applied migration to Neon database via `drizzle-kit migrate`
  - Verified with live database insert/read tests

### 1.3 Daytona Sandbox Integration ✅

- [x] **Create universal snapshot**
  - Script: `scripts/create-snapshot.ts`
  - Base image: `oven/bun:1.3`
  - Pre-installed tools: Bun, Git, gh CLI, Gemini CLI
  - Gemini CLI Configuration:
    - `~/.gemini/settings.json` with Context7 MCP for live documentation lookup
    - `~/.gemini/.env` with `GEMINI_API_KEY` for headless/YOLO mode
  - Single snapshot `dev0-universal` for all projects
  - Test script: `scripts/test-sandbox.ts`
  - YOLO mode test: `gemini --yolo --model gemini-3-flash-preview -p "prompt"`

- [x] **Create Daytona SDK wrapper**
  - Implement `src/lib/sandbox/provider.ts`
  - Configure sandbox creation from `dev0-universal` snapshot
  - Inject environment variables (AGENT_GEMINI_API_KEY, GITHUB_TOKEN)
  - Handle sandbox lifecycle (create, execute, stop, delete)
  - Platform-controlled execution
  - **Comprehensive integration tests:** `tests/sandbox/integration.test.ts`
    - Test runner: **Vitest** (configured for Node environment)
    - Tests validating sandbox creation, command execution, Gemini CLI
    - Environment: `.env.local` loaded via dotenv in `vitest.config.ts`
    - Full coverage: database → sandbox → git → Gemini → file system

- [x] **Create GitHub template repositories**
  - `dev0-agent/tanstack-template` - TanStack Start + shadcn
  - `dev0-agent/react-vite-template` - Vite + React + shadcn
  - `dev0-agent/nextjs-template` - Next.js + shadcn
  - Templates cloned at project creation time (not baked into snapshot)
  - Config: `src/lib/templates.ts`

### 1.4 Server Actions & API Routes ✅

- [x] **Create project server actions**
  - `src/lib/actions/project.ts` - Comprehensive server functions
  - Orchestrates: Planner Agent → DB → GitHub repo creation
  - [x] `createProject` - Initialize project and tasks
  - [x] `getProject` - Get project details with tasks
  - [x] `getProjects` - List all projects
  - [x] `getTask` - Get single task with project context
  - [x] `updateTaskStatus` - Update task state
  - [x] `updateProjectStatus` - Update project state
  - [x] `updateTaskModel` - Configure Gemini model per task

- [ ] **Create webhook endpoint (Deferred for MVP)**
  - Replaced by in-platform merge action to simplify local development
  - Future: Add for external merge reconciliation

---

## Phase 2: The Architect ✅

**Goal:** Convert natural language ideas into structured project plans with real GitHub repositories.

### 2.1 AI Agents ✅

- [x] **Implement Preview Agent**
  - Uses **Gemini 3 Flash** (`gemini-3-flash-preview`) for speed
  - Extract project name, tagline, description from vibe input
  - Suggest tech stack based on project requirements
  - Structured outputs with Zod schemas
  - Implementation: `src/lib/ai/preview-agent.ts`

- [x] **Implement Planner Agent**
  - Uses **Gemini 3 Pro** (`gemini-3-pro-preview`) for deep planning
  - Generate phased task breakdown (5-20 atomic tasks)
  - Assign dependencies between tasks (by ID)
  - Assign Gemini model (Pro/Flash) per task based on complexity
  - Generate complete README content
  - Normalize task IDs and validate dependencies
  - Implementation: `src/lib/ai/planner-agent.ts`

- [x] **Create Zod schemas for structured outputs**
  - `previewOutputSchema` - Preview Agent output
  - `plannerOutputSchema` - Planner Agent output
  - `plannedTaskSchema` - Individual task structure
  - `projectSpecSchema` - Project specification
  - Implementation: `src/lib/ai/schemas.ts`

### 2.2 GitHub Repository Genesis ✅

- [x] **Implement GitHub API wrapper**
  - Created `src/lib/git/github.ts` using Octokit
  - Supports template creation and file uploads

- [x] **Implement content generators**
  - Created `src/lib/git/content-generators.ts`
  - Generates README (or uses Planner-generated), TASKLIST, LEARNINGS, and RULES

- [x] **Create repository creation flow**
  - Implemented `createProjectRepository` orchestration
  - Initial repository setup with all context files
  - Updated to accept optional Planner-generated README

### 2.3 Creation UI ✅

- [x] **Build landing page chat**
  - Hero section with vibe input
  - "Next" button calls Preview Agent
  - Navigate to `/new` with preview data

- [x] **Build New Project form (`/new`)**
  - Pre-filled with AI suggestions
  - Tech stack selector
  - Loader button for full project generation
  - Call `createProject` server action

- [x] **Complete project creation flow**
  - Store generated tasks in database
  - Update project status to READY
  - Redirect directly to Mission Control
  - Fixed GitHub branch detection (master/main)
  - Handle empty template repositories

---

## Phase 3: The Engine ✅

**Goal:** Implement platform-controlled task execution inside sandboxes.

### 3.1 Task Execution (Platform-Controlled) ✅

- [x] **Create task executor**
  - Platform sends commands to sandbox via Daytona SDK
  - Build prompt from task details + project context
  - Execute `gemini -p "<prompt>" --yolo` in sandbox
- [x] **Capture and stream stdout/stderr**
  - Real-time logs via `executionBus` and SSE
- [ ] **Implement test step**
  - Run `bun test` after code generation
  - Parse test results
  - Determine pass/fail status
- [x] **Implement retry logic (Basic)**
  - Track attempt count in database
  - Re-run task on failure

### 3.2 Git Operations ✅

- [x] **Implement branching strategy**
  - Handled by Gemini CLI or explicit commands in sandbox
- [x] **Implement commit and push**
  - Gemini CLI stages and commits changes
- [x] **Implement PR creation**
  - Gemini CLI creates PRs and returns URLs

### 3.3 Task Orchestration ✅

- [x] **Create task dispatcher**
  - `startExecution` server action calls `orchestrator`
  - Serial-per-project execution with concurrency protection
- [x] **Implement status updates**
  - Update task status in database
  - Broadcast via `executionBus` → SSE
- [x] **Handle task completion**
  - Manual platform merge triggers status update to DONE
  - Auto-start next task (Logic implemented in orchestrator)

### 3.4 Progress Tracking

- [ ] **Implement PROGRESS.md updates**
  - Append notes after each task completion
  - Format: `## Task: {title}\n- Completed: {date}\n- Notes: {learnings}`
  - Commit as part of task PR

---

## Phase 4: Mission Control

**Goal:** Build the real-time dashboard for monitoring and controlling project execution.

### 4.1 Dashboard Layout ✅

- [x] **Create Mission Control route (`/project/$projectId`)**
  - [x] Layout with project info display
  - [x] Header with project name and GitHub link
  - [x] Task summary by status
  - [x] Uses TanStack Router loader for data fetching

- [x] **Implement Kanban board**
  - [x] Columns: Pending, Running, Testing, Review, Done, Failed
  - [x] Task cards with title, phase, and status
  - [x] Visual indication of current task
  - [ ] Drag and drop functionality (Pending)

### 4.2 Real-time Updates ✅

- [x] **Create SSE endpoint**
  - `GET /api/events/$projectId` - Event stream
- [x] **Connect frontend to SSE**
  - `useExecutionEvents` hook for real-time state
- [x] **Implement log streaming**
  - Streaming command output via `executionBus`

### 4.2.1 Frontend-Backend Integration 🔄 (IN PROGRESS)

**Goal:** Wire up UI components to backend execution so tasks flow from PENDING → RUNNING → REVIEW.

- [ ] **Pass projectId to TaskBoard**
  - Update `/project/$projectId/index.tsx` to pass `projectId` prop
  - Required for SSE subscription with real projects

- [ ] **Add SSE event handlers with router revalidation**
  - Subscribe to execution events in `TaskBoard`
  - On `task_started`, `task_completed`, `task_failed`: call `router.invalidate()`
  - Server is single source of truth (no local state drift)

- [ ] **Manual integration test**
  - Create real project via landing page
  - Start task from dashboard
  - Verify logs stream in Task Sheet
  - Verify task moves to REVIEW when agent completes

### 4.3 Task Management (Deferred)

- [ ] **Implement task editing** - Edit task title and description
- [ ] **Implement task actions** - Retry failed task, Skip task

### 4.4 PR Review & Merge (Phase 4B - Separate)

- [ ] **In-platform PR Review**
  - Review tab UI (in progress separately)
  - Diff viewer for tasks in REVIEW
  - Accept/Merge button calls GitHub API
  - Updates task to DONE, triggers next task

### 4.5 Preview Integration (Deferred)

- [ ] **Create preview sandbox** - Separate sandbox for running preview
- [ ] **Embed preview iframe** - Preview tab in Mission Control

---

## Phase 5: Polish & Ship

**Goal:** Finalize UX, record demo video, and prepare for submission.

### 5.1 Visual Polish ✅

- [x] **Apply design system**
  - Terminal green accent color
  - Slate/dark background theme
  - Monospace fonts for logs

- [x] **Add animations**
  - Loading spinners for async operations
  - Task card transitions with Framer Motion
  - Progress indicators

- [ ] **Improve error states**
  - Friendly error messages
  - Retry suggestions
  - Fallback UI

### 5.2 UX Improvements

- [ ] **Add keyboard shortcuts**
  - Start/Pause execution
  - Navigate between views
  - Quick actions on tasks

- [ ] **Implement notifications**
  - Toast for task completions
  - Alert for failures
  - Browser notifications (optional)

- [ ] **Mobile responsiveness**
  - Responsive wizard flow
  - Collapsible sidebar on dashboard
  - Touch-friendly controls

### 5.3 Demo Video

- [ ] **Write demo script**
  - Scene 1: Landing → Vibe input (0:00-0:15)
  - Scene 2: Form → Plan generation (0:15-0:45)
  - Scene 3: Mission Control → Task execution (0:45-1:30)
  - Scene 4: PR merge → Preview loads (1:30-2:00)

- [ ] **Record demo**
  - Screen recording with OBS/Loom
  - Clean browser profile
  - Prepared test data

- [ ] **Edit and polish**
  - Add captions/annotations
  - Speed up waiting sections
  - Add background music (optional)

### 5.4 Documentation & Submission

- [ ] **Update README.md**
  - Project overview
  - Architecture diagram
  - Setup instructions
  - Environment variables list

- [ ] **Create CONTRIBUTING.md**
  - Development setup
  - Code style guidelines
  - PR process

- [ ] **Final testing**
  - End-to-end flow test
  - Error recovery test
  - Edge case handling

- [ ] **Submit**
  - Verify all requirements met
  - Upload demo video
  - Submit project link

---

## Task Dependencies

```
Phase 1.1 ──► Phase 1.2 ──► Phase 1.3 ──► Phase 1.4
                                              │
              Phase 2.1 ◄─────────────────────┘
                  │
                  ├──► Phase 2.2
                  │
                  └──► Phase 2.3
                          │
              Phase 3.1 ◄─┘
                  │
                  ├──► Phase 3.2 ──► Phase 3.3
                  │
                  └──► Phase 3.4
                          │
              Phase 4.1 ◄─┘
                  │
                  ├──► Phase 4.2 ──► Phase 4.3
                  │
                  └──► Phase 4.4
                          │
              Phase 5.1 ◄─┘
                  │
                  ├──► Phase 5.2
                  │
                  ├──► Phase 5.3
                  │
                  └──► Phase 5.4
```

---

## Gemini Models (Flagship - Gemini 3 Series)

| Model                    | Use Case                                    | Notes                                       |
| ------------------------ | ------------------------------------------- | ------------------------------------------- |
| `gemini-3-pro-preview`   | Planner Agent, complex task execution       | State-of-the-art reasoning, Deep Think Mode |
| `gemini-3-flash-preview` | Preview Agent, simple tasks, sandbox coding | 3x faster, Pro-grade reasoning              |

---

## Architecture: Platform-Controlled Execution

```
TanStack Start (Platform)
    ↓
Server Actions / API Routes
    ↓
Daytona SDK
    ↓
Sandbox → Gemini CLI (YOLO mode)
    ↓
Streaming logs back to platform
    ↓
SSE → Dashboard UI
```

**Key Design Decisions:**

- ✅ Platform controls all sandbox execution via Daytona SDK
- ✅ No autonomous runner script needed for MVP
- ✅ Real-time log streaming via command session output
- ✅ Server actions for most operations (closer to client, type-safe)
- ✅ API routes only for SSE (Webhooks deferred)
- ✅ In-platform PR merge to eliminate webhook/tunnel dependency for MVP

---

## Risk Checklist

| Risk                     | Mitigation                                        | Status |
| ------------------------ | ------------------------------------------------- | ------ |
| Gemini rate limits       | Use Flash model, exponential backoff              | ⬜     |
| Sandbox boot time        | Pre-built snapshots, loading UI                   | ✅     |
| Git merge conflicts      | Sequential task execution                         | ⬜     |
| Webhook tunnel stability | Cloudflare Tunnel backup, phone-home fallback     | ⬜     |
| Test-only validation     | TypeScript strict mode, future: lint + unit tests | ⬜     |

---

## Quick Reference

### Key Commands

```bash
# Development
bun run dev                    # Start dev server

# Database
bun run db:migrate             # Run Drizzle migrations
bun run db:generate            # Generate Drizzle migrations

# Sandbox
bun run snapshot:create        # Create universal Daytona snapshot
bun run snapshot:test          # Test sandbox functionality

# Testing
bun test                       # Run tests
bun run typecheck              # TypeScript check
```

### Key Files

| File                                | Purpose                           |
| ----------------------------------- | --------------------------------- |
| `src/lib/env.ts`                    | Typed environment config          |
| `src/lib/db.ts`                     | Drizzle client instance           |
| `src/lib/sandbox/provider.ts`       | Daytona SDK wrapper               |
| `src/lib/ai/preview-agent.ts`       | Preview Agent (Gemini 3 Flash)    |
| `src/lib/ai/planner-agent.ts`       | Planner Agent (Gemini 3 Pro)      |
| `src/lib/ai/schemas.ts`             | Zod schemas for structured AI     |
| `src/lib/actions/create-project.ts` | Create project server action      |
| `src/lib/git/github.ts`             | GitHub API operations             |
| `src/lib/git/index.ts`              | Repository creation orchestration |
| `scripts/create-snapshot.ts`        | Create universal sandbox          |
| `scripts/test-sandbox.ts`           | Test sandbox functionality        |
| `src/routes/project/$projectId.tsx` | Mission Control (TODO)            |

---

## Status Update (2026-01-30)

### ✅ Completed

**Phase 1-3: Foundation, Architect, Engine** - All complete

- TanStack Start + Bun + Drizzle ORM (Neon Postgres)
- Daytona sandbox with universal snapshot (`dev0-universal`)
- Preview Agent (Flash) + Planner Agent (Pro)
- GitHub repository genesis with templates
- `orchestrator` module with real-time streaming via SSE
- All server actions: `createProject`, `getProject`, `startExecution`, etc.

**Phase 4: Mission Control (Partial)**

- Dashboard at `/project/$projectId` with Kanban board
- Task Sheet with Info + Logs tabs
- `useExecutionEvents` hook for live log streaming
- Task cards with animations (Framer Motion)

**Phase 5.1: Visual Polish**

- Design system applied (terminal green, slate theme)
- Task animations and transitions complete

### 🔄 In Progress

**Phase 4.2.1: Frontend-Backend Integration**

- Wire TaskBoard to SSE events with `router.invalidate()`
- Test full workflow: PENDING → RUNNING → REVIEW
- Pass projectId prop to components

### 📋 Next Up

1. **Phase 4.4: PR Review & Merge** - Review tab UI, diff viewer, merge action
2. **Phase 4.5: Preview Integration** - Sandbox preview with Daytona public URL
3. **Phase 5.3: Demo Video** - Record end-to-end flow

---

_Last updated: 2026-01-30_
