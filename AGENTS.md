# AGENTS.md — Pawn's Ascension

Chess-themed metroidvania (Super Metroid map + Castlevania: SOTN combat feel).
Vanilla JS ES modules, no build step, no runtime dependencies. Art made with Higgsfield.

## Testing and shipping (dev-playbook)

This repo follows the dev-playbook (`~/.claude/skills/dev-playbook/PLAYBOOK.md`).

- One gate: `scripts/check` (node unit tests + clean-code audit). The pre-push hook runs it
  (`git config core.hooksPath .githooks`). Never push with `--no-verify`.
- E2E: `npm install` once, then `npx playwright test` (serves via `scripts/serve.py`).
  Screenshots land in `e2e/screenshots/` (gitignored) — attach them for UI changes.
- Bugs: write a failing regression test first, then fix. Never weaken or delete a test.
- Risk class: none (static game, saves only in the player's localStorage).
  Save format changes must bump `SAVE_VERSION` and keep a fixture test (tests/rules.test.mjs).
- World changes (js/world/map.js) must keep `tests/world.test.mjs` green: it proves every
  room's doors connect, gates block without their power, and the castle is completable in order.
- Before finishing: run `/code-review` on the diff, then give the evidence package.

## Clean code (dev-playbook CLEAN-CODE.md)

Language: vanilla JS ES modules (game), Python 3 (art tools). Default formatting.

- Functions 4–20 lines, files ≤300 lines. `scripts/clean-code-audit --strict` runs in `scripts/check`.
- Layout: `js/world/` (map data, room generation, reachability), `js/entities/` (hero, enemies,
  bosses, projectiles), `js/game/` (session, combat, props), `js/render/` (assets, level, HUD,
  screens, fx), `js/scenes/` (title, play, survive), `tools/` (Higgsfield art pipeline), `tests/`, `e2e/`.
- Pure logic (world, physics, stats, save, progress) never touches the DOM so node can test it.
- JSDoc `@param`/`@returns` on exported functions. Errors name the bad value and what was expected.
- Defensive code this repo needs: localStorage may be unavailable (wrap access, game runs unsaved);
  missing art must not block boot (loader resolves null). Flag anything else instead of adding it.

## Art pipeline

`art-src/` (gitignored, laptop only) holds the Higgsfield originals:
1. `tools/gen_art.py art-src/jobs/<batch>.json art-src/<dir>` — nano_banana_pro, 2 credits each,
   max 3 parallel (plan limit is 4 concurrent jobs), skips images that already exist.
   Characters are generated on flat magenta; pose sheets use the character image as reference.
2. `tools/build_assets.py` — keys magenta, slices pose/prop sheets (`tools/asset_specs.py` says which
   source becomes which sprite and at what height), packs `assets/chars.png` + `assets/props.png`
   + `assets/sprites.json`, and builds per-zone `zN_far/mid/tiles.png`.
Higgsfield's AutoSprite model failed on this art (job failed / never started), so animations are
pose sheets instead.
