// chainmail-joust.mjs · Tournament-joust resolver (Chainmail Appendix C). Portable engine module.
// Run: node chainmail-joust.mjs
//
// DATA STATUS — NOT YET ENCODED. Appendix C was not in the pasted rulebook text (only the
// mass-combat pages p.8-23 were). Everything below is the *contract*; the matrix and the
// golden cases are placeholders. Paste Appendix C and the fill is mechanical. Nothing here
// invents RAW, per the project's "encode from the scans" rule.

// Attacker's declared lance target. FILL / CONFIRM from Appendix C.
export const AIM_POINTS = [
  // e.g. 'helm', 'shield', 'body', 'lance', 'horse' — confirm the actual list + order
];

// Defender's declared shield placement / posture. FILL / CONFIRM from Appendix C.
export const DEFENSIVE_POSITIONS = [
  // confirm the actual list + order
];

// Result codes (design doc gives 'M'|'G'|'B'|'U'|'H'|'I'). Meanings are GUESSES to confirm:
export const RESULTS = {
  M: 'miss',            // ? confirm
  G: 'glancing blow',   // ? confirm
  B: 'broken lance',    // ? confirm
  U: 'unhorsed',        // ? confirm
  H: 'solid hit',       // ? confirm
  I: 'UNKNOWN',         // ? confirm — what does I stand for?
};

// JOUST_MATRIX[aim][position] = result code. FILL from the Appendix C chart.
export const JOUST_MATRIX = {
  // helm:   { shieldHigh: 'U', shieldLow: 'G', ... },
};

// RESOLUTION MECHANIC — CONFIRM. The design-doc signature passes `rng`, implying a die is
// involved, but the matrix may be a pure deterministic lookup with the die only breaking
// ties or grading severity. Implemented as a straight lookup until the RAW mechanic is known;
// the rng arg is threaded now so the signature is stable when the die is wired.
export function resolveJoust({ aim, position, rng }) {
  const row = JOUST_MATRIX[aim];
  if (!row) throw new Error(`unknown aim point: ${aim}`);
  const code = row[position];
  if (!code) throw new Error(`no joust cell: ${aim} x ${position}`);
  return { aim, position, code, result: RESULTS[code] || code };
}

// Harness rig. Golden cases come from Appendix C worked examples once pasted.
function tests() {
  const cases = [
    // { aim:'helm', position:'shieldHigh', expect:'U' },
  ];
  let pass = 0;
  for (const c of cases) {
    let got;
    try { got = resolveJoust({ aim: c.aim, position: c.position, rng: () => 0 }).code; }
    catch (e) { got = `ERR:${e.message}`; }
    const ok = got === c.expect;
    pass += ok ? 1 : 0;
    console.log(`  ${ok ? 'OK ' : 'XX '} ${c.aim} x ${c.position} -> ${got}${ok ? '' : ` (expected ${c.expect})`}`);
  }
  console.log(cases.length ? `  ${pass}/${cases.length} joust cases` : '  no golden cases yet - awaiting Appendix C');
}
tests();
