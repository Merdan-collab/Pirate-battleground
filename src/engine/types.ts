// Core type system for the auto-battler engine.
// Mirrors Hearthstone Battlegrounds mechanics: shop/tavern economy, tiered minion
// pool, tribe synergies, golden triples, and positional auto-combat.

export type Tribe =
  | 'BIG_MOM_VINSMOKE' // was Quilboar
  | 'MARINE_WORLD_GOV' // was Pirate
  | 'KAIDO_DOFLAMINGO' // was Beast
  | 'STRAWHAT_ALLIANCE' // was Elemental
  | 'REVOLUTIONARY_ARMY' // was Dragon
  | 'GOROSEI_ADMIRAL' // was Demon
  | 'FREE_PIRATES' // was Murloc
  | 'NONE';

export const TRIBE_NAMES: Record<Tribe, string> = {
  BIG_MOM_VINSMOKE: 'Big Mom & Vinsmoke',
  MARINE_WORLD_GOV: 'Marines & World Government',
  KAIDO_DOFLAMINGO: 'Kaido & Doflamingo',
  STRAWHAT_ALLIANCE: 'Straw Hat Alliance',
  REVOLUTIONARY_ARMY: 'Revolutionary Army',
  GOROSEI_ADMIRAL: 'Gorosei & Admirals',
  FREE_PIRATES: 'Free Pirate Crews',
  NONE: 'Neutral',
};

export const TRIBE_BLURB: Record<Tribe, string> = {
  BIG_MOM_VINSMOKE: 'Family Bond: grow stronger after surviving damage in combat.',
  MARINE_WORLD_GOV: 'Reinforcements: Deathrattles call in fresh marine troops.',
  KAIDO_DOFLAMINGO: 'Raw Power: huge stats, and neighbours are enraged when one falls.',
  STRAWHAT_ALLIANCE: 'Chain Reaction: every new ally lifts the rest of the crew.',
  REVOLUTIONARY_ARMY: 'Liberation: few but mighty minions that empower the whole board.',
  GOROSEI_ADMIRAL: 'Absolute Power: sacrifice your own minions for enormous value.',
  FREE_PIRATES: 'Swarm: cheap crews that buff each other as new members arrive.',
  NONE: '',
};

export type Keyword =
  | 'Taunt'
  | 'DivineShield'
  | 'Poisonous'
  | 'Windfury'
  | 'MegaWindfury'
  | 'Reborn'
  | 'Stealth';

export type TargetSelector =
  | 'self'
  | 'allFriendly'
  | 'otherFriendly'
  | 'randomFriendly'
  | 'randomOtherFriendly'
  | 'adjacent'
  | 'leftAdjacent'
  | 'rightAdjacent'
  | 'highestAttackFriendly'
  | 'lowestHealthFriendly';

export interface EffectBuffSelf {
  type: 'buffSelf';
  attack: number;
  health: number;
}

export interface EffectBuffFriendly {
  type: 'buffFriendly';
  attack: number;
  health: number;
  target: TargetSelector;
  count?: number; // for random selectors, how many targets
  tribe?: Tribe; // restrict to a tribe
}

export interface EffectGainKeyword {
  type: 'gainKeyword';
  keyword: Keyword;
  target: TargetSelector;
  count?: number;
  tribe?: Tribe;
}

export interface EffectSummon {
  type: 'summon';
  cardId: string;
  count: number;
}

export interface EffectDamageRandomEnemy {
  type: 'damageRandomEnemy';
  amount: number;
  count?: number;
}

export interface EffectDamageAllEnemies {
  type: 'damageAllEnemies';
  amount: number;
}

export interface EffectGainGold {
  type: 'gainGold';
  amount: number;
}

export interface EffectAddRandomToHand {
  type: 'addRandomToHand';
  tribe?: Tribe;
  tier?: number;
  count: number;
}

export interface EffectDamageSelf {
  type: 'damageSelf';
  amount: number;
}

export interface EffectBuffSelfPerTribeCount {
  type: 'buffSelfPerTribeCount';
  tribe: Tribe;
  attack: number;
  health: number;
  includeSelf?: boolean;
}

export interface EffectSacrificeFriendlyForSelf {
  type: 'sacrificeFriendlyForSelf';
  damage: number;
  attack: number;
  health: number;
}

