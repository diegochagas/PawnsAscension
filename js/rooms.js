// ── Adventure world data: 6 zones of the Chess Kingdom ──────────────────────
// Room coords are world-space; rooms are wider than the canvas and the camera
// scrolls. Ground sits at room.h - 40.
var Rooms = (function() {

  var GH = 40; // ground thickness

  // Platform helper: [x, y, w, h]
  function p(x, y, w, h) { return { x:x, y:y, w:w, h:h||C.PLT_H }; }
  function ground(roomW, roomH) { return p(0, roomH - GH, roomW, GH); }

  // Enemy helper
  function en(type, x, opts) { return { type:type, x:x, opts:opts||{} }; }
  function corrupted(type, x) { return en(type, x, { corrupted:true }); }

  var R = {};

  // ════ Zone 1 — Pawns' Training Field ════════════════════════════════════
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
    doors:[{ id:'z1exit', x:1060, y:450-GH-130, w:28, h:130, req:'boss' }],
    exits:{left:'z1r2', right:'z2r1'},
  };

  // ════ Zone 2 — Ambush Woods ═════════════════════════════════════════════
  R.z2r1 = {
    id:'z2r1', zone:1, w:1700, h:450,
    plats:[ground(1700,450), p(300,320,120), p(540,260,120), p(800,320,160),
           p(1100,250,140), p(1380,320,150)],
    enemies:[en('pawn',500), en('pawn',900), en('bishop',1200), en('pawn',1500)],
    exits:{left:'z1b', right:'z2r2'},
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
    doors:[{ id:'z2boss', x:1110, y:450-GH-130, w:26, h:130, req:'boss' },
           { id:'z2crack', x:1150, y:450-GH-130, w:34, h:130, req:'crack' }],
    exits:{left:'z2r2', right:'z3r1'},
  };

  // ════ Zone 3 — Iron Cliffs (vertical) ═══════════════════════════════════
  R.z3r1 = {
    id:'z3r1', zone:2, w:1500, h:650,
    plats:[ground(1500,650), p(220,520,140), p(470,440,130), p(720,360,130),
           p(980,440,130), p(1240,520,140), p(600,250,160), p(900,200,150)],
    enemies:[en('bishop',740), en('bishop',1260), en('pawn',1000)],
    exits:{left:'z2b', right:'z3r2'},
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
    doors:[{ id:'z3boss', x:1252, y:650-GH-140, w:26, h:140, req:'boss' }],
    exits:{left:'z3r2', right:'z4r1'},
  };

  // ════ Zone 4 — Forge of the Black Pieces ════════════════════════════════
  R.z4r1 = {
    id:'z4r1', zone:3, w:1600, h:450,
    plats:[ground(1600,450), p(300,310,140), p(600,250,150), p(940,310,150), p(1240,250,150)],
    enemies:[en('tower',520), corrupted('pawn',820), en('pawn',1060), corrupted('pawn',1340)],
    bonfire:170,
    exits:{left:'z3b', right:'z4r2'},
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
    doors:[{ id:'z4boss', x:1110, y:450-GH-130, w:26, h:130, req:'boss' },
           { id:'z4shade', x:1150, y:450-GH-130, w:34, h:130, req:'shade' }],
    exits:{left:'z4r2', right:'z5r1'},
  };

  // ════ Zone 5 — Abandoned Battlefield ════════════════════════════════════
  R.z5r1 = {
    id:'z5r1', zone:4, w:1800, h:450,
    plats:[ground(1800,450), p(340,310,150), p(700,250,160), p(1080,310,150), p(1440,250,160)],
    enemies:[en('knight',600), corrupted('knight',1150), en('pawn',900), en('pawn',1550)],
    exits:{left:'z4b', right:'z5r2'},
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
    doors:[{ id:'z5boss', x:1210, y:450-GH-130, w:26, h:130, req:'boss' },
           { id:'z5seal', x:1250, y:450-GH-130, w:34, h:130, req:'queen' }],
    exits:{left:'z5r2', right:'z6r1'},
  };

  // ════ Zone 6 — Castle of Shadows ════════════════════════════════════════
  R.z6r1 = {
    id:'z6r1', zone:5, w:1500, h:450,
    plats:[ground(1500,450), p(300,310,140), p(640,250,160), p(1000,310,150)],
    enemies:[en('pawn',520), en('bishop',840), en('knight',1180)],
    bonfire:180,
    exits:{left:'z5b', right:'z6r2'},
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

  // Map layout: column index of each room within its zone row
  var ORDER = ['z1r1','z1r2','z1b','z2r1','z2r2','z2b','z3r1','z3r2','z3b',
               'z4r1','z4r2','z4b','z5r1','z5r2','z5b','z6r1','z6r2','z6b'];
  ORDER.forEach(function(id) {
    var room = R[id];
    if (id.slice(2) === 'r1')      room.mapCol = 0;
    else if (id.slice(2) === 'r2') room.mapCol = 1;
    else                           room.mapCol = 2; // boss room
  });

  var ZONE_KEYS = ['zone1','zone2','zone3','zone4','zone5','zone6'];
  var START = 'z1r1';

  function get(id) { return R[id]; }
  function all() { return R; }

  return { get:get, all:all, ZONE_KEYS:ZONE_KEYS, START:START, ORDER:ORDER };
})();
