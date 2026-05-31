# DESIGN — Chainmail HTML Sim

Browser-based simulator for **Chainmail, 3rd Edition** (Gygax & Perren, TSR 1975).
Standalone tool in the GCC mold: vanilla JS/ESM, SVG board, no framework, hostable at graycloak.net.

---

## 1. Scope

Chainmail is really several games stapled together. A full one-shot sim is too big, so the build is sliced. The core decision the doc commits to:

**Engine-first, board-second.** Encode every table as data, expose pure resolver functions, then layer a free-measurement battlefield on top. The resolver alone is immediately useful as a play aid for tabletop games, and it's the testable heart of everything else.

The other defensible reading — "an interactive battlefield with movable units" first — is deferred to Slice 5. If you'd rather lead with the board, the data + engine layers are still prerequisites, so the early slices don't change.

**In scope (eventual):** mass melee, mass missile, man-to-man melee + missile, fantasy combat, morale, jousting, wizards/spells, catapult/cannon, point-value army builder, free-placement board with inch measurement and facing arcs.

**Out of scope (for now):** multiplayer netcode, full siege geometry (walls/breeches/mines as spatial objects), campaign layer.

---

## 2. Source of Truth

The uploaded rulebook text + the clean appendix scans (A–E, Man-to-Man Melee, Individual Missiles) are canonical. The OCR has noise — encode from the **scans**, not the text dump. Known transcription artifacts to ignore: "Drone dice" → *prone dice*; "Hoblins" → *Goblins*; "Complexify" → *Complexity*; "laterial"/"dissapates" etc.

The rulebook explicitly says to follow "the *spirit* of the rules rather than the *letter*" and house-rule ambiguities. So: any adjudication the engine has to make that the rules don't pin down goes in a single `houseRules` config object, defaulted to the most faithful reading, never hard-coded.

### Discrepancies to resolve before locking data
- **Heavy Horse morale rating.** Table (p.15) lists HH = **8**; the worked melee example (p.15–16) uses **9** in its arithmetic. Engine should use the table value (8); flag the example as using 9.
- **Post-melee reaction bands (p.15).** As transcribed, `20–39 → back 2 moves` but `40–59 → back 1 move` — the movement *shrinks* as the difference grows, which reads inverted. The worked example (difference 52 → "back 1 move") matches the table *as written*, so encode it as written but verify against a clean original print.

---

## 3. Subsystem Inventory

| Subsystem | Source | Resolution | Complexity |
|---|---|---|---|
| Turn sequence (move/counter-move; simultaneous) | p.9 | sequencing only | low |
| Movement / terrain / facing / fatigue | p.9–11 | state + costs | med |
| Mass melee | Appendix A | N dice/man, kill on listed scores | med |
| Mass missile fire | p.11–12 | casualty table by #firing × armor | med |
| Catapult / cannon | p.12–14 | template / dowel geometry | high |
| Morale (post-melee, loss, charge) | p.15–18 | weighted-score comparison | high |
| Man-to-man melee | Appendix B (top) | 2d6 ≥ target; blow order; parry | high |
| Individual missile | Appendix B (bottom) | d6 vs range/armor band | med |
| Jousting | Appendix C | aim × defensive position matrix | low |
| Fantasy combat | Appendix E | 2d6 under/equal/over | low |
| Fantasy stats / abilities | Appendix D | data + ability flags | med |
| Wizards / spells | p.30–33 | per-spell effects, complexity table | high |
| Point-value army builder | p.27 | summation | low |

---

## 4. Architecture

```
data/        all tables as frozen JS objects — single source of truth, no logic
engine/      pure functions: (inputs, rng) -> outcome.  No DOM, no globals.
state/       battlefield model: units, figures, positions, facing, phase, fatigue
ui/          SVG board + resolver panels + reference viewer + combat log
rng.js       seeded PRNG (mulberry32) so every resolution is replayable/testable
```

