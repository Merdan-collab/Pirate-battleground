interface MainMenuProps {
  onSolo: () => void;
  onOnline: () => void;
}

export function MainMenu({ onSolo, onOnline }: MainMenuProps) {
  return (
    <div className="lobby">
      <h1 className="lobby__title">🏴‍☠️ Grand Line Battleground</h1>
      <p className="lobby__subtitle">
        A One Piece auto-battler — build your crew, fight rival fleets, and be the last captain
        standing.
      </p>

      <div className="menu-choices">
        <button className="menu-choice" onClick={onSolo}>
          <span className="menu-choice__icon">🤖</span>
          <span className="menu-choice__title">Single Player</span>
          <span className="menu-choice__desc">
            Play a 2, 4, or 8 player lobby against AI opponents. No setup needed.
          </span>
        </button>
        <button className="menu-choice" onClick={onOnline}>
          <span className="menu-choice__icon">🌐</span>
          <span className="menu-choice__title">Play with Friends</span>
          <span className="menu-choice__desc">
            Create a room, share the code, and battle your friends. Empty seats are filled by
            AI.
          </span>
        </button>
      </div>
    </div>
  );
}
