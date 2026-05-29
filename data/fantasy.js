// Fantastic types — id, name, morale, point value. withdraw* on attack, magicUser@ in Wizard column.

export const FANTASTIC_TYPES = Object.freeze([
  { id:'BALROG',     name:'Balrog',         morale:50,  point:75 },
  { id:'DRAGON',     name:'Dragon',         morale:'—', point:100 },
  { id:'ELEMENTAL',  name:'Elemental',      morale:'—', point:'—' },
  { id:'ENT',        name:'Ent (Tree)',     morale:20,  point:15 },
  { id:'GIANT',      name:'Giant',          morale:'—', point:50 },
  { id:'HERO',       name:'Hero',           morale:20,  point:20,  withdraw:true },
  { id:'LYCAN',      name:'Lycanthrope',    morale:20,  point:20 },
  { id:'ROC',        name:'Roc',            morale:'—', point:20 },
  { id:'SUPER_HERO', name:'Super Hero',     morale:40,  point:50,  withdraw:true },
  { id:'TROLL',      name:'Troll / Ogre',   morale:8,   point:15 },
  { id:'WIGHT',      name:'Wight / Ghoul',  morale:10,  point:10 },
  { id:'WIZARD',     name:'Wizard',         morale:50,  point:100, withdraw:true, magicUser:true },
  { id:'WRAITH',     name:'Wraith',         morale:10,  point:10,  withdraw:true },
]);
export const ELF_MAGIC_ATTACKER = Object.freeze({
  id:'ELF_MAGIC', name:'Elf w/ magic weapon', withdraw:false, isExtra:true,
});
export const fantasticTypeById = (id) =>
  id === 'ELF_MAGIC' ? ELF_MAGIC_ATTACKER : FANTASTIC_TYPES.find(t => t.id === id);

// Appendix E matrix — 2d6 target. < no effect, = fall back 1 move, > killed.
// Balrog vs Roc reads "1-" in the source → encoded as 1 (auto-kills on 2d6 ≥ 2).
export const FANTASY_TARGETS = Object.freeze({
  BALROG:     { BALROG:7,  DRAGON:11, ELEMENTAL:11, ENT:8,  GIANT:8,  HERO:4, LYCAN:6, ROC:1,  SUPER_HERO:7,  TROLL:6,  WIGHT:4,  WIZARD:8,  WRAITH:11 },
  DRAGON:     { BALROG:6,  DRAGON:8,  ELEMENTAL:10, ENT:6,  GIANT:9,  HERO:5, LYCAN:4, ROC:8,  SUPER_HERO:8,  TROLL:5,  WIGHT:2,  WIZARD:10, WRAITH:7  },
  ELEMENTAL:  { BALROG:10, DRAGON:10, ELEMENTAL:11, ENT:7,  GIANT:9,  HERO:4, LYCAN:7, ROC:7,  SUPER_HERO:7,  TROLL:7,  WIGHT:2,  WIZARD:8,  WRAITH:10 },
  ENT:        { BALROG:12, DRAGON:12, ELEMENTAL:12, ENT:7,  GIANT:8,  HERO:4, LYCAN:4, ROC:11, SUPER_HERO:7,  TROLL:7,  WIGHT:3,  WIZARD:10, WRAITH:10 },
  GIANT:      { BALROG:9,  DRAGON:9,  ELEMENTAL:10, ENT:7,  GIANT:9,  HERO:6, LYCAN:5, ROC:6,  SUPER_HERO:9,  TROLL:6,  WIGHT:4,  WIZARD:11, WRAITH:12 },
  HERO:       { BALROG:11, DRAGON:12, ELEMENTAL:12, ENT:12, GIANT:11, HERO:7, LYCAN:8, ROC:10, SUPER_HERO:10, TROLL:9,  WIGHT:6,  WIZARD:11, WRAITH:11 },
  LYCAN:      { BALROG:10, DRAGON:12, ELEMENTAL:12, ENT:7,  GIANT:9,  HERO:7, LYCAN:7, ROC:7,  SUPER_HERO:7,  TROLL:7,  WIGHT:7,  WIZARD:7,  WRAITH:12 },
  ROC:        { BALROG:12, DRAGON:12, ELEMENTAL:12, ENT:8,  GIANT:10, HERO:5, LYCAN:6, ROC:9,  SUPER_HERO:8,  TROLL:6,  WIGHT:5,  WIZARD:10, WRAITH:9  },
  SUPER_HERO: { BALROG:9,  DRAGON:10, ELEMENTAL:11, ENT:9,  GIANT:7,  HERO:5, LYCAN:6, ROC:8,  SUPER_HERO:8,  TROLL:7,  WIGHT:4,  WIZARD:11, WRAITH:11 },
  TROLL:      { BALROG:10, DRAGON:12, ELEMENTAL:12, ENT:10, GIANT:9,  HERO:8, LYCAN:9, ROC:11, SUPER_HERO:7,  TROLL:10, WIGHT:11, WIZARD:11, WRAITH:12 },
  WIGHT:      { BALROG:12, DRAGON:12, ELEMENTAL:12, ENT:11, GIANT:12, HERO:8, LYCAN:9, ROC:12, SUPER_HERO:12, TROLL:10, WIGHT:8,  WIZARD:10, WRAITH:11 },
  WIZARD:     { BALROG:7,  DRAGON:9,  ELEMENTAL:6,  ENT:10, GIANT:11, HERO:8, LYCAN:7, ROC:9,  SUPER_HERO:10, TROLL:8,  WIGHT:6,  WIZARD:10, WRAITH:5  },
  WRAITH:     { BALROG:10, DRAGON:12, ELEMENTAL:12, ENT:12, GIANT:8,  HERO:9, LYCAN:10,ROC:10, SUPER_HERO:9,  TROLL:11, WIGHT:7,  WIZARD:5,  WRAITH:7  },
});

