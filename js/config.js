// Game-wide constants: screen, tiles, physics, forms, enemies, bosses.
// Tuned so a single jump clears 5 tiles and a Knight double jump ~9 tiles;
// the room generator and the reachability test rely on these numbers.

export const VIEW_W = 480;
export const VIEW_H = 272;
export const TILE = 16;
export const CELL_W = 30; // tiles per map cell (one screen), like Super Metroid's map squares
export const CELL_H = 17;

export const PHYS = {
  gravity: 0.42,
  maxFall: 7.5,
  jumpV: -8.2,       // ~80 px = 5 tiles
  doubleJumpV: -7.4, // second jump adds ~65 px
  runSpeed: 2.1,
  accel: 0.35,
  friction: 0.3,
  coyoteFrames: 6,
};

export const REACH = { jumpTiles: 5, doubleJumpTiles: 9, ladderStep: 4, knightWall: 7 };

export const HERO = { w: 12, h: 28, slideH: 12, invuln: 60, baseHp: 80, baseMp: 30 };

// Promotions (SOTN-style transformations): each form owns a traversal power.
export const FORMS = {
  pawn:   { speed: 1.0,  atk: 1.0, def: 1.0, power: 'slide', reach: 30, cd: 18 },
  rook:   { speed: 0.85, atk: 1.4, def: 0.6, power: 'dash',  reach: 30, cd: 26 },
  knight: { speed: 1.15, atk: 1.1, def: 1.0, power: 'doubleJump', reach: 34, cd: 20 },
  bishop: { speed: 1.0,  atk: 0.9, def: 1.0, power: 'bolt',  reach: 26, cd: 22 },
  queen:  { speed: 1.15, atk: 1.6, def: 0.6, power: 'all',   reach: 38, cd: 18 },
};
export const FORM_ORDER = ['pawn', 'rook', 'knight', 'bishop', 'queen'];

export const POWER = {
  dash:  { speed: 5.2, frames: 14, cooldown: 30, mp: 0 },
  bolt:  { speed: 4.5, mp: 4, cooldown: 24, dmg: 14 },
  slide: { speed: 3.6, frames: 18 },
  spear: { speed: 6, mp: 3, cooldown: 30, dmg: 10 },
  pray:  { mp: 12, heal: 30, cooldown: 120 },
};

// Enemy stats. xp doubles as Black Essence (SOTN gold + experience in one).
export const ENEMIES = {
  pawn:    { hp: 18, atk: 8,  def: 1, xp: 6,  w: 14, h: 26, speed: 0.7, ai: 'walker' },
  knight:  { hp: 48, atk: 14, def: 3, xp: 20, w: 30, h: 34, speed: 2.2, ai: 'charger' },
  bishop:  { hp: 30, atk: 10, def: 2, xp: 16, w: 14, h: 30, speed: 0.4, ai: 'caster' },
  rook:    { hp: 70, atk: 16, def: 6, xp: 26, w: 22, h: 34, speed: 0.45, ai: 'walker' },
  bat:     { hp: 10, atk: 6,  def: 0, xp: 5,  w: 16, h: 12, speed: 1.1, ai: 'flyer' },
  wraith:  { hp: 22, atk: 9,  def: 1, xp: 12, w: 16, h: 22, speed: 0.6, ai: 'floater' },
  crawler: { hp: 14, atk: 7,  def: 4, xp: 7,  w: 16, h: 12, speed: 0.5, ai: 'crawler' },
  corrupt: { hp: 34, atk: 12, def: 2, xp: 18, w: 14, h: 26, speed: 0.5, ai: 'shooter' },
};

export const BOSSES = {
  captain:  { hp: 160, atk: 14, def: 2, xp: 120, w: 36, h: 64, moves: ['charge', 'leap'] },
  thorn:    { hp: 240, atk: 16, def: 3, xp: 200, w: 64, h: 70, moves: ['charge', 'thorns'] },
  ironrook: { hp: 340, atk: 20, def: 6, xp: 300, w: 56, h: 90, moves: ['leap', 'quake', 'spread'] },
  forge:    { hp: 380, atk: 22, def: 4, xp: 380, w: 44, h: 80, moves: ['spread', 'rain', 'summon'] },
  queen:    { hp: 460, atk: 24, def: 4, xp: 500, w: 36, h: 80, moves: ['teleport', 'spread', 'rain'] },
  king:     { hp: 700, atk: 28, def: 6, xp: 0,   w: 80, h: 110, moves: ['rain', 'summon', 'spread', 'quake'] },
};

export const LEVEL = { base: 40, growth: 1.35, hpPer: 8, mpPer: 3, atkPer: 1, defPer: 1, max: 50 };

export const SHARD_HP = 20; // Crown Shard = Super Metroid energy tank
export const CRYSTAL_MP = 10;
