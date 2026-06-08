// ── Game states ────────────────────────────────────────────────────────────
var STATE = {
  MENU: 'menu',
  PLAYING: 'playing',
  WAVE_CLEAR: 'wave_clear',
  BARD: 'bard',
  GAME_OVER: 'game_over',
  PAUSED: 'paused',
  VICTORY: 'victory',
};

// ── Save / Load ─────────────────────────────────────────────────────────────
var Save = {
  KEY: 'pawns_ascension_save',
  save: function(data) {
    try { localStorage.setItem(this.KEY, JSON.stringify(data)); } catch(e) {}
  },
  load: function() {
    try { var s = localStorage.getItem(this.KEY); return s ? JSON.parse(s) : null; } catch(e) { return null; }
  },
  clear: function() {
    try { localStorage.removeItem(this.KEY); } catch(e) {}
  },
};

// ── Main game ───────────────────────────────────────────────────────────────
(function() {
  var canvas = document.getElementById('gameCanvas');
  var ctx = canvas.getContext('2d');
  canvas.width  = C.W;
  canvas.height = C.H;

  // State
  var state = STATE.MENU;
  var menuCursor = 0;       // 0=black, 1=white
  var bardCursor = 0;       // 0=save, 1=continue
  var player = null;
  var wm = WaveManager.create();
  var waveIndex = 0;        // 0-based

  // Timers / flags
  var waveBannerTimer = 0;
  var waveClearTimer  = 0;
  var victoryTimer    = 0;
  var unlockThisWave  = null;
  var paused = false;

  // ── Helpers ────────────────────────────────────────────────────────────────
  function beginWave(idx) {
    waveIndex = idx;
    unlockThisWave = null;
    WaveManager.startWave(wm, waveIndex, player);
    waveBannerTimer = 90;
    state = STATE.PLAYING;
  }

  function applyUnlock(waveData) {
    if (waveData.unlock && !player.abilities[waveData.unlock]) {
      Player.unlockAbility(player, waveData.unlock);
      unlockThisWave = waveData.unlock;
    }
  }

  function savedWaveNum() {
    var s = Save.load();
    return s ? s.wave : 0;
  }

  function buildPlayerFromSave(s) {
    player = Player.create(s.color);
    player.hp = s.hp;
    s.abilities.forEach(function(a) { Player.unlockAbility(player, a); });
  }

  function startFresh(color) {
    player = Player.create(color);
    Save.clear();
    beginWave(0);
  }

  function restartFromSave() {
    var s = Save.load();
    if (!s) { state = STATE.MENU; return; }
    buildPlayerFromSave(s);
    // Heal to at least 50 so mounted state is possible
    Player.heal(player, C.WAVE_HEAL);
    beginWave(s.wave); // wave after the save point
  }

  // ── Input handling ─────────────────────────────────────────────────────────
  function handleInput() {
    var inp = Input.get();
    Input.update();

    // Resume audio context on first interaction
    Audio.resume();

    if (state === STATE.MENU) {
      if (inp.leftJustPressed || inp.rightJustPressed) {
        menuCursor = menuCursor === 0 ? 1 : 0;
        Audio.menuSelect();
      }
      if (inp.attackJustPressed || inp.jumpJustPressed) {
        var color = menuCursor === 0 ? '#000000' : '#ffffff';
        startFresh(color);
        Audio.menuSelect();
      }
      return inp;
    }

    if (inp.pauseJustPressed) {
      if (state === STATE.PLAYING) { state = STATE.PAUSED; }
      else if (state === STATE.PAUSED) { state = STATE.PLAYING; }
    }

    if (state === STATE.PAUSED) return inp;

    if (state === STATE.WAVE_CLEAR) {
      waveClearTimer--;
      if (waveClearTimer <= 0) {
        var waveData = C.WAVES[waveIndex];
        if (waveData.bard) {
          state = STATE.BARD;
        } else if (waveIndex + 1 < C.WAVES.length) {
          beginWave(waveIndex + 1);
        } else {
          state = STATE.VICTORY;
          victoryTimer = 0;
          Audio.victory();
        }
      }
      return inp;
    }

    if (state === STATE.BARD) {
      // Navigate with up/down or jump/shield
      if (inp.jumpJustPressed || inp.leftJustPressed)   bardCursor = 0;
      if (inp.shieldJustPressed || inp.rightJustPressed) bardCursor = 1;

      function proceedFromBard() {
        if (waveIndex + 1 < C.WAVES.length) {
          beginWave(waveIndex + 1);
        } else {
          state = STATE.VICTORY; victoryTimer = 0; Audio.victory();
        }
      }

      if (inp.attackJustPressed) {
        if (bardCursor === 0) {
          // Save
          var abList = Object.keys(player.abilities).filter(function(a){ return player.abilities[a]; });
          Save.save({ wave: waveIndex+1, color: player.color, hp: player.hp, abilities: abList });
          Audio.save();
        }
        proceedFromBard();
      }
      if (inp.pauseJustPressed) {
        bardCursor = 1;
        proceedFromBard();
      }
      return inp;
    }

    if (state === STATE.GAME_OVER) {
      if (inp.attackJustPressed || inp.jumpJustPressed) {
        var saved = Save.load();
        if (saved) { restartFromSave(); }
        else       { state = STATE.MENU; }
      }
      return inp;
    }

    if (state === STATE.VICTORY) {
      victoryTimer++;
      if (victoryTimer > 420 && (inp.attackJustPressed || inp.jumpJustPressed)) {
        Save.clear();
        state = STATE.MENU;
      }
      return inp;
    }

    return inp;
  }

  // ── Game loop ──────────────────────────────────────────────────────────────
  function update() {
    var inp = handleInput();

    if (state === STATE.PLAYING) {
      // Banner countdown
      if (waveBannerTimer > 0) waveBannerTimer--;

      // Update wave (enemy spawns + AI)
      WaveManager.update(wm, player);

      // Update player
      Player.update(player, inp, wm.platforms, wm.enemies.filter(function(e){ return !e.dead; }));

      // Check player death
      if (player.dead) {
        state = STATE.GAME_OVER;
        Audio.gameOver();
        return;
      }

      // Check wave cleared
      if (WaveManager.allDefeated(wm)) {
        var waveData = WaveManager.currentWaveData(wm);
        applyUnlock(waveData);
        Player.heal(player, player.maxHp);

        if (waveIndex === C.WAVES.length - 1) {
          // Final wave cleared
          state = STATE.VICTORY;
          victoryTimer = 0;
          Audio.victory();
        } else {
          state = STATE.WAVE_CLEAR;
          waveClearTimer = 90;
          Audio.waveClear();
        }
      }
    }
  }

  function draw() {
    ctx.clearRect(0, 0, C.W, C.H);

    if (state === STATE.MENU) {
      UI.drawMenu(ctx, menuCursor === 0 ? '#000000' : '#ffffff', menuCursor);
      return;
    }

    if (state === STATE.GAME_OVER) {
      UI.drawGameOver(ctx, savedWaveNum());
      return;
    }

    if (state === STATE.VICTORY) {
      UI.drawVictory(ctx, victoryTimer, player ? player.color : '#000');
      return;
    }

    if (!wm.theme) return;

    // Wave playing / clear / bard / paused
    if (state === STATE.BARD) {
      UI.drawBard(ctx, player, waveIndex, wm.theme, bardCursor);
      return;
    }

    // Render world
    WaveManager.draw(ctx, wm, player);

    // HUD
    UI.drawHUD(ctx, player, waveIndex, wm.theme);

    var living = wm.enemies.filter(function(e){ return !e.dead; }).length;
    var total  = wm.enemies.length + (wm.spawnQueue ? wm.spawnQueue.length : 0);
    UI.drawEnemyCount(ctx, living, C.WAVES[waveIndex].enemies.reduce(function(s,g){ return s+g.count; }, 0), wm.theme);

    // Wave intro banner
    UI.drawWaveBanner(ctx, waveIndex, waveBannerTimer, wm.theme);

    // Wave clear overlay
    if (state === STATE.WAVE_CLEAR) {
      UI.drawWaveClear(ctx, waveIndex, unlockThisWave, waveClearTimer);
    }

    // Pause overlay
    if (state === STATE.PAUSED) {
      UI.drawPause(ctx, wm.theme);
    }
  }

  // S key as shorthand for save on bard screen
  document.addEventListener('keydown', function(e) {
    if (state === STATE.BARD && e.code === 'KeyS') {
      bardCursor = 0;
      var abList = Object.keys(player.abilities).filter(function(a){ return player.abilities[a]; });
      Save.save({ wave: waveIndex+1, color: player.color, hp: player.hp, abilities: abList });
      Audio.save();
      if (waveIndex+1 < C.WAVES.length) beginWave(waveIndex+1);
      else { state=STATE.VICTORY; victoryTimer=0; Audio.victory(); }
    }
  });

  // ── RAF loop ───────────────────────────────────────────────────────────────
  function loop() {
    try {
      update();
      draw();
    } catch(e) {
      console.error('Game loop error:', e.message, e.stack);
    }
    setTimeout(loop, 16);
  }

  // Scale canvas on resize
  function resize() {
    var wrapper = document.getElementById('wrapper');
    if (!wrapper) return;
    // CSS handles scaling via max-height; nothing needed here
  }
  window.addEventListener('resize', resize);
  resize();

  // Prevent scrolling on mobile
  document.addEventListener('touchmove', function(e){ e.preventDefault(); }, { passive: false });
  document.addEventListener('contextmenu', function(e){ e.preventDefault(); });

  setTimeout(loop, 16);

  // Debug exposure
  window._gameDebug = function() {
    return { state: state, waveIndex: waveIndex,
             playerHP: player ? player.hp : null,
             playerDead: player ? player.dead : null,
             enemies: wm.enemies.length,
             allSpawned: wm.allSpawned,
             spawnQ: wm.spawnQueue ? wm.spawnQueue.length : null };
  };
  window._setTestState = function(s, wi) {
    state = s;
    if (wi !== undefined) waveIndex = wi;
    if (!player) player = Player.create('#000000');
    if (!wm.theme) wm.theme = C.THEME.dark;
  };
})();
