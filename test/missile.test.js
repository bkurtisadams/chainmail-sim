import { stubRng } from '../rng.js';
import { rangedWeaponById } from '../data/weapons.js';
import { parseRow, rangeBand, resolveIndividualMissile,
         splitFiringGroups, resolveMassMissile } from '../engine/missile.js';

// Range bands (composite 24″ — book example close 1-8 / medium 9-16 / max 17-24)
console.assert(rangeBand(1, 24)  === 'close',  '1″/24 close');
console.assert(rangeBand(8, 24)  === 'close',  '8″/24 close (boundary)');
console.assert(rangeBand(9, 24)  === 'medium', '9″/24 medium');
console.assert(rangeBand(16, 24) === 'medium', '16″/24 medium (boundary)');
console.assert(rangeBand(17, 24) === 'max',    '17″/24 max');
console.assert(rangeBand(24, 24) === 'max',    '24″/24 max');
console.assert(rangeBand(25, 24) === null,     '25″/24 out');

// parseRow notation
console.assert(parseRow('5-6-7').join(',') === '5,6,7',  'parse 5-6-7');
console.assert(parseRow('1-2-/').join(',') === '11,12,', 'parse 1-2-/ → 11,12,null');
console.assert(parseRow('0-1-/').join(',') === '10,11,', 'parse 0-1-/ → 10,11,null');

// Spot lookups
const lb = rangedWeaponById('longbow');
console.assert(parseRow(lb.rows[0])[0] === 5, 'longbow vs no armor close = 5');
console.assert(parseRow(lb.rows[6])[2] === null, 'longbow vs plate max = /');

// Individual fire — deterministic
const r1 = resolveIndividualMissile({
  weapon:lb, distance:5, armorIdx:0, cover:0, indirect:false,
  rng: stubRng([0.4, 0.2]) // 3 + 2 = 5
});
console.assert(r1.band === 'close' && r1.target === 5 && r1.total === 5 && r1.kill === true,
  'longbow close vs no armor: 2d6=5 vs target 5 → kill');

// Out of range
const r2 = resolveIndividualMissile({
  weapon:lb, distance:30, armorIdx:0, cover:0, indirect:false, rng: stubRng([0])
});
console.assert(!r2.ok && r2.reason === 'out of range', 'longbow @ 30″ out');

// Indirect
const r3 = resolveIndividualMissile({
  weapon:lb, distance:12, armorIdx:0, cover:0, indirect:true, rng: stubRng([0.9, 0.9])
});
console.assert(r3.ok && r3.indirect && r3.effRange === 14 && r3.effArmor === 1,
  'longbow indirect: range 14″, armor → leather');

// Indirect not permitted
const r4 = resolveIndividualMissile({
  weapon: rangedWeaponById('light_crossbow'), distance:5, armorIdx:0, indirect:true, rng: stubRng([0,0])
});
console.assert(!r4.ok && r4.reason.includes('not permitted'), 'light crossbow blocks indirect');

// Cover
const r5 = resolveIndividualMissile({
  weapon:lb, distance:5, armorIdx:0, cover:2, indirect:false, rng: stubRng([0.5, 0.5]) // 4+4=8, -2 = 6
});
console.assert(r5.kill === true && r5.total === 6 && r5.cover === 2, 'cover -2, still kill');

// splitFiringGroups
console.assert(splitFiringGroups(11, 10).join(',') === '6,5',   '11/10 → [6,5]');
console.assert(splitFiringGroups(25, 10).join(',') === '9,8,8', '25/10 → [9,8,8]');
console.assert(splitFiringGroups(7, 10).join(',')  === '7',     '7/10 → [7]');

// Mass missile — 10 firing vs half armor, d6=4 → high band → 3 kills (band 9-10)
const m1 = resolveMassMissile({ firingCount:10, armorGroup:'half', rng: stubRng([0.5]) });
console.assert(m1.groups.length === 1 && m1.groups[0].die === 4 && !m1.groups[0].isLow,
  'mass 10/half: 1 group, d6=4 high');
console.assert(m1.totalKills === 3, 'mass 10/half/high → 3 kills');

// Cover halves
const m2 = resolveMassMissile({ firingCount:10, armorGroup:'half', cover:true, rng: stubRng([0.5]) });
console.assert(m2.totalRaw === 3 && m2.totalKills === 1, 'cover halves 3 → 1');

// Indirect bumps category
const m3 = resolveMassMissile({ firingCount:10, armorGroup:'unarmored', indirect:true, rng: stubRng([0.5]) });
console.assert(m3.indirectApplied && m3.armorGroup === 'half', 'unarmored + indirect → half');

// Indirect arrow-proof
const m4 = resolveMassMissile({ firingCount:20, armorGroup:'fully', indirect:true, rng: stubRng([0.5]) });
console.assert(m4.arrowProof === true && m4.totalKills === 0, 'fully + indirect → arrow proof');

// Below minimum band
const m5 = resolveMassMissile({ firingCount:1, armorGroup:'fully', rng: stubRng([0.5]) });
console.assert(m5.groups[0].reason === 'below minimum band' && m5.totalKills === 0, '1 vs fully below band');

console.log('[missile] OK');
