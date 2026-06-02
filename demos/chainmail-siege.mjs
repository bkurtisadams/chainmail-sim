// chainmail-siege.mjs · Siege rules (Chainmail p.22-23). Portable engine module.
// Run: node chainmail-siege.mjs
//
// Encoded from the SIEGES text. Engine-layer: structure defense values, weapon attack values and
// the battering loop, equipment movement formulas, and the escalade/ram/rock/mine dice + timers.
// Board-layer (deferred): the 2-D placement of breeches, oil paths/puddles, mantlets and
// structures, and the ditch/moat crossing test - geometry over board coordinates.

// Structure defense values (point-value ranges; the scenario/GM picks a value in range).
export const STRUCTURES = {
  bastion:        { name: 'Bastion / round tower',              min: 40, max: 60 },
  gatehouse:      { name: 'Gatehouse / square tower / gate',    min: 30, max: 45 },
  curtain:        { name: 'Curtain wall / stone building',      min: 25, max: 40 },
  rampart:        { name: 'Rampart / earth-filled gabion',      min: 20, max: 30 },
  wooden:         { name: 'Wooden structure / palisade',        min: 5,  max: 15 },
  artilleryLarge: { name: 'Cannon / large catapult (as target)',min: 5,  max: 5 },
  artillerySmall: { name: 'Small catapult / mantlet (as target)',min: 3, max: 3 },
};
export const structureDefenseRange = (id) => { const s = STRUCTURES[id]; return s ? { min: s.min, max: s.max } : null; };

// Siege weapon attack values: defense points removed per hit (per turn in contact, for the ram).
export const SIEGE_WEAPONS = {
  bombard:         { name: 'Bombard',                          points: 6 },
  heavyFieldGun:   { name: 'Heavy Field Gun',                  points: 4 },
  lightFieldGun:   { name: 'Light Field Gun / Large Catapult', points: 3 },
  smallCatapult:   { name: 'Small Catapult',                   points: 2 },
  coveredRam:      { name: 'Covered ram / pick / screw',       points: 2 },   // per turn in contact
  rockOnEquipment: { name: 'Dropped rock (vs equipment)',      points: 1 },
};

// Battering: subtract each hit's points; the target is destroyed when its defense reaches 0.
export function batterStructure(defenseValue, weaponIds) {
  let v = defenseValue; const log = [];
  for (const id of weaponIds) {
    const w = SIEGE_WEAPONS[id];
    if (!w) throw new Error(`unknown siege weapon: ${id}`);
    v = Math.max(0, v - w.points);
    log.push({ weapon: id, points: w.points, remaining: v });
  }
  return { remaining: v, destroyed: v <= 0, log };
}

// Pushed-equipment movement.
export const siegeTowerSpeed = (pushers) => Math.min(4, Math.floor(Math.max(0, pushers) / 2)); // 1"/2 men, max 4" (8 men)
export const mantletSpeed    = (pushers) => Math.min(6, Math.max(0, pushers) * 3);             // 3"/man, max 6" (2 men)

// Covered war machine: 2 damage/turn in contact; defender disables it on 2d6 >= 9 (ram-catchers).
export const RAM_DAMAGE_PER_TURN = 2;
export const ramDisabled = (d1, d2) => (d1 + d2) >= 9;

// Escalade rates + siege-tower capacity.
export const LADDER_CLIMB_PER_TURN = 3;
export const TOWER_CLIMB_PER_TURN = 5;
export const TOWER_CAPACITY = { drawbridge: 5, top: 3 };

// If defenders win a melee vs escaladers, a d6 of 5-6 pushes the ladder away: 2nd climber killed,
// 3rd stunned one turn.
export function ladderPushOff(die) {
  const pushed = die >= 5;
  return { pushed, secondKilled: pushed, thirdStunned: pushed };
}

// Rock down a ladder: 1st climber killed; 2nd saved on 1-3, 3rd saved on 1-5.
export function rockOnLadder(die2, die3) {
  return { first: 'killed', secondSurvives: die2 <= 3, thirdSurvives: die3 <= 5 };
}

