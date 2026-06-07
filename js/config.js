var C = {
  W: 800, H: 450,
  GRAVITY: 0.58,
  MAX_FALL: 22,
  GROUND: 450,

  // Player
  PW: 22, PH: 32,
  PSPD: 3.6,
  PJUMP: -13.2,
  PHP: 100,
  WAVE_HEAL: 30,

  // Sword
  ATK_DMG: 10,
  ATK_RANGE: 56,
  ATK_DUR: 14,    // frames hitbox is active
  ATK_CD: 26,     // frames between attacks
  ATK_KNOCKBACK: 4.5,

  // Dash (unlocked after wave 3)
  DASH_V: 12,
  DASH_DUR: 11,
  DASH_CD: 68,
  DASH_IF: 15,    // invincibility frames

  // Spear (unlocked after wave 5)
  SPEAR_V: 10,
  SPEAR_DMG: 18,
  SPEAR_W: 44, SPEAR_H: 7,
  SPEAR_MAX: 300, // max travel distance before stopping

  // Shield (unlocked after wave 6)
  SHIELD_BLOCK: 0.85,

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

  // Wave definitions
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
  },
};
