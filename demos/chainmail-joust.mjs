// chainmail-joust.mjs · Tournament joust (Chainmail Appendix C + jousting procedure, p.26). Portable engine module.
// Run: node chainmail-joust.mjs
//
// Encoded verbatim from the Appendix C "Jousting Matrix" scan + the jousting rules text.
// The joust is DETERMINISTIC: each player picks an aiming point (attack) and a saddle position
// (defense), and each player's aim is matched against the OPPONENT's position. The only place a
// die enters is the multi-outcome cells (B/U, B/U/I, U/I) - the procedure names no die for them,
// so the injected rng makes a documented uniform pick (house-rule, configurable).
//
// Procedure (p.26): a "ride" resolves both attacks at once. Repeat until one or both knights are
// unhorsed, or three rides pass. A knight whose lance breaks (B, the attacker) or whose helm is
// knocked off (H, the defender) must assume position 4 (Steady Seat) the next ride - always legal,
// since position 4 is permitted under every aiming point.

export const DEFENSIVE_POSITIONS = [
  { n: 1, name: 'Lower Helm' },
  { n: 2, name: 'Lean Right' },
  { n: 3, name: 'Lean Left' },
  { n: 4, name: 'Steady Seat' },
  { n: 5, name: 'Shield High' },
  { n: 6, name: 'Shield Low' },
];

export const AIM_POINTS = [
  { id: 'Helm', name: 'Helm' },
  { id: 'DC',   name: 'Dexter Chief' },
  { id: 'CP',   name: 'Chief, Pale (centre)' },
  { id: 'SC',   name: 'Sinister Chief' },
  { id: 'DF',   name: 'Dexter Fess' },
  { id: 'FP',   name: 'Fess, Pale (centre)' },
  { id: 'SF',   name: 'Sinister Fess' },
  { id: 'Base', name: 'Base' },
];

// forces: who must take Steady Seat next ride. Breaks Lance -> the attacker (his lance);
// Helm Knocked Off -> the defender (his helm).
export const RESULTS = {
  B: { name: 'Breaks Lance',     forces: 'attacker' },
  G: { name: 'Glances Off' },
  H: { name: 'Helm Knocked Off', forces: 'defender' },
  I: { name: 'Injured' },
  M: { name: 'Miss' },
  U: { name: 'Unhorsed' },
};

// Tourney scoring (p.26): points to the attacker / defender of each individual attack.
export const SCORE = {
  B: { attacker: -1, defender: 0 },
  G: { attacker: 0,  defender: 0 },
  H: { attacker: 3,  defender: 0 },
  I: { attacker: 0,  defender: -10 },
  M: { attacker: 0,  defender: 0 },
  U: { attacker: 20, defender: 0 },
};

export const JOUST_MATRIX = {
  Helm: { 1: 'M',     2: 'M',   3: 'M',   4: 'H',   5: 'U',     6: 'M'   },
  DC:   { 1: 'U',     2: 'B',   3: 'M',   4: 'B',   5: 'B',     6: 'M'   },
  CP:   { 1: 'B/U/I', 2: 'U',   3: 'G',   4: 'B',   5: 'B/U',   6: 'U/I' },
  SC:   { 1: 'G',     2: 'M',   3: 'B',   4: 'G',   5: 'G',     6: 'U'   },
  DF:   { 1: 'B',     2: 'B/U', 3: 'M',   4: 'B',   5: 'M',     6: 'B'   },
  FP:   { 1: 'B/U',   2: 'G',   3: 'B',   4: 'B/U', 5: 'B/U/I', 6: 'B'   },
  SF:   { 1: 'G',     2: 'M',   3: 'B/U', 4: 'G',   5: 'G',     6: 'G'   },
  Base: { 1: 'B',     2: 'G',   3: 'U',   4: 'B',   5: 'B/U/I', 6: 'B'   },
};

// "Possible Defensive Positions Considering Aiming Point": a knight choosing this aim may only
// take these saddle positions ("the aiming point will preclude certain defensive positions").
export const PDP_AP = {
  Helm: [4, 5, 6], DC: [3, 4, 5, 6], CP: 'any',      SC: [2, 4, 5, 6],
  DF:   [4, 5, 6], FP: 'any',        SF: [4, 5, 6],   Base: [1, 4, 5, 6],
};

