import { useState } from "react";
import {
  BALL_COLORS,
  MISS_TYPES,
  POCKETS,
  maxClearanceValue,
  routineById,
  type BallColor,
  type BreakAttempt,
  type MissType,
  type Pocket,
  type SoloRoutineId,
} from "../lib/solo";
import { BreakEntryDialog } from "./BreakEntryDialog";

interface Props {
  playerName: string;
  routineId: SoloRoutineId;
  redsCount: number;
  onCommit: (attempts: BreakAttempt[]) => void;
  onClose: () => void;
}

type PendingAttempt = BreakAttempt;

export function MultiEntryDialog({
  playerName,
  routineId,
  redsCount,
  onCommit,
  onClose,
}: Props) {
  const [pending, setPending] = useState<PendingAttempt[]>([]);
  const [showBreakEntry, setShowBreakEntry] = useState(false);
  const routine = routineById(routineId);

  const addCleared = () => {
    setPending((p) => [
      ...p,
      {
        kind: "cleared",
        value: maxClearanceValue(redsCount),
        timestamp: Date.now(),
      },
    ]);
  };

  const addMissed = () => {
    setPending((p) => [...p, { kind: "missed", timestamp: Date.now() }]);
  };

  const addBreak = (
    value: number,
    details?: { missType?: MissType; ball?: BallColor; pocket?: Pocket }
  ) => {
    setPending((p) => [
      ...p,
      {
        kind: "break",
        value,
        missType: details?.missType,
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
        onSubmit={addBreak}
        onClose={() => setShowBreakEntry(false)}
      />
    );
  }

  return (
    <div className="setup-overlay">
      <div className="multi-entry">
        <div className="multi-entry-header">
          <div className="multi-entry-title">Mehrere eintragen</div>
          <div className="multi-entry-meta">
            {routine.name}
            {" — "}
            <span style={{ color: "#bbb" }}>{redsCount} Rote</span>
            {" — "}
            <span style={{ color: "#fff" }}>{playerName}</span>
          </div>
        </div>

        <div className="multi-entry-list-section">
          <div className="multi-entry-list-label">
            Geplant ({pending.length}):
          </div>
          <div className="multi-entry-list">
            {pending.length === 0 ? (
              <div className="multi-entry-empty">
                Noch keine Versuche hinzugefügt.
              </div>
            ) : (
              pending.map((a, i) => (
                <div className="multi-entry-row" key={i}>
                  <PendingRow attempt={a} />
                  <button
                    className="multi-entry-remove"
                    onClick={() => removeAt(i)}
                    type="button"
                    aria-label="Entfernen"
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="multi-entry-add-section">
          <div className="multi-entry-add-label">Hinzufügen:</div>
          <div className="multi-entry-add-buttons">
            <button className="me-add me-add-cleared" onClick={addCleared}>
              <div className="me-add-icon">✓</div>
              <div className="me-add-label">Aufgeräumt</div>
            </button>
            <button
              className="me-add me-add-break"
              onClick={() => setShowBreakEntry(true)}
            >
              <div className="me-add-icon">▦</div>
              <div className="me-add-label">Break</div>
            </button>
            <button className="me-add me-add-missed" onClick={addMissed}>
              <div className="me-add-icon">✕</div>
              <div className="me-add-label">Verfehlt</div>
            </button>
          </div>
        </div>

        <div className="multi-entry-actions">
          <button className="multi-entry-cancel" onClick={onClose}>
            Abbrechen
          </button>
          <button
            className={`multi-entry-save ${pending.length === 0 ? "disabled" : ""}`}
            onClick={commit}
            disabled={pending.length === 0}
          >
            Speichern ({pending.length})
          </button>
        </div>
      </div>
    </div>
  );
}

function PendingRow({ attempt }: { attempt: PendingAttempt }) {
  if (attempt.kind === "cleared") {
    return (
      <div className="multi-entry-row-content">
        <span className="me-row-icon" style={{ color: "#fbbf24" }}>✓</span>
        <span className="me-row-label" style={{ color: "#fbbf24" }}>
          Aufgeräumt
        </span>
        <span className="me-row-value">{attempt.value}</span>
      </div>
    );
  }
  if (attempt.kind === "missed") {
    return (
      <div className="multi-entry-row-content">
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
  if (attempt.ball) {
    const b = BALL_COLORS.find((x) => x.id === attempt.ball);
    if (b) tags.push(b.label);
  }
  if (attempt.pocket) {
    const p = POCKETS.find((x) => x.id === attempt.pocket);
    if (p) tags.push(p.label);
  }
  return (
    <div className="multi-entry-row-content">
      <span className="me-row-icon" style={{ color: "#4ade80" }}>●</span>
      <span className="me-row-label" style={{ color: "#4ade80" }}>Break</span>
      <span className="me-row-value">{attempt.value}</span>
      {tags.length > 0 && (
        <span className="me-row-tags">({tags.join(", ")})</span>
      )}
    </div>
  );
}
