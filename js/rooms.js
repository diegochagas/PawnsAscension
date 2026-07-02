// ── Adventure world data: 6 stages of the Chess Kingdom ─────────────────────
// Each stage (zone) is a self-contained run of rooms ending in a boss.
// Stages are entered from the castle map; beating the boss clears the stage
// and unlocks the next one. Room coords are world-space; the camera scrolls.
// Ground sits at room.h - 40.
var Rooms = (function() {

  var GH = 40; // ground thickness

  // Platform helper: [x, y, w, h]
  function p(x, y, w, h) { return { x:x, y:y, w:w, h:h||C.PLT_H }; }
  function ground(roomW, roomH) { return p(0, roomH - GH, roomW, GH); }

  // Enemy helper
  function en(type, x, opts) { return { type:type, x:x, opts:opts||{} }; }
  function corrupted(type, x) { return en(type, x, { corrupted:true }); }

  var R = {};

  // ════ Stage 1 — Pawns' Training Field ═══════════════════════════════════
  R.z1r1 = {
    id:'z1r1', zone:0, w:1400, h:450,
    plats:[ground(1400,450), p(380,310,150), p(640,250,150), p(960,310,170)],
    enemies:[en('pawn',700), en('pawn',1080)],
    bonfire:220,
    exits:{left:null, right:'z1r2'},
  };
  R.z1r2 = {
    id:'z1r2', zone:0, w:1600, h:450,
    plats:[ground(1600,450), p(260,320,140), p(520,260,160), p(820,320,140),
           p(1080,250,160), p(1340,320,140)],
    enemies:[en('pawn',400), en('pawn',760), en('pawn',1060), en('pawn',1380)],
    exits:{left:'z1r1', right:'z1b'},
  };
  R.z1b = {
    id:'z1b', zone:0, w:1100, h:450,
    plats:[ground(1100,450), p(180,300,140), p(780,300,140)],
    enemies:[],
    boss:{ type:'pawn', x:760, name:'boss_pawn',
           opts:{ scale:2.4, hpMul:6, dmgMul:1.6, boss:true } },
    exits:{left:'z1r2', right:null},
  };

  // ════ Stage 2 — Ambush Woods ════════════════════════════════════════════
  R.z2r1 = {
    id:'z2r1', zone:1, w:1700, h:450,
    plats:[ground(1700,450), p(300,320,120), p(540,260,120), p(800,320,160),
           p(1100,250,140), p(1380,320,150)],
    enemies:[en('pawn',500), en('pawn',900), en('bishop',1200), en('pawn',1500)],
    exits:{left:null, right:'z2r2'},
  };
  R.z2r2 = {
    id:'z2r2', zone:1, w:1300, h:450,
    plats:[ground(1300,450), p(420,300,160), p(760,250,160)],
    enemies:[en('pawn',1000)],
    bonfire:220, altar:640,
    exits:{left:'z2r1', right:'z2b'},
  };
  R.z2b = {
    id:'z2b', zone:1, w:1200, h:450,
    plats:[ground(1200,450), p(160,300,130), p(880,300,130)],
    enemies:[],
    boss:{ type:'knight', x:840, name:'boss_knight',
           opts:{ scale:1.5, hpMul:2.2, dmgMul:1.3, boss:true } },
    exits:{left:'z2r2', right:null},
  };

  // ════ Stage 3 — Iron Cliffs (vertical) ══════════════════════════════════
  R.z3r1 = {
    id:'z3r1', zone:2, w:1500, h:650,
    plats:[ground(1500,650), p(220,520,140), p(470,440,130), p(720,360,130),
           p(980,440,130), p(1240,520,140), p(600,250,160), p(900,200,150)],
    enemies:[en('bishop',740), en('bishop',1260), en('pawn',1000)],
    exits:{left:null, right:'z3r2'},
  };
  R.z3r2 = {
    id:'z3r2', zone:2, w:1300, h:650,
    plats:[ground(1300,650), p(330,500,150), p(660,420,160), p(980,500,150)],
    enemies:[en('tower',900)],
    bonfire:200, altar:660,
    exits:{left:'z3r1', right:'z3b'},
  };
  R.z3b = {
    id:'z3b', zone:2, w:1300, h:650,
    plats:[ground(1300,650), p(200,500,130), p(950,500,130),
           // L-jump wall: a single jump tops out ~150px up — only the Knight's
           // air jump (~277px) clears the opening above y=380
           p(640,380,40,230)],
    enemies:[],
    boss:{ type:'bishop', x:980, name:'boss_bishop',
           opts:{ scale:2, hpMul:4, dmgMul:1.5, boss:true } },
    exits:{left:'z3r2', right:null},
  };

  // ════ Stage 4 — Forge of the Black Pieces ═══════════════════════════════
  R.z4r1 = {
    id:'z4r1', zone:3, w:1600, h:450,
    plats:[ground(1600,450), p(300,310,140), p(600,250,150), p(940,310,150), p(1240,250,150)],
    enemies:[en('tower',520), corrupted('pawn',820), en('pawn',1060), corrupted('pawn',1340)],
    bonfire:170,
    exits:{left:null, right:'z4r2'},
  };
  R.z4r2 = {
    id:'z4r2', zone:3, w:1500, h:450,
    plats:[ground(1500,450), p(360,300,150), p(700,240,160), p(1060,300,150)],
    enemies:[corrupted('bishop',760), en('tower',1120), corrupted('pawn',440)],
    altar:200,
    exits:{left:'z4r1', right:'z4b'},
  };
  R.z4b = {
    id:'z4b', zone:3, w:1200, h:450,
    plats:[ground(1200,450), p(180,300,130), p(880,300,130)],
    enemies:[],
    boss:{ type:'tower', x:860, name:'boss_tower',
           opts:{ scale:1.9, hpMul:3, dmgMul:1.5, boss:true } },
    exits:{left:'z4r2', right:null},
  };

  // ════ Stage 5 — Abandoned Battlefield ═══════════════════════════════════
  R.z5r1 = {
    id:'z5r1', zone:4, w:1800, h:450,
    plats:[ground(1800,450), p(340,310,150), p(700,250,160), p(1080,310,150), p(1440,250,160)],
    enemies:[en('knight',600), corrupted('knight',1150), en('pawn',900), en('pawn',1550)],
    exits:{left:null, right:'z5r2'},
  };
  R.z5r2 = {
    id:'z5r2', zone:4, w:1400, h:450,
    plats:[ground(1400,450), p(420,300,160), p(820,250,160)],
    enemies:[corrupted('tower',1080)],
    bonfire:200, altar:640,
    exits:{left:'z5r1', right:'z5b'},
  };
  R.z5b = {
    id:'z5b', zone:4, w:1300, h:450,
    plats:[ground(1300,450), p(200,300,140), p(560,240,180), p(960,300,140)],
    enemies:[],
    boss:{ type:'queen', x:980, name:'boss_queen',
           opts:{ scale:1.6, hpMul:1.6, dmgMul:1.2, boss:true } },
    exits:{left:'z5r2', right:null},
  };

  // ════ Stage 6 — Castle of Shadows ═══════════════════════════════════════
  R.z6r1 = {
    id:'z6r1', zone:5, w:1500, h:450,
    plats:[ground(1500,450), p(300,310,140), p(640,250,160), p(1000,310,150)],
    enemies:[en('pawn',520), en('bishop',840), en('knight',1180)],
    bonfire:180,
    exits:{left:null, right:'z6r2'},
  };
  R.z6r2 = {
    id:'z6r2', zone:5, w:1600, h:450,
    plats:[ground(1600,450), p(280,300,150), p(620,240,160), p(980,300,150), p(1300,240,150)],
    enemies:[en('tower',500), corrupted('queen',900), en('tower',1300)],
    exits:{left:'z6r1', right:'z6b'},
  };
  R.z6b = {
    id:'z6b', zone:5, w:1300, h:450,
    plats:[ground(1300,450), p(180,300,140), p(520,240,260), p(960,300,140)],
    enemies:[en('tower',300), en('tower',1050)],
    boss:{ type:'king', x:680, name:'boss_king', final:true,
           opts:{ scale:1.7, hpMul:2, dmgMul:1.2, boss:true } },
    exits:{left:'z6r2', right:null},
  };

  var ORDER = ['z1r1','z1r2','z1b','z2r1','z2r2','z2b','z3r1','z3r2','z3b',
               'z4r1','z4r2','z4b','z5r1','z5r2','z5b','z6r1','z6r2','z6b'];

  var ZONE_KEYS = ['zone1','zone2','zone3','zone4','zone5','zone6'];
  var START = 'z1r1';

  // Castle-map stage nodes: start room, boss room, chamber position inside
  // the castle cross-section, and the emblem drawn in the chamber.
  var STAGES = [
    { zone:0, start:'z1r1', boss:'z1b', x:150, y:350, icon:'pawn'   },
    { zone:1, start:'z2r1', boss:'z2b', x:330, y:350, icon:'knight' },
    { zone:2, start:'z3r1', boss:'z3b', x:555, y:315, icon:'bishop' },
    { zone:3, start:'z4r1', boss:'z4b', x:610, y:225, icon:'rook'   },
    { zone:4, start:'z5r1', boss:'z5b', x:420, y:210, icon:'queen'  },
    { zone:5, start:'z6r1', boss:'z6b', x:400, y:155, icon:'king'   },
  ];

  function get(id) { return R[id]; }
  function all() { return R; }
  function stageOfRoom(id) { var r = R[id]; return r ? r.zone : 0; }

  return { get:get, all:all, ZONE_KEYS:ZONE_KEYS, START:START, ORDER:ORDER,
           STAGES:STAGES, stageOfRoom:stageOfRoom };
})();
