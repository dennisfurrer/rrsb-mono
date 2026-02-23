interface Props {
  onUndo: () => void;
  onFrameEnd: () => void;
  onRerack: () => void;
  onMatchEnd?: () => void;
  onNewGame: () => void;
  onClose: () => void;
  frameLeader: string;
  matchLeader: string;
}

export function MenuDialog({
  onUndo,
  onFrameEnd,
  onRerack,
  onMatchEnd,
  onNewGame,
  onClose,
  frameLeader,
  matchLeader,
}: Props) {
  return (
    <div className="overlay" onClick={onClose}>
      <div className="menu-fullscreen" onClick={(e) => e.stopPropagation()}>
        <button className="menu-btn-undo" onClick={onUndo}>
          Undo / Letzte Eingabe löschen
        </button>
        <button className="menu-btn-frame-end" onClick={onFrameEnd}>
          Frame-Ende ({frameLeader} gewinnt)
        </button>
        <button className="menu-btn-rerack" onClick={onRerack}>
          Re-rack
        </button>
        {onMatchEnd && (
          <button className="menu-btn-match-end" onClick={onMatchEnd}>
            Match-Ende ({matchLeader} gewinnt)
          </button>
        )}
        <button className="menu-btn-new-game" onClick={onNewGame}>
          New game / Neues Spiel
        </button>
      </div>
    </div>
  );
}
