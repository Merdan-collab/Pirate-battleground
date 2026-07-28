import { HEROES } from '../data/heroes';

interface LobbySetupProps {
  lobbySize: 2 | 4 | 8;
  onChangeLobbySize: (n: 2 | 4 | 8) => void;
  selectedHeroId: string | null;
  onSelectHero: (id: string) => void;
  onStart: () => void;
  onBack: () => void;
}

export function LobbySetup({
  lobbySize,
  onChangeLobbySize,
  selectedHeroId,
  onSelectHero,
  onStart,
  onBack,
}: LobbySetupProps) {
  return (
    <div className="lobby">
      <h1 className="lobby__title">🏴‍☠️ Grand Line Battleground</h1>
      <p className="lobby__subtitle">
        A One Piece auto-battler — build your crew, fight rival fleets, and be the last
        captain standing.
      </p>

      <section className="lobby__section">
        <h2>Number of players</h2>
        <div className="lobby__lobby-size-row">
          {[2, 4, 8].map((n) => (
            <button
              key={n}
              className={`lobby__size-btn ${lobbySize === n ? 'lobby__size-btn--active' : ''}`}
              onClick={() => onChangeLobbySize(n as 2 | 4 | 8)}
            >
              {n} players
            </button>
          ))}
        </div>
        <p className="lobby__hint">You play against {lobbySize - 1} AI opponents.</p>
      </section>

      <section className="lobby__section">
        <h2>Choose your hero</h2>
        <div className="lobby__hero-grid">
          {HEROES.map((h) => (
            <button
              key={h.id}
              className={`hero-card ${selectedHeroId === h.id ? 'hero-card--selected' : ''}`}
              onClick={() => onSelectHero(h.id)}
            >
              <div className="hero-card__portrait">{h.portrait}</div>
              <div className="hero-card__name">{h.name}</div>
              <div className="hero-card__title">{h.title}</div>
              <div className="hero-card__power">
                <strong>{h.power.name}</strong>
                {h.power.usesPerTurn > 0 && (
                  <span className="hero-card__cost"> ({h.power.cost}g)</span>
                )}
                <div className="hero-card__power-desc">{h.power.description}</div>
              </div>
            </button>
          ))}
        </div>
      </section>

      <button className="lobby__start-btn" disabled={!selectedHeroId} onClick={onStart}>
        Set Sail! ⚓
      </button>

      <div className="lobby__back">
        <button className="btn" onClick={onBack}>
          ← Back
        </button>
      </div>
    </div>
  );
}
