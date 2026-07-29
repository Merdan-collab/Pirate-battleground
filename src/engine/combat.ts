import { CARDS_BY_ID } from '../data/cards';
import {
  applyEffects,
  damageMinion,
  defOf,
  hasModifier,
  recomputeAuras,
  tribeOf,
  type EffectContext,
} from './effects';
import { cloneMinion } from './minion';
import type { Keyword, MinionInstance, Trigger, TriggerEvent } from './types';

export type Side = 'a' | 'b';

export interface MinionSnapshot {
  instanceId: string;
  cardId: string;
  attack: number;
  health: number;
  keywords: Keyword[];
  isGolden: boolean;
}

/** One frame of the battle, replayed by the animated viewer. Each step carries
 * a full snapshot of both boards so the UI can render state directly rather
 * than trying to re-derive it. */
export interface CombatStep {
  kind: 'start' | 'attack' | 'damage' | 'death' | 'summon' | 'buff' | 'end';
  a: MinionSnapshot[];
  b: MinionSnapshot[];
  actorSide?: Side;
  actorId?: string;
  targetSide?: Side;
  targetIds?: string[];
  text: string;
}

function snapshot(list: MinionInstance[]): MinionSnapshot[] {
  return list
    .filter((m) => m.health > 0)
    .map((m) => ({
      instanceId: m.instanceId,
      cardId: m.cardId,
      attack: m.attack,
      health: m.health,
      keywords: [...m.keywords],
      isGolden: m.isGolden,
    }));
}

function nameOf(m: MinionInstance): string {
  return CARDS_BY_ID[m.cardId]?.name ?? '???';
}

function prepareForCombat(m: MinionInstance): MinionInstance {
  const c = cloneMinion(m);
  c.attack += m.pendingAttack ?? 0;
  c.health += m.pendingHealth ?? 0;
  for (const k of m.pendingKeywords ?? []) c.keywords.add(k);
  c.spentTriggers = new Set();
  c.justReborn = false;
  return c;
}

// --------------------------------------------------------------------------
// Battle state
// --------------------------------------------------------------------------

class Battle {
  a: MinionInstance[];
  b: MinionInstance[];
  steps: CombatStep[] = [];
  logs: string[] = [];
  /** Minions queued to attack out of turn (Scallywag's token, Yo-Ho-Ogre). */
  private extraAttacks: { side: Side; minion: MinionInstance }[] = [];

  constructor(a: MinionInstance[], b: MinionInstance[]) {
    this.a = a;
    this.b = b;
  }

  board(side: Side): MinionInstance[] {
    return side === 'a' ? this.a : this.b;
  }

  enemy(side: Side): MinionInstance[] {
    return side === 'a' ? this.b : this.a;
  }

  push(step: Omit<CombatStep, 'a' | 'b'>): void {
    this.steps.push({ ...step, a: snapshot(this.a), b: snapshot(this.b) });
    if (step.text) this.logs.push(step.text);
  }

  queueAttack(side: Side, minion: MinionInstance): void {
    this.extraAttacks.push({ side, minion });
  }

  takeQueuedAttack(): { side: Side; minion: MinionInstance } | undefined {
    return this.extraAttacks.shift();
  }

  ctxFor(side: Side, self: MinionInstance, eventSubject?: MinionInstance): EffectContext {
    return {
      self,
      ownerBoard: this.board(side),
      enemyBoard: this.enemy(side),
      eventSubject,
      onAttackImmediately: (m) => this.queueAttack(side, m),
      onTriggerDeathrattle: (m) => this.fireDeathrattle(side, m),
      onSummoned: (m) => {
        this.push({
          kind: 'summon',
          actorSide: side,
          actorId: m.instanceId,
          text: `${nameOf(m)} is summoned.`,
        });
        this.fireTriggers('afterFriendlySummoned', side, m);
      },
      log: (t) => this.logs.push(t),
    };
  }

  /** Runs every trigger on `side` listening for `event`. */
  fireTriggers(event: TriggerEvent, side: Side, subject?: MinionInstance): void {
    const board = [...this.board(side)];
    for (const m of board) {
      if (m.health <= 0) continue;
      const triggers = defOf(m)?.triggers;
      if (!triggers) continue;
      triggers.forEach((trigger: Trigger, index: number) => {
        if (trigger.on !== event) return;
        if (trigger.tribe && subject && tribeOf(subject) !== trigger.tribe) return;
        if (trigger.oncePerCombat) {
          if (m.spentTriggers?.has(index)) return;
          m.spentTriggers?.add(index);
        }
        // Snapshot enemy health so trigger damage produces an animatable
        // 'damage' step rather than a silent stat change.
        const enemyHealthBefore = new Map(
          this.enemy(side).map((e) => [e.instanceId, e.health]),
        );
        const times = m.isGolden ? 2 : 1;
        for (let i = 0; i < times; i++) {
          applyEffects(trigger.effects, this.ctxFor(side, m, subject));
        }
        const hurt = this.enemy(side)
          .filter((e) => (enemyHealthBefore.get(e.instanceId) ?? e.health) > e.health)
          .map((e) => e.instanceId);

        this.push({
          kind: hurt.length > 0 ? 'damage' : 'buff',
          actorSide: side,
          actorId: m.instanceId,
          targetSide: hurt.length > 0 ? (side === 'a' ? 'b' : 'a') : undefined,
          targetIds: hurt.length > 0 ? hurt : undefined,
          text: `${nameOf(m)} triggers.`,
        });
      });
    }
  }

