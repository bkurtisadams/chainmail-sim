// chainmail-weather.mjs · Optional battlefield weather (Chainmail p.21). Portable engine module.
// Run: node chainmail-weather.mjs
//
// The first die sets the prevailing condition (the column); thereafter, on even turns, roll a d6
// and read the cell under the current column. The original table's ARROWS (which column a changed
// condition moves to) were lost in the OCR, so the next-column mapping for Light/Hard rain is left
// for confirmation - WEATHER_TABLE encodes the printed cell text faithfully regardless.

export const WEATHER_INITIAL = { clear: [1, 2, 3], cloudy: [4, 5], rainy: [6] };

export const WEATHER_TABLE = {
  clear:  { 1: 'Excess heat', 2: 'No change',  3: 'No change', 4: 'No change', 5: 'No change', 6: 'Cloudy' },
  cloudy: { 1: 'No change',   2: 'No change',  3: 'Clears',    4: 'No change', 5: 'No change', 6: 'Rain' },
  rainy:  { 1: 'Light rain',  2: 'Light rain', 3: 'Cloudy',    4: 'Cloudy',    5: 'Hard rain', 6: 'Hard rain' },
};

export function initialWeather(die) {
  for (const [cond, faces] of Object.entries(WEATHER_INITIAL)) if (faces.includes(die)) return cond;
  return null;
}
export function weatherChange(current, die) {
  const col = WEATHER_TABLE[current];
  if (!col) throw new Error(`unknown weather column: ${current}`);
  return col[die];
}

// The sim-relevant battle effects: excess heat doubles fatigue + raises fire risk in dry
// grass/woods (summer only); three turns of hard rain brings mud, halving movement.
export const WEATHER_EFFECTS = {
  excessHeat:  { fatigueMult: 2, fireRiskDry: true, summerOnly: true },
  hardRainMud: { afterTurns: 3, moveMult: 0.5 },
};

function tests() {
  let pass = 0, total = 0;
  const ok = (cond, msg) => { total++; if (cond) pass++; else console.log('  XX ' + msg); };

  ok(initialWeather(2) === 'clear' && initialWeather(4) === 'cloudy' && initialWeather(6) === 'rainy', 'first die sets the condition');
  ok(weatherChange('clear', 1) === 'Excess heat' && weatherChange('clear', 6) === 'Cloudy', 'clear column');
  ok(weatherChange('cloudy', 3) === 'Clears' && weatherChange('cloudy', 6) === 'Rain', 'cloudy column');
  ok(weatherChange('rainy', 1) === 'Light rain' && weatherChange('rainy', 5) === 'Hard rain', 'rainy column');
  ok(WEATHER_EFFECTS.excessHeat.fatigueMult === 2 && WEATHER_EFFECTS.hardRainMud.moveMult === 0.5, 'battle effects: heat x2 fatigue, mud x0.5 move');
  { let threw = false; try { weatherChange('foggy', 1); } catch (e) { threw = true; } ok(threw, 'unknown column throws'); }

  console.log(`  ${pass}/${total} weather assertions`);
}
tests();
