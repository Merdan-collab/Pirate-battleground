import { CARDS_BY_ID } from '../data/cards';
import {
  applyEffects,
  defOf,
  hasModifier,
  recomputeAuras,
  tribeOf,
  type EffectContext,
} from './effects';
import { instantiateMinion } from './minion';
import {
  drawFromPool,
  returnToPool,
  shopSizeForTavernTier,
  tavernUpgradeCost,
  type Pool,
} from './pool';
import type { CardDef, Effect, MinionInstance, PlayerState, TriggerEvent } from './types';

export const BUY_COST = 3;
export const SELL_REFUND = 1;
export const REROLL_COST = 1;
export const MAX_TAVERN_TIER = 6;
export const MAX_BOARD_SIZE = 7;

export interface BuyResult {
  ok: boolean;
  reason?: string;
}

/** Recruit-phase effect context. Combat-only hooks are absent, so effects that
 * need a battle (damage, summon-and-attack) simply do nothing here. */
function shopContext(
  player: PlayerState,
  self: MinionInstance,
  eventSubject?: MinionInstance,
): EffectContext {
  return {
    self,
    ownerBoard: player.board,
    eventSubject,
    heroDamageTaken: player.maxHealth - player.health,
    onGainGold: (amt) => {
      player.gold = Math.min(player.maxGold, player.gold + amt);
    },
    onAddToHand: (card) => {
      if (player.hand.length < 10) player.hand.push(instantiateMinion(card));
    },
    onFreeRefresh: () => {
      player.freeRefreshes += 1;
    },
    onReduceUpgradeCost: (amt) => {
      player.upgradeDiscount += amt;
    },
  };
}

/** Fires a recruit-phase trigger across the player's board. */
export function fireShopTriggers(
  player: PlayerState,
  event: TriggerEvent,
  subject?: MinionInstance,
): void {
  for (const m of [...player.board]) {
    const triggers = defOf(m)?.triggers;
    if (!triggers) continue;
    for (const trigger of triggers) {
      if (trigger.on !== event) continue;
      if (trigger.tribe && subject && tribeOf(subject) !== trigger.tribe) continue;
      // "After you play a minion with Battlecry" — no tribe filter, but the
      // subject must actually have a Battlecry.
      if (event === 'afterYouPlay' && !trigger.tribe && subject && !defOf(subject)?.battlecry) {
        continue;
      }
      const times = m.isGolden ? 2 : 1;
      for (let i = 0; i < times; i++) {
        applyEffects(trigger.effects, shopContext(player, m, subject));
        applyHeroSelfDamage(player, trigger.effects);
      }
    }
  }
  recomputeAuras(player.board);
}

/** damageOwnHero is resolved here rather than in effects.ts because only the
 * shop layer owns the player's health. */
function applyHeroSelfDamage(player: PlayerState, effects: Effect[]): void {
  for (const e of effects) {
    if (e.type === 'damageOwnHero') {
      player.health = Math.max(0, player.health - e.amount);
    }
  }
}

export function refreshShop(player: PlayerState, pool: Pool, opts: { free?: boolean } = {}): void {
  if (player.frozen && !opts.free) {
    player.frozen = false;
    return;
  }
  for (const card of player.shop) if (card) returnToPool(pool, card.id, 1);
  const size = shopSizeForTavernTier(player.tavernTier);
  player.shop = Array.from({ length: size }, () => drawFromPool(pool, player.tavernTier));
  player.frozen = false;
}

export function manualReroll(player: PlayerState, pool: Pool): boolean {
  const free = player.freeRefreshes > 0;
  if (!free && player.gold < REROLL_COST) return false;
  if (free) player.freeRefreshes -= 1;
  else player.gold -= REROLL_COST;

  for (const card of player.shop) if (card) returnToPool(pool, card.id, 1);
  const size = shopSizeForTavernTier(player.tavernTier);
  player.shop = Array.from({ length: size }, () => drawFromPool(pool, player.tavernTier));
  player.frozen = false;
  return true;
}

export function toggleFreeze(player: PlayerState): void {
  player.frozen = !player.frozen;
}

// Combining 3 copies consumes them into 1 golden minion; they only return to
// the shared pool if that golden minion is later sold.
function checkAndCombineTriples(player: PlayerState, cardId: string): void {
  const matches = player.board.filter((m) => m.cardId === cardId && !m.isGolden);
  if (matches.length < 3) return;
  const three = matches.slice(0, 3);
  const firstIdx = player.board.findIndex((m) => m.instanceId === three[0].instanceId);
  for (const m of three) {
    const idx = player.board.findIndex((x) => x.instanceId === m.instanceId);
    if (idx !== -1) player.board.splice(idx, 1);
  }
  const def = CARDS_BY_ID[cardId];
  if (!def) return;
  player.board.splice(Math.min(firstIdx, player.board.length), 0, instantiateMinion(def, true));
  player.triplesThisGame += 1;
}

