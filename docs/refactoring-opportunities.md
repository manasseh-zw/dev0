# Refactoring Opportunities & Performance Improvements

This document outlines small, non-critical refactoring opportunities that can improve performance, code quality, and user experience without changing the core architecture.

---

## 🔴 High Priority - Performance Impact

### 1. **String Concatenation in Event Parsing** 
**Location:** `src/lib/execution/orchestrator.ts:327-329`

**Current Implementation:**
```typescript
stdoutBuffer += chunk
const lines = stdoutBuffer.split('\n')
stdoutBuffer = lines.pop() ?? ''
```

**Issue:** String concatenation (`+=`) creates new strings on each chunk, causing O(n²) complexity for large streams.

**Refactor:**
```typescript
// Use array for efficient appending
const stdoutBuffer: string[] = []
stdoutBuffer.push(chunk)
const fullText = stdoutBuffer.join('')
const lines = fullText.split('\n')
stdoutBuffer.length = 0
if (lines.length > 0) {
  stdoutBuffer.push(lines.pop()!)
}
```

**Impact:** 
- ✅ Significant performance improvement for long-running tasks
- ✅ Reduces memory allocations
- ✅ Better handling of large log streams

**Effort:** Low (5-10 minutes)

---

### 2. **Repeated Database Queries in Task Claiming**
**Location:** `src/lib/execution/orchestrator.ts:1011-1056`

**Current Implementation:**
```typescript
const status = await getTaskStatus(task.id)
const runningTaskId = await getRunningTaskId(projectId)
```

**Issue:** Multiple sequential database queries that could be combined.

**Refactor:**
```typescript
// Single query to get both status and running task
const [taskStatus, runningTask] = await Promise.all([
  db.select({ status: tasks.status })
    .from(tasks)
    .where(eq(tasks.id, taskId))
    .limit(1),
  db.select({ id: tasks.id })
    .from(tasks)
    .where(and(
      eq(tasks.projectId, projectId),
      eq(tasks.status, 'RUNNING')
    ))
    .limit(1)
])
```

**Impact:**
- ✅ Reduces database round trips
- ✅ Faster task claiming under load
- ✅ Better scalability

**Effort:** Medium (15-20 minutes)

---

### 3. **Inefficient Array Operations in Task Dependency Resolution**
**Location:** `src/lib/execution/orchestrator.ts:226-244`

**Current Implementation:**
```typescript
const runnable = allTasks.find((task, index) => {
  // ... checks ...
  const hasPriorIncomplete = allTasks
    .slice(0, index)
    .some((prior) => !isComplete(prior.status))
  return !hasPriorIncomplete
})
```

**Issue:** `slice()` creates new array on each iteration, and `some()` scans repeatedly.

**Refactor:**
```typescript
// Track completion status as we iterate
let foundIncompleteBefore = false
const runnable = allTasks.find((task) => {
  if (task.status !== 'PENDING') {
    if (!isComplete(task.status)) {
      foundIncompleteBefore = true
    }
    return false
  }
  
  if (foundIncompleteBefore) {
    return false
  }
  
  const hasUnmetDependencies = !task.dependencies.every((dependencyId) =>
    isComplete(statusById.get(dependencyId)),
  )
  
  return !hasUnmetDependencies
})
```

**Impact:**
- ✅ O(n) instead of O(n²) complexity
- ✅ Faster task selection for projects with many tasks
- ✅ Better performance as project scales

**Effort:** Low (10-15 minutes)

---

### 4. **Inefficient Log Buffer Management**
**Location:** `src/components/task/sheet/task-logs.tsx:63-69`

**Current Implementation:**
```typescript
setLiveLogs((prev) => {
  const next = [...prev, entry]
  if (next.length > maxLogs) {
    return next.slice(next.length - maxLogs)
  }
  return next
})
```

**Issue:** Creates new array and copies all elements on every log entry.

**Refactor:**
```typescript
setLiveLogs((prev) => {
  if (prev.length >= maxLogs) {
    // Remove oldest entry efficiently
    return [...prev.slice(1), entry]
  }
  return [...prev, entry]
})
```

**Impact:**
- ✅ Reduces array copying overhead
- ✅ Smoother UI updates during high-frequency logging
- ✅ Better memory efficiency

**Effort:** Low (5 minutes)

---

## 🟡 Medium Priority - Code Quality & UX

### 5. **Realtime Channel Caching**
**Location:** `src/lib/execution/orchestrator.ts` (multiple `getRealtimeChannel()` calls)

**Current Implementation:**
```typescript
void getRealtimeChannel(projectId).emit('execution.task_log', { ... })
```

**Issue:** `getRealtimeChannel()` is called repeatedly, creating new channel instances.

**Refactor:**
```typescript
// Cache channel per execution
const channel = getRealtimeChannel(projectId)
void channel.emit('execution.task_log', { ... })
void channel.emit('execution.task_started', { ... })
```

**Impact:**
- ✅ Slight performance improvement
- ✅ Cleaner code
- ✅ Consistent channel usage

