// Fantasy combat resolver (Appendix E). Single 2d6 with under/equal/over outcomes.

import { roll2d6 } from '../rng.js';
import { FANTASY_TARGETS, ELF_MAGIC_TARGETS, fantasticTypeById } from '../data/fantasy.js';

export function resolveFantasyCombat({
  attackerId, defenderId,
  attackerTierMod = 0, defenderTierMod = 0,
  magicSword = false, magicArmor = false,
  rng,
}) {
  let baseTarget;
  if (attackerId === 'ELF_MAGIC') {
    baseTarget = ELF_MAGIC_TARGETS[defenderId];
    if (baseTarget === undefined)
      return { ok:false, reason:'no Elf-magic Fantasy Combat entry for this defender — use mass combat +1 die' };
  } else {
    baseTarget = FANTASY_TARGETS[attackerId]?.[defenderId];
    if (baseTarget === undefined) return { ok:false, reason:'no Fantasy Combat entry for this pairing' };
  }
  const dice = roll2d6(rng);
  let rollMod = 0;
  if (magicSword) rollMod += 1;       // p.38 magical sword +1 on Fantasy Combat
  if (magicArmor) rollMod -= 1;       // p.38 magic armor subtracts 1 from attacker
  rollMod += attackerTierMod;         // weaker magic users on offense — reduced
  const targetMod = defenderTierMod;  // weaker magic users on defense — target lowered (easier)
  const effectiveRoll = dice.sum + rollMod;
  const target = baseTarget + targetMod;
  // Meeting the target kills (p.29 Elf "score X", p.37 True Troll "X or better").
  // The "driven back" band lives on the Wizard-missile table, not the melee FCT.
  const outcome = effectiveRoll >= target ? 'killed' : 'no_effect';
  const attacker = fantasticTypeById(attackerId);
  const canWithdraw = outcome === 'no_effect' && !!attacker.withdraw;
  return { ok:true, dice, baseTarget, target, rollMod, targetMod, effectiveRoll, outcome, canWithdraw };
}
