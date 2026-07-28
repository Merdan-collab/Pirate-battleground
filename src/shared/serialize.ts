import { tavernUpgradeCostFor, MAX_TAVERN_TIER } from '../engine/shop';
import type { CombatSummary, GameState, MinionInstance, PlayerState } from '../engine/types';
import type {
  LobbySize,
  WireCombatSummary,
  WireGameView,
  WireMinion,
  WireOpponent,
  WireSelf,
} from './protocol';

function toWireMinion(m: MinionInstance): WireMinion {
  return {
    instanceId: m.instanceId,
    cardId: m.cardId,
    attack: m.attack,
    health: m.health,
    keywords: [...m.keywords],
    isGolden: m.isGolden,
  };
}

function toWireOpponent(p: PlayerState): WireOpponent {
  return {
    id: p.id,
    name: p.name,
    heroId: p.hero.id,
    health: p.health,
    maxHealth: p.maxHealth,
    tavernTier: p.tavernTier,
    alive: p.alive,
    placement: p.placement,
    isBot: p.isBot,
    connected: p.connected,
    ready: p.ready,
  };
}

function toWireSelf(p: PlayerState, turn: number): WireSelf {
  const cost = tavernUpgradeCostFor(p, turn);
  return {
    id: p.id,
    name: p.name,
    heroId: p.hero.id,
    health: p.health,
    maxHealth: p.maxHealth,
    gold: p.gold,
    maxGold: p.maxGold,
    tavernTier: p.tavernTier,
    upgradeCost: p.tavernTier >= MAX_TAVERN_TIER ? null : cost,
    shop: p.shop.map((c) => c?.id ?? null),
    board: p.board.map(toWireMinion),
    frozen: p.frozen,
    heroPowerUsedThisTurn: p.heroPowerUsedThisTurn,
    alive: p.alive,
    placement: p.placement,
    ready: p.ready,
  };
}

function toWireCombat(s: CombatSummary): WireCombatSummary {
  return {
    opponentName: s.opponentName,
    isBye: s.isBye,
    playerBoardBefore: s.playerBoardBefore.map(toWireMinion),
    opponentBoardBefore: s.opponentBoardBefore.map(toWireMinion),
    logs: s.logs,
    result: s.result,
    damageDealt: s.damageDealt,
  };
}

/** Builds the view for one specific player — opponents are reduced to public
 * info only, so a client can never read another player's shop or board. */
export function serializeFor(
  state: GameState,
  playerId: string,
  turnEndsAt: number | null,
): WireGameView {
  const me = state.players.find((p) => p.id === playerId);
  if (!me) throw new Error(`No such player: ${playerId}`);

  const myCombat = state.lastCombatSummaries.find((s) => s.playerId === playerId) ?? null;

  return {
    phase: state.phase,
    turn: state.turn,
    lobbySize: state.lobbySize as LobbySize,
    you: toWireSelf(me, state.turn),
    opponents: state.players.filter((p) => p.id !== playerId).map(toWireOpponent),
    lastCombat: myCombat ? toWireCombat(myCombat) : null,
    standings: state.standings.map((p) => ({
      id: p.id,
      name: p.name,
      heroId: p.hero.id,
      placement: p.placement,
    })),
    turnEndsAt,
  };
}