**Effort:** Low (10 minutes)

---

### 6. **Sandbox Connection Pooling**
**Location:** `src/lib/sandbox/providers/e2b.ts:101-106`

**Current Implementation:**
```typescript
async function connectSandbox(sandboxId: string) {
  return Sandbox.connect(sandboxId, {
    ...getE2bConnectionOpts(),
    timeoutMs: getE2bSandboxTimeoutMs(),
  })
}
```

**Issue:** Creates new connection on every call, even for same sandbox.

**Refactor:**
```typescript
// Simple connection cache
const connectionCache = new Map<string, Promise<Sandbox>>()

async function connectSandbox(sandboxId: string) {
  if (!connectionCache.has(sandboxId)) {
    connectionCache.set(
      sandboxId,
      Sandbox.connect(sandboxId, {
        ...getE2bConnectionOpts(),
        timeoutMs: getE2bSandboxTimeoutMs(),
      }).catch((error) => {
        connectionCache.delete(sandboxId)
        throw error
      })
    )
  }
  return connectionCache.get(sandboxId)!
}
```

**Impact:**
- ✅ Reduces connection overhead
- ✅ Faster command execution
- ✅ Better resource utilization

**Effort:** Medium (20 minutes) - Need to handle connection cleanup

---

### 7. **Unnecessary Array Copying in Task Board**
**Location:** `src/components/task/board/task-board.tsx:84-102`

**Current Implementation:**
```typescript
React.useEffect(() => {
  setItems(
    tasks.map((task) => {
      // ... transformation logic ...
    }),
  )
  // ... more state updates ...
}, [tasks, optimisticStatuses])
```

**Issue:** Creates new array and objects on every render, even when nothing changed.

**Refactor:**
```typescript
const items = React.useMemo(() => {
  return tasks.map((task) => {
    const optimistic = optimisticStatuses[task.id]
    // ... transformation logic ...
  })
}, [tasks, optimisticStatuses])
```

**Impact:**
- ✅ Prevents unnecessary re-renders
- ✅ Better React performance
- ✅ Smoother UI interactions

**Effort:** Low (10 minutes)

---

### 8. **Event Filtering Optimization**
**Location:** `src/lib/execution/orchestrator.ts:295-305`

**Current Implementation:**
```typescript
const shouldEmit =
  !(geminiEvent?.type === 'message' && geminiEvent.role === 'user')
if (shouldEmit) {
  void getRealtimeChannel(projectId).emit(...)
}
```

**Issue:** Filters user messages but still processes them through JSON parsing.

**Refactor:**
```typescript
// Early return for user messages before parsing
if (line.includes('"role":"user"') && line.includes('"type":"message"')) {
  return // Skip user messages entirely
}
const parsed = JSON.parse(line)
// ... rest of processing
```

**Impact:**
- ✅ Reduces JSON parsing overhead
- ✅ Faster event processing
- ✅ Less memory allocation

**Effort:** Low (5 minutes) - Need to be careful with string matching

---

### 9. **Duplicate Status Checks**
**Location:** `src/lib/execution/orchestrator.ts:1015-1027`

**Current Implementation:**
```typescript
const task = await getTaskById(projectId, taskId)
const updated = await claimPendingTask(task.id)
if (updated) {
  return { task }
}
const status = await getTaskStatus(task.id) // Redundant - we already have task.status
```

**Issue:** Fetches task status again when we already have it from `getTaskById()`.

**Refactor:**
```typescript
const task = await getTaskById(projectId, taskId)
if (task.status !== 'PENDING') {
  const runningTaskId = await getRunningTaskId(projectId)
  if (runningTaskId) {
    return { alreadyRunning: true, runningTaskId }
  }
  throw new Error(`Task is not pending (status: ${task.status})`)
}
const updated = await claimPendingTask(task.id)
```

**Impact:**
- ✅ Eliminates redundant database query
- ✅ Faster error handling
- ✅ Cleaner code flow

**Effort:** Low (10 minutes)

---

## 🟢 Low Priority - Code Cleanliness

### 10. **Extract Constants for Magic Numbers**
**Location:** Multiple files

**Current Implementation:**
```typescript
const maxLogs = 500  // In task-logs.tsx
timeoutMs: options?.timeout ?? 600000  // In e2b.ts
```

**Refactor:**
```typescript
// src/lib/constants.ts
export const MAX_TASK_LOGS = 500
export const DEFAULT_COMMAND_TIMEOUT_MS = 600000
export const MAX_TASK_CLAIM_ATTEMPTS = 3
```

**Impact:**
- ✅ Better maintainability
- ✅ Consistent values across codebase
- ✅ Easier to tune performance

**Effort:** Low (15 minutes)

---

### 11. **Memoize Expensive Computations**
**Location:** `src/lib/execution/orchestrator.ts:786-809`

**Current Implementation:**
```typescript
const resultEvent = events.find((e) => e.type === 'result')
const assistantMessages = events.filter(
  (event) => event.type === 'message' && event.role === 'assistant',
)
const toolCallsCount = events.filter((e) => e.type === 'tool_use').length
```

