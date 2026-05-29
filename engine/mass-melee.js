// Mass melee resolver (Appendix A + p.16-17 modifiers).

import { d6 } from '../rng.js';
import { typeById } from '../data/troops.js';
import { COMBAT, POLEARM_CLASSES, IMPETUS_CLASSES, CLASS_UP, CLASS_DOWN } from '../data/combat.js';

export function effectiveAttackerClass(cls, mods) {
  if (mods.flank || mods.rear) return CLASS_UP[cls] || cls;
  return cls;
}
export function classBumpsToBonus(cls, mods) {
  return (mods.flank || mods.rear) && !(cls in CLASS_UP); // AF or HH — no higher class
}
export function effectiveDefenderReturnClass(cls, standing) {
  if (!standing) return cls;
  return CLASS_DOWN[cls] || cls;
}
// Lower the kill threshold by `bonus` (e.g. [6] + 1 → [5,6]).
export function applyDieBonus(kills, bonus) {
  if (!bonus) return kills.slice();
  const out = new Set(kills);
  const min = Math.min(...kills);
  for (let v = min - bonus; v < min; v++) if (v >= 1 && v <= 6) out.add(v);
  return [...out].sort((a, b) => a - b);
}
export function rollKills(numDice, kills, rng) {
  const dice = [];
  let n = 0;
  for (let i = 0; i < numDice; i++) {
    const r = d6(rng);
    dice.push(r);
    if (kills.includes(r)) n++;
  }
  return { dice, kills: n };
}

// One round of mass melee between two units. Simultaneous casualties.
// attacker/defender: { type:TYPES.id, count, polearm, impetus, flank, rear, standingHorseFirstRound }
export function resolveMassMelee({ attacker, defender, rng }) {
  const aT = typeById(attacker.type), dT = typeById(defender.type);
  const result = { attacker:{}, defender:{} };

  // --- Side A attacks Side B
  const aEffClass = effectiveAttackerClass(aT.cls, attacker);
  const aBonusOnly = classBumpsToBonus(aT.cls, attacker);
  const aRow = COMBAT[aEffClass]?.[dT.cls];
  if (!aRow) throw new Error(`no combat row: ${aEffClass} vs ${dT.cls}`);
  let aDPM = aRow.dice / aRow.perMen;
  const aPolearmEligible = POLEARM_CLASSES.has(aT.cls) && attacker.polearm;
  if (aPolearmEligible) aDPM += 1;
  if (IMPETUS_CLASSES.has(aT.cls) && attacker.impetus) aDPM += 1;
  const aTotalDice = Math.floor(attacker.count * aDPM);
  const aKills = applyDieBonus(aRow.kills, aBonusOnly ? 1 : 0);
  const aRoll = rollKills(aTotalDice, aKills, rng);
  result.attacker = {
    type:aT.id, startCount:attacker.count,
    effectiveClass:aEffClass, dicePerMan:aDPM, totalDice:aTotalDice,
    polearmApplied:aPolearmEligible, impetusApplied: IMPETUS_CLASSES.has(aT.cls) && attacker.impetus,
    flankBumpToBonus:aBonusOnly, killScores:aKills,
    dice:aRoll.dice, killsDealt:aRoll.kills,
  };

  // --- Side B counter-attacks (unless rear-attack: no return)
  if (attacker.rear) {
    result.defender = {
      type:dT.id, startCount:defender.count,
      effectiveClass:dT.cls, dicePerMan:0, totalDice:0,
      dice:[], killsDealt:0, noReturn:true,
    };
  } else {
    const dRetCls = effectiveDefenderReturnClass(dT.cls, !!defender.standingHorseFirstRound);
    const dRow = COMBAT[dRetCls]?.[aT.cls];
    let dDPM = dRow ? dRow.dice / dRow.perMen : 0;
    const dPolearmEligible = POLEARM_CLASSES.has(dT.cls) && defender.polearm;
    if (dPolearmEligible) dDPM += 1;
    if (IMPETUS_CLASSES.has(dT.cls) && defender.impetus) dDPM += 1;
    const dTotalDice = Math.floor(defender.count * dDPM);
    const dRoll = dRow ? rollKills(dTotalDice, dRow.kills, rng) : { dice:[], kills:0 };
    result.defender = {
      type:dT.id, startCount:defender.count,
      effectiveClass:dRetCls, dicePerMan:dDPM, totalDice:dTotalDice,
      polearmApplied:dPolearmEligible, impetusApplied:IMPETUS_CLASSES.has(dT.cls) && defender.impetus,
      standingHorseApplied: dRetCls !== dT.cls, killScores: dRow ? dRow.kills : [],
      dice:dRoll.dice, killsDealt:dRoll.kills,
    };
  }
  // Casualties (each side suffers what the other dealt)
  result.attacker.casualties = result.defender.killsDealt;
  result.attacker.surviving  = Math.max(0, attacker.count - result.defender.killsDealt);
  result.defender.casualties = result.attacker.killsDealt;
  result.defender.surviving  = Math.max(0, defender.count - result.attacker.killsDealt);
  return result;
}
