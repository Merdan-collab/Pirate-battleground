import { HeroPicker } from './HeroPicker';

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
    <div className="page">
      <header className="page__head">
        <button className="ghost-btn" onClick={onBack}>
          ← Back
        </button>
        <h1 className="page__title">Choose Your Captain</h1>
        <span className="page__spacer" />
      </header>

      <section className="panel">
        <h2 className="panel__title">Lobby size</h2>
        <div className="seg">
          {[2, 4, 8].map((n) => (
            <button
              key={n}
              className={`seg__btn ${lobbySize === n ? 'seg__btn--on' : ''}`}
              onClick={() => onChangeLobbySize(n as 2 | 4 | 8)}
            >
              {n} players
            </button>
          ))}
        </div>
        <p className="panel__note">You face {lobbySize - 1} AI captains.</p>
      </section>

      <HeroPicker selectedHeroId={selectedHeroId} onSelect={onSelectHero} />

      <div className="page__cta">
        <button className="primary-btn" disabled={!selectedHeroId} onClick={onStart}>
          {selectedHeroId ? 'Set Sail' : 'Pick a captain first'}
        </button>
      </div>
    </div>
  );
}