**Issue:** Multiple array iterations over same dataset.

**Refactor:**
```typescript
// Single pass through events
let resultEvent: GeminiResultEvent | undefined
let assistantMessages: GeminiMessageEvent[] = []
let toolCallsCount = 0

for (const event of events) {
  if (event.type === 'result') {
    resultEvent = event
  } else if (event.type === 'message' && event.role === 'assistant') {
    assistantMessages.push(event)
  } else if (event.type === 'tool_use') {
    toolCallsCount++
  }
}
```

**Impact:**
- ✅ O(n) instead of O(3n)
- ✅ Better performance for large event arrays
- ✅ More efficient memory usage

**Effort:** Low (10 minutes)

---

### 12. **Debounce Router Invalidation**
**Location:** `src/components/task/board/task-board.tsx:80`

**Current Implementation:**
```typescript
router.invalidate() // Called on every event
```

**Issue:** Invalidates router cache on every real-time event, causing unnecessary refetches.

**Refactor:**
```typescript
const invalidateRouter = React.useMemo(
  () => debounce(() => router.invalidate(), 500),
  [router]
)

// In event handler:
invalidateRouter()
```

**Impact:**
- ✅ Reduces unnecessary API calls
- ✅ Better performance during high-frequency events
- ✅ Smoother UI updates

**Effort:** Medium (15 minutes) - Need to add debounce utility

---

### 13. **Optimize String Escaping**
**Location:** `src/lib/sandbox/providers/e2b.ts:31-41`

**Current Implementation:**
```typescript
function escapeForDoubleQuotes(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\$/g, '\\$')
    .replace(/`/g, '\\`')
}
```

**Issue:** Multiple string replacements create intermediate strings.

**Refactor:**
```typescript
function escapeForDoubleQuotes(value: string): string {
  return value.replace(/[\\"$`]/g, (char) => {
    const map: Record<string, string> = {
      '\\': '\\\\',
      '"': '\\"',
      '$': '\\$',
      '`': '\\`',
    }
    return map[char] || char
  })
}
```

**Impact:**
- ✅ Single pass through string
- ✅ Slightly better performance
- ✅ More maintainable

**Effort:** Low (5 minutes)

---

### 14. **Batch Real-time Emissions**
**Location:** `src/lib/execution/orchestrator.ts` (multiple emit calls)

**Current Implementation:**
```typescript
void getRealtimeChannel(projectId).emit('execution.task_log', { ... })
// ... later ...
void getRealtimeChannel(projectId).emit('execution.task_log', { ... })
```

**Issue:** Multiple individual emissions could be batched.

**Refactor:**
```typescript
// Batch events and emit together
const batchedEvents: Array<{ event: string; data: unknown }> = []

// Collect events
batchedEvents.push({ event: 'execution.task_log', data: { ... } })

// Emit batch periodically or on flush
if (batchedEvents.length >= 10 || isComplete) {
  const channel = getRealtimeChannel(projectId)
  for (const { event, data } of batchedEvents) {
    void channel.emit(event, data)
  }
  batchedEvents.length = 0
}
```

**Impact:**
- ✅ Reduces network overhead
- ✅ Better for high-frequency events
- ✅ More efficient pub/sub usage

**Effort:** Medium (30 minutes) - Need careful implementation to avoid delays

---

## 📊 Summary

### Quick Wins (Low Effort, High Impact)
1. ✅ String concatenation optimization (#1)
2. ✅ Log buffer management (#4)
3. ✅ Array operations optimization (#3)
4. ✅ Memoize task board items (#7)

### Medium Impact
5. ✅ Database query optimization (#2)
6. ✅ Sandbox connection pooling (#6)
7. ✅ Event filtering optimization (#8)

### Code Quality
8. ✅ Extract constants (#10)
9. ✅ Single-pass event processing (#11)
10. ✅ Optimize string escaping (#13)

### Consider Carefully
- **Debounce router invalidation (#12)** - May cause UX issues if too aggressive
- **Batch real-time emissions (#14)** - May introduce latency, test carefully

---

## Implementation Priority

**Phase 1 (Immediate - 1-2 hours):**
- #1, #3, #4, #7, #8, #9

**Phase 2 (This Week - 2-3 hours):**
- #2, #5, #6, #10, #11, #13

**Phase 3 (Future - Evaluate):**
- #12, #14

---

## Testing Considerations

After implementing these refactorings:

1. **Performance Testing:**
   - Measure task execution time with large log streams
   - Test task claiming under concurrent load
   - Monitor memory usage during long-running tasks

2. **Functional Testing:**
   - Verify real-time events still work correctly
   - Ensure task dependency resolution is correct
   - Test sandbox connection reuse

3. **Load Testing:**
   - Test with projects containing 50+ tasks
   - Test with high-frequency log events
   - Test concurrent task executions

---

## Notes

- All refactorings maintain existing functionality
- No architectural changes required
- Backward compatible
- Can be implemented incrementally
- Each can be tested independently
