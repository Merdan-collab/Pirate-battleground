import { useEffect, useMemo, useRef, useState } from 'react';
import type { CombatStep, MinionSnapshot, Side } from '../engine/combat';
import { MinionCard, type CardView } from './MinionCard';
import { wireMinionToCardView } from './viewModel';

export interface OverlaySummary {
  opponentName: string;
  isBye: boolean;
  playerBoard: CardView[];
  opponentBoard: CardView[];
  steps: CombatStep[];
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

/** How long each kind of step is held on screen. Attacks get the most room
 * since that's the beat the player is actually watching. */
const STEP_MS: Record<CombatStep['kind'], number> = {
  start: 700,
  attack: 460,
  damage: 380,
  death: 420,
  summon: 460,
  buff: 340,
  end: 500,
};

function snapshotToView(m: MinionSnapshot): CardView {
  return wireMinionToCardView(m);
}

/** Replays the battle step by step, then reveals the result. */
function BattleStage({
  steps,
  speed,
  onFinished,
  finished,
}: {
  steps: CombatStep[];
  speed: number;
  onFinished: () => void;
  finished: boolean;
}) {
  const [index, setIndex] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Jumping straight to the end when the player skips.
  useEffect(() => {
    if (finished) setIndex(steps.length - 1);
  }, [finished, steps.length]);

  useEffect(() => {
    if (finished || steps.length === 0) return;
    if (index >= steps.length - 1) {
      onFinished();
      return;
    }
    const delay = STEP_MS[steps[index].kind] / speed;
    timer.current = setTimeout(() => setIndex((i) => i + 1), delay);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [index, steps, speed, finished, onFinished]);

  const step = steps[Math.min(index, steps.length - 1)];
  if (!step) return null;

  const renderSide = (side: Side, list: MinionSnapshot[]) => (
    <div className={`stage__row stage__row--${side === 'a' ? 'mine' : 'theirs'}`}>
      {list.length === 0 && <span className="stage__empty">— wiped out —</span>}
      {list.map((m) => {
        const isActor = step.actorSide === side && step.actorId === m.instanceId;
        const isTarget = step.targetSide === side && step.targetIds?.includes(m.instanceId);
        const cls = [
          'stage__slot',
          isActor && step.kind === 'attack'
            ? side === 'a'
              ? 'stage__slot--lunge-up'
              : 'stage__slot--lunge-down'
            : '',
          isActor && (step.kind === 'buff' || step.kind === 'summon') ? 'stage__slot--flare' : '',
          isTarget ? 'stage__slot--struck' : '',
        ]
          .filter(Boolean)
          .join(' ');
        return (
          <div className={cls} key={m.instanceId}>
            <MinionCard view={snapshotToView(m)} size="small" />
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="stage">
      {renderSide('b', step.b)}
      <div className="stage__divider">
        <span className="stage__caption">{step.text || '…'}</span>
      </div>
      {renderSide('a', step.a)}
    </div>
  );
}

export function CombatOverlay({
  summary,
  onContinue,
  continueLabel = 'Next round',
  waiting = false,
}: CombatOverlayProps) {
  const [done, setDone] = useState(false);
  const [speed, setSpeed] = useState(1);

  // A new battle restarts the replay.
  const steps = summary?.steps ?? [];
  const battleKey = useMemo(() => steps.map((s) => s.text).join('|').slice(0, 80), [steps]);
  useEffect(() => {
    setDone(false);
  }, [battleKey]);

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
        <p className="report__vs">
          {summary.isBye ? 'Fighting a mirror image of' : 'Facing'}{' '}
          <strong>{summary.opponentName}</strong>
        </p>

        {steps.length > 0 ? (
          <BattleStage
            steps={steps}
            speed={speed}
            finished={done}
            onFinished={() => setDone(true)}
          />
        ) : (
          <div className="stage stage--empty">
            <span className="stage__empty">Neither crew had anyone to send.</span>
          </div>
        )}

        {done ? (
          <>
            <h2 className={`report__banner report__banner--${tone}`}>
              {BANNER[summary.result]}
            </h2>
            {summary.damageDealt > 0 && (
              <p className="report__damage">
                {summary.result === 'WIN'
                  ? `You dealt ${summary.damageDealt} damage`
                  : `You took ${summary.damageDealt} damage`}
              </p>
            )}
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
          </>
        ) : (
          <div className="report__controls">
            <button
              className={`ghost-btn ${speed === 2 ? 'ghost-btn--on' : ''}`}
              onClick={() => setSpeed((s) => (s === 1 ? 2 : 1))}
            >
              {speed === 2 ? '2× speed' : '1× speed'}
            </button>
            <button className="ghost-btn" onClick={() => setDone(true)}>
              Skip to result
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
