// ── Adventure mode (Metroidvania) controller ─────────────────────────────────
var Adventure = (function() {

  var ST = {
    INTRO: 'intro', PLAYING: 'playing', PAUSED: 'paused', MAP: 'map',
    SKILLS: 'skills', ALTAR: 'altar', GAMEOVER: 'gameover',
    ENDING_CHOICE: 'ending_choice', ENDING_TEXT: 'ending_text',
  };
  var SAVE_KEY = 'incheck_adventure';

  var state, player, world, cam;
  var introPage = 0;
  var pauseCursor = 0, altarCursor = 0, skillCursor = 0;
  var msgKey = null, msgTimer = 0;       // transient toast (saved / not enough essence…)
  var unlockBanner = null, unlockTimer = 0;
  var endingChoice = 0, endingPicked = 0, endingTimer = 0;
  var frame = 0;

  var FORM_LIST  = ['pawn', 'tower', 'knight', 'bishop', 'queen'];
  var FORM_GLYPH = { pawn:'♟', tower:'♜', knight:'♞', bishop:'♝', queen:'♛' };
  var SKILL_LIST = [ ['vigor','spear','calm'], ['destroyer','hdash','dmagic'] ]; // [white, dark]

  // ── Save / load ─────────────────────────────────────────────────────────────
  function hasSave() {
    try { return !!localStorage.getItem(SAVE_KEY); } catch(e) { return false; }
  }
  function clearSave() { try { localStorage.removeItem(SAVE_KEY); } catch(e) {} }

  function saveGame() {
    var data = {
      roomId: world.roomId,
      x: Math.round(player.x),
      maxHp: player.maxHp,
      essence: player.essence,
      form: player.form,
      forms: player.forms,
      skills: player.skills,
      brokenDoors: world.brokenDoors,
      bossesDead: world.bossesDead,
      visited: world.visited,
    };
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(data)); } catch(e) {}
  }
  function loadSave() {
    try { var s = localStorage.getItem(SAVE_KEY); return s ? JSON.parse(s) : null; } catch(e) { return null; }
  }

  function newPlayer() {
    var p = Player.create('#fbf8ee');
    p.adventure = true;
    return p;
  }

  function applyButtonUnlocks() {
    if (player.forms.tower || player.forms.queen) Input.unlockAbility('dash');
    if (player.forms.bishop || player.forms.queen || player.skills.spear) Input.unlockAbility('spear');
    if (player.forms.bishop || player.forms.queen) Input.unlockAbility('shield');
  }

  // ── Start ───────────────────────────────────────────────────────────────────
  function start(fresh) {
    player = newPlayer();
    world = World.create();
    cam = Camera.create();
    Input.lockAllAbilities();
    msgKey = null; msgTimer = 0; unlockBanner = null; unlockTimer = 0;
    pauseCursor = 0;

    var s = !fresh && loadSave();
    if (s) {
      player.maxHp = s.maxHp || C.PHP;
      player.hp = player.maxHp;
      player.essence = s.essence || 0;
      player.form = s.form || 'pawn';
      var k;
      for (k in s.forms)  player.forms[k]  = s.forms[k];
      for (k in s.skills) player.skills[k] = s.skills[k];
      for (k in s.brokenDoors) world.brokenDoors[k] = true;
      for (k in s.bossesDead)  world.bossesDead[k]  = true;
      for (k in s.visited)     world.visited[k]     = true;
      applyButtonUnlocks();
      World.loadRoom(world, player, s.roomId, s.x);
      Camera.snap(cam, player, world.room);
      state = ST.PLAYING;
    } else {
      clearSave();
      introPage = 0;
      state = ST.INTRO;
    }
  }

  function beginAtStart() {
    World.loadRoom(world, player, Rooms.START, 'spawn');
    Camera.snap(cam, player, world.room);
    state = ST.PLAYING;
  }

  function respawnAtLastSave() {
    var s = loadSave();
    if (s) start(false);
    else { player = newPlayer(); world = World.create(); cam = Camera.create(); beginAtStart(); }
  }

  function toast(key) { msgKey = key; msgTimer = 110; }

  // ── Update ──────────────────────────────────────────────────────────────────
  // Returns 'quit' to leave to the main menu.
  function update(inp) {
    frame++;

    if (state === ST.INTRO) {
      if (inp.attackJustPressed || inp.jumpJustPressed) {
        introPage++;
        Audio.quill();
        if (introPage >= 4) beginAtStart();
      }
      if (inp.pauseJustPressed) beginAtStart();
      return null;
    }

    if (state === ST.PLAYING) {
      if (inp.pauseJustPressed) { state = ST.PAUSED; pauseCursor = 0; return null; }

      var events = World.update(world, player);
      Player.update(player, inp, world.platforms,
        world.enemies.filter(function(e){ return !e.dead; }));
      Camera.follow(cam, player, world.room);

      if (player.dead) { state = ST.GAMEOVER; Audio.gameOver(); return null; }

      if (events.finalBossDied) {
        state = ST.ENDING_CHOICE; endingChoice = 0;
        Audio.victory();
        return null;
      }

      // Interactions
      if (inp.downJustPressed) {
        if (World.nearBonfire(world, player)) {
          Player.heal(player, player.maxHp);
          saveGame();
          World.loadRoom(world, player, world.roomId, world.room.bonfire - 44);
          Camera.snap(cam, player, world.room);
          toast('bonfire_rested');
          Audio.bonfireRest();
        } else if (World.nearAltar(world, player)) {
          state = ST.ALTAR;
          altarCursor = FORM_LIST.indexOf(player.form);
          Audio.altar();
        }
      }

      if (msgTimer > 0) msgTimer--;
      if (unlockTimer > 0) unlockTimer--;
      return null;
    }

    if (state === ST.PAUSED) {
      if (inp.upJustPressed)   { pauseCursor = (pauseCursor + 3) % 4; Audio.quill(); }
      if (inp.downJustPressed) { pauseCursor = (pauseCursor + 1) % 4; Audio.quill(); }
      if (inp.pauseJustPressed) { state = ST.PLAYING; return null; }
      if (inp.attackJustPressed) {
        Audio.menuSelect();
        if (pauseCursor === 0) state = ST.PLAYING;
        else if (pauseCursor === 1) state = ST.MAP;
        else if (pauseCursor === 2) { state = ST.SKILLS; skillCursor = 0; }
        else return 'quit';
      }
      return null;
    }

    if (state === ST.MAP) {
      if (inp.pauseJustPressed || inp.attackJustPressed) state = ST.PAUSED;
      return null;
    }

    if (state === ST.SKILLS) {
      var col = Math.floor(skillCursor / 3), row = skillCursor % 3;
      if (inp.leftJustPressed || inp.rightJustPressed) { col = 1 - col; Audio.quill(); }
      if (inp.upJustPressed)   { row = (row + 2) % 3; Audio.quill(); }
      if (inp.downJustPressed) { row = (row + 1) % 3; Audio.quill(); }
      skillCursor = col * 3 + row;
      if (inp.pauseJustPressed) { state = ST.PAUSED; return null; }
      if (inp.attackJustPressed) {
        var id = SKILL_LIST[col][row];
        var def = C.SKILL[id];
        if (player.skills[id]) { /* already learned */ }
        else if (player.essence >= def.cost) {
          player.essence -= def.cost;
          player.skills[id] = true;
          if (id === 'vigor') { player.maxHp += 25; player.hp += 25; }
          applyButtonUnlocks();
          Audio.save();
        } else { toast('not_enough'); Audio.shield(); }
      }
      if (msgTimer > 0) msgTimer--;
      return null;
    }

    if (state === ST.ALTAR) {
      if (inp.leftJustPressed)  { altarCursor = (altarCursor + FORM_LIST.length - 1) % FORM_LIST.length; Audio.quill(); }
      if (inp.rightJustPressed) { altarCursor = (altarCursor + 1) % FORM_LIST.length; Audio.quill(); }
      if (inp.pauseJustPressed) { state = ST.PLAYING; return null; }
      if (inp.attackJustPressed) {
        var f = FORM_LIST[altarCursor];
        if (player.forms[f]) {
          player.form = f;
          applyButtonUnlocks();
          Audio.menuSelect();
          state = ST.PLAYING;
        } else {
          var cost = C.FORM_COST[f];
          var queenLocked = f === 'queen' && !(player.forms.tower && player.forms.knight && player.forms.bishop);
          if (queenLocked) { toast('altar_locked_queen'); Audio.shield(); }
          else if (player.essence >= cost) {
            player.essence -= cost;
            player.forms[f] = true;
            player.form = f;
            applyButtonUnlocks();
            unlockBanner = f; unlockTimer = 130;
            Audio.altar();
            state = ST.PLAYING;
          } else { toast('not_enough'); Audio.shield(); }
        }
      }
      if (msgTimer > 0) msgTimer--;
      return null;
    }

    if (state === ST.GAMEOVER) {
      if (inp.attackJustPressed || inp.jumpJustPressed) respawnAtLastSave();
      return null;
    }

    if (state === ST.ENDING_CHOICE) {
      if (inp.leftJustPressed || inp.rightJustPressed) { endingChoice = 1 - endingChoice; Audio.quill(); }
      if (inp.attackJustPressed) {
        endingPicked = endingChoice;
        endingTimer = 0;
        state = ST.ENDING_TEXT;
        Audio.menuSelect();
      }
      return null;
    }

    if (state === ST.ENDING_TEXT) {
      endingTimer++;
      if (endingTimer > 120 && (inp.attackJustPressed || inp.jumpJustPressed)) {
        clearSave();
        return 'quit';
      }
      return null;
    }

    return null;
  }

  // ── Drawing helpers ─────────────────────────────────────────────────────────
  var t; // paper theme shortcut, set each draw

  function paperBg(ctx) {
    ctx.fillStyle = t.paper;
    ctx.fillRect(0, 0, C.W, C.H);
  }

  function handText(ctx, str, x, y, size, color, align) {
    ctx.font = (size >= 30 ? 'bold ' : '') + size + 'px ' + C.FONT_HAND;
    ctx.fillStyle = color || t.ink;
    ctx.textAlign = align || 'center';
    String(str).split('\n').forEach(function(line, i) {
      ctx.fillText(line, x, y + i * (size * 1.45));
    });
    ctx.textAlign = 'left';
  }

  function frameBorder(ctx) {
    Draw.inkRect(ctx, 14, 12, C.W - 28, C.H - 24, t.ink, 3, false);
  }

  function darkSkillCount() {
    return ['destroyer','hdash','dmagic'].reduce(function(n, k){ return n + (player.skills[k] ? 1 : 0); }, 0);
  }

  // ── HUD ─────────────────────────────────────────────────────────────────────
  function drawHUD(ctx) {
    // Health tally marks (top-left)
    Draw.tallyHealth(ctx, 30, 14, player.hp, player.maxHp, t.ink, t.faded);

    // Stamina circles: dash / power / heal
    var cy2 = 44;
    var dashMax = player.skills.hdash ? Math.round(C.DASH_CD*0.55) : C.DASH_CD;
    var canDash = player.form === 'tower' || player.form === 'queen';
    var canMagic = player.form === 'bishop' || player.form === 'queen';
    var canHeal = canMagic;
    Draw.staminaCircle(ctx, 30, cy2, 7, canDash ? 1 - player.dashCd / dashMax : 0, t.ink, t.faded);
    Draw.staminaCircle(ctx, 52, cy2, 7, canMagic ? 1 - player.magicCd / C.MAGIC_CD : (player.skills.spear || player.form==='queen' ? (player.spearOut ? 0.3 : 1) : 0), t.ink, t.faded);
    Draw.staminaCircle(ctx, 74, cy2, 7, canHeal ? 1 - player.healCd / C.HEAL_CD : 0, t.ink, t.faded);

    // Essence (top-right)
    Draw.essenceShard(ctx, C.W - 92, 22, 7, t.ink);
    handText(ctx, player.essence, C.W - 78, 28, 16, t.ink, 'left');

    // Bonfire distance (below essence)
    var d = World.bonfireDistance(world, player);
    handText(ctx, '⌂', C.W - 94, 52, 14, t.ink, 'left');
    Draw.inkLine(ctx, C.W - 96, 56, C.W - 88, 42, t.ink, 1.6, 3);   // little flame stroke
    handText(ctx, d, C.W - 78, 52, 14, t.ink, 'left');

    // Form icon (bottom-left)
    Draw.inkRect(ctx, 14, C.H - 50, 36, 36, t.ink, 5, false);
    ctx.font = '22px serif';
    ctx.fillStyle = t.ink; ctx.textAlign = 'center';
    ctx.fillText(FORM_GLYPH[player.form], 32, C.H - 23);
    ctx.textAlign = 'left';

    // Zone name banner
    if (world.zoneBannerTimer > 0) {
      var a = Math.min(1, world.zoneBannerTimer / 30);
      ctx.globalAlpha = a;
      handText(ctx, T(Rooms.ZONE_KEYS[world.room.zone]), C.W/2, 84, 24, t.ink);
      Draw.inkLine(ctx, C.W/2 - 130, 96, C.W/2 + 130, 96, t.ink, 2, 11);
      ctx.globalAlpha = 1;
    }

    // Boss bar
    var boss = null;
    for (var i = 0; i < world.enemies.length; i++)
      if (world.enemies[i].boss && !world.enemies[i].dead) { boss = world.enemies[i]; break; }
    if (boss) {
      var bw = 320;
      handText(ctx, T(world.room.boss.name), C.W/2, C.H - 36, 15, t.ink);
      Draw.inkRect(ctx, C.W/2 - bw/2, C.H - 28, bw, 10, t.ink, 7, false);
      ctx.fillStyle = t.ink;
      ctx.fillRect(C.W/2 - bw/2 + 2, C.H - 26, (bw - 4) * Math.max(0, boss.hp / boss.maxHp), 6);
    }
    if (world.bossAlert > 0 && boss) {
      ctx.globalAlpha = Math.min(1, world.bossAlert / 30);
      handText(ctx, T(world.room.boss.name), C.W/2, C.H/2 - 60, 30, t.ink);
      ctx.globalAlpha = 1;
    }

    // Interaction prompts
    if (World.nearBonfire(world, player)) handText(ctx, T('bonfire_prompt'), C.W/2, C.H - 64, 15, t.ink);
    else if (World.nearAltar(world, player)) handText(ctx, T('altar_prompt'), C.W/2, C.H - 64, 15, t.ink);

    // Door hints
    if (world.hintTimer > 0 && world.hintKey) {
      ctx.globalAlpha = Math.min(1, world.hintTimer / 25);
      handText(ctx, T(world.hintKey), C.W/2, 120, 15, t.ink);
      ctx.globalAlpha = 1;
    }

    // Toast
    if (msgTimer > 0 && msgKey) {
      ctx.globalAlpha = Math.min(1, msgTimer / 25);
      handText(ctx, T(msgKey), C.W/2, 146, 15, t.ink);
      ctx.globalAlpha = 1;
    }

    // Promotion banner
    if (unlockTimer > 0 && unlockBanner) {
      ctx.globalAlpha = Math.min(1, unlockTimer / 30);
      handText(ctx, T('unlock_banner'), C.W/2, C.H/2 - 70, 26, t.ink);
      handText(ctx, FORM_GLYPH[unlockBanner] + '  ' + T('form_' + unlockBanner), C.W/2, C.H/2 - 34, 20, t.ink);
      ctx.globalAlpha = 1;
    }
  }

  // ── Screens ─────────────────────────────────────────────────────────────────
  function drawIntro(ctx) {
    paperBg(ctx); frameBorder(ctx);
    var texts = ['intro1','intro2','intro3','intro4'];
    Draw.realmkeeper(ctx, C.W/2, 215, 120, t.ink, t.paper);
    handText(ctx, T(texts[Math.min(introPage,3)]), C.W/2, 280, 17, t.ink);
    handText(ctx, T('intro_skip'), C.W/2, C.H - 34, 13, t.faded);
    if (introPage === 0) handText(ctx, T('franchise'), C.W/2, 70, 26, t.ink);
  }

  function drawPauseMenu(ctx) {
    ctx.fillStyle = 'rgba(241,236,217,0.93)';
    ctx.fillRect(0, 0, C.W, C.H);
    frameBorder(ctx);
    handText(ctx, T('paused'), C.W/2, 86, 38, t.ink);
    Draw.inkLine(ctx, C.W/2 - 120, 100, C.W/2 + 120, 100, t.ink, 2.4, 21);
    var opts = ['pause_continue','pause_map','pause_skills','pause_quit'];
    opts.forEach(function(k, i) {
      var sel = pauseCursor === i;
      handText(ctx, (sel ? '➤ ' : '') + T(k), C.W/2, 160 + i*44, sel ? 23 : 19, sel ? t.ink : t.faded);
    });
    // Stats (per pause mockup): health + essence + form
    handText(ctx, '♥ ' + player.hp + '/' + player.maxHp, C.W - 130, 160, 15, t.ink, 'left');
    handText(ctx, '◆ ' + player.essence + ' ' + T('essence'), C.W - 130, 188, 15, t.ink, 'left');
    handText(ctx, FORM_GLYPH[player.form] + ' ' + T('form_' + player.form), C.W - 130, 216, 15, t.ink, 'left');
    Draw.hero(ctx, 110, 330, 90, t.white, t.ink, 1, false, false, player.form);
  }

  function drawMap(ctx) {
    paperBg(ctx); frameBorder(ctx);
    handText(ctx, T('map_title'), C.W/2, 56, 24, t.ink);

    var cellW = 92, cellH = 44, gapX = 26, gapY = 12;
    var x0 = C.W/2 - (cellW*3 + gapX*2)/2, y0 = 86;
    for (var z = 0; z < 6; z++) {
      handText(ctx, T(Rooms.ZONE_KEYS[z]), x0 - 12, y0 + z*(cellH+gapY) + cellH/2 + 5, 11, t.faded, 'right');
      for (var c = 0; c < 3; c++) {
        var id = Rooms.ORDER[z*3 + c];
        var room = Rooms.get(id);
        var x = x0 + c*(cellW+gapX), y = y0 + z*(cellH+gapY);
        var visited = world.visited[id];
        if (visited) {
          Draw.inkRect(ctx, x, y, cellW, cellH, t.ink, z*7+c, false);
          if (room.bonfire) handText(ctx, '🔥', x + 14, y + cellH - 12, 12, t.ink, 'left');
          if (room.altar)   handText(ctx, '✝', x + cellW - 22, y + cellH - 12, 12, t.ink, 'left');
          if (room.boss)    handText(ctx, world.bossesDead[id] ? '☠' : '♚', x + cellW/2 - 5, y + cellH - 12, 12, t.ink, 'left');
          if (id === world.roomId) {
            // Player marker
            ctx.fillStyle = t.ink;
            ctx.beginPath(); ctx.arc(x + cellW/2, y + 14, 5, 0, Math.PI*2); ctx.fill();
          }
        } else {
          ctx.globalAlpha = 0.22;
          Draw.inkRect(ctx, x, y, cellW, cellH, t.ink, z*7+c, false);
          ctx.globalAlpha = 1;
        }
        // Connector
        if (c < 2) Draw.inkLine(ctx, x + cellW, y + cellH/2, x + cellW + gapX, y + cellH/2, visited ? t.ink : t.faded, 1.6, z*3+c);
      }
    }
    handText(ctx, T('map_hint'), C.W/2, C.H - 22, 13, t.faded);
  }

  function drawSkills(ctx) {
    paperBg(ctx); frameBorder(ctx);
    handText(ctx, T('skills_title'), C.W/2, 50, 24, t.ink);
    Draw.essenceShard(ctx, C.W/2 - 36, 72, 6, t.ink);
    handText(ctx, player.essence + ' ' + T('essence'), C.W/2 + 6, 78, 14, t.ink);

    var colX = [C.W/4 + 10, 3*C.W/4 - 10];
    var heads = ['skills_white', 'skills_dark'];
    for (var colI = 0; colI < 2; colI++) {
      handText(ctx, T(heads[colI]), colX[colI], 112, 16, t.ink);
      Draw.inkLine(ctx, colX[colI] - 100, 122, colX[colI] + 100, 122, t.ink, 1.8, colI);
      for (var rowI = 0; rowI < 3; rowI++) {
        var id = SKILL_LIST[colI][rowI];
        var sel = skillCursor === colI*3 + rowI;
        var owned = player.skills[id];
        var y = 158 + rowI * 74;
        if (sel) Draw.inkRect(ctx, colX[colI] - 150, y - 22, 300, 62, t.ink, rowI*9+colI, false);
        handText(ctx, T('sk_' + id) + (owned ? '  ✓' : '   — ' + C.SKILL[id].cost + ' ◆'),
                 colX[colI], y, 16, owned ? t.faded : t.ink);
        handText(ctx, T('sk_' + id + '_desc'), colX[colI], y + 24, 12, t.faded);
      }
    }
    if (msgTimer > 0 && msgKey) handText(ctx, T(msgKey), C.W/2, C.H - 48, 14, t.ink);
    handText(ctx, T('skills_hint'), C.W/2, C.H - 22, 13, t.faded);
  }

  function drawAltar(ctx) {
    paperBg(ctx); frameBorder(ctx);
    handText(ctx, T('altar_title'), C.W/2, 56, 24, t.ink);
    Draw.essenceShard(ctx, C.W/2 - 36, 80, 6, t.ink);
    handText(ctx, player.essence + ' ' + T('essence'), C.W/2 + 6, 86, 14, t.ink);

    var boxW = 120, boxH = 130, gap = 18;
    var x0 = C.W/2 - (boxW*5 + gap*4)/2;
    FORM_LIST.forEach(function(f, i) {
      var x = x0 + i*(boxW+gap), y = 130;
      var sel = altarCursor === i;
      var owned = player.forms[f];
      if (sel) { ctx.fillStyle = 'rgba(33,31,23,0.07)'; ctx.fillRect(x, y, boxW, boxH); }
      ctx.globalAlpha = owned || sel ? 1 : 0.45;
      Draw.inkRect(ctx, x, y, boxW, boxH, t.ink, i*13, false);
      ctx.font = '40px serif'; ctx.fillStyle = t.ink; ctx.textAlign = 'center';
      ctx.fillText(FORM_GLYPH[f], x + boxW/2, y + 58);
      ctx.textAlign = 'left';
      handText(ctx, T('form_' + f), x + boxW/2, y + 86, 15, t.ink);
      if (player.form === f)      handText(ctx, T('altar_active'), x + boxW/2, y + 110, 11, t.ink);
      else if (owned)             handText(ctx, T('altar_take'), x + boxW/2, y + 110, 11, t.faded);
      else                        handText(ctx, C.FORM_COST[f] + ' ◆', x + boxW/2, y + 110, 12, t.ink);
      ctx.globalAlpha = 1;
    });

    handText(ctx, T('form_' + FORM_LIST[altarCursor] + '_desc'), C.W/2, 300, 15, t.ink);
    if (FORM_LIST[altarCursor] === 'queen' && !(player.forms.tower && player.forms.knight && player.forms.bishop))
      handText(ctx, T('altar_locked_queen'), C.W/2, 328, 13, t.faded);
    if (msgTimer > 0 && msgKey) handText(ctx, T(msgKey), C.W/2, 356, 14, t.ink);
    handText(ctx, T('altar_hint'), C.W/2, C.H - 22, 13, t.faded);
  }

  function drawGameOver(ctx) {
    drawWorld(ctx);
    ctx.fillStyle = 'rgba(33,31,23,0.78)';
    ctx.fillRect(0, 0, C.W, C.H);
    handText(ctx, T('gameover'), C.W/2, C.H/2 - 20, 40, t.paper);
    handText(ctx, T('gameover_hint'), C.W/2, C.H/2 + 30, 15, t.paper);
  }

  function drawEndingChoice(ctx) {
    paperBg(ctx); frameBorder(ctx);
    handText(ctx, T('ending_choice'), C.W/2, 90, 19, t.ink);
    var labels = ['ending_opt1','ending_opt2'];
    for (var i = 0; i < 2; i++) {
      var x = C.W/2 + (i === 0 ? -190 : 30), y = 190, w = 160, h = 110;
      var sel = endingChoice === i;
      if (sel) { ctx.fillStyle = 'rgba(33,31,23,0.07)'; ctx.fillRect(x, y, w, h); }
      ctx.globalAlpha = sel ? 1 : 0.5;
      Draw.inkRect(ctx, x, y, w, h, t.ink, i*17, false);
      ctx.font = '34px serif'; ctx.fillStyle = t.ink; ctx.textAlign = 'center';
      ctx.fillText(i === 0 ? '♔' : '✕', x + w/2, y + 56);
      ctx.textAlign = 'left';
      handText(ctx, T(labels[i]), x + w/2, y + 88, 13, t.ink);
      ctx.globalAlpha = 1;
    }
    handText(ctx, T('altar_hint'), C.W/2, C.H - 26, 13, t.faded);
  }

  function drawEndingText(ctx) {
    paperBg(ctx); frameBorder(ctx);
    var key = endingPicked === 0 ? 'ending1' : 'ending2';
    handText(ctx, T(key), C.W/2, 120, 17, t.ink);
    if (darkSkillCount() >= 2) handText(ctx, T('ending_dark'), C.W/2, 230, 14, t.faded);
    Draw.realmkeeper(ctx, C.W/2, 380, 90, t.ink, t.paper);
    if (endingTimer > 120) {
      handText(ctx, T('the_end'), C.W/2, 415, 22, t.ink);
      handText(ctx, T('ending_hint'), C.W/2, C.H - 14, 12, t.faded);
    }
  }

  function drawWorld(ctx) {
    paperBg(ctx);
    ctx.save();
    ctx.translate(-Math.round(cam.x), -Math.round(cam.y));
    World.draw(ctx, world, player);
    ctx.restore();
  }

  // ── Draw dispatcher ─────────────────────────────────────────────────────────
  function draw(ctx) {
    t = C.THEME.paper;
    if (state === ST.INTRO)         { drawIntro(ctx); return; }
    if (state === ST.PAUSED)        { drawWorld(ctx); drawPauseMenu(ctx); return; }
    if (state === ST.MAP)           { drawMap(ctx); return; }
    if (state === ST.SKILLS)        { drawSkills(ctx); return; }
    if (state === ST.ALTAR)         { drawAltar(ctx); return; }
    if (state === ST.GAMEOVER)      { drawGameOver(ctx); return; }
    if (state === ST.ENDING_CHOICE) { drawEndingChoice(ctx); return; }
    if (state === ST.ENDING_TEXT)   { drawEndingText(ctx); return; }
    // PLAYING
    drawWorld(ctx);
    drawHUD(ctx);
  }

  function debug() {
    return { state: state, room: world && world.roomId,
             hp: player && player.hp, essence: player && player.essence,
             form: player && player.form };
  }

  // Test access (used by automated checks; not part of gameplay)
  function _test() { return { player: player, world: world, cam: cam }; }
  function _goto(roomId, x) {
    World.loadRoom(world, player, roomId, x);
    Camera.snap(cam, player, world.room);
    state = ST.PLAYING;
  }

  return { start, update, draw, hasSave, debug, _test, _goto };
})();
