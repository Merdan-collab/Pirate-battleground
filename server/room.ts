import { HEROES } from '../src/data/heroes';
import {
  allHumansReady,
  createGameFromSeats,
  pickBotHeroes,
  resolveCombatPhase,
  BOT_CREW_SUFFIXES,
  type Seat,
} from '../src/engine/game';
import { heroPowerNeedsTarget, useHeroPower } from '../src/engine/heroPowers';
import {
  buyMinion,
  manualReroll,
  reorderMinion,
  sellMinion,
  toggleFreeze,
  upgradeTavern,
} from '../src/engine/shop';
import type { GameState, PlayerState } from '../src/engine/types';
import type { ClientMessage, LobbySize, WireLobbyState } from '../src/shared/protocol';

// Recruit phases start short and lengthen as the game gets more complex, the
// same shape real Battlegrounds uses.
const TURN_SECONDS = [45, 45, 50, 50, 55, 55, 60, 60, 65, 70, 75];
export function turnSecondsFor(turn: number): number {
  return TURN_SECONDS[Math.min(turn, TURN_SECONDS.length) - 1] ?? 75;
}

export interface Member {
  id: string;
  name: string;
  token: string;
  heroId: string | null;
  connected: boolean;
  send: ((data: string) => void) | null;
}

export class Room {
  readonly code: string;
  lobbySize: LobbySize;
  hostId: string;
  members: Member[] = [];
  game: GameState | null = null;
  turnEndsAt: number | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private onChange: () => void;

  constructor(code: string, lobbySize: LobbySize, onChange: () => void) {
    this.code = code;
    this.lobbySize = lobbySize;
    this.hostId = '';
    this.onChange = onChange;
  }

  get started(): boolean {
    return this.game !== null;
  }

  lobbyState(): WireLobbyState {
    return {
      roomCode: this.code,
      lobbySize: this.lobbySize,
      hostId: this.hostId,
      started: this.started,
      members: this.members.map((m) => ({
        id: m.id,
        name: m.name,
        heroId: m.heroId,
        isHost: m.id === this.hostId,
        connected: m.connected,
      })),
    };
  }

  addMember(m: Member): void {
    if (this.members.length === 0) this.hostId = m.id;
    this.members.push(m);
  }

  findByToken(token: string): Member | undefined {
    return this.members.find((m) => m.token === token);
  }

  setConnected(memberId: string, connected: boolean): void {
    const m = this.members.find((x) => x.id === memberId);
    if (m) m.connected = connected;
    const p = this.game?.players.find((x) => x.id === memberId);
    if (p) {
      p.connected = connected;
      // A player who dropped mid-turn must not stall the lobby.
      if (!connected && this.game?.phase === 'RECRUIT') p.ready = true;
    }
    if (!connected && !this.started) {
      this.members = this.members.filter((x) => x.id !== memberId);
      if (this.hostId === memberId && this.members.length > 0) {
        this.hostId = this.members[0].id;
      }
    }
    this.maybeResolve();
  }

  startGame(): { ok: boolean; error?: string } {
    if (this.started) return { ok: false, error: 'Game already started' };
    const humans = this.members.filter((m) => m.connected);
    if (humans.length === 0) return { ok: false, error: 'No players in the room' };
    if (humans.length > this.lobbySize) {
      return { ok: false, error: 'More players than seats' };
    }
    if (humans.some((m) => !m.heroId)) {
      return { ok: false, error: 'Everyone must pick a hero first' };
    }

    const seats: Seat[] = humans.map((m) => ({
      id: m.id,
      name: m.name,
      isHuman: true,
      heroId: m.heroId!,
    }));

    const botCount = this.lobbySize - humans.length;
    const botHeroes = pickBotHeroes(botCount, humans.map((m) => m.heroId!));
    for (let i = 0; i < botCount; i++) {
      const heroId = botHeroes[i];
      const hero = HEROES.find((h) => h.id === heroId) ?? HEROES[0];
      const suffix = BOT_CREW_SUFFIXES[i % BOT_CREW_SUFFIXES.length];
      seats.push({
        id: `bot_${i + 1}`,
        name: `${hero.name}'s ${suffix}`,
        isHuman: false,
        heroId,
      });
    }

    this.game = createGameFromSeats(this.lobbySize, seats);
    this.beginTurnTimer();
    return { ok: true };
  }

