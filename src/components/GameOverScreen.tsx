import type { GameState } from '../engine/types';

interface GameOverScreenProps {
  game: GameState;
  onRestart: () => void;
}

export function GameOverScreen({ game, onRestart }: GameOverScreenProps) {
  const human = game.players.find((p) => p.id === 'human')!;
  const won = human.placement === 1;

  return (
    <div className="lobby">
      <h1 className="lobby__title">
        {won ? '👑 You are the King of the Pirates!' : 'Game Over'}
      </h1>
      <p className="lobby__subtitle">
        You finished {human.placement} of {game.lobbySize}.
      </p>

      <section className="lobby__section">
        <h2>Final Standings</h2>
        <ol className="standings-list">
          {game.standings.map((p) => (
            <li key={p.id} className={p.id === 'human' ? 'standings-list__me' : ''}>
              <span className="standings-list__place">#{p.placement}</span>
              <span className="standings-list__portrait">{p.hero.portrait}</span>
              <span className="standings-list__name">{p.name}</span>
              <span className="standings-list__hero">({p.hero.name})</span>
            </li>
          ))}
        </ol>
      </section>

      <button className="lobby__start-btn" onClick={onRestart}>
        Play Again ⚓
      </button>
    </div>
  );
}
