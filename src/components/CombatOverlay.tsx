import { MinionCard, type CardView } from './MinionCard';

export interface OverlaySummary {
  opponentName: string;
  isBye: boolean;
  playerBoard: CardView[];
  opponentBoard: CardView[];
  logs: string[];
  result: 'WIN' | 'LOSS' | 'DRAW';
  damageDealt: number;
}

interface CombatOverlayProps {
  summary: OverlaySummary | null;
  onContinue: () => void;
  continueLabel?: string;
  waiting?: boolean;
}

const BANNER: Record<OverlaySummary['result'], string> = {
  WIN: 'Victory',
  LOSS: 'Defeat',
  DRAW: 'Draw',
};

export function CombatOverlay({
  summary,
  onContinue,
  continueLabel = 'Next round',
  waiting = false,
}: CombatOverlayProps) {
  if (!summary) {
    return (
      <div className="veil">
        <div className="report">
          <h2 className="report__banner report__banner--draw">No battle this round</h2>
          <button className="primary-btn" onClick={onContinue} disabled={waiting}>
            {continueLabel}
          </button>
        </div>
      </div>
    );
  }

  const tone = summary.result.toLowerCase();

  return (
    <div className="veil">
      <div className="report">
        <h2 className={`report__banner report__banner--${tone}`}>{BANNER[summary.result]}</h2>
        <p className="report__vs">
          {summary.isBye ? 'You fought a mirror image of' : 'You faced'} {summary.opponentName}
        </p>
        {summary.damageDealt > 0 && (
          <p className="report__damage">
            {summary.result === 'WIN'
              ? `You dealt ${summary.damageDealt} damage`
              : `You took ${summary.damageDealt} damage`}
          </p>
        )}

        <div className="report__sides">
          <div className="report__side">
            <h4>Your crew</h4>
            <div className="report__row">
              {summary.playerBoard.length === 0 ? (
                <p className="report__none">Empty board</p>
              ) : (
                summary.playerBoard.map((v) => <MinionCard key={v.key} view={v} size="small" />)
              )}
            </div>
          </div>

          <span className="report__vs-mark">vs</span>

          <div className="report__side">
            <h4>{summary.opponentName}</h4>
            <div className="report__row">
              {summary.opponentBoard.length === 0 ? (
                <p className="report__none">Empty board</p>
              ) : (
                summary.opponentBoard.map((v) => <MinionCard key={v.key} view={v} size="small" />)
              )}
            </div>
          </div>
        </div>

        <details className="report__log">
          <summary>Battle log ({summary.logs.length} events)</summary>
          <ul>
            {summary.logs.map((l, i) => (
              <li key={i}>{l}</li>
            ))}
          </ul>
        </details>

        <button className="primary-btn" onClick={onContinue} disabled={waiting}>
          {continueLabel}
        </button>
      </div>
    </div>
  );
}
