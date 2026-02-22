# /project:find-duplicates -- Duplicate Code Identification

You are a duplicate code detection agent. Your job is to find code that is duplicated or near-duplicated across files, then propose consolidation strategies.

## Target

Target: $ARGUMENTS

Default: `apps/exchange-ui/src/`

## Safety Protocol

1. **This command is READ-ONLY by default.** It produces a report. It does NOT modify files unless the user explicitly asks to consolidate.
2. If the user asks to consolidate, follow the same safety protocol as `/project:simplify` (git checkpoint, approval before changes, typecheck after each edit, max 5 files per run).

## Detection Strategy

### Category 1: Structural Duplicates (Parallel Implementations)

This codebase has an intentional parallel pattern: Aster hooks and Hyperliquid hooks implement the same interface for different providers. These are NOT bugs -- they are the provider abstraction. But look for:

1. **Shared logic that should be extracted**: Both implementations may contain identical utility functions (e.g., data normalization, error handling, retry logic)
2. **Copy-pasted constants**: Magic numbers, URLs, timeouts duplicated across providers
3. **Identical type processing**: If both hooks transform data the same way before returning, that transform should be a shared utility

Compare these file pairs:
- `hooks/use-all-tickers.ts` vs `hooks/hyperliquid/use-hl-all-tickers.ts`
- `hooks/use-mark-price.ts` vs `hooks/hyperliquid/use-hl-mark-price.ts`
- `hooks/use-market-ticker.ts` vs `hooks/hyperliquid/use-hl-market-ticker.ts`
- `hooks/use-order-book.ts` vs `hooks/hyperliquid/use-hl-order-book.ts`
- `hooks/use-recent-trades.ts` vs `hooks/hyperliquid/use-hl-recent-trades.ts`
- `lib/aster/ws.ts` vs `lib/hyperliquid/ws.ts`
- `lib/aster/rest.ts` vs `lib/hyperliquid/rest.ts`

### Category 2: Accidental Duplicates

Search for:
1. Functions with identical or near-identical implementations in different files
2. Utility functions re-implemented instead of imported (formatNumber, formatPercent, etc.)
3. Identical React component patterns (loading states, error states, empty states)
4. Duplicate type definitions (same shape, different names)

### Category 3: Copy-Paste Artifacts

Look for:
1. Large code blocks (10+ lines) that appear verbatim in multiple files
2. Components that are 90%+ identical with only minor differences
3. Hook patterns that differ only in the data source

## Report Format

```
## Duplicate Code Report

### Target: [path]

#### Structural Duplicates (Provider Parallel Code)

##### Extractable Shared Logic
| Pattern | Files | Lines | Consolidation Strategy |
|---------|-------|-------|----------------------|
| WebSocket reconnect logic | `aster/ws.ts:45-80`, `hyperliquid/ws.ts:52-87` | ~35 | Extract to `lib/ws-base.ts` |
| Order book normalization | `use-order-book.ts:60-85`, `use-hl-order-book.ts:48-72` | ~25 | Extract to `lib/transforms/orderbook.ts` |

#### Accidental Duplicates

| Pattern | Locations | Similarity | Suggested Action |
|---------|-----------|-----------|------------------|
| `formatPrice()` | `utils.ts:12`, `Chart.tsx:45` | 100% | Remove Chart.tsx copy, import from utils |
| Error boundary wrapper | `OrderBook.tsx:8-20`, `TradeForm.tsx:8-20` | 95% | Extract to shared component |

#### Copy-Paste Artifacts

| Block | Source | Copy | Lines | Action |
|-------|--------|------|-------|--------|
| Loading skeleton | `MarketCard.tsx:30-50` | `TickerCard.tsx:25-45` | 20 | Extract `<MarketSkeleton>` |

### Summary
- Structural duplicates (extractable): [N] patterns, ~[N] lines
- Accidental duplicates: [N] patterns, ~[N] lines
- Copy-paste artifacts: [N] blocks, ~[N] lines
- Total consolidation potential: ~[N] lines

### Recommended Consolidation Order
1. [Highest impact, lowest risk first]
2. ...
3. ...
```

## What NOT to Flag

- Provider-specific types (Aster and HL types MUST remain separate — they are different API contracts)
- Provider-specific API calls (the actual REST/WS calls are provider-specific by definition)
- Intentional feature flag branching
- Test files with repeated setup patterns (test boilerplate is acceptable)

## Consolidation Guidance

When the user asks to consolidate:

1. **Start with utilities**: Extract shared helper functions first (lowest risk)
2. **Then shared hooks**: If two hooks share 50%+ logic, extract the shared pattern
3. **Then components**: Extract shared UI patterns (loading, error, empty states)
4. **Never merge provider types**: Aster and HL types stay separate

For each consolidation:
- Create the shared utility/component
- Update one consumer to use it
- Typecheck
- Update the other consumer
- Typecheck again
- Remove the old duplicate
- Final typecheck
