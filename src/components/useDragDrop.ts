import { useCallback, useEffect, useRef, useState } from 'react';

// Pointer-based dragging rather than HTML5 drag-and-drop: it behaves the same
// on touch as on mouse, and lets the dragged token follow the cursor exactly
// the way the tavern does in Battlegrounds.

export type DragSource =
  | { kind: 'shop'; shopIndex: number }
  | { kind: 'board'; instanceId: string; fromIndex: number };

export type DropTarget =
  | { kind: 'board'; index: number }
  | { kind: 'sell' }
  | { kind: 'none' };

export interface ActiveDrag {
  source: DragSource;
  x: number;
  y: number;
}

const DRAG_THRESHOLD_PX = 5;

function resolveDropTarget(x: number, y: number): DropTarget {
  const el = document.elementFromPoint(x, y);
  const zone = el?.closest<HTMLElement>('[data-drop]');
  if (!zone) return { kind: 'none' };
  const kind = zone.dataset.drop;
  if (kind === 'sell') return { kind: 'sell' };
  if (kind === 'board') {
    const idx = Number(zone.dataset.index ?? '0');
    return { kind: 'board', index: Number.isFinite(idx) ? idx : 0 };
  }
  return { kind: 'none' };
}

export interface DragDropHandlers {
  /** Fires on a completed drag that landed on a valid target. */
  onDrop: (source: DragSource, target: DropTarget) => void;
  /** Fires on a click/tap that never became a drag. */
  onClick: (source: DragSource) => void;
  disabled?: boolean;
}

export function useDragDrop({ onDrop, onClick, disabled }: DragDropHandlers) {
  const [drag, setDrag] = useState<ActiveDrag | null>(null);
  const [hover, setHover] = useState<DropTarget>({ kind: 'none' });
  const pending = useRef<{ source: DragSource; startX: number; startY: number } | null>(null);
  const active = useRef(false);

  const beginDrag = useCallback(
    (source: DragSource) => (e: React.PointerEvent) => {
      if (disabled || e.button !== 0) return;
      pending.current = { source, startX: e.clientX, startY: e.clientY };
      active.current = false;
    },
    [disabled],
  );

  useEffect(() => {
    function move(e: PointerEvent) {
      const p = pending.current;
      if (!p) return;
      if (!active.current) {
        const dist = Math.hypot(e.clientX - p.startX, e.clientY - p.startY);
        if (dist < DRAG_THRESHOLD_PX) return;
        active.current = true;
        document.body.classList.add('is-dragging');
      }
      e.preventDefault();
      setDrag({ source: p.source, x: e.clientX, y: e.clientY });
      setHover(resolveDropTarget(e.clientX, e.clientY));
    }

    function up(e: PointerEvent) {
      const p = pending.current;
      if (!p) return;
      pending.current = null;
      document.body.classList.remove('is-dragging');

      if (!active.current) {
        onClick(p.source);
      } else {
        const target = resolveDropTarget(e.clientX, e.clientY);
        if (target.kind !== 'none') onDrop(p.source, target);
      }
      active.current = false;
      setDrag(null);
      setHover({ kind: 'none' });
    }

    function cancel() {
      pending.current = null;
      active.current = false;
      document.body.classList.remove('is-dragging');
      setDrag(null);
      setHover({ kind: 'none' });
    }

    window.addEventListener('pointermove', move, { passive: false });
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', cancel);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', cancel);
      document.body.classList.remove('is-dragging');
    };
  }, [onDrop, onClick]);

  return { drag, hover, beginDrag };
}
