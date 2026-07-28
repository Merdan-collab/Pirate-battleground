import { randomBytes, randomUUID } from 'node:crypto';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve } from 'node:path';
import { WebSocketServer, type WebSocket } from 'ws';
import { serializeFor } from '../src/shared/serialize';
import type { ClientMessage, LobbySize, ServerMessage } from '../src/shared/protocol';
import { Room, type Member } from './room';

const PORT = Number(process.env.PORT ?? 8787);
const ROOM_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no easily-confused chars
const MAX_NAME_LENGTH = 20;
const EMPTY_ROOM_GRACE_MS = 60_000;

const rooms = new Map<string, Room>();
const socketInfo = new WeakMap<WebSocket, { roomCode: string; memberId: string }>();

function makeRoomCode(): string {
  for (let attempt = 0; attempt < 50; attempt++) {
    let code = '';
    for (let i = 0; i < 4; i++) {
      code += ROOM_CODE_ALPHABET[randomBytes(1)[0] % ROOM_CODE_ALPHABET.length];
    }
    if (!rooms.has(code)) return code;
  }
  return randomUUID().slice(0, 6).toUpperCase();
}

function sanitizeName(raw: unknown): string {
  const s = typeof raw === 'string' ? raw : '';
  // Strip control characters; names render as text in other players' UIs.
  const cleaned = s
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .trim()
    .slice(0, MAX_NAME_LENGTH);
  return cleaned.length > 0 ? cleaned : 'Captain';
}

function isLobbySize(n: unknown): n is LobbySize {
  return n === 2 || n === 4 || n === 8;
}

function send(ws: WebSocket, msg: ServerMessage): void {
  if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(msg));
}

function sendError(ws: WebSocket, message: string): void {
  send(ws, { type: 'ERROR', message });
}

/** Pushes current state to everyone in a room: the lobby list before the game
 * starts, and a per-player game view (opponents redacted) once it has. */
function broadcast(room: Room): void {
  for (const m of room.members) {
    if (!m.send) continue;
    if (room.game) {
      try {
        m.send(
          JSON.stringify({
            type: 'GAME',
            view: serializeFor(room.game, m.id, room.turnEndsAt),
          } satisfies ServerMessage),
        );
      } catch {
        // A member with no seat in the game (shouldn't happen) is simply skipped.
      }
    } else {
      m.send(JSON.stringify({ type: 'LOBBY', lobby: room.lobbyState() } satisfies ServerMessage));
    }
  }
}

function scheduleRoomCleanup(room: Room): void {
  setTimeout(() => {
    const current = rooms.get(room.code);
    if (current !== room) return;
    if (room.members.some((m) => m.connected)) return;
    room.dispose();
    rooms.delete(room.code);
  }, EMPTY_ROOM_GRACE_MS);
}

function attach(ws: WebSocket, room: Room, member: Member): void {
  member.send = (data) => {
    if (ws.readyState === ws.OPEN) ws.send(data);
  };
  member.connected = true;
  socketInfo.set(ws, { roomCode: room.code, memberId: member.id });
}

// When a production build exists, serve it from the same origin so the whole
// game (page + websocket) can be deployed as one process.
const DIST_DIR = resolve(process.cwd(), 'dist');
const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.json': 'application/json',
  '.ico': 'image/x-icon',
};

function serveStatic(urlPath: string, res: import('node:http').ServerResponse): boolean {
  if (!existsSync(DIST_DIR)) return false;
  const clean = normalize(decodeURIComponent(urlPath.split('?')[0])).replace(/^(\.\.[/\\])+/, '');
  let filePath = join(DIST_DIR, clean);
  // Any unknown path falls back to index.html so client routing keeps working.
  if (!filePath.startsWith(DIST_DIR) || !existsSync(filePath) || statSync(filePath).isDirectory()) {
    filePath = join(DIST_DIR, 'index.html');
  }
  if (!existsSync(filePath)) return false;
  res.writeHead(200, { 'content-type': MIME[extname(filePath)] ?? 'application/octet-stream' });
  createReadStream(filePath).pipe(res);
  return true;
}

const httpServer = createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ ok: true, rooms: rooms.size }));
    return;
  }
  if (serveStatic(req.url ?? '/', res)) return;
  res.writeHead(404);
  res.end('Not found');
});

const wss = new WebSocketServer({ server: httpServer });

