import { useEffect, useRef, useState } from "react";
import {
  BALL_COLORS,
  FOUL_TYPES,
  MISS_TYPES,
  POCKETS,
  routineById,
  type BallColor,
  type BreakAttempt,
  type FoulType,
  type MissType,
  type Pocket,
  type SoloRoutineId,
} from "../lib/solo";
import { BreakEntryDialog } from "./BreakEntryDialog";

interface Props {
  playerName: string;
  routineId: SoloRoutineId;
  redsCount: number;
  initialAttempts?: BreakAttempt[];
  onNewSession?: () => void;
  onSaveAndNewSession?: (attempts: BreakAttempt[]) => void;
  onCommit: (attempts: BreakAttempt[]) => void;
  onClose: () => void;
}

type PendingAttempt = BreakAttempt;

export function MultiEntryDialog({
  playerName,
  routineId,
  redsCount,
  initialAttempts = [],
  onNewSession,
  onSaveAndNewSession,
  onCommit,
  onClose,
}: Props) {
  const [pending, setPending] = useState<PendingAttempt[]>([]);
  const [showBreakEntry, setShowBreakEntry] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showNewSessionConfirm, setShowNewSessionConfirm] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [confirmRemoveIdx, setConfirmRemoveIdx] = useState<number | null>(null);
  const routine = routineById(routineId);
  const seriesMode = !!routine.seriesMode;
  const displayName = routineId === "ball1521" ? `${redsCount}er-Ball` : routine.name;
  // Max break for routines with fixed reds: reds×8 + 27 (colours-only phase sum)
  const maxBreak = ["lineup", "tline", "opentable", "zigzak"].includes(routineId)
    ? redsCount * 8 + 27
    : undefined;
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [initialAttempts.length, pending.length]);

  const addMissed = () => {
    setPending((p) => [...p, { kind: "missed", timestamp: Date.now() }]);
  };

  const addBreak = (
    value: number,
    details?: { missType?: MissType; foulType?: FoulType; ball?: BallColor; pocket?: Pocket }
  ) => {
    setPending((p) => [
      ...p,
      {
        kind: "break",
        value,
        missType: details?.missType,
        foulType: details?.foulType,
        ball: details?.ball,
        pocket: details?.pocket,
        timestamp: Date.now(),
      },
    ]);
    setShowBreakEntry(false);
  };

  const removeAt = (idx: number) => {
    setPending((p) => p.filter((_, i) => i !== idx));
  };

  const toggleClearance = (idx: number) => {
    setPending((p) =>
      p.map((a, i) => {
        if (i !== idx || a.kind !== "break") return a;
        return { ...a, clearance: !a.clearance };
      })
    );
  };

  const lastBreakIdx = pending.reduce(
    (acc, a, i) => (a.kind === "break" ? i : acc),
    -1
  );

  const commit = () => {
    if (pending.length === 0) {
      onClose();
      return;
    }
    onCommit(pending);
  };

  if (showBreakEntry) {
    return (
      <BreakEntryDialog
        playerName={playerName}
        seriesMode={seriesMode}
        routineName={maxBreak !== undefined ? `${displayName} mit ${redsCount} Roten` : displayName}
        maxBreak={maxBreak}
        onSubmit={addBreak}
        onClose={() => setShowBreakEntry(false)}
      />
    );
  }

  return (
    <div className="setup-overlay">
      <div className="multi-entry">
        <div className="multi-entry-header">
          <div className="multi-entry-title">Trainings-Session</div>
          <div className="multi-entry-meta">
            {displayName}
            {!seriesMode && routineId !== "ball1521" && routineId !== "farben-endlos" && <>{" — "}<span style={{ color: "#bbb" }}>{redsCount} Rote</span></>}
            {" — "}
            <span className="player-name-gold">{playerName}</span>
          </div>
          <button className="me-info-btn" onClick={() => setShowInfo(true)} type="button">?</button>
        </div>

        <div className="multi-entry-list-section">
          <div className="multi-entry-list-label">
            Heutige Ergebnisse ({initialAttempts.length + pending.length}):
            {initialAttempts.length > 0 && (
              <span style={{ color: "#666", fontSize: "0.85em", marginLeft: "0.8em" }}>
                ({initialAttempts.length} gespeichert, {pending.length} neu)
              </span>
            )}
          </div>
          <div className="multi-entry-list" ref={listRef}>
            {initialAttempts.length === 0 && pending.length === 0 ? (
              <div className="multi-entry-empty">
                Noch keine Versuche hinzugefügt.
              </div>
            ) : (
              <>
                {initialAttempts.map((a, i) => (
                  <div className="multi-entry-row" key={`init-${i}`} style={{ opacity: 0.55 }}>
                    <PendingRow
                      attempt={a}
                      index={i + 1}
                      seriesMode={seriesMode}
                      isClearanceCandidate={false}
                      onClearance={() => {}}
                    />
                    <span className="me-row-tags" style={{ marginLeft: "auto", paddingRight: "0.5vw", whiteSpace: "nowrap" }}>
                      {formatTime(a.timestamp)}
                    </span>
                  </div>
                ))}
                {pending.map((a, i) => (
                  <div className="multi-entry-row" key={`pend-${i}`}>
                    <PendingRow
                      attempt={a}
                      index={initialAttempts.length + i + 1}
                      seriesMode={seriesMode}
                      isClearanceCandidate={
                        !seriesMode &&
                        i === lastBreakIdx &&
                        a.kind === "break" &&
                        a.value >= redsCount * 3 + 27 &&
                        !a.missType && !a.ball && !a.pocket
                      }
                      onClearance={() => toggleClearance(i)}
                    />
                    <span className="me-row-tags" style={{ whiteSpace: "nowrap" }}>
                      {formatTime(a.timestamp)}
                    </span>
                    <button
                      className="multi-entry-remove"
                      onClick={() => setConfirmRemoveIdx(i)}
                      type="button"
                      aria-label="Entfernen"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        <div className="multi-entry-add-section">
          <div className="multi-entry-add-label">Hinzufügen:</div>
          {pending.length === 0 && (
            <div className="me-empty-hint">
              <div className="me-empty-hint-col">
                <div className="me-empty-hint-text">
                  {seriesMode ? "Serie" : "Break"} hier eingeben
                </div>
                <div className="me-empty-hint-arrow">↓</div>
              </div>
              <div className="me-empty-hint-col">
                <div className="me-empty-hint-text">
                  1. Ball verschossen?<br />Verfehlt klicken
                </div>
                <div className="me-empty-hint-arrow">↓</div>
              </div>
            </div>
          )}
          <div className="multi-entry-add-buttons">
            <button
              className="me-add me-add-break"
              onClick={() => setShowBreakEntry(true)}
            >
              <div className="me-add-icon">▦</div>
              <div className="me-add-label">{seriesMode ? "Serie" : "Break"}</div>
            </button>
            <button className="me-add me-add-missed" onClick={addMissed}>
              <div className="me-add-icon">✕</div>
              <div className="me-add-label">Verfehlt</div>
            </button>
          </div>
        </div>

        {showConfirm && (
          <div className="multi-entry-confirm">
            <div className="multi-entry-confirm-inner">
              <div className="multi-entry-confirm-text">
                Einträge verwerfen und abbrechen?
              </div>
              <div className="multi-entry-confirm-buttons">
                <button
                  className="multi-entry-confirm-no"
                  onClick={() => setShowConfirm(false)}
                  type="button"
                >
                  Nein
                </button>
                <button
                  className="multi-entry-confirm-yes"
                  onClick={onClose}
                  type="button"
                >
                  Ja, abbrechen
                </button>
              </div>
            </div>
          </div>
        )}

        {confirmRemoveIdx !== null && (() => {
          const a = pending[confirmRemoveIdx];
          const entryLabel = !a
            ? ""
            : a.kind === "missed"
              ? "Verfehlt"
              : seriesMode
                ? `Serie ${a.value}`
                : `Break ${a.value}`;
          const msg = !a ? "" : `Willst du den «${entryLabel}»-Eintrag wirklich löschen?`;
          return (
            <div className="multi-entry-confirm">
              <div className="multi-entry-confirm-inner multi-entry-confirm-inner--delete">
                <div className="multi-entry-confirm-text">{msg}</div>
                <div className="multi-entry-confirm-buttons">
                  <button
                    className="multi-entry-confirm-no"
                    onClick={() => setConfirmRemoveIdx(null)}
                    type="button"
                  >
                    Nein
                  </button>
                  <button
                    className="multi-entry-confirm-yes"
                    onClick={() => { removeAt(confirmRemoveIdx); setConfirmRemoveIdx(null); }}
                    type="button"
                  >
                    Ja, löschen
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

        {showNewSessionConfirm && (
          <div className="multi-entry-confirm">
            <div className="multi-entry-confirm-inner multi-entry-confirm-inner--delete">
              {pending.length > 0 ? (
                <>
                  <div className="multi-entry-confirm-text">
                    Noch {pending.length} nicht {pending.length === 1 ? "gespeicherter Eintrag" : "gespeicherte Einträge"}! Was soll damit geschehen?
                  </div>
                  <div className="multi-entry-confirm-buttons" style={{ flexDirection: "column", gap: "0.8vh" }}>
                    <button
                      className="multi-entry-confirm-yes"
                      style={{ background: "#1a5c1a", color: "#4ade80", borderColor: "#2a8c2a", padding: "2.2vh 1.5vw" }}
                      onClick={() => {
                        onSaveAndNewSession?.(pending);
                        setPending([]);
                        setShowNewSessionConfirm(false);
                      }}
                      type="button"
                    >
                      Speichern & neue Session starten
                    </button>
                    <button
                      className="multi-entry-confirm-yes"
                      style={{ padding: "2.2vh 1.5vw" }}
                      onClick={() => {
                        onNewSession?.();
                        setPending([]);
                        setShowNewSessionConfirm(false);
                      }}
                      type="button"
                    >
                      Verwerfen & neue Session starten
                    </button>
                    <button
                      className="multi-entry-confirm-no"
                      style={{ padding: "2.2vh 1.5vw" }}
                      onClick={() => setShowNewSessionConfirm(false)}
                      type="button"
                    >
                      Zurück
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="multi-entry-confirm-text">
                    Alle heutigen Einträge löschen und neu starten?
                  </div>
                  <div className="multi-entry-confirm-buttons">
                    <button
                      className="multi-entry-confirm-no"
                      onClick={() => setShowNewSessionConfirm(false)}
                      type="button"
                    >
                      Nein
                    </button>
                    <button
                      className="multi-entry-confirm-yes"
                      onClick={() => {
                        onNewSession?.();
                        setPending([]);
                        setShowNewSessionConfirm(false);
                      }}
                      type="button"
                    >
                      Ja, neu starten
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        <div className="multi-entry-actions">
          {initialAttempts.length > 0 && (
            <button
              className="multi-entry-cancel"
              style={{ borderColor: "#663300", color: "#cc6622" }}
              onClick={() => setShowNewSessionConfirm(true)}
              type="button"
            >
              Neue Session
            </button>
          )}
          <button
            className="multi-entry-cancel"
            onClick={() => pending.length > 0 ? setShowConfirm(true) : onClose()}
          >
            Abbrechen
          </button>
          <button
            className="multi-entry-stats-btn"
            onClick={() => setShowStats(true)}
            disabled={initialAttempts.length + pending.length === 0}
            type="button"
          >
            Statistik
          </button>
          <button
            className={`multi-entry-save ${pending.length === 0 ? "disabled" : ""}`}
            onClick={commit}
            disabled={pending.length === 0}
          >
            Speichern ({pending.length})
          </button>
        </div>

        {showStats && (
          <SessionStatsPopup
            pending={[...initialAttempts, ...pending]}
            seriesMode={seriesMode}
            redsCount={redsCount}
            routineName={routine.name}
            onClose={() => setShowStats(false)}
          />
        )}
      {showInfo && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 700, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={() => setShowInfo(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: "#2a2a2a", borderRadius: "12px", padding: "3.5vh 3vw", width: "65vw", maxHeight: "82vh", display: "flex", flexDirection: "column", gap: "2vh" }}
          >
            <div style={{ color: "#4ade80", fontSize: "2.2vw", fontWeight: "bold", flexShrink: 0 }}>
              {displayName}
            </div>
            <div
              style={{ color: "#ccc", fontSize: "1.7vw", lineHeight: 1.7, whiteSpace: "pre-line", flex: 1, overflow: "auto" }}
            >
              {routine.explanation ?? "Erklärung folgt…"}
            </div>
            <button
              onClick={() => setShowInfo(false)}
              style={{ flexShrink: 0, alignSelf: "center", padding: "1.2vh 4vw", fontSize: "1.6vw", fontWeight: "bold", border: "none", borderRadius: "8px", cursor: "pointer", background: "#1a5c1a", color: "#4ade80", fontFamily: "inherit" }}
            >
              OK
            </button>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

interface StatsPopupProps {
  pending: PendingAttempt[];
  seriesMode: boolean;
  redsCount: number;
  routineName: string;
  onClose: () => void;
}

function SessionStatsPopup({ pending, seriesMode, redsCount, routineName, onClose }: StatsPopupProps) {
  const breaks = pending.filter((a): a is Extract<PendingAttempt, { kind: "break" }> => a.kind === "break");
  const total = pending.length;
  const missedCount = pending.filter((a) => a.kind === "missed").length;
  const breakCount = breaks.length;
  const values = breaks.map((b) => b.value);
  const highest = values.length > 0 ? Math.max(...values) : 0;
  const lowest = values.length > 0 ? Math.min(...values) : 0;
  const sum = values.reduce((s, v) => s + v, 0);
  const avg = breakCount > 0 ? sum / breakCount : 0;
  const clearedCount = breaks.filter((b) => b.clearance).length;

  const distDenominator = total;
  const distBuckets: { label: string; count: number; color?: string }[] = seriesMode
    ? [
        { label: "0",        count: missedCount,                                      color: "#f87171" },
        { label: "1–4",      count: values.filter((v) => v >= 1 && v <= 4).length },
        { label: "5–8",      count: values.filter((v) => v >= 5 && v <= 8).length },
        { label: "9–12",     count: values.filter((v) => v >= 9 && v <= 12).length },
        { label: "13–16",    count: values.filter((v) => v >= 13 && v <= 16).length },
        { label: "17–20",    count: values.filter((v) => v >= 17 && v <= 20).length },
        { label: "21+",      count: values.filter((v) => v >= 21).length },
      ]
    : [
        { label: "Verfehlt", count: missedCount,                                      color: "#f87171" },
        { label: "1–19",     count: values.filter((v) => v >= 1 && v < 20).length },
        { label: "20–49",    count: values.filter((v) => v >= 20 && v < 50).length },
        { label: "50–99",    count: values.filter((v) => v >= 50 && v < 100).length },
        { label: "100+",     count: values.filter((v) => v >= 100).length },
      ];

  const missTypeCounts: { label: string; count: number }[] = MISS_TYPES.map((m) => ({
    label: m.label,
    count: breaks.filter((b) => b.missType === m.id).length,
  })).filter((x) => x.count > 0);

  const ballCounts: { label: string; count: number }[] = BALL_COLORS.map((bc) => ({
    label: bc.label,
    count: breaks.filter((b) => b.ball === bc.id).length,
  })).filter((x) => x.count > 0);

  const pocketCounts: { label: string; count: number }[] = POCKETS.map((p) => ({
    label: p.label,
    count: breaks.filter((b) => b.pocket === p.id).length,
  })).filter((x) => x.count > 0);

  const hasMissDetails = missTypeCounts.length > 0 || ballCounts.length > 0 || pocketCounts.length > 0;

  return (
    <div className="stats-overlay" onClick={onClose}>
      <div className="stats-popup" onClick={onClose}>
        <div className="stats-popup-title">{routineName}</div>
        {!seriesMode && <div className="stats-popup-sub">{redsCount} Rote</div>}

        <div className="stats-main-grid">
          <div className="stats-cell">
            <div className="stats-cell-num">{total}</div>
            <div className="stats-cell-label">Versuche</div>
          </div>
          <div className="stats-cell">
            <div className="stats-cell-num" style={{ color: "#4ade80" }}>{highest || "—"}</div>
            <div className="stats-cell-label">Höchste</div>
          </div>
          <div className="stats-cell">
            <div className="stats-cell-num">{breakCount > 0 ? avg.toFixed(1) : "—"}</div>
            <div className="stats-cell-label">Schnitt</div>
          </div>
          <div className="stats-cell">
            <div className="stats-cell-num">{breakCount > 0 ? lowest : "—"}</div>
            <div className="stats-cell-label">Niedrigste</div>
          </div>
          {!seriesMode && (
            <div className="stats-cell">
              <div className="stats-cell-num" style={{ color: clearedCount > 0 ? "#ffee44" : undefined }}>{clearedCount}</div>
              <div className="stats-cell-label">Clearance</div>
            </div>
          )}
        </div>

        {total > 0 && (
          <div className="stats-section">
            <div className="stats-section-title">
              {seriesMode ? "Serien-Verteilung" : "Break-Verteilung"}
            </div>
            <div className="stats-dist">
              {distBuckets.map((d) => {
                const pct = distDenominator > 0 ? Math.round((d.count / distDenominator) * 100) : 0;
                return (
                  <div className="stats-dist-row" key={d.label}>
                    <span className="stats-dist-label" style={{ color: d.color }}>{d.label}</span>
                    <div className="stats-dist-bar-wrap">
                      <div
                        className="stats-dist-bar"
                        style={{
                          width: `${pct}%`,
                          background: d.color ?? "#3366aa",
                        }}
                      />
                    </div>
                    <span className="stats-dist-count">
                      {d.count}
                      {d.count > 0 && (
                        <span className="stats-dist-pct"> ({pct}%)</span>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {hasMissDetails && (
          <div className="stats-section">
            <div className="stats-section-title">Fehler-Details</div>
            <div className="stats-detail-grid">
              {missTypeCounts.length > 0 && (
                <div className="stats-detail-group">
                  <div className="stats-detail-group-label">Fehlerart</div>
                  {missTypeCounts.map((x) => (
                    <div className="stats-detail-row" key={x.label}>
                      <span>{x.label}</span><span>{x.count}</span>
                    </div>
                  ))}
                </div>
              )}
              {ballCounts.length > 0 && (
                <div className="stats-detail-group">
                  <div className="stats-detail-group-label">Kugel</div>
                  {ballCounts.map((x) => (
                    <div className="stats-detail-row" key={x.label}>
                      <span>{x.label}</span><span>{x.count}</span>
                    </div>
                  ))}
                </div>
              )}
              {pocketCounts.length > 0 && (
                <div className="stats-detail-group">
                  <div className="stats-detail-group-label">Loch</div>
                  {pocketCounts.map((x) => (
                    <div className="stats-detail-row" key={x.label}>
                      <span>{x.label}</span><span>{x.count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString("de-CH", { hour: "2-digit", minute: "2-digit" });
}

interface PendingRowProps {
  attempt: PendingAttempt;
  index: number;
  isClearanceCandidate: boolean;
  seriesMode: boolean;
  onClearance: () => void;
}

function PendingRow({ attempt, index, isClearanceCandidate, seriesMode, onClearance }: PendingRowProps) {
  if (attempt.kind === "missed") {
    return (
      <div className="multi-entry-row-content">
        <span className="me-row-num">{index})</span>
        <span className="me-row-icon" style={{ color: "#f87171" }}>✕</span>
        <span className="me-row-label" style={{ color: "#f87171" }}>
          Verfehlt
        </span>
        <span className="me-row-value">—</span>
      </div>
    );
  }
  const tags: string[] = [];
  if (attempt.missType) {
    const m = MISS_TYPES.find((x) => x.id === attempt.missType);
    if (m) tags.push(m.label);
  }
  if (attempt.foulType) {
    const f = FOUL_TYPES.find((x) => x.id === attempt.foulType);
    if (f) tags.push(f.label);
  }
  if (attempt.ball) {
    const b = BALL_COLORS.find((x) => x.id === attempt.ball);
    if (b) tags.push(b.label);
  }
  if (attempt.pocket) {
    const p = POCKETS.find((x) => x.id === attempt.pocket);
    if (p) tags.push(p.fullLabel);
  }
  return (
    <div className="multi-entry-row-content">
      <span className="me-row-num">{index})</span>
      <span className="me-row-icon" style={{ color: "#4ade80" }}>●</span>
      <span className="me-row-label" style={{ color: "#4ade80" }}>{seriesMode ? "Serie" : "Break"}</span>
      <span className="me-row-value">{attempt.value}</span>
      {tags.length > 0 && (
        <span className="me-row-tags">({tags.join(", ")})</span>
      )}
      {attempt.clearance ? (
        <span className="me-row-clearance-tag">★ Clearance</span>
      ) : isClearanceCandidate ? (
        <button
          className="me-clearance-btn"
          onClick={onClearance}
          type="button"
        >
          Clearance ?
        </button>
      ) : null}
    </div>
  );
}
