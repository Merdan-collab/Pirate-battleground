import { useState } from 'react';
import { HEROES } from '../data/heroes';
import type { LobbySize, WireLobbyState } from '../shared/protocol';

interface OnlineEntryProps {
  onCreate: (name: string, lobbySize: LobbySize) => void;
  onJoin: (name: string, roomCode: string) => void;
  onBack: () => void;
  error: string | null;
  onClearError: () => void;
}

export function OnlineEntry({ onCreate, onJoin, onBack, error, onClearError }: OnlineEntryProps) {
  const [name, setName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [lobbySize, setLobbySize] = useState<LobbySize>(4);

  return (
    <div className="lobby">
      <h1 className="lobby__title">🏴‍☠️ Play with Friends</h1>
      <p className="lobby__subtitle">
        Create a room and share the code, or enter a friend's code to join theirs. Any empty
        seats are filled with AI opponents.
      </p>

      {error && (
        <div className="banner banner--error" onClick={onClearError}>
          {error} <span className="banner__dismiss">(dismiss)</span>
        </div>
      )}

      <section className="lobby__section">
        <h2>Your name</h2>
        <input
          className="text-input"
          value={name}
          maxLength={20}
          placeholder="Captain"
          onChange={(e) => setName(e.target.value)}
        />
      </section>

      <div className="online-entry">
        <section className="lobby__section online-entry__col">
          <h2>Create a room</h2>
          <div className="lobby__lobby-size-row">
            {[2, 4, 8].map((n) => (
              <button
                key={n}
                className={`lobby__size-btn ${lobbySize === n ? 'lobby__size-btn--active' : ''}`}
                onClick={() => setLobbySize(n as LobbySize)}
              >
                {n}
              </button>
            ))}
          </div>
          <p className="lobby__hint">Seats not taken by friends become AI opponents.</p>
          <button className="lobby__start-btn" onClick={() => onCreate(name, lobbySize)}>
            Create Room
          </button>
        </section>

        <section className="lobby__section online-entry__col">
          <h2>Join a room</h2>
          <input
            className="text-input text-input--code"
            value={roomCode}
            maxLength={6}
            placeholder="CODE"
            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
          />
          <button
            className="lobby__start-btn"
            disabled={roomCode.trim().length === 0}
            onClick={() => onJoin(name, roomCode)}
          >
            Join Room
          </button>
        </section>
      </div>

      <button className="btn" onClick={onBack}>
        ← Back
      </button>
    </div>
  );
}

interface OnlineRoomProps {
  lobby: WireLobbyState;
  playerId: string;
  onChooseHero: (heroId: string) => void;
  onSetLobbySize: (n: LobbySize) => void;
  onStart: () => void;
  onLeave: () => void;
  error: string | null;
  onClearError: () => void;
}

export function OnlineRoom({
  lobby,
  playerId,
  onChooseHero,
  onSetLobbySize,
  onStart,
  onLeave,
  error,
  onClearError,
}: OnlineRoomProps) {
  const me = lobby.members.find((m) => m.id === playerId);
  const isHost = lobby.hostId === playerId;
  const takenByOthers = new Set(
    lobby.members.filter((m) => m.id !== playerId && m.heroId).map((m) => m.heroId!),
  );
  const everyoneReady = lobby.members.every((m) => m.heroId);
  const botCount = lobby.lobbySize - lobby.members.length;

  return (
    <div className="lobby">
      <h1 className="lobby__title">Room {lobby.roomCode}</h1>
      <p className="lobby__subtitle">
        Share this code with your friends. {lobby.members.length} of {lobby.lobbySize} seats
        taken
        {botCount > 0 && ` — ${botCount} will be filled by AI`}.
      </p>

      {error && (
        <div className="banner banner--error" onClick={onClearError}>
          {error} <span className="banner__dismiss">(dismiss)</span>
        </div>
      )}

      <section className="lobby__section">
        <h2>Players</h2>
        <ul className="member-list">
          {lobby.members.map((m) => (
            <li key={m.id} className={m.id === playerId ? 'member-list__me' : ''}>
              <span className="member-list__name">
                {m.name}
                {m.isHost && ' 👑'}
                {!m.connected && ' 🔌'}
              </span>
              <span className="member-list__hero">
                {m.heroId
                  ? (HEROES.find((h) => h.id === m.heroId)?.name ?? m.heroId)
                  : 'choosing…'}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {isHost && (
        <section className="lobby__section">
          <h2>Lobby size</h2>
          <div className="lobby__lobby-size-row">
            {[2, 4, 8].map((n) => (
              <button
                key={n}
                className={`lobby__size-btn ${lobby.lobbySize === n ? 'lobby__size-btn--active' : ''}`}
                disabled={n < lobby.members.length}
                onClick={() => onSetLobbySize(n as LobbySize)}
              >
                {n} players
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="lobby__section">
        <h2>Choose your hero</h2>
        <div className="lobby__hero-grid">
          {HEROES.map((h) => {
            const taken = takenByOthers.has(h.id);
            return (
              <button
                key={h.id}
                className={`hero-card ${me?.heroId === h.id ? 'hero-card--selected' : ''} ${taken ? 'hero-card--taken' : ''}`}
                disabled={taken}
                onClick={() => onChooseHero(h.id)}
              >
                <div className="hero-card__portrait">{h.portrait}</div>
                <div className="hero-card__name">{h.name}</div>
                <div className="hero-card__title">{taken ? 'Taken' : h.title}</div>
                <div className="hero-card__power">
                  <strong>{h.power.name}</strong>
                  {h.power.usesPerTurn > 0 && (
                    <span className="hero-card__cost"> ({h.power.cost}g)</span>
                  )}
                  <div className="hero-card__power-desc">{h.power.description}</div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {isHost ? (
        <button className="lobby__start-btn" disabled={!everyoneReady} onClick={onStart}>
          {everyoneReady ? 'Start Game ⚓' : 'Waiting for hero picks…'}
        </button>
      ) : (
        <p className="lobby__hint">Waiting for the host to start the game…</p>
      )}

      <button className="btn" onClick={onLeave}>
        Leave room
      </button>
    </div>
  );
}
