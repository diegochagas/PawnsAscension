// ── Adventure mode controller ────────────────────────────────────────────────
// Flow: SIDE (choose white/black) → INTRO → STAGEMAP (castle cross-section) →
// stage → boss → STAGECLEAR → back to the map with the next stage unlocked.
var Adventure = (function() {

  var ST = {
    SIDE: 'side', INTRO: 'intro', STAGEMAP: 'stagemap', PLAYING: 'playing',
    PAUSED: 'paused', SKILLS: 'skills', ALTAR: 'altar', GAMEOVER: 'gameover',
    STAGECLEAR: 'stageclear', ENDING_CHOICE: 'ending_choice', ENDING_TEXT: 'ending_text',
  };
  var SAVE_KEY = 'incheck_adventure';
  var WHITE = '#f7f3e4', BLACK = '#14110c';

  var state, player, world, cam;
  var introPage = 0;
  var pauseCursor = 0, altarCursor = 0, skillCursor = 0, sideCursor = 0;
  var msgKey = null, msgTimer = 0;       // transient toast
  var unlockBanner = null, unlockTimer = 0;
  var endingChoice = 0, endingPicked = 0, endingTimer = 0;
  var frame = 0;

  // Stage map state
  var stagesCleared = {};   // zone idx -> true
  var mapCursor = 0;
  var mapShake = 0;         // "locked" feedback
  var clearTimer = 0, clearedZone = 0;
  var checkpoint = null;    // { roomId, x } — last bonfire rest

  var FORM_LIST  = ['pawn', 'tower', 'knight', 'bishop', 'queen'];
  var FORM_GLYPH = { pawn:'♟', tower:'♜', knight:'♞', bishop:'♝', queen:'♛' };
  var SKILL_LIST = [ ['vigor','spear','calm'], ['destroyer','hdash','dmagic'] ]; // [white, dark]

  function G() { return C.THEME.gothic; }

  // ── Save / load ─────────────────────────────────────────────────────────────
  function hasSave() {
    try { return !!localStorage.getItem(SAVE_KEY); } catch(e) { return false; }
  }
  function clearSave() { try { localStorage.removeItem(SAVE_KEY); } catch(e) {} }

  function saveGame() {
    var data = {
      v: 2,
      color: player.color,
      stagesCleared: stagesCleared,
      mapCursor: mapCursor,
      checkpoint: checkpoint,
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
    try {
      var s = localStorage.getItem(SAVE_KEY);
      if (!s) return null;
      var d = JSON.parse(s);
      if (!d.v) {
        // v1 migration: derive stage progress from dead bosses,
        // keep the old position as a checkpoint.
        d.stagesCleared = {};
        Rooms.STAGES.forEach(function(st) {
          if (d.bossesDead && d.bossesDead[st.boss]) d.stagesCleared[st.zone] = true;
        });
        d.checkpoint = d.roomId ? { roomId: d.roomId, x: d.x } : null;
        d.mapCursor = 0;
      }
      return d;
    } catch(e) { return null; }
  }

  function newPlayer() {
    var p = Player.create(WHITE);
    p.adventure = true;
    return p;
  }

  function setSide(color) {
    player.color = color;
    player.enemyColor = Draw.isDarkColor(color) ? WHITE : BLACK;
  }

  function applyButtonUnlocks() {
    if (player.forms.tower || player.forms.queen) Input.unlockAbility('dash');
    if (player.forms.bishop || player.forms.queen || player.skills.spear) Input.unlockAbility('spear');
    if (player.forms.bishop || player.forms.queen) Input.unlockAbility('shield');
  }

  function stageUnlocked(i) { return i === 0 || !!stagesCleared[i - 1]; }
  function highestUnlocked() {
    var h = 0;
    for (var i = 0; i < Rooms.STAGES.length; i++) if (stageUnlocked(i)) h = i;
    return h;
  }

  // ── Start ───────────────────────────────────────────────────────────────────
  function start(fresh) {
    player = newPlayer();
    world = World.create();
    cam = Camera.create();
    Input.lockAllAbilities();
    msgKey = null; msgTimer = 0; unlockBanner = null; unlockTimer = 0;
    pauseCursor = 0; stagesCleared = {}; checkpoint = null; mapCursor = 0;

    var s = !fresh && loadSave();
    if (s) {
      setSide(s.color || WHITE);
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
      for (k in s.stagesCleared) stagesCleared[k] = s.stagesCleared[k];
      checkpoint = s.checkpoint || null;
      mapCursor = Math.min(s.mapCursor != null ? s.mapCursor : highestUnlocked(), highestUnlocked());
      applyButtonUnlocks();
      state = ST.STAGEMAP;
    } else {
      clearSave();
      sideCursor = 0;
      introPage = 0;
      state = ST.SIDE;
    }
  }

  function enterStage(i) {
    var st = Rooms.STAGES[i];
    if (checkpoint && Rooms.stageOfRoom(checkpoint.roomId) === i) {
      World.loadRoom(world, player, checkpoint.roomId, checkpoint.x);
    } else {
      World.loadRoom(world, player, st.start, 'spawn');
    }
    world.lastZone = -1;           // re-show the stage banner
    world.zoneBannerTimer = 130;
    world.lastZone = world.room.zone;
    Camera.snap(cam, player, world.room);
    state = ST.PLAYING;
  }

  function respawnAtLastSave() {
    if (hasSave()) { start(false); return; }
    // No save yet: keep the chosen side, restart at the map
    var side = player ? player.color : WHITE;
    player = newPlayer();
    setSide(side);
    world = World.create();
    cam = Camera.create();
    state = ST.STAGEMAP;
  }

  function toast(key) { msgKey = key; msgTimer = 110; }

  // ── Update ──────────────────────────────────────────────────────────────────
  // Returns 'quit' to leave to the main menu.
  function update(inp) {
    frame++;

    if (state === ST.SIDE) {
      if (inp.leftJustPressed || inp.rightJustPressed) { sideCursor = 1 - sideCursor; Audio.quill(); }
      if (inp.attackJustPressed || inp.jumpJustPressed) {
        setSide(sideCursor === 0 ? WHITE : BLACK);
        Audio.menuSelect();
        introPage = 0;
        state = ST.INTRO;
      }
      if (inp.pauseJustPressed) return 'quit';
      return null;
    }

    if (state === ST.INTRO) {
      if (inp.attackJustPressed || inp.jumpJustPressed) {
        introPage++;
        Audio.quill();
        if (introPage >= 4) state = ST.STAGEMAP;
      }
      if (inp.pauseJustPressed) state = ST.STAGEMAP;
      return null;
    }

    if (state === ST.STAGEMAP) {
      if (mapShake > 0) mapShake--;
      if (msgTimer > 0) msgTimer--;
      if (inp.leftJustPressed)  { mapCursor = (mapCursor + Rooms.STAGES.length - 1) % Rooms.STAGES.length; Audio.quill(); }
      if (inp.rightJustPressed) { mapCursor = (mapCursor + 1) % Rooms.STAGES.length; Audio.quill(); }
      if (inp.attackJustPressed) {
        if (stageUnlocked(mapCursor)) {
          Audio.menuSelect();
          enterStage(mapCursor);
        } else {
          mapShake = 20;
          toast('stage_locked_hint');
          Audio.shield();
        }
      }
      if (inp.pauseJustPressed) return 'quit';
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
        stagesCleared[world.room.zone] = true;
        checkpoint = null;
        saveGame();
        state = ST.ENDING_CHOICE; endingChoice = 0;
        Audio.victory();
        return null;
      }
      if (events.stageCleared != null) {
        clearedZone = events.stageCleared;
        stagesCleared[clearedZone] = true;
        checkpoint = null;
        mapCursor = Math.min(clearedZone + 1, Rooms.STAGES.length - 1);
        saveGame();
        clearTimer = 0;
        state = ST.STAGECLEAR;
        Audio.victory();
        return null;
      }

      // Interactions
      if (inp.downJustPressed) {
        if (World.nearBonfire(world, player)) {
          Player.heal(player, player.maxHp);
          checkpoint = { roomId: world.roomId, x: Math.round(world.room.bonfire + 48) };
          saveGame();
          World.loadRoom(world, player, world.roomId, world.room.bonfire + 48);
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

    if (state === ST.STAGECLEAR) {
      clearTimer++;
      if (clearTimer > 70 && (inp.attackJustPressed || inp.jumpJustPressed || clearTimer > 320)) {
        state = ST.STAGEMAP;
      }
      return null;
    }

    if (state === ST.PAUSED) {
      if (inp.upJustPressed)   { pauseCursor = (pauseCursor + 3) % 4; Audio.quill(); }
      if (inp.downJustPressed) { pauseCursor = (pauseCursor + 1) % 4; Audio.quill(); }
      if (inp.pauseJustPressed) { state = ST.PLAYING; return null; }
      if (inp.attackJustPressed) {
        Audio.menuSelect();
        if (pauseCursor === 0) state = ST.PLAYING;
        else if (pauseCursor === 1) { state = ST.STAGEMAP; mapCursor = Math.min(world.room ? world.room.zone : 0, highestUnlocked()); }
        else if (pauseCursor === 2) { state = ST.SKILLS; skillCursor = 0; }
        else return 'quit';
      }
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

  function paperBg(ctx) {
    var sky = ctx.createLinearGradient(0, 0, 0, C.H);
    sky.addColorStop(0, '#f5f0de');
    sky.addColorStop(1, '#e8e2cc');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, C.W, C.H);
    Draw.stars(ctx, C.W, C.H, frame, 3);
  }

  // Ink text. opts: { font, spacing, weight, glow }
  function gtext(ctx, str, x, y, size, color, align, opts) {
    opts = opts || {};
    ctx.font = (opts.weight || (size >= 26 ? 'bold ' : '')) + size + 'px ' + (opts.font || C.FONT_GOTH);
    ctx.fillStyle = color || G().text;
    ctx.textAlign = align || 'center';
    if (opts.spacing !== undefined) { try { ctx.letterSpacing = opts.spacing + 'px'; } catch(e) {} }
    if (opts.glow) { ctx.save(); ctx.shadowColor = opts.glow; ctx.shadowBlur = 8; }
    String(str).split('\n').forEach(function(line, i) {
      ctx.fillText(line, x, y + i * (size * 1.5));
    });
    if (opts.glow) ctx.restore();
    try { ctx.letterSpacing = '0px'; } catch(e) {}
    ctx.textAlign = 'left';
  }

  // Big ink display title with a soft pencil shadow. opts.halo draws a paper
  // outline behind the letters so the title reads over dark artwork.
  function inkTitle(ctx, str, x, y, size, opts) {
    opts = opts || {};
    var g = G();
    ctx.save();
    ctx.font = 'bold ' + size + 'px ' + C.FONT_GOTH;
    ctx.textAlign = 'center';
    try { ctx.letterSpacing = (opts.spacing != null ? opts.spacing : 3) + 'px'; } catch(e) {}
    if (opts.halo) {
      ctx.strokeStyle = '#f2edda';
      ctx.lineWidth = Math.max(4, size * 0.16);
      ctx.lineJoin = 'round';
      ctx.strokeText(str, x, y);
    }
    ctx.shadowColor = 'rgba(26,23,18,0.3)';
    ctx.shadowOffsetY = 2; ctx.shadowBlur = 3;
    ctx.fillStyle = opts.color || g.ink;
    ctx.fillText(str, x, y);
    try { ctx.letterSpacing = '0px'; } catch(e) {}
    ctx.restore();
    ctx.textAlign = 'left';
  }

  // Ink divider with a center diamond
  function divider(ctx, cx, y, w) {
    var g = G();
    var gr = ctx.createLinearGradient(cx - w/2, 0, cx + w/2, 0);
    gr.addColorStop(0, 'rgba(26,23,18,0)');
    gr.addColorStop(0.5, g.ink);
    gr.addColorStop(1, 'rgba(26,23,18,0)');
    ctx.strokeStyle = gr; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(cx - w/2, y); ctx.lineTo(cx + w/2, y); ctx.stroke();
    ctx.fillStyle = g.ink;
    ctx.save(); ctx.translate(cx, y); ctx.rotate(Math.PI/4);
    ctx.fillRect(-3, -3, 6, 6);
    ctx.restore();
  }

  function darkSkillCount() {
    return ['destroyer','hdash','dmagic'].reduce(function(n, k){ return n + (player.skills[k] ? 1 : 0); }, 0);
  }

  // ── HUD ─────────────────────────────────────────────────────────────────────
  function drawHUD(ctx) {
    var g = G();

    // HP / MP bars
    Draw.barOrnate(ctx, 42, 14, 170, 12, player.hp / player.maxHp, '#26221b', '#0c0a07', 'HP');
    var canMagic = player.form === 'bishop' || player.form === 'queen';
    var mp = canMagic ? 1 - player.magicCd / C.MAGIC_CD
           : (player.skills.spear || player.form === 'queen' ? (player.spearOut ? 0.3 : 1) : 0);
    Draw.barOrnate(ctx, 42, 32, 120, 8, mp, '#8a8272', '#57514a', 'MP');
    ctx.font = '10px ' + C.FONT_BODY;
    ctx.fillStyle = g.textDim;
    ctx.fillText(player.hp + ' / ' + player.maxHp, 218, 24);

    // Cooldown gems: dash / heal
    var dashMax = player.skills.hdash ? Math.round(C.DASH_CD*0.55) : C.DASH_CD;
    var canDash = player.form === 'tower' || player.form === 'queen';
    var canHeal = canMagic;
    Draw.staminaCircle(ctx, 50, 56, 7, canDash ? 1 - player.dashCd / dashMax : 0);
    Draw.staminaCircle(ctx, 72, 56, 7, canHeal ? 1 - player.healCd / C.HEAL_CD : 0);

    // Essence (top-right)
    Draw.essenceShard(ctx, C.W - 96, 22, 8);
    gtext(ctx, player.essence, C.W - 82, 28, 17, g.ink, 'left');

    // Bonfire distance
    var d = World.bonfireDistance(world, player);
    Draw.inkFlame(ctx, C.W - 94, 54, 3.4, 12, 2);
    gtext(ctx, d, C.W - 82, 52, 13, g.textDim, 'left');

    // Form medallion (bottom-left)
    ctx.fillStyle = 'rgba(252,249,240,0.9)';
    ctx.beginPath(); ctx.arc(36, C.H - 34, 22, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = g.ink; ctx.lineWidth = 2.4;
    ctx.beginPath(); ctx.arc(36, C.H - 34, 21, 0, Math.PI*2); ctx.stroke();
    ctx.strokeStyle = g.ink; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(36, C.H - 34, 17.5, 0, Math.PI*2); ctx.stroke();
    ctx.font = '22px serif';
    ctx.fillStyle = g.ink; ctx.textAlign = 'center';
    ctx.fillText(FORM_GLYPH[player.form], 36, C.H - 26);
    ctx.textAlign = 'left';

    // Zone name banner
    if (world.zoneBannerTimer > 0) {
      var a = Math.min(1, world.zoneBannerTimer / 30);
      ctx.globalAlpha = a;
      inkTitle(ctx, T(Rooms.ZONE_KEYS[world.room.zone]), C.W/2, 84, 26);
      divider(ctx, C.W/2, 98, 300);
      gtext(ctx, T('stage_label') + ' ' + (world.room.zone + 1), C.W/2, 120, 13, g.textDim);
      ctx.globalAlpha = 1;
    }

    // Boss bar
    var boss = null;
    for (var i = 0; i < world.enemies.length; i++)
      if (world.enemies[i].boss && !world.enemies[i].dead) { boss = world.enemies[i]; break; }
    if (boss) {
      var bw = 340;
      gtext(ctx, T(world.room.boss.name), C.W/2, C.H - 34, 14, g.ink, 'center', { spacing: 2 });
      Draw.barOrnate(ctx, C.W/2 - bw/2, C.H - 26, bw, 9, Math.max(0, boss.hp / boss.maxHp), '#26221b', '#0c0a07');
    }
    if (world.bossAlert > 0 && boss) {
      ctx.globalAlpha = Math.min(1, world.bossAlert / 30);
      inkTitle(ctx, T(world.room.boss.name), C.W/2, C.H/2 - 60, 30);
      ctx.globalAlpha = 1;
    }

    // Interaction prompts
    if (World.nearBonfire(world, player)) gtext(ctx, T('bonfire_prompt'), C.W/2, C.H - 60, 14, g.ink, 'center', { glow:'rgba(247,243,228,0.9)' });
    else if (World.nearAltar(world, player)) gtext(ctx, T('altar_prompt'), C.W/2, C.H - 60, 14, g.ink, 'center', { glow:'rgba(247,243,228,0.9)' });

    // Door hints
    if (world.hintTimer > 0 && world.hintKey) {
      ctx.globalAlpha = Math.min(1, world.hintTimer / 25);
      gtext(ctx, T(world.hintKey), C.W/2, 130, 14, g.ink, 'center', { font: C.FONT_BODY, glow:'rgba(247,243,228,0.9)' });
      ctx.globalAlpha = 1;
    }

    // Toast
    if (msgTimer > 0 && msgKey) {
      ctx.globalAlpha = Math.min(1, msgTimer / 25);
      gtext(ctx, T(msgKey), C.W/2, 152, 14, g.ink, 'center', { font: C.FONT_BODY, glow:'rgba(247,243,228,0.9)' });
      ctx.globalAlpha = 1;
    }

    // Promotion banner
    if (unlockTimer > 0 && unlockBanner) {
      ctx.globalAlpha = Math.min(1, unlockTimer / 30);
      inkTitle(ctx, T('unlock_banner'), C.W/2, C.H/2 - 70, 26);
      gtext(ctx, FORM_GLYPH[unlockBanner] + '  ' + T('form_' + unlockBanner), C.W/2, C.H/2 - 36, 19, g.ink);
      ctx.globalAlpha = 1;
    }
  }

  // ── Screens ─────────────────────────────────────────────────────────────────

  function drawSideSelect(ctx) {
    paperBg(ctx);
    Draw.ornateFrame(ctx);
    inkTitle(ctx, T('side_choose'), C.W/2, 74, 28);
    divider(ctx, C.W/2, 92, 340);

    var sides = [
      { color: '#f7f3e4', label: 'side_white' },
      { color: '#14110c', label: 'side_black' },
    ];
    sides.forEach(function(s, i) {
      var x = C.W/2 + (i === 0 ? -230 : 30), y = 130, w = 200, h = 210;
      var sel = sideCursor === i;
      if (sel) Draw.panel(ctx, x, y, w, h);
      else {
        ctx.fillStyle = 'rgba(230,224,202,0.6)';
        ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = 'rgba(26,23,18,0.3)'; ctx.lineWidth = 1;
        ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
      }
      ctx.globalAlpha = sel ? 1 : 0.6;
      // Mini checkerboard pedestal
      for (var t2 = 0; t2 < 6; t2++) {
        ctx.fillStyle = t2 % 2 === 0 ? '#f2edda' : '#1a1712';
        ctx.fillRect(x + w/2 - 54 + t2*18, y + 150, 18, 8);
      }
      ctx.strokeStyle = G().ink; ctx.lineWidth = 1;
      ctx.strokeRect(x + w/2 - 54, y + 150, 108, 8);
      Draw.hero(ctx, x + w/2, y + 148, 62, s.color, null, i === 0 ? 1 : -1, false, false, 'pawn');
      gtext(ctx, T(s.label), x + w/2, y + 186, 17, sel ? G().ink : G().textDim, 'center', { spacing: 2 });
      ctx.globalAlpha = 1;
    });

    gtext(ctx, T('side_hint'), C.W/2, C.H - 60, 13, G().textDim);
    gtext(ctx, T('altar_hint'), C.W/2, C.H - 28, 12, G().textDim);
  }

  function drawIntro(ctx) {
    paperBg(ctx);
    Draw.moon(ctx, C.W - 130, 76, 30);
    Draw.ornateFrame(ctx);
    var texts = ['intro1','intro2','intro3','intro4'];
    Draw.realmkeeper(ctx, C.W/2, 220, 120);
    if (introPage === 0) inkTitle(ctx, T('franchise'), C.W/2, 70, 26);
    Draw.panel(ctx, C.W/2 - 280, 250, 560, 130);
    gtext(ctx, T(texts[Math.min(introPage,3)]), C.W/2, 288, 15, G().text, 'center', { font: C.FONT_BODY });
    // Page pips
    for (var i = 0; i < 4; i++) {
      ctx.fillStyle = i <= introPage ? G().ink : 'rgba(26,23,18,0.2)';
      ctx.save(); ctx.translate(C.W/2 - 27 + i * 18, 398); ctx.rotate(Math.PI/4);
      ctx.fillRect(-2.6, -2.6, 5.2, 5.2);
      ctx.restore();
    }
    gtext(ctx, T('intro_skip'), C.W/2, C.H - 26, 12, G().textDim);
  }

  // ── The Castle Map — a pencil cross-section full of chambers ───────────────
  var CASTLE = { x: 70, y: 76, w: 660, h: 330 };

  function drawStageMap(ctx) {
    var g = G();
    paperBg(ctx);
    // Scribbled margins around the castle
    Draw.hatchRect(ctx, 0, 0, C.W, C.H, 'rgba(26,23,18,0.05)', 9, 1);

    // The castle mass
    Draw.dungeonCastle(ctx, CASTLE.x, CASTLE.y, CASTLE.w, CASTLE.h, frame);

    var STAGES = Rooms.STAGES;
    // Corridors between chambers (drawn under the chambers)
    for (var i = 0; i < STAGES.length - 1; i++) {
      drawCorridor(ctx, STAGES[i], STAGES[i+1], stageUnlocked(i + 1));
    }
    // Chambers
    for (var j = 0; j < STAGES.length; j++) drawStageNode(ctx, j);

    // Title
    inkTitle(ctx, T('map_castle_title'), C.W/2, 40, 26, { halo: true });
    divider(ctx, C.W/2, 54, 340);

    // Info panel
    var shakeX = mapShake > 0 ? Math.sin(mapShake * 1.2) * 3 : 0;
    Draw.panel(ctx, 150 + shakeX, 398, 500, 46);
    var title = (mapCursor + 1) + '. ' + T(Rooms.ZONE_KEYS[mapCursor]);
    if (stagesCleared[mapCursor]) title += '  —  ' + T('stage_cleared_tag');
    gtext(ctx, title, C.W/2 + shakeX, 417, 14, g.ink, 'center', { spacing: 1 });
    if (!stageUnlocked(mapCursor)) {
      gtext(ctx, '🔒 ' + T(msgTimer > 0 && msgKey === 'stage_locked_hint' ? 'stage_locked_hint' : 'stage_locked'), C.W/2 + shakeX, 434, 10, g.textDim, 'center', { font: C.FONT_BODY });
    } else {
      gtext(ctx, T('map_nav_hint'), C.W/2 + shakeX, 434, 10, g.textDim, 'center', { font: C.FONT_BODY });
    }
  }

  // White corridor cut through the castle mass, orthogonal like the concept:
  // horizontal from A to B's column, then vertical down/up to B.
  function drawCorridor(ctx, a, b, open) {
    var wdt = 13;
    var col = open ? '#f2edda' : 'rgba(242,237,218,0.22)';
    ctx.fillStyle = col;
    // Horizontal leg at a.y
    var x1 = Math.min(a.x, b.x), x2 = Math.max(a.x, b.x);
    ctx.fillRect(x1, a.y - wdt/2, x2 - x1, wdt);
    // Vertical leg at b.x
    var y1 = Math.min(a.y, b.y), y2 = Math.max(a.y, b.y);
    ctx.fillRect(b.x - wdt/2, y1, wdt, y2 - y1);
    // Door notches (ink dashes across the corridor)
    ctx.strokeStyle = 'rgba(26,23,18,0.55)';
    ctx.lineWidth = 2;
    var mx = (a.x + b.x) / 2;
    ctx.beginPath(); ctx.moveTo(mx, a.y - wdt/2); ctx.lineTo(mx, a.y + wdt/2); ctx.stroke();
    if (y2 - y1 > 24) {
      var my = (y1 + y2) / 2;
      ctx.beginPath(); ctx.moveTo(b.x - wdt/2, my); ctx.lineTo(b.x + wdt/2, my); ctx.stroke();
    }
  }

  function drawStageNode(ctx, i) {
    var g = G();
    var st = Rooms.STAGES[i];
    var unlocked = stageUnlocked(i);
    var cleared = !!stagesCleared[i];
    var sel = mapCursor === i;
    var S = 54;
    var x = st.x - S/2, y = st.y - S/2;
    var shakeX = (sel && mapShake > 0) ? Math.sin(mapShake * 1.2) * 3 : 0;
    x += shakeX;

    // White chamber cut into the castle
    ctx.fillStyle = unlocked ? '#f7f3e6' : '#c9c1a6';
    ctx.fillRect(x, y, S, S);
    if (!unlocked) Draw.hatchRect(ctx, x, y, S, S, 'rgba(26,23,18,0.35)', 5, 1);
    // Rough ink outline (double for the selected chamber)
    Draw.roughRect(ctx, x, y, S, S, g.ink, sel ? 2.6 : 1.8, i * 7);
    if (sel) {
      var pulse = 0.4 + 0.6 * Math.abs(Math.sin(frame * 0.07));
      ctx.save();
      ctx.globalAlpha = pulse;
      Draw.roughRect(ctx, x - 4, y - 4, S + 8, S + 8, g.ink, 1.4, i * 13 + 3);
      ctx.restore();
    }

    // Emblem: mini cartoon piece of the enemy side
    var pieceCol = player ? player.enemyColor : '#14110c';
    if (!unlocked) pieceCol = '#14110c';
    var icon = st.icon;
    var py = y + S - 8;
    if (icon === 'pawn')        Draw.pawn(ctx, x + S/2, py, 34, pieceCol);
    else if (icon === 'knight') Draw.knight(ctx, x + S/2, py, 34, pieceCol, false, 1);
    else if (icon === 'bishop') Draw.bishop(ctx, x + S/2, py, 34, pieceCol);
    else if (icon === 'rook')   Draw.tower(ctx, x + S/2, py, 34, pieceCol);
    else if (icon === 'queen')  Draw.queen(ctx, x + S/2, py, 34, pieceCol);
    else                        Draw.king(ctx, x + S/2, py, 34, pieceCol);

    if (!unlocked) Draw.lockIcon(ctx, x + S/2, y + S/2 - 2, 12);
    if (cleared) Draw.crownIcon(ctx, x + S - 8, y + 8, 7);

    // Hero token stands beside the selected chamber, on a paper disc so it
    // reads against the dark castle whichever side was chosen
    if (sel && unlocked) {
      var hop = Math.abs(Math.sin(frame * 0.09)) * 4;
      ctx.fillStyle = 'rgba(247,243,230,0.9)';
      ctx.beginPath(); ctx.ellipse(x - 16, y + S - 16, 17, 22, 0, 0, Math.PI*2); ctx.fill();
      ctx.strokeStyle = g.ink; ctx.lineWidth = 1.2; ctx.stroke();
      Draw.hero(ctx, x - 16, y + S - 4 - hop, 26, player ? player.color : '#f7f3e4', null, 1, false, false, player ? player.form : 'pawn');
    }

    // Stage number plate below
    ctx.fillStyle = '#f7f3e6';
    ctx.fillRect(x + S/2 - 8, y + S + 4, 16, 13);
    ctx.strokeStyle = g.ink; ctx.lineWidth = 1;
    ctx.strokeRect(x + S/2 - 8, y + S + 4, 16, 13);
    gtext(ctx, i + 1, x + S/2, y + S + 14, 10, g.ink);
  }

  function drawStageClear(ctx) {
    drawWorld(ctx);
    var a = Math.min(1, clearTimer / 40);
    ctx.fillStyle = 'rgba(242,237,218,' + (a * 0.85) + ')';
    ctx.fillRect(0, 0, C.W, C.H);
    ctx.globalAlpha = a;
    inkTitle(ctx, T('stage_clear_banner'), C.W/2, C.H/2 - 40, 44);
    divider(ctx, C.W/2, C.H/2 - 18, 380);
    gtext(ctx, T(Rooms.ZONE_KEYS[clearedZone]), C.W/2, C.H/2 + 14, 19, G().ink);
    if (clearTimer > 70) {
      var blink = Math.sin(frame * 0.1) > -0.3 ? 1 : 0;
      ctx.globalAlpha = a * blink;
      gtext(ctx, T('stage_clear_hint'), C.W/2, C.H/2 + 58, 13, G().textDim);
    }
    ctx.globalAlpha = 1;
  }

  function drawPauseMenu(ctx) {
    ctx.fillStyle = 'rgba(242,237,218,0.9)';
    ctx.fillRect(0, 0, C.W, C.H);
    Draw.ornateFrame(ctx);
    inkTitle(ctx, T('paused'), C.W/2, 82, 34);
    divider(ctx, C.W/2, 98, 300);
    var opts = ['pause_continue','pause_map','pause_skills','pause_quit'];
    opts.forEach(function(k, i) {
      var sel = pauseCursor === i;
      if (sel) {
        ctx.fillStyle = 'rgba(26,23,18,0.08)';
        ctx.fillRect(C.W/2 - 140, 142 + i*44, 280, 34);
        ctx.fillStyle = G().ink;
        ctx.save(); ctx.translate(C.W/2 - 152, 159 + i*44); ctx.rotate(Math.PI/4);
        ctx.fillRect(-3.4, -3.4, 6.8, 6.8);
        ctx.restore();
      }
      gtext(ctx, T(k), C.W/2, 164 + i*44, sel ? 20 : 17, sel ? G().ink : G().textDim, 'center', { spacing: 2 });
    });
    // Stats
    Draw.panel(ctx, C.W - 216, 140, 178, 130);
    gtext(ctx, '♥ ' + player.hp + ' / ' + player.maxHp, C.W - 196, 172, 14, G().text, 'left', { font: C.FONT_BODY });
    Draw.essenceShard(ctx, C.W - 189, 194, 6);
    gtext(ctx, player.essence + ' ' + T('essence'), C.W - 176, 199, 14, G().text, 'left', { font: C.FONT_BODY });
    gtext(ctx, FORM_GLYPH[player.form] + ' ' + T('form_' + player.form), C.W - 196, 227, 14, G().text, 'left', { font: C.FONT_BODY });
    gtext(ctx, T('stage_label') + ' ' + ((world.room ? world.room.zone : 0) + 1) + ' — ' + T(Rooms.ZONE_KEYS[world.room ? world.room.zone : 0]), C.W - 196, 252, 11, G().textDim, 'left', { font: C.FONT_BODY });
    // Hero
    Draw.hero(ctx, 110, 330, 90, player.color, null, 1, false, false, player.form);
  }

  function drawSkills(ctx) {
    paperBg(ctx);
    Draw.ornateFrame(ctx);
    inkTitle(ctx, T('skills_title'), C.W/2, 52, 26);
    Draw.essenceShard(ctx, C.W/2 - 40, 72, 6);
    gtext(ctx, player.essence + ' ' + T('essence'), C.W/2 + 4, 78, 13, G().ink);

    var colX = [C.W/4 + 10, 3*C.W/4 - 10];
    var heads = ['skills_white', 'skills_dark'];
    for (var colI = 0; colI < 2; colI++) {
      gtext(ctx, T(heads[colI]), colX[colI], 112, 15, G().ink, 'center', { spacing: 1.5 });
      divider(ctx, colX[colI], 122, 210);
      for (var rowI = 0; rowI < 3; rowI++) {
        var id = SKILL_LIST[colI][rowI];
        var sel = skillCursor === colI*3 + rowI;
        var owned = player.skills[id];
        var y = 158 + rowI * 78;
        if (sel) {
          Draw.panel(ctx, colX[colI] - 160, y - 24, 320, 64);
        } else {
          ctx.fillStyle = 'rgba(230,224,202,0.6)';
          ctx.fillRect(colX[colI] - 160, y - 24, 320, 64);
          ctx.strokeStyle = 'rgba(26,23,18,0.25)'; ctx.lineWidth = 1;
          ctx.strokeRect(colX[colI] - 159.5, y - 23.5, 319, 63);
        }
        // The dark path rows carry a hatched corner mark
        if (colI === 1) Draw.hatchRect(ctx, colX[colI] + 138, y - 24, 22, 64, 'rgba(26,23,18,0.35)', 4, 1);
        gtext(ctx, T('sk_' + id) + (owned ? '  ✓' : '   — ' + C.SKILL[id].cost + ' ◆'),
                 colX[colI], y, 15, owned ? G().textDim : G().ink);
        gtext(ctx, T('sk_' + id + '_desc'), colX[colI], y + 22, 11, G().textDim, 'center', { font: C.FONT_BODY });
      }
    }
    if (msgTimer > 0 && msgKey) gtext(ctx, T(msgKey), C.W/2, C.H - 46, 13, G().ink);
    gtext(ctx, T('skills_hint'), C.W/2, C.H - 22, 12, G().textDim);
  }

  function drawAltar(ctx) {
    paperBg(ctx);
    Draw.ornateFrame(ctx);
    inkTitle(ctx, T('altar_title'), C.W/2, 54, 24);
    Draw.essenceShard(ctx, C.W/2 - 40, 76, 6);
    gtext(ctx, player.essence + ' ' + T('essence'), C.W/2 + 4, 82, 13, G().ink);

    var boxW = 124, boxH = 140, gap = 16;
    var x0 = C.W/2 - (boxW*5 + gap*4)/2;
    FORM_LIST.forEach(function(f, i) {
      var x = x0 + i*(boxW+gap), y = 116;
      var sel = altarCursor === i;
      var owned = player.forms[f];
      if (sel) Draw.panel(ctx, x, y, boxW, boxH);
      else {
        ctx.fillStyle = 'rgba(230,224,202,0.6)';
        ctx.fillRect(x, y, boxW, boxH);
        ctx.strokeStyle = 'rgba(26,23,18,0.25)'; ctx.lineWidth = 1;
        ctx.strokeRect(x + 0.5, y + 0.5, boxW - 1, boxH - 1);
      }
      ctx.globalAlpha = owned || sel ? 1 : 0.5;
      Draw.hero(ctx, x + boxW/2, y + 74, 44, player.color, null, 1, false, false, f);
      gtext(ctx, T('form_' + f), x + boxW/2, y + 100, 14, G().ink);
      if (player.form === f)      gtext(ctx, T('altar_active'), x + boxW/2, y + 122, 10, G().ink);
      else if (owned)             gtext(ctx, T('altar_take'), x + boxW/2, y + 122, 10, G().textDim);
      else                        gtext(ctx, C.FORM_COST[f] + ' ◆', x + boxW/2, y + 122, 11, G().textDim);
      ctx.globalAlpha = 1;
    });

    gtext(ctx, T('form_' + FORM_LIST[altarCursor] + '_desc'), C.W/2, 300, 14, G().text, 'center', { font: C.FONT_BODY });
    if (FORM_LIST[altarCursor] === 'queen' && !(player.forms.tower && player.forms.knight && player.forms.bishop))
      gtext(ctx, T('altar_locked_queen'), C.W/2, 328, 12, G().textDim, 'center', { font: C.FONT_BODY });
    if (msgTimer > 0 && msgKey) gtext(ctx, T(msgKey), C.W/2, 354, 13, G().ink);
    gtext(ctx, T('altar_hint'), C.W/2, C.H - 22, 12, G().textDim);
  }

  function drawGameOver(ctx) {
    drawWorld(ctx);
    ctx.fillStyle = 'rgba(20,17,12,0.86)';
    ctx.fillRect(0, 0, C.W, C.H);
    inkTitle(ctx, T('gameover'), C.W/2, C.H/2 - 16, 44, { spacing: 6, color: '#f2edda' });
    var gr = ctx.createLinearGradient(C.W/2 - 150, 0, C.W/2 + 150, 0);
    gr.addColorStop(0, 'rgba(242,237,218,0)');
    gr.addColorStop(0.5, '#f2edda');
    gr.addColorStop(1, 'rgba(242,237,218,0)');
    ctx.strokeStyle = gr; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(C.W/2 - 150, C.H/2 + 6); ctx.lineTo(C.W/2 + 150, C.H/2 + 6); ctx.stroke();
    gtext(ctx, T('gameover_hint'), C.W/2, C.H/2 + 40, 14, 'rgba(242,237,218,0.7)');
  }

  function drawEndingChoice(ctx) {
    paperBg(ctx);
    Draw.ornateFrame(ctx);
    gtext(ctx, T('ending_choice'), C.W/2, 82, 18, G().text, 'center', { font: C.FONT_BODY });
    var labels = ['ending_opt1','ending_opt2'];
    for (var i = 0; i < 2; i++) {
      var x = C.W/2 + (i === 0 ? -200 : 40), y = 170, w = 160, h = 130;
      var sel = endingChoice === i;
      if (sel) Draw.panel(ctx, x, y, w, h);
      else {
        ctx.fillStyle = 'rgba(230,224,202,0.6)';
        ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = 'rgba(26,23,18,0.25)'; ctx.lineWidth = 1;
        ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
      }
      ctx.globalAlpha = sel ? 1 : 0.55;
      if (i === 0) Draw.king(ctx, x + w/2, y + 84, 52, '#f7f3e4');
      else {
        Draw.king(ctx, x + w/2, y + 84, 52, '#14110c');
        ctx.strokeStyle = G().ink; ctx.lineWidth = 4; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(x + w/2 - 24, y + 84 - 46); ctx.lineTo(x + w/2 + 24, y + 84); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x + w/2 + 24, y + 84 - 46); ctx.lineTo(x + w/2 - 24, y + 84); ctx.stroke();
      }
      gtext(ctx, T(labels[i]), x + w/2, y + 112, 12, sel ? G().ink : G().textDim);
      ctx.globalAlpha = 1;
    }
    gtext(ctx, T('altar_hint'), C.W/2, C.H - 26, 12, G().textDim);
  }

  function drawEndingText(ctx) {
    paperBg(ctx);
    Draw.ornateFrame(ctx);
    gtext(ctx, T(endingPicked === 0 ? 'ending1' : 'ending2'), C.W/2, 110, 16, G().text, 'center', { font: C.FONT_BODY });
    if (darkSkillCount() >= 2) gtext(ctx, T('ending_dark'), C.W/2, 216, 13, G().textDim, 'center', { font: C.FONT_BODY });
    Draw.realmkeeper(ctx, C.W/2, 372, 90);
    if (endingTimer > 120) {
      inkTitle(ctx, T('the_end'), C.W/2, 412, 22);
      gtext(ctx, T('ending_hint'), C.W/2, C.H - 14, 11, G().textDim);
    }
  }

  function drawWorld(ctx) {
    World.drawBg(ctx, world, cam);
    ctx.save();
    ctx.translate(-Math.round(cam.x), -Math.round(cam.y));
    World.draw(ctx, world, player);
    ctx.restore();
    Draw.vignette(ctx);
  }

  // ── Draw dispatcher ─────────────────────────────────────────────────────────
  function draw(ctx) {
    if (state === ST.SIDE)          { drawSideSelect(ctx); return; }
    if (state === ST.INTRO)         { drawIntro(ctx); return; }
    if (state === ST.STAGEMAP)      { drawStageMap(ctx); return; }
    if (state === ST.STAGECLEAR)    { drawStageClear(ctx); return; }
    if (state === ST.PAUSED)        { drawWorld(ctx); drawPauseMenu(ctx); return; }
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
             form: player && player.form, color: player && player.color,
             stagesCleared: stagesCleared, mapCursor: mapCursor };
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
