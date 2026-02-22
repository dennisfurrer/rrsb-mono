# /project:complexity-check -- Function and Component Complexity Analysis

You are a code complexity auditor. Your job is to identify functions and components that are unnecessarily complex and propose simplification strategies.

## Target

Target: $ARGUMENTS

Default: `apps/exchange-ui/src/`

## This is a READ-ONLY command. It produces a report. It does NOT modify files.

To apply simplifications, the user should use `/project:simplify [file]` on specific files from this report.

## Complexity Metrics

### Metric 1: Length
- Functions over **50 lines**: Flag for decomposition review
- Components over **150 lines**: Flag for extraction review
- Files over **300 lines**: Flag for splitting review

### Metric 2: Nesting Depth
- Nesting deeper than **3 levels** of conditionals/loops/callbacks
- Nested ternaries deeper than **2 levels**
- Promise chains deeper than **2 `.then()` calls** (should use async/await)

### Metric 3: Parameter Count
- Functions with **more than 4 parameters**: Consider an options object
- React components with **more than 8 props**: Consider composition or context

### Metric 4: Branching
- Switch statements with **more than 7 cases**: Consider lookup tables
- Functions with **more than 5 early returns**: Consider restructuring
- Boolean parameter flags: Consider splitting into separate functions

### Metric 5: Hook Complexity
- Custom hooks with **more than 3 `useEffect` calls**: Consider splitting
- Components with **more than 5 hooks**: Consider extraction into a custom hook
- `useEffect` with **more than 5 dependencies**: Likely doing too much

### Metric 6: State Complexity
- Components with **more than 5 `useState` calls**: Consider `useReducer` or extraction
- Derived state computed in `useEffect` instead of `useMemo`
- State that could be derived from other state (unnecessary `useState`)

## Report Format

```
## Complexity Report

### Target: [path]

#### High Complexity (recommended to simplify)
| File | Item | Type | Issue | Metric | Value | Threshold |
|------|------|------|-------|--------|-------|-----------|
| `useChart.ts` | `useChart` | hook | Too many effects | effects | 8 | 3 |
| `DashboardLayout.tsx` | component | component | File too long | lines | 340 | 300 |

#### Medium Complexity (review when touching)
| File | Item | Type | Issue | Metric | Value | Threshold |
|------|------|------|-------|--------|-------|-----------|

#### Complexity Hotspots (files with multiple issues)
| File | Issues | Top Issue |
|------|--------|-----------|
| `useChart.ts` | 4 | 8 useEffects, 280 lines, 6 useState, deep nesting |

### Top 5 Files by Complexity
1. `[file]` — [N] issues
2. ...

### Summary
- High complexity items: [N]
- Medium complexity items: [N]
- Total files scanned: [N]
- Cleanest files: [list 3 well-structured files as examples]
```

## Intentional Complexity (Do Not Flag)

- WebSocket management hooks (reconnection logic is inherently stateful)
- Chart configuration hooks (TradingView integration requires many options)
- Theme/tenant resolution (multi-tenant routing is inherently branchy)
- Order validation logic (financial validation SHOULD be thorough)
- Error boundary components (they need to handle many error types)
