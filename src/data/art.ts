// Portrait glyph per card. Battlegrounds leans on minion art to make the board
// readable at a glance; with no image assets available, a distinct glyph per
// card does the same job.
export const CARD_ART: Record<string, string> = {
  // Tokens
  tok_biscuit_soldat: '🍪',
  tok_germa_soldat: '🥼',
  tok_marinerekrut: '⚓',
  tok_marinerekrut_stor: '🎖️',
  tok_yami_skygge: '🕳️',
  tok_havuhyre_unge: '🐟',

  // Big Mom & Vinsmoke
  bm_chiffon: '🍰',
  bm_yonji: '🥊',
  bm_reiju: '🌺',
  bm_smoothie: '🧃',
  bm_ichiji: '🗡️',
  bm_cracker: '🍪',
  bm_niji: '⚡',
  bm_katakuri: '🍡',
  bm_judge: '👨‍🔬',
  bm_bigmom: '👑',

  // Marines & World Government
  mn_menig: '⚓',
  mn_koby: '🫡',
  mn_overbetjent: '📋',
  mn_helmeppo: '💇',
  mn_smoker: '💨',
  mn_tashigi: '👓',
  mn_garp: '👊',
  mn_sengoku_vice: '🧓',
  mn_kizaru: '💡',
  mn_aokiji: '❄️',
  mn_sengoku: '🙏',

  // Kaido & Doflamingo
  kd_handlanger: '🎭',
  kd_beastsoldat: '🐗',
  kd_diamante: '💎',
  kd_trebol: '🦠',
  kd_pica: '🗿',
  kd_jack: '🐘',
  kd_whoswho: '🐆',
  kd_queen: '🦖',
  kd_king: '🔥',
  kd_kaido: '🐉',

  // Straw Hat Alliance
  sh_recruit: '👒',
  sh_chopper: '🦌',
  sh_usopp: '🎯',
  sh_franky: '🤖',
  sh_robin: '🌸',
  sh_law_alliance: '💙',
  sh_jinbe: '🐋',
  sh_bartolomeo: '🚧',
  sh_zoro: '⚔️',
  sh_luffy_gear5: '☀️',

  // Revolutionary Army
  ra_young: '✊',
  ra_soldat: '🎗️',
  ra_inazuma: '✂️',
  ra_karasu: '🐦‍⬛',
  ra_ivankov: '💉',
  ra_kuma: '🐻',
  ra_sabo: '🔱',
  ra_dragon: '🌪️',

  // Gorosei & Admirals
  ga_haandlanger: '🕴️',
  ga_imsskygge: '👤',
  ga_cp0: '🕶️',
  ga_fujitora: '🦯',
  ga_saint: '🐂',
  ga_ryokugyu: '🌲',
  ga_udsending: '📜',
  ga_marcus: '🦅',
  ga_im: '👁️',

  // Free Pirate Crews
  fp_bandelos: '🗡️',
  fp_laerling: '🏴‍☠️',
  fp_alvida: '🔨',
  fp_bellamy: '🐺',
  fp_capone: '🏰',
  fp_kid: '🧲',
  fp_drake: '🦕',
  fp_urouge: '🛐',
  fp_bonney: '🍕',
  fp_blackbeard: '🌑',

  // Neutral
  nu_sword_apprentice: '🗡️',
  nu_tomrer: '🔨',
  nu_kanoner: '💣',
  nu_navigator: '🧭',
  nu_skattejaeger: '💰',
  nu_swordsmith: '⚒️',
  nu_broker: '🤝',
  nu_old_smith: '🛠️',
  nu_pirateship: '🚢',
  nu_ferro: '🛡️',
  nu_trade_admiral: '🎖️',
  nu_seamonster: '🐙',
  nu_unknown_legend: '⭐',
};

export function artFor(cardId: string): string {
  return CARD_ART[cardId] ?? '🏴‍☠️';
}
