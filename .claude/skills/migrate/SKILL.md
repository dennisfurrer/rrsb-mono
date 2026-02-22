# /migrate — Phased Migration Skill

Use this skill for large-scale codebase changes: API migrations, package renames, dependency upgrades, refactors across multiple files.

## Pre-Migration Checklist

Before starting ANY migration:

1. **Check for uncommitted changes**:
   ```bash
   git status
   ```
   If uncommitted changes exist, suggest:
   ```bash
   git stash -m "WIP before migration"
   # or
   git add -A && git commit -m "checkpoint: before migration"
   ```

2. **Verify clean build**:
   ```bash
   pnpm typecheck && pnpm build
   ```
   Do NOT proceed if build is broken.

3. **Create migration branch**:
   ```bash
   git checkout -b migrate/<migration-name>
   ```

## Migration Plan Template

Present this plan before making any changes:

```
## Migration: [Name]

**Scope**: [What's changing — e.g., "Rename all @old/pkg imports to @new/pkg"]
**Files affected**: ~[N] files (run grep to count)
**Risk level**: [Low/Medium/High]

### Phases

1. **Phase 1: [Name]** — [Description]
   - Files: [list or pattern]
   - Checkpoint: `migrate-phase-1`

2. **Phase 2: [Name]** — [Description]
   - Files: [list or pattern]
   - Checkpoint: `migrate-phase-2`

3. **Phase 3: [Name]** — [Description]
   - Files: [list or pattern]
   - Checkpoint: `migrate-phase-3`

### Verification
- [ ] `pnpm typecheck` passes
- [ ] `pnpm build` passes
- [ ] `grep -r "old-pattern"` returns 0 results

Shall I proceed with Phase 1?
```

**Wait for approval before starting.**

## Phase Execution Protocol

For EACH phase:

### 1. Pre-Phase Checkpoint
```bash
git add -A && git commit -m "checkpoint: before phase N - [description]"
```

### 2. Execute Phase
- Make the changes for this phase ONLY
- Do not touch files from other phases
- Keep changes minimal and focused

### 3. Post-Phase Verification
```bash
pnpm typecheck
```

**If typecheck fails:**
- Attempt fix (max 2 tries)
- If still failing after 2 attempts:
  ```bash
  git reset --hard HEAD~1  # Revert to checkpoint
  ```
  Then report: "Phase N failed. Reverted to checkpoint. Error: [details]"

**If typecheck passes:**
```bash
git add -A && git commit -m "migrate: phase N complete - [description]"
```

### 4. Report Progress
```
## Phase N Complete ✓

**Changed**: [N] files
**Commits**: `abc1234` (checkpoint) → `def5678` (phase complete)
**Verification**: typecheck passes ✓

Ready for Phase [N+1]?
```

## Build Gates

Between each phase, these must pass:
- `pnpm typecheck` — Required
- `pnpm build` — Required for final phase
- `pnpm lint` — Recommended

**Never skip build gates.** If a gate fails, fix or revert before proceeding.

## Rollback Protocol

If migration needs to be abandoned:

1. **Identify safe rollback point**:
   ```bash
   git log --oneline -10
   ```

2. **Confirm with user**: "Should I roll back to commit [hash] ([description])?"

3. **Only after approval**:
   ```bash
   git reset --hard <commit-hash>
   ```

4. **Never force-push** without explicit permission

## Final Verification

After all phases complete:

```bash
# Verify no remnants of old patterns
grep -r "old-pattern" --include="*.ts" --include="*.tsx" .

# Full build verification
pnpm typecheck && pnpm build && pnpm lint

# Summary
git log --oneline migrate/<branch-name>..HEAD
```

Report:
```
## Migration Complete ✓

**Total commits**: [N]
**Files changed**: [N]
**Build status**: All passing ✓
**Remnant check**: No old patterns found ✓

Ready to merge `migrate/<branch-name>` into main?
```

## Common Migration Types

### Import Path Migration
```
Phase 1: Package.json / tsconfig paths
Phase 2: Source file imports (src/**)
Phase 3: Test file imports (tests/**)
Phase 4: Config files (*.config.ts)
```

### API Migration
```
Phase 1: Type definitions
Phase 2: API client/service files
Phase 3: Components using the API
Phase 4: Tests
```

### Package Upgrade
```
Phase 1: Update package.json + lockfile
Phase 2: Fix breaking type changes
Phase 3: Fix breaking runtime changes
Phase 4: Update deprecated API usage
```

## Anti-Patterns to Avoid

| Anti-Pattern | Correct Approach |
|--------------|------------------|
| All changes in one commit | Checkpoint after each phase |
| Skipping typecheck between phases | Always verify before continuing |
| Continuing after failed verification | Revert to checkpoint and report |
| Mixing migration with unrelated fixes | Only migration changes on migration branch |
| Force-pushing to shared branches | Always ask before force-push |

## Example Interaction

**User**: Migrate all imports from @acme/old-sdk to @acme/new-sdk

**Claude**: Let me analyze the scope first.

```bash
grep -r "@acme/old-sdk" --include="*.ts" --include="*.tsx" . | wc -l
```

Found 47 files with imports to migrate.

## Migration: @acme/old-sdk → @acme/new-sdk

**Scope**: Update all imports from `@acme/old-sdk` to `@acme/new-sdk`
**Files affected**: ~47 files
**Risk level**: Medium (API surface may have changed)

### Phases

1. **Phase 1: Config files** — tsconfig.json, package.json
   - Files: 2
   - Checkpoint: `migrate-phase-1`

2. **Phase 2: Core services** — src/services/**, src/lib/**
   - Files: ~12
   - Checkpoint: `migrate-phase-2`

3. **Phase 3: Components** — src/components/**
   - Files: ~28
   - Checkpoint: `migrate-phase-3`

4. **Phase 4: Tests & docs** — tests/**, *.md
   - Files: ~5
   - Checkpoint: `migrate-phase-4`

### Verification
- [ ] `pnpm typecheck` passes
- [ ] `pnpm build` passes
- [ ] `grep -r "@acme/old-sdk"` returns 0 results

Shall I proceed with Phase 1?
