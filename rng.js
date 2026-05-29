// Seeded PRNG + dice helpers. Pure — no DOM, no globals.

export function mulberry32(seed) {
  let a = (seed >>> 0) || 1;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const d6      = (rng) => 1 + Math.floor(rng() * 6);
export const roll2d6 = (rng) => { const a = d6(rng), b = d6(rng); return { a, b, sum: a + b }; };

// Stub RNG returning pre-set [0,1) values in order — for fixtures and golden tests.
export const stubRng = (vals) => { let i = 0; return () => vals[i++]; };
