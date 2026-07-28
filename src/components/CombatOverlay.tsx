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

const RESULT_LABEL: Record<OverlaySummary['result'], string> = {
  WIN: '🏆 Victory!',
  LOSS: '💥 Defeat',
  DRAW: '🤝 Draw',
};

export function CombatOverlay({
  summary,
  onContinue,
  continueLabel = 'Continue to next round',
  waiting = false,
}: CombatOverlayProps) {
  if (!summary) {
    return (
      <div className="overlay">
        <div className="overlay__panel">
          <h2>No battle this round</h2>
          <button className="btn btn--end-turn" onClick={onContinue} disabled={waiting}>
            {continueLabel}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="overlay">
      <div className="overlay__panel overlay__panel--wide">
        <h2 className={`combat-result combat-result--${summary.result.toLowerCase()}`}>
          {RESULT_LABEL[summary.result]}
        </h2>
        <p className="combat-vs">
          {summary.isBye ? 'You fought a mirror image of' : 'You vs'} {summary.opponentName}
        </p>
        {summary.damageDealt > 0 && (
          <p className="combat-damage">
            {summary.result === 'WIN'
              ? `You dealt ${summary.damageDealt} damage!`
              : `You took ${summary.damageDealt} damage.`}
          </p>
        )}

        <div className="combat-boards">
          <div className="combat-boards__side">
            <h4>Your Crew</h4>
            <div className="board-row board-row--compact">
              {summary.playerBoard.length === 0 && <p className="empty-note">Empty board</p>}
              {summary.playerBoard.map((v) => (
                <MinionCard key={v.key} view={v} small />
              ))}
            </div>
          </div>
          <div className="combat-boards__vs">VS</div>
          <div className="combat-boards__side">
            <h4>{summary.opponentName}</h4>
            <div className="board-row board-row--compact">
              {summary.opponentBoard.length === 0 && <p className="empty-note">Empty board</p>}
              {summary.opponentBoard.map((v) => (
                <MinionCard key={v.key} view={v} small />
              ))}
            </div>
          </div>
        </div>

        <details className="combat-log">
          <summary>Battle log ({summary.logs.length} events)</summary>
          <ul>
            {summary.logs.map((l, i) => (
              <li key={i}>{l}</li>
            ))}
          </ul>
        </details>

        <button className="btn btn--end-turn" onClick={onContinue} disabled={waiting}>
          {continueLabel}
        </button>
      </div>
    </div>
  );
}