function playMinion(player: PlayerState, card: CardDef, minion: MinionInstance): void {
  player.board.push(minion);

  const battlecryTimes =
    (minion.isGolden ? 2 : 1) * hasModifier(player.board, 'doubleBattlecry');
  if (card.battlecry) {
    for (let i = 0; i < battlecryTimes; i++) {
      applyEffects(card.battlecry, shopContext(player, minion));
      applyHeroSelfDamage(player, card.battlecry);
    }
  }

  // The minion entering the board is itself a summon event.
  fireShopTriggers(player, 'afterFriendlySummoned', minion);
  fireShopTriggers(player, 'afterYouPlay', minion);
  checkAndCombineTriples(player, card.id);
  recomputeAuras(player.board);
}

export function buyMinion(player: PlayerState, _pool: Pool, shopIndex: number): BuyResult {
  const card = player.shop[shopIndex];
  if (!card) return { ok: false, reason: 'Empty slot' };
  if (player.gold < BUY_COST) return { ok: false, reason: 'Not enough gold' };
  if (player.board.length >= MAX_BOARD_SIZE) return { ok: false, reason: 'Board is full' };

  player.gold -= BUY_COST;
  player.shop[shopIndex] = null;
  playMinion(player, card, instantiateMinion(card));
  return { ok: true };
}

/** Plays a minion sitting in hand (from Sellemental-style effects). */
export function playFromHand(player: PlayerState, instanceId: string): BuyResult {
  const idx = player.hand.findIndex((m) => m.instanceId === instanceId);
  if (idx === -1) return { ok: false, reason: 'Not in hand' };
  if (player.board.length >= MAX_BOARD_SIZE) return { ok: false, reason: 'Board is full' };
  const minion = player.hand[idx];
  const card = CARDS_BY_ID[minion.cardId];
  if (!card) return { ok: false, reason: 'Unknown card' };
  player.hand.splice(idx, 1);
  playMinion(player, card, minion);
  return { ok: true };
}

export function sellMinion(player: PlayerState, pool: Pool, boardIndex: number): BuyResult {
  const minion = player.board[boardIndex];
  if (!minion) return { ok: false, reason: 'No minion there' };
  const def = defOf(minion);

  player.board.splice(boardIndex, 1);
  player.gold = Math.min(player.maxGold, player.gold + (def?.sellValue ?? SELL_REFUND));
  returnToPool(pool, minion.cardId, minion.isGolden ? 3 : 1);

  // Sell triggers fire from the minion that just left the board.
  if (def?.triggers?.some((t) => t.on === 'afterSelfSold')) {
    for (const trigger of def.triggers) {
      if (trigger.on !== 'afterSelfSold') continue;
      const times = minion.isGolden ? 2 : 1;
      for (let i = 0; i < times; i++) {
        applyEffects(trigger.effects, shopContext(player, minion));
      }
    }
  }
  recomputeAuras(player.board);
  return { ok: true };
}

export function tavernUpgradeCostFor(player: PlayerState, currentTurn: number): number | null {
  if (player.tavernTier >= MAX_TAVERN_TIER) return null;
  const base = tavernUpgradeCost(
    player.tavernTier + 1,
    currentTurn,
    player.turnReachedCurrentTier,
  );
  return Math.max(0, base - player.upgradeDiscount);
}

export function upgradeTavern(player: PlayerState, pool: Pool, currentTurn: number): BuyResult {
  const cost = tavernUpgradeCostFor(player, currentTurn);
  if (cost === null) return { ok: false, reason: 'Already max tier' };
  if (player.gold < cost) return { ok: false, reason: 'Not enough gold' };

  player.gold -= cost;
  player.tavernTier += 1;
  player.turnReachedCurrentTier = currentTurn;
  player.upgradeDiscount = 0;

  const size = shopSizeForTavernTier(player.tavernTier);
  const need = size - player.shop.filter((c) => c !== null).length;
  for (let i = 0; i < need; i++) player.shop.push(drawFromPool(pool, player.tavernTier));
  return { ok: true };
}

export function reorderMinion(player: PlayerState, instanceId: string, toIndex: number): boolean {
  const from = player.board.findIndex((m) => m.instanceId === instanceId);
  if (from === -1) return false;
  const clamped = Math.max(0, Math.min(toIndex, player.board.length - 1));
  if (from === clamped) return false;
  const [m] = player.board.splice(from, 1);
  player.board.splice(clamped, 0, m);
  recomputeAuras(player.board);
  return true;
}
