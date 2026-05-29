// Appendix A combat tables — { dice, perMen, kills } per (attackerClass, defenderClass).
// HF and AF rows are asterisked in the source: pikes/halberds add +1 die per man.

export const COMBAT = Object.freeze({
  LF: { LF:{dice:1,perMen:1,kills:[6]},     HF:{dice:1,perMen:2,kills:[6]},     AF:{dice:1,perMen:3,kills:[6]},
        LH:{dice:1,perMen:2,kills:[6]},     MH:{dice:1,perMen:3,kills:[6]},     HH:{dice:1,perMen:4,kills:[6]} },
  HF: { LF:{dice:1,perMen:1,kills:[5,6]},   HF:{dice:1,perMen:1,kills:[6]},     AF:{dice:1,perMen:2,kills:[6]},
        LH:{dice:1,perMen:2,kills:[6]},     MH:{dice:1,perMen:3,kills:[6]},     HH:{dice:1,perMen:4,kills:[6]} },
  AF: { LF:{dice:1,perMen:1,kills:[4,5,6]}, HF:{dice:1,perMen:1,kills:[5,6]},   AF:{dice:1,perMen:1,kills:[6]},
        LH:{dice:1,perMen:1,kills:[6]},     MH:{dice:1,perMen:2,kills:[6]},     HH:{dice:1,perMen:3,kills:[6]} },
  LH: { LF:{dice:2,perMen:1,kills:[5,6]},   HF:{dice:2,perMen:1,kills:[6]},     AF:{dice:1,perMen:1,kills:[6]},
        LH:{dice:1,perMen:1,kills:[6]},     MH:{dice:1,perMen:2,kills:[6]},     HH:{dice:1,perMen:3,kills:[6]} },
  MH: { LF:{dice:2,perMen:1,kills:[4,5,6]}, HF:{dice:2,perMen:1,kills:[5,6]},   AF:{dice:2,perMen:1,kills:[6]},
        LH:{dice:1,perMen:1,kills:[5,6]},   MH:{dice:1,perMen:1,kills:[6]},     HH:{dice:1,perMen:2,kills:[6]} },
  HH: { LF:{dice:4,perMen:1,kills:[5,6]},   HF:{dice:3,perMen:1,kills:[5,6]},   AF:{dice:2,perMen:1,kills:[5,6]},
        LH:{dice:2,perMen:1,kills:[5,6]},   MH:{dice:1,perMen:1,kills:[5,6]},   HH:{dice:1,perMen:1,kills:[6]} },
});

// Modifier eligibility:
//   - pike/halberd extra die (HF/AF only — the asterisked rows)
//   - impetus charge bonus (HF/AF/all horse, p.16)
export const POLEARM_CLASSES = new Set(['HF', 'AF']);
export const IMPETUS_CLASSES = new Set(['HF', 'AF', 'LH', 'MH', 'HH']);

// Flank/rear bump (p.16): attacker fights one class higher.
// AF and HH have no higher class — they instead get +1 to each die (kill threshold lowers).
export const CLASS_UP   = Object.freeze({ LF:'HF', HF:'AF', LH:'MH', MH:'HH' });
// Standing-horse defender (p.17 melee optional) returns at next lower class — first round only.
export const CLASS_DOWN = Object.freeze({ HH:'MH', MH:'LH', LH:'AF' });

// Post-melee reaction bands (p.15). 20-39 → back 2 / 40-59 → back 1 reads inverted but matches
// the book's worked example (diff 52 → back 1 move).
export const REACTION_BANDS = Object.freeze([
  { max: 19,        tag:'continues',  text:'melee continues' },
  { max: 39,        tag:'back2',      text:'back 2 moves, good order' },
  { max: 59,        tag:'back1',      text:'back 1 move, good order' },
  { max: 79,        tag:'retreat',    text:'retreat 1 move' },
  { max: 99,        tag:'rout',       text:'rout 1½ moves' },
  { max: Infinity,  tag:'surrender',  text:'surrender' },
]);

// Mass missile table (p.11). Best reading from the scan — verify uncertain cells against a clean print.
export const MASS_MISSILE = Object.freeze({
  unarmored: {
    label: 'Unarmored',
    dieBands: [[1,2], [3,6]], maxGroup: 10,
    firingBands: [
      { range:[1,2],  low:0, high:1 },
      { range:[3,4],  low:1, high:2 },
      { range:[5,6],  low:2, high:3 },
      { range:[7,8],  low:3, high:4 },
      { range:[9,10], low:4, high:5 },
    ],
  },
  half: {
    label: '½ Armor or Shield',
    dieBands: [[1,3], [4,6]], maxGroup: 10,
    firingBands: [
      { range:[1,2],  low:0, high:0 },
      { range:[3,4],  low:0, high:1 },
      { range:[5,6],  low:2, high:2 },
      { range:[7,8],  low:2, high:3 },
      { range:[9,10], low:3, high:3 },
    ],
  },
  fully: {
    label: 'Fully Armored',
    dieBands: [[1,4], [5,6]], maxGroup: 20,
    firingBands: [
      { range:[4,8],   low:0, high:1 },
      { range:[9,12],  low:1, high:2 },
      { range:[13,16], low:2, high:3 },
      { range:[17,20], low:3, high:3 },
    ],
  },
});
// Indirect fire bumps target armor category one up (p.12).
export const INDIRECT_BUMP = Object.freeze({ unarmored:'half', half:'fully', fully:'arrow_proof' });
