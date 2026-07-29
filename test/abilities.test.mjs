// Verifies ported Battlegrounds abilities behave like their originals.
const { CARDS_BY_ID } = await import('../src/data/cards.ts');
const { instantiateMinion } = await import('../src/engine/minion.ts');
const { simulateCombat } = await import('../src/engine/combat.ts');
const { recomputeAuras } = await import('../src/engine/effects.ts');
const { createGameFromSeats } = await import('../src/engine/game.ts');
const { buyMinion, fireShopTriggers, sellMinion } = await import('../src/engine/shop.ts');

let failures = 0;
function check(name, cond, detail = '') {
  if (cond) return;
  console.log(`FAIL ${name}${detail ? ' — ' + detail : ''}`);
  failures++;
}

const mk = (id, golden = false) => instantiateMinion(CARDS_BY_ID[id], golden);

function freshPlayer() {
  const state = createGameFromSeats(2, [
    { id: 'p1', name: 'A', isHuman: true, heroId: 'luffy' },
    { id: 'p2', name: 'B', isHuman: false, heroId: 'zoro' },
  ]);
  const p = state.players[0];
  p.gold = 10;
  p.board = [];
  return { state, p };
}

/** Puts a specific card into slot 0 of the shop and buys it. */
function buyCard(state, p, cardId) {
  p.shop[0] = CARDS_BY_ID[cardId];
  p.gold = 10;
  return buyMinion(p, state.pool, 0);
}

// --- Aura: "Your other Marines have +1/+1" (Southsea Captain) ---
{
  const { p } = freshPlayer();
  p.board = [mk('mn_commodore'), mk('mn_swabbie'), mk('kd_alleycat')];
  recomputeAuras(p.board);
  const swabbie = p.board[1];
  const cat = p.board[2];
  const swabbieDef = CARDS_BY_ID['mn_swabbie'];
  check(
    'aura buffs same tribe',
    swabbie.attack === swabbieDef.attack + 1 && swabbie.health === swabbieDef.health + 1,
    `got ${swabbie.attack}/${swabbie.health}`,
  );
  const catDef = CARDS_BY_ID['kd_alleycat'];
  check(
    'aura skips other tribes',
    cat.attack === catDef.attack && cat.health === catDef.health,
    `got ${cat.attack}/${cat.health}`,
  );

  // Removing the aura source must revert the buff.
  p.board = [swabbie, cat];
  recomputeAuras(p.board);
  check(
    'aura reverts when source leaves',
    swabbie.attack === swabbieDef.attack && swabbie.health === swabbieDef.health,
    `got ${swabbie.attack}/${swabbie.health}`,
  );
}

// --- Battlecry: summon a token (Alleycat) ---
{
  const { state, p } = freshPlayer();
  buyCard(state, p, 'kd_alleycat');
  check('battlecry summons token', p.board.length === 2, `board=${p.board.length}`);
  check('token is the cat', p.board.some((m) => m.cardId === 'tok_cat'));
}

// --- Brann: Battlecries trigger twice ---
{
  const { state, p } = freshPlayer();
  p.board = [mk('nu_robin')]; // doubleBattlecry
  buyCard(state, p, 'kd_alleycat');
  const cats = p.board.filter((m) => m.cardId === 'tok_cat').length;
  check('Brann doubles battlecry', cats === 2, `cats=${cats}`);
}

// --- "After you play a Pirate, gain +1/+1" (Salty Looter) ---
{
  const { state, p } = freshPlayer();
  p.board = [mk('mn_quartermaster')];
  const before = p.board[0].attack;
  buyCard(state, p, 'mn_swabbie');
  const qm = p.board.find((m) => m.cardId === 'mn_quartermaster');
  check('onPlay tribe trigger fires', qm.attack === before + 1, `${before} -> ${qm.attack}`);
}

// --- onPlay tribe trigger must NOT fire for another tribe ---
{
  const { state, p } = freshPlayer();
  p.board = [mk('mn_quartermaster')];
  const before = p.board[0].attack;
  buyCard(state, p, 'kd_alleycat');
  const qm = p.board.find((m) => m.cardId === 'mn_quartermaster');
  check('onPlay ignores wrong tribe', qm.attack === before, `${before} -> ${qm.attack}`);
}

// --- Sell trigger (Sellemental) ---
{
  const { state, p } = freshPlayer();
  p.board = [mk('sh_sellsword')];
  sellMinion(p, state.pool, 0);
  check('sell trigger adds to hand', p.hand.length === 1, `hand=${p.hand.length}`);
  check('hand card is the wave token', p.hand[0]?.cardId === 'tok_wave');
}

// --- Freedealing Gambler sells for 3 ---
{
  const { state, p } = freshPlayer();
  p.board = [mk('mn_smuggler')];
  p.gold = 0;
  sellMinion(p, state.pool, 0);
  check('custom sell value', p.gold === 3, `gold=${p.gold}`);
}

// --- End of turn trigger (Cobalt Scalebane) ---
{
  const { p } = freshPlayer();
  p.board = [mk('ra_kuma'), mk('mn_swabbie')];
  const before = p.board[1].attack;
  fireShopTriggers(p, 'endOfTurn');
  check('endOfTurn buffs another minion', p.board[1].attack === before + 3, `${before} -> ${p.board[1].attack}`);
}

