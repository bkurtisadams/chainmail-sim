// Mass-combat troop types — class (for COMBAT lookup), morale rating (p.15), loss threshold (p.17).
// HH morale=8 per the printed table; the p.15-16 worked example uses 9 — the engine takes morale
// as an input so either value can be used per-side per-resolution.

export const TYPES = Object.freeze([
  { id:'PE',  name:'Peasants',         cls:'LF', morale:3, loss:{ pct:0.25, score:8 } },
  { id:'LV',  name:'Levies',           cls:'HF', morale:4, loss:{ pct:0.25, score:8 } },
  { id:'LF',  name:'Light Foot',       cls:'LF', morale:4, loss:{ pct:0.25, score:8 } },
  { id:'HF',  name:'Heavy Foot',       cls:'HF', morale:5, loss:{ pct:1/3,  score:7 } },
  { id:'EHF', name:'Elite Heavy Foot', cls:'HF', morale:6, loss:{ pct:1/3,  score:6 } },
  { id:'AF',  name:'Armored Foot',     cls:'AF', morale:7, loss:{ pct:1/3,  score:6 } },
  { id:'LH',  name:'Light Horse',      cls:'LH', morale:6, loss:{ pct:0.25, score:8 } },
  { id:'MH',  name:'Medium Horse',     cls:'MH', morale:7, loss:{ pct:1/3,  score:7 } },
  { id:'HH',  name:'Heavy Horse',      cls:'HH', morale:8, loss:{ pct:0.50, score:6 } },
  { id:'SP',  name:'Swiss Pikemen',    cls:'HF', morale:9, loss:{ pct:0.50, score:5 } },
  { id:'MK',  name:'Mounted Knights',  cls:'HH', morale:8, loss:{ pct:0.50, score:4 } },
]);

export const typeById = (id) => TYPES.find(t => t.id === id);
