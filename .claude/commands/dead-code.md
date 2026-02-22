# /project:dead-code -- Dead Code Detection and Removal

You are a dead code detection agent. Your job is to find code that is defined but never used, then propose its removal.

## Target

The user may provide a specific file or directory. If not, scan the main application source.

Target: $ARGUMENTS

Default target if none provided: `apps/exchange-ui/src/`

## Safety Protocol

1. **Check git status first.** If uncommitted changes exist, warn the user and ask whether to proceed.
2. **Report before removing.** Never delete code without showing the full report first.
3. **Verify after each removal** with `pnpm --filter @perpsstudio/exchange-ui exec tsc --noEmit`.
4. **Max 5 files modified per run.**

## Detection Steps

### Step 1: Unused Exports
For each `.ts` / `.tsx` file in the target:
1. Find all `export` statements (named exports, default exports, re-exports)
2. For each export, search the ENTIRE codebase for imports of that name
3. An export is "dead" if:
   - Zero files import it AND
   - It is not in a barrel `index.ts` (barrel files are pass-through, check consumers of the barrel) AND
   - It is not a React page/layout component (Next.js uses file-based routing, these are implicitly consumed)

### Step 2: Unused Local Functions/Variables
For each file:
1. Find functions, constants, and variables that are NOT exported
2. Search within the SAME FILE for usage
3. Flag any that are defined but never referenced after definition

### Step 3: Commented-Out Code
Find blocks of commented-out code (3+ consecutive lines starting with `//` that look like code, not documentation).

### Step 4: Unreachable Code
Find code after unconditional `return`, `throw`, `break`, or `continue` statements.

### Step 5: Unused Imports
Find import statements where the imported name is never used in the file. Note: TypeScript compiler already catches most of these, so focus on type-only imports that TSC may not flag.

## Report Format

```
## Dead Code Report

### Target: [path]

#### Unused Exports (high confidence)
| File | Export Name | Type | Confidence |
|------|------------|------|------------|
| `src/lib/utils.ts` | `formatDate` | function | HIGH — zero imports found |
| `src/hooks/useAuth.ts` | `AuthState` | type | MEDIUM — only imported in tests |

#### Unused Local Definitions
| File | Name | Type | Line |
|------|------|------|------|
| `src/components/Chart.tsx` | `calculateMA` | function | 142 |

#### Commented-Out Code
| File | Lines | Preview |
|------|-------|---------|
| `src/lib/ws.ts` | 45-52 | `// const oldHandler = ...` |

#### Unreachable Code
| File | Line | Reason |
|------|------|--------|
| `src/hooks/usePositions.ts` | 88 | Code after unconditional return |

### Summary
- Dead exports: [N]
- Dead locals: [N]
- Commented code blocks: [N]
- Unreachable blocks: [N]
- Estimated removable lines: [N]

Shall I remove the HIGH confidence items?
```

## Exclusions

Never flag these as dead code:
- `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx` exports (Next.js convention)
- `metadata` or `generateMetadata` exports (Next.js convention)
- Provider-specific types (e.g., `HLOrderWire`, `AsterTicker24hr`) -- these are API contracts
- Anything in `__tests__/` or `*.test.*` or `*.spec.*`
- CSS module exports
- Barrel file re-exports (`index.ts` that re-export from other files)

## After Approval

When the user approves removals:
1. Remove dead code surgically — do not reformat or restructure the remaining code
2. Run typecheck after EACH file modification
3. If typecheck fails, immediately revert that specific change and report
4. After all removals, run full typecheck:
   ```bash
   pnpm --filter @perpsstudio/exchange-ui exec tsc --noEmit
   ```
5. Report final summary of what was removed
