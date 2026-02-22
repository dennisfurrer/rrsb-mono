# Admin Panel Data Model Reference

Complete TypeScript interfaces for the PerpsStudio admin panel. These types define every entity in the in-memory store and API layer.

---

## Core Entities

### Partner (the whitelabel customer)

```typescript
interface Partner {
  id: string;
  name: string;                    // "Everex Labs"
  slug: string;                    // "everex" — used in URLs
  contactEmail: string;
  contactName: string;
  tier: 'starter' | 'growth' | 'enterprise';
  status: 'onboarding' | 'active' | 'suspended' | 'churned';
  createdAt: number;               // Unix timestamp
  updatedAt: number;
}
```

### Exchange (the deployed DEX instance)

```typescript
interface Exchange {
  id: string;
  partnerId: string;               // FK → Partner
  name: string;                    // "EVEREX"
  slug: string;                    // "everex"
  status: 'setup' | 'staging' | 'live' | 'maintenance' | 'disabled';
  domain: DomainConfig;
  branding: BrandingConfig;
  skinId: string;                  // Which base skin to use
  features: ExchangeFeatures;
  createdAt: number;
  updatedAt: number;
}

interface DomainConfig {
  subdomain: string;               // "everex" → everex.perps.studio
  customDomain: string | null;     // "trade.everex.pro"
  sslStatus: 'pending' | 'active' | 'error';
}

interface BrandingConfig {
  logoUrl: string | null;
  faviconUrl: string | null;
  primaryColor: string;            // Hex color
  accentColor: string;
  backgroundColor: string;
  fontFamily: string;
  tagline: string;
}

interface ExchangeFeatures {
  orderBook: boolean;
  chart: boolean;
  tradeForm: boolean;
  positionTable: boolean;
  marketBar: boolean;
  scanner: boolean;
  oneClickTrading: boolean;
  leverageSelector: boolean;
  socialFeed: boolean;
  leaderboard: boolean;
}
```

### Market (a trading pair on an exchange)

```typescript
interface Market {
  id: string;
  exchangeId: string;              // FK → Exchange
  symbol: string;                  // "BTC-USDC"
  baseAsset: string;               // "BTC"
  quoteAsset: string;              // "USDC"
  status: 'active' | 'halted' | 'delisted';
  maxLeverage: number;             // e.g., 100
  defaultLeverage: number;         // e.g., 10
  tickSize: string;                // "0.01" — use string for precision
  minOrderSize: string;            // "0.001"
  maxOrderSize: string;            // "1000"
  maintenanceMarginRate: string;   // "0.005" (0.5%)
  initialMarginRate: string;       // "0.01" (1%)
  makerFeeRate: string;            // "0.0002" (0.02%)
  takerFeeRate: string;            // "0.0005" (0.05%)
  createdAt: number;
  updatedAt: number;
}
```

### Fee Structure

```typescript
interface FeeStructure {
  id: string;
  exchangeId: string;              // FK → Exchange
  name: string;                    // "Standard", "VIP", "Market Maker"
  tier: number;                    // 0 = default, 1 = VIP1, etc.
  makerFeeRate: string;            // "0.0002"
  takerFeeRate: string;            // "0.0005"
  volumeThreshold: string;         // "0" for default, "1000000" for VIP1
  isDefault: boolean;
}
```

### Risk Parameters

```typescript
interface RiskParameters {
  id: string;
  exchangeId: string;              // FK → Exchange
  maxOpenPositions: number;        // Per user
  maxLeverage: number;             // Global max
  maxPositionSize: string;         // In quote asset
  liquidationPenaltyRate: string;  // "0.01" (1%)
  insuranceFundRate: string;       // "0.005" (0.5%)
  autoDeleverage: boolean;
  circuitBreakerThreshold: string; // Price deviation % that halts trading
  cooldownPeriod: number;          // Seconds after circuit breaker
}
```

---

## User & Access Entities