// Elf-with-magic-weapon attack rows (p.30). Only listed targets valid for Fantasy Combat;
// vs others the elf reverts to mass combat with +1 die (handled by mass-melee engine, not here).
export const ELF_MAGIC_TARGETS = Object.freeze({
  HERO:9, SUPER_HERO:11, WIZARD:10, WRAITH:8, WIGHT:6, LYCAN:9, TROLL:7, BALROG:12, GIANT:10,
});

// Magic-user tiers (p.30). When magic user is attacker, mod is applied to their 2d6 roll.
// When magic user is defender (Wizard column @), mod is applied to the target threshold.
export const MAGIC_TIERS = Object.freeze([
  { id:'WIZARD',   name:'Wizard',   mod:0  },
  { id:'SORCERER', name:'Sorcerer', mod:-1 },
  { id:'WARLOCK',  name:'Warlock',  mod:-2 },
  { id:'MAGICIAN', name:'Magician', mod:-3 },
  { id:'SEER',     name:'Seer',     mod:-4 },
]);

// Appendix D reference — informational stats for 19 fantasy types.
export const FANTASY_REFERENCE = Object.freeze([
  { type:'Hobbits',         move:'12″',       ab:'A',             charge:'—',       fly:'—',       missile:'15″',    attack:'Lt. Ft.',  defend:'Lt. Ft.' },
  { type:'Sprites, pixies', move:'9″',        ab:'A',             charge:'—',       fly:'18″',     missile:'—',      attack:'Lt. Ft.',  defend:'Lt. Ft.' },
  { type:'Dwarves, gnomes', move:'6″',        ab:'B',             charge:'9″',      fly:'—',       missile:'—',      attack:'Hv. Ft.',  defend:'Lt. Ft.' },
  { type:'Goblins, kobolds',move:'6″',        ab:'B',             charge:'9″',      fly:'—',       missile:'—',      attack:'Hv. Ft.',  defend:'Lt. Ft.' },
  { type:'Elves, fairies',  move:'12″',       ab:'A, B, C',       charge:'—',       fly:'—',       missile:'18″',    attack:'Hv. Ft.',  defend:'Hv. Ft.' },
  { type:'Orcs',            move:'9″',        ab:'B',             charge:'12″',     fly:'—',       missile:'15″',    attack:'Hv. Ft.',  defend:'Hv. Ft.' },
  { type:'Heroes',          move:'12″(18″)',  ab:'D',             charge:'15″(24″)',fly:'—',       missile:'18″',    attack:'4 men*',   defend:'4 men*'  },
  { type:'Super heroes',    move:'12″(18″)',  ab:'D, E, F',       charge:'15″(24″)',fly:'—',       missile:'21″',    attack:'8 men*',   defend:'8 men*'  },
  { type:'Wizards',         move:'12″(30″)',  ab:'A, B, D, E, X', charge:'—',       fly:'—',       missile:'24″',    attack:'Special',  defend:'Special' },
  { type:'Wraiths (mtd.)',  move:'18″',       ab:'B, E, F, G',    charge:'24″',     fly:'36″',     missile:'—',      attack:'Special',  defend:'Special' },
  { type:'Wights, ghouls',  move:'9″',        ab:'B, G',          charge:'9″',      fly:'—',       missile:'—',      attack:'Special',  defend:'Special' },
  { type:'Lycanthropes (Bear/Wolf)', move:'9″/12″', ab:'B, H',    charge:'12″/18″', fly:'—',       missile:'—',      attack:'Special',  defend:'Special' },
  { type:'Trolls, ogres',   move:'9″',        ab:'B (I)',         charge:'12″',     fly:'—',       missile:'—',      attack:'6 men**',  defend:'6 men**' },
  { type:'Balrogs',         move:'6″',        ab:'B, J',          charge:'9″',      fly:'15″',     missile:'—',      attack:'Special',  defend:'Special' },
  { type:'Ents',            move:'6″',        ab:'K',             charge:'6″',      fly:'—',       missile:'—',      attack:'Special',  defend:'Special' },
  { type:'Giants',          move:'12″',       ab:'B, X',          charge:'18″',     fly:'—',       missile:'20″',    attack:'12 men**', defend:'12 men**' },
  { type:'Elementals',      move:'Special',   ab:'Special',       charge:'Special', fly:'Special', missile:'Special',attack:'Special',  defend:'Special' },
  { type:'Dragons',         move:'9″',        ab:'B, E, F, X',    charge:'15″',     fly:'24″',     missile:'—',      attack:'Special',  defend:'Special' },
  { type:'Rocs',            move:'— (if horsed)', ab:'E, F, L',   charge:'—',       fly:'48″',     missile:'—',      attack:'Special',  defend:'Special' },
]);
export const ABILITIES = Object.freeze([
  ['A', 'become invisible (Hobbits only in brush or woods)'],
  ['B', 'see in normal darkness as if light'],
  ['C', 'split-move and fire'],
  ['D', 'raise morale of friendly troops'],
  ['E', 'cause the enemy to check morale'],
  ['F', 'detect hidden / invisible enemies'],
  ['G', 'paralyze by touch'],
  ['H', 'assume the shape of and gather like animals'],
  ['I', 'regenerate the body (trolls only, not required)'],
  ['J', 'change to flames and immolate by touch'],
  ['K', 'cause trees to move and fight'],
  ['L', 'transport figures of man-weight'],
  ['X', 'cast fire or similar substances or stones'],
]);
