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

  // ── Main menu (pencil drawing: paper, ink castle, checkered floor) ──────────
  function drawMenu() {
    var g = C.THEME.gothic;

    // Paper sky
    var sky = ctx.createLinearGradient(0, 0, 0, C.H);
    sky.addColorStop(0, '#f5f0de');
    sky.addColorStop(1, '#e6dfc9');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, C.W, C.H);
    Draw.stars(ctx, C.W, C.H, frame, 7);
    Draw.hatchRect(ctx, 0, 0, C.W, C.H, 'rgba(26,23,18,0.04)', 9, 1);
    Draw.moon(ctx, 42, 44, 18);

    // Distant hatched castle on its hill (kept clear of the menu column)
    ctx.fillStyle = '#8a8272';
    ctx.beginPath();
    ctx.moveTo(0, C.H - 90);
    ctx.quadraticCurveTo(C.W * 0.3, C.H - 150, C.W * 0.55, C.H - 140);
    ctx.quadraticCurveTo(C.W * 0.8, C.H - 132, C.W, C.H - 100);
    ctx.lineTo(C.W, C.H); ctx.lineTo(0, C.H);
    ctx.closePath(); ctx.fill();
    Draw.castleSilhouette(ctx, C.W * 0.86, C.H - 128, 0.5, '#57514a', frame);

    // Foreground checkered floor strip
    var gy = C.H - 46;
    var floor = ctx.createLinearGradient(0, gy, 0, C.H);
    floor.addColorStop(0, '#9a9179'); floor.addColorStop(1, '#57514a');
    ctx.fillStyle = floor;
    ctx.fillRect(0, gy, C.W, 46);
    for (var tx = 0; tx < C.W; tx += 28) {
      ctx.fillStyle = (tx / 28) % 2 === 0 ? '#f2edda' : '#1a1712';
      ctx.fillRect(tx, gy, 28, 8);
    }
    ctx.strokeStyle = '#1a1712'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(0, gy + 0.5); ctx.lineTo(C.W, gy + 0.5); ctx.stroke();

    // Ink title
    ctx.save();
    ctx.font = 'bold 52px ' + C.FONT_GOTH;
    ctx.textAlign = 'center';
    try { ctx.letterSpacing = '4px'; } catch(e) {}
    ctx.shadowColor = 'rgba(26,23,18,0.3)';
    ctx.shadowOffsetY = 3; ctx.shadowBlur = 4;
    ctx.fillStyle = g.ink;
    ctx.fillText(T('title'), C.W/2, 96);
    try { ctx.letterSpacing = '0px'; } catch(e) {}
    ctx.restore();

    // Divider + subtitle
    var dg = ctx.createLinearGradient(C.W/2 - 190, 0, C.W/2 + 190, 0);
    dg.addColorStop(0, 'rgba(26,23,18,0)'); dg.addColorStop(0.5, g.ink); dg.addColorStop(1, 'rgba(26,23,18,0)');
    ctx.strokeStyle = dg; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(C.W/2 - 190, 112); ctx.lineTo(C.W/2 + 190, 112); ctx.stroke();
    ctx.fillStyle = g.ink;
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
        ctx.fillStyle = 'rgba(26,23,18,0.08)';
        ctx.fillRect(C.W/2 - 150, y - 22, 300, 32);
        ctx.fillStyle = g.ink;
        ctx.save(); ctx.translate(C.W/2 - 162, y - 6); ctx.rotate(Math.PI/4); ctx.fillRect(-3.4, -3.4, 6.8, 6.8); ctx.restore();
        ctx.save(); ctx.translate(C.W/2 + 162, y - 6); ctx.rotate(Math.PI/4); ctx.fillRect(-3.4, -3.4, 6.8, 6.8); ctx.restore();
      }
      ctx.font = (sel ? 'bold 20px ' : '16px ') + C.FONT_GOTH;
      try { ctx.letterSpacing = '2px'; } catch(e) {}
      ctx.fillStyle = sel ? g.ink : g.textDim;
      ctx.fillText(T(k), C.W/2, y);
      try { ctx.letterSpacing = '0px'; } catch(e) {}
    });

    ctx.font = '12px ' + C.FONT_BODY;
    ctx.fillStyle = g.textDim;
    ctx.fillText(T('menu_hint'), C.W/2, C.H - 58);
    ctx.textAlign = 'left';

    // Bonfire + bard by the right, hero on the left
    Draw.bonfire(ctx, C.W - 110, gy, null, null, frame);
    Draw.hero(ctx, 92, gy, 74, '#f7f3e4', null, 1, false, false, 'pawn');
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