wss.on('connection', (ws) => {
  ws.on('message', (raw) => {
    let msg: ClientMessage;
    try {
      msg = JSON.parse(String(raw));
    } catch {
      sendError(ws, 'Malformed message');
      return;
    }
    if (!msg || typeof msg.type !== 'string') {
      sendError(ws, 'Malformed message');
      return;
    }

    // --- Messages that establish which room this socket belongs to ---
    if (msg.type === 'CREATE_ROOM') {
      if (!isLobbySize(msg.lobbySize)) {
        sendError(ws, 'Lobby size must be 2, 4, or 8');
        return;
      }
      const code = makeRoomCode();
      const room = new Room(code, msg.lobbySize, () => broadcast(room));
      rooms.set(code, room);

      const member: Member = {
        id: randomUUID(),
        name: sanitizeName(msg.name),
        token: randomUUID(),
        heroId: null,
        connected: true,
        send: null,
      };
      room.addMember(member);
      attach(ws, room, member);
      send(ws, {
        type: 'JOINED',
        playerId: member.id,
        token: member.token,
        lobby: room.lobbyState(),
      });
      broadcast(room);
      return;
    }

    if (msg.type === 'JOIN_ROOM') {
      const code = String(msg.roomCode ?? '').toUpperCase().trim();
      const room = rooms.get(code);
      if (!room) {
        sendError(ws, 'No room with that code');
        return;
      }
      if (room.started) {
        sendError(ws, 'That game has already started');
        return;
      }
      if (room.members.length >= room.lobbySize) {
        sendError(ws, 'That room is full');
        return;
      }
      const member: Member = {
        id: randomUUID(),
        name: sanitizeName(msg.name),
        token: randomUUID(),
        heroId: null,
        connected: true,
        send: null,
      };
      room.addMember(member);
      attach(ws, room, member);
      send(ws, {
        type: 'JOINED',
        playerId: member.id,
        token: member.token,
        lobby: room.lobbyState(),
      });
      broadcast(room);
      return;
    }

    if (msg.type === 'REJOIN') {
      const token = String(msg.token ?? '');
      let found: { room: Room; member: Member } | null = null;
      for (const room of rooms.values()) {
        const member = room.findByToken(token);
        if (member) {
          found = { room, member };
          break;
        }
      }
      if (!found) {
        sendError(ws, 'That session has expired');
        return;
      }
      attach(ws, found.room, found.member);
      found.room.setConnected(found.member.id, true);
      send(ws, {
        type: 'JOINED',
        playerId: found.member.id,
        token: found.member.token,
        lobby: found.room.lobbyState(),
      });
      broadcast(found.room);
      return;
    }

    // --- Everything else requires an established session ---
    const info = socketInfo.get(ws);
    const room = info ? rooms.get(info.roomCode) : undefined;
    const member = room?.members.find((m) => m.id === info!.memberId);
    if (!room || !member) {
      sendError(ws, 'Join a room first');
      return;
    }

    switch (msg.type) {
      case 'CHOOSE_HERO': {
        if (room.started) {
          sendError(ws, 'Game already started');
          return;
        }
        const heroId = String(msg.heroId ?? '');
        const takenByOther = room.members.some((m) => m.id !== member.id && m.heroId === heroId);
        if (takenByOther) {
          sendError(ws, 'Another player already picked that hero');
          return;
        }
        member.heroId = heroId;
        broadcast(room);
        return;
      }
      case 'SET_LOBBY_SIZE': {
        if (member.id !== room.hostId) {
          sendError(ws, 'Only the host can change the lobby size');
          return;
        }
        if (room.started) {
          sendError(ws, 'Game already started');
          return;
        }
        if (!isLobbySize(msg.lobbySize)) {
          sendError(ws, 'Lobby size must be 2, 4, or 8');
          return;
        }
        if (msg.lobbySize < room.members.length) {
          sendError(ws, 'There are already more players than that');
          return;
        }
        room.lobbySize = msg.lobbySize;
        broadcast(room);
        return;
      }
      case 'START_GAME': {
        if (member.id !== room.hostId) {
          sendError(ws, 'Only the host can start the game');
          return;
        }
        const result = room.startGame();
        if (!result.ok) {
          sendError(ws, result.error ?? 'Could not start');
          return;
        }
        broadcast(room);
        return;
      }
      case 'LEAVE_ROOM': {
        room.setConnected(member.id, false);
        socketInfo.delete(ws);
        broadcast(room);
        return;
      }
      default: {
        const error = room.handleAction(member.id, msg);
        if (error) sendError(ws, error);
        broadcast(room);
        return;
      }
    }
  });

  ws.on('close', () => {
    const info = socketInfo.get(ws);
    if (!info) return;
    const room = rooms.get(info.roomCode);
    if (!room) return;
    room.setConnected(info.memberId, false);
    broadcast(room);
    if (!room.members.some((m) => m.connected)) scheduleRoomCleanup(room);
  });
});

httpServer.listen(PORT, () => {
  console.log(`Grand Line Battleground server listening on port ${PORT}`);
});
