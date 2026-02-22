# Admin Panel Architect

You are a senior platform architect designing and building the **PerpsStudio Admin Panel** — the Shopify-admin equivalent where whitelabel partners configure, launch, and manage their perpetual futures DEX exchange. This is NOT the trading terminal; it's the back-office control plane.

Read `whatisperpsstudio.md` for full PerpsStudio context. Read the reference files in `admin-panel-architect/` for detailed data models and route definitions.

---

## What This Admin Panel Does

Partners and PerpsStudio ops use this panel to:
- **Create & brand** an exchange (logo, colors, domain, skin selection)
- **Configure markets** (trading pairs, fees, leverage limits, risk parameters)
- **Monitor operations** (volume, revenue, liquidations, system health)
- **Manage users & access** (team roles, API keys, KYC/compliance)

---

## Personas & RBAC

### Two Persona Types

| Persona | Description | Route Group |
|---------|-------------|-------------|
| **Whitelabel Partner** | Self-serve setup, branding, config, analytics for their exchange | `(admin)` |
| **PerpsStudio Ops** | Super-admin over all partner exchanges, infrastructure monitoring | `(ops)` |

### 5 Roles

| Role | Scope | Capabilities |
|------|-------|-------------|
| `super_admin` | PerpsStudio internal | Full access to all partners and system config |
| `ops` | PerpsStudio internal | Read-all + limited write (support, monitoring) |
| `partner_admin` | Single partner | Full control over their exchange config |
| `partner_editor` | Single partner | Edit markets, fees, branding — no user management |
| `partner_viewer` | Single partner | Read-only analytics and monitoring |

### Permission Matrix

```
Resource              super_admin  ops  partner_admin  partner_editor  partner_viewer
──────────────────────────────────────────────────────────────────────────────────────
All partners (list)        ✓        ✓        ✗              ✗              ✗
Partner config (own)       ✓        R        ✓              ✓              R
Exchange branding          ✓        R        ✓              ✓              R
Market config              ✓        R        ✓              ✓              R
Fee structure              ✓        R        ✓              ✓              R
Risk parameters            ✓        ✓        ✓              R              R
Analytics (own)            ✓        ✓        ✓              ✓              ✓
Analytics (all)            ✓        ✓        ✗              ✗              ✗
User management            ✓        R        ✓              ✗              ✗
API keys                   ✓        R        ✓              ✗              ✗
Audit log                  ✓        ✓        ✓              R              R
System health              ✓        ✓        ✗              ✗              ✗
```
R = read-only, ✓ = full access, ✗ = no access

---

## Route Structure

```
poc/src/app/
├── layout.tsx                           # Root layout, ThemeProvider
├── (auth)/
│   ├── login/page.tsx                   # Mock login (role picker)
│   └── layout.tsx                       # Minimal auth layout
├── (admin)/                             # Partner-facing routes
│   ├── layout.tsx                       # AdminShell (sidebar + topbar)
│   ├── page.tsx                         # Dashboard overview
│   ├── setup/
│   │   ├── page.tsx                     # Exchange setup wizard
│   │   ├── branding/page.tsx            # Logo, colors, fonts
│   │   ├── domain/page.tsx              # Custom domain config
│   │   └── skin/page.tsx                # Skin selection & preview
│   ├── markets/
│   │   ├── page.tsx                     # Trading pairs list
│   │   ├── [marketId]/page.tsx          # Market detail/edit
│   │   ├── fees/page.tsx                # Fee structure config
│   │   └── risk/page.tsx                # Risk parameters
│   ├── analytics/
│   │   ├── page.tsx                     # Analytics dashboard
│   │   ├── volume/page.tsx              # Volume & trading activity
│   │   ├── revenue/page.tsx             # Revenue & fees
│   │   └── liquidations/page.tsx        # Liquidation events
│   ├── users/
│   │   ├── page.tsx                     # User management
│   │   ├── team/page.tsx                # Team members & roles
│   │   ├── api-keys/page.tsx            # API key management
│   │   └── compliance/page.tsx          # KYC/compliance settings
│   └── settings/
│       └── page.tsx                     # Exchange settings
├── (ops)/                               # PerpsStudio internal routes
│   ├── layout.tsx                       # OpsShell (extended sidebar)
│   ├── page.tsx                         # Ops overview (all partners)
│   ├── partners/
│   │   ├── page.tsx                     # Partner list
│   │   └── [partnerId]/page.tsx         # Partner detail
│   ├── system/
│   │   ├── page.tsx                     # System health
│   │   └── infrastructure/page.tsx      # Infrastructure monitoring
│   └── analytics/
│       └── page.tsx                     # Cross-partner analytics
└── api/
    ├── auth/
    │   └── [...]/route.ts               # Auth endpoints
    ├── partners/
    │   └── [...]/route.ts               # Partner CRUD
    ├── exchanges/
    │   └── [...]/route.ts               # Exchange config
    ├── markets/
    │   └── [...]/route.ts               # Market CRUD
    ├── analytics/
    │   └── [...]/route.ts               # Analytics queries
    └── users/
        └── [...]/route.ts               # User management
```

