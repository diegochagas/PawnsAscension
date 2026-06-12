# Plan — PawnsAscension v2: "In Check"

Plan for evolving PawnsAscension from a wave-based arena game into the game
designed with Alexandre Bezerra in the WhatsApp group "Game Designer Xadrez
Metroidvania" (chat + ~110 concept images, April 2025–April 2026).

## 1. What the design conversation establishes

### Identity
- **Game title:** "In Check" (evolved from "Ascensão do Peão" → "The Final
  Move / Último Lance" → "Blood in Checkmate" → **"In Check"**, confirmed by
  the title/menu mockups).
- **Franchise name:** **Eternal Boards** (Diego's pick from the list). A
  hooded narrator figure, the **Realmkeeper**, presents the lore.
- **Lore intro:** the Chess Kingdom is one realm in a world of classic games —
  the world map art shows Chess Kingdom, Card Kingdom, Domino Kingdom and
  Draughts — leaving room for future games in the franchise.
- **Narrative timeline:** Fragile Peace → Silent Revolt → The First Promotion
  → The Black Forges → Shadow War → End of the Board (the player decides the
  world's future).

### Genre shift: arena → Metroidvania
- 2D Metroidvania with ability-gated progression across six zones:
  1. **Campo de Treinamento dos Peões** — tutorial, first fights
  2. **Bosque das Emboscadas** — hidden enemies, traps, secret paths
  3. **Penhascos de Ferro** — verticality, ranged enemies
  4. **A Forja das Peças Negras** — industrial zone, enemies are forged, bosses
  5. **Campo de Batalha Abandonado** — ruins, knights, echoes of the past
  6. **Castelo das Sombras** — final zone, the Immobile King and promoted pieces
- The dungeon-map concept art shows a castle cross-section maze of rooms —
  the structural reference for the world map screen.

### Visual style (locked by the concept art)
- Hand-scribbled black ink on cream paper (not pure white/black as in v1).
- Player pawn: white pawn with spear, **T-mark helmet and cross on the chest**.
- Enemies are solid-black scribbled silhouettes with white skull faces:
  - **Bishop** = plague doctor (beaked mask, lantern, crooked staff)
  - **King** = crowned skull wreathed in dark smoke/aura
  - **Queen** = tall cloaked silhouette with spiked crown, white eyes
  - **Tower** = armored figure with castle-turret head, tower-headed mace
  - **Knight** = black armored rider on horse
  - **Bard (save point)** = friendly skeleton in hood playing a lute by a bonfire
- Menus look hand-written on parchment; paper-unroll animation and
  quill-scratch sounds; bonfire + bard animating in the main-menu corner.

### Systems from the design docs
- **Save points:** bonfire + bard. HUD shows a flame icon with the distance
  to the nearest bonfire.
- **HUD:** health as tally marks, stamina as small refillable circles,
  equipped-ability icon (bottom corner), optional shaky-line minimap
  (top-right). Pause menu shows health / keys / play time.
- **Promotion system (core progression):** enemies drop **Black Essence
  fragments**; fragments unlock **promotions**: Tower (destructive dash,
  higher defense), Knight (L-jump through obstacles, spin attack), Bishop
  (diagonal magic, small heal on cooldown), Queen (all combined — endgame
  form). Forms are swapped at hidden **chapel altars**.
- **Dual skill tree** (from the "powers" mockups):
  - **Memórias Herdadas** (white path): first jump, spear thrust, spear combo,
    precise advance, cyclonic sword, heal while standing.
  - **Fragmentos do Tabuleiro** (dark path): heretic dash, shadow magic,
    destroyer power — corruption-flavored alternatives.
- **Enemy variety answers:**
  - **Corrupted white pieces** as enemies — rescue white pieces in dungeons,
    fight corrupted versions of them (including corrupted white bosses).
  - **Survive mode:** horde mode with waves, bosses, and even white pieces as
    enemies. *The current v1 game is essentially this mode already.*
- **Options:** volume, language (PT/EN), brightness, controls, vibration
  (mobile).

## 2. Strategy

Keep the v1 stack: vanilla JS, no build step, canvas, `localStorage`. Reuse
v1's combat, physics, and enemy AI — they survive almost intact. The big
change is structural: a room-based world with a camera replaces the single
fixed arena, and v1's wave loop is preserved as the unlockable **Survive
mode**.

## 3. Phases

### Phase 0 — Rebrand and paper look
- Rename in UI: title screen **IN CHECK**, splash "Eternal Boards presents",
  Realmkeeper silhouette on the lore card.
- New palette in `config.js`: cream paper background (`#f1edda`-ish), near-black
  ink, scribble/hatch fills instead of flat fills in `draw.js`.
- Main menu per mockup: Continuar / Novo Jogo / Opções / Sair, bonfire + bard
  in the corner, hand-drawn frame. Language toggle (PT/EN) via a small
  strings table (`js/i18n.js`).

### Phase 1 — World engine (the structural rewrite)
- New `js/world.js` + `js/camera.js`: rooms defined as data (platform list,
  exits, enemy spawns, props), side-scrolling camera, room transitions.
- Player physics (`physics.js`, `player.js`) reused as-is, plus spear keeps
  v1 behavior.
- Rooms authored in `js/rooms/zone1.js` etc. — start with Zone 1 (training
  field, ~6–8 rooms) as the vertical slice.

### Phase 2 — Metroidvania structure
- Ability gates: high ledges (knight L-jump), breakable walls (tower dash),
  diagonal-only passages (bishop magic), locked doors + keys.
- **Bonfire save points** with the bard: rest = heal + save (zone, room,
  position, essence, forms, skills) to `localStorage`; respawn at last bonfire
  on death.
- **Map screen** (pause → Mapa): hand-drawn room grid in the castle-maze
  style, revealing visited rooms, bonfire icons.
- HUD per mockup: tally-mark health, stamina circles, ability icon, bonfire
  distance.

### Phase 3 — Essence and promotions
- Black Essence drops from enemies (counter in HUD/pause).
- **Chapel altars**: swap active form. Forms: Pawn (spear, base), Tower
  (destructive dash, +defense), Knight (L-jump, spin attack), Bishop
  (diagonal projectile, heal on cooldown), Queen (all, unlocked near the end).
- Skill screen (pause → Habilidades) with the two trees: **Memórias
  Herdadas** (white skills) and **Fragmentos do Tabuleiro** (dark skills),
  bought with essence.

### Phase 4 — Enemies and bosses
- Reuse v1 AI: pawn (chase), knight (mounted charge), bishop (ranged —
  re-skin spear as plague-doctor magic), tower (shield), queen, king.
- New: **corrupted white pieces** (white silhouettes with dark scribble
  corruption) in rescue dungeons; corrupted white bosses.
- One boss per zone, ending with the **Immobile King** in the Castelo das
  Sombras (keeps v1's king moveset: charge, spear, shield, tower-swap).

### Phase 5 — Survive mode
- Port the v1 wave game (8 waves, bard saves between waves, side selection)
  behind a menu entry, unlocked after finishing Zone 1.
- Extend later with mixed hordes and white bosses as enemies, per the chat.

### Phase 6 — Story and polish
- Intro cutscene: Realmkeeper narration over the realms world-map art →
  timeline beats as parchment cards.
- Ending choice ("the player decides the future of the board").
- Audio: lute motif at bonfires, quill scratches in menus, paper-unroll
  pause animation (extend `audio.js` synth).
- Options screen: volume, language, brightness, controls.

## 4. Suggested file layout

```
js/
  config.js      — sizes, palette, balance (extended)
  i18n.js        — PT/EN strings                     (new)
  world.js       — rooms, transitions, gates         (new)
  camera.js      — scrolling camera                  (new)
  rooms/zoneN.js — room data per zone                (new)
  essence.js     — drops, promotions, skill trees    (new)
  bonfire.js     — save points, bard interaction     (new)
  survive.js     — v1 wave mode, repackaged          (moved from wave.js)
  player.js / physics.js / enemies.js — reused, extended per form
  draw.js        — scribble/paper rendering pass     (reworked)
  ui.js          — HUD, map screen, skill screen     (reworked)
  game.js        — state machine: menu/story/world/survive
```

## 5. Open questions for Alexandre
- Final title confirmation: "In Check" everywhere, or keep "Pawn's
  Ascension" as a subtitle (e.g., "In Check: Pawn's Ascension")?
- Does the player choose black/white side in the Metroidvania (v1 had side
  selection), or is the campaign always the white pawn (the design implies
  white-only, with black/white variety reserved for Survive mode)?
- Essence economy: rough costs per promotion/skill.
- Are the dark skills (Fragmentos do Tabuleiro) an alternate path with
  narrative consequences for the ending choice?
