import { useCallback, useEffect, useState } from 'react';
import { BUY_COST, REROLL_COST, SELL_REFUND } from '../engine/shop';
import { MinionCard } from './MinionCard';
import { useDragDrop, type DragSource, type DropTarget } from './useDragDrop';
import type { ScreenOpponent, ScreenState } from './viewModel';

interface GameScreenProps {
  screen: ScreenState;
  targeting: boolean;
  /** Buy from the tavern; toIndex places it directly at that board slot. */
  onBuy: (shopIndex: number, toIndex?: number) => void;
  onSell: (instanceId: string) => void;
  onReroll: () => void;
  onFreeze: () => void;
  onUpgrade: () => void;
  onHeroPowerClick: () => void;
  onBoardMinionClick: (instanceId: string) => void;
  onMoveMinion: (instanceId: string, toIndex: number) => void;
  onEndTurn: () => void;
}

const MAX_BOARD = 7;

function HealthOrb({ health }: { health: number }) {
  return <span className="orb orb--health">{health}</span>;
}

function OpponentRow({ player, online }: { player: ScreenOpponent; online: boolean }) {
  return (
    <li className={`rival ${player.alive ? '' : 'rival--out'}`}>
      <span className="rival__portrait">{player.hero.portrait}</span>
      <span className="rival__body">
        <span className="rival__name">{player.name}</span>
        <span className="rival__meta">
          Tier {player.tavernTier}
          {online && !player.connected && ' · offline'}
          {online && player.alive && player.connected && player.ready && ' · ready'}
        </span>
      </span>
      {player.alive ? (
        <HealthOrb health={player.health} />
      ) : (
        <span className="rival__place">#{player.placement}</span>
      )}
    </li>
  );
}

