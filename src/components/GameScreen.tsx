import { heroPowerNeedsTarget } from '../engine/heroPowers';
import { MAX_TAVERN_TIER, REROLL_COST, tavernUpgradeCostFor } from '../engine/shop';
import type { GameState, PlayerState } from '../engine/types';
import { cardDefToView, minionToView, MinionCard } from './MinionCard';

interface GameScreenProps {
  game: GameState;
  targeting: boolean;
  onBuy: (shopIndex: number) => void;
  onSell: (boardIndex: number) => void;
  onReroll: () => void;
  onFreeze: () => void;
  onUpgrade: () => void;
  onHeroPowerClick: () => void;
  onBoardMinionClick: (instanceId: string) => void;
  onEndTurn: () => void;
}

function HealthBar({ player }: { player: PlayerState }) {
  const pct = Math.max(0, Math.round((player.health / player.maxHealth) * 100));
  return (
    <div className="health-bar">
      <div className="health-bar__fill" style={{ width: `${pct}%` }} />
      <span className="health-bar__text">❤ {player.health}</span>
    </div>
  );
}

function OpponentRow({ player }: { player: PlayerState }) {
  return (
    <div className={`opponent-row ${player.alive ? '' : 'opponent-row--dead'}`}>
      <span className="opponent-row__portrait">{player.hero.portrait}</span>
      <div className="opponent-row__info">
        <div className="opponent-row__name">{player.name}</div>
        <HealthBar player={player} />
      </div>
      <div className="opponent-row__tier">T{player.tavernTier}</div>
      {!player.alive && <div className="opponent-row__placement">#{player.placement}</div>}
    </div>
  );
}

export function GameScreen({
  game,
  targeting,
  onBuy,
  onSell,
  onReroll,
  onFreeze,
  onUpgrade,
  onHeroPowerClick,
  onBoardMinionClick,
  onEndTurn,
}: GameScreenProps) {
  const human = game.players.find((p) => p.id === 'human')!;
  const others = game.players.filter((p) => p.id !== 'human');
  const upgradeCost = tavernUpgradeCostFor(human, game.turn);
  const power = human.hero.power;
  const powerUsable =
    power.usesPerTurn > 0 &&
    human.heroPowerUsedThisTurn < power.usesPerTurn &&
    human.gold >= power.cost;

  return (
    <div className="game-screen">
      <aside className="sidebar">
        <div className="sidebar__turn">Turn {game.turn}</div>
        <h3>Opponents</h3>
        {others
          .slice()
          .sort((a, b) => Number(b.alive) - Number(a.alive) || b.health - a.health)
          .map((p) => (
            <OpponentRow key={p.id} player={p} />
          ))}
      </aside>

      <main className="main-panel">
        <div className="player-header">
          <div className="player-header__portrait">{human.hero.portrait}</div>
          <div className="player-header__info">
            <div className="player-header__name">
              {human.hero.name} <span className="player-header__title">{human.hero.title}</span>
            </div>
            <HealthBar player={human} />
          </div>
          <div className="player-header__gold">💰 {human.gold} / {human.maxGold}</div>
          <div className="player-header__tavern">
            🍺 Tavern Tier {human.tavernTier}
            {human.tavernTier < MAX_TAVERN_TIER && (
              <button className="btn btn--upgrade" onClick={onUpgrade} disabled={human.gold < upgradeCost}>
                Upgrade ({upgradeCost}g)
              </button>
            )}
          </div>
        </div>

        <section className="shop-panel">
          <div className="shop-panel__toolbar">
            <h3>Tavern</h3>
            <button className="btn" onClick={onReroll} disabled={human.gold < REROLL_COST}>
              🔄 Refresh ({REROLL_COST}g)
            </button>
            <button
              className={`btn ${human.frozen ? 'btn--active' : ''}`}
              onClick={onFreeze}
            >
              {human.frozen ? '🧊 Frozen' : '❄️ Freeze'}
            </button>
            <button
              className={`btn ${power.usesPerTurn === 0 ? 'btn--passive' : ''} ${targeting ? 'btn--active' : ''}`}
              onClick={onHeroPowerClick}
              disabled={power.usesPerTurn === 0 || !powerUsable}
              title={power.description}
            >
              {power.usesPerTurn === 0 ? `Passive: ${power.name}` : `${power.name} (${power.cost}g)`}
            </button>
          </div>
          <div className="shop-row">
            {human.shop.map((card, idx) =>
              card ? (
                <MinionCard
                  key={`${card.id}_${idx}`}
                  view={cardDefToView(card)}
                  onClick={() => onBuy(idx)}
                  disabled={human.gold < 3 || human.board.length >= 7}
                />
              ) : (
                <div className="shop-slot-empty" key={`empty_${idx}`} />
              ),
            )}
          </div>
        </section>

        <section className="board-panel">
          <h3>
            Your Crew ({human.board.length}/7)
            {targeting && <span className="board-panel__hint"> — choose a target</span>}
          </h3>
          <div className="board-row">
            {human.board.map((m, idx) => (
              <MinionCard
                key={m.instanceId}
                view={minionToView(m)}
                onClick={() =>
                  targeting && heroPowerNeedsTarget(human.hero.id)
                    ? onBoardMinionClick(m.instanceId)
                    : undefined
                }
                targetable={targeting}
                cornerAction={targeting ? undefined : { label: '✕', onClick: () => onSell(idx) }}
              />
            ))}
            {Array.from({ length: 7 - human.board.length }).map((_, i) => (
              <div className="board-slot-empty" key={`bempty_${i}`} />
            ))}
          </div>
        </section>

        <button className="btn btn--end-turn" onClick={onEndTurn}>
          ⚔️ Fight!
        </button>
      </main>
    </div>
  );
}
