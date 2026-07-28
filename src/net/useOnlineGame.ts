import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  ClientMessage,
  LobbySize,
  ServerMessage,
  WireGameView,
  WireLobbyState,
} from '../shared/protocol';

const TOKEN_KEY = 'glb.session.token';

function defaultServerUrl(): string {
  const fromEnv = import.meta.env.VITE_SERVER_URL;
  if (fromEnv) return fromEnv;
  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  // In dev the Vite page is on :5173 while the game server listens on :8787.
  const host = window.location.port === '5173'
    ? `${window.location.hostname}:8787`
    : window.location.host;
  return `${proto}//${host}`;
}

export type ConnectionStatus = 'idle' | 'connecting' | 'open' | 'closed' | 'error';

export interface OnlineGame {
  status: ConnectionStatus;
  error: string | null;
  playerId: string | null;
  lobby: WireLobbyState | null;
  view: WireGameView | null;
  createRoom: (name: string, lobbySize: LobbySize) => void;
  joinRoom: (name: string, roomCode: string) => void;
  chooseHero: (heroId: string) => void;
  setLobbySize: (lobbySize: LobbySize) => void;
  startGame: () => void;
  leave: () => void;
  send: (msg: ClientMessage) => void;
  clearError: () => void;
}

export function useOnlineGame(): OnlineGame {
  const wsRef = useRef<WebSocket | null>(null);
  const queueRef = useRef<ClientMessage[]>([]);
  const [status, setStatus] = useState<ConnectionStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [lobby, setLobby] = useState<WireLobbyState | null>(null);
  const [view, setView] = useState<WireGameView | null>(null);

  const flush = useCallback(() => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    for (const msg of queueRef.current) ws.send(JSON.stringify(msg));
    queueRef.current = [];
  }, []);

  const ensureSocket = useCallback((): WebSocket => {
    const existing = wsRef.current;
    if (existing && (existing.readyState === WebSocket.OPEN || existing.readyState === WebSocket.CONNECTING)) {
      return existing;
    }
    setStatus('connecting');
    const ws = new WebSocket(defaultServerUrl());
    wsRef.current = ws;

    ws.onopen = () => {
      setStatus('open');
      flush();
    };
    ws.onclose = () => setStatus('closed');
    ws.onerror = () => {
      setStatus('error');
      setError('Could not reach the game server. Is it running?');
    };
    ws.onmessage = (event) => {
      let msg: ServerMessage;
      try {
        msg = JSON.parse(event.data);
      } catch {
        return;
      }
      switch (msg.type) {
        case 'JOINED':
          setPlayerId(msg.playerId);
          setLobby(msg.lobby);
          try {
            window.sessionStorage.setItem(TOKEN_KEY, msg.token);
          } catch {
            // Private browsing can block sessionStorage; reconnect just won't persist.
          }
          break;
        case 'LOBBY':
          setLobby(msg.lobby);
          setView(null);
          break;
        case 'GAME':
          setView(msg.view);
          break;
        case 'ERROR':
          setError(msg.message);
          break;
      }
    };
    return ws;
  }, [flush]);

  const send = useCallback(
    (msg: ClientMessage) => {
      const ws = ensureSocket();
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(msg));
      } else {
        queueRef.current.push(msg);
      }
    },
    [ensureSocket],
  );

  useEffect(() => {
    return () => {
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, []);

  return {
    status,
    error,
    playerId,
    lobby,
    view,
    createRoom: (name, lobbySize) => send({ type: 'CREATE_ROOM', name, lobbySize }),
    joinRoom: (name, roomCode) => send({ type: 'JOIN_ROOM', name, roomCode }),
    chooseHero: (heroId) => send({ type: 'CHOOSE_HERO', heroId }),
    setLobbySize: (lobbySize) => send({ type: 'SET_LOBBY_SIZE', lobbySize }),
    startGame: () => send({ type: 'START_GAME' }),
    leave: () => {
      send({ type: 'LEAVE_ROOM' });
      setLobby(null);
      setView(null);
      setPlayerId(null);
      wsRef.current?.close();
      wsRef.current = null;
      setStatus('idle');
    },
    send,
    clearError: () => setError(null),
  };
}