  private beginTurnTimer(): void {
    if (this.timer) clearTimeout(this.timer);
    if (!this.game || this.game.phase !== 'RECRUIT') {
      this.turnEndsAt = null;
      return;
    }
    const ms = turnSecondsFor(this.game.turn) * 1000;
    this.turnEndsAt = Date.now() + ms;
    this.timer = setTimeout(() => this.forceResolve(), ms);
  }

  private forceResolve(): void {
    if (!this.game || this.game.phase !== 'RECRUIT') return;
    this.resolveNow();
  }

  private resolveNow(): void {
    if (!this.game) return;
    resolveCombatPhase(this.game);
    if (this.game.phase === 'GAME_OVER') {
      if (this.timer) clearTimeout(this.timer);
      this.timer = null;
      this.turnEndsAt = null;
    } else {
      this.beginTurnTimer();
    }
    this.onChange();
  }

  private maybeResolve(): void {
    if (!this.game || this.game.phase !== 'RECRUIT') return;
    if (allHumansReady(this.game)) this.resolveNow();
  }

  private playerFor(memberId: string): PlayerState | undefined {
    return this.game?.players.find((p) => p.id === memberId);
  }

  /** Applies one in-game action on behalf of a member. Returns an error string
   * when the action is rejected; the caller reports it back to that client. */
  handleAction(memberId: string, msg: ClientMessage): string | null {
    if (!this.game) return 'Game has not started';
    const player = this.playerFor(memberId);
    if (!player) return 'You are not in this game';
    if (!player.alive) return 'You have been eliminated';
    if (this.game.phase !== 'RECRUIT') return 'Not in the recruit phase';
    if (player.ready && msg.type !== 'READY') return 'You already locked in this turn';

    const pool = this.game.pool;
    switch (msg.type) {
      case 'BUY': {
        const before = player.board.length;
        const r = buyMinion(player, pool, msg.shopIndex);
        if (!r.ok) return r.reason ?? 'Cannot buy';
        // The engine appends the purchase; move it to where it was dropped.
        // A triple merges three minions into one, so only reposition when the
        // board actually grew by exactly the new minion.
        if (msg.toIndex !== undefined && player.board.length === before + 1) {
          const bought = player.board[player.board.length - 1];
          reorderMinion(player, bought.instanceId, msg.toIndex);
        }
        return null;
      }
      case 'SELL': {
        const idx = player.board.findIndex((m) => m.instanceId === msg.instanceId);
        if (idx === -1) return 'No such minion';
        const r = sellMinion(player, pool, idx);
        return r.ok ? null : (r.reason ?? 'Cannot sell');
      }
      case 'REROLL': {
        return manualReroll(player, pool) ? null : 'Not enough gold';
      }
      case 'FREEZE': {
        toggleFreeze(player);
        return null;
      }
      case 'UPGRADE': {
        const r = upgradeTavern(player, pool, this.game.turn);
        return r.ok ? null : (r.reason ?? 'Cannot upgrade');
      }
      case 'HERO_POWER': {
        if (heroPowerNeedsTarget(player.hero.id) && !msg.targetInstanceId) {
          return 'Choose a friendly minion';
        }
        const r = useHeroPower({
          player,
          pool,
          targetInstanceId: msg.targetInstanceId,
        });
        return r.ok ? null : (r.reason ?? 'Cannot use hero power');
      }
      case 'REORDER': {
        return reorderMinion(player, msg.instanceId, msg.toIndex) ? null : 'Cannot move';
      }
      case 'READY': {
        player.ready = true;
        this.maybeResolve();
        return null;
      }
      default:
        return 'Unknown action';
    }
  }

  dispose(): void {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
  }
}
