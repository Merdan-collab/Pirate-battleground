// Core type system for the auto-battler engine.
// Mirrors Hearthstone Battlegrounds mechanics: shop/tavern economy, tiered minion
// pool, tribe synergies, golden triples, positional auto-combat, and the
// event-driven trigger system that most Battlegrounds minions are built on.

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
  MARINE_WORLD_GOV: 'Marines & World Gov.',
  KAIDO_DOFLAMINGO: 'Kaido & Doflamingo',
  STRAWHAT_ALLIANCE: 'Straw Hat Alliance',
  REVOLUTIONARY_ARMY: 'Revolutionary Army',
  GOROSEI_ADMIRAL: 'Gorosei & Admirals',
  FREE_PIRATES: 'Free Pirate Crews',
  NONE: 'Neutral',
};

export const ALL_TRIBES: Tribe[] = [
  'BIG_MOM_VINSMOKE',
  'MARINE_WORLD_GOV',
  'KAIDO_DOFLAMINGO',
  'STRAWHAT_ALLIANCE',
  'REVOLUTIONARY_ARMY',
  'GOROSEI_ADMIRAL',
  'FREE_PIRATES',
];

export type Keyword =
  | 'Taunt'
  | 'DivineShield'
  | 'Poisonous'
  | 'Windfury'
  | 'MegaWindfury'
  | 'Reborn'
  | 'Cleave';

export type TargetSelector =
  | 'self'
  | 'allFriendly'
  | 'otherFriendly'
  | 'randomFriendly'
  | 'randomOtherFriendly'
  | 'adjacent'
  | 'leftmost'
  | 'rightmost'
  | 'highestAttackFriendly'
  | 'lowestAttackFriendly'
  | 'eventSubject'; // the minion that caused the trigger to fire

// --------------------------------------------------------------------------
// Effects
// --------------------------------------------------------------------------

export interface EffectBuff {
  type: 'buff';
  target: TargetSelector;
  attack: number;
  health: number;
  count?: number; // for random selectors
  tribe?: Tribe; // restrict to a tribe
  /** Scales the buff by how many friendly minions of this tribe are on board. */
  perTribeCount?: Tribe;
  includeSelfInCount?: boolean;
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
  /** Scallywag's token: attacks the moment it arrives. */
  attackImmediately?: boolean;
}

/** Ghastcoiler / The Tide Razor: summon random minions matching a filter. */
export interface EffectSummonRandom {
  type: 'summonRandom';
  count: number;
  tribe?: Tribe;
  maxTier?: number;
  requireDeathrattle?: boolean;
  withTaunt?: boolean;
}

export interface EffectDamageEnemy {
  type: 'damageEnemy';
  amount: number;
  count?: number;
  /** Red Whelp: damage equals the number of friendly minions of this tribe. */
  perTribeCount?: Tribe;
  target?: 'random' | 'all' | 'leftmost' | 'adjacentToTarget';
}

export interface EffectDamageSelfHero {
  type: 'damageOwnHero';
  amount: number;
}

export interface EffectGainGold {
  type: 'gainGold';
  amount: number;
}

export interface EffectAddToHand {
  type: 'addToHand';
  count: number;
  tribe?: Tribe;
  /** Exact card to add; otherwise a random one matching the filters. */
  cardId?: string;
  atTavernTier?: boolean;
}

export interface EffectFreeRefresh {
  type: 'freeRefresh';
}

export interface EffectReduceUpgradeCost {
  type: 'reduceUpgradeCost';
  amount: number;
}

/** Monstrous Macaw: fire another friendly minion's Deathrattle. */
export interface EffectTriggerFriendlyDeathrattle {
  type: 'triggerFriendlyDeathrattle';
  count: number;
}

export interface EffectDoubleAttack {
  type: 'doubleAttack';
  target: TargetSelector;
}

/** Annihilan Battlemaster: +Health for damage the owning hero has taken. */
export interface EffectBuffPerHeroDamage {
  type: 'buffPerHeroDamage';
  healthPerDamage: number;
}

export interface EffectAttackImmediately {
  type: 'attackImmediately';
  target: TargetSelector;
}

