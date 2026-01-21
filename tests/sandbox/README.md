# Sandbox Integration Tests

This directory contains end-to-end integration tests for the Daytona sandbox provider.

## Running Tests

```bash
# Run all sandbox tests
bun test tests/sandbox

# Run with verbose output
bun test tests/sandbox --verbose

# Run specific test file
bun test tests/sandbox/integration.test.ts
```

## Test Coverage

### `integration.test.ts`

Full end-to-end workflow test:

1. ✅ Sandbox creation from snapshot
2. ✅ Template repository cloning
3. ✅ Basic command execution
4. ✅ Environment verification (Bun, Node, Git)
5. ✅ Gemini CLI simple task (file creation)
6. ✅ Gemini CLI realistic task (React component)
7. ✅ Git availability check

## Requirements

- Database must be running and migrated
- Daytona API credentials in `.env.local`
- Gemini API key configured
- `dev0-universal` snapshot must exist

## Test Duration

Expect tests to take **5-10 minutes** total:

- Sandbox creation: ~2-3 minutes
- Template cloning: ~30 seconds
- Gemini tasks: ~1-3 minutes each

## Debugging Failed Tests

If tests fail:

1. **Check Daytona sandbox status:**

   ```bash
   # The test logs the Daytona ID
   # Check it in Daytona dashboard
   ```

2. **Check database:**

   ```bash
   bunx prisma studio
   # Look for test-project-* entries
   ```

3. **Enable debug mode:**

   ```typescript
   // In the test file, add to Gemini calls:
   {
     debug: true
   }
   ```

4. **Manual cleanup (if test crashes):**

   ```bash
   # Delete test project from database
   bunx prisma studio

   # Or via code:
   bun -e "import { prisma } from './src/lib/db'; await prisma.project.deleteMany({ where: { name: { contains: 'Test Todo' } } })"
   ```