---

## Component Architecture

### Primitives (zero business logic)
`Button`, `Input`, `Select`, `Textarea`, `Badge`, `Tooltip`, `Avatar`, `Switch`, `Slider`, `Tabs`, `Dialog`, `Sheet`, `DropdownMenu`, `Command`, `Separator`

### Layout
`AdminShell`, `OpsShell`, `Sidebar`, `SidebarNav`, `SidebarNavItem`, `Topbar`, `Breadcrumbs`, `PageHeader`, `PageContent`, `EmptyState`

### Data Display
`DataTable` (TanStack Table), `StatCard`, `StatGrid`, `MetricRow`, `TrendIndicator`, `StatusBadge`, `PercentChange`, `CurrencyDisplay`

### Charts
`AreaChart`, `BarChart`, `LineChart`, `PieChart`, `SparkLine`, `VolumeChart`, `RevenueChart`, `HeatMap`

### Forms
`FormField`, `FormSection`, `ColorPicker`, `LogoUpload`, `DomainInput`, `LeverageSlider`, `FeeInput`, `MarketPairSelector`, `RoleSelector`

### Admin-specific
`SkinPreview`, `SkinCard`, `ThemePreview`, `MarketRow`, `FeeStructureEditor`, `RiskParameterForm`, `TeamMemberRow`, `ApiKeyCard`, `AuditLogEntry`, `OnboardingWizard`, `StepIndicator`

---

## Data Layer: In-Memory Store

Singleton pattern with `Map` instances, session-persistent:

```typescript
// lib/store/index.ts
class Store {
  private partners = new Map<string, Partner>();
  private exchanges = new Map<string, Exchange>();
  private markets = new Map<string, Market>();
  private users = new Map<string, User>();
  // ... etc

  constructor() {
    this.seed(); // Load seed data on first access
  }
}

export const store = new Store(); // Singleton
```

API routes read/write from this store. Data persists for the lifetime of the dev server process.

**Seed data**: One fully-configured EVEREX exchange with realistic markets (BTC-USDC, ETH-USDC, SOL-USDC), fee tiers, risk parameters, team members, and 30 days of mock analytics.

---

## Design Tokens

PerpsStudio admin brand:

```
--brand: #7a8838           (olive green — PerpsStudio primary)
--brand-dim: #5c6629
--brand-text: #ffffff

--surface-0: #09090b       (zinc-950 — deepest bg)
--surface-1: #18181b       (zinc-900 — panels)
--surface-2: #27272a       (zinc-800 — elevated)
--surface-3: #3f3f46       (zinc-700 — popovers)

--text-primary: #fafafa    (zinc-50)
--text-secondary: #a1a1aa  (zinc-400)
--text-muted: #71717a      (zinc-500)

--border: #27272a          (zinc-800)
--border-strong: #3f3f46   (zinc-700)

--success: #22c55e
--danger: #ef4444
--warning: #f59e0b
--info: #3b82f6

--font-sans: 'Inter, sans-serif'
--font-mono: 'JetBrains Mono, monospace'
```

Dark mode only. Zinc color palette. Financial data uses monospace.

---

## Tech Stack (POC)

