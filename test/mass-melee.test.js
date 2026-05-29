import { COMBAT } from '../data/combat.js';
import { effectiveAttackerClass, classBumpsToBonus, effectiveDefenderReturnClass, applyDieBonus }
  from '../engine/mass-melee.js';

console.assert(COMBAT.HH.HF.dice === 3 && COMBAT.HH.HF.perMen === 1, 'HH vs HF = 3 dice/man');
console.assert(COMBAT.HF.HH.dice === 1 && COMBAT.HF.HH.perMen === 4, 'HF vs HH = 1 die per 4 men');
console.assert(COMBAT.LF.LF.kills.join() === '6',     'LF vs LF kills on 6');
console.assert(COMBAT.MH.LF.kills.join() === '4,5,6', 'MH vs LF kills on 4-6');

console.assert(effectiveAttackerClass('HF', { flank:true }) === 'AF', 'HF flank → AF');
console.assert(effectiveAttackerClass('LF', { rear:true })  === 'HF', 'LF rear → HF');
console.assert(effectiveAttackerClass('AF', { flank:true }) === 'AF', 'AF stays (bonus instead)');
console.assert(classBumpsToBonus('AF', { flank:true }) === true,  'AF flank → +1/die');
console.assert(classBumpsToBonus('HF', { flank:true }) === false, 'HF flank no +1/die');
console.assert(effectiveDefenderReturnClass('HH', true) === 'MH', 'standing HH → MH');
console.assert(applyDieBonus([6], 1).join()   === '5,6',   '[6] + 1 → [5,6]');
console.assert(applyDieBonus([5,6], 1).join() === '4,5,6', '[5,6] + 1 → [4,5,6]');

console.log('[mass-melee] OK');
