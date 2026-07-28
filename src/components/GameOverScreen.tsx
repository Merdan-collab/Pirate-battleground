import { HEROES } from '../data/heroes';

export interface StandingRow {
  id: string;
  name: string;
  heroId: string;
  placement: number | null;
  isYou: boolean;
}

interface GameOverScreenProps {
  standings: StandingRow[];
  yourPlacement: number | null;
  lobbySize: number;
  onRestart: () => void;
  restartLabel?: string;
}

export function GameOverScreen({
  standings,
  yourPlacement,
  lobbySize,
  onRestart,
  restartLabel = 'Play Again ⚓',
}: GameOverScreenProps) {
  const won = yourPlacement === 1;

  return (
    <div className="lobby">
      <h1 className="lobby__title">
        {won ? '👑 You are the King of the Pirates!' : 'Game Over'}
      </h1>
      <p className="lobby__subtitle">
        You finished {yourPlacement ?? '—'} of {lobbySize}.
      </p>

      <section className="lobby__section">
        <h2>Final Standings</h2>
        <ol className="standings-list">
          {standings.map((row) => {
            const hero = HEROES.find((h) => h.id === row.heroId);
            return (
              <li key={row.id} className={row.isYou ? 'standings-list__me' : ''}>
                <span className="standings-list__place">#{row.placement}</span>
                <span className="standings-list__portrait">{hero?.portrait ?? '🏴‍☠️'}</span>
                <span className="standings-list__name">{row.name}</span>
                <span className="standings-list__hero">({hero?.name ?? row.heroId})</span>
              </li>
            );
          })}
        </ol>
      </section>

      <button className="lobby__start-btn" onClick={onRestart}>
        {restartLabel}
      </button>
    </div>
  );
}