export function isPositionAllowed(aim, position) {
  const a = PDP_AP[aim];
  if (!a) return false;
  return a === 'any' || a.includes(Number(position));
}

// One attack: an aiming point vs the opponent's saddle position.
export function resolveJoust({ aim, position, rng }) {
  const row = JOUST_MATRIX[aim];
  if (!row) throw new Error(`unknown aiming point: ${aim}`);
  const cell = row[position];
  if (!cell) throw new Error(`no joust cell: ${aim} x position ${position}`);
  const options = cell.split('/');
  let code = options[0], rolled = null;
  if (options.length > 1) {
    const r = rng ? rng() : 0;
    const idx = Math.min(options.length - 1, Math.floor(r * options.length));
    code = options[idx];
    rolled = { options, idx, r };
  }
  const res = RESULTS[code];
  return { aim, position: Number(position), cell, code, result: res.name,
    multiOutcome: options.length > 1, options, rolled, forcesSteadyNext: res.forces || null };
}

// One ride: both knights' aims resolved against the other's position (no legality check here -
// runJoust does that). aChoice/bChoice = { aim, position }.
export function resolveRide(aChoice, bChoice, rng) {
  const aAtk = resolveJoust({ aim: aChoice.aim, position: bChoice.position, rng });
  const bAtk = resolveJoust({ aim: bChoice.aim, position: aChoice.position, rng });
  const unhorsed = { A: bAtk.code === 'U', B: aAtk.code === 'U' };
  const injured  = { A: bAtk.code === 'I', B: aAtk.code === 'I' };
  const score = {
    A: SCORE[aAtk.code].attacker + SCORE[bAtk.code].defender,
    B: SCORE[bAtk.code].attacker + SCORE[aAtk.code].defender,
  };
  const forcedNext = { A: false, B: false };
  if (aAtk.forcesSteadyNext === 'attacker') forcedNext.A = true;
  if (aAtk.forcesSteadyNext === 'defender') forcedNext.B = true;
  if (bAtk.forcesSteadyNext === 'attacker') forcedNext.B = true;
  if (bAtk.forcesSteadyNext === 'defender') forcedNext.A = true;
  return { aAtk, bAtk, unhorsed, injured, score, forcedNext };
}

// Full joust: up to three rides. a/b = { id, rides:[{aim,position}, ...] }.
export function runJoust({ a, b, rng }) {
  const log = [];
  const total = { A: 0, B: 0 };
  let forced = { A: false, B: false };
  let outcome = 'no unhorse - decided on points';
  let ridesPlayed = 0;
  for (let r = 0; r < 3; r++) {
    const aC = { ...(a.rides[r] || a.rides[a.rides.length - 1]) };
    const bC = { ...(b.rides[r] || b.rides[b.rides.length - 1]) };
    if (forced.A) aC.position = 4;
    if (forced.B) bC.position = 4;
    if (!isPositionAllowed(aC.aim, aC.position)) throw new Error(`illegal pairing A: aim ${aC.aim} precludes position ${aC.position}`);
    if (!isPositionAllowed(bC.aim, bC.position)) throw new Error(`illegal pairing B: aim ${bC.aim} precludes position ${bC.position}`);
    const ride = resolveRide(aC, bC, rng);
    total.A += ride.score.A; total.B += ride.score.B;
    log.push({ ride: r + 1, aChoice: aC, bChoice: bC, ...ride });
    ridesPlayed = r + 1;
    if (ride.unhorsed.A || ride.unhorsed.B) {
      outcome = ride.unhorsed.A && ride.unhorsed.B ? 'double unhorse'
        : ride.unhorsed.B ? `${a.id || 'A'} unhorses ${b.id || 'B'}`
        : `${b.id || 'B'} unhorses ${a.id || 'A'}`;
      break;
    }
    forced = ride.forcedNext;
  }
  return { ridesPlayed, log, total, outcome };
}

