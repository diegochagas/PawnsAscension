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
    light: { bg:'#f2edda', fg:'#1a1712', plt:'#57514a', pltStroke:'#1a1712', ui:'#1a1712', uiBg:'rgba(242,237,218,0.85)' },
    dark:  { bg:'#161410', fg:'#f2edda', plt:'#57514a', pltStroke:'#0c0b08', ui:'#f2edda', uiBg:'rgba(22,20,16,0.85)' },
  },

  // Gothic display font (Cinzel loaded via index.html, serif fallbacks)
  FONT_GOTH: '"Cinzel", "Trajan Pro", Georgia, "Times New Roman", serif',
  FONT_BODY: 'Georgia, "Palatino Linotype", "Times New Roman", serif',
};

// Monochrome ink-on-paper palette (whole game). Key names are kept from the
// earlier gothic palette so call sites keep working: "gold" now means ink
// ornament, "blood" means heavy ink, and so on.
C.THEME.gothic = {
  // Paper & panels
  bg:      '#f2edda',
  panel:   'rgba(246,242,228,0.96)',
  panel2:  'rgba(233,227,206,0.95)',
  gold:    '#1a1712',
  goldHi:  '#1a1712',
  goldLo:  '#57514a',
  text:    '#1a1712',
  textDim: 'rgba(26,23,18,0.52)',
  blood:   '#1a1712',
  bloodLo: '#57514a',
  mana:    '#8a8272',
  manaLo:  '#57514a',
  arcane:  '#3a352c',

  // Chess piece palettes
  ivory:   '#f7f3e4', ivoryHi:'#fffdf4', ivoryLo:'#cfc7ac', ivoryDk:'#968c6d',
  onyx:    '#26221b', onyxHi: '#4c463a', onyxLo: '#14110c', onyxDk:'#080705',
  outline: '#0c0a07',
  outlineW:'#2a2318',
  eye:     '#f7f3e4',
  eyeGlow: 'rgba(247,243,228,0.5)',

  // Legacy key aliases (older draw paths read these)
  paper:'#f2edda', ink:'#1a1712', white:'#f7f3e4', faded:'rgba(26,23,18,0.45)',
  fg:'#1a1712', plt:'#57514a', pltStroke:'#1a1712',
  ui:'#1a1712', uiBg:'rgba(242,237,218,0.88)',
};
// Everything that referenced the old paper theme now gets this one.
C.THEME.paper = C.THEME.gothic;

// Hand-drawn font alias kept for legacy call sites — now maps to the gothic body font.
C.FONT_HAND = C.FONT_BODY;

// Per-zone ambience for parallax backgrounds (Adventure). Everything is
// pencil-grayscale on paper; zones differ by silhouettes, tone and particles.
C.ZONE_ART = [
  // 0 — Pawns' Training Field: open meadow before the castle
  { skyTop:'#f5f0de', skyBot:'#ece6d0', horizon:'#ddd5bc', far:'#b3ab92', mid:'#847c64',
    fog:'rgba(26,23,18,0.05)', particles:'fireflies', moon:true, stars:true },
  // 1 — Ambush Woods: strangled forest, heavier tone
  { skyTop:'#efe9d5', skyBot:'#ded7bf', horizon:'#c7bfa4', far:'#9a9179', mid:'#5f5946',
    fog:'rgba(26,23,18,0.08)', particles:'leaves', moon:true, stars:false },
  // 2 — Iron Cliffs: pale windswept crags
  { skyTop:'#f5f0de', skyBot:'#e6dfc9', horizon:'#d2cab0', far:'#a49c83', mid:'#6e6753',
    fog:'rgba(26,23,18,0.05)', particles:'wind', moon:true, stars:true },
  // 3 — Forge of the Black Pieces: soot-dark industry
  { skyTop:'#e6dfc9', skyBot:'#cdc5aa', horizon:'#b3ab92', far:'#6e6753', mid:'#453f32',
    fog:'rgba(26,23,18,0.10)', particles:'embers', moon:false, stars:false },
  // 4 — Abandoned Battlefield: ashen ruin
  { skyTop:'#f0ead7', skyBot:'#dcd4bb', horizon:'#c2ba9f', far:'#948c73', mid:'#57514a',
    fog:'rgba(26,23,18,0.08)', particles:'ash', moon:true, stars:false },
  // 5 — Castle of Shadows: the dark halls
  { skyTop:'#e2dbc4', skyBot:'#c9c1a6', horizon:'#b3ab92', far:'#6e6753', mid:'#3a352c',
    fog:'rgba(26,23,18,0.10)', particles:'dust', moon:false, stars:false },
];
