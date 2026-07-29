import { useEffect, useRef, useState } from 'react';
import './App.css';
import { CombatOverlay, type OverlaySummary } from './components/CombatOverlay';
import { GameOverScreen, type StandingRow } from './components/GameOverScreen';
import { GameScreen } from './components/GameScreen';
import { LobbySetup } from './components/LobbySetup';
import { MainMenu } from './components/MainMenu';
import { OnlineEntry, OnlineRoom } from './components/OnlineLobby';
import { minionToView } from './components/MinionCard';
import {
  screenFromLocalGame,
  screenFromWireView,
  wireMinionToCardView,
} from './components/viewModel';
import { createGame, endHumanTurn, fastForwardIfHumanEliminated } from './engine/game';
import { heroPowerNeedsTarget, useHeroPower } from './engine/heroPowers';
import {
  buyMinion,
  manualReroll,
  reorderMinion,
  sellMinion,
  toggleFreeze,
  upgradeTavern,
} from './engine/shop';
import { useOnlineGame } from './net/useOnlineGame';
import type { CombatSummary, GameState } from './engine/types';
import type { WireCombatSummary } from './shared/protocol';

type Mode = 'MENU' | 'SOLO_SETUP' | 'SOLO_GAME' | 'ONLINE_ENTRY' | 'ONLINE';

function localSummaryToOverlay(s: CombatSummary): OverlaySummary {
  return {
    opponentName: s.opponentName,
    isBye: s.isBye,
    playerBoard: s.playerBoardBefore.map(minionToView),
    opponentBoard: s.opponentBoardBefore.map(minionToView),
    steps: s.steps,
    logs: s.logs,
    result: s.result,
    damageDealt: s.damageDealt,
  };
}

function wireSummaryToOverlay(s: WireCombatSummary): OverlaySummary {
  return {
    opponentName: s.opponentName,
    isBye: s.isBye,
    playerBoard: s.playerBoardBefore.map(wireMinionToCardView),
    opponentBoard: s.opponentBoardBefore.map(wireMinionToCardView),
    steps: s.steps,
    logs: s.logs,
    result: s.result,
    damageDealt: s.damageDealt,
  };
}

