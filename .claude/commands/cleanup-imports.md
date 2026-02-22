# /project:cleanup-imports -- Unused Import Removal

You are an import cleanup agent. Your job is to find and remove unused imports from TypeScript/TSX files.

## Target

Target: $ARGUMENTS

Default: `apps/exchange-ui/src/`

## Why This Exists

TypeScript's `noUnusedLocals` and ESLint's `no-unused-vars` catch many unused imports, but they miss:
- Type imports that should use `import type` syntax
- Namespace imports where only some members are used
- Re-exports that are no longer consumed downstream
- Imports used only in commented-out code

## Safety Protocol

1. Run typecheck BEFORE starting to establish a baseline:
   ```bash
   pnpm --filter @perpsstudio/exchange-ui exec tsc --noEmit
   ```
   If it already fails, report the existing errors and ask whether to proceed.

2. After each file edit, run typecheck again.
3. Max 10 files per run (import cleanup is low-risk, so higher limit than other commands).

## Steps

### Step 1: Scan Files
For each `.ts` / `.tsx` file in the target:

1. Parse all import statements
2. For each imported identifier, search the file body (excluding the import line itself) for usage
3. Categorize:
   - **Completely unused**: The import identifier never appears in the file body
   - **Type-only usage**: The identifier is only used in type positions (`: Type`, `<Type>`, `as Type`) -- should be `import type`
   - **Partially used**: Destructured import where some members are unused

### Step 2: Report

```
## Import Cleanup Report

### Target: [path]

#### Completely Unused Imports
| File | Import | From |
|------|--------|------|
| `Chart.tsx` | `useCallback` | `react` |
| `DataStrip.tsx` | `formatPercent` | `~/lib/utils` |

#### Should Be `import type`
| File | Import | From |
|------|--------|------|
| `OrderBook.tsx` | `ProcessedOrderBook` | `~/lib/types/market` |

#### Partially Used Destructured Imports
| File | Import | Used | Unused |
|------|--------|------|--------|
| `EntryPanel.tsx` | `{ useState, useEffect, useRef }` from `react` | `useState, useEffect` | `useRef` |

### Summary
- Files scanned: [N]
- Unused imports: [N]
- Type-only imports: [N]
- Partially used: [N]

Shall I clean these up?
```

### Step 3: Apply (on approval)

For each file:
1. Remove completely unused imports
2. Convert type-only imports to `import type { ... }`
3. Remove unused members from destructured imports
4. Run typecheck after each file

## What NOT to Remove

- React import (`import React from 'react'`) in files that use JSX -- even though modern React doesn't require it, some configs do
- CSS/SCSS module imports (`import styles from './foo.module.css'`) -- these have side effects
- Imports with comments like `// eslint-disable-next-line` above them
- Polyfill imports (`import 'core-js/...'`) -- these are side-effect imports
- Imports in declaration files (`.d.ts`)
