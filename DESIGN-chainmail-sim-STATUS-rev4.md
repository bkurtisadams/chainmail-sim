## Status & roadmap (2026-06-04, rev 4) — combat / fantasy / siege / I-O pillars in; geometry-port & army-builder next

Replaces the rev-3 status block. **Current version: v0.11.64.** Since rev 3
(v0.11.23) the sim grew from "fire + siege pillar shipped" into a near-complete
Chainmail engine: man-to-man and mass melee with morale, the Fantasy Combat
Table and its specials, the full movement / turn-sequence system, missile fire
with rate-of-fire and gunpowder, mobile siege equipment, drawn terrain with
in-place editing, and a save/load + preset-map I/O layer.

> This rev is a **current-state reconciliation**, not a per-version changelog —
> the v0.11.24–v0.11.54 span is not itemised. It also corrects a notes mix-up:
> the `COMBAT-RAW-AUDIT.md` backlog (multi-segment surprise, monster `#AT`
> claw/claw/bite, two-weapon fighting) belongs to the **separate AD&D 1e
> `dungeon-encounter.html`** project, NOT this one. See the Scope note.

### Scope note — this is Chainmail, not AD&D 1e
- **No segments.** The turn is move / counter-move → artillery → missile →
  melee (p.9); initiative/surprise is a die roll, not a tenth-of-a-round track.
- Creatures resolve on the **Fantasy Combat Table** (`FANTASY_TARGETS`), not via
  `#AT` / claw-claw-bite.
- Man-to-man uses **weapon-class blow order** (p.25–26), not D&D two-weapon
  rules.
- Morale is Chainmail's **post-melee reaction + loss + cavalry-charge** system,
  already built — not an open "morale" gap.

### Shipped since rev 3 (by system)

- **Movement & turn sequence** — `PHASES` move / counter-move with an initiative
  roll and per-side phase gating (advisory or hard-enforced). Per-turn move
  budget with facing-change costs (oblique / face / about-face, discipline ×),
  charge allowance + straight-line ≤45° curve, road bonus, fatigue, half-move
  pause, split-move-and-fire (horse archers), pass-through fire, path-aware
  terrain cost.
- **Man-to-man melee (p.25–26)** — `WEAPONS_MTM` × `ARMOR_MTM`, blow order by
  weapon-class delta, multi-blow, parry + weapon-break, mounted / leader /
  rear / flank modifiers, prone kills. Jousting sub-mode (Appendix C, rev 3)
  retained.
- **Mass melee & morale** — `resolveMassMelee` (class matrix, polearm / impetus
  / flank / rear, fatigue, pikes), `resolvePostMelee` reaction table
  (`REACTION_BANDS`), `resolveLossMorale`, cavalry-charge check (p.17),
  prisoners. Auto-displacement on back / retreat / rout (`STATUS_MOVES`).
- **Fantasy Supplement** — `FANTASY_TARGETS` matrix + `resolveFantasyCombat`;
  fighting-strength mass interface; Wraith/Wight paralysis (timed and
  until-freed, friendly-free); Balrog immolation (footprint AoE); Dragon breath
  cone; Giant boulder-as-catapult; per-race attack/defend classes, Elf magic
  bonus, missile- and melee-immune sets.
- **Missile fire** — individual (Appendix B) + mass tables; rate of fire (held
  archers/longbows double, moved fires once, crossbows never double, heavy
  crossbow / arquebus every-other-turn); moved-over-½ opposed-die gate;
  first-two-ranks cap; indirect (range −⅓, +1 armour cat, woods-canopy block);
  cover (woods soft, mantlet hard); heavy-crossbow +1 to fire (p.12);
  **arquebus gunpowder table (p.13, ignores armour)**.
- **Siege / works (C.6–C.8)** — engines (light/heavy catapult, field guns,
  bombard) fire on the board with hit-area + scatter
  (`resolveCatapultAntipersonnel`) and structure battering; mobile equipment —
  ram battering + disable, siege-tower / ladder escalade with push-off and
  rock-drop, mantlet cover, abatis; fantastic battering & ignition. Structures
  are spatial defense-value pieces that edge-snap into forts and read BREACHED
  at 0.