function App() {
  const [mode, setMode] = useState<Mode>('MENU');

  // --- Solo state ---
  const [game, setGame] = useState<GameState | null>(null);
  const [lobbySize, setLobbySize] = useState<2 | 4 | 8>(8);
  const [selectedHeroId, setSelectedHeroId] = useState<string | null>(null);
  const [soloOverlay, setSoloOverlay] = useState<OverlaySummary | 'none' | null>(null);
  const [targeting, setTargeting] = useState(false);

  // --- Online state ---
  const online = useOnlineGame();
  const [dismissedTurn, setDismissedTurn] = useState<number | null>(null);
  const lastSeenTurn = useRef<number | null>(null);

  const rerender = () => setGame((g) => (g ? { ...g } : g));
  const human = () => game!.players.find((p) => p.id === 'human')!;

  // A fresh combat result from the server re-opens the overlay for that turn.
  useEffect(() => {
    const view = online.view;
    if (!view) return;
    if (lastSeenTurn.current !== view.turn) {
      lastSeenTurn.current = view.turn;
      setTargeting(false);
    }
  }, [online.view]);

  // ---------------- Solo handlers ----------------

  function handleSoloStart() {
    if (!selectedHeroId) return;
    setGame(createGame(lobbySize, selectedHeroId));
    setMode('SOLO_GAME');
  }

  function soloAction(fn: () => void) {
    if (!game) return;
    fn();
    rerender();
  }

  function handleSoloEndTurn() {
    if (!game) return;
    setTargeting(false);
    endHumanTurn(game);
    const summary = game.lastCombatSummaries.find((s) => s.playerId === 'human');
    setSoloOverlay(summary ? localSummaryToOverlay(summary) : 'none');
    rerender();
  }

  function handleSoloContinue() {
    setSoloOverlay(null);
    if (game && !human().alive && game.phase !== 'GAME_OVER') {
      fastForwardIfHumanEliminated(game);
      rerender();
    }
  }

  function handleSoloHeroPower() {
    if (!game) return;
    const h = human();
    if (heroPowerNeedsTarget(h.hero.id)) {
      setTargeting((t) => !t);
      return;
    }
    useHeroPower({ player: h, pool: game.pool });
    rerender();
  }

  function backToMenu() {
    setGame(null);
    setSelectedHeroId(null);
    setSoloOverlay(null);
    setTargeting(false);
    setDismissedTurn(null);
    lastSeenTurn.current = null;
    setMode('MENU');
  }

  // ---------------- Render ----------------

  if (mode === 'MENU') {
    return (
      <MainMenu
        onSolo={() => setMode('SOLO_SETUP')}
        onOnline={() => setMode('ONLINE_ENTRY')}
      />
    );
  }

  if (mode === 'SOLO_SETUP') {
    return (
      <LobbySetup
        lobbySize={lobbySize}
        onChangeLobbySize={setLobbySize}
        selectedHeroId={selectedHeroId}
        onSelectHero={setSelectedHeroId}
        onStart={handleSoloStart}
        onBack={backToMenu}
      />
    );
  }

  if (mode === 'SOLO_GAME' && game) {
    if (soloOverlay) {
      return (
        <CombatOverlay
          summary={soloOverlay === 'none' ? null : soloOverlay}
          onContinue={handleSoloContinue}
        />
      );
    }
    if (game.phase === 'GAME_OVER') {
      const standings: StandingRow[] = game.standings.map((p) => ({
        id: p.id,
        name: p.name,
        heroId: p.hero.id,
        placement: p.placement,
        isYou: p.id === 'human',
      }));
      return (
        <GameOverScreen
          standings={standings}
          yourPlacement={human().placement}
          lobbySize={game.lobbySize}
          onRestart={backToMenu}
        />
      );
    }
    return (
      <GameScreen
        screen={screenFromLocalGame(game)}
        targeting={targeting}
        onBuy={(i, toIndex) =>
          soloAction(() => {
            const me = human();
            const before = me.board.length;
            const r = buyMinion(me, game.pool, i);
            // Reposition only when the board grew by the purchase itself; a
            // triple collapses three minions into one instead.
            if (r.ok && toIndex !== undefined && me.board.length === before + 1) {
              reorderMinion(me, me.board[me.board.length - 1].instanceId, toIndex);
            }
          })
        }
        onSell={(id) =>
          soloAction(() => {
            const idx = human().board.findIndex((m) => m.instanceId === id);
            if (idx !== -1) sellMinion(human(), game.pool, idx);
          })
        }
        onReroll={() => soloAction(() => manualReroll(human(), game.pool))}
        onFreeze={() => soloAction(() => toggleFreeze(human()))}
        onUpgrade={() => soloAction(() => upgradeTavern(human(), game.pool, game.turn))}
        onHeroPowerClick={handleSoloHeroPower}
        onBoardMinionClick={(id) =>
          soloAction(() => {
            useHeroPower({ player: human(), pool: game.pool, targetInstanceId: id });
            setTargeting(false);
          })
        }
        onMoveMinion={(id, to) => soloAction(() => reorderMinion(human(), id, to))}
        onEndTurn={handleSoloEndTurn}
      />
    );
  }

  if (mode === 'ONLINE_ENTRY' && !online.lobby) {
    return (
      <OnlineEntry
        onCreate={online.createRoom}
        onJoin={online.joinRoom}
        onBack={backToMenu}
        error={online.error}
        onClearError={online.clearError}
      />
    );
  }

  if (online.lobby && !online.view) {
    return (
      <OnlineRoom
        lobby={online.lobby}
        playerId={online.playerId ?? ''}
        onChooseHero={online.chooseHero}
        onSetLobbySize={online.setLobbySize}
        onStart={online.startGame}
        onLeave={() => {
          online.leave();
          backToMenu();
        }}
        error={online.error}
        onClearError={online.clearError}
      />
    );
  }

  if (online.view) {
    const view = online.view;

    if (view.phase === 'GAME_OVER') {
      const standings: StandingRow[] = view.standings.map((s) => ({
        id: s.id,
        name: s.name,
        heroId: s.heroId,
        placement: s.placement,
        isYou: s.id === online.playerId,
      }));
      return (
        <GameOverScreen
          standings={standings}
          yourPlacement={view.you.placement}
          lobbySize={view.lobbySize}
          onRestart={() => {
            online.leave();
            backToMenu();
          }}
          restartLabel="Back to menu ⚓"
        />
      );
    }

    // Show the result of the round that just finished until dismissed.
    const showOverlay = view.lastCombat && dismissedTurn !== view.turn;
    if (showOverlay) {
      return (
        <CombatOverlay
          summary={wireSummaryToOverlay(view.lastCombat!)}
          onContinue={() => setDismissedTurn(view.turn)}
        />
      );
    }

    if (!view.you.alive) {
      return (
        <div className="lobby">
          <h1 className="lobby__title">💀 Eliminated</h1>
          <p className="lobby__subtitle">
            You finished {view.you.placement} of {view.lobbySize}. The remaining captains are
            still fighting — the final standings will appear when the game ends.
          </p>
          <button
            className="lobby__start-btn"
            onClick={() => {
              online.leave();
              backToMenu();
            }}
          >
            Back to menu ⚓
          </button>
        </div>
      );
    }

    return (
      <>
        {online.error && (
          <div className="banner banner--error banner--float" onClick={online.clearError}>
            {online.error} <span className="banner__dismiss">(dismiss)</span>
          </div>
        )}
        <GameScreen
          screen={screenFromWireView(view)}
          targeting={targeting}
          onBuy={(i, toIndex) => online.send({ type: 'BUY', shopIndex: i, toIndex })}
          onSell={(id) => online.send({ type: 'SELL', instanceId: id })}
          onReroll={() => online.send({ type: 'REROLL' })}
          onFreeze={() => online.send({ type: 'FREEZE' })}
          onUpgrade={() => online.send({ type: 'UPGRADE' })}
          onHeroPowerClick={() => {
            const heroId = view.you.heroId;
            if (heroPowerNeedsTarget(heroId)) {
              setTargeting((t) => !t);
            } else {
              online.send({ type: 'HERO_POWER' });
            }
          }}
          onBoardMinionClick={(id) => {
            online.send({ type: 'HERO_POWER', targetInstanceId: id });
            setTargeting(false);
          }}
          onMoveMinion={(id, to) => online.send({ type: 'REORDER', instanceId: id, toIndex: to })}
          onEndTurn={() => {
            setTargeting(false);
            online.send({ type: 'READY' });
          }}
        />
      </>
    );
  }

  return (
    <div className="lobby">
      <h1 className="lobby__title">Connecting…</h1>
      {online.error && <div className="banner banner--error">{online.error}</div>}
      <button className="lobby__start-btn" onClick={backToMenu}>
        Back to menu
      </button>
    </div>
  );
}

export default App;