Rules: `engine/` never touches `data/` mutably and never imports `ui/`. All randomness flows through an injected `rng` so tests are deterministic and the combat log can store a seed to replay any turn. Board is gridless — Chainmail measures freely in inches (1" = 10 yds, 1:20 figures, 1 turn ≈ 1 min), so the board uses an inch-based world coordinate system with a ruler/measure tool and facing arcs rather than a hex grid.

---

## 5. Data Model

### Combat Tables (Appendix A)
Encode "−N dice per M men, [scores] kills" directly:

```js
// combatTables[attacker][defender] = { dice, perMen, kills }
LightFoot:  { LightFoot:{dice:1,perMen:1,kills:[6]}, HeavyFoot:{dice:1,perMen:2,kills:[6]}, ... },
HeavyHorse: { LightFoot:{dice:4,perMen:1,kills:[5,6]}, HeavyFoot:{dice:3,perMen:1,kills:[5,6]},
              ArmoredFoot:{dice:2,perMen:1,kills:[5,6]}, ..., HeavyHorse:{dice:1,perMen:1,kills:[6]} },
```
Modifiers as flags, not baked into the table: pike/halberd `+1 die` (HF/AF only); flank = attack at next class up; rear = casualties with no return + flank bonus; impetus charge `+1 die`; standing horse returns at next-lower class (first round only). `perMen` > 1 needs a documented rounding rule in `houseRules` (default: accumulate fractional dice across the unit).

### Man-to-Man Melee (Appendix B top)
`melee[weaponClass][armorCol] = targetNumber` (roll 2d6 ≥ target). The leading 1–12 is the **weapon class**, reused for blow order and parry:
```js
// armorCols: noArmor, leather, shieldOnly, leather+shield, chain/banded/splint,
//            chain+shield, plate, plate+shield, horseNoArmor, horseBarded
weapons: [
  { n:1,  name:"Dagger",   row:[6,7,8,8,9,10,12,12,8,10] },
  { n:4,  name:"Sword",    row:[7,8,8,9,8,9,10,11,8,10] },
  { n:11, name:"Mtd Lance",row:[5,5,5,5,6,7,8,9,5,7] },
  // ... full grid in data file
]
```
Asterisked cells (Dagger/Sword/Spear/Pole-arms vs plate) = effective only if target dismounted & prone, kill on 7+. Blow order, parry, and multi-blow rules derive from weapon-class delta (p.25–26): defender weapon ≥2 classes higher strikes first; 4 classes lower → 2 blows/round; 8 lower → 3 blows; parry = −2 to attacker, etc.

### Individual Missile (Appendix B bottom)
`missile[weapon] = { range, byArmorClass:[ [close,med,max], ... ] }` where each entry is the score-or-better to kill. Encoding note: `0=10, 1=11, 2=12, / = cannot kill`. Cover subtracts from the die score; range thirds derived from `range`.

### Fantasy Combat (Appendix E)
`fantasy[attacker][defender] = targetNumber`, resolved 2d6:
```
roll <  target -> NO EFFECT
roll == target -> defender falls back 1 move
roll >  target -> defender killed
```
Flags: `*` may withdraw on a NO EFFECT result; `@` magic-users resolve at lesser values.

### Units & stats (Appendix D)
`troopTypes[type] = { move, road, charge, fly, missileRange, attackAs, defendAs, abilities:[...], morale, points }`. Fantasy abilities A–L/X become an enum set on the type (invisibility, see-in-dark, fly, paralyze-touch, immolate, regenerate, etc.).

---

## 6. Engine API (pure)

```js
rollDice(n, rng)                                  -> number[]
resolveMassMelee({attacker, defender, mods}, rng) -> { casualties, dice }
resolvePostMelee(sideA, sideB, rng)               -> { loser, reaction }   // p.15 algorithm
resolveLossMorale(unit, casualtyPct, rng)         -> stable | removed
resolveManToMan({atkWeapon, defArmor, mods}, rng) -> { blows:[...], kills }
resolveMissileIndiv({weapon, rangeBand, armor, cover}, rng) -> killed?
resolveFantasy(attacker, defender, rng)           -> 'none'|'fallback'|'killed'
resolveJoust(aimPoint, defensivePosition, rng)    -> 'M'|'G'|'B'|'U'|'H'|'I'
pointCost(army)                                   -> number
```

Each returns a structured result (not just a boolean) so the UI can render *why*, and the combat log can replay it from the seed.

---

## 7. Validation / Golden Tests

The rulebook ships worked examples — use them as fixtures:

- **Post-melee morale (p.15–16):** 10 Heavy Horse hit 20 Heavy Foot, kill 8, lose 2.
  HH score `(8−2)×die(3)=18`, `+ rating×survivors (9×8=72)` → 90.
  HF score `(12−8)=4 + 5×12=60` → 64. Diff 26, doubled (HH side <20 figures) → **52 → HF back 1 move, good order.**
  Encode with a fixed-seed `rng` returning the assumed die (3); assert "back 1 move". *(Note the rating-8-vs-9 discrepancy from §2 — pick one and pin the fixture to it.)*
- **Cannon dowel (p.14):** Heavy Field Gun, WHITE, roll 4 (straight), target 26"/8" deep → 2nd + 3rd white sections fall on it. Geometry test for the dowel resolver.
- **Fantasy combat spot-checks:** a few cells from Appendix E (e.g., Balrog vs Roc = 1−; Dragon vs Wizard = 2) to lock the under/equal/over semantics.

---

## 8. UI / UX

Two top-level modes sharing the same engine:

1. **Resolver** — form panels for each subsystem: pick attacker/defender (or weapon/armor), apply modifier checkboxes (flank, rear, charge, mounted, cover…), roll, read result + breakdown. Plus a read-only **Reference** view rendering every table from `data/`. This is the MVP and the standalone play aid.
2. **Battlefield** — SVG board, free placement of unit markers, inch ruler, facing arcs, terrain placed via the rulebook's card-draw system (p.10), turn-phase tracker for both move systems, charge lines, and a running combat log. Selecting two engaged units fires the matching resolver.

---

## 9. Build Slices

- **Slice 0 — Data.** Encode all tables from the scans. Freeze objects. No logic.
- **Slice 1 — RNG + man-to-man melee.** Self-contained; weapon-class blow order & parry. First playable resolver.
- **Slice 2 — Mass melee + post-melee morale + loss table.** Lock the p.15–16 golden test.
- **Slice 3 — Missile fire** (individual + mass) with cover/range bands.
- **Slice 4 — Fantasy combat** (Appendix E) + fantasy stat data (Appendix D).
- **Slice 5 — Battlefield board.** Placement, inch movement, facing, terrain cards, phase tracker, charge.
- **Slice 6 — Charge/instability morale checks**, fatigue, weather.
- **Slice 7 — Jousting** mini-game (Appendix C matrix).
- **Slice 8 — Wizards & spells** (missiles, spell list, complexity table).
- **Slice 9 — Catapult/cannon geometry**, point-value army builder, sieges.

---

## 10. Open Decisions

1. **Lead slice** — engine-first (this doc) vs. board-first. Default: engine-first.
2. **Fractional-dice rounding** for `perMen > 1` combat-table entries (accumulate vs round-per-figure).
3. **Persistence** — export/import army + board as JSON; localStorage for in-progress games, or IndexedDB if it grows (same call you made in GCC).
4. **Mass ↔ man-to-man unification** — keep them as separate resolvers (faithful) or build a shared figure model that scales 1:1 ↔ 1:20.
5. **Fantasy supplement** — bundled from Slice 4 or gated behind a toggle so historical-only games stay clean.
6. **Two reaction-band rows (§2)** — confirm against a clean original print before locking the morale data.

---

## 11. Tech Notes

Vanilla ESM, no build step required (optional Vite for dev). SVG for the board (consistent with GCC; gridless inch coords, not hex). `mulberry32` seeded PRNG. State as a plain object with structured-clone snapshots per turn for undo + replay. No external deps in the engine — keeps the golden tests pure and the whole thing droppable into a static host.

---

## Module status & testing (decision, 2026-05) — option 2: inline-first

`demos/chainmail-board.html` is the actively developed product and is **fully self-contained** (inlines its own RNG, data tables, and resolvers so it runs from `file://`). The modular `engine/` + `data/` + `test/` tree is now a **frozen reference**, not a must-sync source.

Why: the demos never imported the modules at runtime — the tree existed only to be unit-tested via `node test/run-all.js`, with each demo hand-copying the logic. In practice the board drifted *ahead* of the modules (fatigue in loss-morale/mass-melee, then the dragon-breath weapon) and the green module suite gave false confidence about code the board didn't actually run.

Resolution:
- The board's **inline self-test block** (the `(function tests(){…})()` IIFE at the end of the file) is the canonical test for board behavior. It runs on every page load and now covers the resolvers with a forced-dice RNG (`forDie(n)` makes `d6 → n`), not just geometry. Add a forced-dice assertion here whenever a resolver changes.
- The `engine/`/`test/` tree is kept as a reference and for potential reuse in other projects, but is **not** required to mirror board-only features. If the engine is ever promoted to a shared library, re-port the board-only logic (fatigue, dragon breath) up into it and add module tests at that time.
- Not chosen: a runtime ESM refactor (would break `file://`) or a build-time inliner (deferred; revisit only if a single source of truth becomes worth the infrastructure).

---

## Status & roadmap (2026-05-31, rev 2) — movement pillar shipped (8A–8F); fire/terrain next

This section supersedes the forward-looking slice plan in §9 where they differ. The
original Slice 0–4 (data, man-to-man, mass melee+morale, missile, fantasy) all landed,
the board (Slice 5) became the product, and development then continued on a long
combat-content track (slices numbered 6x / 7x, with a running `vMAJOR.MINOR.PATCH`
stamp). The **movement pillar** then shipped as slices 8A–8F. **Current version: v0.10.5.**
Jousting / catapult / wizards (old §9 slices 7–9) remain unbuilt.

### What the sim *is* (identity)
A **combat resolver + play-aid on a freeform SVG battlefield.** The combat math
(melee, missile, morale, fantasy combat, creature abilities) is the strong, heavily
tested core. The wargame *structure* around it now exists as the **movement pillar**:
an optional move/counter-move phase sequence plus move-allowance / facing / charge
accounting, all defaulting to **advisory** so the freeform play-aid still works.
**Terrain** is the one structural pillar still deferred. You can still place and drag
units freely; the sim resolves what happens when they fight — and now also tracks how
far and when they move.

### Implemented and working (v0.10.5)
- **Mass melee** (Appendix A): flank/rear, impetus charge, pike/halberd, standing-horse,
  wrap-around (round 2+), fatigue, cavalry-charge morale. Asymmetric attack/defend
  classes via `defendType`; Giant bonus die via `bonusDice`.
- **Mass missile** (p.11–12): front-two-ranks firing, cover, indirect (range −⅓, armor
  bump), armor groups; rate-of-fire (once/turn, archers-that-held twice, crossbow/arquebus
  every-other-turn); arc-of-fire (foot 45°, horse Parthian 180°+45°); thrown weapons.
- **Man-to-man** melee (Appendix B top) with weapon-class blow order + parry; **individual
  missile** (Appendix B bottom).
- **Fantasy combat** (Appendix E) under/equal/over; **fantasy individuals** (13 types) with
  FIGHTING_STRENGTH, attack/defend classes, missile/melee immunity, dragon breath
  (9″ cone, 3 breaths + rekindle).
- **Morale**: post-melee reaction bands, loss-morale (with fatigue), charge morale.
- **Fantasy races** (8 mass types — orc/goblin/kobold/dwarf/gnome/elf/hobbit/sprite) with
  Appendix-D classes (incl. asymmetric HF-atk/LF-def), move, armor, **size tiers**.
- **Size model**: individuals' footprint scales with size (tiny→huge); mass figures render
  scaled but frontage stays fixed (Chainmail ground scale). `sizeOf`/`sizeScale`/`SIZE_BY_TYPE`.
- **Race specials**: sprite first-round melee immunity, hobbit ×1.5 sling, dwarf/gnome
  half-kills vs troll/ogre/giant, elf magic-weapon bonus dice (+3 goblin/+2 orc/+1 normal).
- **Status/touch system**: **figure-level paralysis** (conditions layer; `activeCount` vs
  body count so frozen figures don't swing but stay killable) — Wight melee-touch (1 turn,
  auto), Wraith touch (until freed, manual), free via friendly Elf/Hero/Wizard ≤1″, badge +
  pane + button/resolver/drag guards, endRound auto-release, Restore clears. **Balrog
  immolation** keyed off footprint geometry (`figuresWithinFootprint`, no arbitrary count),
  manual touch action.
- **Movement pillar (8A–8F, p.9–11/16)** — optional structure, advisory by default:
  - *Per-turn movement accounting* (8A): `movedThisTurn` accumulates drag/nudge distance vs
    `MOVE_ALLOWANCE`; drag ruler + pane show used/remaining; `enforceMovement` clamps drags.
  - *Facing-change costs* (8B, p.11): oblique ¼ / face ½ / about-face 1 move, ×2 poorly-trained
    (PE/LV), ×½ Swiss/horse, derived from net change vs `turnStartFacing`; shares the budget.
  - *Charge movement* (8C, p.16): `CHARGE_ALLOWANCE` (foot +3, horse +6, fantasy per App. D)
    becomes the budget while charged; cavalry held to ≤45° of facing; `chargedLastTurn` bars a
    back-to-back charge. Facing cost stays measured on the *normal* move.
  - *Move/counter-move phases* (8D, p.9): six-phase tracker (initiative → first move → counter
    move → artillery → missile → melee) with d6 initiative + winner-elects; `enforcePhases`
    gates movement/combat to the active phase. `activeSide` now derived (vestigial).
  - *Unit roster* (8E): per-side list above the log with M/F/X chips + move-left, click-to-
    select/centre, dim-when-spent, to-move highlight under enforcement.
  - *Snap-to-grid* (8F): optional 1″-grid snap on drag/nudge/spawn for clean move distances.

### Conventions (keep doing these)
- Single file `demos/chainmail-board.html`; everything inlined; must run from `file://`.
- Bump **four** version stamps together every slice: HTML comment (line 2), `<title>`
  (line ~6), `.version-tag` span, `const SIM_VERSION` — plus the `.sub` subtitle text.
- Each slice: `str_replace` on targeted strings → re-run the brace-balance + `new Function`
  syntax check → add forced-dice / pure-helper inline asserts → `present_files`. The inline
  `tests()` IIFE (forced-dice `always(n)`/`seq([...])`) is the canonical test; add an
  assertion whenever a resolver changes. (Asserts now ~147.)
- Do **not** use `sed` to write the line-2 comment if it contains `&` (sed eats it) — use a
  `python3` line rewrite.
- The modular `engine/`+`data/`+`test/` tree is a **frozen reference only** (inline-first
  decision, see prior section). The board is the source of truth.

### Decisions locked recently (so a new chat doesn't relitigate)
- **Size**: individual footprint = size; mass frontage is fixed (visual-only scaling).
- **Paralysis**: figure-level (per-figure freeze count), not unit-level.
- **Immolation**: footprint geometry decides the count (no fixed number); manual action,
  not auto-in-melee (avoids stacking on the Balrog's normal damage).
- **Daylight/see-in-dark**: carved OUT of race specials into a future *lighting* mini-system
  (needs a global day/night state + UI; see-in-dark is moot until normal troops take night
  penalties).
- **Elf magic weapons**: all elves assumed magic-armed for now; per-unit toggle waits for the
  magical-weapons feature. Elf-vs-fantastic Appendix-E scores deferred there too.

### Movement pillar — SHIPPED (8A–8F)
Built across slices 8A–8F (see *Implemented* above for the per-slice detail). Rulebook
reference was **p.9–11** (turn sequence, movement, facing) + charge **p.16**. Everything
defaults to advisory so the freeform play-aid is unchanged; `enforceMovement` and
`enforcePhases` opt into hard rules.

**Deliberately NOT built within the pillar** (so a new chat doesn't assume these exist):
- **Half-move pause point** — no mid-move stop. This is the missing prerequisite for
  split-move-and-fire and pass-through fire; build it before either.
- **Road bonus / uphill ½ / change-in-command** movement modifiers — only base move and
  charge allowance are wired.
- **Auto contact detection** — charge "only when contact expected" and the victorious-charger
  follow-through stay advisory/deferred; Wraith/Balrog touch is still manual.
- **Simultaneous-movement system** (p.9 alternative) — only move/counter-move is implemented.

### NEXT (now unblocked by the pillar)
Roughly smallest-first; the first three are the direct payoff the pillar was meant to enable.
- **Moved-over-½ → beat-foe's-die RoF clause** — fully unblocked now that `movedThisTurn`
  exists; the last missing rate-of-fire rule. Smallest tight slice.
- **Half-move pause point** — the enabling sub-feature for the two below (a mid-move stop in
  the move phase where fire can resolve).
- **Split-move-and-fire** (Elf ability C) + **pass-through fire** — once the half-move pause
  (and, for pass-through, range/contact detection) exist.
- **Contact detection during movement** → **auto move-touch** for Wraith paralysis and Balrog
  immolation (currently manual).
- **Terrain** — the big structural prize; movement costs are its foundation (hill slows ½ +
  no charge, woods/marsh, rough no-charge, river/stream crossings — p.9, plus the card-draw
  terrain setup p.10).

### Deferred backlog (after / alongside the NEXT items)
Lighting (daylight penalty + see-in-dark); magical weapons (elf-vs-fantastic Appendix-E
scores, the path for normal/Hero figures to hurt immune creatures, hero/fantastic flame
saves for immolation); Wizard spells (p.30–33); elemental subtypes (Air/Earth/Fire/Water);
remaining per-race specials (orc/goblin obedience die, dwarf anti-goblin compulsion,
terrain-based invisibility for hobbits/elves); jousting (Appendix C); catapult/cannon
geometry (p.12–14); sieges; point-value army builder (p.27).

### Files to include when starting the next chat
1. **`demos/chainmail-board.html`** — the working product (v0.10.5). THE file to edit.
   Upload the current local copy (`C:\chainmail-sim\demos\chainmail-board.html`); if unsure
   it's current, re-export from the running build first so a stale upload isn't clobbered.
2. **`Chainmail_3rd_Ed.pdf`** — the rulebook, for RAW reference. Terrain + turn sequence are
   **p.9–10**, rate-of-fire **p.11**. (The assistant extracts text with `pdftotext -layout`.)
3. **`proj/docs/DESIGN-chainmail-sim.md`** — this design doc (you're reading it).
4. *(Optional)* the full project zip — only needed if you want the frozen `engine/`/`test/`
   reference; the board is self-contained, so it's not required to make progress.

Opening ask for the next chat: *"The movement pillar (8A–8F) shipped. Pick up the now-unblocked
work — start tight with the moved-over-½ rate-of-fire clause, or begin the terrain pillar — per
the design doc."*
