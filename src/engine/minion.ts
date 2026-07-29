import type { CardDef, Keyword, MinionInstance } from './types';

let instanceCounter = 0;
function nextInstanceId(): string {
  instanceCounter += 1;
  return `m${instanceCounter}_${Math.random().toString(36).slice(2, 7)}`;
}

export function instantiateMinion(card: CardDef, golden = false): MinionInstance {
  const mult = golden ? 2 : 1;
  return {
    instanceId: nextInstanceId(),
    cardId: card.id,
    attack: card.attack * mult,
    health: card.health * mult,
    baseAttack: card.attack * mult,
    baseHealth: card.health * mult,
    keywords: new Set(card.keywords),
    grantedKeywords: new Set<Keyword>(),
    isGolden: golden,
  };
}

export function cloneMinion(m: MinionInstance): MinionInstance {
  return {
    ...m,
    keywords: new Set(m.keywords),
    grantedKeywords: new Set(m.grantedKeywords),
    spentTriggers: m.spentTriggers ? new Set(m.spentTriggers) : undefined,
    pendingKeywords: m.pendingKeywords ? [...m.pendingKeywords] : undefined,
  };
}
