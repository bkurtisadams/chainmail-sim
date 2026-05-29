// Post-melee morale (p.15-16) and excess-casualty loss table (p.17).

import { d6, roll2d6 } from '../rng.js';
import { typeById } from '../data/troops.js';
import { REACTION_BANDS } from '../data/combat.js';

export function reactionFor(diff) {
  return REACTION_BANDS.find(b => diff <= b.max);
}

// Inputs: a, b = { label, startCount, casualties, morale }
export function resolvePostMelee({ a, b, rng, doubleForSmall = true }) {
  const aSurv = a.startCount - a.casualties;
  const bSurv = b.startCount - b.casualties;

  // Step 1 — fewer-casualties side gets (positive diff × one die)
  let fewerSide = null, casDiff = 0, casDie = 0, casBonus = 0;
  if (a.casualties !== b.casualties) {
    fewerSide = a.casualties < b.casualties ? 'A' : 'B';
    casDiff = Math.abs(a.casualties - b.casualties);
    casDie = d6(rng);
    casBonus = casDiff * casDie;
  }
  // Step 2 — more-survivors side gets the survivor diff (no multiplier)
  let moreSide = null, survDiff = 0;
  if (aSurv !== bSurv) {
    moreSide = aSurv > bSurv ? 'A' : 'B';
    survDiff = Math.abs(aSurv - bSurv);
  }
  // Step 3 — rating × survivors for each
  const aRating = a.morale * aSurv;
  const bRating = b.morale * bSurv;
  // Step 4 — totals
  const aTotal = aRating + (fewerSide === 'A' ? casBonus : 0) + (moreSide === 'A' ? survDiff : 0);
  const bTotal = bRating + (fewerSide === 'B' ? casBonus : 0) + (moreSide === 'B' ? survDiff : 0);

  let diff = Math.abs(aTotal - bTotal);
  const doubled = doubleForSmall && (a.startCount < 20 || b.startCount < 20);
  if (doubled) diff *= 2;

  const loser = aTotal === bTotal ? null : (aTotal < bTotal ? 'A' : 'B');
  const reaction = reactionFor(diff);

  return {
    a:{ surviving:aSurv, ratingScore:aRating, total:aTotal },
    b:{ surviving:bSurv, ratingScore:bRating, total:bTotal },
    casualtyBonus:{ side:fewerSide, diff:casDiff, dieRoll:casDie, value:casBonus },
    survivorBonus:{ side:moreSide, diff:survDiff, value:survDiff },
    rawDiff: Math.abs(aTotal - bTotal),
    diff, doubled, loser, reaction,
  };
}

// Instability check (p.17). Triggered when cumulative casualties cross the type's threshold.
export function resolveLossMorale({ type, startCount, casualties, surrounded, rng }) {
  const t = typeById(type);
  const pct = casualties / startCount;
  if (pct < t.loss.pct) return { triggered:false, pct, threshold:t.loss };
  const dice = roll2d6(rng);
  const passed = dice.sum >= t.loss.score;
  return {
    triggered:true, pct, threshold:t.loss, dice, passed,
    action: passed ? 'stable' : (surrounded ? 'surrender' : 'removed'),
  };
}
