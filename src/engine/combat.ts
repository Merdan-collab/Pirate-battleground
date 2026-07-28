import { CARDS_BY_ID } from '../data/cards';
import { applyEffects, damageMinion, type EffectContext } from './effects';
import type { Keyword, MinionInstance } from './types';

function cardName(m: MinionInstance): string {
  return CARDS_BY_ID[m.cardId]?.name ?? '???';
}

function cloneForCombat(m: MinionInstance): MinionInstance {
  const keywords = new Set(m.keywords);
  for (const k of m.pendingKeywords ?? []) keywords.add(k);
  return {
    ...m,
    attack: m.attack + (m.pendingAttack ?? 0),
    health: m.health + (m.pendingHealth ?? 0),
    keywords,
    divineShieldConsumedThisFight: false,
    frenzyTriggered: false,
    justReborn: false,
  };
}

function aliveCount(list: MinionInstance[]): number {
  return list.filter((m) => m.health > 0).length;
}

function findNextAlive(list: MinionInstance[], pointer: number): number {
  const n = list.length;
  for (let i = 0; i < n; i++) {
    const idx = (pointer + i) % n;
    if (list[idx].health > 0) return idx;
  }
  return -1;
}

function chooseDefender(defenders: MinionInstance[]): MinionInstance | null {
  const alive = defenders.filter((m) => m.health > 0);
  if (alive.length === 0) return null;
  const taunts = alive.filter((m) => m.keywords.has('Taunt'));
  const pool = taunts.length > 0 ? taunts : alive;
  return pool[Math.floor(Math.random() * pool.length)];
}

function triggerFrenzy(
  m: MinionInstance,
  board: MinionInstance[],
  enemyBoard: MinionInstance[],
  logs: string[],
  wasShielded: boolean,
  amount: number,
): void {
  if (wasShielded || amount <= 0 || m.health <= 0 || m.frenzyTriggered) return;
  const def = CARDS_BY_ID[m.cardId];
  if (!def?.frenzy) return;
  m.frenzyTriggered = true;
  const ctx: EffectContext = {
    self: m,
    ownerBoard: board,
    enemyBoard,
    log: (t) => logs.push(t),
  };
  applyEffects(def.frenzy, ctx);
  logs.push(`${cardName(m)} goes into a frenzy!`);
}

function createRebornCopy(m: MinionInstance): MinionInstance {
  const def = CARDS_BY_ID[m.cardId];
  return {
    instanceId: `${m.instanceId}_reborn_${Math.random().toString(36).slice(2, 7)}`,
    cardId: m.cardId,
    attack: m.baseAttack,
    health: 1,
    baseAttack: m.baseAttack,
    baseHealth: m.baseHealth,
    keywords: new Set((def?.keywords ?? []).filter((k) => k !== 'Reborn')),
    isGolden: m.isGolden,
    justReborn: true,
  };
}

function handleDeath(
  m: MinionInstance,
  board: MinionInstance[],
  enemyBoard: MinionInstance[],
  logs: string[],
): void {
  if (m.health > 0) return;
  const def = CARDS_BY_ID[m.cardId];
  if (def?.deathrattle) {
    const ctx: EffectContext = {
      self: m,
      ownerBoard: board,
      enemyBoard,
      log: (t) => logs.push(t),
    };
    applyEffects(def.deathrattle, ctx);
  }
  const removeIdx = board.indexOf(m);
  const shouldReborn = m.keywords.has('Reborn') && !m.justReborn;
  if (removeIdx !== -1) board.splice(removeIdx, 1);
  logs.push(`${cardName(m)} dies.`);
  if (shouldReborn && board.length < 7) {
    const reborn = createRebornCopy(m);
    const insertAt = Math.min(removeIdx, board.length);
    board.splice(insertAt, 0, reborn);
    logs.push(`${cardName(m)} is reborn!`);
  }
}

function resolveTrade(
  attacker: MinionInstance,
  defender: MinionInstance,
  attackerBoard: MinionInstance[],
  defenderBoard: MinionInstance[],
  logs: string[],
): void {
  const aAtk = attacker.attack;
  const dAtk = defender.attack;
  logs.push(`${cardName(attacker)} (${aAtk}/${attacker.health}) attacks ${cardName(defender)} (${dAtk}/${defender.health})`);
  const defenderShielded = damageMinion(defender, aAtk);
  const attackerShielded = damageMinion(attacker, dAtk);

  if (attacker.keywords.has('Poisonous') && !defenderShielded && aAtk > 0 && defender.health > 0) {
    defender.health = 0;
    logs.push(`${cardName(defender)} is poisoned!`);
  }
  if (defender.keywords.has('Poisonous') && !attackerShielded && dAtk > 0 && attacker.health > 0) {
    attacker.health = 0;
    logs.push(`${cardName(attacker)} is poisoned!`);
  }

  triggerFrenzy(defender, defenderBoard, attackerBoard, logs, defenderShielded, aAtk);
  triggerFrenzy(attacker, attackerBoard, defenderBoard, logs, attackerShielded, dAtk);

  handleDeath(defender, defenderBoard, attackerBoard, logs);
  handleDeath(attacker, attackerBoard, defenderBoard, logs);
}

