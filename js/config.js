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
    light: { bg:'#e9e2ce', fg:'#221c2e', plt:'#3a3450', pltStroke:'#221c2e', ui:'#221c2e', uiBg:'rgba(233,226,206,0.85)' },
    dark:  { bg:'#141021', fg:'#efe8d4', plt:'#3a3450', pltStroke:'#0b0814', ui:'#efe8d4', uiBg:'rgba(20,16,33,0.85)' },
  },

  // Gothic display font (Cinzel loaded via index.html, serif fallbacks)
  FONT_GOTH: '"Cinzel", "Trajan Pro", Georgia, "Times New Roman", serif',
  FONT_BODY: 'Georgia, "Palatino Linotype", "Times New Roman", serif',
};

// Symphony-of-the-Night gothic palette (Adventure mode)
C.THEME.gothic = {
  // Night & panels
  bg:      '#0d0b1c',
  panel:   'rgba(12,9,26,0.93)',
  panel2:  'rgba(28,22,52,0.92)',
  gold:    '#c9a44c',
  goldHi:  '#f2e2a6',
  goldLo:  '#77571e',
  text:    '#eee4c8',
  textDim: 'rgba(238,228,200,0.5)',
  blood:   '#c22738',
  bloodLo: '#5e0f1c',
  mana:    '#4f8fe8',
  manaLo:  '#16336e',
  arcane:  '#9a5cff',

  // Chess piece palettes
  ivory:   '#f4edda', ivoryHi:'#fffdf3', ivoryLo:'#c8ba93', ivoryDk:'#8d7f60',
  onyx:    '#332b47', onyxHi: '#5b4c7e', onyxLo: '#1a1428', onyxDk:'#0c0916',
  outline: '#0b0814',
  outlineW:'#352a1c',
  eye:     '#ff4545',
  eyeGlow: 'rgba(255,60,60,0.85)',

  // Legacy key aliases (older draw paths read these)
  paper:'#0d0b1c', ink:'#eee4c8', white:'#f4edda', faded:'rgba(238,228,200,0.5)',
  fg:'#eee4c8', plt:'#3a3450', pltStroke:'#1a1626',
  ui:'#eee4c8', uiBg:'rgba(12,9,26,0.85)',
};
// Everything that referenced the old paper theme now gets the gothic one.
C.THEME.paper = C.THEME.gothic;

// Hand-drawn font alias kept for legacy call sites — now maps to the gothic body font.
C.FONT_HAND = C.FONT_BODY;

// Per-zone ambience for parallax backgrounds (Adventure)
C.ZONE_ART = [
  // 0 — Pawns' Training Field: moonlit meadow before the castle
  { skyTop:'#12103a', skyBot:'#3d2f6e', horizon:'#57427f', far:'#221b4d', mid:'#1a1440',
    fog:'rgba(150,140,220,0.10)', accent:'#9db8ff', particles:'fireflies', moon:true, stars:true },
  // 1 — Ambush Woods: strangled dark forest
  { skyTop:'#081410', skyBot:'#14352a', horizon:'#1d4a37', far:'#0e2419', mid:'#0a1c12',
    fog:'rgba(110,190,140,0.13)', accent:'#7fe8ac', particles:'leaves', moon:true, stars:true },
  // 2 — Iron Cliffs: cold windswept crags
  { skyTop:'#0d1526', skyBot:'#31435f', horizon:'#4a5f80', far:'#1c2a44', mid:'#131e33',
    fog:'rgba(170,195,230,0.12)', accent:'#a8ccff', particles:'wind', moon:true, stars:true },
  // 3 — Forge of the Black Pieces: ember-lit industry
  { skyTop:'#1c0a0a', skyBot:'#572010', horizon:'#7e3512', far:'#301010', mid:'#230b0b',
    fog:'rgba(255,120,40,0.10)', accent:'#ffab4a', particles:'embers', moon:false, stars:false },
  // 4 — Abandoned Battlefield: bruised dusk over ruins
  { skyTop:'#170f22', skyBot:'#4a2440', horizon:'#6e3350', far:'#2a1834', mid:'#1e1126',
    fog:'rgba(200,120,160,0.10)', accent:'#e88ab0', particles:'ash', moon:true, stars:true },
  // 5 — Castle of Shadows: the great gothic halls
  { skyTop:'#0a0818', skyBot:'#241a44', horizon:'#332457', far:'#181037', mid:'#120b28',
    fog:'rgba(140,110,255,0.08)', accent:'#b09aff', particles:'dust', moon:false, stars:false },
];
