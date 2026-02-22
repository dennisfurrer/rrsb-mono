interface Props {
  onUndo: () => void;
  onFrameEnd: () => void;
  onRerack: () => void;
  onMatchEnd?: () => void;
  onNewGame: () => void;
  onClose: () => void;
}

export function MenuDialog({
  onUndo,
  onFrameEnd,
  onRerack,
  onMatchEnd,
  onNewGame,
  onClose,
}: Props) {
  return (
    <div className="overlay" onClick={onClose}>
      <div className="menu-dialog" onClick={(e) => e.stopPropagation()}>
        <button className="menu-btn-undo" onClick={onUndo}>
          Undo
        </button>
        <button className="menu-btn-frame-end" onClick={onFrameEnd}>
          Frame End
        </button>
        <button className="menu-btn-rerack" onClick={onRerack}>
          Re-rack
        </button>
        {onMatchEnd && (
          <button className="menu-btn-match-end" onClick={onMatchEnd}>
            Match End
          </button>
        )}
        <button className="menu-btn-new-game" onClick={onNewGame}>
          New Game
        </button>
      </div>
    </div>
  );
}
