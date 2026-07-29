import { CARDS_BY_ID, purchasableCards } from '../data/cards';
import { instantiateMinion } from './minion';
import type {
  CardDef,
  Effect,
  GlobalModifier,
  MinionInstance,
  TargetSelector,
  Tribe,
} from './types';

export const MAX_BOARD_SIZE = 7;

export function tribeOf(m: MinionInstance): Tribe {
  return CARDS_BY_ID[m.cardId]?.tribe ?? 'NONE';
}

export function defOf(m: MinionInstance): CardDef | undefined {
  return CARDS_BY_ID[m.cardId];
}

export function hasModifier(board: MinionInstance[], mod: GlobalModifier): number {
  // A golden Brann/Baron triples rather than doubles.
  let factor = 1;
  for (const m of board) {
    if (defOf(m)?.modifier === mod) factor = Math.max(factor, m.isGolden ? 3 : 2);
  }
  return factor;
}

/** Everything an effect might need to reach: the owning board, the enemy board
 * during combat, and the recruit-phase hooks for gold/hand/shop side effects. */
export interface EffectContext {
  self: MinionInstance;
  ownerBoard: MinionInstance[];
  enemyBoard?: MinionInstance[];
  /** The minion that caused the trigger (for 'eventSubject' targeting). */
  eventSubject?: MinionInstance;
  /** Damage the owning hero has taken, for Annihilan-style effects. */
  heroDamageTaken?: number;
  onGainGold?: (amount: number) => void;
  onAddToHand?: (card: CardDef) => void;
  onFreeRefresh?: () => void;
  onReduceUpgradeCost?: (amount: number) => void;
  /** Combat only: queue a minion to attack out of turn. */
  onAttackImmediately?: (m: MinionInstance) => void;
  /** Combat only: fire a deathrattle for a minion already on the board. */
  onTriggerDeathrattle?: (m: MinionInstance) => void;
  /** Called whenever a minion enters the board, so summon triggers can fire. */
  onSummoned?: (m: MinionInstance) => void;
  log?: (text: string) => void;
}

function pickRandomN<T>(arr: T[], n: number): T[] {
  const copy = [...arr];
  const out: T[] = [];
  while (copy.length > 0 && out.length < n) {
    out.push(...copy.splice(Math.floor(Math.random() * copy.length), 1));
  }
  return out;
}

function resolveTargets(
  selector: TargetSelector,
  ctx: EffectContext,
  tribe?: Tribe,
  count = 1,
): MinionInstance[] {
  const board = ctx.ownerBoard;
  const others = board.filter((m) => m.instanceId !== ctx.self.instanceId);
  const byTribe = (list: MinionInstance[]) =>
    tribe ? list.filter((m) => tribeOf(m) === tribe) : list;

  switch (selector) {
    case 'self':
      return [ctx.self];
    case 'eventSubject':
      return ctx.eventSubject ? [ctx.eventSubject] : [];
    case 'allFriendly':
      return byTribe(board);
    case 'otherFriendly':
      return byTribe(others);
    case 'randomFriendly':
      return pickRandomN(byTribe(board), count);
    case 'randomOtherFriendly':
      return pickRandomN(byTribe(others), count);
    case 'adjacent': {
      const i = board.findIndex((m) => m.instanceId === ctx.self.instanceId);
      if (i === -1) return [];
      const out: MinionInstance[] = [];
      if (i > 0) out.push(board[i - 1]);
      if (i < board.length - 1) out.push(board[i + 1]);
      return byTribe(out);
    }
    case 'leftmost':
      return byTribe(board).slice(0, 1);
    case 'rightmost':
      return byTribe(board).slice(-1);
    case 'highestAttackFriendly': {
      const pool = byTribe(board);
      return pool.length ? [pool.reduce((a, b) => (b.attack > a.attack ? b : a))] : [];
    }
    case 'lowestAttackFriendly': {
      const pool = byTribe(board);
      return pool.length ? [pool.reduce((a, b) => (b.attack < a.attack ? b : a))] : [];
    }
    default:
      return [];
  }
}

function countTribe(board: MinionInstance[], tribe: Tribe, exclude?: MinionInstance): number {
  return board.filter((m) => tribeOf(m) === tribe && m.instanceId !== exclude?.instanceId).length;
}

function insertNearSelf(ctx: EffectContext, minion: MinionInstance): boolean {
  if (ctx.ownerBoard.length >= MAX_BOARD_SIZE) return false;
  const i = ctx.ownerBoard.findIndex((m) => m.instanceId === ctx.self.instanceId);
  if (i === -1) ctx.ownerBoard.push(minion);
  else ctx.ownerBoard.splice(i + 1, 0, minion);
  return true;
}

function randomPoolCard(filter: {
  tribe?: Tribe;
  maxTier?: number;
  requireDeathrattle?: boolean;
  withTaunt?: boolean;
}): CardDef | null {
  const candidates = purchasableCards().filter((c) => {
    if (filter.tribe && c.tribe !== filter.tribe) return false;
    if (filter.maxTier && c.tier > filter.maxTier) return false;
    if (filter.requireDeathrattle && !c.deathrattle) return false;
    if (filter.withTaunt && !c.keywords.includes('Taunt')) return false;
    return true;
  });
  if (candidates.length === 0) return null;
  return candidates[Math.floor(Math.random() * candidates.length)];
}

