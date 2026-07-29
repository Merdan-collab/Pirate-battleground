import type { CardDef } from '../engine/types';

// Every minion below is a One Piece re-skin of a Hearthstone Battlegrounds
// minion — the names, art and flavour change, the abilities do not. The
// comment above each card names the original it mirrors.

// ---------------------------------------------------------------------------
// TOKENS — summoned only, never offered in the tavern
// ---------------------------------------------------------------------------
const TOKENS: CardDef[] = [
  {
    // Tabbycat
    id: 'tok_cat',
    name: 'Stray Ship Cat',
    text: '',
    flavor: 'Every crew has one.',
    tier: 1,
    tribe: 'KAIDO_DOFLAMINGO',
    attack: 1,
    health: 1,
    keywords: [],
    isToken: true,
  },
  {
    // Murloc Scout
    id: 'tok_rookie',
    name: 'Deckhand Rookie',
    text: '',
    flavor: 'Signed on this morning.',
    tier: 1,
    tribe: 'FREE_PIRATES',
    attack: 1,
    health: 1,
    keywords: [],
    isToken: true,
  },
  {
    // Imp
    id: 'tok_agent',
    name: 'CP0 Agent',
    text: '',
    flavor: 'Never seen coming.',
    tier: 1,
    tribe: 'GOROSEI_ADMIRAL',
    attack: 1,
    health: 1,
    keywords: [],
    isToken: true,
  },
  {
    // Damaged Golem
    id: 'tok_broken_soldier',
    name: 'Battered Germa Soldier',
    text: '',
    flavor: 'Still standing, barely.',
    tier: 1,
    tribe: 'BIG_MOM_VINSMOKE',
    attack: 2,
    health: 1,
    keywords: [],
    isToken: true,
  },
  {
    // Spider (Infested Wolf)
    id: 'tok_smile_beast',
    name: 'SMILE Beast',
    text: '',
    flavor: 'A failed experiment that still bites.',
    tier: 1,
    tribe: 'KAIDO_DOFLAMINGO',
    attack: 1,
    health: 1,
    keywords: [],
    isToken: true,
  },
  {
    // Hyena (Savannah Highmane)
    id: 'tok_hyena',
    name: 'Beast Pirate Gifter',
    text: '',
    flavor: 'Loyal to the Governor-General.',
    tier: 1,
    tribe: 'KAIDO_DOFLAMINGO',
    attack: 2,
    health: 2,
    keywords: [],
    isToken: true,
  },
  {
    // Big Bad Wolf (Kindly Grandmother)
    id: 'tok_big_wolf',
    name: 'Awakened Beast',
    text: '',
    flavor: 'The old sailor was never a sailor.',
    tier: 1,
    tribe: 'KAIDO_DOFLAMINGO',
    attack: 3,
    health: 2,
    keywords: [],
    isToken: true,
  },
  {
    // Sky Pirate (Scallywag)
    id: 'tok_boarder',
    name: 'Boarding Party',
    text: '',
    flavor: 'Over the rail before you blink.',
    tier: 1,
    tribe: 'MARINE_WORLD_GOV',
    attack: 1,
    health: 1,
    keywords: [],
    isToken: true,
  },
  {
    // Voidwalker (Voidlord)
    id: 'tok_guard',
    name: 'Impel Down Guard',
    text: '',
    flavor: 'Level six never opens.',
    tier: 1,
    tribe: 'GOROSEI_ADMIRAL',
    attack: 1,
    health: 3,
    keywords: ['Taunt'],
    isToken: true,
  },
  {
    // Elemental (Sellemental)
    id: 'tok_wave',
    name: 'Rogue Wave',
    text: '',
    flavor: 'The sea answers back.',
    tier: 1,
    tribe: 'STRAWHAT_ALLIANCE',
    attack: 2,
    health: 2,
    keywords: [],
    isToken: true,
  },
  {
    // Microbot / generic mech-style token, used by Rat Pack analogue
    id: 'tok_recruit',
    name: 'Marine Recruit',
    text: '',
    flavor: 'Fresh from the academy.',
    tier: 1,
    tribe: 'MARINE_WORLD_GOV',
    attack: 1,
    health: 1,
    keywords: [],
    isToken: true,
  },
];

