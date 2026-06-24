import { weaponById } from '../data/weapons.js';
import { targetNumber, blowCountFor, parryCase, firstStriker } from '../engine/man-to-man.js';

const dagger = weaponById('dagger'), sword = weaponById('sword'), pike = weaponById('pike'),
      spear = weaponById('spear'), mace = weaponById('mace');

console.assert(targetNumber(sword,  'leather', false) === 8,  'sword vs leather = 8');
console.assert(targetNumber(sword,  'plate',   false) === 10, 'sword vs plate = 10');
console.assert(targetNumber(sword,  'plate',   true)  === 7,  'sword vs plate (prone) = 7');
console.assert(targetNumber(dagger, 'plate',   false) === 12, 'dagger vs plate = 12');
console.assert(targetNumber(dagger, 'plate',   true)  === 7,  'dagger vs plate (prone) = 7');
console.assert(targetNumber(dagger, 'chain',   false) === 9,  'dagger vs chain = 9');

console.assert(blowCountFor(dagger.cls, pike.cls)   === 3, 'dagger vs pike → 3 blows');
console.assert(blowCountFor(pike.cls,   dagger.cls) === 1, 'pike vs dagger → 1 blow');
console.assert(blowCountFor(sword.cls,  pike.cls)   === 3, 'sword vs pike → 3 blows (diff 8)');
console.assert(blowCountFor(mace.cls,   pike.cls)   === 3, 'mace vs pike → 3 blows');
console.assert(blowCountFor(spear.cls,  dagger.cls) === 1, 'spear vs dagger → 1 blow');

console.assert(parryCase(sword.cls,  sword.cls)  === 'b', 'sword vs sword → case b');
console.assert(parryCase(pike.cls,   dagger.cls) === 'd', 'pike vs dagger → case d');
console.assert(parryCase(dagger.cls, pike.cls)   === 'a', 'dagger vs pike → case a');
console.assert(parryCase(spear.cls,  dagger.cls) === 'c', 'spear vs dagger → case c (diff 7)');

const f1 = firstStriker({ round:1,
  a:{ weapon:pike,  charging:true,  mounted:false }, d:{ weapon:sword, attackedFrom:'front', fromAbove:false } });
console.assert(f1.who === 'attacker', 'pike charge beats sword');

const f2 = firstStriker({ round:1,
  a:{ weapon:sword, charging:false, mounted:false }, d:{ weapon:sword, attackedFrom:'rear',  fromAbove:false } });
console.assert(f2.defenderReturns === false, 'rear → defender no return');

const f3 = firstStriker({ round:1,
  a:{ weapon:pike,  charging:false, mounted:false }, d:{ weapon:dagger, attackedFrom:'front', fromAbove:false } });
console.assert(f3.who === 'defender', 'case d (no charge) → defender first');

const f4 = firstStriker({ round:2, prevFirstStriker:'attacker',
  a:{ weapon:pike,  fromAbove:false }, d:{ weapon:sword, fromAbove:false, attackedFrom:'front' } });
console.assert(f4.who === 'defender', 'round 2 — sword faster than pike');

// Left flank (p.25): a mace defender (cls 3) vs a dagger attacker (cls 1) would normally
// strike first (weapon 2 classes higher), but a left-flank attack forces 2nd-blow position.
const f5front = firstStriker({ round:1,
  a:{ weapon:dagger, charging:false, mounted:false }, d:{ weapon:mace, attackedFrom:'front', fromAbove:false } });
console.assert(f5front.who === 'defender', 'front: mace (2 cls higher) strikes first');
const f5left = firstStriker({ round:1,
  a:{ weapon:dagger, charging:false, mounted:false }, d:{ weapon:mace, attackedFrom:'left', fromAbove:false } });
console.assert(f5left.who === 'attacker' && f5left.defenderReturns === true, 'left flank: attacker first, defender still returns');

console.log('[man-to-man] OK');
