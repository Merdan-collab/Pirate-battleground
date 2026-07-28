import { useState } from 'react';
import { HEROES } from '../data/heroes';
import { HeroPicker } from './HeroPicker';
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
    <div className="page">
      <header className="page__head">
        <button className="ghost-btn" onClick={onBack}>
          ← Back
        </button>
        <h1 className="page__title">Play with Friends</h1>
        <span className="page__spacer" />
      </header>

      {error && (
        <button className="alert" onClick={onClearError}>
          {error}
        </button>
      )}

      <section className="panel">
        <h2 className="panel__title">Your name</h2>
        <input
          className="field-input"
          value={name}
          maxLength={20}
          placeholder="Captain"
          onChange={(e) => setName(e.target.value)}
        />
      </section>

      <div className="split">
        <section className="panel">
          <h2 className="panel__title">Create a room</h2>
          <div className="seg">
            {[2, 4, 8].map((n) => (
              <button
                key={n}
                className={`seg__btn ${lobbySize === n ? 'seg__btn--on' : ''}`}
                onClick={() => setLobbySize(n as LobbySize)}
              >
                {n}
              </button>
            ))}
          </div>
          <p className="panel__note">Seats nobody claims become AI captains.</p>
          <button className="primary-btn" onClick={() => onCreate(name, lobbySize)}>
            Create Room
          </button>
        </section>

        <section className="panel">
          <h2 className="panel__title">Join a room</h2>
          <input
            className="field-input field-input--code"
            value={roomCode}
            maxLength={6}
            placeholder="CODE"
            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
          />
          <button
            className="primary-btn"
            disabled={roomCode.trim().length === 0}
            onClick={() => onJoin(name, roomCode)}
          >
            Join Room
          </button>
        </section>
      </div>
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
  const taken = new Set(
    lobby.members.filter((m) => m.id !== playerId && m.heroId).map((m) => m.heroId!),
  );
  const everyoneReady = lobby.members.every((m) => m.heroId);
  const botCount = lobby.lobbySize - lobby.members.length;

  return (
    <div className="page">
      <header className="page__head">
        <button className="ghost-btn" onClick={onLeave}>
          ← Leave
        </button>
        <h1 className="page__title">
          Room <span className="code-chip">{lobby.roomCode}</span>
        </h1>
        <span className="page__spacer" />
      </header>

      <p className="page__lede">
        Share that code with your friends. {lobby.members.length} of {lobby.lobbySize} seats taken
        {botCount > 0 && ` · ${botCount} filled by AI`}.
      </p>

      {error && (
        <button className="alert" onClick={onClearError}>
          {error}
        </button>
      )}

      <section className="panel">
        <h2 className="panel__title">Captains</h2>
        <ul className="crew-list">
          {lobby.members.map((m) => {
            const hero = HEROES.find((h) => h.id === m.heroId);
            return (
              <li key={m.id} className={m.id === playerId ? 'crew-list__me' : ''}>
                <span className="crew-list__avatar">{hero?.portrait ?? '❓'}</span>
                <span className="crew-list__name">
                  {m.name}
                  {m.isHost && <span className="crew-list__tag">host</span>}
                  {!m.connected && <span className="crew-list__tag">offline</span>}
                </span>
                <span className="crew-list__hero">{hero?.name ?? 'choosing…'}</span>
              </li>
            );
          })}
        </ul>
      </section>

      {isHost && (
        <section className="panel">
          <h2 className="panel__title">Lobby size</h2>
          <div className="seg">
            {[2, 4, 8].map((n) => (
              <button
                key={n}
                className={`seg__btn ${lobby.lobbySize === n ? 'seg__btn--on' : ''}`}
                disabled={n < lobby.members.length}
                onClick={() => onSetLobbySize(n as LobbySize)}
              >
                {n} players
              </button>
            ))}
          </div>
        </section>
      )}

      <HeroPicker
        selectedHeroId={me?.heroId ?? null}
        takenHeroIds={taken}
        onSelect={onChooseHero}
      />

      <div className="page__cta">
        {isHost ? (
          <button className="primary-btn" disabled={!everyoneReady} onClick={onStart}>
            {everyoneReady ? 'Start Game' : 'Waiting for hero picks…'}
          </button>
        ) : (
          <p className="panel__note">Waiting for the host to start…</p>
        )}
      </div>
    </div>
  );
}