export interface EffectDamageAllFriendly {
  type: 'damageAllFriendly';
  amount: number;
  excludeSelf?: boolean;
}

export type Effect =
  | EffectBuffSelf
  | EffectBuffFriendly
  | EffectGainKeyword
  | EffectSummon
  | EffectDamageRandomEnemy
  | EffectDamageAllEnemies
  | EffectGainGold
  | EffectAddRandomToHand
  | EffectDamageSelf
  | EffectBuffSelfPerTribeCount
  | EffectSacrificeFriendlyForSelf
  | EffectDamageAllFriendly;

// Aura: a continuously-recalculated buff, e.g. "your other Strawhat-allierede have +1/+1
// for each other Strawhat-allieret you have". Recomputed at start of every combat.
export interface Aura {
  tribe: Tribe; // aura applies to friendly minions of this tribe
  perTribeCountOnBoard?: Tribe; // if set, scales with count of this tribe on board
  attack: number;
  health: number;
  affectsSelf?: boolean;
}

export interface CardDef {
  id: string;
  name: string;
  flavor: string; // short one-piece flavored description
  tier: number; // 1-6
  tribe: Tribe;
  attack: number;
  health: number;
  keywords: Keyword[];
  battlecry?: Effect[];
  deathrattle?: Effect[];
  startOfCombat?: Effect[];
  /** Big Mom & Vinsmoke signature trigger: fires once per combat, the first time
   * this minion takes damage and survives. */
  frenzy?: Effect[];
  aura?: Aura;
  isToken?: boolean; // tokens are not purchasable/rollable, only summoned
  poolCount?: number; // copies in the shared pool (default by tier)
}

export interface MinionInstance {
  instanceId: string;
  cardId: string;
  attack: number;
  health: number;
  baseAttack: number;
  baseHealth: number;
  keywords: Set<Keyword>;
  isGolden: boolean;
  divineShieldConsumedThisFight?: boolean;
  justReborn?: boolean;
  frenzyTriggered?: boolean; // Big Mom/Vinsmoke "survives damage" effect (once per combat)
  /** Buffs banked by a hero power for the next combat only; applied when the
   * combat clone is built, then cleared afterwards regardless of outcome. */
  pendingAttack?: number;
  pendingHealth?: number;
  pendingKeywords?: Keyword[];
}

export interface HeroPower {
  name: string;
  description: string;
  cost: number;
  usesPerTurn: number;
}

export interface HeroDef {
  id: string;
  name: string;
  title: string;
  power: HeroPower;
  startingHealth: number;
  portrait: string; // emoji stand-in
  onBuy?: Effect[]; // passive applied contextually (engine checks hero id directly for special powers)
}

export type Phase = 'SETUP' | 'HERO_SELECT' | 'RECRUIT' | 'COMBAT' | 'GAME_OVER';

export interface PlayerState {
  id: string;
  name: string;
  isHuman: boolean;
  isBot: boolean;
  alive: boolean;
  health: number;
  maxHealth: number;
  armor: number;
  hero: HeroDef;
  heroPowerUsedThisTurn: number;
  heroPowerBanked: boolean; // some powers passive/always-on
  tavernTier: number;
  turnReachedCurrentTier: number;
  gold: number;
  maxGold: number;
  goldBankNextTurn: number; // for hero powers that store gold
  board: MinionInstance[]; // max 7
  hand: MinionInstance[]; // max 10 (in shop phase, purchased minions sit here before placed)
  shop: (CardDef | null)[]; // current tavern offering
  frozen: boolean;
  lastCombatBoard: MinionInstance[] | null; // snapshot used for "ghost" byes
  triplesThisGame: number;
  turnsSurvived: number;
  placement: number | null;
  botTribeBias: Tribe | null;
}

export interface CombatSummary {
  playerId: string;
  playerName: string;
  opponentId: string | null;
  opponentName: string;
  isBye: boolean;
  playerBoardBefore: MinionInstance[];
  opponentBoardBefore: MinionInstance[];
  logs: string[];
  result: 'WIN' | 'LOSS' | 'DRAW';
  damageDealt: number;
}

export interface GameState {
  phase: Phase;
  lobbySize: 2 | 4 | 8;
  players: PlayerState[];
  pool: import('./pool').Pool;
  turn: number;
  lastRoundPairs: [string, string][];
  lastCombatSummaries: CombatSummary[];
  log: string[];
  standings: PlayerState[];
}

