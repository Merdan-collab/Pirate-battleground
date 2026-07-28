import { HEROES } from '../data/heroes';
import { runBotTurn } from './bot';
import { computeCombatDamage, simulateCombat, syncBoardAfterCombat } from './combat';
import { maybeApplyPassiveHeroPower } from './heroPowers';
import { pairPlayers } from './pairing';
import { createPool, goldForTurn } from './pool';
import { refreshShop } from './shop';
import type { CombatSummary, GameState, HeroDef, MinionInstance, PlayerState, Tribe } from './types';

const BOT_NAME_SUFFIXES = [
  'Crew', 'Fleet', 'Pirates', 'Alliance', 'Legion', 'Armada', 'Company',
];

const TRIBES: Tribe[] = [
  'BIG_MOM_VINSMOKE',
  'MARINE_WORLD_GOV',
  'KAIDO_DOFLAMINGO',
  'STRAWHAT_ALLIANCE',
  'REVOLUTIONARY_ARMY',
  'GOROSEI_ADMIRAL',
  'FREE_PIRATES',
];

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function makePlayer(
  id: string,
  name: string,
  isHuman: boolean,
  hero: HeroDef,
  botTribeBias: Tribe | null,
): PlayerState {
  return {
    id,
    name,
    isHuman,
    isBot: !isHuman,
    alive: true,
    health: hero.startingHealth,
    maxHealth: hero.startingHealth,
    armor: 0,
    hero,
    heroPowerUsedThisTurn: 0,
    heroPowerBanked: false,
    tavernTier: 1,
    turnReachedCurrentTier: 1,
    gold: 3,
    maxGold: 10,
    goldBankNextTurn: 0,
    board: [],
    hand: [],
    shop: [],
    frozen: false,
    lastCombatBoard: null,
    triplesThisGame: 0,
    turnsSurvived: 0,
    placement: null,
    botTribeBias,
  };
}

export function createGame(lobbySize: 2 | 4 | 8, humanHeroId: string): GameState {
  const humanHero = HEROES.find((h) => h.id === humanHeroId) ?? HEROES[0];
  const availableForBots = shuffle(HEROES.filter((h) => h.id !== humanHero.id));

  const players: PlayerState[] = [
    makePlayer('human', 'You', true, humanHero, null),
  ];
  for (let i = 0; i < lobbySize - 1; i++) {
    const hero = availableForBots[i % availableForBots.length];
    const suffix = BOT_NAME_SUFFIXES[i % BOT_NAME_SUFFIXES.length];
    const bias = Math.random() < 0.6 ? TRIBES[Math.floor(Math.random() * TRIBES.length)] : null;
    players.push(makePlayer(`bot_${i + 1}`, `${hero.name}'s ${suffix}`, false, hero, bias));
  }

  const state: GameState = {
    phase: 'RECRUIT',
    lobbySize,
    players,
    pool: createPool(),
    turn: 1,
    lastRoundPairs: [],
    lastCombatSummaries: [],
    log: ['The game begins! Recruit your crew.'],
    standings: [],
  };

  startRecruitPhase(state);
  return state;
}

function alivePlayers(state: GameState): PlayerState[] {
  return state.players.filter((p) => p.alive);
}

function startRecruitPhase(state: GameState): void {
  state.phase = 'RECRUIT';
  for (const p of alivePlayers(state)) {
    p.heroPowerUsedThisTurn = 0;
    p.gold = Math.min(p.maxGold, goldForTurn(state.turn));
    refreshShop(p, state.pool);
    maybeApplyPassiveHeroPower(p);
  }
  for (const p of alivePlayers(state)) {
    if (p.isBot) runBotTurn(p, state);
  }
}

function deepCopyBoard(board: MinionInstance[]): MinionInstance[] {
  return board.map((m) => ({ ...m, keywords: new Set(m.keywords) }));
}

