// src/lib/beeswarm.ts
// Dots along one line, one per team, nudged up and down so that teams with
// the same or close scores sit side by side instead of on top of each other.

/**
 * A vertical offset for each dot, in pixels from the centre line, so that no
 * two dots of the given radius overlap. Dots are placed from left to right,
 * each as close to the centre line as it can go: a lone dot stays on it, a
 * crowd of equal scores grows into a column. `first` names dots to place
 * before the others at the same x, so they take the centre line (the
 * visitor's own team).
 */
export function beeswarm(xs: number[], radius: number, first: number[] = []): number[] {
  const spacing = radius * 2 + 1;
  const priority = new Set(first);
  const order = xs
    .map((_, i) => i)
    .sort((a, b) => xs[a] - xs[b] || Number(priority.has(b)) - Number(priority.has(a)));
  const ys: number[] = new Array(xs.length).fill(0);
  const placed: { x: number; y: number }[] = [];

  for (const i of order) {
    const x = xs[i];
    // Placed in order of x, so only the last few can be near.
    const near = placed.filter((p) => x - p.x < spacing);
    const fits = (y: number) =>
      near.every((p) => (x - p.x) ** 2 + (y - p.y) ** 2 >= spacing ** 2 - 1e-6);
    // The centre line, or just above or below a dot it would touch.
    const candidates = [0];
    for (const p of near) {
      const rise = Math.sqrt(spacing ** 2 - (x - p.x) ** 2);
      candidates.push(p.y + rise, p.y - rise);
    }
    candidates.sort((a, b) => Math.abs(a) - Math.abs(b) || a - b);
    const y = candidates.find(fits) ?? 0;
    ys[i] = y;
    placed.push({ x, y });
  }
  return ys;
}
