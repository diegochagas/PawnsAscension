# Pawn's Ascension

A chess-themed **metroidvania** from the **Eternal Boards** universe, designed with
Alexandre Bezerra. One interconnected castle in the spirit of _Super Metroid_ (grid map,
ability-gated doors, backtracking, hidden upgrades) with the combat, stats and gothic
presentation of _Castlevania: Symphony of the Night_ (levels and EXP, damage numbers,
transformations, ornate HUD, save rooms with warps).

All sprites, bosses, backgrounds and terrain were generated with **Higgsfield** and turned
into game assets by the scripts in `tools/`. Runs in the browser, no build step. English and
Portuguese (toggle on the title screen or the PT/EN button).

## The story

The Black King has frozen the Chess Kingdom in an endless check. A forgotten pawn awakens
in the training field below the castle. Climb, earn your promotions, claim the five boss
seals and break the check of the Immobile King.

## The castle

40 rooms across six areas, each with its own art, enemies and boss:

| Area | Boss | Reward |
| --- | --- | --- |
| Pawns' Training Field | Pawn Captain | **Rook** promotion |
| Ambush Woods | Thorn Knight | **Knight** promotion, En Passant Boots (relic) |
| Iron Cliffs | Iron Rook | **Bishop** promotion |
| Forge of the Black Pieces | Forge Bishop | Crown Shard |
| Abandoned Battlefield | Black Queen | **Queen** promotion |
| Castle of Shadows | The Immobile King | the ending |

Doors are gated like Super Metroid's: cracked walls need the Rook dash, high walls and shafts
need the Knight double jump, crystal seals need the Bishop bolt, low tunnels need the Pawn's
slide, and the throne door opens only with all five boss seals. Crown Shards (+HP) and Mana
Crystals (+MP) are hidden off the main path.

### Promotions (switch any time with A / S, like SOTN's transformations)

| Form | Power (C) | Notes |
| --- | --- | --- |
| Pawn | Slide under low gaps (↓+X, needs the relic) | fastest attacks |
| Rook | Dash that breaks cracked walls | heavy hits, high defense, no knockback |
| Knight | Double jump | fast |
| Bishop | Diagonal + straight bolts (shatter crystal), ↑+C healing prayer | uses MP |
| Queen | Every power | strongest |

Enemies drop Black Essence, which is also experience: levels raise HP, MP, ATK and DEF.
Q throws a spear sub-weapon (MP). Bonfires with the skeleton bard heal, save and warp you
to any other bonfire you've lit.

**Survive mode** (title menu) keeps the original wave game: a sealed arena, every promotion,
endless waves and a boss every fifth wave.

## Changes from v0.5

The stage-select Adventure and the pencil-on-paper look were replaced by the connected
castle and Higgsfield pixel art. Not carried over (yet): the dual skill tree (Inherited
Memories / Board Fragments), the bonfire-distance flame icon, double essence from corrupted
pieces, and the Survive shield. Level-ups now play the role of the skill tree; the tree
could come back as SOTN-style relics.

## Controls

| Action | Keyboard | Touch |
| --- | --- | --- |
| Move | ← → | D-pad |
| Jump / double jump | X or Space | X |
| Attack | Z | Z |
| Form power | C | C |
| Spear sub-weapon | Q | Q |
| Switch form | A / S | ◁ ▷ |
| Drop through platform / slide | ↓ + X | ▼ + X |
| Interact (bonfire) | ↓ | ▼ |
| Pause (map / status) | Esc or P | II |

## Running

```sh
python3 scripts/serve.py 5500
```

Then open `http://localhost:5500`. (ES modules need a server; opening the file directly won't
work.) Test hooks: `?room=<id>` starts in a room, `?give=rook,knight,slide` grants items,
`?xp=500` sets experience, `?scene=survive` opens Survive.

## Architecture

```
art-src/ (Higgsfield originals, gitignored)
   │  tools/gen_art.py        batch generation (nano_banana_pro)
   │  tools/build_assets.py   key magenta, slice sheets, pack atlases
   ▼
assets/  chars.png props.png sprites.json zN_far/mid/tiles.png title.png
   │
js/main.js ── fixed 60 Hz loop ── scenes/{title, play, survive}
                                     │
          game/session.js  room, hero, enemies, shots, save data, camera
            ├─ world/map.js       rooms on a grid + gated links (the castle)
            ├─ world/roomgen.js   seeded tilemap per room (doors, ladders, gates)
            ├─ world/decor.js     platforms, pits, spawns, props
            ├─ entities/          hero, enemies (8 AIs), bosses (move sets), projectiles
            ├─ game/combat.js     hits, damage numbers, EXP, boss seals
            └─ game/props.js      bonfire save/warp, altars, chests
          render/  level (parallax + baked tiles), hud (SOTN bars + SM minimap), screens, fx
```

Pure modules (`world/*`, `physics`, `stats`, `save`, `progress`) have no DOM access; the
world tests run a tile-level reachability search over every generated room to prove each
door is reachable with exactly the powers its gate requires, and simulate a full
playthrough to prove the castle can be finished in order.

## Tests

```sh
scripts/check            # unit tests + clean-code audit (also the pre-push hook)
npm install && npx playwright test   # e2e + screenshots in e2e/screenshots/
```
