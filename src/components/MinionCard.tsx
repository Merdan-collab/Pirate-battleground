import { CARDS_BY_ID } from '../data/cards';
import { TRIBE_NAMES } from '../engine/types';
import type { CardDef, Keyword, MinionInstance, Tribe } from '../engine/types';

export const TRIBE_COLORS: Record<Tribe, string> = {
  BIG_MOM_VINSMOKE: '#c2185b',
  MARINE_WORLD_GOV: '#1565c0',
  KAIDO_DOFLAMINGO: '#e65100',
  STRAWHAT_ALLIANCE: '#2e7d32',
  REVOLUTIONARY_ARMY: '#5e35b1',
  GOROSEI_ADMIRAL: '#212121',
  FREE_PIRATES: '#00838f',
  NONE: '#616161',
};

const KEYWORD_BADGE: Record<Keyword, string> = {
  Taunt: '🛡️ Taunt',
  DivineShield: '✨ Divine Shield',
  Poisonous: '☠️ Poisonous',
  Windfury: '🌀 Windfury',
  MegaWindfury: '🌀🌀 Mega Windfury',
  Reborn: '♻️ Reborn',
  Stealth: '🫥 Stealth',
};

export interface CardView {
  key: string;
  name: string;
  flavor: string;
  tribe: Tribe;
  tier: number;
  attack: number;
  health: number;
  keywords: Keyword[];
  isGolden?: boolean;
}

export function cardDefToView(c: CardDef): CardView {
  return {
    key: c.id,
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
  return {
    key: m.instanceId,
    name: def?.name ?? '???',
    flavor: def?.flavor ?? '',
    tribe: def?.tribe ?? 'NONE',
    tier: def?.tier ?? 1,
    attack: m.attack,
    health: m.health,
    keywords: [...m.keywords],
    isGolden: m.isGolden,
  };
}

interface MinionCardProps {
  view: CardView;
  onClick?: () => void;
  disabled?: boolean;
  selected?: boolean;
  targetable?: boolean;
  small?: boolean;
  cornerAction?: { label: string; onClick: () => void };
}

export function MinionCard({
  view,
  onClick,
  disabled,
  selected,
  targetable,
  small,
  cornerAction,
}: MinionCardProps) {
  const classes = [
    'minion-card',
    small ? 'minion-card--small' : '',
    selected ? 'minion-card--selected' : '',
    targetable ? 'minion-card--targetable' : '',
    disabled ? 'minion-card--disabled' : '',
    view.isGolden ? 'minion-card--golden' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={classes}
      style={{ borderColor: TRIBE_COLORS[view.tribe] }}
      onClick={disabled ? undefined : onClick}
      title={view.flavor}
    >
      {cornerAction && (
        <button
          className="minion-card__corner"
          onClick={(e) => {
            e.stopPropagation();
            cornerAction.onClick();
          }}
        >
          {cornerAction.label}
        </button>
      )}
      <div className="minion-card__tier" style={{ background: TRIBE_COLORS[view.tribe] }}>
        T{view.tier}
      </div>
      {view.isGolden && <div className="minion-card__golden-badge">★ Gylden</div>}
      <div className="minion-card__name">{view.name}</div>
      <div className="minion-card__tribe" style={{ color: TRIBE_COLORS[view.tribe] }}>
        {TRIBE_NAMES[view.tribe]}
      </div>
      {view.keywords.length > 0 && (
        <div className="minion-card__keywords">
          {view.keywords.map((k) => (
            <span key={k} className="minion-card__keyword" title={KEYWORD_BADGE[k]}>
              {KEYWORD_BADGE[k].split(' ')[0]}
            </span>
          ))}
        </div>
      )}
      <div className="minion-card__stats">
        <span className="minion-card__attack">⚔ {view.attack}</span>
        <span className="minion-card__health">❤ {view.health}</span>
      </div>
    </div>
  );
}
