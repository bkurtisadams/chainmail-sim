// chainmail-joust.mjs · Tournament-joust resolver (Chainmail Appendix C). Portable engine module.
// Run: node chainmail-joust.mjs
//
// Encoded verbatim from the Appendix C "Jousting Matrix" scan. The matrix is deterministic per
// (aiming point x defensive position); cells listing several outcomes (B/U, B/U/I, U/I) are the
// only place a die enters - the injected rng picks among them. The exact within-cell selection
// rule is NOT on the scan (only the matrix + legends are), so multi-outcome cells use a
// documented uniform pick pending the jousting *procedure* text. The surrounding match loop
// (simultaneous secret selection, passes, scoring, how PDP/AP is applied) is likewise not on
// the scan and is left to a thin layer above this resolver.

export const DEFENSIVE_POSITIONS = [
  { n: 1, name: 'Lower Helm' },
  { n: 2, name: 'Lean Right' },
  { n: 3, name: 'Lean Left' },
  { n: 4, name: 'Steady Seat' },
  { n: 5, name: 'Shield High' },
  { n: 6, name: 'Shield Low' },
];

// Aiming points: the Helm, then the shield divisions (Dexter/Pale/Sinister x Chief/Fess, plus
// Base). IDs are the matrix's own row labels, kept verbatim.
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

export const RESULTS = {
  B: { name: 'Breaks Lance',     forcesSteadyNext: true },   // * next ride: position 4
  G: { name: 'Glances Off' },
  H: { name: 'Helm Knocked Off', forcesSteadyNext: true },   // * next ride: position 4
  I: { name: 'Injured' },
  M: { name: 'Miss' },
  U: { name: 'Unhorsed' },
};

// JOUST_MATRIX[aim][defensivePosition] = result code (or slash-joined multi-outcome cell).
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

// "Possible Defensive Positions Considering Aiming Point" (PDP/AP). Stored as data; its
// procedural role isn't on the scan, so it is exposed (isPositionAllowed) but not enforced
// inside resolveJoust.
export const PDP_AP = {
  Helm: [4, 5, 6],
  DC:   [3, 4, 5, 6],
  CP:   'any',
  SC:   [2, 4, 5, 6],
  DF:   [4, 5, 6],
  FP:   'any',
  SF:   [4, 5, 6],
  Base: [1, 4, 5, 6],
};

export function isPositionAllowed(aim, position) {
  const a = PDP_AP[aim];
  if (!a) return false;
  return a === 'any' || a.includes(Number(position));
}

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
  return {
    aim, position: Number(position), cell, code, result: res.name,
    multiOutcome: options.length > 1, options, rolled,
    forcesSteadyNext: !!res.forcesSteadyNext,
  };
}

function tests() {
  const forced = (v) => () => v;
  let pass = 0, total = 0;
  const ok = (cond, msg) => { total++; if (cond) pass++; else console.log('  XX ' + msg); };

  for (const aim of Object.keys(JOUST_MATRIX))
    for (let p = 1; p <= 6; p++) {
      const r = resolveJoust({ aim, position: p, rng: forced(0) });
      ok(RESULTS[r.code] !== undefined, `${aim} x ${p} -> legal code (${r.code})`);
    }

  ok(resolveJoust({ aim: 'Helm', position: 4, rng: forced(0) }).code === 'H', 'Helm x4 = H');
  ok(resolveJoust({ aim: 'Helm', position: 4, rng: forced(0) }).forcesSteadyNext, 'H forces Steady next ride');
  ok(resolveJoust({ aim: 'DC',   position: 4, rng: forced(0) }).forcesSteadyNext, 'B forces Steady next ride');
  ok(!resolveJoust({ aim: 'SC',  position: 1, rng: forced(0) }).forcesSteadyNext, 'G does not force Steady next');
  ok(!resolveJoust({ aim: 'Helm',position: 5, rng: forced(0) }).forcesSteadyNext, 'U does not force Steady next');

  ok(resolveJoust({ aim: 'DC',   position: 1, rng: forced(0) }).code === 'U', 'DC x1 = U');
  ok(resolveJoust({ aim: 'SC',   position: 6, rng: forced(0) }).code === 'U', 'SC x6 = U');
  ok(resolveJoust({ aim: 'Base', position: 3, rng: forced(0) }).code === 'U', 'Base x3 = U');

  ok(resolveJoust({ aim: 'CP', position: 1, rng: forced(0) }).code    === 'B', 'CP x1 low roll -> B');
  ok(resolveJoust({ aim: 'CP', position: 1, rng: forced(0.5) }).code  === 'U', 'CP x1 mid roll -> U');
  ok(resolveJoust({ aim: 'CP', position: 1, rng: forced(0.99) }).code === 'I', 'CP x1 high roll -> I');
  ok(resolveJoust({ aim: 'CP', position: 1, rng: forced(0) }).multiOutcome, 'CP x1 flagged multiOutcome');

  ok(isPositionAllowed('Helm', 5) && !isPositionAllowed('Helm', 1), 'Helm allows 5, not 1');
  ok(isPositionAllowed('CP', 1) && isPositionAllowed('FP', 6), 'CP/FP allow any');

  console.log(`  ${pass}/${total} joust assertions`);
}
tests();