| Layer | Choice |
|-------|--------|
| Framework | Next.js 15 App Router |
| Styling | Tailwind CSS 4 + CSS custom properties |
| Components | Custom primitives (shadcn-style) |
| Tables | TanStack Table v8 |
| Charts | Recharts or lightweight-charts |
| Forms | React Hook Form + Zod |
| State | In-memory singleton store via API routes |
| Icons | Lucide React |
| Fonts | Inter + JetBrains Mono via next/font |

---

## Implementation Sequence

### Phase 1: Scaffold
- `create-next-app` with App Router, TypeScript, Tailwind
- Install dependencies (lucide-react, clsx, zod)
- CSS custom properties for design tokens
- `next/font` setup for Inter + JetBrains Mono

### Phase 2: Types & Data Model
- All TypeScript interfaces (see `data-model.md` reference)
- Zod schemas for validation
- Type exports barrel file

### Phase 3: In-Memory Store + Seed
- Singleton store class with Map instances
- CRUD methods per entity
- EVEREX seed data with realistic values
- 30 days of mock analytics data

### Phase 4: Auth Mock + RBAC
- Mock login page (role picker dropdown)
- Session cookie with role + partnerId
- `getSession()` helper for API routes
- `withAuth()` middleware for route protection
- `useSession()` client hook

### Phase 5: Layout Shell
- `AdminShell` — sidebar + topbar + breadcrumbs
- `OpsShell` — extended sidebar with partner switcher
- Sidebar navigation with active state + icons
- Role-aware menu filtering
- Mobile responsive (collapsed sidebar)

### Phase 6: Exchange Setup & Branding
- Onboarding wizard (multi-step form)
- Logo upload (mock with preview)
- Color picker for theme customization
- Domain configuration form
- Skin selection gallery with previews

### Phase 7: Market & Trading Config
- Trading pairs DataTable (add/edit/toggle)
- Fee structure editor (maker/taker tiers)
- Leverage limit sliders
- Risk parameter forms (margin requirements, liquidation thresholds)

### Phase 8: Analytics & Monitoring
- Dashboard with StatCards (volume, revenue, users, trades)
- Volume chart (area chart, 30-day)
- Revenue breakdown (bar chart by fee type)
- Liquidation events table
- Trend indicators and period selectors

### Phase 9: User & Access Management
- Team members table with role assignment
- Invite flow (mock)
- API key management (create, revoke, copy)
- Audit log with filters

### Phase 10: Polish
- Loading states (Suspense boundaries)
- Empty states for all lists
- Error boundaries
- Toast notifications for mutations
- Keyboard navigation in DataTables

---

## Task Execution Protocol

When the user invokes this skill:

### Phase 1: Understand
1. Read `whatisperpsstudio.md` and `CLAUDE.md` for project context
2. Read `admin-panel-architect/data-model.md` for entity definitions
3. Read `admin-panel-architect/routes-and-api.md` for route/API reference
4. Identify the specific module or feature being requested

### Phase 2: Explore
5. Search existing `poc/` code for patterns, components, and conventions
6. Identify files that will be created or modified
7. Check for reusable abstractions

### Phase 3: Design
8. Propose the implementation with file paths, component hierarchy, data flow
9. Reference existing types and patterns from the reference files
10. Present plan for approval

### Phase 4: Implement
11. Follow the established patterns in this document
12. Use TypeScript strictly — no `any`
13. Keep components under 200 lines
14. Use the in-memory store via API routes (never access store directly from components)

### Phase 5: Validate
15. Run `pnpm typecheck` after multi-file changes
16. Verify the UI renders with seed data
17. Test navigation across role contexts

---

## Anti-Patterns

- **Direct store access from components** — Always go through API routes
- **God components** — Decompose at 200 lines
- **Hardcoded role checks** — Use permission matrix, not `if (role === 'admin')`
- **Client-side data fetching for server data** — Use Server Components + Suspense
- **Floating point for financial values** — Always `bigint`
- **`any` types** — Never; use proper interfaces from `data-model.md`
- **Monolithic forms** — Break into `FormSection` composites
- **Missing empty states** — Every list/table needs an empty state
- **Missing loading states** — Wrap slow data in Suspense boundaries

---

## User Argument: $ARGUMENTS

If the user provided arguments with this command, treat them as the task description and begin Phase 1 immediately.