export type Effect =
  | EffectBuff
  | EffectGainKeyword
  | EffectSummon
  | EffectSummonRandom
  | EffectDamageEnemy
  | EffectDamageSelfHero
  | EffectGainGold
  | EffectAddToHand
  | EffectFreeRefresh
  | EffectReduceUpgradeCost
  | EffectTriggerFriendlyDeathrattle
  | EffectDoubleAttack
  | EffectBuffPerHeroDamage
  | EffectAttackImmediately;

// --------------------------------------------------------------------------
// Triggers
// --------------------------------------------------------------------------

export type TriggerEvent =
  /** Recruit phase: you bought/played a minion from the tavern. */
  | 'afterYouPlay'
  /** Recruit phase: this minion was sold. */
  | 'afterSelfSold'
  /** Recruit phase: end of your turn. */
  | 'endOfTurn'
  /** Combat: any friendly minion (including tokens) entered the board. */
  | 'afterFriendlySummoned'
  /** Combat: a friendly minion died. */
  | 'afterFriendlyDies'
  /** Combat: this minion took damage and lived (Frenzy / Imp Gang Boss). */
  | 'afterSelfSurvivesDamage'
  /** Combat: this minion attacked. */
  | 'afterSelfAttacks'
  /** Combat: this minion killed with excess damage. */
  | 'onOverkill'
  /** Combat: fires once before the first attack. */
  | 'startOfCombat';

export interface Trigger {
  on: TriggerEvent;
  /** Only fire when the minion that caused the event has this tribe. */
  tribe?: Tribe;
  /** Fires at most once per combat (Frenzy-style). */
  oncePerCombat?: boolean;
  effects: Effect[];
}

/** Continuously-applied buff, e.g. "Your other Pirates have +1/+1".
 * Recomputed from base stats whenever the board changes. */
export interface Aura {
  tribe?: Tribe;
  attack: number;
  health: number;
  keyword?: Keyword;
}

/** Board-wide rule modifiers (Brann / Baron Rivendare / Khadgar). */
export type GlobalModifier = 'doubleBattlecry' | 'doubleDeathrattle' | 'doubleSummon';

export interface CardDef {
  id: string;
  name: string;
  /** Rules text, written the way the card would read in hand. */
  text: string;
  flavor: string;
  tier: number; // 1-6
  tribe: Tribe;
  attack: number;
  health: number;
  keywords: Keyword[];
  battlecry?: Effect[];
  deathrattle?: Effect[];
  triggers?: Trigger[];
  aura?: Aura;
  modifier?: GlobalModifier;
  /** Freedealing Gambler: sells for more than the usual refund. */
  sellValue?: number;
  isToken?: boolean;
}

export interface MinionInstance {
  instanceId: string;
  cardId: string;
  attack: number;
  health: number;
  /** Stats before auras — auras are recomputed on top of these. */
  baseAttack: number;
  baseHealth: number;
  keywords: Set<Keyword>;
  /** Keywords granted permanently (survive aura recomputation). */
  grantedKeywords: Set<Keyword>;
  isGolden: boolean;
  /** Trigger indices that already fired their once-per-combat use. */
  spentTriggers?: Set<number>;
  justReborn?: boolean;
  /** Buffs banked by a hero power for the next combat only. */
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
  portrait: string;
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
  heroPowerBanked: boolean;
  tavernTier: number;
  turnReachedCurrentTier: number;
  /** Deck Swabbie: discount applied to the next tavern upgrade. */
  upgradeDiscount: number;
  /** Refreshing Anomaly: number of free refreshes banked. */
  freeRefreshes: number;
  gold: number;
  maxGold: number;
  goldBankNextTurn: number;
  board: MinionInstance[]; // max 7
  hand: MinionInstance[]; // max 10
  shop: (CardDef | null)[];
  frozen: boolean;
  lastCombatBoard: MinionInstance[] | null;
  triplesThisGame: number;
  turnsSurvived: number;
  placement: number | null;
  botTribeBias: Tribe | null;
  ready: boolean;
  connected: boolean;
}

export interface CombatSummary {
  playerId: string;
  playerName: string;
  opponentId: string | null;
  opponentName: string;
  isBye: boolean;
  playerBoardBefore: MinionInstance[];
  opponentBoardBefore: MinionInstance[];
  /** Replayable battle for the animated viewer. */
  steps: import('./combat').CombatStep[];
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