- **Terrain** — area + drawn polyline (roads / rivers) features with move /
  charge / cover / crossing effects; full in-place editing (move, rotate,
  resize, vertex add/remove); directional hill slow; river-crossing action.
- **Board & I/O** — resizable playing area (24–600″, default **8×4 ft**);
  **Save / Load** full board to JSON (`saveScenario` / `loadScenario` +
  `hydrateUnit`); **built-in preset maps**; **edit-unit** (reconfigure a placed
  unit in place); undo / redo (action snapshots); unit roster; free-standing
  measure tool.
- **Geometry / UX** — one oriented **footprint-gap** basis (`footprintGapPx`)
  shared by melee contact (1″ mass / 3″ man), missile range, charge reach, and
  the 1″ touch check; half-square (15 ft) snap lattice; tunable facing-edge
  overlays (non-scaling stroke).

### Engine section map (before `/* === D. STATE */`)
C.5 Jousting · C.6 Artillery · C.7 Siege · C.8 Works. The inline `tests()` IIFE
asserts run on every load (Artillery → Siege → Works → Board-size → Structures →
Jousting → melee/contact → missile rate-of-fire → arquebus → "tests OK").

### Conventions (unchanged; keep doing these)
- Single file `demos/chainmail-board.html`, everything inlined, runs from
  `file://`.
- Bump **four version-number stamps** every slice (line-2 HTML comment,
  `<title>`, `.version-tag` span, `const SIM_VERSION`) **plus** the `.sub`
  subtitle description. Current head **v0.11.64**.
- Per slice: precise `str_replace` (never regex over the whole file) → extract
  the largest `<script>`, `node --check` + brace/paren/bracket balance 0 → run
  the new pure functions in an isolation harness with dice stubs → copy to
  outputs → present → classic imperative commit message stating the exact path
  `demos/chainmail-board.html`. Minimal inline comments. Never suggest
  hard-refresh (the user always hard-refreshes).
- Rules-fidelity from the Chainmail 3rd-ed PDF: read the relevant page before
  coding, paraphrase it in a comment, and call out faithful omissions /
  simplifications.

### NEXT — deferred threads (reconciled against v0.11.64)
1. ~~Mobile siege equipment~~ — **mostly shipped** (escalade, ram, ladders,
   mantlets, abatis, fantastic battering). Remaining: boiling-oil puddle and
   mine / breech as *spatial* effects — folds into #2.
2. **Blast / deviation geometry** — the catapult hit-area on the board is done;
   cannon **dowel lateral placement & deviation** (the 2-D projection) is still
   1-D / down-range only. Boiling-oil path + puddle and mine breech-as-terrain
   live here too.
3. ~~Arquebus into missile resolution~~ — **done (v0.11.64)**: arquebus fire
   routes through `resolveArquebus` (ignores armour, per-man accuracy die),
   ahead of the bow/thrown dispatch.
4. **DMG construction defaults** — structure dimensions are sensible-medieval
   seeds, not DMG figures; consider exposing `GROUND_SCALE_FT_PER_IN` as a
   setting for figure-scale forts.
5. **Point-value army builder (p.27)** — still open from the original backlog.
6. **Troop-bearing preset scenarios** + a **"fresh scenario" save variant**
   (hook left in `saveScenario`) — small I/O follow-ups.
7. **Toolbar reorg** — phase-status-left / board-tools-right regrouping
   (mocked, on hold).

### Files to include when starting the next chat
1. **`demos/chainmail-board.html`** — the working product (**v0.11.64**). THE
   file to edit.
2. This design doc (rev 4).
3. **`Chainmail_3rd_Ed.pdf`** — the rulebook; cite pages when coding rules.
4. Mockups (`chainmail_mockup.png`, `jousting_matrix.png`, toolbar before/after)
   — reference only.
