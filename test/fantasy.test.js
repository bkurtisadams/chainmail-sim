import { stubRng } from '../rng.js';
import { FANTASY_TARGETS } from '../data/fantasy.js';
import { resolveFantasyCombat } from '../engine/fantasy.js';

// Matrix spot-checks
console.assert(FANTASY_TARGETS.HERO.DRAGON    === 12, 'Hero vs Dragon = 12');
console.assert(FANTASY_TARGETS.DRAGON.HERO    === 5,  'Dragon vs Hero = 5');
console.assert(FANTASY_TARGETS.BALROG.ROC     === 1,  'Balrog vs Roc = 1 (auto-kill)');
console.assert(FANTASY_TARGETS.WIZARD.WRAITH  === 5,  'Wizard vs Wraith = 5');
console.assert(FANTASY_TARGETS.WRAITH.WIZARD  === 5,  'Wraith vs Wizard = 5');
console.assert(FANTASY_TARGETS.SUPER_HERO.GIANT === 7, 'Super Hero vs Giant = 7');

// Outcome bands (Dragon vs Hero, target 5)
const r_ne = resolveFantasyCombat({ attackerId:'DRAGON', defenderId:'HERO', rng: stubRng([0.2, 0.2]) }); // 4
console.assert(r_ne.outcome === 'no_effect', 'roll 4 = no effect');

const r_fb = resolveFantasyCombat({ attackerId:'DRAGON', defenderId:'HERO', rng: stubRng([0.2, 0.4]) }); // 5
console.assert(r_fb.outcome === 'fall_back', 'roll 5 = fall back');

const r_k = resolveFantasyCombat({ attackerId:'DRAGON', defenderId:'HERO', rng: stubRng([0.4, 0.4]) });  // 6
console.assert(r_k.outcome === 'killed', 'roll 6 = killed');

// Withdraw flag
const r_w = resolveFantasyCombat({ attackerId:'HERO', defenderId:'DRAGON', rng: stubRng([0.2, 0.4]) });
console.assert(r_w.outcome === 'no_effect' && r_w.canWithdraw === true, 'Hero may withdraw');
const r_nw = resolveFantasyCombat({ attackerId:'DRAGON', defenderId:'HERO', rng: stubRng([0.2, 0.2]) });
console.assert(r_nw.canWithdraw === false, 'Dragon cannot withdraw');

// Magic sword / armor
const r_ms = resolveFantasyCombat({
  attackerId:'HERO', defenderId:'DRAGON', magicSword:true, rng: stubRng([0.9, 0.9])
});
console.assert(r_ms.outcome === 'killed' && r_ms.rollMod === 1, 'magic sword +1 pushes hit');

const r_ma = resolveFantasyCombat({
  attackerId:'DRAGON', defenderId:'HERO', magicArmor:true, rng: stubRng([0.2, 0.4])
});
console.assert(r_ma.outcome === 'no_effect' && r_ma.rollMod === -1, 'magic armor demotes');

// Magic-user tiers
const r_at = resolveFantasyCombat({
  attackerId:'WIZARD', defenderId:'HERO', attackerTierMod:-1, rng: stubRng([0.5, 0.6])
});
console.assert(r_at.outcome === 'no_effect' && r_at.rollMod === -1, 'Sorcerer attacker -1');

const r_dt = resolveFantasyCombat({
  attackerId:'HERO', defenderId:'WIZARD', defenderTierMod:-1, rng: stubRng([0.6, 0.6])
});
console.assert(r_dt.target === 10 && r_dt.outcome === 'no_effect', 'Sorcerer defender target -1');

// Elf magic
const r_e = resolveFantasyCombat({ attackerId:'ELF_MAGIC', defenderId:'WRAITH', rng: stubRng([0.6, 0.6]) });
console.assert(r_e.ok && r_e.baseTarget === 8 && r_e.outcome === 'fall_back', 'Elf magic vs Wraith target 8');

const r_ei = resolveFantasyCombat({ attackerId:'ELF_MAGIC', defenderId:'DRAGON', rng: stubRng([0, 0]) });
console.assert(!r_ei.ok && r_ei.reason.includes('Elf-magic'), 'Elf magic vs Dragon — no entry');

// Balrog vs Roc auto-kill
const r_br = resolveFantasyCombat({ attackerId:'BALROG', defenderId:'ROC', rng: stubRng([0, 0]) }); // 2
console.assert(r_br.outcome === 'killed', 'Balrog auto-kills Roc on min 2d6');

console.log('[fantasy] OK');
