# Pawn's Ascension

Pawn's Ascension is a chess-themed, single-player platform combat game that
runs entirely in the browser. You begin as a pawn, choose the black or white
side, and fight through eight increasingly difficult waves to defeat the
opposing king and ascend beyond the board.

The game uses a minimalist black-and-white presentation, with a unique
platform layout and alternating light/dark theme for every wave. It supports
both keyboard controls and the on-screen controller.

## How to Play

Defeat every enemy in a wave to advance. Enemies arrive one at a time and use
different tactics based on their chess piece:

- **Pawns** chase and attack at close range.
- **Knights** charge while mounted, then become slower when reduced below half
  health.
- **Bishops** keep their distance and throw returning spears.
- **Towers** raise shields to block attacks from the front.
- **The Queen** switches between melee, ranged, and defensive behavior.
- **The King** charges, throws spears, shields, and swaps positions with living
  towers.

Clearing a wave restores **30 HP**. New abilities are earned as you climb:

| Wave cleared | Ability | Effect |
| --- | --- | --- |
| 3 | Dash | Mount a horse and dash with temporary invincibility. The mount is unavailable below 50% HP and returns after healing to at least 50% HP. |
| 5 | Spear | Throw a ranged spear. Press the spear control again to retrieve it; it can also damage enemies while returning. |
| 6 | Shield | Hold the shield toward incoming attacks to greatly reduce damage and block enemy spears from the front. |

After waves **2, 4, and 6**, the bard offers to record your progress. Saving
stores the next wave, current HP, chosen side, and unlocked abilities in the
browser's local storage. If you are defeated, you can restart from the most
recent save point. Completing the final wave clears the save when you return to
the main menu.

## Controls

### Keyboard

| Action | Controls |
| --- | --- |
| Move left / right | `A` / `D` or `Left Arrow` / `Right Arrow` |
| Jump | `W`, `Up Arrow`, or `Space` |
| Sword attack / confirm menu choice | `Z` or `Enter` |
| Dash, after unlocking | `Shift` or `X` |
| Throw / retrieve spear, after unlocking | `Q` |
| Hold shield, after unlocking | `E` or `Down Arrow` |
| Pause / resume | `P` or `Escape` |
| Save at the bard | `S` |

On the side-selection menu, use left/right to choose black or white, then
confirm with attack or jump.

At the bard, select **Save** with left or jump, or select **Continue** with
right or shield. Confirm the selected option with `Z` or `Enter`. You can also
press `S` to save immediately or `Escape` to continue without saving.

### On-Screen Controller

The on-screen controller can be used with a mouse or touchscreen:

- D-pad left/right moves the pawn, and D-pad up jumps.
- **JUMP** also jumps.
- The sword button attacks and confirms menu choices.
- Dash, spear, and shield buttons become available when their abilities are
  unlocked.
- The center **II** button pauses and resumes the game.

## Running the Game

No build step or dependencies are required. Open `index.html` in a modern web
browser to play.

For the most reliable browser storage and audio behavior, serve the folder with
a simple local web server, for example:

```sh
python -m http.server 8000
```

Then open `http://localhost:8000`.

## Project Structure

- `index.html` defines the canvas and on-screen controller.
- `style.css` handles the responsive game and controller layout.
- `js/game.js` contains the main loop, game states, saving, and progression.
- `js/player.js`, `js/enemies.js`, and `js/physics.js` implement combat and
  movement.
- `js/wave.js`, `js/platforms.js`, and `js/config.js` define waves, arenas, and
  balance values.
- `js/draw.js`, `js/ui.js`, and `js/audio.js` provide rendering, interface, and
  synthesized sound effects.