function TurnTimer({ endsAt }: { endsAt: number }) {
  const [remaining, setRemaining] = useState(() => Math.max(0, endsAt - Date.now()));
  useEffect(() => {
    setRemaining(Math.max(0, endsAt - Date.now()));
    const id = setInterval(() => setRemaining(Math.max(0, endsAt - Date.now())), 200);
    return () => clearInterval(id);
  }, [endsAt]);
  const seconds = Math.ceil(remaining / 1000);
  return <span className={`timer ${seconds <= 10 ? 'timer--urgent' : ''}`}>{seconds}s</span>;
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
  const boardFull = self.board.length >= MAX_BOARD;
  const canAfford = self.gold >= BUY_COST;
  const powerUsable =
    power.usesPerTurn > 0 &&
    self.heroPowerUsedThisTurn < power.usesPerTurn &&
    self.gold >= power.cost;

  const handleDrop = useCallback(
    (source: DragSource, target: DropTarget) => {
      if (source.kind === 'shop') {
        if (target.kind === 'board' && canAfford && !boardFull) {
          onBuy(source.shopIndex, target.index);
        }
        return;
      }
      if (target.kind === 'sell') {
        onSell(source.instanceId);
      } else if (target.kind === 'board') {
        // Dropping to the right of its own slot shifts the index by one once
        // the minion is lifted out of the list.
        const to = target.index > source.fromIndex ? target.index - 1 : target.index;
        if (to !== source.fromIndex) onMoveMinion(source.instanceId, to);
      }
    },
    [onBuy, onSell, onMoveMinion, canAfford, boardFull],
  );

  const handleClick = useCallback(
    (source: DragSource) => {
      if (source.kind === 'shop') {
        if (canAfford && !boardFull) onBuy(source.shopIndex);
        return;
      }
      if (targeting) onBoardMinionClick(source.instanceId);
    },
    [onBuy, onBoardMinionClick, targeting, canAfford, boardFull],
  );

  const { drag, hover, beginDrag } = useDragDrop({
    onDrop: handleDrop,
    onClick: handleClick,
    disabled: locked,
  });

  const dragSource = drag?.source ?? null;
  const draggingBoardMinion = dragSource?.kind === 'board';
  const draggingShopMinion = dragSource?.kind === 'shop';
  const dragView = !dragSource
    ? null
    : dragSource.kind === 'shop'
      ? self.shop[dragSource.shopIndex]
      : (self.board.find((b) => b.key === dragSource.instanceId) ?? null);

  // Drop slots sit between minions, so there is one more slot than minions.
  const boardSlots = self.board.length + 1;

  return (
    <div className="table">
      <aside className="rivals">
        <div className="rivals__head">
          <span className="rivals__turn">Turn {screen.turn}</span>
          {screen.turnEndsAt !== null && <TurnTimer endsAt={screen.turnEndsAt} />}
        </div>
        <ul className="rivals__list">
          {opponents
            .slice()
            .sort((a, b) => Number(b.alive) - Number(a.alive) || b.health - a.health)
            .map((p) => (
              <OpponentRow key={p.id} player={p} online={online} />
            ))}
        </ul>
      </aside>

      <main className="arena">
        {/* ---------- Tavern ---------- */}
        <section className="tavern">
          <header className="tavern__bar">
            <div className="tier-badge" title={`Tavern Tier ${self.tavernTier}`}>
              <span className="tier-badge__num">{self.tavernTier}</span>
              <span className="tier-badge__label">Tavern</span>
            </div>

            {self.upgradeCost !== null ? (
              <button
                className="tavern-btn tavern-btn--upgrade"
                onClick={onUpgrade}
                disabled={locked || self.gold < self.upgradeCost}
              >
                <span className="tavern-btn__label">Upgrade</span>
                <span className="coin">{self.upgradeCost}</span>
              </button>
            ) : (
              <span className="tavern-btn tavern-btn--maxed">Max Tier</span>
            )}

            <button
              className="tavern-btn"
              onClick={onReroll}
              disabled={locked || self.gold < REROLL_COST}
            >
              <span className="tavern-btn__label">Refresh</span>
              <span className="coin">{REROLL_COST}</span>
            </button>

            <button
              className={`tavern-btn ${self.frozen ? 'tavern-btn--on' : ''}`}
              onClick={onFreeze}
              disabled={locked}
              title="Keep these minions for next turn"
            >
              <span className="tavern-btn__label">{self.frozen ? 'Frozen' : 'Freeze'}</span>
            </button>

            <button
              className={`tavern-btn tavern-btn--hero ${targeting ? 'tavern-btn--on' : ''}`}
              onClick={onHeroPowerClick}
              disabled={locked || power.usesPerTurn === 0 || !powerUsable}
              title={power.description}
            >
              <span className="tavern-btn__hero-icon">{self.hero.portrait}</span>
              <span className="tavern-btn__label">{power.name}</span>
              {power.usesPerTurn > 0 && <span className="coin">{power.cost}</span>}
            </button>
          </header>

          <div className={`shelf ${draggingBoardMinion ? 'shelf--selling' : ''}`} data-drop="sell">
            {draggingBoardMinion && (
              <div className={`sell-overlay ${hover.kind === 'sell' ? 'sell-overlay--armed' : ''}`}>
                <span className="sell-overlay__icon">🪙</span>
                <span>Drop to sell for {SELL_REFUND} gold</span>
              </div>
            )}

            {self.shop.map((view, idx) =>
              view ? (
                <MinionCard
                  key={`${view.key}_${idx}`}
                  view={view}
                  onPointerDown={beginDrag({ kind: 'shop', shopIndex: idx })}
                  disabled={locked || !canAfford || boardFull}
                  dimmed={draggingShopMinion && dragSource.shopIndex === idx}
                />
              ) : (
                <div className="slot slot--empty" key={`gap_${idx}`} />
              ),
            )}
          </div>

          <p className="tavern__hint">
            {boardFull
              ? 'Your crew is full — sell someone to make room.'
              : canAfford
                ? `Drag a minion down to your crew to recruit for ${BUY_COST} gold.`
                : `You need ${BUY_COST} gold to recruit.`}
          </p>
        </section>

        {/* ---------- Your board ---------- */}
        <section className="field">
          <div className="field__label">
            <span>Your Crew</span>
            <span className="field__count">
              {self.board.length}/{MAX_BOARD}
            </span>
            {targeting && <span className="field__cue">Choose a target</span>}
          </div>

          {/* The felt itself is the catch-all drop target (append to the end);
              each lane overrides it with its own insertion point. */}
          <div className="felt" data-drop="board" data-index={self.board.length}>
            {self.board.length === 0 && !drag && (
              <p className="felt__empty">Drag minions here from the tavern above</p>
            )}

            {Array.from({ length: boardSlots }).map((_, slotIndex) => {
              const minion = self.board[slotIndex];
              const isHovered = hover.kind === 'board' && hover.index === slotIndex;
              return (
                <div
                  className="lane"
                  key={minion ? minion.key : `end_${slotIndex}`}
                  data-drop="board"
                  data-index={slotIndex}
                >
                  <div
                    className={`dropzone ${isHovered && drag ? 'dropzone--armed' : ''} ${drag ? 'dropzone--live' : ''}`}
                  />
                  {minion && (
                    <MinionCard
                      view={minion}
                      onPointerDown={beginDrag({
                        kind: 'board',
                        instanceId: minion.key,
                        fromIndex: slotIndex,
                      })}
                      targetable={targeting}
                      disabled={locked}
                      dimmed={draggingBoardMinion && dragSource.instanceId === minion.key}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* ---------- Hero plate + fight ---------- */}
        <footer className="dock">
          <div className="dock__hero">
            <span className="dock__portrait">{self.hero.portrait}</span>
            <span className="dock__hero-text">
              <span className="dock__hero-name">{self.hero.name}</span>
              <span className="dock__hero-title">{self.hero.title}</span>
            </span>
            <HealthOrb health={self.health} />
          </div>

          <div className="purse" title={`${self.gold} of ${self.maxGold} gold`}>
            {Array.from({ length: self.maxGold }).map((_, i) => (
              <span key={i} className={`purse__pip ${i < self.gold ? 'purse__pip--full' : ''}`} />
            ))}
            <span className="purse__count">
              {self.gold}
              <span className="purse__max">/{self.maxGold}</span>
            </span>
          </div>

          <button className="fight" onClick={onEndTurn} disabled={locked}>
            {locked ? 'Waiting for other captains…' : 'Fight!'}
          </button>
        </footer>
      </main>

      {/* Token that follows the cursor while dragging */}
      {drag && dragView && (
        <div className="drag-layer" style={{ left: drag.x, top: drag.y }}>
          <MinionCard view={dragView} ghost />
        </div>
      )}
    </div>
  );
}
