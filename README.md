# 🏴‍☠️ Grand Line Battleground

A Hearthstone Battlegrounds-style auto-battler set in the One Piece universe. Build a crew in
the tavern, position them, and let them fight rival captains automatically. Last captain
standing wins.

## Running it

### Single player only

```bash
npm install
npm run dev
```

Then open the URL Vite prints (default <http://localhost:5173>).

### With online multiplayer

The "Play with Friends" mode needs the game server running alongside the web app:

```bash
npm install
npm run dev:all      # web app on :5173, game server on :8787
```

### Deploying so friends can actually join

Build once, then run the server — it serves the built page *and* the websocket on a
single port, so there's only one thing to host:

```bash
npm run build
npm run server:start        # serves everything on :8787
```

Point `PORT` at whatever your host expects (`PORT=3000 npm run server:start`). Any Node
host works — Railway, Render, Fly, a VPS, or your own machine with port forwarding. Once
it's reachable, everyone opens the same URL and joins with a room code.

If you host the page separately from the server, set `VITE_SERVER_URL` at build time to
the server's websocket URL (e.g. `VITE_SERVER_URL=wss://your-server.example npm run build`).

## Playing with friends

1. Pick **Play with Friends**, enter a name, and choose a lobby size (2, 4, or 8).
2. **Create Room** gives you a 4-character code — share it.
3. Friends pick **Play with Friends**, enter their name and the code, and **Join Room**.
4. Everyone picks a hero (each hero can only be taken once), then the host starts.
5. **Any seats nobody claimed are filled with AI opponents**, so an 8-player lobby works
   even with two friends.

Each recruit phase has a timer (45s early, up to 75s later). The round resolves as soon as
everyone has hit **Fight!**, or when the timer runs out. If someone disconnects, their crew
keeps fighting on autopilot and the lobby carries on without them.

## How to play

1. Pick a lobby size — **2, 4, or 8 players** — and choose a hero.
2. Each turn you get gold (2 on turn 1, +1 per turn, capped at 10).
3. Spend it in the tavern: **buy** minions (3g), **refresh** the offerings (1g), **freeze**
   the shop for next turn (free), or **upgrade** your Tavern Tier to unlock stronger minions.
4. Collect **three copies** of the same minion and they merge into a **golden** version with
   doubled stats.
5. Hit **Fight!** to battle another captain. The loser takes damage based on the winner's
   Tavern Tier plus their surviving minions. At 0 health you're eliminated.

Minions that die in combat come back next round — losing a fight only costs you health,
never your warband.

### Controls

- **Recruit** — drag a minion from the tavern down onto the felt, or click it to add it to
  the end of your line.
- **Reposition** — drag a minion sideways on the felt. Position matters: minions attack in
  order from left to right.
- **Sell** — drag a minion up onto the tavern shelf to sell it back for 1 gold.
- **Hero power** — click it, then click the minion you want to target.

The economy, tier costs, shop sizes, triple-into-golden rule, and damage formula all follow
standard Battlegrounds rules.

## Factions

Each faction replaces one of the original Battlegrounds tribes and has its own play pattern:

| Faction | Identity |
| --- | --- |
| **Big Mom & Vinsmoke** | Family Bond — grow stronger after surviving damage (Frenzy) |
| **Marines & World Government** | Reinforcements — Deathrattles call in fresh troops |
| **Kaido & Doflamingo** | Raw Power — huge stats; neighbours are enraged when one falls |
| **Straw Hat Alliance** | Chain Reaction — every new ally lifts the rest of the crew |
| **Revolutionary Army** | Liberation — few but mighty minions that empower the whole board |
| **Gorosei & Admirals** | Absolute Power — sacrifice your own minions for enormous value |
| **Free Pirate Crews** | Swarm — cheap crews that buff each other as new members arrive |

Neutral minions belong to no faction and work with every build.

## Keywords

- **Taunt** — must be attacked first
- **Divine Shield** — ignores the first instance of damage
- **Poisonous** — any damage it deals destroys the target
- **Windfury** — attacks twice per turn
- **Reborn** — returns once with 1 health when it dies
- **Cleave** — also damages the minions beside the target

## Abilities

Minions use the same ability set as Battlegrounds, renamed to fit the setting —
Battlecries, Deathrattles, auras ("your other X have +1/+1"), Start of Combat,
Overkill, and triggers that fire when you play a minion, sell one, summon one,
lose one, survive damage, attack, or end your turn. The board-wide rule
benders are here too: Nico Robin doubles your Battlecries, Trafalgar Law
doubles your Deathrattles, and the Devil Fruit Scholar doubles your summons.

Combat plays out as an animated battle you watch — minions lunge, targets
recoil, triggers flare, and summons appear as they happen. You can run it at
2× speed or skip straight to the result.

## Project layout

```
src/
  engine/     game rules — combat sim, shop economy, bots, turn loop
  data/       card and hero definitions
  components/ React UI
  net/        websocket client hook
  shared/     wire protocol + serialization shared by client and server
server/       authoritative websocket game server (rooms, turn timer)
```

The engine is plain TypeScript with no React dependency, so the same rules run in the
browser for single player and on the server for online play.

Online games are server-authoritative: clients send actions (buy, sell, refresh, upgrade,
hero power, reorder, ready) and the server validates each one against its own copy of the
game state. Players only ever receive public information about their opponents, so nobody
can scout the board they're about to face.
