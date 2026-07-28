import { CARDS_BY_ID } from '../data/cards';
import { applyEffects, type EffectContext } from './effects';
import { instantiateMinion } from './minion';
import { drawFromPool, type Pool } from './pool';
import { MAX_BOARD_SIZE } from './shop';
import type { BuyResult } from './shop';
import type { PlayerState } from './types';

const TARGETED_HEROES = new Set([
  'luffy',
  'zoro',
  'sanji',
  'law',
  'robin',
  'kaido',
  'doflamingo',
  'akainu',
]);

export function heroPowerNeedsTarget(heroId: string): boolean {
  return TARGETED_HEROES.has(heroId);
}

export interface HeroPowerArgs {
  player: PlayerState;
  pool: Pool;
  targetInstanceId?: string;
}

export function useHeroPower(args: HeroPowerArgs): BuyResult {
  const { player, pool, targetInstanceId } = args;
  const power = player.hero.power;
  if (power.usesPerTurn <= 0) return { ok: false, reason: 'Passive ability' };
  if (player.heroPowerUsedThisTurn >= power.usesPerTurn) {
    return { ok: false, reason: 'Already used this turn' };
  }
  if (player.gold < power.cost) return { ok: false, reason: 'Not enough gold' };

  const target = targetInstanceId
    ? player.board.find((m) => m.instanceId === targetInstanceId)
    : undefined;
  if (heroPowerNeedsTarget(player.hero.id) && !target) {
    return { ok: false, reason: 'Choose a friendly minion' };
  }

  switch (player.hero.id) {
    case 'luffy': {
      target!.attack += 2;
      target!.health += 2;
      break;
    }
    case 'zoro': {
      target!.keywords.add('Windfury');
      break;
    }
    case 'sanji': {
      target!.pendingAttack = (target!.pendingAttack ?? 0) + 3;
      break;
    }
    case 'law': {
      const a = target!.attack;
      target!.attack = target!.health;
      target!.health = a;
      break;
    }
    case 'robin': {
      if (player.board.length >= MAX_BOARD_SIZE) {
        return { ok: false, reason: 'Board is full' };
      }
      const def = CARDS_BY_ID[target!.cardId];
      if (!def) return { ok: false, reason: 'Unknown card' };
      const copy = instantiateMinion(def, target!.isGolden);
      const idx = player.board.findIndex((m) => m.instanceId === target!.instanceId);
      player.board.splice(idx + 1, 0, copy);
      break;
    }
    case 'shanks': {
      player.frozen = true;
      player.gold = Math.min(player.maxGold, player.gold + 1);
      break;
    }
    case 'bigmom': {
      target!.keywords.add('Reborn');
      break;
    }
    case 'kaido': {
      target!.health += 4;
      break;
    }
    case 'doflamingo': {
      target!.keywords.add('Poisonous');
      break;
    }
    case 'akainu': {
      target!.pendingAttack = (target!.pendingAttack ?? 0) + 2;
      target!.pendingHealth = (target!.pendingHealth ?? 0) + 2;
      target!.pendingKeywords = [...(target!.pendingKeywords ?? []), 'Poisonous'];
      break;
    }
    case 'sabo': {
      if (player.board.length >= MAX_BOARD_SIZE) {
        return { ok: false, reason: 'Board is full' };
      }
      const drawn = drawFromPool(pool, player.tavernTier);
      if (!drawn) return { ok: false, reason: 'No cards left in the pool' };
      const minion = instantiateMinion(drawn);
      player.board.push(minion);
      if (drawn.battlecry) {
        const ctx: EffectContext = {
          self: minion,
          ownerBoard: player.board,
          onGainGold: (amt) => {
            player.gold = Math.min(player.maxGold, player.gold + amt);
          },
        };
        applyEffects(drawn.battlecry, ctx);
      }
      break;
    }
    default:
      return { ok: false, reason: 'Unknown hero' };
  }

  player.gold -= power.cost;
  player.heroPowerUsedThisTurn += 1;
  return { ok: true };
}

/** Nami's passive: resolved automatically at the start of each recruit phase. */
export function maybeApplyPassiveHeroPower(player: PlayerState): void {
  if (player.hero.id === 'nami' && Math.random() < 0.4) {
    player.gold = Math.min(player.maxGold, player.gold + 1);
  }
}
