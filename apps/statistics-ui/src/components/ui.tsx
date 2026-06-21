import { flagUrl } from "../lib/flags";
import { BALL_META, FREE_BALL_GRADIENT, breakTier } from "../lib/snooker";
import type { V3BallType } from "../lib/apiV3";

/** Country flag chip; falls back to the IOC code badge when unknown. */
export function Flag({ ioc, size = 18 }: { ioc: string | null | undefined; size?: number }) {
  const url = flagUrl(ioc);
  if (!url) {
    if (!ioc) return null;
    return <span className="flag-fallback">{ioc}</span>;
  }
  return (
    <img
      className="flag-img"
      src={url}
      alt={ioc ?? ""}
      style={{ width: size, height: Math.round((size * 3) / 4) }}
      loading="lazy"
    />
  );
}

/** A snooker ball as a small colored disc. */
export function Ball({
  type,
  size = 22,
  showValue = false,
}: {
  type: V3BallType;
  size?: number;
  showValue?: boolean;
}) {
  const meta = BALL_META[type];
  const isFree = type === "FREE_BALL";
  return (
    <span
      className="ball-disc"
      title={meta.label}
      style={{
        width: size,
        height: size,
        background: isFree ? FREE_BALL_GRADIENT : meta.hex,
        color: meta.fg,
        boxShadow: meta.ring ? `inset 0 0 0 1.5px ${meta.ring}` : undefined,
        fontSize: size * 0.42,
      }}
    >
      {showValue && !isFree ? meta.value : ""}
    </span>
  );
}

/** Coloured break-value badge. */
export function BreakBadge({ value, small }: { value: number; small?: boolean }) {
  return (
    <span className={`break-badge ${breakTier(value)} ${small ? "sm" : ""}`}>{value}</span>
  );
}

/** A labelled statistic tile. */
export function StatTile({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div className={`stat-tile ${accent ? "accent" : ""}`}>
      <div className="stat-tile-value">{value}</div>
      <div className="stat-tile-label">{label}</div>
      {sub != null && <div className="stat-tile-sub">{sub}</div>}
    </div>
  );
}

/** Live / finished / aborted status pill. */
export function StatusPill({ status }: { status: "ACTIVE" | "FINISHED" | "ABORTED" }) {
  const map = {
    ACTIVE: { cls: "live", label: "Live" },
    FINISHED: { cls: "ended", label: "Final" },
    ABORTED: { cls: "aborted", label: "Stopped" },
  } as const;
  const m = map[status];
  return (
    <span className={`status-pill ${m.cls}`}>
      <span className="status-dot-sm" />
      {m.label}
    </span>
  );
}
