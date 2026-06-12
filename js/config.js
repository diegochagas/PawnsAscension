var C = {
  W: 800, H: 450,
  GRAVITY: 0.58,
  MAX_FALL: 22,
  GROUND: 450,

  // Current world bounds (rooms can be larger than the canvas).
  // Survive mode resets these to W/H; Adventure sets them per room.
  ROOM_W: 800, ROOM_H: 450,

  // Player
  PW: 22, PH: 32,
  PSPD: 3.6,
  PJUMP: -13.2,
  PHP: 100,
  WAVE_HEAL: 30,

  // Sword / spear thrust
  ATK_DMG: 10,
  ATK_RANGE: 56,
  ATK_DUR: 14,    // frames hitbox is active
  ATK_CD: 26,     // frames between attacks
  ATK_KNOCKBACK: 4.5,

  // Dash (Survive: unlocked after wave 3 / Adventure: Tower form)
  DASH_V: 12,
  DASH_DUR: 11,
  DASH_CD: 68,
  DASH_IF: 15,    // invincibility frames

  // Spear (Survive: unlocked after wave 5 / Adventure: skill)
  SPEAR_V: 10,
  SPEAR_DMG: 18,
  SPEAR_W: 44, SPEAR_H: 7,
  SPEAR_MAX: 300, // max travel distance before stopping

  // Shield (Survive: unlocked after wave 6)
  SHIELD_BLOCK: 0.85,

  // Bishop magic (Adventure)
  MAGIC_V: 7,
  MAGIC_DMG: 14,
  MAGIC_R: 9,      // projectile radius
  MAGIC_CD: 55,
  MAGIC_MAX: 420,   // horizontal travel distance before the bolt fades

  // Heal prayer (Adventure, Bishop/Queen form)
  HEAL_AMOUNT: 25,
  HEAL_CD: 600,

  // Platform
  PLT_H: 14,

  // Enemy base stats
  ENEMY: {
    pawn:   { hp: 35,  spd: 1.4, dmg: 8,  ar: 40,  ac: 44, w: 20, h: 28 },
    knight: { hp: 95,  spd: 2.8, dmg: 13, ar: 52,  ac: 34, w: 24, h: 52 },
    bishop: { hp: 60,  spd: 1.6, dmg: 10, ar: 240, ac: 58, w: 20, h: 30 },
    tower:  { hp: 100, spd: 1.1, dmg: 9,  ar: 44,  ac: 50, w: 26, h: 34 },
    queen:  { hp: 175, spd: 2.2, dmg: 16, ar: 56,  ac: 26, w: 22, h: 34 },
    king:   { hp: 270, spd: 1.8, dmg: 18, ar: 56,  ac: 30, w: 30, h: 40 },
  },

  // Black Essence dropped per enemy type (Adventure)
  ESSENCE: {
    pawn: 5, knight: 12, bishop: 10, tower: 12, queen: 40, king: 100,
    corruptedMul: 2, bossMul: 5,
  },

  // Promotion costs at chapel altars (Adventure)
  FORM_COST: { tower: 30, knight: 40, bishop: 40, queen: 150 },

  // Form stat modifiers (Adventure)
  FORM: {
    pawn:   { spd: 1.0,  def: 1.0,  dmg: 1.0 },
    tower:  { spd: 0.85, def: 0.55, dmg: 1.15 },
    knight: { spd: 1.15, def: 1.0,  dmg: 1.0 },
    bishop: { spd: 1.0,  def: 1.0,  dmg: 0.9 },
    queen:  { spd: 1.1,  def: 0.7,  dmg: 1.2 },
  },

  // Skill costs (Adventure) — white path / dark path
  SKILL: {
    vigor:     { cost: 20, path: 'white' },
    spear:     { cost: 25, path: 'white' },
    calm:      { cost: 40, path: 'white' },
    destroyer: { cost: 30, path: 'dark' },
    hdash:     { cost: 30, path: 'dark' },
    dmagic:    { cost: 40, path: 'dark' },
  },

  // Wave definitions (Survive mode)
  WAVES: [
    { num: 1, enemies: [{type:'pawn',count:4}],  theme:'light' },
    { num: 2, enemies: [{type:'pawn',count:4}],  theme:'dark',  bard:true },
    { num: 3, enemies: [{type:'knight',count:1}],theme:'light', unlock:'dash' },
    { num: 4, enemies: [{type:'knight',count:1}],theme:'dark',  bard:true },
    { num: 5, enemies: [{type:'bishop',count:2}],theme:'light', unlock:'spear' },
    { num: 6, enemies: [{type:'tower', count:2}],theme:'dark',  bard:true, unlock:'shield' },
    { num: 7, enemies: [{type:'queen', count:1}],theme:'light' },
    { num: 8, enemies: [{type:'tower', count:2},{type:'king',count:1}], theme:'dark', bard:true },
  ],

  // Colors per theme
  THEME: {
    light: { bg:'#ffffff', fg:'#000000', plt:'#000000', pltStroke:'#222222', ui:'#000000', uiBg:'rgba(255,255,255,0.85)' },
    dark:  { bg:'#000000', fg:'#ffffff', plt:'#ffffff', pltStroke:'#cccccc', ui:'#ffffff', uiBg:'rgba(0,0,0,0.85)' },
    // Adventure: hand-scribbled ink on cream paper
    paper: { bg:'#f1ecd9', fg:'#211f17', plt:'#211f17', pltStroke:'#211f17', ui:'#211f17',
             uiBg:'rgba(241,236,217,0.88)', paper:'#f1ecd9', ink:'#211f17',
             white:'#fbf8ee', faded:'rgba(33,31,23,0.45)' },
  },

  // Hand-drawn font stack (Segoe Print ships with Windows; fallbacks for others)
  FONT_HAND: '"Segoe Print","Bradley Hand","Comic Sans MS",cursive',
};