// ---------------------------------------------------------------------------
// TIER 1
// ---------------------------------------------------------------------------
const TIER_1: CardDef[] = [
  {
    // Alleycat
    id: 'kd_alleycat',
    name: 'Doflamingo Handler',
    text: 'Battlecry: Summon a 1/1 Stray Ship Cat.',
    flavor: 'He always travels with company.',
    tier: 1,
    tribe: 'KAIDO_DOFLAMINGO',
    attack: 1,
    health: 1,
    keywords: [],
    battlecry: [{ type: 'summon', cardId: 'tok_cat', count: 1 }],
  },
  {
    // Scavenging Hyena
    id: 'kd_scavenger',
    name: 'Beast Pirate Scavenger',
    text: 'Whenever a friendly Kaido & Doflamingo minion dies, gain +2/+1.',
    flavor: 'Feeds on his own crew when the fight turns.',
    tier: 1,
    tribe: 'KAIDO_DOFLAMINGO',
    attack: 2,
    health: 2,
    keywords: [],
    triggers: [
      {
        on: 'afterFriendlyDies',
        tribe: 'KAIDO_DOFLAMINGO',
        effects: [{ type: 'buff', target: 'self', attack: 2, health: 1 }],
      },
    ],
  },
  {
    // Murloc Tidecaller
    id: 'fp_lookout',
    name: 'Crow’s Nest Lookout',
    text: 'Whenever you summon a Free Pirate, gain +1 Attack.',
    flavor: 'Counts every sail on the horizon.',
    tier: 1,
    tribe: 'FREE_PIRATES',
    attack: 1,
    health: 2,
    keywords: [],
    triggers: [
      {
        on: 'afterFriendlySummoned',
        tribe: 'FREE_PIRATES',
        effects: [{ type: 'buff', target: 'self', attack: 1, health: 0 }],
      },
    ],
  },
  {
    // Murloc Tidehunter
    id: 'fp_recruiter',
    name: 'Dockside Recruiter',
    text: 'Battlecry: Summon a 1/1 Deckhand Rookie.',
    flavor: 'Signs anyone who can hold a rope.',
    tier: 1,
    tribe: 'FREE_PIRATES',
    attack: 2,
    health: 1,
    keywords: [],
    battlecry: [{ type: 'summon', cardId: 'tok_rookie', count: 1 }],
  },
  {
    // Rockpool Hunter
    id: 'fp_bosun',
    name: 'Rowdy Bosun',
    text: 'Battlecry: Give a friendly Free Pirate +1/+1.',
    flavor: 'Motivation, loudly applied.',
    tier: 1,
    tribe: 'FREE_PIRATES',
    attack: 2,
    health: 3,
    keywords: [],
    battlecry: [
      {
        type: 'buff',
        target: 'randomOtherFriendly',
        tribe: 'FREE_PIRATES',
        attack: 1,
        health: 1,
      },
    ],
  },
  {
    // Wrath Weaver
    id: 'ga_inquisitor',
    name: 'World Government Inquisitor',
    text: 'After you play a Gorosei & Admirals minion, deal 1 damage to your hero and gain +2/+2.',
    flavor: 'Every promotion is paid for in blood.',
    tier: 1,
    tribe: 'GOROSEI_ADMIRAL',
    attack: 1,
    health: 3,
    keywords: [],
    triggers: [
      {
        on: 'afterYouPlay',
        tribe: 'GOROSEI_ADMIRAL',
        effects: [
          { type: 'damageOwnHero', amount: 1 },
          { type: 'buff', target: 'self', attack: 2, health: 2 },
        ],
      },
    ],
  },
  {
    // Dragonspawn Lieutenant
    id: 'ra_vanguard',
    name: 'Revolutionary Vanguard',
    text: 'Taunt',
    flavor: 'Stands where the line would break.',
    tier: 1,
    tribe: 'REVOLUTIONARY_ARMY',
    attack: 2,
    health: 3,
    keywords: ['Taunt'],
  },
  {
    // Red Whelp
    id: 'ra_firestarter',
    name: 'Revolutionary Firestarter',
    text: 'Start of Combat: Deal damage equal to your number of Revolutionary Army minions to a random enemy.',
    flavor: 'The signal that starts the uprising.',
    tier: 1,
    tribe: 'REVOLUTIONARY_ARMY',
    attack: 1,
    health: 2,
    keywords: [],
    triggers: [
      {
        on: 'startOfCombat',
        effects: [
          { type: 'damageEnemy', amount: 1, perTribeCount: 'REVOLUTIONARY_ARMY', target: 'random' },
        ],
      },
    ],
  },
  {
    // Sellemental
    id: 'sh_sellsword',
    name: 'Water Seven Shipwright',
    text: 'When you sell this, add a 2/2 Rogue Wave to your hand.',
    flavor: 'Leaves something behind when he moves on.',
    tier: 1,
    tribe: 'STRAWHAT_ALLIANCE',
    attack: 2,
    health: 2,
    keywords: [],
    triggers: [
      { on: 'afterSelfSold', effects: [{ type: 'addToHand', count: 1, cardId: 'tok_wave' }] },
    ],
  },
  {
    // Refreshing Anomaly
    id: 'sh_navigator',
    name: 'Log Pose Navigator',
    text: 'Battlecry: The next tavern Refresh costs 0 gold.',
    flavor: 'Always knows what the next island holds.',
    tier: 1,
    tribe: 'STRAWHAT_ALLIANCE',
    attack: 1,
    health: 4,
    keywords: [],
    battlecry: [{ type: 'freeRefresh' }],
  },
  {
    // Deck Swabbie
    id: 'mn_swabbie',
    name: 'Marine Deck Swabbie',
    text: 'Battlecry: Reduce the cost of upgrading your Tavern by 1.',
    flavor: 'Scrubs the deck, hears everything.',
    tier: 1,
    tribe: 'MARINE_WORLD_GOV',
    attack: 2,
    health: 2,
    keywords: [],
    battlecry: [{ type: 'reduceUpgradeCost', amount: 1 }],
  },
  {
    // Scallywag
    id: 'mn_boarder',
    name: 'Marine Boarding Officer',
    text: 'Deathrattle: Summon a 1/1 Boarding Party. It attacks immediately.',
    flavor: 'Even his last order gets carried out.',
    tier: 1,
    tribe: 'MARINE_WORLD_GOV',
    attack: 2,
    health: 1,
    keywords: [],
    deathrattle: [
      { type: 'summon', cardId: 'tok_boarder', count: 1, attackImmediately: true },
    ],
  },
  {
    // Sun-Bacon Relaxer (Quilboar-style: grows when buffed)
    id: 'bm_taster',
    name: 'Charlotte Royal Taster',
    text: 'Taunt. Whenever this survives damage, gain +2 Health.',
    flavor: 'Tastes everything before Mama does.',
    tier: 1,
    tribe: 'BIG_MOM_VINSMOKE',
    attack: 1,
    health: 4,
    keywords: ['Taunt'],
    triggers: [
      {
        on: 'afterSelfSurvivesDamage',
        effects: [{ type: 'buff', target: 'self', attack: 0, health: 2 }],
      },
    ],
  },
  {
    // Righteous Protector
    id: 'nu_guardian',
    name: 'Loyal Bodyguard',
    text: 'Taunt, Divine Shield',
    flavor: 'Small, stubborn, hard to remove.',
    tier: 1,
    tribe: 'NONE',
    attack: 1,
    health: 1,
    keywords: ['Taunt', 'DivineShield'],
  },
];

