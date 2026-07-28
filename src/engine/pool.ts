import { CARDS_BY_ID, purchasableCards } from '../data/cards';
import type { CardDef } from './types';

// Shared minion pool across all players, exactly like Battlegrounds: every
// purchasable card has a fixed number of copies "in the bag" that shrinks as
// players buy and grows back when they sell.
const POOL_COUNT_BY_TIER = [18, 15, 13, 11, 9, 6];

export function poolCountForTier(tier: number): number {
  return POOL_COUNT_BY_TIER[tier - 1] ?? 6;
}

export const SHOP_SIZE_BY_TIER = [3, 4, 4, 5, 6, 7];

export function shopSizeForTavernTier(tier: number): number {
  return SHOP_SIZE_BY_TIER[Math.min(tier, 6) - 1] ?? 7;
}

export const TAVERN_UPGRADE_COST: Record<number, number> = {
  2: 5,
  3: 7,
  4: 8,
  5: 9,
  6: 10,
};

export interface Pool {
  counts: Map<string, number>;
}

export function createPool(): Pool {
  const counts = new Map<string, number>();
  for (const c of purchasableCards()) {
    counts.set(c.id, poolCountForTier(c.tier));
  }
  return { counts };
}

export function drawFromPool(pool: Pool, maxTier: number): CardDef | null {
  let totalWeight = 0;
  const entries: { id: string; count: number }[] = [];
  for (const c of purchasableCards()) {
    if (c.tier > maxTier) continue;
    const n = pool.counts.get(c.id) ?? 0;
    if (n <= 0) continue;
    entries.push({ id: c.id, count: n });
    totalWeight += n;
  }
  if (totalWeight === 0) return null;
  let roll = Math.random() * totalWeight;
  for (const e of entries) {
    roll -= e.count;
    if (roll <= 0) {
      pool.counts.set(e.id, (pool.counts.get(e.id) ?? 0) - 1);
      return CARDS_BY_ID[e.id];
    }
  }
  const last = entries[entries.length - 1];
  pool.counts.set(last.id, (pool.counts.get(last.id) ?? 0) - 1);
  return CARDS_BY_ID[last.id];
}

export function returnToPool(pool: Pool, cardId: string, copies = 1): void {
  const def = CARDS_BY_ID[cardId];
  if (!def || def.isToken) return;
  pool.counts.set(cardId, (pool.counts.get(cardId) ?? 0) + copies);
}

export function goldForTurn(turn: number): number {
  return Math.min(10, 2 + turn);
}

export function tavernUpgradeCost(
  targetTier: number,
  currentTurn: number,
  turnReachedPreviousTier: number,
): number {
  const base = TAVERN_UPGRADE_COST[targetTier] ?? 99;
  const reduction = Math.max(0, currentTurn - turnReachedPreviousTier);
  return Math.max(1, base - reduction);
}