function tests() {
  const forced = (v) => () => v;
  let pass = 0, total = 0;
  const ok = (cond, msg) => { total++; if (cond) pass++; else console.log('  XX ' + msg); };

  for (const aim of Object.keys(JOUST_MATRIX))
    for (let p = 1; p <= 6; p++)
      ok(RESULTS[resolveJoust({ aim, position: p, rng: forced(0) }).code] !== undefined, `${aim} x ${p} legal code`);

  ok(resolveJoust({ aim: 'Helm', position: 4, rng: forced(0) }).code === 'H', 'Helm x4 = H');
  ok(resolveJoust({ aim: 'DC', position: 1, rng: forced(0) }).code === 'U', 'DC x1 = U');
  ok(resolveJoust({ aim: 'Base', position: 3, rng: forced(0) }).code === 'U', 'Base x3 = U');
  ok(resolveJoust({ aim: 'CP', position: 1, rng: forced(0) }).code === 'B', 'CP x1 low -> B');
  ok(resolveJoust({ aim: 'CP', position: 1, rng: forced(0.5) }).code === 'U', 'CP x1 mid -> U');
  ok(resolveJoust({ aim: 'CP', position: 1, rng: forced(0.99) }).code === 'I', 'CP x1 high -> I');

  ok(SCORE.U.attacker === 20 && SCORE.I.defender === -10 && SCORE.H.attacker === 3 && SCORE.B.attacker === -1, 'score table');
  ok(isPositionAllowed('Helm', 5) && !isPositionAllowed('Helm', 1), 'Helm allows 5, not 1');
  ok([1,2,3,4,5,6].every(p => isPositionAllowed(p === 0 ? 'Helm' : 'CP', p)), 'CP allows any position');
  ok(['Helm','DC','CP','SC','DF','FP','SF','Base'].every(a => isPositionAllowed(a, 4)), 'position 4 legal under every aim');

  // one ride: A aims SC@4 (glance), B aims Helm@4 (knocks A helm off) -> B+3, A forced Steady next
  { const ride = resolveRide({ aim: 'SC', position: 4 }, { aim: 'Helm', position: 4 }, forced(0));
    ok(ride.aAtk.code === 'G' && ride.bAtk.code === 'H', 'ride codes G / H');
    ok(ride.score.A === 0 && ride.score.B === 3, 'helm-off scores B+3');
    ok(ride.forcedNext.A === true && ride.forcedNext.B === false, 'helm-off forces A (defender) to Steady next');
    ok(!ride.unhorsed.A && !ride.unhorsed.B, 'no unhorse'); }

  // full joust: A Helm@5 unhorses B on ride 1 (Helm x5 = U), B SC@4 glances
  { const jl = runJoust({ a: { id: 'Lancelot', rides: [{ aim: 'Helm', position: 4 }] },
                          b: { id: 'Tristan',  rides: [{ aim: 'SC', position: 5 }] }, rng: forced(0) });
    ok(jl.ridesPlayed === 1, 'ends ride 1 on unhorse');
    ok(jl.total.A === 20, 'unhorse scores +20');
    ok(jl.outcome === 'Lancelot unhorses Tristan', 'outcome reads unhorse'); }

  // forced-Steady propagation: ride1 B knocks A helm off -> ride2 A is forced to position 4
  { const jl = runJoust({ a: { id: 'A', rides: [{ aim: 'SC', position: 4 }, { aim: 'SC', position: 6 }, { aim: 'SC', position: 6 }] },
                          b: { id: 'B', rides: [{ aim: 'Helm', position: 4 }, { aim: 'Helm', position: 6 }, { aim: 'Helm', position: 6 }] }, rng: forced(0) });
    ok(jl.log[1].aChoice.position === 4, 'helm-off knight forced to Steady Seat next ride'); }

  // illegal pairing is rejected
  { let threw = false;
    try { runJoust({ a: { id: 'A', rides: [{ aim: 'Helm', position: 1 }] }, b: { id: 'B', rides: [{ aim: 'Helm', position: 4 }] }, rng: forced(0) }); }
    catch (e) { threw = true; }
    ok(threw, 'illegal aim/position pairing rejected'); }

  console.log(`  ${pass}/${total} joust assertions`);
}
tests();
