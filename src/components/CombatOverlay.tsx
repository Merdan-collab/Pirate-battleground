import type { CombatSummary } from '../engine/types';
import { minionToView, MinionCard } from './MinionCard';

interface CombatOverlayProps {
  summary: CombatSummary | null;
  onContinue: () => void;
}

const RESULT_LABEL: Record<CombatSummary['result'], string> = {
  WIN: '🏆 Victory!',
  LOSS: '💥 Defeat',
  DRAW: '🤝 Draw',
};

export function CombatOverlay({ summary, onContinue }: CombatOverlayProps) {
  if (!summary) {
    return (
      <div className="overlay">
        <div className="overlay__panel">
          <h2>No battle this round</h2>
          <button className="btn btn--end-turn" onClick={onContinue}>
            Continue
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
          {summary.playerName} {summary.isBye ? 'fought a mirror image of' : 'vs'}{' '}
          {summary.opponentName}
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
              {summary.playerBoardBefore.length === 0 && <p className="empty-note">Empty board</p>}
              {summary.playerBoardBefore.map((m) => (
                <MinionCard key={m.instanceId} view={minionToView(m)} small />
              ))}
            </div>
          </div>
          <div className="combat-boards__vs">VS</div>
          <div className="combat-boards__side">
            <h4>{summary.opponentName}</h4>
            <div className="board-row board-row--compact">
              {summary.opponentBoardBefore.length === 0 && <p className="empty-note">Empty board</p>}
              {summary.opponentBoardBefore.map((m) => (
                <MinionCard key={m.instanceId} view={minionToView(m)} small />
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

        <button className="btn btn--end-turn" onClick={onContinue}>
          Continue to next round
        </button>
      </div>
    </div>
  );
}
