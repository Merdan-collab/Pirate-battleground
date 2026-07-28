interface MainMenuProps {
  onSolo: () => void;
  onOnline: () => void;
}

// Builds made for a static host (no game server reachable) hide online play
// behind an explanation rather than letting it fail on a dead socket.
const OFFLINE_ONLY = import.meta.env.VITE_OFFLINE_ONLY === 'true';

export function MainMenu({ onSolo, onOnline }: MainMenuProps) {
  return (
    <div className="menu">
      <span className="menu__crest">🏴‍☠️</span>
      <h1 className="menu__title">Grand Line Battleground</h1>
      <p className="menu__lede">
        Recruit a crew in the tavern, set your battle line, and let them fight. Seven factions,
        twelve captains, one survivor.
      </p>

      <div className="menu__choices">
        <button className="choice" onClick={onSolo}>
          <span className="choice__icon">⚔️</span>
          <span className="choice__title">Single Player</span>
          <span className="choice__desc">
            A 2, 4, or 8 captain lobby against AI. Nothing to set up.
          </span>
        </button>

        {OFFLINE_ONLY ? (
          <div className="choice choice--off">
            <span className="choice__icon">🌐</span>
            <span className="choice__title">Play with Friends</span>
            <span className="choice__desc">
              Not available on this hosted copy — it needs the game server running. Clone the repo
              and run <code>npm run dev:all</code> to play together.
            </span>
          </div>
        ) : (
          <button className="choice" onClick={onOnline}>
            <span className="choice__icon">🌐</span>
            <span className="choice__title">Play with Friends</span>
            <span className="choice__desc">
              Share a room code. Any empty seats are filled by AI captains.
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
