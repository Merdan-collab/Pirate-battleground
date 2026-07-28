import { useState } from 'react';
import './App.css';
import { CombatOverlay } from './components/CombatOverlay';
import { GameOverScreen } from './components/GameOverScreen';
import { GameScreen } from './components/GameScreen';
import { LobbySetup } from './components/LobbySetup';
import { createGame, endHumanTurn, fastForwardIfHumanEliminated } from './engine/game';
import { heroPowerNeedsTarget, useHeroPower } from './engine/heroPowers';
import { buyMinion, manualReroll, sellMinion, toggleFreeze, upgradeTavern } from './engine/shop';
import type { CombatSummary, GameState } from './engine/types';

function App() {
  const [game, setGame] = useState<GameState | null>(null);
  const [lobbySize, setLobbySize] = useState<2 | 4 | 8>(8);
  const [selectedHeroId, setSelectedHeroId] = useState<string | null>(null);
  const [combatOverlay, setCombatOverlay] = useState<CombatSummary | 'none' | null>(null);
  const [targeting, setTargeting] = useState(false);

  const rerender = () => setGame((g) => (g ? { ...g } : g));
  const human = () => game!.players.find((p) => p.id === 'human')!;

  function handleStart() {
    if (!selectedHeroId) return;
    setGame(createGame(lobbySize, selectedHeroId));
  }

  function handleBuy(shopIndex: number) {
    if (!game) return;
    buyMinion(human(), game.pool, shopIndex);
    rerender();
  }

  function handleSell(boardIndex: number) {
    if (!game) return;
    sellMinion(human(), game.pool, boardIndex);
    rerender();
  }

  function handleReroll() {
    if (!game) return;
    manualReroll(human(), game.pool);
    rerender();
  }

  function handleFreeze() {
    if (!game) return;
    toggleFreeze(human());
    rerender();
  }

  function handleUpgrade() {
    if (!game) return;
    upgradeTavern(human(), game.pool, game.turn);
    rerender();
  }

  function handleHeroPowerClick() {
    if (!game) return;
    const h = human();
    if (heroPowerNeedsTarget(h.hero.id)) {
      setTargeting((t) => !t);
      return;
    }
    useHeroPower({ player: h, pool: game.pool });
    rerender();
  }

  function handleBoardMinionClick(instanceId: string) {
    if (!game || !targeting) return;
    useHeroPower({ player: human(), pool: game.pool, targetInstanceId: instanceId });
    setTargeting(false);
    rerender();
  }

  function handleEndTurn() {
    if (!game) return;
    setTargeting(false);
    endHumanTurn(game);
    const summary = game.lastCombatSummaries.find((s) => s.playerId === 'human') ?? 'none';
    setCombatOverlay(summary);
    rerender();
  }

  function handleContinue() {
    setCombatOverlay(null);
    if (game && !human().alive && game.phase !== 'GAME_OVER') {
      fastForwardIfHumanEliminated(game);
      rerender();
    }
  }

  function handleRestart() {
    setGame(null);
    setSelectedHeroId(null);
    setCombatOverlay(null);
    setTargeting(false);
  }

  if (!game) {
    return (
      <LobbySetup
        lobbySize={lobbySize}
        onChangeLobbySize={setLobbySize}
        selectedHeroId={selectedHeroId}
        onSelectHero={setSelectedHeroId}
        onStart={handleStart}
      />
    );
  }

  if (combatOverlay) {
    return (
      <CombatOverlay
        summary={combatOverlay === 'none' ? null : combatOverlay}
        onContinue={handleContinue}
      />
    );
  }

  if (game.phase === 'GAME_OVER') {
    return <GameOverScreen game={game} onRestart={handleRestart} />;
  }

  return (
    <GameScreen
      game={game}
      targeting={targeting}
      onBuy={handleBuy}
      onSell={handleSell}
      onReroll={handleReroll}
      onFreeze={handleFreeze}
      onUpgrade={handleUpgrade}
      onHeroPowerClick={handleHeroPowerClick}
      onBoardMinionClick={handleBoardMinionClick}
      onEndTurn={handleEndTurn}
    />
  );
}

export default App;
