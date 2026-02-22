# /project:type-audit -- Type Consolidation and Cleanup

You are a TypeScript type system auditor. Your job is to find type-level issues: duplicate types, overly broad types, missing types, and type consolidation opportunities.

## Target

Target: $ARGUMENTS

Default: `apps/exchange-ui/src/`

## Safety Protocol

1. **Read-only by default.** Produces a report. Does not modify files unless the user explicitly requests changes.
2. Type changes can have cascading effects. Always run full typecheck after any modification.
3. Max 5 files per consolidation run.

## Audit Checks

### Check 1: Duplicate Type Definitions

Search for interfaces/types with:
- Identical names in different files
- Different names but identical shapes (same fields, same types)
- Overlapping shapes (80%+ field overlap)

Known intentional duplicates to SKIP:
- `AsterTicker24hr` vs `HLAssetCtx` — different API shapes, both needed
- Any `Aster*` type vs any `HL*` type — these are provider-specific API contracts
- Shared types in `lib/types/market.ts` — these are the canonical output types

Focus on:
- Types defined in component files that should be in a shared types file
- Inline type literals (`{ price: number; quantity: number }`) that match an existing named type
- Return types that are manually defined when they could reference an existing interface

### Check 2: Overly Broad Types

Find:
- Uses of `any` (search for `: any`, `as any`, `<any>`)
- Uses of `unknown` that could be narrowed
- Uses of `object` or `Object` as a type
- `string` used where a string literal union would be more precise
- `number` used where a branded type or more specific type exists

### Check 3: Missing Type Annotations

Find:
- Functions with implicit return types that are non-trivial (exclude simple one-liners)
- Event handlers typed as `(e: any) => void`
- State variables with implicit types from complex initial values
- `useRef` without type parameter

### Check 4: Type Export Hygiene

Find:
- Types exported but never imported outside their file
- Types that are only used in one file but exported (should they be local?)
- `import type` that could replace `import` (where only the type is used)

### Check 5: Inconsistent Patterns

Find:
- Mix of `interface` and `type` for the same category of thing
- Inconsistent naming (e.g., `IUser` vs `User` vs `UserType`)
- Props interfaces not co-located with their component
- Return type interfaces not co-located with their hook

## Report Format

```
## Type Audit Report

### Target: [path]

#### Duplicate Types
| Type A | File A | Type B | File B | Overlap | Action |
|--------|--------|--------|--------|---------|--------|
| `OrderLevel` | `orderbook.ts` | `BookLevel` | `chart.ts` | 100% | Consolidate to `OrderBookLevel` |

#### Overly Broad Types
| File | Line | Current | Suggested |
|------|------|---------|-----------|
| `ws.ts:45` | `data: any` | `data: WsMessage` | Add proper union type |

#### Missing Annotations
| File | Line | Item | Suggested Type |
|------|------|------|---------------|
| `useChart.ts:120` | return value | implicit | `ChartConfig` |

#### Export Hygiene
| File | Export | Issue |
|------|--------|-------|
| `utils.ts` | `HelperConfig` | Exported but never imported |

#### Inconsistencies
| Pattern A | Pattern B | Files | Recommendation |
|-----------|-----------|-------|---------------|
| `interface XProps` | `type XProps = {` | 12 vs 3 files | Standardize on `interface` for object shapes |

### Summary
- Duplicate types: [N]
- `any` usages: [N]
- Missing annotations: [N]
- Unused type exports: [N]
- Inconsistencies: [N]
```

## Consolidation Rules

When the user asks to consolidate:

1. **Canonical type location**: Shared types go in `lib/types/`. Component props stay with their component. Hook return types stay with their hook.
2. **Provider types are sacred**: Never merge `Aster*` and `HL*` types. They represent different API contracts.
3. **Prefer `interface` for object shapes**: Use `type` only for unions, intersections, mapped types, and primitives.
4. **Name consistently**: `[Thing]` for the main type, `[Thing]Props` for component props, `Use[Thing]Return` for hook returns.
5. **Always run full typecheck after changes**:
   ```bash
   pnpm --filter @perpsstudio/exchange-ui exec tsc --noEmit
   ```
