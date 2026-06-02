// chainmail-artillery.mjs · Catapults, gunpowder, and cannon (Chainmail p.12-14). Portable engine module.
// Run: node chainmail-artillery.mjs
//
// Encoded verbatim from the p.12-14 text. The engine covers the resolvable rules: catapult
// rate-of-fire + the "fire optional" scatter, arquebusier per-man hit resolution, and the cannon
// dowel (colored sections muzzle->target) + variation die. The 2-D board geometry - catapult
// triangulation, cannon lateral-deviation placement, and which on-table figures fall under a
// hit-area circle or a named-color dowel section - is board-layer and lives above this module.
// The down-range (1-D) "which sections touch the target span" is here, since that is the part the
// worked example pins down and it is purely arithmetic.

const d6 = (rng) => 1 + Math.floor((rng ? rng() : 0) * 6);

// ===== CATAPULTS =====
export const CATAPULTS = {
  light: { name: 'Light Catapult', min: 15, max: 30, hitArea: 2,   everyTurns: 2 },
  heavy: { name: 'Heavy Catapult', min: 24, max: 48, hitArea: 3.5, everyTurns: 3 },
};
// All figures wholly or partially under the circular hit area (diameter = hitArea) are killed.
// Substantial overhead cover negates catapult fire. All catapult fire is indirect, no penalty.

// Rate of fire: 4 crew fires at base cadence; each crew short of 4 adds one turn; >4 no benefit.
export function catapultTurnsPerShot(typeId, crew) {
  const t = CATAPULTS[typeId];
  if (!t) throw new Error(`unknown catapult: ${typeId}`);
  const eff = Math.max(0, Math.min(4, crew));
  return t.everyTurns + (4 - eff);
}

// "Fire optional" scatter (p.12): roll two differently-coloured dice (over / under); the higher
// wins, its pips are the miss in inches; a tie lands on the called range.
export function catapultScatter(overDie, underDie) {
  if (overDie === underDie) return { dir: 'on', miss: 0 };
  return overDie > underDie ? { dir: 'over', miss: overDie } : { dir: 'under', miss: underDie };
}

// ===== ARQUEBUSIERS (gunpowder foot) =====
// A hit kills any figure regardless of armour. Per-man "accuracy die" (d6) vs a range band; the
// listed number is score-or-better. Out of range beyond 18".
export const ARQUEBUS_BANDS = [
  { maxRange: 6,  hitOn: 2 },
  { maxRange: 12, hitOn: 4 },
  { maxRange: 18, hitOn: 5 },
];
export function arquebusHitOn(rangeIn) {
  const b = ARQUEBUS_BANDS.find((b) => rangeIn <= b.maxRange);
  return b ? b.hitOn : null;
}
// cover: 'none' | 'half' (-1 to the die) | 'over' (-2). support: true adds +1 (weapon rested).
export function resolveArquebus({ rangeIn, shooters, cover = 'none', support = false, rng }) {
  const hitOn = arquebusHitOn(rangeIn);
  if (hitOn == null) return { inRange: false, kills: 0, rolls: [] };
  const mod = (support ? 1 : 0) - (cover === 'half' ? 1 : cover === 'over' ? 2 : 0);
  const rolls = []; let kills = 0;
  for (let i = 0; i < shooters; i++) {
    const die = d6(rng);
    const hit = die + mod >= hitOn;
    if (hit) kills++;
    rolls.push({ die, score: die + mod, hit });
  }
  return { inRange: true, hitOn, mod, kills, rolls };
}

// ===== CANNON =====
// Dowel sections muzzle->target, alternating White (short) / Black (long); lengths sum to range.
// The firer names WHITE or BLACK before placing; every figure touched by the named colour is
// eliminated (including non-target and even friendly figures). Cannon may not fire into woods.
// Indirect fire is permitted only to the Bombard, which is then resolved like a catapult (a
// 3.5" hit-area circle, no flight-bounce).
export const CANNON = {
  light:   { name: 'Light Field Gun', range: 30, diameter: 0.625, indirect: false,
             dowel: [['W',16],['B',6],['W',3],['B',5]] },
  heavy:   { name: 'Heavy Field Gun', range: 36, diameter: 0.75,  indirect: false,
             dowel: [['W',18],['B',6],['W',3],['B',2],['W',1],['B',6]] },
  bombard: { name: 'Bombard',         range: 42, diameter: 1,     indirect: true, indirectHitArea: 3.5,
             dowel: [['W',20],['B',8],['W',4],['B',2],['W',1],['B',7]] },
};

