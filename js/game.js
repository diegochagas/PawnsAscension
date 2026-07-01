// ── IN CHECK — top-level state machine ───────────────────────────────────────
// MENU → Adventure (Metroidvania campaign) or Survive (the original wave mode)
(function() {
  var canvas = document.getElementById('gameCanvas');
  var ctx = canvas.getContext('2d');
  canvas.width  = C.W;
  canvas.height = C.H;

  var MODE = { MENU:'menu', ADVENTURE:'adventure', SURVIVE:'survive' };
  var mode = MODE.MENU;
  var menuCursor = 0;
  var frame = 0;

  function menuItems() {
    var items = [];
    if (Adventure.hasSave()) items.push('menu_continue');
    items.push('menu_new', 'menu_survive', 'menu_lang');
    return items;
  }

  // ── Main menu (gothic night before the castle) ──────────────────────────────
  function drawMenu() {
    var g = C.THEME.gothic;

    // Night sky
    var sky = ctx.createLinearGradient(0, 0, 0, C.H);
    sky.addColorStop(0, '#090718');
    sky.addColorStop(0.65, '#1e1540');
    sky.addColorStop(1, '#33245c');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, C.W, C.H);
    Draw.stars(ctx, C.W, C.H, frame, 7);
    Draw.moon(ctx, 42, 44, 18);

    // Distant castle on its hill
    ctx.fillStyle = '#171034';
    ctx.beginPath();
    ctx.moveTo(0, C.H - 90);
    ctx.quadraticCurveTo(C.W * 0.3, C.H - 150, C.W * 0.55, C.H - 140);
    ctx.quadraticCurveTo(C.W * 0.8, C.H - 132, C.W, C.H - 100);
    ctx.lineTo(C.W, C.H); ctx.lineTo(0, C.H);
    ctx.closePath(); ctx.fill();
    Draw.castleSilhouette(ctx, C.W * 0.62, C.H - 138, 0.62, '#171034', frame);

    // Foreground checkered floor strip
    var gy = C.H - 46;
    var floor = ctx.createLinearGradient(0, gy, 0, C.H);
    floor.addColorStop(0, '#2c2545'); floor.addColorStop(1, '#141021');
    ctx.fillStyle = floor;
    ctx.fillRect(0, gy, C.W, 46);
    for (var tx = 0; tx < C.W; tx += 28) {
      ctx.fillStyle = (tx / 28) % 2 === 0 ? 'rgba(217,208,184,0.85)' : 'rgba(20,16,33,0.9)';
      ctx.fillRect(tx, gy, 28, 8);
    }
    ctx.fillStyle = 'rgba(255,255,255,0.14)';
    ctx.fillRect(0, gy, C.W, 1.5);

    // Fog
    var fog = ctx.createLinearGradient(0, C.H * 0.6, 0, C.H);
    fog.addColorStop(0, 'rgba(0,0,0,0)');
    fog.addColorStop(1, 'rgba(120,100,200,0.10)');
    ctx.fillStyle = fog;
    ctx.fillRect(0, C.H * 0.6, C.W, C.H * 0.4);

    // Title with gold gradient
    ctx.save();
    ctx.font = 'bold 52px ' + C.FONT_GOTH;
    ctx.textAlign = 'center';
    try { ctx.letterSpacing = '4px'; } catch(e) {}
    ctx.shadowColor = 'rgba(0,0,0,0.9)';
    ctx.shadowOffsetY = 4; ctx.shadowBlur = 8;
    var gr = ctx.createLinearGradient(0, 50, 0, 108);
    gr.addColorStop(0, g.goldHi); gr.addColorStop(0.55, g.gold); gr.addColorStop(1, g.goldLo);
    ctx.fillStyle = gr;
    ctx.fillText(T('title'), C.W/2, 96);
    ctx.shadowColor = 'transparent';
    ctx.strokeStyle = 'rgba(20,12,4,0.6)';
    ctx.lineWidth = 1.4;
    ctx.strokeText(T('title'), C.W/2, 96);
    try { ctx.letterSpacing = '0px'; } catch(e) {}
    ctx.restore();

    // Divider + subtitle
    var dg = ctx.createLinearGradient(C.W/2 - 190, 0, C.W/2 + 190, 0);
    dg.addColorStop(0, 'rgba(201,164,76,0)'); dg.addColorStop(0.5, g.gold); dg.addColorStop(1, 'rgba(201,164,76,0)');
    ctx.strokeStyle = dg; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(C.W/2 - 190, 112); ctx.lineTo(C.W/2 + 190, 112); ctx.stroke();
    ctx.fillStyle = g.gold;
    ctx.save(); ctx.translate(C.W/2, 112); ctx.rotate(Math.PI/4); ctx.fillRect(-3, -3, 6, 6); ctx.restore();
    ctx.font = '13px ' + C.FONT_GOTH;
    ctx.textAlign = 'center';
    ctx.fillStyle = g.textDim;
    ctx.fillText(T('franchise') + ' — ' + T('subtitle'), C.W/2, 136);

    // Options
    var items = menuItems();
    items.forEach(function(k, i) {
      var sel = menuCursor === i;
      var y = 186 + i * 42;
      if (sel) {
        ctx.fillStyle = 'rgba(201,164,76,0.12)';
        ctx.fillRect(C.W/2 - 150, y - 22, 300, 32);
        ctx.fillStyle = g.gold;
        ctx.save(); ctx.translate(C.W/2 - 162, y - 6); ctx.rotate(Math.PI/4); ctx.fillRect(-3.4, -3.4, 6.8, 6.8); ctx.restore();
        ctx.save(); ctx.translate(C.W/2 + 162, y - 6); ctx.rotate(Math.PI/4); ctx.fillRect(-3.4, -3.4, 6.8, 6.8); ctx.restore();
      }
      ctx.font = (sel ? 'bold 20px ' : '16px ') + C.FONT_GOTH;
      try { ctx.letterSpacing = '2px'; } catch(e) {}
      ctx.fillStyle = sel ? g.goldHi : g.textDim;
      ctx.fillText(T(k), C.W/2, y);
      try { ctx.letterSpacing = '0px'; } catch(e) {}
    });

    ctx.font = '12px ' + C.FONT_BODY;
    ctx.fillStyle = g.textDim;
    ctx.fillText(T('menu_hint'), C.W/2, C.H - 58);
    ctx.textAlign = 'left';

    // Bonfire + bard by the right, hero on the left
    Draw.bonfire(ctx, C.W - 110, gy, null, null, frame);
    Draw.hero(ctx, 92, gy, 74, null, null, 1, false, false, 'pawn');
    // Torches flanking the title
    Draw.torch(ctx, 60, 190, frame, 1.3);
    Draw.torch(ctx, C.W - 60, 190, frame, 1.3);
  }

  function updateMenu(inp) {
    var items = menuItems();
    if (inp.upJustPressed)   { menuCursor = (menuCursor + items.length - 1) % items.length; Audio.quill(); }
    if (inp.downJustPressed) { menuCursor = (menuCursor + 1) % items.length; Audio.quill(); }
    if (menuCursor >= items.length) menuCursor = 0;
    if (inp.attackJustPressed) {
      var k = items[menuCursor];
      Audio.menuSelect();
      if (k === 'menu_continue')      { mode = MODE.ADVENTURE; Adventure.start(false); }
      else if (k === 'menu_new')      { mode = MODE.ADVENTURE; Adventure.start(true); }
      else if (k === 'menu_survive')  { mode = MODE.SURVIVE; Survive.start(); }
      else if (k === 'menu_lang')     { I18N.toggle(); }
    }
  }

  // ── Loop ────────────────────────────────────────────────────────────────────
  function update() {
    var inp = Input.get();
    Input.update();
    Audio.resume();
    frame++;

    if (mode === MODE.MENU) { updateMenu(inp); return; }
    if (mode === MODE.ADVENTURE) {
      if (Adventure.update(inp) === 'quit') { mode = MODE.MENU; menuCursor = 0; }
      return;
    }
    if (mode === MODE.SURVIVE) {
      if (Survive.update(inp) === 'quit') { mode = MODE.MENU; menuCursor = 0; }
    }
  }

  function draw() {
    ctx.clearRect(0, 0, C.W, C.H);
    if (mode === MODE.MENU)           drawMenu();
    else if (mode === MODE.ADVENTURE) Adventure.draw(ctx);
    else if (mode === MODE.SURVIVE)   Survive.draw(ctx);
  }

  function loop() {
    try {
      update();
      draw();
    } catch(e) {
      console.error('Game loop error:', e.message, e.stack);
    }
    setTimeout(loop, 16);
  }

  // Prevent scrolling on mobile
  document.addEventListener('touchmove', function(e){ e.preventDefault(); }, { passive: false });
  document.addEventListener('contextmenu', function(e){ e.preventDefault(); });

  setTimeout(loop, 16);

  // Debug exposure
  window._gameDebug = function() {
    return {
      mode: mode,
      adventure: mode === MODE.ADVENTURE ? Adventure.debug() : null,
      survive: mode === MODE.SURVIVE ? Survive.debug() : null,
    };
  };
  window._startAdventure = function(fresh) { mode = MODE.ADVENTURE; Adventure.start(!!fresh); };
  window._startSurvive  = function() { mode = MODE.SURVIVE; Survive.start(); };
})();
