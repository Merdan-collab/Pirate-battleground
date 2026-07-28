import { CARDS_BY_ID } from '../data/cards';
import { heroPowerNeedsTarget, useHeroPower } from './heroPowers';
import { MAX_BOARD_SIZE, MAX_TAVERN_TIER, buyMinion, manualReroll, sellMinion, upgradeTavern } from './shop';
import type { CardDef, GameState, MinionInstance, PlayerState } from './types';

function scoreCard(card: CardDef, bot: PlayerState): number {
  let score = card.attack + card.health;
  if (card.keywords.includes('Taunt')) score += 2;
  if (card.keywords.includes('DivineShield')) score += 3;
  if (card.keywords.includes('Poisonous')) score += 3;
  if (card.keywords.includes('Windfury')) score += 2;
  if (card.keywords.includes('Reborn')) score += 2;
  if (card.battlecry) score += 2;
  if (card.deathrattle) score += 1;
  if (card.frenzy) score += 1;
  if (bot.botTribeBias && card.tribe === bot.botTribeBias) {
    const alreadyOnBoard = bot.board.filter(
      (m) => CARDS_BY_ID[m.cardId]?.tribe === card.tribe,
    ).length;
    score += 3 + alreadyOnBoard * 2;
  }
  return score;
}

function scoreMinion(m: MinionInstance, bot: PlayerState): number {
  const def = CARDS_BY_ID[m.cardId];
  if (!def) return 0;
  return scoreCard(def, bot) + (m.isGolden ? 5 : 0);
}

function targetTierForTurn(turn: number): number {
  if (turn <= 1) return 1;
  if (turn <= 3) return 2;
  if (turn <= 5) return 3;
  if (turn <= 7) return 4;
  if (turn <= 9) return 5;
  return 6;
}

/** Runs a bot's entire recruit phase in one synchronous pass: upgrades,
 * buys, sells, rerolls, and spends its hero power using simple heuristics. */
export function runBotTurn(bot: PlayerState, state: GameState): void {
  let rerolls = 0;
  const maxRerolls = 4;
  let safety = 0;

  while (safety < 40) {
    safety += 1;

    const target = targetTierForTurn(state.turn);
    if (bot.tavernTier < Math.min(target, MAX_TAVERN_TIER) && bot.gold >= 4) {
      const res = upgradeTavern(bot, state.pool, state.turn);
      if (res.ok) continue;
    }

    const options = (bot.board.length < MAX_BOARD_SIZE ? bot.shop : [])
      .map((c, idx) => (c ? { c, idx, score: scoreCard(c, bot) } : null))
      .filter((x): x is { c: CardDef; idx: number; score: number } => x !== null);
    const best = options.sort((a, b) => b.score - a.score)[0];

    if (best && bot.gold >= 3 && best.score >= 5) {
      buyMinion(bot, state.pool, best.idx);
      continue;
    }

    if (bot.board.length >= MAX_BOARD_SIZE) {
      const shopBest = bot.shop
        .map((c, idx) => (c ? { c, idx, score: scoreCard(c, bot) } : null))
        .filter((x): x is { c: CardDef; idx: number; score: number } => x !== null)
        .sort((a, b) => b.score - a.score)[0];
      if (shopBest && bot.gold >= 3) {
        const worst = [...bot.board].sort((a, b) => scoreMinion(a, bot) - scoreMinion(b, bot))[0];
        if (worst && shopBest.score > scoreMinion(worst, bot) + 3) {
          const idx = bot.board.findIndex((m) => m.instanceId === worst.instanceId);
          sellMinion(bot, state.pool, idx);
          continue;
        }
      }
    }

    if (bot.gold > 1 && rerolls < maxRerolls && (!best || best.score < 6)) {
      manualReroll(bot, state.pool);
      rerolls += 1;
      continue;
    }

    break;
  }

  if (bot.gold >= bot.hero.power.cost && bot.hero.power.usesPerTurn > 0 && bot.board.length > 0) {
    if (Math.random() < 0.7) {
      const targetMinion = [...bot.board].sort(
        (a, b) => scoreMinion(b, bot) - scoreMinion(a, bot),
      )[0];
      useHeroPower({
        player: bot,
        pool: state.pool,
        targetInstanceId: heroPowerNeedsTarget(bot.hero.id) ? targetMinion?.instanceId : undefined,
      });
    }
  }

  bot.board.sort((a, b) => {
    const ta = a.keywords.has('Taunt') ? 1 : 0;
    const tb = b.keywords.has('Taunt') ? 1 : 0;
    if (ta !== tb) return tb - ta;
    return b.health - a.health;
  });
}