  fireDeathrattle(side: Side, m: MinionInstance): void {
    const def = defOf(m);
    if (!def?.deathrattle) return;
    const times = (m.isGolden ? 2 : 1) * hasModifier(this.board(side), 'doubleDeathrattle');
    for (let i = 0; i < times; i++) {
      applyEffects(def.deathrattle, this.ctxFor(side, m));
    }
  }

  /** Removes dead minions, firing Deathrattles and Reborn in board order. */
  cleanupDeaths(): void {
    for (const side of ['a', 'b'] as Side[]) {
      const board = this.board(side);
      for (let i = 0; i < board.length; i++) {
        const m = board[i];
        if (m.health > 0) continue;

        board.splice(i, 1);
        this.push({
          kind: 'death',
          actorSide: side,
          actorId: m.instanceId,
          text: `${nameOf(m)} dies.`,
        });

        this.fireDeathrattle(side, m);
        this.fireTriggers('afterFriendlyDies', side, m);

        if (m.keywords.has('Reborn') && !m.justReborn && board.length < 7) {
          const def = defOf(m);
          const reborn = cloneMinion(m);
          reborn.instanceId = `${m.instanceId}_rb`;
          reborn.health = 1;
          reborn.attack = m.baseAttack;
          reborn.keywords = new Set((def?.keywords ?? []).filter((k) => k !== 'Reborn'));
          reborn.justReborn = true;
          board.splice(Math.min(i, board.length), 0, reborn);
          this.push({
            kind: 'summon',
            actorSide: side,
            actorId: reborn.instanceId,
            text: `${nameOf(m)} is reborn.`,
          });
        }
        i -= 1;
      }
      recomputeAuras(this.board(side));
    }
  }

  aliveCount(side: Side): number {
    return this.board(side).filter((m) => m.health > 0).length;
  }
}

// --------------------------------------------------------------------------
// Attacking
// --------------------------------------------------------------------------

function chooseDefender(defenders: MinionInstance[]): MinionInstance | null {
  const alive = defenders.filter((m) => m.health > 0);
  if (alive.length === 0) return null;
  const taunts = alive.filter((m) => m.keywords.has('Taunt'));
  const pool = taunts.length > 0 ? taunts : alive;
  return pool[Math.floor(Math.random() * pool.length)];
}

function resolveAttack(battle: Battle, side: Side, attacker: MinionInstance): void {
  if (attacker.health <= 0 || attacker.attack <= 0) return;
  const defenders = battle.enemy(side);
  const defender = chooseDefender(defenders);
  if (!defender) return;

  const defSide: Side = side === 'a' ? 'b' : 'a';
  const attackerAtk = attacker.attack;
  const defenderAtk = defender.attack;

  battle.push({
    kind: 'attack',
    actorSide: side,
    actorId: attacker.instanceId,
    targetSide: defSide,
    targetIds: [defender.instanceId],
    text: `${nameOf(attacker)} attacks ${nameOf(defender)}.`,
  });

  // Cleave also strikes the defender's neighbours.
  const splashTargets: MinionInstance[] = [];
  if (attacker.keywords.has('Cleave')) {
    const i = defenders.indexOf(defender);
    if (i > 0) splashTargets.push(defenders[i - 1]);
    if (i < defenders.length - 1) splashTargets.push(defenders[i + 1]);
  }

  const defenderShielded = damageMinion(defender, attackerAtk);
  for (const s of splashTargets) damageMinion(s, attackerAtk);
  const attackerShielded = damageMinion(attacker, defenderAtk);

  if (attacker.keywords.has('Poisonous') && !defenderShielded && defender.health > 0) {
    defender.health = 0;
  }
  if (defender.keywords.has('Poisonous') && !attackerShielded && attacker.health > 0) {
    attacker.health = 0;
  }

  const hitNames = [defender, ...splashTargets].map(nameOf).join(', ');
  battle.push({
    kind: 'damage',
    actorSide: side,
    actorId: attacker.instanceId,
    targetSide: defSide,
    targetIds: [defender.instanceId, ...splashTargets.map((s) => s.instanceId)],
    text: defenderShielded
      ? `${nameOf(defender)}'s Divine Shield absorbs the hit.`
      : `${hitNames} ${splashTargets.length ? 'take' : 'takes'} ${attackerAtk} damage.`,
  });

  // Overkill: excess damage on a kill.
  if (defender.health < 0 && attackerAtk > 0) {
    battle.fireTriggers('onOverkill', side, attacker);
  }

  // Frenzy-style: survived damage.
  if (!defenderShielded && defenderAtk >= 0 && defender.health > 0 && attackerAtk > 0) {
    battle.fireTriggers('afterSelfSurvivesDamage', defSide, defender);
  }
  if (!attackerShielded && defenderAtk > 0 && attacker.health > 0) {
    battle.fireTriggers('afterSelfSurvivesDamage', side, attacker);
  }

  battle.fireTriggers('afterSelfAttacks', side, attacker);
  battle.cleanupDeaths();
}

