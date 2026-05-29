// Man-to-man melee weapons (Appendix B top). row[i] = 2d6 threshold vs armor index i.
// proneCols: asterisked armor indexes where defender prone uses PRONE_KILL_TN (7+) instead.
// Hand Axe shares class 1 with Dagger and Halbard shares class 9 with Pole arms per the printed numbering.

export const WEAPONS = Object.freeze([
  { id:'dagger',     name:'Dagger',           cls:1,  row:[6,7,8,8,9,10,12,12,8,10], proneCols:[6,7] },
  { id:'hand_axe',   name:'Hand Axe',         cls:1,  row:[7,7,8,9,10,10,11,12,9,11] },
  { id:'mace',       name:'Mace',             cls:3,  row:[8,8,8,9,8,8,7,8,10,12] },
  { id:'sword',      name:'Sword',            cls:4,  row:[7,8,8,9,8,9,10,11,8,10], proneCols:[6,7] },
  { id:'battle_axe', name:'Battle Axe',       cls:5,  row:[8,8,8,8,7,7,9,10,7,9] },
  { id:'morn_star',  name:'Morning Star',     cls:6,  row:[6,6,7,7,6,7,8,8,8,8] },
  { id:'flail',      name:'Flail',            cls:7,  row:[7,7,7,7,6,7,6,7,6,8] },
  { id:'spear',      name:'Spear',            cls:8,  row:[8,8,9,9,10,10,11,12,7,9], proneCols:[6,7] },
  { id:'pole_arms',  name:'Pole arms',        cls:9,  row:[6,6,6,7,7,8,9,10,6,8],    proneCols:[6,7] },
  { id:'halbard',    name:'Halbard',          cls:9,  row:[8,8,8,7,6,6,7,8,6,9] },
  { id:'two_hand',   name:'Two-handed sword', cls:10, row:[6,6,6,6,5,5,6,7,6,8] },
  { id:'lance',      name:'Mounted lance',    cls:11, row:[5,5,5,5,6,7,8,9,5,7] },
  { id:'pike',       name:'Pike',             cls:12, row:[8,8,8,8,8,8,9,10,5,7] },
]);
export const weaponById = (id) => WEAPONS.find(w => w.id === id);

// Asterisked melee cells use this 2d6 threshold when defender is dismounted & prone (p.41 footnote).
export const PRONE_KILL_TN = 7;
// Pikes, spears, lances on charge get first blow over lower-class weapons (p.26 §4d).
export const CHARGE_REACH_CLASSES = new Set([8, 11, 12]);

// Individual missile weapons (Appendix B bottom).
// rows[i] = "close-medium-max" strings; parseRow() in engine/missile.js converts to numeric thresholds.
// Notation: 0=10, 1=11, 2=12, /=null (no kill possible at this range).
// NOTE: short-bow vs horse-no-armor reads "0-?-/" in the OCR — encoded as 10-12-/ pending clean print.
export const RANGED_WEAPONS = Object.freeze([
  { id:'short_bow',      name:'Short Bow',      range:15, indirectAllowed:true,
    rows:['6-7-8','6-7-8','6-7-8','7-8-9','8-9-0','9-0-1','1-2-/','2-/-/','0-2-/','2-/-/'] },
  { id:'horsebow',       name:'Horsebow',       range:18, indirectAllowed:true, mountedFire:true,
    rows:['5-6-7','5-6-8','5-6-8','6-7-8','8-9-0','9-0-1','1-2-/','2-/-/','9-0-1','2-/-/'] },
  { id:'light_crossbow', name:'Light Crossbow', range:18, indirectAllowed:false,
    rows:['5-6-7','5-7-8','5-7-8','6-7-9','8-9-0','0-1-/','1-2-/','2-/-/','9-0-/','2-/-/'] },
  { id:'longbow',        name:'Longbow',        range:21, indirectAllowed:true,
    rows:['5-6-7','5-6-7','5-6-7','5-6-8','6-7-9','8-9-0','9-1-/','1-2-/','7-9-2','9-1-/'] },
  { id:'composite',      name:'Composite Bow',  range:24, indirectAllowed:true,
    rows:['5-6-7','5-6-7','5-6-7','5-7-8','6-8-0','8-0-1','9-2-/','1-/-/','7-0-2','0-2-/'] },
  { id:'heavy_crossbow', name:'Heavy Crossbow', range:24, indirectAllowed:false, halfRoF:true,
    rows:['4-5-6','4-6-7','4-6-7','5-7-8','6-8-9','7-9-0','8-0-1','0-1-2','7-9-2','9-1-/'] },
  { id:'arquebus',       name:'Arquebus',       range:18, indirectAllowed:false, halfRoF:true,
    rows:['5-6-8','5-6-8','5-6-8','5-6-8','6-7-8','6-8-9','7-9-0','8-0-2','6-9-1','8-0-2'] },
]);
export const rangedWeaponById = (id) => RANGED_WEAPONS.find(w => w.id === id);
