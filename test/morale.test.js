import { stubRng } from '../rng.js';
import { reactionFor, resolvePostMelee, resolveLossMorale } from '../engine/morale.js';

// Reaction bands as printed (note 40-59 → back 1, matching the book's example).
console.assert(reactionFor(0).tag   === 'continues', 'diff 0 continues');
console.assert(reactionFor(19).tag  === 'continues', 'diff 19 continues');
console.assert(reactionFor(20).tag  === 'back2',     'diff 20 → back 2');
console.assert(reactionFor(52).tag  === 'back1',     'diff 52 → back 1 (book example)');
console.assert(reactionFor(100).tag === 'surrender', 'diff 100 → surrender');

// ---- GOLDEN: p.15-16 worked example (HH rating = 9 to match the book) ----
const ex = resolvePostMelee({
  a:{ label:'A', startCount:10, casualties:2, morale:9 },
  b:{ label:'B', startCount:20, casualties:8, morale:5 },
  rng: stubRng([0.4]), // d6 = 3
});
console.assert(ex.casualtyBonus.dieRoll === 3,    'die = 3');
console.assert(ex.casualtyBonus.value   === 18,   'casualty bonus 6×3 = 18');
console.assert(ex.a.ratingScore === 72,           'HH rating × surv 9×8 = 72');
console.assert(ex.b.ratingScore === 60,           'HF rating × surv 5×12 = 60');
console.assert(ex.a.total === 90,                 'HH total 90');
console.assert(ex.b.total === 64,                 'HF total 64');
console.assert(ex.rawDiff === 26,                 'raw diff 26');
console.assert(ex.doubled === true,               'doubled (A < 20)');
console.assert(ex.diff === 52,                    'diff 52 after doubling');
console.assert(ex.loser === 'B',                  'HF loses');
console.assert(ex.reaction.tag === 'back1',       'HF back 1 move, good order');

// Variant — HH rating = 8 (the printed table value) → back 2 instead
const exTbl = resolvePostMelee({
  a:{ label:'A', startCount:10, casualties:2, morale:8 },
  b:{ label:'B', startCount:20, casualties:8, morale:5 },
  rng: stubRng([0.4]),
});
console.assert(exTbl.a.total === 82,              'table-rating HH total 82');
console.assert(exTbl.rawDiff === 18,              'table-rating raw diff 18');
console.assert(exTbl.diff === 36,                 'table-rating diff after doubling 36');
console.assert(exTbl.reaction.tag === 'back2',    'table-rating → back 2');

// Loss morale (p.17)
const ls = resolveLossMorale({
  type:'HF', startCount:30, casualties:10, surrounded:false, rng: stubRng([0.0, 0.0]),
});
console.assert(ls.triggered === true,    'HF 33% triggers');
console.assert(ls.passed === false,      'sum 2 fails');
console.assert(ls.action === 'removed',  'not surrounded → removed');

const lsOk = resolveLossMorale({
  type:'HF', startCount:30, casualties:8, surrounded:false, rng: stubRng([0, 0]),
});
console.assert(lsOk.triggered === false, 'HF 27% does not trigger');

console.log('[morale] OK');
