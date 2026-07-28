import { CARDS_BY_ID } from '../data/cards';
import { instantiateMinion } from './minion';
import type { Effect, MinionInstance, TargetSelector, Tribe } from './types';

export interface EffectContext {
  self: MinionInstance;
  ownerBoard: MinionInstance[]; // mutated in place
  enemyBoard?: MinionInstance[]; // present only during combat-time resolution
  onGainGold?: (amount: number) => void;
  onAddRandomToHand?: (tribe?: Tribe, tier?: number, count?: number) => void;
  log?: (text: string) => void;
}

function tribeOf(m: MinionInstance): Tribe {
  return CARDS_BY_ID[m.cardId]?.tribe ?? 'NONE';
}

function randomFrom<T>(arr: T[]): T | undefined {
  if (arr.length === 0) return undefined;
  return arr[Math.floor(Math.random() * arr.length)];
}

function resolveTargets(
  selector: TargetSelector,
  ctx: EffectContext,
  tribe?: Tribe,
  count = 1,
): MinionInstance[] {
  const board = ctx.ownerBoard;
  const others = board.filter((m) => m.instanceId !== ctx.self.instanceId);
  const filterTribe = (list: MinionInstance[]) =>
    tribe ? list.filter((m) => tribeOf(m) === tribe) : list;

  switch (selector) {
    case 'self':
      return [ctx.self];
    case 'allFriendly':
      return filterTribe(board);
    case 'otherFriendly':
      return filterTribe(others);
    case 'randomFriendly': {
      const pool = filterTribe(board);
      return pickRandomN(pool, count);
    }
    case 'randomOtherFriendly': {
      const pool = filterTribe(others);
      return pickRandomN(pool, count);
    }
    case 'adjacent': {
      const idx = board.findIndex((m) => m.instanceId === ctx.self.instanceId);
      if (idx === -1) return [];
      const targets: MinionInstance[] = [];
      if (idx > 0) targets.push(board[idx - 1]);
      if (idx < board.length - 1) targets.push(board[idx + 1]);
      return filterTribe(targets);
    }
    case 'leftAdjacent': {
      const idx = board.findIndex((m) => m.instanceId === ctx.self.instanceId);
      return idx > 0 ? filterTribe([board[idx - 1]]) : [];
    }
    case 'rightAdjacent': {
      const idx = board.findIndex((m) => m.instanceId === ctx.self.instanceId);
      return idx !== -1 && idx < board.length - 1 ? filterTribe([board[idx + 1]]) : [];
    }
    case 'highestAttackFriendly': {
      const pool = filterTribe(others.length ? others : board);
      if (pool.length === 0) return [];
      const max = pool.reduce((a, b) => (b.attack > a.attack ? b : a));
      return [max];
    }
    case 'lowestHealthFriendly': {
      const pool = filterTribe(others.length ? others : board);
      if (pool.length === 0) return [];
      const min = pool.reduce((a, b) => (b.health < a.health ? b : a));
      return [min];
    }
    default:
      return [];
  }
}

function pickRandomN<T>(arr: T[], n: number): T[] {
  const copy = [...arr];
  const out: T[] = [];
  while (copy.length > 0 && out.length < n) {
    const i = Math.floor(Math.random() * copy.length);
    out.push(copy[i]);
    copy.splice(i, 1);
  }
  return out;
}

function insertNextToSelf(ctx: EffectContext, minion: MinionInstance): void {
  if (ctx.ownerBoard.length >= 7) return;
  const idx = ctx.ownerBoard.findIndex((m) => m.instanceId === ctx.self.instanceId);
  if (idx === -1) {
    ctx.ownerBoard.push(minion);
  } else {
    ctx.ownerBoard.splice(idx + 1, 0, minion);
  }
}

export function applyEffect(effect: Effect, ctx: EffectContext): void {
  switch (effect.type) {
    case 'buffSelf': {
      ctx.self.attack += effect.attack;
      ctx.self.health += effect.health;
      break;
    }
    case 'buffFriendly': {
      const targets = resolveTargets(effect.target, ctx, effect.tribe, effect.count ?? 1);
      for (const t of targets) {
        t.attack += effect.attack;
        t.health += effect.health;
      }
      break;
    }
    case 'gainKeyword': {
      const targets = resolveTargets(effect.target, ctx, effect.tribe, effect.count ?? 1);
      for (const t of targets) t.keywords.add(effect.keyword);
      break;
    }
    case 'summon': {
      const def = CARDS_BY_ID[effect.cardId];
      if (!def) break;
      for (let i = 0; i < effect.count; i++) {
        if (ctx.ownerBoard.length >= 7) break;
        insertNextToSelf(ctx, instantiateMinion(def));
      }
      break;
    }
    case 'damageRandomEnemy': {
      if (!ctx.enemyBoard) break;
      const alive = ctx.enemyBoard.filter((m) => m.health > 0);
      const targets = pickRandomN(alive, effect.count ?? 1);
      for (const t of targets) damageMinion(t, effect.amount);
      break;
    }
    case 'damageAllEnemies': {
      if (!ctx.enemyBoard) break;
      for (const t of ctx.enemyBoard) if (t.health > 0) damageMinion(t, effect.amount);
      break;
    }
    case 'damageAllFriendly': {
      const targets = ctx.ownerBoard.filter(
        (m) => !(effect.excludeSelf && m.instanceId === ctx.self.instanceId),
      );
      for (const t of targets) damageMinion(t, effect.amount);
      break;
    }
    case 'gainGold': {
      ctx.onGainGold?.(effect.amount);
      break;
    }
    case 'addRandomToHand': {
      ctx.onAddRandomToHand?.(effect.tribe, effect.tier, effect.count);
      break;
    }
    case 'damageSelf': {
      damageMinion(ctx.self, effect.amount);
      break;
    }
    case 'buffSelfPerTribeCount': {
      const count = ctx.ownerBoard.filter(
        (m) =>
          tribeOf(m) === effect.tribe &&
          (effect.includeSelf || m.instanceId !== ctx.self.instanceId),
      ).length;
      ctx.self.attack += effect.attack * count;
      ctx.self.health += effect.health * count;
      break;
    }
    case 'sacrificeFriendlyForSelf': {
      const candidates = ctx.ownerBoard.filter((m) => m.instanceId !== ctx.self.instanceId);
      const victim = randomFrom(candidates);
      if (victim) damageMinion(victim, effect.damage);
      ctx.self.attack += effect.attack;
      ctx.self.health += effect.health;
      break;
    }
    default:
      break;
  }
}

export function applyEffects(effects: Effect[] | undefined, ctx: EffectContext): void {
  if (!effects) return;
  for (const e of effects) applyEffect(e, ctx);
}

/** Applies damage, popping Divine Shield instead of losing health if present.
 * Returns true when the shield absorbed the hit (no health was actually lost). */
export function damageMinion(m: MinionInstance, amount: number): boolean {
  if (amount <= 0) return false;
  if (m.keywords.has('DivineShield')) {
    m.keywords.delete('DivineShield');
    m.divineShieldConsumedThisFight = true;
    return true;
  }
  m.health -= amount;
  return false;
}