function performTurn(battle: Battle, side: Side, pointer: number): number {
  const board = battle.board(side);
  const n = board.length;
  if (n === 0) return pointer;

  let idx = -1;
  for (let i = 0; i < n; i++) {
    const candidate = (pointer + i) % n;
    if (board[candidate].health > 0 && board[candidate].attack > 0) {
      idx = candidate;
      break;
    }
  }
  if (idx === -1) return pointer;

  const attacker = board[idx];
  const strikes = attacker.keywords.has('MegaWindfury')
    ? 4
    : attacker.keywords.has('Windfury')
      ? 2
      : 1;

  for (let s = 0; s < strikes; s++) {
    if (attacker.health <= 0 || battle.aliveCount(side === 'a' ? 'b' : 'a') === 0) break;
    resolveAttack(battle, side, attacker);
  }
  return idx + 1;
}

function drainQueuedAttacks(battle: Battle): void {
  let guard = 0;
  let queued = battle.takeQueuedAttack();
  while (queued && guard < 20) {
    guard += 1;
    if (queued.minion.health > 0) resolveAttack(battle, queued.side, queued.minion);
    queued = battle.takeQueuedAttack();
  }
}

// --------------------------------------------------------------------------
// Public entry point
// --------------------------------------------------------------------------

export interface CombatOutcome {
  steps: CombatStep[];
  logs: string[];
  aSurvived: boolean;
  bSurvived: boolean;
  draw: boolean;
  aFinalBoard: MinionInstance[];
  bFinalBoard: MinionInstance[];
}

export function simulateCombat(
  boardA: MinionInstance[],
  boardB: MinionInstance[],
): CombatOutcome {
  const a = boardA.map(prepareForCombat);
  const b = boardB.map(prepareForCombat);
  recomputeAuras(a);
  recomputeAuras(b);

  const battle = new Battle(a, b);
  battle.push({ kind: 'start', text: 'The battle begins!' });

  if (a.length === 0 && b.length === 0) {
    battle.push({ kind: 'end', text: 'Both crews are empty — a draw.' });
    return {
      steps: battle.steps,
      logs: battle.logs,
      aSurvived: false,
      bSurvived: false,
      draw: true,
      aFinalBoard: [],
      bFinalBoard: [],
    };
  }

  battle.fireTriggers('startOfCombat', 'a');
  battle.fireTriggers('startOfCombat', 'b');
  battle.cleanupDeaths();
  drainQueuedAttacks(battle);

  let turn: Side =
    a.length > b.length ? 'a' : b.length > a.length ? 'b' : Math.random() < 0.5 ? 'a' : 'b';
  let pointerA = 0;
  let pointerB = 0;
  let guard = 0;

  while (battle.aliveCount('a') > 0 && battle.aliveCount('b') > 0 && guard < 300) {
    guard += 1;
    if (turn === 'a') pointerA = performTurn(battle, 'a', pointerA);
    else pointerB = performTurn(battle, 'b', pointerB);
    drainQueuedAttacks(battle);

    // Neither side can still deal damage — stop rather than spin.
    const aCanAct = battle.board('a').some((m) => m.health > 0 && m.attack > 0);
    const bCanAct = battle.board('b').some((m) => m.health > 0 && m.attack > 0);
    if (!aCanAct && !bCanAct) break;

    turn = turn === 'a' ? 'b' : 'a';
  }

  const aSurvived = battle.aliveCount('a') > 0;
  const bSurvived = battle.aliveCount('b') > 0;
  battle.push({
    kind: 'end',
    text: aSurvived && !bSurvived ? 'Victory!' : bSurvived && !aSurvived ? 'Defeat.' : 'A draw.',
  });

  return {
    steps: battle.steps,
    logs: battle.logs,
    aSurvived,
    bSurvived,
    draw: aSurvived === bSurvived,
    aFinalBoard: battle.board('a').filter((m) => m.health > 0),
    bFinalBoard: battle.board('b').filter((m) => m.health > 0),
  };
}

const TIER_DAMAGE: Record<number, number> = { 1: 3, 2: 4, 3: 5, 4: 6, 5: 7, 6: 8 };

export function computeCombatDamage(
  winnerTavernTier: number,
  survivingWinnerBoard: MinionInstance[],
): number {
  const base = TIER_DAMAGE[Math.min(Math.max(winnerTavernTier, 1), 6)] ?? 8;
  return base + survivingWinnerBoard.reduce((sum, m) => sum + (CARDS_BY_ID[m.cardId]?.tier ?? 1), 0);
}
