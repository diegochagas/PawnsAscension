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

  // ── Main menu (parchment style, per the concept mockups) ───────────────────
  function drawMenu() {
    var t = C.THEME.paper;
    ctx.fillStyle = t.paper;
    ctx.fillRect(0, 0, C.W, C.H);
    Draw.inkRect(ctx, 14, 12, C.W - 28, C.H - 24, t.ink, 3, false);

    // Title
    ctx.font = 'bold 58px ' + C.FONT_HAND;
    ctx.fillStyle = t.ink;
    ctx.textAlign = 'center';
    ctx.fillText(T('title'), C.W/2, 96);
    Draw.inkLine(ctx, C.W/2 - 150, 112, C.W/2 + 150, 112, t.ink, 3, 7);
    ctx.font = '15px ' + C.FONT_HAND;
    ctx.fillText(T('franchise') + ' — ' + T('subtitle'), C.W/2, 138);

    // Options
    var items = menuItems();
    items.forEach(function(k, i) {
      var sel = menuCursor === i;
      ctx.font = (sel ? 'bold 24px ' : '19px ') + C.FONT_HAND;
      ctx.fillStyle = sel ? t.ink : t.faded;
      ctx.fillText((sel ? '➤ ' : '') + T(k), C.W/2, 196 + i * 44);
    });

    ctx.font = '13px ' + C.FONT_HAND;
    ctx.fillStyle = t.faded;
    ctx.fillText(T('menu_hint'), C.W/2, C.H - 28);
    ctx.textAlign = 'left';

    // Bonfire + bard in the corner (per the menu concept art)
    Draw.bonfire(ctx, C.W - 110, C.H - 52, t.ink, t.paper, frame);
    // Hero standing on the left
    Draw.hero(ctx, 92, C.H - 52, 74, t.white, t.ink, 1, false, false, 'pawn');
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
