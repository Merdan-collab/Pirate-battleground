import { useEffect, useState } from 'react';
import { heroPowerNeedsTarget } from '../engine/heroPowers';
import { REROLL_COST } from '../engine/shop';
import { MinionCard } from './MinionCard';
import type { ScreenOpponent, ScreenState } from './viewModel';

interface GameScreenProps {
  screen: ScreenState;
  targeting: boolean;
  onBuy: (shopIndex: number) => void;
  onSell: (instanceId: string) => void;
  onReroll: () => void;
  onFreeze: () => void;
  onUpgrade: () => void;
  onHeroPowerClick: () => void;
  onBoardMinionClick: (instanceId: string) => void;
  onMoveMinion: (instanceId: string, toIndex: number) => void;
  onEndTurn: () => void;
}

function HealthBar({ health, maxHealth }: { health: number; maxHealth: number }) {
  const pct = Math.max(0, Math.round((health / maxHealth) * 100));
  return (
    <div className="health-bar">
      <div className="health-bar__fill" style={{ width: `${pct}%` }} />
      <span className="health-bar__text">❤ {health}</span>
    </div>
  );
}

function OpponentRow({ player, online }: { player: ScreenOpponent; online: boolean }) {
  return (
    <div className={`opponent-row ${player.alive ? '' : 'opponent-row--dead'}`}>
      <span className="opponent-row__portrait">{player.hero.portrait}</span>
      <div className="opponent-row__info">
        <div className="opponent-row__name">
          {player.name}
          {online && !player.connected && <span title="Disconnected"> 🔌</span>}
          {online && player.alive && player.ready && <span title="Locked in"> ✔</span>}
        </div>
        <HealthBar health={player.health} maxHealth={player.maxHealth} />
      </div>
      <div className="opponent-row__tier">T{player.tavernTier}</div>
      {!player.alive && <div className="opponent-row__placement">#{player.placement}</div>}
    </div>
  );
}

function TurnTimer({ endsAt }: { endsAt: number }) {
  const [remaining, setRemaining] = useState(() => Math.max(0, endsAt - Date.now()));

  useEffect(() => {
    setRemaining(Math.max(0, endsAt - Date.now()));
    const id = setInterval(() => setRemaining(Math.max(0, endsAt - Date.now())), 250);
    return () => clearInterval(id);
  }, [endsAt]);

  const seconds = Math.ceil(remaining / 1000);
  return (
    <div className={`turn-timer ${seconds <= 10 ? 'turn-timer--urgent' : ''}`}>⏱ {seconds}s</div>
  );
}

export function GameScreen({
  screen,
  targeting,
  onBuy,
  onSell,
  onReroll,
  onFreeze,
  onUpgrade,
  onHeroPowerClick,
  onBoardMinionClick,
  onMoveMinion,
  onEndTurn,
}: GameScreenProps) {
  const { self, opponents, online } = screen;
  const power = self.hero.power;
  const locked = online && self.ready;
  const powerUsable =
    power.usesPerTurn > 0 && self.heroPowerUsedThisTurn < power.usesPerTurn && self.gold >= power.cost;

  return (
    <div className="game-screen">
      <aside className="sidebar">
        <div className="sidebar__turn">
          Turn {screen.turn}
          {screen.turnEndsAt !== null && <TurnTimer endsAt={screen.turnEndsAt} />}
        </div>
        <h3>Opponents</h3>
        {opponents
          .slice()
          .sort((a, b) => Number(b.alive) - Number(a.alive) || b.health - a.health)
          .map((p) => (
            <OpponentRow key={p.id} player={p} online={online} />
          ))}
      </aside>

      <main className="main-panel">
        <div className="player-header">
          <div className="player-header__portrait">{self.hero.portrait}</div>
          <div className="player-header__info">
            <div className="player-header__name">
              {self.hero.name} <span className="player-header__title">{self.hero.title}</span>
            </div>
            <HealthBar health={self.health} maxHealth={self.maxHealth} />
          </div>
          <div className="player-header__gold">
            💰 {self.gold} / {self.maxGold}
          </div>
          <div className="player-header__tavern">
            🍺 Tavern Tier {self.tavernTier}
            {self.upgradeCost !== null && (
              <button
                className="btn btn--upgrade"
                onClick={onUpgrade}
                disabled={locked || self.gold < self.upgradeCost}
              >
                Upgrade ({self.upgradeCost}g)
              </button>
            )}
          </div>
        </div>

        <section className="shop-panel">
          <div className="shop-panel__toolbar">
            <h3>Tavern</h3>
            <button className="btn" onClick={onReroll} disabled={locked || self.gold < REROLL_COST}>
              🔄 Refresh ({REROLL_COST}g)
            </button>
            <button
              className={`btn ${self.frozen ? 'btn--active' : ''}`}
              onClick={onFreeze}
              disabled={locked}
            >
              {self.frozen ? '🧊 Frozen' : '❄️ Freeze'}
            </button>
            <button
              className={`btn ${power.usesPerTurn === 0 ? 'btn--passive' : ''} ${targeting ? 'btn--active' : ''}`}
              onClick={onHeroPowerClick}
              disabled={locked || power.usesPerTurn === 0 || !powerUsable}
              title={power.description}
            >
              {power.usesPerTurn === 0 ? `Passive: ${power.name}` : `${power.name} (${power.cost}g)`}
            </button>
          </div>
          <div className="shop-row">
            {self.shop.map((view, idx) =>
              view ? (
                <MinionCard
                  key={`${view.key}_${idx}`}
                  view={view}
                  onClick={() => onBuy(idx)}
                  disabled={locked || self.gold < 3 || self.board.length >= 7}
                />
              ) : (
                <div className="shop-slot-empty" key={`empty_${idx}`} />
              ),
            )}
          </div>
        </section>

        <section className="board-panel">
          <h3>
            Your Crew ({self.board.length}/7)
            {targeting && <span className="board-panel__hint"> — choose a target</span>}
            {!targeting && self.board.length > 1 && (
              <span className="board-panel__hint"> — use ◀ ▶ to reposition</span>
            )}
          </h3>
          <div className="board-row">
            {self.board.map((view, idx) => (
              <div className="board-slot" key={view.key}>
                <MinionCard
                  view={view}
                  onClick={() =>
                    targeting && heroPowerNeedsTarget(self.hero.id)
                      ? onBoardMinionClick(view.key)
                      : undefined
                  }
                  targetable={targeting}
                  disabled={locked}
                  cornerAction={
                    targeting || locked
                      ? undefined
                      : { label: '✕', onClick: () => onSell(view.key) }
                  }
                />
                {!targeting && !locked && (
                  <div className="board-slot__move">
                    <button
                      className="board-slot__move-btn"
                      disabled={idx === 0}
                      onClick={() => onMoveMinion(view.key, idx - 1)}
                      aria-label="Move left"
                    >
                      ◀
                    </button>
                    <button
                      className="board-slot__move-btn"
                      disabled={idx === self.board.length - 1}
                      onClick={() => onMoveMinion(view.key, idx + 1)}
                      aria-label="Move right"
                    >
                      ▶
                    </button>
                  </div>
                )}
              </div>
            ))}
            {Array.from({ length: 7 - self.board.length }).map((_, i) => (
              <div className="board-slot-empty" key={`bempty_${i}`} />
            ))}
          </div>
        </section>

        <button className="btn btn--end-turn" onClick={onEndTurn} disabled={locked}>
          {locked ? '⏳ Waiting for other players…' : '⚔️ Fight!'}
        </button>
      </main>
    </div>
  );
}