export function cannonSections(typeId) {
  const c = CANNON[typeId];
  if (!c) throw new Error(`unknown cannon: ${typeId}`);
  let at = 0; const ci = { W: 0, B: 0 };
  return c.dowel.map(([color, len], i) => {
    const start = at; at += len; ci[color]++;
    return { color, len, start, end: at, idx: i, colorIdx: ci[color] };
  });
}

// Variation measure: a d6 sets lateral deviation; 4 = straight (per the worked example). The
// 1.5"-segment inch-offset for the other faces is board geometry and is left to the board layer.
export function cannonVariation(die) {
  return { die, straight: die === 4 };
}

// Down-range hit: the named-colour sections overlapping the target's span [nearIn, farIn].
// Lateral placement and the deviation projection are board geometry; this is the 1-D part.
export function cannonSectionsHitting(typeId, namedColor, nearIn, farIn) {
  return cannonSections(typeId).filter((s) => s.color === namedColor && s.end > nearIn && s.start < farIn);
}

function tests() {
  const forced = (v) => () => (v - 0.5) / 6;   // makes d6 -> v
  let pass = 0, total = 0;
  const ok = (cond, msg) => { total++; if (cond) pass++; else console.log('  XX ' + msg); };

  // dowel section lengths sum to each gun's range
  for (const id of Object.keys(CANNON))
    ok(cannonSections(id).reduce((s, x) => s + x.len, 0) === CANNON[id].range, `${id} dowel sums to ${CANNON[id].range}"`);

  // worked example: Heavy Field Gun, WHITE, straight, target 26" deep 8" (span 22-30) -> 2nd + 3rd white
  { const hit = cannonSectionsHitting('heavy', 'W', 22, 30);
    ok(hit.length === 2 && hit[0].colorIdx === 2 && hit[1].colorIdx === 3, 'heavy WHITE vs 22-30: 2nd + 3rd white sections');
    ok(hit[0].len === 3 && hit[1].len === 1, 'those white sections are 3" and 1" (matches p.14 example)');
    ok(!cannonSectionsHitting('heavy', 'W', 22, 30).some((s) => s.colorIdx === 1), 'the long 1st white section (0-18) does not reach the target'); }
  ok(cannonVariation(4).straight && !cannonVariation(1).straight, 'variation die: 4 = straight');

  // catapult rate of fire by crew
  ok(catapultTurnsPerShot('light', 4) === 2 && catapultTurnsPerShot('light', 2) === 4, 'light catapult: 4 crew=2, 2 crew=4');
  ok(catapultTurnsPerShot('heavy', 4) === 3 && catapultTurnsPerShot('heavy', 1) === 6, 'heavy catapult: 4 crew=3, 1 crew=6');
  ok(catapultTurnsPerShot('light', 5) === 2, 'extra crew above 4 gives no benefit');

  // catapult fire-optional scatter
  ok(catapultScatter(5, 3).dir === 'over' && catapultScatter(5, 3).miss === 5, 'scatter: over wins, miss 5"');
  ok(catapultScatter(2, 4).dir === 'under' && catapultScatter(2, 4).miss === 4, 'scatter: under wins, miss 4"');
  ok(catapultScatter(3, 3).dir === 'on' && catapultScatter(3, 3).miss === 0, 'scatter: tie lands on range');

  // arquebus bands + resolution
  ok(arquebusHitOn(3) === 2 && arquebusHitOn(9) === 4 && arquebusHitOn(15) === 5 && arquebusHitOn(20) === null, 'arquebus hit bands');
  ok(resolveArquebus({ rangeIn: 9, shooters: 1, rng: forced(4) }).kills === 1, 'arquebus: die 4 at 9" (need 4) hits');
  ok(resolveArquebus({ rangeIn: 9, shooters: 1, cover: 'half', rng: forced(4) }).kills === 0, 'half cover (-1): die 4 -> 3, misses');
  ok(resolveArquebus({ rangeIn: 15, shooters: 1, support: true, rng: forced(4) }).kills === 1, 'support (+1): die 4 -> 5 at 15" (need 5) hits');
  ok(resolveArquebus({ rangeIn: 20, shooters: 10, rng: forced(6) }).inRange === false, 'beyond 18" is out of range');

  console.log(`  ${pass}/${total} artillery assertions`);
}
tests();
