// Appendix B armor classes — shared by melee and individual missile tables.
// Order matches the table columns (0..9).

export const ARMOR = Object.freeze([
  { id:'none',         label:'No armor' },
  { id:'leather',      label:'Leather / padded' },
  { id:'shield',       label:'Shield only' },
  { id:'leather_sh',   label:'Leather + shield' },
  { id:'chain',        label:'Chain / banded / studded / splint' },
  { id:'chain_sh',     label:'Chain + shield' },
  { id:'plate',        label:'Plate armor' },
  { id:'plate_sh',     label:'Plate + shield' },
  { id:'horse_none',   label:'Horse, no armor' },
  { id:'horse_barded', label:'Horse, barded' },
]);

export const armorIndex = (id) => ARMOR.findIndex(a => a.id === id);
