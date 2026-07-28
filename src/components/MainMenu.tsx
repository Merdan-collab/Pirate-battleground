interface MainMenuProps {
  onSolo: () => void;
  onOnline: () => void;
}

// Builds made for a static host (no game server reachable) hide online play
// behind an explanation rather than letting it fail on a dead socket.
const OFFLINE_ONLY = import.meta.env.VITE_OFFLINE_ONLY === 'true';

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

        {OFFLINE_ONLY ? (
          <div className="menu-choice menu-choice--disabled">
            <span className="menu-choice__icon">🌐</span>
            <span className="menu-choice__title">Play with Friends</span>
            <span className="menu-choice__desc">
              Not available on this hosted copy — playing against friends needs the game server
              running. Clone the repo and run <code>npm run dev:all</code> to play together.
            </span>
          </div>
        ) : (
          <button className="menu-choice" onClick={onOnline}>
            <span className="menu-choice__icon">🌐</span>
            <span className="menu-choice__title">Play with Friends</span>
            <span className="menu-choice__desc">
              Create a room, share the code, and battle your friends. Empty seats are filled by
              AI.
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
