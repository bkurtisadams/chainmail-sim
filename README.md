# Chainmail Sim

Pure-ESM rules engine for Chainmail 3rd ed. (Gygax & Perren, 1975), plus self-contained HTML demos.

    node test/run-all.js          # 85 assertions across the five engines

Open anything in `demos/` directly in a browser - they are self-contained (`file://` works).

Design notes in `docs/DESIGN-chainmail-sim.md`.

`demos/chainmail-board.html` is the actively developed sim and self-tests on load (open the console for `tests OK`); its inline test block is canonical for board behavior. The `engine/`/`test/` tree is a frozen reference — see `docs/DESIGN-chainmail-sim.md`.