function performAttack(
  attackers: MinionInstance[],
  defenders: MinionInstance[],
  pointer: number,
  logs: string[],
): number {
  const idx = findNextAlive(attackers, pointer);
  if (idx === -1) return pointer;
  const attacker = attackers[idx];
  const strikes = attacker.keywords.has('MegaWindfury') ? 4 : attacker.keywords.has('Windfury') ? 2 : 1;
  for (let s = 0; s < strikes; s++) {
    if (attacker.health <= 0) break;
    if (aliveCount(defenders) === 0) break;
    const defender = chooseDefender(defenders);
    if (!defender) break;
    resolveTrade(attacker, defender, attackers, defenders, logs);
  }
  return idx + 1;
}

function runStartOfCombat(
  side: MinionInstance[],
  enemySide: MinionInstance[],
  logs: string[],
): void {
  for (const m of [...side]) {
    if (m.health <= 0) continue;
    const def = CARDS_BY_ID[m.cardId];
    if (!def?.startOfCombat) continue;
    const ctx: EffectContext = {
      self: m,
      ownerBoard: side,
      enemyBoard: enemySide,
      log: (t) => logs.push(t),
    };
    applyEffects(def.startOfCombat, ctx);
  }
}

export interface CombatOutcome {
  logs: string[];
  aFinalBoard: MinionInstance[];
  bFinalBoard: MinionInstance[];
  aSurvived: boolean;
  bSurvived: boolean;
  draw: boolean;
}

export function simulateCombat(boardA: MinionInstance[], boardB: MinionInstance[]): CombatOutcome {
  const logs: string[] = [];
  const a = boardA.map(cloneForCombat);
  const b = boardB.map(cloneForCombat);

  if (a.length === 0 && b.length === 0) {
    return { logs, aFinalBoard: [], bFinalBoard: [], aSurvived: false, bSurvived: false, draw: true };
  }

  runStartOfCombat(a, b, logs);
  runStartOfCombat(b, a, logs);

  let turn: 'A' | 'B' = a.length > b.length ? 'A' : b.length > a.length ? 'B' : Math.random() < 0.5 ? 'A' : 'B';
  let pointerA = 0;
  let pointerB = 0;
  let safety = 0;

  while (aliveCount(a) > 0 && aliveCount(b) > 0 && safety < 500) {
    safety += 1;
    if (turn === 'A') {
      pointerA = performAttack(a, b, pointerA, logs);
    } else {
      pointerB = performAttack(b, a, pointerB, logs);
    }
    turn = turn === 'A' ? 'B' : 'A';
  }

  const aSurvived = aliveCount(a) > 0;
  const bSurvived = aliveCount(b) > 0;
  return {
    logs,
    aFinalBoard: a.filter((m) => m.health > 0),
    bFinalBoard: b.filter((m) => m.health > 0),
    aSurvived,
    bSurvived,
    draw: !aSurvived && !bSurvived,
  };
}

/** Reverts survivors to their pre-combat (persistent) stats — damage & Frenzy
 * buffs heal between fights, only keyword consumption (Divine Shield/Reborn
 * being used up) and deaths persist — and mints fresh instances for anything
 * summoned mid-fight (tokens, Reborn copies). */
export function syncBoardAfterCombat(
  persistentBoard: MinionInstance[],
  finalEphemeral: MinionInstance[],
): MinionInstance[] {
  const result: MinionInstance[] = [];
  for (const em of finalEphemeral) {
    const persisted = persistentBoard.find((p) => p.instanceId === em.instanceId);
    if (persisted) {
      const keptKeywords = new Set<Keyword>();
      for (const k of persisted.keywords) if (em.keywords.has(k)) keptKeywords.add(k);
      result.push({
        ...persisted,
        keywords: keptKeywords,
        pendingAttack: 0,
        pendingHealth: 0,
        pendingKeywords: [],
      });
    } else {
      const def = CARDS_BY_ID[em.cardId];
      result.push({
        instanceId: em.instanceId,
        cardId: em.cardId,
        attack: em.baseAttack,
        health: em.baseHealth,
        baseAttack: em.baseAttack,
        baseHealth: em.baseHealth,
        keywords: new Set(def?.keywords ?? []),
        isGolden: em.isGolden,
      });
    }
  }
  return result;
}

const TIER_DAMAGE: Record<number, number> = { 1: 3, 2: 4, 3: 5, 4: 6, 5: 7, 6: 8 };

export function computeCombatDamage(
  winnerTavernTier: number,
  survivingWinnerBoard: MinionInstance[],
): number {
  const base = TIER_DAMAGE[Math.min(Math.max(winnerTavernTier, 1), 6)] ?? 8;
  const bonus = survivingWinnerBoard.reduce((sum, m) => sum + (m.isGolden ? 2 : 1), 0);
  return base + bonus;
}