### User (team member on a partner)

```typescript
type Role = 'super_admin' | 'ops' | 'partner_admin' | 'partner_editor' | 'partner_viewer';

interface User {
  id: string;
  partnerId: string | null;        // null for PerpsStudio ops
  email: string;
  name: string;
  role: Role;
  status: 'active' | 'invited' | 'suspended';
  lastLoginAt: number | null;
  createdAt: number;
}
```

### API Key

```typescript
interface ApiKey {
  id: string;
  partnerId: string;               // FK → Partner
  userId: string;                  // FK → User (who created it)
  name: string;                    // "Production Key"
  keyPrefix: string;               // "ps_live_abc..." (first 12 chars)
  permissions: ApiKeyPermission[];
  expiresAt: number | null;        // null = never
  lastUsedAt: number | null;
  status: 'active' | 'revoked';
  createdAt: number;
}

type ApiKeyPermission = 'read:markets' | 'write:markets' | 'read:analytics' | 'read:positions' | 'write:orders';
```

### Session (mock auth)

```typescript
interface Session {
  userId: string;
  partnerId: string | null;
  role: Role;
  exchangeId: string | null;
}
```

---

## Analytics Entities

### Trade Metrics (daily snapshot)

```typescript
interface TradeMetrics {
  id: string;
  exchangeId: string;
  date: string;                    // "2026-02-09"
  volume24h: string;               // bigint string "1234567890"
  trades24h: number;
  uniqueTraders: number;
  openInterest: string;
  fees24h: string;
  liquidations24h: number;
  liquidationVolume24h: string;
}
```

### Volume Data (for charts)

```typescript
interface VolumeDataPoint {
  timestamp: number;
  volume: string;                  // bigint string
  trades: number;
  fees: string;
}
```

### Liquidation Event

```typescript
interface LiquidationEvent {
  id: string;
  exchangeId: string;
  marketSymbol: string;
  side: 'long' | 'short';
  size: string;
  price: string;
  loss: string;
  timestamp: number;
}
```

---

## System Entities

### Audit Log

```typescript
interface AuditLogEntry {
  id: string;
  partnerId: string | null;
  userId: string;
  action: string;                  // "market.created", "fee.updated", "user.invited"
  resource: string;                // "market:btc-usdc", "user:abc123"
  details: Record<string, unknown>;
  ipAddress: string;
  timestamp: number;
}
```

### Notification

```typescript
interface Notification {
  id: string;
  userId: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  read: boolean;
  actionUrl: string | null;
  timestamp: number;
}
```

---

## Seed Data Shape

The store should be seeded with:

### Partner: Everex Labs
- Tier: enterprise, Status: active
- 1 exchange (EVEREX), 3 markets, 3 fee tiers, risk params configured

### Exchange: EVEREX
- Status: live
- Domain: everex.perps.studio + trade.everex.pro
- Branding: Midnight blue theme, ice blue accent (#3b82f6)
- Skin: "everex" (three-panel conviction terminal)
- All features enabled except socialFeed and leaderboard

### Markets
| Symbol | Max Leverage | Maker Fee | Taker Fee |
|--------|-------------|-----------|-----------|
| BTC-USDC | 100x | 0.02% | 0.05% |
| ETH-USDC | 50x | 0.02% | 0.05% |
| SOL-USDC | 20x | 0.03% | 0.06% |

### Team
| Name | Role | Status |
|------|------|--------|
| Alice Chen | partner_admin | active |
| Bob Kumar | partner_editor | active |
| Carol Wei | partner_viewer | active |

### PerpsStudio Ops
| Name | Role |
|------|------|
| Dennis (you) | super_admin |
| Support Bot | ops |

### Analytics
- 30 days of mock trade metrics with realistic volume curves
- Weekly cycle (lower weekends), upward trend
- ~$50M daily volume, ~12,000 trades, ~200 unique traders
- 5-10 liquidation events per day
