# 🏴‍☠️ Grand Line Battleground

A Hearthstone Battlegrounds-style auto-battler set in the One Piece universe. Build a crew in
the tavern, position them, and let them fight rival captains automatically. Last captain
standing wins.

## Running it

```bash
npm install
npm run dev
```

Then open the URL Vite prints (default <http://localhost:5173>).

## How to play

1. Pick a lobby size — **2, 4, or 8 players** — and choose a hero.
2. Each turn you get gold (2 on turn 1, +1 per turn, capped at 10).
3. Spend it in the tavern: **buy** minions (3g), **refresh** the offerings (1g), **freeze**
   the shop for next turn (free), or **upgrade** your Tavern Tier to unlock stronger minions.
4. Sell a minion with the ✕ button for 1g. Collect **three copies** of the same minion and
   they automatically merge into a **golden** version with doubled stats.
5. Hit **Fight!** to battle another captain. The loser takes damage based on the winner's
   Tavern Tier plus their surviving minions. At 0 health you're eliminated.

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

## Project layout

```
src/
  engine/     game rules — combat sim, shop economy, bots, turn loop
  data/       card and hero definitions
  components/ React UI
```

The engine is plain TypeScript with no React dependency, so the rules can be tested or
reused independently of the UI.
