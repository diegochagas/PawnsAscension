# Pawn's Ascension

**Pawn's Ascension** (formerly _Pawn's Ascension_) is a chess-themed action game from
the **Eternal Boards** universe, designed with Alexandre Bezerra. It runs
entirely in the browser — no build step, no dependencies — and is presented in
a gothic, _Castlevania: Symphony of the Night_-inspired style: moonlit parallax
backdrops, ornate gold UI, and every character drawn as a cartoon chess piece
(the hero is a caped white pawn; the enemies are black pieces with glowing
red eyes).

It contains two modes:

- **Adventure** — a 2D action campaign across the six stages of the
  Chess Kingdom, selected from a castle map, with promotions, essence,
  bonfire save points and bosses.
- **Survive** — the original 8-wave arena game, kept as a secondary mode.

The interface is available in **English and Portuguese** (toggle on the main
menu).

## Adventure mode

You are a white pawn who awoke. Cross the Chess Kingdom and reach the Black
King:

1. **Pawns' Training Field** · 2. **Ambush Woods** · 3. **Iron Cliffs** ·
2. **Forge of the Black Pieces** · 5. **Abandoned Battlefield** ·
3. **Castle of Shadows**

Stages are chosen on the **castle map** — a chessboard path winding up to the
Black King's castle. Each stage ends in a boss; locked stages show chains and
a padlock until you clear the stage before them, and cleared stages are marked
with a gold crown. You can replay cleared stages to farm essence. Some
challenges still favor specific promotions (the Iron Cliffs boss hides behind
a wall only the **Knight's L-jump** clears).

### Essence and promotions

Defeated enemies drop **Black Essence**. Spend it at **chapel altars** to
unlock promotions, and switch between unlocked forms at any altar:

| Form         | Powers                                               |
| ------------ | ---------------------------------------------------- |
| Pawn         | Spear thrust (base form)                             |
| Tower (30◆)  | Destructive dash (Shift), hard defense               |
| Knight (40◆) | L-jump in mid-air (double jump), spinning attack     |
| Bishop (40◆) | Magic bolt thrown ahead (Q), healing prayer (E)      |
| Queen (150◆) | All of the above — requires Tower, Knight and Bishop |

Corrupted white pieces (drawn light with dark scribbles) appear from the
Forge onward and drop double essence; bosses drop five times as much.

### Abilities (skill trees)

Open **Abilities** from the pause menu. Two paths, per the original design:

- **Inherited Memories** (white): First Stand (+25 max HP), Spear Advance
  (throw/recall the spear), Still Healing (much faster standing-still
  regeneration).
- **Board Fragments** (dark): Destroyer Power (+50% damage), Heretic Dash
  (faster dash recharge), Shadow Magic (stronger magic). The dark path is
  remembered at the end…

### Healing

Stand still for about a second and the pawn slowly recovers health (a small
cross pulses above him while it works) — in any form, in both modes. The
Still Healing skill makes it kick in sooner and heal four times faster, and
the Bishop/Queen prayer (E) heals instantly on a cooldown.

### Bonfires

Rest at a bonfire (↓) where the skeleton bard plays: you heal fully and your
progress is saved (room, essence, forms, skills, opened gates). Enemies
respawn. If you are captured, you return to your last bonfire. The HUD's
flame icon shows how far the nearest bonfire is.

## Survive mode

The original game: choose black or white, fight eight waves, earn dash /
spear / shield along the way, and save with the bard between waves. See the
in-game prompts; it plays exactly as before.

## Controls

| Action                                        | Keyboard             |
| --------------------------------------------- | -------------------- |
| Move                                          | `A`/`D` or `←`/`→`   |
| Jump (and L-jump in air)                      | `W`, `↑`, or `Space` |
| Attack / confirm                              | `Z` or `Enter`       |
| Dash (Tower/Queen)                            | `Shift` or `X`       |
| Power: spear throw or magic                   | `Q`                  |
| Heal prayer (Bishop/Queen) / shield (Survive) | `E`                  |
| Interact (bonfire/altar)                      | `S` or `↓`           |
| Pause / back                                  | `P` or `Escape`      |

The on-screen controller mirrors these (D-pad, jump, attack, dash, power,
heal/shield, pause) and works with mouse or touch.

## Running the Game

Open `index.html` in a modern browser, or serve the folder:

```sh
python -m http.server 8000
```

Then open `http://localhost:8000`.

## Project Structure

- `index.html`, `style.css` — canvas + on-screen controller, gothic theme
  (Cinzel display font).
- `js/config.js` — balance values, forms, essence economy, gothic palette,
  per-zone ambience (`C.ZONE_ART`).
- `js/i18n.js` — EN/PT strings.
- `js/game.js` — top-level state machine (menu → Adventure / Survive).
- `js/adventure.js` — campaign controller: intro, castle stage map, HUD,
  altar/skills screens, saving, endings.
- `js/world.js`, `js/rooms.js`, `js/camera.js` — room engine, stage data
  (`Rooms.STAGES`), scrolling camera.
- `js/survive.js`, `js/wave.js`, `js/platforms.js` — the wave mode.
- `js/player.js`, `js/enemies.js`, `js/physics.js` — combat and movement.
- `js/draw.js`, `js/ui.js`, `js/audio.js` — cartoon chess-piece sprites,
  parallax zone paintings, ornate SOTN-style UI kit, Survive UI, synthesized
  sound.

## Design

The game follows the design developed in the WhatsApp group "Game Designer
Xadrez Metroidvania" (see `PLAN-V2.md`): title _Pawn's Ascension_, franchise
_Eternal Boards_, the Realmkeeper narrator, plague-doctor bishop, skeletal
bard at the bonfires, tally-mark health, and the dual skill tree
(_Memórias Herdadas_ / _Fragmentos do Tabuleiro_).