function resolveOneFight(
  player: PlayerState,
  opponent: PlayerState | null,
  ghost: { board: MinionInstance[]; tavernTier: number } | null,
): CombatSummary {
  const opponentBoard = opponent ? opponent.board : (ghost?.board ?? []);
  const opponentTavernTier = opponent ? opponent.tavernTier : (ghost?.tavernTier ?? 1);
  const playerBoardBefore = deepCopyBoard(player.board);
  const opponentBoardBefore = deepCopyBoard(opponentBoard);

  const outcome = simulateCombat(player.board, opponentBoard);

  let result: 'WIN' | 'LOSS' | 'DRAW';
  let damageDealt = 0;

  if (outcome.draw) {
    result = 'DRAW';
    player.board = [];
    if (opponent) opponent.board = [];
  } else if (outcome.aSurvived) {
    result = 'WIN';
    player.board = syncBoardAfterCombat(player.board, outcome.aFinalBoard);
    if (opponent) opponent.board = [];
    damageDealt = computeCombatDamage(player.tavernTier, outcome.aFinalBoard);
    if (opponent) opponent.health = Math.max(0, opponent.health - damageDealt);
  } else {
    result = 'LOSS';
    player.board = [];
    if (opponent) opponent.board = syncBoardAfterCombat(opponent.board, outcome.bFinalBoard);
    damageDealt = computeCombatDamage(opponentTavernTier, outcome.bFinalBoard);
    player.health = Math.max(0, player.health - damageDealt);
  }

  return {
    playerId: player.id,
    playerName: player.name,
    opponentId: opponent?.id ?? null,
    opponentName: opponent ? opponent.name : `${player.name}'s Mirror Image`,
    isBye: opponent === null,
    playerBoardBefore,
    opponentBoardBefore,
    logs: outcome.logs,
    result,
    damageDealt,
  };
}

function assignPlacements(newlyDead: PlayerState[], aliveBeforeCount: number): void {
  const sorted = [...newlyDead].sort((a, b) => a.health - b.health);
  let place = aliveBeforeCount;
  for (const p of sorted) {
    p.placement = place;
    place -= 1;
  }
}

export function resolveCombatPhase(state: GameState): void {
  state.phase = 'COMBAT';
  const alive = alivePlayers(state);
  const aliveBeforeCount = alive.length;

  const ghostSnapshots = new Map<string, MinionInstance[]>();
  for (const p of alive) ghostSnapshots.set(p.id, deepCopyBoard(p.board));

  const pairings = pairPlayers(alive.map((p) => p.id), state.lastRoundPairs);
  const byId = new Map(state.players.map((p) => [p.id, p]));

  const summaries: CombatSummary[] = [];
  const newRoundPairs: [string, string][] = [];

  for (const pairing of pairings) {
    const a = byId.get(pairing.a)!;
    if (pairing.b === null) {
      const others = alive.filter((p) => p.id !== a.id);
      const ghostOwner = others.length > 0 ? others[Math.floor(Math.random() * others.length)] : null;
      const ghost = ghostOwner
        ? { board: ghostSnapshots.get(ghostOwner.id) ?? [], tavernTier: ghostOwner.tavernTier }
        : null;
      summaries.push(resolveOneFight(a, null, ghost));
      newRoundPairs.push([a.id, a.id]);
    } else {
      const b = byId.get(pairing.b)!;
      summaries.push(resolveOneFight(a, b, null));
      newRoundPairs.push([a.id, b.id]);
    }
  }

  for (const p of alive) {
    p.lastCombatBoard = ghostSnapshots.get(p.id) ?? null;
    p.turnsSurvived += 1;
    if (p.health <= 0) p.alive = false;
  }

  const newlyDead = alive.filter((p) => !p.alive);
  assignPlacements(newlyDead, aliveBeforeCount);

  state.lastCombatSummaries = summaries;
  state.lastRoundPairs = newRoundPairs;

  const stillAlive = alivePlayers(state);
  if (stillAlive.length <= 1) {
    if (stillAlive.length === 1) stillAlive[0].placement = 1;
    state.phase = 'GAME_OVER';
    state.standings = [...state.players].sort(
      (a, b) => (a.placement ?? 999) - (b.placement ?? 999),
    );
    state.log.push('Game over!');
  } else {
    state.turn += 1;
    startRecruitPhase(state);
  }
}

export function endHumanTurn(state: GameState): void {
  if (state.phase !== 'RECRUIT') return;
  resolveCombatPhase(state);
}

/** Once the human is eliminated, every remaining round is bot-vs-bot with no
 * input needed — fast-forward straight to a final result instead of showing
 * shop UI for a dead player. */
export function fastForwardIfHumanEliminated(state: GameState): void {
  const human = state.players.find((p) => p.id === 'human');
  if (!human) return;
  let safety = 0;
  while (!human.alive && state.phase !== 'GAME_OVER' && safety < 200) {
    resolveCombatPhase(state);
    safety += 1;
  }
}
