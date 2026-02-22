# Admin Panel Routes & API Reference

Complete route map and API endpoint definitions for the PerpsStudio admin panel.

---

## Page Routes

### Auth Routes — `(auth)/`

| Route | Page | Description |
|-------|------|-------------|
| `/login` | Login | Mock role picker (dropdown with all 5 roles) |

### Admin Routes — `(admin)/` — Partner-facing

| Route | Page | Description |
|-------|------|-------------|
| `/` | Dashboard | Overview cards: volume, revenue, users, markets |
| `/setup` | Exchange Setup | Onboarding wizard (name, domain, branding, skin) |
| `/setup/branding` | Branding | Logo upload, color picker, font selector, tagline |
| `/setup/domain` | Domain Config | Subdomain, custom domain, SSL status |
| `/setup/skin` | Skin Selection | Gallery of available skins with live preview |
| `/markets` | Markets List | DataTable of all trading pairs with status toggles |
| `/markets/[marketId]` | Market Detail | Edit leverage, tick size, order limits |
| `/markets/fees` | Fee Structure | Fee tiers editor (maker/taker by volume) |
| `/markets/risk` | Risk Parameters | Margin requirements, liquidation config, circuit breakers |
| `/analytics` | Analytics Dashboard | Volume, revenue, liquidation summary charts |
| `/analytics/volume` | Volume Detail | 30-day volume chart, breakdown by market |
| `/analytics/revenue` | Revenue Detail | Fee revenue by type, partner revenue share |
| `/analytics/liquidations` | Liquidations | Event log with filters, liquidation volume chart |
| `/users` | User Management | End-user list (traders on the exchange) |
| `/users/team` | Team Members | Partner team roles and invites |
| `/users/api-keys` | API Keys | Key management (create, revoke, permissions) |
| `/users/compliance` | Compliance | KYC settings, geo-restrictions, rate limits |
| `/settings` | Settings | General exchange settings, danger zone |

### Ops Routes — `(ops)/` — PerpsStudio internal

| Route | Page | Description |
|-------|------|-------------|
| `/ops` | Ops Overview | All-partner summary: total volume, active exchanges, alerts |
| `/ops/partners` | Partner List | DataTable of all partners with status, tier, volume |
| `/ops/partners/[partnerId]` | Partner Detail | Full view of a specific partner's exchange and metrics |
| `/ops/system` | System Health | Uptime, error rates, latency, WebSocket connections |
| `/ops/system/infrastructure` | Infrastructure | Server instances, database, cache, queue status |
| `/ops/analytics` | Cross-Partner Analytics | Aggregated volume, revenue, growth trends |

---

## API Routes

All API routes use Next.js Route Handlers. The in-memory store is accessed via a singleton `store` import. All mutations return the updated entity.

### Auth

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/login` | Set session cookie (body: `{ role, partnerId? }`) |
| `POST` | `/api/auth/logout` | Clear session cookie |
| `GET` | `/api/auth/session` | Return current session |

### Partners

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/partners` | List all partners (ops only) |
| `GET` | `/api/partners/[id]` | Get partner by ID |
| `PUT` | `/api/partners/[id]` | Update partner |
| `POST` | `/api/partners` | Create partner (ops only) |

### Exchanges

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/exchanges/[id]` | Get exchange config |
| `PUT` | `/api/exchanges/[id]` | Update exchange config |
| `PUT` | `/api/exchanges/[id]/branding` | Update branding |
| `PUT` | `/api/exchanges/[id]/domain` | Update domain config |
| `PUT` | `/api/exchanges/[id]/features` | Toggle features |
| `PUT` | `/api/exchanges/[id]/skin` | Change skin |

### Markets

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/markets?exchangeId=X` | List markets for exchange |
| `GET` | `/api/markets/[id]` | Get market detail |
| `POST` | `/api/markets` | Create market |
| `PUT` | `/api/markets/[id]` | Update market config |
| `PATCH` | `/api/markets/[id]/status` | Toggle active/halted |
| `DELETE` | `/api/markets/[id]` | Delist market |

### Fees

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/fees?exchangeId=X` | List fee tiers |
| `POST` | `/api/fees` | Create fee tier |
| `PUT` | `/api/fees/[id]` | Update fee tier |
| `DELETE` | `/api/fees/[id]` | Delete fee tier |

### Risk

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/risk?exchangeId=X` | Get risk parameters |
| `PUT` | `/api/risk/[id]` | Update risk parameters |

### Analytics

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/analytics/overview?exchangeId=X` | Dashboard metrics (current period) |
| `GET` | `/api/analytics/volume?exchangeId=X&period=30d` | Volume time series |
| `GET` | `/api/analytics/revenue?exchangeId=X&period=30d` | Revenue time series |
| `GET` | `/api/analytics/liquidations?exchangeId=X&limit=50` | Recent liquidation events |
| `GET` | `/api/analytics/aggregate` | Cross-partner metrics (ops only) |

### Users & Team

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/users?partnerId=X` | List team members |
| `POST` | `/api/users/invite` | Invite team member |
| `PUT` | `/api/users/[id]` | Update user role/status |
| `DELETE` | `/api/users/[id]` | Remove user |

### API Keys

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/api-keys?partnerId=X` | List API keys |
| `POST` | `/api/api-keys` | Create API key (returns full key once) |
| `PATCH` | `/api/api-keys/[id]/revoke` | Revoke key |
| `DELETE` | `/api/api-keys/[id]` | Delete key |

### Audit Log

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/audit-log?partnerId=X&limit=100` | Recent audit entries |

### System (ops only)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/system/health` | System health metrics |
| `GET` | `/api/system/infrastructure` | Infrastructure status |

---

## API Response Format

All endpoints return consistent JSON:

```typescript
// Success
{ data: T }

// Error
{ error: { code: string; message: string } }

// List
{ data: T[]; total: number }
```

---

## Request Validation

Use Zod schemas that mirror the TypeScript interfaces. Validate in route handlers before touching the store:

```typescript
// Example: PUT /api/markets/[id]
const updateMarketSchema = z.object({
  symbol: z.string().optional(),
  maxLeverage: z.number().min(1).max(200).optional(),
  defaultLeverage: z.number().min(1).optional(),
  tickSize: z.string().optional(),
  makerFeeRate: z.string().optional(),
  takerFeeRate: z.string().optional(),
  status: z.enum(['active', 'halted', 'delisted']).optional(),
});
```

---

## Auth Middleware Pattern

```typescript
// lib/auth.ts
export async function getSession(req: NextRequest): Promise<Session | null> {
  const cookie = req.cookies.get('ps-session');
  if (!cookie) return null;
  return JSON.parse(cookie.value) as Session;
}

export function requireRole(...roles: Role[]) {
  return async (req: NextRequest) => {
    const session = await getSession(req);
    if (!session || !roles.includes(session.role)) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
        { status: 403 }
      );
    }
    return session;
  };
}
```
