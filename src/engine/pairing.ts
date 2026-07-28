export interface Pairing {
  a: string;
  b: string | null; // null = bye (fights a ghost board)
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function pairKey(a: string, b: string): string {
  return [a, b].sort().join('|');
}

/** Pairs alive players for a combat round, trying a handful of shuffles to
 * minimize immediate rematches from the previous round (matching
 * Battlegrounds' soft anti-repeat pairing). Odd player counts produce one
 * bye, resolved as a "ghost" fight by the caller. */
export function pairPlayers(aliveIds: string[], lastRoundPairs: [string, string][]): Pairing[] {
  if (aliveIds.length <= 1) return [];
  const lastSet = new Set(lastRoundPairs.map(([a, b]) => pairKey(a, b)));

  let best: string[] = aliveIds;
  let bestRepeats = Infinity;
  for (let attempt = 0; attempt < 30; attempt++) {
    const shuffled = shuffle(aliveIds);
    let repeats = 0;
    for (let i = 0; i + 1 < shuffled.length; i += 2) {
      if (lastSet.has(pairKey(shuffled[i], shuffled[i + 1]))) repeats += 1;
    }
    if (repeats < bestRepeats) {
      bestRepeats = repeats;
      best = shuffled;
      if (repeats === 0) break;
    }
  }

  const pairings: Pairing[] = [];
  let i = 0;
  for (; i + 1 < best.length; i += 2) {
    pairings.push({ a: best[i], b: best[i + 1] });
  }
  if (i < best.length) {
    pairings.push({ a: best[i], b: null });
  }
  return pairings;
}
