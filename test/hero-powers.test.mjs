// Exercises every hero power directly against the engine, both with and
// without a target, to catch any hero whose power dereferences a missing target.
const { HEROES } = await import('../src/data/heroes.ts');
const { createGameFromSeats } = await import('../src/engine/game.ts');
const { useHeroPower, heroPowerNeedsTarget } = await import('../src/engine/heroPowers.ts');
const { buyMinion } = await import('../src/engine/shop.ts');

let failures = 0;

for (const hero of HEROES) {
  const state = createGameFromSeats(2, [
    { id: 'p1', name: 'Tester', isHuman: true, heroId: hero.id },
    { id: 'p2', name: 'Other', isHuman: false, heroId: HEROES.find((h) => h.id !== hero.id).id },
  ]);
  const p = state.players[0];

  // Give the player a board and plenty of gold.
  p.gold = 10;
  for (let i = 0; i < 3; i++) {
    const idx = p.shop.findIndex((c) => c !== null);
    if (idx !== -1) buyMinion(p, state.pool, idx);
  }
  p.gold = 10;
  p.heroPowerUsedThisTurn = 0;

  const needsTarget = heroPowerNeedsTarget(hero.id);

  // 1) Call with no target at all — must never throw.
  try {
    const r = useHeroPower({ player: p, pool: state.pool });
    if (needsTarget && r.ok) {
      console.log(`FAIL ${hero.id}: targeted power succeeded with no target`);
      failures++;
    }
  } catch (e) {
    console.log(`FAIL ${hero.id}: threw with no target -> ${e.message}`);
    failures++;
  }

  // 2) Call with a valid target — must succeed for every active power.
  p.gold = 10;
  p.heroPowerUsedThisTurn = 0;
  try {
    const target = p.board[0];
    const r = useHeroPower({
      player: p,
      pool: state.pool,
      targetInstanceId: target?.instanceId,
    });
    if (hero.power.usesPerTurn > 0 && !r.ok) {
      console.log(`FAIL ${hero.id}: power rejected with a valid target -> ${r.reason}`);
      failures++;
    }
  } catch (e) {
    console.log(`FAIL ${hero.id}: threw with a valid target -> ${e.message}`);
    failures++;
  }

  // 3) Call with a bogus target id — must never throw.
  p.gold = 10;
  p.heroPowerUsedThisTurn = 0;
  try {
    useHeroPower({ player: p, pool: state.pool, targetInstanceId: 'does-not-exist' });
  } catch (e) {
    console.log(`FAIL ${hero.id}: threw with a bogus target -> ${e.message}`);
    failures++;
  }
}

console.log(failures === 0 ? `\nAll ${HEROES.length} hero powers OK` : `\n${failures} failures`);
process.exit(failures === 0 ? 0 : 1);
