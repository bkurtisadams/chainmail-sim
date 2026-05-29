// Wrap console.assert so suite exits non-zero on any failure.
const _assert = console.assert.bind(console);
let failures = 0;
console.assert = (cond, ...rest) => {
  if (!cond) { failures++; _assert(cond, ...rest); }
};

await import('./man-to-man.test.js');
await import('./mass-melee.test.js');
await import('./morale.test.js');
await import('./missile.test.js');
await import('./fantasy.test.js');

if (failures > 0) {
  console.error(`\n${failures} assertion(s) failed`);
  process.exit(1);
}
console.log('\nall tests OK');