// Boiling oil: a 2" downward path + a 4"x3" base puddle, killing all within; burns 3 turns (no
// entry). Wooden structures struck ignite (except ladders / peak-roofed rams): abandon next turn,
// burn 5 turns, then destroyed.
export const BOILING_OIL = {
  pathWidthIn: 2, puddleWideIn: 4, puddleDeepIn: 3, burnTurns: 3,
  woodAbandonInTurns: 1, woodBurnTurns: 5, immuneStructures: ['ladder', 'peakRoofRam'],
};

// Mines: a counter-mine within ~6-12" foils the mine (all miners killed); success makes a 6" breech.
export const MINE = { counterProximityMinIn: 6, counterProximityMaxIn: 12, breechWidthIn: 6 };
export const mineFoiled = (counterDistIn) => counterDistIn <= MINE.counterProximityMaxIn;

// Breech: passable at Rough Terrain speed; defender blocks with abatis in 3 clear turns; abatis
// behaves as a movable mantlet; attackers tear it down in 3 uninterrupted turns.
export const BREECH = { widthIn: 6, abatisBuildTurns: 3, abatisTearDownTurns: 3 };

function tests() {
  let pass = 0, total = 0;
  const ok = (cond, msg) => { total++; if (cond) pass++; else console.log('  XX ' + msg); };

  ok(STRUCTURES.bastion.min === 40 && STRUCTURES.bastion.max === 60, 'bastion 40-60');
  ok(STRUCTURES.wooden.min === 5 && STRUCTURES.curtain.max === 40, 'wooden 5-15, curtain max 40');
  ok(SIEGE_WEAPONS.bombard.points === 6 && SIEGE_WEAPONS.heavyFieldGun.points === 4 &&
     SIEGE_WEAPONS.lightFieldGun.points === 3 && SIEGE_WEAPONS.smallCatapult.points === 2, 'weapon attack values');

  { const r = batterStructure(24, Array(8).fill('lightFieldGun'));
    ok(r.destroyed && r.remaining === 0, 'curtain 24 falls to 8 light-gun hits (-3 each)'); }
  ok(!batterStructure(24, Array(7).fill('lightFieldGun')).destroyed, '7 hits leaves it standing (3 left)');
  ok(batterStructure(60, ['smallCatapult']).remaining === 58, 'a small catapult barely scratches a bastion (60 -> 58)');
  { let threw = false; try { batterStructure(10, ['trebuchet']); } catch (e) { threw = true; } ok(threw, 'unknown weapon throws'); }

  ok(siegeTowerSpeed(2) === 1 && siegeTowerSpeed(8) === 4 && siegeTowerSpeed(10) === 4 && siegeTowerSpeed(1) === 0, 'tower: 1"/2 men, cap 4"');
  ok(mantletSpeed(1) === 3 && mantletSpeed(2) === 6 && mantletSpeed(3) === 6, 'mantlet: 3"/man, cap 6"');

  ok(ramDisabled(5, 4) && !ramDisabled(4, 4) && ramDisabled(6, 6), 'ram-catchers disable on 2d6 >= 9');
  ok(ladderPushOff(5).pushed && ladderPushOff(5).secondKilled && !ladderPushOff(4).pushed, 'ladder pushed off on 5-6');
  ok(rockOnLadder(3, 5).secondSurvives && rockOnLadder(3, 5).thirdSurvives, 'rock: 2nd saved on 3, 3rd saved on 5');
  ok(!rockOnLadder(4, 6).secondSurvives && !rockOnLadder(4, 6).thirdSurvives, 'rock: 2nd dies on 4, 3rd dies on 6');
  ok(mineFoiled(10) && !mineFoiled(15), 'counter-mine within 12" foils the mine');
  ok(MINE.breechWidthIn === 6 && BREECH.widthIn === 6, 'a mined / battered breech is 6" wide');

  console.log(`  ${pass}/${total} siege assertions`);
}
tests();
