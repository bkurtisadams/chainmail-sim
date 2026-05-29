// Missile fire — individual (Appendix B bottom) + mass (p.11).

import { d6, roll2d6 } from '../rng.js';
import { MASS_MISSILE, INDIRECT_BUMP } from '../data/combat.js';

// Parse compact "X-Y-Z" cells where each token is a 2d6 threshold:
//   '5'..'9' = 5..9 · '0'=10 · '1'=11 · '2'=12 · '/' = no kill possible
export const parseRow = (s) => s.split('-').map(t => {
  if (t === '/') return null;
  if (t === '0') return 10;
  if (t === '1') return 11;
  if (t === '2') return 12;
  return parseInt(t, 10);
});

export const BAND_INDEX = Object.freeze({ close:0, medium:1, max:2 });

export function rangeBand(distance, range) {
  if (distance < 1 || distance > range) return null;
  const t = range / 3;
  if (distance <= t)     return 'close';
  if (distance <= 2 * t) return 'medium';
  return 'max';
}
export function bandLimits(range) {
  const t = range / 3;
  return {
    close:  [1, Math.floor(t)],
    medium: [Math.floor(t)+1, Math.floor(2*t)],
    max:    [Math.floor(2*t)+1, range],
  };
}

export function resolveIndividualMissile({ weapon, distance, armorIdx, cover = 0, indirect = false, rng }) {
  let effRange = weapon.range;
  let effArmor = armorIdx;
  let arrowProof = false;
  if (indirect) {
    if (!weapon.indirectAllowed) return { ok:false, reason:'indirect not permitted for this weapon' };
    effRange = Math.floor(weapon.range * 2 / 3);
    effArmor = armorIdx + 1;
    if (effArmor > 7) arrowProof = true; // beyond plate+shield → arrow proof
  }
  const band = rangeBand(distance, effRange);
  if (!band) return { ok:false, reason:'out of range', effRange };
  if (arrowProof) return { ok:true, band, target:null, arrowProof:true, kill:false };
  const row = parseRow(weapon.rows[effArmor]);
  const target = row[BAND_INDEX[band]];
  if (target === null) return { ok:true, band, target:null, kill:false, reason:'no kill possible at this range/armor' };
  const dice = roll2d6(rng);
  const total = dice.sum - cover;
  return {
    ok:true, band, target, dice, cover, total,
    kill: total >= target, effRange, effArmor, indirect,
  };
}

export function splitFiringGroups(count, maxGroup) {
  if (count <= maxGroup) return [count];
  const n = Math.ceil(count / maxGroup);
  const base = Math.floor(count / n);
  const rem  = count % n;
  return Array.from({ length:n }, (_, i) => base + (i < rem ? 1 : 0));
}
export function findFiringBand(count, bands) {
  if (count < bands[0].range[0]) return null;
  for (const b of bands) if (count >= b.range[0] && count <= b.range[1]) return b;
  return bands[bands.length - 1];
}

export function resolveMassMissile({ firingCount, armorGroup, cover = false, indirect = false, rng }) {
  let group = armorGroup;
  let bumped = false;
  if (indirect) {
    const next = INDIRECT_BUMP[group];
    if (next === 'arrow_proof') return { armorGroup:group, arrowProof:true, totalRaw:0, totalKills:0, groups:[] };
    group = next; bumped = true;
  }
  const tab = MASS_MISSILE[group];
  const subs = splitFiringGroups(firingCount, tab.maxGroup);
  const results = [];
  let total = 0;
  for (const s of subs) {
    const die = d6(rng);
    const band = findFiringBand(s, tab.firingBands);
    if (!band) { results.push({ count:s, die, kills:0, reason:'below minimum band' }); continue; }
    const isLow = die >= tab.dieBands[0][0] && die <= tab.dieBands[0][1];
    const kills = isLow ? band.low : band.high;
    results.push({ count:s, die, isLow, band, kills });
    total += kills;
  }
  const finalKills = cover ? Math.floor(total / 2) : total;
  return {
    armorGroup:group, indirectApplied:bumped, groups:results,
    totalRaw:total, totalKills:finalKills, coverApplied:cover,
  };
}
