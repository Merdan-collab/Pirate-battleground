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
  restartLabel = 'Play again',
}: GameOverScreenProps) {
  const won = yourPlacement === 1;

  return (
    <div className="page">
      <span className="menu__crest" style={{ textAlign: 'center' }}>
        {won ? '👑' : '🏴‍☠️'}
      </span>
      <h1 className="page__title">
        {won ? 'King of the Pirates' : `You placed ${yourPlacement ?? '—'} of ${lobbySize}`}
      </h1>
      {won && <p className="page__lede">Last captain standing out of {lobbySize}.</p>}

      <section className="panel">
        <h2 className="panel__title">Final standings</h2>
        <ol className="standings">
          {standings.map((row) => {
            const hero = HEROES.find((h) => h.id === row.heroId);
            return (
              <li key={row.id} className={row.isYou ? 'standings__me' : ''}>
                <span className="standings__place">#{row.placement}</span>
                <span className="standings__avatar">{hero?.portrait ?? '🏴‍☠️'}</span>
                <span className="standings__name">{row.name}</span>
                <span className="standings__hero">{hero?.name ?? row.heroId}</span>
              </li>
            );
          })}
        </ol>
      </section>

      <div className="page__cta">
        <button className="primary-btn" onClick={onRestart}>
          {restartLabel}
        </button>
      </div>
    </div>
  );
}
