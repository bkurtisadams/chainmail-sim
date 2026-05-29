// Man-to-man melee resolver (Appendix B + p.25-26 rules).
// Pure: all randomness flows through the injected rng.

import { roll2d6 } from '../rng.js';
import { armorIndex } from '../data/armor.js';
import { PRONE_KILL_TN, CHARGE_REACH_CLASSES } from '../data/weapons.js';

export function targetNumber(weapon, armorId, defenderProne) {
  const ai = armorIndex(armorId);
  if (defenderProne && weapon.proneCols && weapon.proneCols.includes(ai)) return PRONE_KILL_TN;
  return weapon.row[ai];
}

// Multi-blow count for the holder of `myCls` when opponent holds `oppCls` (p.26).
export function blowCountFor(myCls, oppCls) {
  const diff = oppCls - myCls;
  if (diff >= 8) return 3;
  if (diff >= 4) return 2;
  return 1;
}

// Parry case from attacker→defender weapon class differential (p.25-26 §4).
export function parryCase(atkCls, defCls) {
  const diff = atkCls - defCls;
  if (diff <= -2) return 'a';        // defender 2+ higher — no parry
  if (diff <= 3)  return 'b';        // -1..+3 — parry, no counter
  if (diff <= 7)  return 'c';        // +4..+7 — parry, one counter, break on kill-roll
  return 'd';                        // +8+   — defender first, may parry attacker
}

// Modifiers to a blow's die total (mounted, rear, etc. — p.25).
export function blowModifier({ strikerRole, striker, target, defenderAttackedFrom, round }) {
  let m = 0;
  if (striker.mounted && !target.mounted) m += (round === 1 ? 2 : 1);
  if (!striker.mounted && target.mounted) m -= 1;
  if (strikerRole === 'attacker' && defenderAttackedFrom === 'rear') m += 1;
  return m;
}

export function resolveBlow({ strikerRole, striker, target, defenderAttackedFrom, round, rng, parried, parryPenalty }) {
  const tn = targetNumber(striker.weapon, target.armor, target.prone);
  const dice = roll2d6(rng);
  const mods = blowModifier({ strikerRole, striker, target, defenderAttackedFrom, round });
  const penalty = parried ? parryPenalty : 0;
  const total = dice.sum + mods - penalty;
  return {
    striker: strikerRole,
    weapon: striker.weapon.name,
    targetArmor: target.armor,
    tn, dice:[dice.a, dice.b], mods, penalty, parried,
    total, kill: total >= tn, breakWeapon: false,
  };
}

export function firstStriker(state) {
  const { round, a, d, prevFirstStriker } = state;
  if (round === 1) {
    if (a.charging && CHARGE_REACH_CLASSES.has(a.weapon.cls) && a.weapon.cls > d.weapon.cls)
      return { who:'attacker', defenderReturns:true };
    if (d.attackedFrom === 'rear')              return { who:'attacker', defenderReturns:false };
    const diff = a.weapon.cls - d.weapon.cls;
    if (diff >= 8)                              return { who:'defender', defenderReturns:true };
    if (d.fromAbove)                            return { who:'defender', defenderReturns:true };
    if (diff <= -2)                             return { who:'defender', defenderReturns:true };
    return { who:'attacker', defenderReturns:true };
  }
  let first = prevFirstStriker || 'attacker';
  const opp  = first === 'attacker' ? d : a;
  const self = first === 'attacker' ? a : d;
  if (opp.weapon.cls - self.weapon.cls <= -2) first = (first === 'attacker' ? 'defender' : 'attacker');
  if (opp.fromAbove)                          first = (first === 'attacker' ? 'defender' : 'attacker');
  return { who:first, defenderReturns:true };
}

export function resolveRound(state) {
  const { a, d, round, rng } = state;
  const { who:first, defenderReturns } = firstStriker(state);

  let aBlows = blowCountFor(a.weapon.cls, d.weapon.cls);
  let dBlows = blowCountFor(d.weapon.cls, a.weapon.cls);
  if (!defenderReturns) dBlows = 0;

  const pCase = parryCase(a.weapon.cls, d.weapon.cls);
  const defenderWillParry = !!d.parry && pCase !== 'a' && defenderReturns;
  const parryPenalty = pCase === 'd' ? 1 : 2;
  if (defenderWillParry) dBlows = Math.max(0, dBlows - 1);

  const seq = [];
  const second = first === 'attacker' ? 'defender' : 'attacker';
  const firstBlows  = first === 'attacker' ? aBlows : dBlows;
  const secondBlows = first === 'attacker' ? dBlows : aBlows;
  for (let i = 0; i < firstBlows;  i++) seq.push(first);
  for (let i = 0; i < secondBlows; i++) seq.push(second);

  const parryIdx = defenderWillParry ? seq.findIndex(x => x === 'attacker') : -1;

  const blows = [];
  for (let i = 0; i < seq.length; i++) {
    const who = seq[i];
    const isParried = (i === parryIdx);
    const striker = who === 'attacker' ? a : d;
    const target  = who === 'attacker' ? d : a;
    const blow = resolveBlow({
      strikerRole: who, striker, target,
      defenderAttackedFrom: d.attackedFrom,
      round, rng, parried: isParried, parryPenalty
    });

    if (isParried && !blow.kill && (pCase === 'c' || pCase === 'd')) {
      const unpenalized = blow.total + parryPenalty;
      if (unpenalized >= blow.tn) blow.breakWeapon = true;
    }
    blows.push(blow);

    if (blow.kill) return { blows, outcome: who, nextFirstStriker: first, parryCase: pCase };
    if (blow.breakWeapon) {
      for (let j = i + 1; j < seq.length; j++) if (seq[j] === 'defender') { seq.splice(j, 1); j--; }
    }
  }
  return { blows, outcome:'continues', nextFirstStriker:first, parryCase:pCase };
}