// --- Deathrattle summons (Harvest Golem) ---
{
  const a = [mk('bm_germa_trooper')];
  const b = [mk('nu_zoro')]; // big enough to kill it
  const out = simulateCombat(a, b);
  const summoned = out.steps.some(
    (s) => s.kind === 'summon' && s.a.some((m) => m.cardId === 'tok_broken_soldier'),
  );
  check('deathrattle summons in combat', summoned);
}

// --- Baron doubles deathrattles ---
// Whether Baron outlives the trooper is down to random targeting, so sample a
// run of battles: with Baron two tokens must be reachable, without him never.
{
  const peakTokens = (board) => {
    let peak = 0;
    for (let i = 0; i < 40; i++) {
      const out = simulateCombat(board(), [mk('ga_magellan')]);
      for (const step of out.steps) {
        peak = Math.max(peak, step.a.filter((m) => m.cardId === 'tok_broken_soldier').length);
      }
    }
    return peak;
  };
  const withBaron = peakTokens(() => [mk('nu_law'), mk('bm_germa_trooper')]);
  const without = peakTokens(() => [mk('nu_guardian'), mk('bm_germa_trooper')]);
  check('Baron doubles deathrattle', withBaron >= 2, `peak=${withBaron}`);
  check('without Baron only one token', without === 1, `peak=${without}`);
}

// --- Divine Shield absorbs the first hit ---
{
  const a = [mk('nu_guardian')]; // 1/1 Taunt + Divine Shield
  const b = [mk('kd_alleycat')]; // 1/1
  const out = simulateCombat(a, b);
  check('divine shield survives a 1/1 trade', out.aSurvived && !out.bSurvived);
}

// --- Poisonous kills anything ---
{
  const a = [mk('nu_magellan_venom')]; // 4/4 poisonous taunt
  const b = [mk('ga_gorosei')]; // 6/10
  const out = simulateCombat(a, b);
  const gorosaiDied = out.steps.some(
    (s) => s.kind === 'death' && s.actorSide === 'b',
  );
  check('poisonous destroys a big minion', gorosaiDied);
}

// --- Cleave hits neighbours ---
{
  const a = [mk('kd_kaido_dragon')]; // 6/9 Cleave
  const b = [mk('kd_alleycat'), mk('kd_alleycat'), mk('kd_alleycat')];
  const out = simulateCombat(a, b);
  const cleaveHit = out.steps.find((s) => s.kind === 'damage' && s.actorSide === 'a');
  check('cleave marks multiple targets', (cleaveHit?.targetIds?.length ?? 0) >= 2,
    `targets=${cleaveHit?.targetIds?.length}`);
}

// --- Start of Combat (Red Whelp) scales with tribe count ---
{
  const a = [mk('ra_firestarter'), mk('ra_vanguard'), mk('ra_vanguard')];
  const b = [mk('ga_magellan')]; // 3/9 taunt, survives to show the damage
  const out = simulateCombat(a, b);
  const firstAttack = out.steps.findIndex((s) => s.kind === 'attack');
  const preAttack = firstAttack === -1 ? out.steps : out.steps.slice(0, firstAttack);
  const startHp = CARDS_BY_ID['ga_magellan'].health;
  const hurtBeforeAnyAttack = preAttack.some((s) => s.b.some((m) => m.health < startHp));
  check('start of combat damage lands before attacks', hurtBeforeAnyAttack);
  check('start of combat emits an animatable damage step',
    preAttack.some((s) => s.kind === 'damage' && s.targetIds?.length));
}

// --- Combat emits a replayable step stream ---
{
  const a = [mk('kd_queen'), mk('mn_commodore')];
  const b = [mk('ga_akainu'), mk('fp_warlord')];
  const out = simulateCombat(a, b);
  check('steps start and end correctly',
    out.steps[0].kind === 'start' && out.steps[out.steps.length - 1].kind === 'end');
  check('steps carry board snapshots', out.steps.every((s) => Array.isArray(s.a) && Array.isArray(s.b)));
  check('battle produced attacks', out.steps.some((s) => s.kind === 'attack'));
}

// --- Every card is reachable and well-formed ---
{
  const { CARDS } = await import('../src/data/cards.ts');
  for (const c of CARDS) {
    if (!c.text && !c.isToken) check(`card ${c.id} has rules text`, false);
    if (c.tier < 1 || c.tier > 6) check(`card ${c.id} tier in range`, false, `tier=${c.tier}`);
    for (const e of c.battlecry ?? []) {
      if (e.type === 'summon') {
        check(`${c.id} summons a real card`, !!CARDS_BY_ID[e.cardId], e.cardId);
      }
    }
    for (const e of c.deathrattle ?? []) {
      if (e.type === 'summon') {
        check(`${c.id} deathrattle summons a real card`, !!CARDS_BY_ID[e.cardId], e.cardId);
      }
    }
    for (const t of c.triggers ?? []) {
      for (const e of t.effects) {
        if (e.type === 'summon') {
          check(`${c.id} trigger summons a real card`, !!CARDS_BY_ID[e.cardId], e.cardId);
        }
      }
    }
  }
}

console.log(failures === 0 ? 'All ability tests passed' : `${failures} ability failures`);
process.exit(failures === 0 ? 0 : 1);
