import { CARDS_BY_ID } from '../data/cards';
import { applyEffects, type EffectContext } from './effects';
import { instantiateMinion } from './minion';
import {
  drawFromPool,
  returnToPool,
  shopSizeForTavernTier,
  tavernUpgradeCost,
  type Pool,
} from './pool';
import type { CardDef, PlayerState } from './types';

export const BUY_COST = 3;
export const SELL_REFUND = 1;
export const REROLL_COST = 1;
export const MAX_TAVERN_TIER = 6;
export const MAX_BOARD_SIZE = 7;

export function refreshShop(player: PlayerState, pool: Pool, opts: { free?: boolean } = {}): void {
  if (player.frozen && !opts.free) {
    player.frozen = false;
    return;
  }
  for (const card of player.shop) {
    if (card) returnToPool(pool, card.id, 1);
  }
  const size = shopSizeForTavernTier(player.tavernTier);
  const next: (CardDef | null)[] = [];
  for (let i = 0; i < size; i++) {
    next.push(drawFromPool(pool, player.tavernTier));
  }
  player.shop = next;
  player.frozen = false;
}

export function manualReroll(player: PlayerState, pool: Pool): boolean {
  if (player.gold < REROLL_COST) return false;
  player.gold -= REROLL_COST;
  for (const card of player.shop) {
    if (card) returnToPool(pool, card.id, 1);
  }
  const size = shopSizeForTavernTier(player.tavernTier);
  const next: (CardDef | null)[] = [];
  for (let i = 0; i < size; i++) {
    next.push(drawFromPool(pool, player.tavernTier));
  }
  player.shop = next;
  player.frozen = false;
  return true;
}

export function toggleFreeze(player: PlayerState): void {
  player.frozen = !player.frozen;
}

// Combining 3 copies consumes them permanently into 1 golden minion — they
// only return to the shared pool if the golden minion is later sold (see
// sellMinion), so no pool interaction happens here.
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
  const golden = instantiateMinion(def, true);
  const insertAt = Math.min(firstIdx, player.board.length);
  player.board.splice(insertAt, 0, golden);
  player.triplesThisGame += 1;
}

export interface BuyResult {
  ok: boolean;
  reason?: string;
}

// `pool` is accepted (unused) so buy/sell/reroll/upgrade share one call
// signature across the UI layer.
export function buyMinion(player: PlayerState, _pool: Pool, shopIndex: number): BuyResult {
  const card = player.shop[shopIndex];
  if (!card) return { ok: false, reason: 'Empty slot' };
  if (player.gold < BUY_COST) return { ok: false, reason: 'Not enough gold' };
  if (player.board.length >= MAX_BOARD_SIZE) return { ok: false, reason: 'Board is full' };

  player.gold -= BUY_COST;
  player.shop[shopIndex] = null;
  const minion = instantiateMinion(card);
  player.board.push(minion);

  if (card.battlecry) {
    const ctx: EffectContext = {
      self: minion,
      ownerBoard: player.board,
      onGainGold: (amt) => {
        player.gold = Math.min(player.maxGold, player.gold + amt);
      },
    };
    applyEffects(card.battlecry, ctx);
  }

  checkAndCombineTriples(player, card.id);
  return { ok: true };
}

export function sellMinion(player: PlayerState, pool: Pool, boardIndex: number): BuyResult {
  const minion = player.board[boardIndex];
  if (!minion) return { ok: false, reason: 'No minion there' };
  player.board.splice(boardIndex, 1);
  player.gold = Math.min(player.maxGold, player.gold + SELL_REFUND);
  returnToPool(pool, minion.cardId, minion.isGolden ? 3 : 1);
  return { ok: true };
}

export function reorderMinion(
  player: PlayerState,
  instanceId: string,
  toIndex: number,
): BuyResult {
  const from = player.board.findIndex((m) => m.instanceId === instanceId);
  if (from === -1) return { ok: false, reason: 'No minion there' };
  const clamped = Math.max(0, Math.min(toIndex, player.board.length - 1));
  const [minion] = player.board.splice(from, 1);
  player.board.splice(clamped, 0, minion);
  return { ok: true };
}

export function tavernUpgradeCostFor(player: PlayerState, currentTurn: number): number {
  if (player.tavernTier >= MAX_TAVERN_TIER) return Infinity;
  return tavernUpgradeCost(player.tavernTier + 1, currentTurn, player.turnReachedCurrentTier);
}

export function upgradeTavern(player: PlayerState, pool: Pool, currentTurn: number): BuyResult {
  if (player.tavernTier >= MAX_TAVERN_TIER) return { ok: false, reason: 'Max tier reached' };
  const targetTier = player.tavernTier + 1;
  const cost = tavernUpgradeCost(targetTier, currentTurn, player.turnReachedCurrentTier);
  if (player.gold < cost) return { ok: false, reason: 'Not enough gold' };
  player.gold -= cost;
  player.tavernTier = targetTier;
  player.turnReachedCurrentTier = currentTurn;

  const size = shopSizeForTavernTier(player.tavernTier);
  const nonNullCount = player.shop.filter((c) => c !== null).length;
  const need = size - nonNullCount;
  for (let i = 0; i < need; i++) {
    player.shop.push(drawFromPool(pool, player.tavernTier));
  }
  return { ok: true };
}