// ---------------------------------------------------------------------------
// TIER 2
// ---------------------------------------------------------------------------
const TIER_2: CardDef[] = [
  {
    // Harvest Golem
    id: 'bm_germa_trooper',
    name: 'Germa 66 Trooper',
    text: 'Deathrattle: Summon a 2/1 Battered Germa Soldier.',
    flavor: 'Mass-produced, endlessly replaced.',
    tier: 2,
    tribe: 'BIG_MOM_VINSMOKE',
    attack: 2,
    health: 3,
    keywords: [],
    deathrattle: [{ type: 'summon', cardId: 'tok_broken_soldier', count: 1 }],
  },
  {
    // Kindly Grandmother
    id: 'kd_old_sailor',
    name: 'Kindly Old Sailor',
    text: 'Deathrattle: Summon a 3/2 Awakened Beast.',
    flavor: 'Nobody asked what fruit he ate.',
    tier: 2,
    tribe: 'KAIDO_DOFLAMINGO',
    attack: 1,
    health: 1,
    keywords: [],
    deathrattle: [{ type: 'summon', cardId: 'tok_big_wolf', count: 1 }],
  },
  {
    // Spawn of N'Zoth
    id: 'ga_cursed_envoy',
    name: 'Cursed Envoy',
    text: 'Deathrattle: Give your minions +1/+1.',
    flavor: 'His death is a message to the rest.',
    tier: 2,
    tribe: 'GOROSEI_ADMIRAL',
    attack: 2,
    health: 2,
    keywords: [],
    deathrattle: [{ type: 'buff', target: 'allFriendly', attack: 1, health: 1 }],
  },
  {
    // Selfless Hero
    id: 'nu_selfless',
    name: 'Selfless Deckhand',
    text: 'Deathrattle: Give a random friendly minion Divine Shield.',
    flavor: 'Takes the shot meant for someone else.',
    tier: 2,
    tribe: 'NONE',
    attack: 2,
    health: 1,
    keywords: [],
    deathrattle: [
      { type: 'gainKeyword', keyword: 'DivineShield', target: 'randomOtherFriendly' },
    ],
  },
  {
    // Unstable Ghoul
    id: 'nu_powder_keg',
    name: 'Walking Powder Keg',
    text: 'Taunt. Deathrattle: Deal 1 damage to all minions.',
    flavor: 'Everyone gives him room.',
    tier: 2,
    tribe: 'NONE',
    attack: 1,
    health: 3,
    keywords: ['Taunt'],
    deathrattle: [{ type: 'damageEnemy', amount: 1, target: 'all' }],
  },
  {
    // Nathrezim Overseer
    id: 'ga_overseer',
    name: 'Gorosei Overseer',
    text: 'Battlecry: Give a friendly Gorosei & Admirals minion +2/+2.',
    flavor: 'Promotion comes from above. Always.',
    tier: 2,
    tribe: 'GOROSEI_ADMIRAL',
    attack: 2,
    health: 3,
    keywords: [],
    battlecry: [
      {
        type: 'buff',
        target: 'randomOtherFriendly',
        tribe: 'GOROSEI_ADMIRAL',
        attack: 2,
        health: 2,
      },
    ],
  },
  {
    // Imprisoner
    id: 'ga_jailer',
    name: 'Impel Down Jailer',
    text: 'Taunt. Deathrattle: Summon a 1/1 CP0 Agent.',
    flavor: 'The cells are never empty for long.',
    tier: 2,
    tribe: 'GOROSEI_ADMIRAL',
    attack: 3,
    health: 3,
    keywords: ['Taunt'],
    deathrattle: [{ type: 'summon', cardId: 'tok_agent', count: 1 }],
  },
  {
    // Murloc Warleader
    id: 'fp_warlord',
    name: 'Rookie Crew Warlord',
    text: 'Your other Free Pirates have +2 Attack.',
    flavor: 'Leads from the front, loudly.',
    tier: 2,
    tribe: 'FREE_PIRATES',
    attack: 3,
    health: 3,
    keywords: [],
    aura: { tribe: 'FREE_PIRATES', attack: 2, health: 0 },
  },
  {
    // Old Murk-Eye
    id: 'fp_veteran',
    name: 'Grand Line Veteran',
    text: 'Has +1 Attack for each other friendly Free Pirate.',
    flavor: 'Sailed with every crew that ever mattered.',
    tier: 2,
    tribe: 'FREE_PIRATES',
    attack: 2,
    health: 4,
    keywords: [],
    triggers: [
      {
        on: 'startOfCombat',
        effects: [
          {
            type: 'buff',
            target: 'self',
            attack: 1,
            health: 0,
            perTribeCount: 'FREE_PIRATES',
          },
        ],
      },
    ],
  },
  {
    // Southsea Captain
    id: 'mn_commodore',
    name: 'Marine Commodore',
    text: 'Your other Marines & World Gov. minions have +1/+1.',
    flavor: 'Discipline is contagious.',
    tier: 2,
    tribe: 'MARINE_WORLD_GOV',
    attack: 3,
    health: 3,
    keywords: [],
    aura: { tribe: 'MARINE_WORLD_GOV', attack: 1, health: 1 },
  },
  {
    // Freedealing Gambler
    id: 'mn_smuggler',
    name: 'Black Market Smuggler',
    text: 'Sell this minion for 3 gold.',
    flavor: 'Worth more gone than aboard.',
    tier: 2,
    tribe: 'MARINE_WORLD_GOV',
    attack: 3,
    health: 3,
    keywords: [],
    sellValue: 3,
  },
  {
    // Yo-Ho-Ogre
    id: 'mn_bruiser',
    name: 'Marine Bruiser',
    text: 'Taunt. After this survives damage, it attacks immediately.',
    flavor: 'Hitting him is a mistake you make once.',
    tier: 2,
    tribe: 'MARINE_WORLD_GOV',
    attack: 2,
    health: 5,
    keywords: ['Taunt'],
    triggers: [
      {
        on: 'afterSelfSurvivesDamage',
        effects: [{ type: 'attackImmediately', target: 'self' }],
      },
    ],
  },
  {
    // Glyph Guardian
    id: 'ra_zealot',
    name: 'Revolutionary Zealot',
    text: 'Whenever this attacks, double its Attack.',
    flavor: 'Belief compounds.',
    tier: 2,
    tribe: 'REVOLUTIONARY_ARMY',
    attack: 2,
    health: 4,
    keywords: [],
    triggers: [
      { on: 'afterSelfAttacks', effects: [{ type: 'doubleAttack', target: 'self' }] },
    ],
  },
  {
    // Molten Rock
    id: 'sh_shipwright',
    name: 'Galley-La Foreman',
    text: 'Taunt. After you play a Straw Hat Alliance minion, gain +1 Health.',
    flavor: 'Reinforces the hull with every new hand.',
    tier: 2,
    tribe: 'STRAWHAT_ALLIANCE',
    attack: 3,
    health: 3,
    keywords: ['Taunt'],
    triggers: [
      {
        on: 'afterYouPlay',
        tribe: 'STRAWHAT_ALLIANCE',
        effects: [{ type: 'buff', target: 'self', attack: 0, health: 1 }],
      },
    ],
  },
  {
    // Party Elemental
    id: 'sh_partygoer',
    name: 'Thousand Sunny Crewmate',
    text: 'After you play a Straw Hat Alliance minion, give another random one +1/+1.',
    flavor: 'Every arrival is worth a party.',
    tier: 2,
    tribe: 'STRAWHAT_ALLIANCE',
    attack: 3,
    health: 2,
    keywords: [],
    triggers: [
      {
        on: 'afterYouPlay',
        tribe: 'STRAWHAT_ALLIANCE',
        effects: [
          {
            type: 'buff',
            target: 'randomOtherFriendly',
            tribe: 'STRAWHAT_ALLIANCE',
            attack: 1,
            health: 1,
          },
        ],
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// TIER 3
// ---------------------------------------------------------------------------
const TIER_3: CardDef[] = [
  {
    // Infested Wolf
    id: 'kd_smile_handler',
    name: 'SMILE Factory Handler',
    text: 'Deathrattle: Summon two 1/1 SMILE Beasts.',
    flavor: 'The failures still follow him.',
    tier: 3,
    tribe: 'KAIDO_DOFLAMINGO',
    attack: 3,
    health: 3,
    keywords: [],
    deathrattle: [{ type: 'summon', cardId: 'tok_smile_beast', count: 2 }],
  },
  {
    // Pack Leader
    id: 'kd_jack',
    name: 'Jack the Drought',
    text: 'Whenever you summon a Kaido & Doflamingo minion, give it +2 Attack.',
    flavor: 'All Star of the Beast Pirates.',
    tier: 3,
    tribe: 'KAIDO_DOFLAMINGO',
    attack: 3,
    health: 3,
    keywords: [],
    triggers: [
      {
        on: 'afterFriendlySummoned',
        tribe: 'KAIDO_DOFLAMINGO',
        effects: [{ type: 'buff', target: 'eventSubject', attack: 2, health: 0 }],
      },
    ],
  },
  {
    // Houndmaster
    id: 'kd_beastmaster',
    name: 'Beast Pirate Handler',
    text: 'Battlecry: Give a friendly Kaido & Doflamingo minion +2/+2 and Taunt.',
    flavor: 'Puts the biggest one out front.',
    tier: 3,
    tribe: 'KAIDO_DOFLAMINGO',
    attack: 4,
    health: 3,
    keywords: [],
    battlecry: [
      {
        type: 'buff',
        target: 'randomOtherFriendly',
        tribe: 'KAIDO_DOFLAMINGO',
        attack: 2,
        health: 2,
      },
      {
        type: 'gainKeyword',
        keyword: 'Taunt',
        target: 'randomOtherFriendly',
        tribe: 'KAIDO_DOFLAMINGO',
      },
    ],
  },
  {
    // Monstrous Macaw
    id: 'kd_scout_bird',
    name: 'News Coo Scout',
    text: "After this attacks, trigger a friendly minion's Deathrattle.",
    flavor: 'Delivers more than newspapers.',
    tier: 3,
    tribe: 'KAIDO_DOFLAMINGO',
    attack: 4,
    health: 3,
    keywords: [],
    triggers: [
      {
        on: 'afterSelfAttacks',
        effects: [{ type: 'triggerFriendlyDeathrattle', count: 1 }],
      },
    ],
  },
  {
    // Coldlight Seer
    id: 'fp_seer',
    name: 'Fishman Island Seer',
    text: 'Battlecry: Give your other Free Pirates +2 Health.',
    flavor: 'Reads the tide and the crew alike.',
    tier: 3,
    tribe: 'FREE_PIRATES',
    attack: 2,
    health: 3,
    keywords: [],
    battlecry: [
      { type: 'buff', target: 'otherFriendly', tribe: 'FREE_PIRATES', attack: 0, health: 2 },
    ],
  },
  {
    // Felfin Navigator
    id: 'fp_helmsman',
    name: 'Fishman Helmsman',
    text: 'Battlecry: Give your other Free Pirates +1/+1.',
    flavor: 'Keeps the whole fleet in formation.',
    tier: 3,
    tribe: 'FREE_PIRATES',
    attack: 4,
    health: 4,
    keywords: [],
    battlecry: [
      { type: 'buff', target: 'otherFriendly', tribe: 'FREE_PIRATES', attack: 1, health: 1 },
    ],
  },
  {
    // Soul Juggler
    id: 'ga_executioner',
    name: 'World Government Executioner',
    text: 'After a friendly Gorosei & Admirals minion dies, deal 3 damage to a random enemy minion.',
    flavor: 'Every loss is answered in kind.',
    tier: 3,
    tribe: 'GOROSEI_ADMIRAL',
    attack: 3,
    health: 5,
    keywords: [],
    triggers: [
      {
        on: 'afterFriendlyDies',
        tribe: 'GOROSEI_ADMIRAL',
        effects: [{ type: 'damageEnemy', amount: 3, target: 'random' }],
      },
    ],
  },
  {
    // Imp Gang Boss
    id: 'ga_cipher_chief',
    name: 'Cipher Pol Chief',
    text: 'Whenever this takes damage, summon a 1/1 CP0 Agent.',
    flavor: 'Cut one down, two step out of the shadows.',
    tier: 3,
    tribe: 'GOROSEI_ADMIRAL',
    attack: 2,
    health: 4,
    keywords: [],
    triggers: [
      {
        on: 'afterSelfSurvivesDamage',
        effects: [{ type: 'summon', cardId: 'tok_agent', count: 1 }],
      },
    ],
  },
  {
    // Bronze Warden
    id: 'ra_immortal',
    name: 'Revolutionary Martyr',
    text: 'Divine Shield, Reborn',
    flavor: 'The cause outlives the soldier.',
    tier: 3,
    tribe: 'REVOLUTIONARY_ARMY',
    attack: 2,
    health: 1,
    keywords: ['DivineShield', 'Reborn'],
  },
  {
    // Twilight Emissary
    id: 'ra_emissary',
    name: 'Revolutionary Emissary',
    text: 'Battlecry: Give a friendly Revolutionary Army minion +2/+2 and Taunt.',
    flavor: 'Carries Dragon’s word to the front.',
    tier: 3,
    tribe: 'REVOLUTIONARY_ARMY',
    attack: 4,
    health: 4,
    keywords: ['Taunt'],
    battlecry: [
      {
        type: 'buff',
        target: 'randomOtherFriendly',
        tribe: 'REVOLUTIONARY_ARMY',
        attack: 2,
        health: 2,
      },
      {
        type: 'gainKeyword',
        keyword: 'Taunt',
        target: 'randomOtherFriendly',
        tribe: 'REVOLUTIONARY_ARMY',
      },
    ],
  },
  {
    // Salty Looter
    id: 'mn_quartermaster',
    name: 'Marine Quartermaster',
    text: 'Whenever you play a Marines & World Gov. minion, gain +1/+1.',
    flavor: 'Every requisition makes him stronger.',
    tier: 3,
    tribe: 'MARINE_WORLD_GOV',
    attack: 4,
    health: 4,
    keywords: [],
    triggers: [
      {
        on: 'afterYouPlay',
        tribe: 'MARINE_WORLD_GOV',
        effects: [{ type: 'buff', target: 'self', attack: 1, health: 1 }],
      },
    ],
  },
  {
    // Bloodsail Cannoneer
    id: 'mn_gunner',
    name: 'Marine Master Gunner',
    text: 'Battlecry: Give your other Marines & World Gov. minions +3 Attack.',
    flavor: 'Sights the guns for the whole line.',
    tier: 3,
    tribe: 'MARINE_WORLD_GOV',
    attack: 4,
    health: 3,
    keywords: [],
    battlecry: [
      { type: 'buff', target: 'otherFriendly', tribe: 'MARINE_WORLD_GOV', attack: 3, health: 0 },
    ],
  },
  {
    // Arcane Assistant
    id: 'sh_first_mate',
    name: 'Straw Hat First Mate',
    text: 'Battlecry: Give your Straw Hat Alliance minions +1/+1.',
    flavor: 'Holds the crew together.',
    tier: 3,
    tribe: 'STRAWHAT_ALLIANCE',
    attack: 3,
    health: 3,
    keywords: [],
    battlecry: [
      { type: 'buff', target: 'otherFriendly', tribe: 'STRAWHAT_ALLIANCE', attack: 1, health: 1 },
    ],
  },
  {
    // Crackling Cyclone
    id: 'sh_storm_rider',
    name: 'Storm Rider',
    text: 'Divine Shield, Windfury',
    flavor: 'Rides the squall straight through the line.',
    tier: 3,
    tribe: 'STRAWHAT_ALLIANCE',
    attack: 4,
    health: 1,
    keywords: ['DivineShield', 'Windfury'],
  },
  {
    // Crowd Favorite
    id: 'nu_crowd_favorite',
    name: 'Colosseum Champion',
    text: 'Whenever you play a minion with Battlecry, gain +1/+1.',
    flavor: 'Plays to the crowd at Corrida.',
    tier: 3,
    tribe: 'NONE',
    attack: 4,
    health: 4,
    keywords: [],
    triggers: [
      {
        on: 'afterYouPlay',
        effects: [{ type: 'buff', target: 'self', attack: 1, health: 1 }],
      },
    ],
  },
  {
    // Khadgar
    id: 'nu_devil_scholar',
    name: 'Devil Fruit Scholar',
    text: 'Your cards that summon minions summon twice as many.',
    flavor: 'He worked out how the copies work.',
    tier: 3,
    tribe: 'NONE',
    attack: 2,
    health: 2,
    keywords: [],
    modifier: 'doubleSummon',
  },
];

// ---------------------------------------------------------------------------
// TIER 4
// ---------------------------------------------------------------------------
const TIER_4: CardDef[] = [
  {
    // Savannah Highmane
    id: 'kd_queen',
    name: 'Queen the Plague',
    text: 'Deathrattle: Summon two 2/2 Beast Pirate Gifters.',
    flavor: 'All Star, and a terrible singer.',
    tier: 4,
    tribe: 'KAIDO_DOFLAMINGO',
    attack: 6,
    health: 5,
    keywords: [],
    deathrattle: [{ type: 'summon', cardId: 'tok_hyena', count: 2 }],
  },
  {
    // Cave Hydra
    id: 'kd_whoswho',
    name: "Who's-Who",
    text: 'Cleave — also damages the minions next to whoever it attacks.',
    flavor: 'Cuts through a whole rank at once.',
    tier: 4,
    tribe: 'KAIDO_DOFLAMINGO',
    attack: 2,
    health: 4,
    keywords: ['Cleave'],
  },
  {
    // Virmen Sensei
    id: 'kd_trainer',
    name: 'Beast Pirate Trainer',
    text: 'Battlecry: Give a friendly Kaido & Doflamingo minion +2/+2.',
    flavor: 'Drills them until they stop being people.',
    tier: 4,
    tribe: 'KAIDO_DOFLAMINGO',
    attack: 4,
    health: 5,
    keywords: [],
    battlecry: [
      {
        type: 'buff',
        target: 'randomOtherFriendly',
        tribe: 'KAIDO_DOFLAMINGO',
        attack: 2,
        health: 2,
      },
    ],
  },
  {
    // Siegebreaker
    id: 'ga_admiral_kizaru',
    name: 'Admiral Kizaru',
    text: 'Your other Gorosei & Admirals minions have +1/+1.',
    flavor: 'Moves at the speed of light, thinks slower.',
    tier: 4,
    tribe: 'GOROSEI_ADMIRAL',
    attack: 5,
    health: 8,
    keywords: ['Taunt'],
    aura: { tribe: 'GOROSEI_ADMIRAL', attack: 1, health: 1 },
  },
  {
    // Ring Matron
    id: 'ga_warden',
    name: 'Impel Down Warden',
    text: 'Taunt. Deathrattle: Summon two 1/3 Impel Down Guards.',
    flavor: 'The prison staffs itself.',
    tier: 4,
    tribe: 'GOROSEI_ADMIRAL',
    attack: 6,
    health: 4,
    keywords: ['Taunt'],
    deathrattle: [{ type: 'summon', cardId: 'tok_guard', count: 2 }],
  },
  {
    // Ripsnarl Captain
    id: 'mn_vice_admiral',
    name: 'Vice Admiral Garp',
    text: 'Whenever a friendly Marines & World Gov. minion attacks, give it +2/+2.',
    flavor: 'The hero who cornered the Pirate King.',
    tier: 4,
    tribe: 'MARINE_WORLD_GOV',
    attack: 4,
    health: 5,
    keywords: [],
    triggers: [
      {
        on: 'afterSelfAttacks',
        tribe: 'MARINE_WORLD_GOV',
        effects: [{ type: 'buff', target: 'eventSubject', attack: 2, health: 2 }],
      },
    ],
  },
  {
    // Goldgrubber
    id: 'mn_treasurer',
    name: 'World Gov. Treasurer',
    text: 'At the end of your turn, give a Golden minion +2/+2.',
    flavor: 'Counts the treasury twice a night.',
    tier: 4,
    tribe: 'MARINE_WORLD_GOV',
    attack: 5,
    health: 5,
    keywords: [],
    triggers: [
      {
        on: 'endOfTurn',
        effects: [{ type: 'buff', target: 'randomFriendly', attack: 2, health: 2 }],
      },
    ],
  },
  {
    // Cobalt Scalebane
    id: 'ra_kuma',
    name: 'Bartholomew Kuma',
    text: 'At the end of your turn, give another friendly minion +3 Attack.',
    flavor: 'Sends people exactly where they need to go.',
    tier: 4,
    tribe: 'REVOLUTIONARY_ARMY',
    attack: 5,
    health: 5,
    keywords: [],
    triggers: [
      {
        on: 'endOfTurn',
        effects: [{ type: 'buff', target: 'randomOtherFriendly', attack: 3, health: 0 }],
      },
    ],
  },
  {
    // Herald of Flame
    id: 'ra_sabo',
    name: 'Sabo, Chief of Staff',
    text: 'Overkill: Deal 3 damage to the left-most enemy minion.',
    flavor: 'The flames keep going after the target falls.',
    tier: 4,
    tribe: 'REVOLUTIONARY_ARMY',
    attack: 5,
    health: 6,
    keywords: [],
    triggers: [
      {
        on: 'onOverkill',
        effects: [{ type: 'damageEnemy', amount: 3, target: 'leftmost' }],
      },
    ],
  },
  {
    // Wildfire Elemental
    id: 'sh_franky',
    name: 'Franky, Cyborg Shipwright',
    text: 'Overkill: Deal 3 damage to a random enemy minion.',
    flavor: 'SUPER overkill.',
    tier: 4,
    tribe: 'STRAWHAT_ALLIANCE',
    attack: 6,
    health: 4,
    keywords: [],
    triggers: [
      { on: 'onOverkill', effects: [{ type: 'damageEnemy', amount: 3, target: 'random' }] },
    ],
  },
  {
    // Majordomo Executus / Lieutenant-style end of turn buff
    id: 'sh_jinbe',
    name: 'Jinbe, Helmsman',
    text: 'At the end of your turn, give your left-most minion +2/+2.',
    flavor: 'Steers the Sunny through anything.',
    tier: 4,
    tribe: 'STRAWHAT_ALLIANCE',
    attack: 5,
    health: 6,
    keywords: ['Taunt'],
    triggers: [
      { on: 'endOfTurn', effects: [{ type: 'buff', target: 'leftmost', attack: 2, health: 2 }] },
    ],
  },
  {
    // Defender of Argus
    id: 'nu_bartolomeo',
    name: 'Bartolomeo the Cannibal',
    text: 'Battlecry: Give the minions next to this +1/+1 and Taunt.',
    flavor: 'His barrier covers whoever stands beside him.',
    tier: 4,
    tribe: 'NONE',
    attack: 3,
    health: 4,
    keywords: [],
    battlecry: [
      { type: 'buff', target: 'adjacent', attack: 1, health: 1 },
      { type: 'gainKeyword', keyword: 'Taunt', target: 'adjacent' },
    ],
  },
  {
    // Bristleback Brute (Quilboar)
    id: 'bm_katakuri',
    name: 'Charlotte Katakuri',
    text: 'Whenever this survives damage, gain +2/+2 and Divine Shield.',
    flavor: 'He saw the hit coming an hour ago.',
    tier: 4,
    tribe: 'BIG_MOM_VINSMOKE',
    attack: 4,
    health: 6,
    keywords: [],
    triggers: [
      {
        on: 'afterSelfSurvivesDamage',
        oncePerCombat: true,
        effects: [
          { type: 'buff', target: 'self', attack: 2, health: 2 },
          { type: 'gainKeyword', keyword: 'DivineShield', target: 'self' },
        ],
      },
    ],
  },
  {
    // Iron Sensei (Quilboar-adjacent end of turn)
    id: 'bm_judge',
    name: 'Vinsmoke Judge',
    text: 'At the end of your turn, give another friendly Big Mom & Vinsmoke minion +2/+2.',
    flavor: 'Improves his children, as he sees it.',
    tier: 4,
    tribe: 'BIG_MOM_VINSMOKE',
    attack: 4,
    health: 4,
    keywords: [],
    triggers: [
      {
        on: 'endOfTurn',
        effects: [
          {
            type: 'buff',
            target: 'randomOtherFriendly',
            tribe: 'BIG_MOM_VINSMOKE',
            attack: 2,
            health: 2,
          },
        ],
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// TIER 5
// ---------------------------------------------------------------------------
const TIER_5: CardDef[] = [
  {
    // Brann Bronzebeard
    id: 'nu_robin',
    name: 'Nico Robin, Archaeologist',
    text: 'Your Battlecries trigger twice.',
    flavor: 'She reads what everyone else destroyed.',
    tier: 5,
    tribe: 'NONE',
    attack: 2,
    health: 4,
    keywords: [],
    modifier: 'doubleBattlecry',
  },
  {
    // Baron Rivendare
    id: 'nu_law',
    name: 'Trafalgar Law, Surgeon of Death',
    text: 'Your minions trigger their Deathrattles twice.',
    flavor: 'Death is a procedure he can repeat.',
    tier: 5,
    tribe: 'NONE',
    attack: 1,
    health: 7,
    keywords: [],
    modifier: 'doubleDeathrattle',
  },
  {
    // Mama Bear
    id: 'kd_kaido_rider',
    name: 'Kaido, Beast Commander',
    text: 'Whenever you summon a Kaido & Doflamingo minion, give it +4/+4.',
    flavor: 'Nothing under him is allowed to be weak.',
    tier: 5,
    tribe: 'KAIDO_DOFLAMINGO',
    attack: 4,
    health: 4,
    keywords: [],
    triggers: [
      {
        on: 'afterFriendlySummoned',
        tribe: 'KAIDO_DOFLAMINGO',
        effects: [{ type: 'buff', target: 'eventSubject', attack: 4, health: 4 }],
      },
    ],
  },
  {
    // Ironhide Direhorn
    id: 'kd_king',
    name: 'King the Wildfire',
    text: 'Overkill: Summon a 5/5 Awakened Beast.',
    flavor: 'The last of the Lunarians.',
    tier: 5,
    tribe: 'KAIDO_DOFLAMINGO',
    attack: 7,
    health: 7,
    keywords: [],
    triggers: [
      { on: 'onOverkill', effects: [{ type: 'summon', cardId: 'tok_big_wolf', count: 1 }] },
    ],
  },
  {
    // King Bagurgle
    id: 'fp_jinbe_boss',
    name: 'Fishman Pirate Boss',
    text: 'Battlecry and Deathrattle: Give your other Free Pirates +2/+2.',
    flavor: 'Looks after his own, alive or not.',
    tier: 5,
    tribe: 'FREE_PIRATES',
    attack: 6,
    health: 3,
    keywords: [],
    battlecry: [
      { type: 'buff', target: 'otherFriendly', tribe: 'FREE_PIRATES', attack: 2, health: 2 },
    ],
    deathrattle: [
      { type: 'buff', target: 'otherFriendly', tribe: 'FREE_PIRATES', attack: 2, health: 2 },
    ],
  },
  {
    // Mal'Ganis
    id: 'ga_akainu',
    name: 'Fleet Admiral Sakazuki',
    text: 'Your other Gorosei & Admirals minions have +2/+2.',
    flavor: 'Absolute Justice, absolutely applied.',
    tier: 5,
    tribe: 'GOROSEI_ADMIRAL',
    attack: 9,
    health: 7,
    keywords: [],
    aura: { tribe: 'GOROSEI_ADMIRAL', attack: 2, health: 2 },
  },
  {
    // Voidlord
    id: 'ga_magellan',
    name: 'Magellan, Chief Warden',
    text: 'Taunt. Deathrattle: Summon three 1/3 Impel Down Guards.',
    flavor: 'Poison and paperwork in equal measure.',
    tier: 5,
    tribe: 'GOROSEI_ADMIRAL',
    attack: 3,
    health: 9,
    keywords: ['Taunt'],
    deathrattle: [{ type: 'summon', cardId: 'tok_guard', count: 3 }],
  },
  {
    // Annihilan Battlemaster
    id: 'ga_urouge',
    name: 'Urouge the Mad Monk',
    text: 'Battlecry: Gain +1 Health for each damage your hero has taken.',
    flavor: 'Grows on other people’s violence.',
    tier: 5,
    tribe: 'GOROSEI_ADMIRAL',
    attack: 3,
    health: 1,
    keywords: [],
    battlecry: [{ type: 'buffPerHeroDamage', healthPerDamage: 1 }],
  },
  {
    // Razorgore / Nadina-style dragon payoff
    id: 'ra_ivankov',
    name: 'Emporio Ivankov',
    text: 'At the end of your turn, give your Revolutionary Army minions +1/+1.',
    flavor: 'Hormones fix everything, apparently.',
    tier: 5,
    tribe: 'REVOLUTIONARY_ARMY',
    attack: 4,
    health: 8,
    keywords: [],
    triggers: [
      {
        on: 'endOfTurn',
        effects: [
          {
            type: 'buff',
            target: 'otherFriendly',
            tribe: 'REVOLUTIONARY_ARMY',
            attack: 1,
            health: 1,
          },
        ],
      },
    ],
  },
  {
    // Seabreaker Goliath
    id: 'mn_aokiji',
    name: 'Admiral Aokiji',
    text: 'After you play a Marines & World Gov. minion, give your other ones +2/+2.',
    flavor: 'Lazy justice, freezing everything in place.',
    tier: 5,
    tribe: 'MARINE_WORLD_GOV',
    attack: 7,
    health: 7,
    keywords: ['Windfury'],
    triggers: [
      {
        on: 'afterYouPlay',
        tribe: 'MARINE_WORLD_GOV',
        effects: [
          {
            type: 'buff',
            target: 'otherFriendly',
            tribe: 'MARINE_WORLD_GOV',
            attack: 2,
            health: 2,
          },
        ],
      },
    ],
  },
  {
    // Lightfang Enforcer
    id: 'sh_luffy_g4',
    name: 'Luffy, Gear Fourth',
    text: 'At the end of your turn, give a friendly minion of each faction +2/+2.',
    flavor: 'Bounces off everything, including sense.',
    tier: 5,
    tribe: 'STRAWHAT_ALLIANCE',
    attack: 2,
    health: 2,
    keywords: [],
    triggers: [
      {
        on: 'endOfTurn',
        effects: [
          { type: 'buff', target: 'randomFriendly', tribe: 'STRAWHAT_ALLIANCE', attack: 2, health: 2 },
          { type: 'buff', target: 'randomFriendly', tribe: 'MARINE_WORLD_GOV', attack: 2, health: 2 },
          { type: 'buff', target: 'randomFriendly', tribe: 'KAIDO_DOFLAMINGO', attack: 2, health: 2 },
          { type: 'buff', target: 'randomFriendly', tribe: 'FREE_PIRATES', attack: 2, health: 2 },
          { type: 'buff', target: 'randomFriendly', tribe: 'REVOLUTIONARY_ARMY', attack: 2, health: 2 },
          { type: 'buff', target: 'randomFriendly', tribe: 'GOROSEI_ADMIRAL', attack: 2, health: 2 },
          { type: 'buff', target: 'randomFriendly', tribe: 'BIG_MOM_VINSMOKE', attack: 2, health: 2 },
        ],
      },
    ],
  },
  {
    // Strongshell Scavenger
    id: 'bm_smoothie',
    name: 'Charlotte Smoothie',
    text: 'Battlecry: Give your Taunt minions +2/+2.',
    flavor: 'Wrings the strength out of anything.',
    tier: 5,
    tribe: 'BIG_MOM_VINSMOKE',
    attack: 3,
    health: 4,
    keywords: [],
    battlecry: [{ type: 'buff', target: 'otherFriendly', attack: 2, health: 2 }],
  },
];

// ---------------------------------------------------------------------------
// TIER 6
// ---------------------------------------------------------------------------
const TIER_6: CardDef[] = [
  {
    // Zapp Slywick
    id: 'nu_zoro',
    name: 'Roronoa Zoro, Three-Sword Style',
    text: 'Windfury. Always attacks the enemy with the lowest Attack.',
    flavor: 'Lost again, still cut everything down.',
    tier: 6,
    tribe: 'NONE',
    attack: 7,
    health: 10,
    keywords: ['Windfury'],
  },
  {
    // Maexxna
    id: 'nu_magellan_venom',
    name: 'Venom Demon',
    text: 'Poisonous',
    flavor: 'One scratch is enough.',
    tier: 6,
    tribe: 'NONE',
    attack: 4,
    health: 4,
    keywords: ['Poisonous', 'Taunt'],
  },
  {
    // Foe Reaper 4000
    id: 'kd_kaido_dragon',
    name: 'Kaido, Strongest Creature',
    text: 'Cleave — also damages the minions next to whoever it attacks.',
    flavor: 'Cannot die. Has checked repeatedly.',
    tier: 6,
    tribe: 'KAIDO_DOFLAMINGO',
    attack: 6,
    health: 9,
    keywords: ['Cleave'],
  },
  {
    // Goldrinn, the Great Wolf
    id: 'kd_beast_king',
    name: 'Beast King of Onigashima',
    text: 'Deathrattle: Give your Kaido & Doflamingo minions +4/+4.',
    flavor: 'His fall enrages the whole island.',
    tier: 6,
    tribe: 'KAIDO_DOFLAMINGO',
    attack: 4,
    health: 4,
    keywords: [],
    deathrattle: [
      { type: 'buff', target: 'otherFriendly', tribe: 'KAIDO_DOFLAMINGO', attack: 4, health: 4 },
    ],
  },
  {
    // Ghastcoiler
    id: 'ga_im',
    name: 'Im, the Empty Throne',
    text: 'Deathrattle: Summon 2 random minions with Deathrattle.',
    flavor: 'Nobody knows what sits on that throne.',
    tier: 6,
    tribe: 'GOROSEI_ADMIRAL',
    attack: 7,
    health: 7,
    keywords: [],
    deathrattle: [{ type: 'summonRandom', count: 2, requireDeathrattle: true, maxTier: 5 }],
  },
  {
    // Imp Mama
    id: 'ga_gorosei',
    name: 'Gorosei Saint Saturn',
    text: 'Whenever this takes damage, summon a random Gorosei & Admirals minion with Taunt.',
    flavor: 'One of the five who truly rule.',
    tier: 6,
    tribe: 'GOROSEI_ADMIRAL',
    attack: 6,
    health: 10,
    keywords: [],
    triggers: [
      {
        on: 'afterSelfSurvivesDamage',
        effects: [
          {
            type: 'summonRandom',
            count: 1,
            tribe: 'GOROSEI_ADMIRAL',
            maxTier: 5,
            withTaunt: true,
          },
        ],
      },
    ],
  },
  {
    // The Tide Razor
    id: 'mn_sengoku',
    name: 'Fleet Admiral Sengoku',
    text: 'Deathrattle: Summon 3 random Marines & World Gov. minions.',
    flavor: 'The whole Navy answers his fall.',
    tier: 6,
    tribe: 'MARINE_WORLD_GOV',
    attack: 6,
    health: 4,
    keywords: [],
    deathrattle: [
      { type: 'summonRandom', count: 3, tribe: 'MARINE_WORLD_GOV', maxTier: 5 },
    ],
  },
  {
    // Dread Admiral Eliza
    id: 'mn_eliza',
    name: 'Admiral Fujitora',
    text: 'Whenever a friendly Marines & World Gov. minion attacks, give your minions +2/+1.',
    flavor: 'Blind, and sees more than anyone.',
    tier: 6,
    tribe: 'MARINE_WORLD_GOV',
    attack: 6,
    health: 7,
    keywords: [],
    triggers: [
      {
        on: 'afterSelfAttacks',
        tribe: 'MARINE_WORLD_GOV',
        effects: [{ type: 'buff', target: 'allFriendly', attack: 2, health: 1 }],
      },
    ],
  },
  {
    // Nadina the Red
    id: 'ra_dragon',
    name: 'Monkey D. Dragon',
    text: 'Deathrattle: Give your Revolutionary Army minions Divine Shield.',
    flavor: 'The world’s most wanted man.',
    tier: 6,
    tribe: 'REVOLUTIONARY_ARMY',
    attack: 7,
    health: 4,
    keywords: [],
    deathrattle: [
      {
        type: 'gainKeyword',
        keyword: 'DivineShield',
        target: 'otherFriendly',
        tribe: 'REVOLUTIONARY_ARMY',
      },
    ],
  },
  {
    // Kalecgos, Arcane Aspect
    id: 'ra_koala',
    name: 'Koala, Fishman Karate Master',
    text: 'After you play a minion with Battlecry, give your Revolutionary Army minions +1/+1.',
    flavor: 'Teaches the army to hit back.',
    tier: 6,
    tribe: 'REVOLUTIONARY_ARMY',
    attack: 4,
    health: 12,
    keywords: [],
    triggers: [
      {
        on: 'afterYouPlay',
        effects: [
          {
            type: 'buff',
            target: 'otherFriendly',
            tribe: 'REVOLUTIONARY_ARMY',
            attack: 1,
            health: 1,
          },
        ],
      },
    ],
  },
  {
    // Lil' Rag
    id: 'sh_luffy_g5',
    name: 'Luffy, Gear Fifth',
    text: 'At the end of your turn, give a friendly minion +1/+1 for each Straw Hat Alliance minion you have.',
    flavor: 'The Sun God Nika, drums and all.',
    tier: 6,
    tribe: 'STRAWHAT_ALLIANCE',
    attack: 6,
    health: 6,
    keywords: [],
    triggers: [
      {
        on: 'endOfTurn',
        effects: [
          {
            type: 'buff',
            target: 'randomFriendly',
            attack: 1,
            health: 1,
            perTribeCount: 'STRAWHAT_ALLIANCE',
            includeSelfInCount: true,
          },
        ],
      },
    ],
  },
  {
    // Charlga / Quilboar capstone
    id: 'bm_bigmom',
    name: 'Charlotte "Big Mom" Linlin',
    text: 'Start of Combat: Give your minions +2/+2. Whenever this survives damage, gain +4 Attack.',
    flavor: 'Her tantrums level countries.',
    tier: 6,
    tribe: 'BIG_MOM_VINSMOKE',
    attack: 8,
    health: 8,
    keywords: ['Taunt'],
    triggers: [
      {
        on: 'startOfCombat',
        effects: [{ type: 'buff', target: 'otherFriendly', attack: 2, health: 2 }],
      },
      {
        on: 'afterSelfSurvivesDamage',
        effects: [{ type: 'buff', target: 'self', attack: 4, health: 0 }],
      },
    ],
  },
];

export const CARDS: CardDef[] = [
  ...TOKENS,
  ...TIER_1,
  ...TIER_2,
  ...TIER_3,
  ...TIER_4,
  ...TIER_5,
  ...TIER_6,
];

export const CARDS_BY_ID: Record<string, CardDef> = Object.fromEntries(
  CARDS.map((c) => [c.id, c]),
);

let purchasableCache: CardDef[] | null = null;
export function purchasableCards(): CardDef[] {
  if (!purchasableCache) purchasableCache = CARDS.filter((c) => !c.isToken);
  return purchasableCache;
}
