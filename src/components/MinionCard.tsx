import { CARDS_BY_ID } from '../data/cards';
import { artFor } from '../data/art';
import { TRIBE_NAMES } from '../engine/types';
import type { CardDef, Keyword, MinionInstance, Tribe } from '../engine/types';

export const TRIBE_COLORS: Record<Tribe, string> = {
  BIG_MOM_VINSMOKE: '#e0417f',
  MARINE_WORLD_GOV: '#3d8bfd',
  KAIDO_DOFLAMINGO: '#ff7a2f',
  STRAWHAT_ALLIANCE: '#3fc46b',
  REVOLUTIONARY_ARMY: '#9b6bff',
  GOROSEI_ADMIRAL: '#b9a68c',
  FREE_PIRATES: '#25c3d1',
  NONE: '#9aa3b2',
};

const KEYWORD_ICON: Record<Keyword, { icon: string; label: string }> = {
  Taunt: { icon: '🛡', label: 'Taunt — must be attacked first' },
  DivineShield: { icon: '✨', label: 'Divine Shield — ignores the first damage' },
  Poisonous: { icon: '☠', label: 'Poisonous — any damage it deals destroys the target' },
  Windfury: { icon: '🌀', label: 'Windfury — attacks twice' },
  MegaWindfury: { icon: '🌀', label: 'Mega Windfury — attacks four times' },
  Reborn: { icon: '♻', label: 'Reborn — returns once with 1 Health' },
  Cleave: { icon: '🌊', label: 'Cleave — also hits the minions beside the target' },
};

export interface CardView {
  key: string;
  cardId: string;
  name: string;
  flavor: string;
  tribe: Tribe;
  tier: number;
  attack: number;
  health: number;
  keywords: Keyword[];
  isGolden?: boolean;
  /** Set when stats differ from the card's printed values, so buffs read clearly. */
  buffedAttack?: boolean;
  buffedHealth?: boolean;
}

export function cardDefToView(c: CardDef): CardView {
  return {
    key: c.id,
    cardId: c.id,
    name: c.name,
    flavor: c.flavor,
    tribe: c.tribe,
    tier: c.tier,
    attack: c.attack,
    health: c.health,
    keywords: c.keywords,
  };
}

export function minionToView(m: MinionInstance): CardView {
  const def = CARDS_BY_ID[m.cardId];
  const mult = m.isGolden ? 2 : 1;
  return {
    key: m.instanceId,
    cardId: m.cardId,
    name: def?.name ?? '???',
    flavor: def?.flavor ?? '',
    tribe: def?.tribe ?? 'NONE',
    tier: def?.tier ?? 1,
    attack: m.attack,
    health: m.health,
    keywords: [...m.keywords],
    isGolden: m.isGolden,
    buffedAttack: def ? m.attack > def.attack * mult : false,
    buffedHealth: def ? m.health > def.health * mult : false,
  };
}

function abilityText(view: CardView): string {
  const def = CARDS_BY_ID[view.cardId];
  if (!def) return '';
  const parts: string[] = [];
  if (def.battlecry) parts.push('Battlecry');
  if (def.deathrattle) parts.push('Deathrattle');
  if (def.aura) parts.push('Aura');
  if (def.modifier) parts.push('Passive');
  if (def.triggers?.length) parts.push('Trigger');
  return parts.slice(0, 2).join(' · ');
}

interface MinionCardProps {
  view: CardView;
  size?: 'normal' | 'small';
  onPointerDown?: (e: React.PointerEvent) => void;
  onClick?: () => void;
  disabled?: boolean;
  targetable?: boolean;
  dimmed?: boolean;
  /** Rendered as the floating token that follows the cursor while dragging. */
  ghost?: boolean;
}

export function MinionCard({
  view,
  size = 'normal',
  onPointerDown,
  onClick,
  disabled,
  targetable,
  dimmed,
  ghost,
}: MinionCardProps) {
  const tribeColor = TRIBE_COLORS[view.tribe];
  const ability = abilityText(view);
  const classes = [
    'minion',
    size === 'small' ? 'minion--small' : '',
    view.isGolden ? 'minion--golden' : '',
    targetable ? 'minion--targetable' : '',
    disabled ? 'minion--disabled' : '',
    dimmed ? 'minion--dimmed' : '',
    ghost ? 'minion--ghost' : '',
    view.keywords.includes('Taunt') ? 'minion--taunt' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const tooltip = [
    view.name,
    TRIBE_NAMES[view.tribe] !== 'Neutral' ? TRIBE_NAMES[view.tribe] : '',
    ability,
    view.flavor,
  ]
    .filter(Boolean)
    .join(' — ');

  return (
    <div
      className={classes}
      style={{ ['--tribe' as string]: tribeColor }}
      onPointerDown={disabled ? undefined : onPointerDown}
      onClick={disabled ? undefined : onClick}
      title={tooltip}
    >
      <div className="minion__frame">
        <div className="minion__portrait">
          <span className="minion__art">{artFor(view.cardId)}</span>
        </div>

        <span className="minion__tier" title={`Tavern Tier ${view.tier}`}>
          {view.tier}
        </span>

        {view.keywords.length > 0 && (
          <span className="minion__keywords">
            {view.keywords.map((k) => (
              <span key={k} className="minion__keyword" title={KEYWORD_ICON[k].label}>
                {KEYWORD_ICON[k].icon}
              </span>
            ))}
          </span>
        )}

        <span className={`gem gem--attack ${view.buffedAttack ? 'gem--buffed' : ''}`}>
          {view.attack}
        </span>
        <span className={`gem gem--health ${view.buffedHealth ? 'gem--buffed' : ''}`}>
          {view.health}
        </span>
      </div>

      <div className="minion__plate">
        <span className="minion__name">{view.name}</span>
        {ability && <span className="minion__ability">{ability}</span>}
      </div>
    </div>
  );
}
