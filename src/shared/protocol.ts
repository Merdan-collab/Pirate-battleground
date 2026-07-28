import type { Keyword, Phase } from '../engine/types';

// Wire format shared by the server and the browser client. Everything here must
// be plain JSON — no Set/Map — since it crosses a WebSocket.

export const PROTOCOL_VERSION = 1;

export type LobbySize = 2 | 4 | 8;

export interface WireMinion {
  instanceId: string;
  cardId: string;
  attack: number;
  health: number;
  keywords: Keyword[];
  isGolden: boolean;
}

/** What every player is allowed to see about an opponent. Deliberately excludes
 * their gold, shop, and board so nobody can scout what they're about to face. */
export interface WireOpponent {
  id: string;
  name: string;
  heroId: string;
  health: number;
  maxHealth: number;
  tavernTier: number;
  alive: boolean;
  placement: number | null;
  isBot: boolean;
  connected: boolean;
  ready: boolean;
}

export interface WireSelf {
  id: string;
  name: string;
  heroId: string;
  health: number;
  maxHealth: number;
  gold: number;
  maxGold: number;
  tavernTier: number;
  upgradeCost: number | null;
  shop: (string | null)[]; // card ids
  board: WireMinion[];
  frozen: boolean;
  heroPowerUsedThisTurn: number;
  alive: boolean;
  placement: number | null;
  ready: boolean;
}

export interface WireCombatSummary {
  opponentName: string;
  isBye: boolean;
  playerBoardBefore: WireMinion[];
  opponentBoardBefore: WireMinion[];
  logs: string[];
  result: 'WIN' | 'LOSS' | 'DRAW';
  damageDealt: number;
}

export interface WireStanding {
  id: string;
  name: string;
  heroId: string;
  placement: number | null;
}

export interface WireGameView {
  phase: Phase;
  turn: number;
  lobbySize: LobbySize;
  you: WireSelf;
  opponents: WireOpponent[];
  lastCombat: WireCombatSummary | null;
  standings: WireStanding[];
  /** Epoch ms when the current recruit phase ends; null when untimed. */
  turnEndsAt: number | null;
}

export interface WireLobbyMember {
  id: string;
  name: string;
  heroId: string | null;
  isHost: boolean;
  connected: boolean;
}

export interface WireLobbyState {
  roomCode: string;
  lobbySize: LobbySize;
  members: WireLobbyMember[];
  hostId: string;
  started: boolean;
}

// ---------------------------------------------------------------------------
// Client -> Server
// ---------------------------------------------------------------------------

export type ClientMessage =
  | { type: 'CREATE_ROOM'; name: string; lobbySize: LobbySize }
  | { type: 'JOIN_ROOM'; name: string; roomCode: string }
  | { type: 'REJOIN'; token: string }
  | { type: 'CHOOSE_HERO'; heroId: string }
  | { type: 'SET_LOBBY_SIZE'; lobbySize: LobbySize }
  | { type: 'START_GAME' }
  | { type: 'LEAVE_ROOM' }
  | { type: 'BUY'; shopIndex: number; toIndex?: number }
  | { type: 'SELL'; instanceId: string }
  | { type: 'REROLL' }
  | { type: 'FREEZE' }
  | { type: 'UPGRADE' }
  | { type: 'HERO_POWER'; targetInstanceId?: string }
  | { type: 'REORDER'; instanceId: string; toIndex: number }
  | { type: 'READY' };

// ---------------------------------------------------------------------------
// Server -> Client
// ---------------------------------------------------------------------------

export type ServerMessage =
  | { type: 'JOINED'; playerId: string; token: string; lobby: WireLobbyState }
  | { type: 'LOBBY'; lobby: WireLobbyState }
  | { type: 'GAME'; view: WireGameView }
  | { type: 'ERROR'; message: string };
