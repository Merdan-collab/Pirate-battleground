import { HEROES } from '../data/heroes';

interface HeroPickerProps {
  selectedHeroId: string | null;
  takenHeroIds?: Set<string>;
  onSelect: (heroId: string) => void;
}

/** The hero roster, shown as large portrait plaques the way Battlegrounds
 * presents its hero offering. */
export function HeroPicker({ selectedHeroId, takenHeroIds, onSelect }: HeroPickerProps) {
  return (
    <div className="roster">
      {HEROES.map((h) => {
        const taken = takenHeroIds?.has(h.id) ?? false;
        const selected = selectedHeroId === h.id;
        return (
          <button
            key={h.id}
            className={`plaque ${selected ? 'plaque--picked' : ''} ${taken ? 'plaque--taken' : ''}`}
            disabled={taken}
            onClick={() => onSelect(h.id)}
            aria-pressed={selected}
          >
            <span className="plaque__portrait">
              <span className="plaque__art">{h.portrait}</span>
              {selected && <span className="plaque__check">✓</span>}
              {taken && <span className="plaque__lock">Taken</span>}
            </span>

            <span className="plaque__name">{h.name}</span>
            <span className="plaque__title">{h.title}</span>

            <span className="plaque__power">
              <span className="plaque__power-head">
                <span className="plaque__power-name">{h.power.name}</span>
                {h.power.usesPerTurn > 0 ? (
                  <span className="coin">{h.power.cost}</span>
                ) : (
                  <span className="plaque__passive">Passive</span>
                )}
              </span>
              <span className="plaque__power-text">{h.power.description}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
