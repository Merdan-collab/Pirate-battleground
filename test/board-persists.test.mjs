// Boards must survive combat: minions that die in the fight are back next
// recruit phase, and losing costs health only.
const { createGameFromSeats, resolveCombatPhase } = await import('../src/engine/game.ts');
const { buyMinion } = await import('../src/engine/shop.ts');

let failures = 0;
const state = createGameFromSeats(2, [
  { id: 'p1', name: 'A', isHuman: true, heroId: 'luffy' },
  { id: 'p2', name: 'B', isHuman: true, heroId: 'zoro' },
]);
const [a, b] = state.players;

// Give A a board, leave B empty so A definitely wins the fight.
a.gold = 10;
for (let i = 0; i < 2; i++) {
  const idx = a.shop.findIndex((c) => c !== null);
  if (idx !== -1) buyMinion(a, state.pool, idx);
}
const before = a.board.map((m) => m.cardId);
const bHealthBefore = b.health;

a.ready = true;
b.ready = true;
resolveCombatPhase(state);

const after = a.board.map((m) => m.cardId);
if (JSON.stringify(before) !== JSON.stringify(after)) {
  console.log(`FAIL winner lost minions: ${JSON.stringify(before)} -> ${JSON.stringify(after)}`);
  failures++;
}
if (b.health >= bHealthBefore) {
  console.log(`FAIL loser took no damage: ${bHealthBefore} -> ${b.health}`);
  failures++;
}

// Play several more rounds; A's board must never shrink on its own.
for (let r = 0; r < 5; r++) {
  const snapshot = a.board.length;
  if (state.phase === 'GAME_OVER') break;
  for (const p of state.players) p.ready = true;
  resolveCombatPhase(state);
  if (a.board.length < snapshot) {
    console.log(`FAIL board shrank after round ${r}: ${snapshot} -> ${a.board.length}`);
    failures++;
    break;
  }
}

console.log(failures === 0 ? 'Boards persist across combat OK' : `${failures} failures`);
process.exit(failures === 0 ? 0 : 1);
