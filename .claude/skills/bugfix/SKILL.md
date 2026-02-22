# /bugfix — Structured Bug Fixing Skill

Use this skill for debugging errors, fixing broken functionality, resolving type errors, and addressing lint issues.

## Step 1: Diagnose First (Before Writing Any Code)

**Always run diagnostics before manually searching:**

```bash
# Type errors
pnpm typecheck
# or for specific package:
pnpm --filter <package> exec tsc --noEmit

# Lint errors
pnpm lint
# or for specific package:
pnpm --filter <package> lint

# Build errors
pnpm build 2>&1 | head -50
```

**Do NOT:**
- Manually grep through files looking for errors
- Guess at what might be wrong
- Start editing code before understanding the error

## Step 2: Propose Approach (Wait for Approval)

After diagnosing, present your proposed fix:

```
## Bug Analysis

**Error**: [exact error message]
**Location**: [file:line]
**Root Cause**: [your analysis]

## Proposed Fix

**Approach**: [brief description]
**Files to modify**: [list files]
**Risk level**: [low/medium/high]

Shall I proceed with this fix?
```

**Wait for user approval before implementing.**

## Step 3: Implement with Guardrails

1. **Make minimal changes**: Fix only what's broken. Don't refactor adjacent code.

2. **Max 2 attempts**: If the fix doesn't work after 2 tries:
   - Stop
   - Summarize what you tried
   - Ask for guidance
   - Do NOT keep trying variations

3. **Verify after each attempt**:
   ```bash
   pnpm typecheck  # Must pass
   ```

4. **Never run destructive git commands**:
   - `git checkout <file>` — FORBIDDEN without explicit permission
   - `git reset --hard` — FORBIDDEN without explicit permission
   - `git clean` — FORBIDDEN without explicit permission
   - `git restore` — FORBIDDEN without explicit permission

   If you need to revert changes, ask: "Should I revert the changes to [file]?"

## Step 4: Confirm Resolution

After implementing:

```
## Fix Applied

**Changed**: [files modified]
**Verification**: `pnpm typecheck` passes ✓

The [error type] in [location] is resolved because [brief explanation].
```

## Multi-Bug Sessions

When fixing multiple bugs:

1. **List all bugs first** with severity/priority
2. **Fix one at a time** — complete verification before moving to next
3. **Checkpoint after each fix**: Suggest `git add -p` for selective staging
4. **Track progress**:
   ```
   Bugs Fixed: 2/5
   ✓ Bug 1: Type error in UserCard.tsx
   ✓ Bug 2: Missing null check in useAuth
   → Bug 3: [currently working]
   ○ Bug 4: [pending]
   ○ Bug 5: [pending]
   ```

## Common Debugging Anti-Patterns to Avoid

| Anti-Pattern | Correct Approach |
|--------------|------------------|
| Manual file searching before lint | Run `pnpm typecheck` first |
| Trying multiple fixes without asking | Max 2 attempts, then ask |
| Destructive git commands | Always ask permission |
| Fixing "while you're there" issues | Only fix the reported bug |
| Changing working code to fix broken code | Minimize blast radius |
| Continuing after repeated failures | Stop and ask for guidance |

## Emergency Recovery

If something goes wrong:

1. **Don't panic-run git commands**
2. **Report the situation**: "The fix introduced a new error: [details]"
3. **Ask before reverting**: "Should I revert the changes to restore the previous state?"
4. **Never assume** the user wants you to undo your changes

## Example Interaction

**User**: The build is failing

**Claude**: Let me run diagnostics first.

```bash
pnpm typecheck
```

[Output shows error]

## Bug Analysis

**Error**: `Type 'string | undefined' is not assignable to type 'string'`
**Location**: `src/hooks/useAuth.ts:45`
**Root Cause**: `walletAddress` can be undefined but is being passed to a function expecting a required string.

## Proposed Fix

**Approach**: Add a null check before calling `formatAddress(walletAddress)`
**Files to modify**: `src/hooks/useAuth.ts`
**Risk level**: Low

Shall I proceed with this fix?