export function applyEffect(effect: Effect, ctx: EffectContext): void {
  switch (effect.type) {
    case 'buff': {
      const targets = resolveTargets(effect.target, ctx, effect.tribe, effect.count ?? 1);
      const scale = effect.perTribeCount
        ? countTribe(
            ctx.ownerBoard,
            effect.perTribeCount,
            effect.includeSelfInCount ? undefined : ctx.self,
          )
        : 1;
      for (const t of targets) {
        t.attack += effect.attack * scale;
        t.health += effect.health * scale;
        t.baseAttack += effect.attack * scale;
        t.baseHealth += effect.health * scale;
      }
      break;
    }

    case 'gainKeyword': {
      const targets = resolveTargets(effect.target, ctx, effect.tribe, effect.count ?? 1);
      for (const t of targets) {
        t.keywords.add(effect.keyword);
        t.grantedKeywords.add(effect.keyword);
      }
      break;
    }

    case 'summon': {
      const def = CARDS_BY_ID[effect.cardId];
      if (!def) break;
      const times = effect.count * (ctx.self.isGolden ? 1 : 1);
      for (let i = 0; i < times; i++) {
        const token = instantiateMinion(def, ctx.self.isGolden);
        if (!insertNearSelf(ctx, token)) break;
        ctx.onSummoned?.(token);
        if (effect.attackImmediately) ctx.onAttackImmediately?.(token);
      }
      break;
    }

    case 'summonRandom': {
      for (let i = 0; i < effect.count; i++) {
        const def = randomPoolCard(effect);
        if (!def) break;
        const token = instantiateMinion(def);
        if (!insertNearSelf(ctx, token)) break;
        ctx.onSummoned?.(token);
      }
      break;
    }

    case 'damageEnemy': {
      if (!ctx.enemyBoard) break;
      const amount = effect.perTribeCount
        ? countTribe(ctx.ownerBoard, effect.perTribeCount) * effect.amount
        : effect.amount;
      if (amount <= 0) break;
      const alive = ctx.enemyBoard.filter((m) => m.health > 0);
      if (alive.length === 0) break;

      if (effect.target === 'all') {
        for (const t of alive) damageMinion(t, amount);
      } else if (effect.target === 'leftmost') {
        damageMinion(alive[0], amount);
      } else {
        for (const t of pickRandomN(alive, effect.count ?? 1)) damageMinion(t, amount);
      }
      break;
    }

    case 'damageOwnHero': {
      // Applied by the caller via heroDamageTaken bookkeeping in shop.ts.
      break;
    }

    case 'gainGold':
      ctx.onGainGold?.(effect.amount);
      break;

    case 'addToHand': {
      for (let i = 0; i < effect.count; i++) {
        const def = effect.cardId
          ? CARDS_BY_ID[effect.cardId]
          : randomPoolCard({ tribe: effect.tribe });
        if (def) ctx.onAddToHand?.(def);
      }
      break;
    }

    case 'freeRefresh':
      ctx.onFreeRefresh?.();
      break;

    case 'reduceUpgradeCost':
      ctx.onReduceUpgradeCost?.(effect.amount);
      break;

    case 'triggerFriendlyDeathrattle': {
      const withDr = ctx.ownerBoard.filter(
        (m) => m.instanceId !== ctx.self.instanceId && defOf(m)?.deathrattle,
      );
      for (const t of pickRandomN(withDr, effect.count)) ctx.onTriggerDeathrattle?.(t);
      break;
    }

    case 'doubleAttack': {
      for (const t of resolveTargets(effect.target, ctx)) {
        t.attack *= 2;
      }
      break;
    }

    case 'buffPerHeroDamage': {
      const dmg = ctx.heroDamageTaken ?? 0;
      ctx.self.health += dmg * effect.healthPerDamage;
      ctx.self.baseHealth += dmg * effect.healthPerDamage;
      break;
    }

    case 'attackImmediately': {
      for (const t of resolveTargets(effect.target, ctx)) ctx.onAttackImmediately?.(t);
      break;
    }
  }
}

export function applyEffects(effects: Effect[] | undefined, ctx: EffectContext): void {
  if (!effects) return;
  for (const e of effects) applyEffect(e, ctx);
}

/** Applies damage, popping Divine Shield instead of losing health if present.
 * Returns true when the shield absorbed the hit. */
export function damageMinion(m: MinionInstance, amount: number): boolean {
  if (amount <= 0) return false;
  if (m.keywords.has('DivineShield')) {
    m.keywords.delete('DivineShield');
    return true;
  }
  m.health -= amount;
  return false;
}

// --------------------------------------------------------------------------
// Auras — recomputed from base stats whenever the board changes
// --------------------------------------------------------------------------

export function recomputeAuras(board: MinionInstance[]): void {
  for (const m of board) {
    m.attack = m.baseAttack;
    m.health = m.baseHealth;
    const base = new Set(defOf(m)?.keywords ?? []);
    for (const k of m.grantedKeywords) base.add(k);
    m.keywords = base;
  }

  for (const source of board) {
    const aura = defOf(source)?.aura;
    if (!aura) continue;
    const mult = source.isGolden ? 2 : 1;
    for (const target of board) {
      if (target.instanceId === source.instanceId) continue;
      if (aura.tribe && tribeOf(target) !== aura.tribe) continue;
      target.attack += aura.attack * mult;
      target.health += aura.health * mult;
      if (aura.keyword) target.keywords.add(aura.keyword);
    }
  }
}
