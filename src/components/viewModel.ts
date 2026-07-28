import { CARDS_BY_ID } from '../data/cards';
import { HEROES } from '../data/heroes';
import { MAX_TAVERN_TIER, tavernUpgradeCostFor } from '../engine/shop';
import type { GameState, HeroDef } from '../engine/types';
import type { WireGameView } from '../shared/protocol';
import { cardDefToView, minionToView, type CardView } from './MinionCard';

// A single shape the game screen renders, produced either from local engine
// state or from a server view. Keeps the UI identical across both modes.

export interface ScreenOpponent {
  id: string;
  name: string;
  hero: HeroDef;
  health: number;
  maxHealth: number;
  tavernTier: number;
  alive: boolean;
  placement: number | null;
  ready: boolean;
  connected: boolean;
}

export interface ScreenSelf {
  name: string;
  hero: HeroDef;
  health: number;
  maxHealth: number;
  gold: number;
  maxGold: number;
  tavernTier: number;
  upgradeCost: number | null;
  shop: (CardView | null)[];
  board: CardView[];
  frozen: boolean;
  heroPowerUsedThisTurn: number;
  ready: boolean;
}

export interface ScreenState {
  turn: number;
  self: ScreenSelf;
  opponents: ScreenOpponent[];
  turnEndsAt: number | null;
  online: boolean;
}

/** Wire minions carry no card metadata, so re-join them with the local card
 * database to build the same view the local engine produces. */
export function wireMinionToCardView(m: {
  instanceId: string;
  cardId: string;
  attack: number;
  health: number;
  keywords: CardView['keywords'];
  isGolden: boolean;
}): CardView {
  const def = CARDS_BY_ID[m.cardId];
  const mult = m.isGolden ? 2 : 1;
  return {
    key: m.instanceId,
    cardId: m.cardId,
    name: def?.name ?? '???',
    flavor: def?.flavor ?? '',
    tribe: def?.tribe ?? 'NONE',
    tier: def?.tier ?? 1,
    attack: m.attack,
    health: m.health,
    keywords: m.keywords,
    isGolden: m.isGolden,
    buffedAttack: def ? m.attack > def.attack * mult : false,
    buffedHealth: def ? m.health > def.health * mult : false,
  };
}

function heroById(id: string): HeroDef {
  return HEROES.find((h) => h.id === id) ?? HEROES[0];
}

export function screenFromLocalGame(game: GameState): ScreenState {
  const me = game.players.find((p) => p.id === 'human')!;
  const cost = tavernUpgradeCostFor(me, game.turn);
  return {
    turn: game.turn,
    online: false,
    turnEndsAt: null,
    self: {
      name: me.name,
      hero: me.hero,
      health: me.health,
      maxHealth: me.maxHealth,
      gold: me.gold,
      maxGold: me.maxGold,
      tavernTier: me.tavernTier,
      upgradeCost: me.tavernTier >= MAX_TAVERN_TIER ? null : cost,
      shop: me.shop.map((c) => (c ? cardDefToView(c) : null)),
      board: me.board.map(minionToView),
      frozen: me.frozen,
      heroPowerUsedThisTurn: me.heroPowerUsedThisTurn,
      ready: false,
    },
    opponents: game.players
      .filter((p) => p.id !== 'human')
      .map((p) => ({
        id: p.id,
        name: p.name,
        hero: p.hero,
        health: p.health,
        maxHealth: p.maxHealth,
        tavernTier: p.tavernTier,
        alive: p.alive,
        placement: p.placement,
        ready: p.ready,
        connected: p.connected,
      })),
  };
}

export function screenFromWireView(view: WireGameView): ScreenState {
  const you = view.you;
  return {
    turn: view.turn,
    online: true,
    turnEndsAt: view.turnEndsAt,
    self: {
      name: you.name,
      hero: heroById(you.heroId),
      health: you.health,
      maxHealth: you.maxHealth,
      gold: you.gold,
      maxGold: you.maxGold,
      tavernTier: you.tavernTier,
      upgradeCost: you.upgradeCost,
      shop: you.shop.map((id) => {
        const def = id ? CARDS_BY_ID[id] : null;
        return def ? cardDefToView(def) : null;
      }),
      board: you.board.map(wireMinionToCardView),
      frozen: you.frozen,
      heroPowerUsedThisTurn: you.heroPowerUsedThisTurn,
      ready: you.ready,
    },
    opponents: view.opponents.map((o) => ({
      id: o.id,
      name: o.name,
      hero: heroById(o.heroId),
      health: o.health,
      maxHealth: o.maxHealth,
      tavernTier: o.tavernTier,
      alive: o.alive,
      placement: o.placement,
      ready: o.ready,
      connected: o.connected,
    })),
  };
}
