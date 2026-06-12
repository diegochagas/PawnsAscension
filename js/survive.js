// ── Survive mode: the original 8-wave arena game ─────────────────────────────
var Survive = (function() {

  var ST = {
    SIDE_SELECT: 'side_select',
    PLAYING: 'playing',
    WAVE_CLEAR: 'wave_clear',
    BARD: 'bard',
    GAME_OVER: 'game_over',
    PAUSED: 'paused',
    VICTORY: 'victory',
  };

  var Save = {
    KEY: 'pawns_ascension_save',
    save: function(data) { try { localStorage.setItem(this.KEY, JSON.stringify(data)); } catch(e) {} },
    load: function() { try { var s = localStorage.getItem(this.KEY); return s ? JSON.parse(s) : null; } catch(e) { return null; } },
    clear: function() { try { localStorage.removeItem(this.KEY); } catch(e) {} },
  };

  var state, menuCursor, bardCursor, player, wm, waveIndex;
  var waveBannerTimer, waveClearTimer, victoryTimer, unlockThisWave;

  function start() {
    state = ST.SIDE_SELECT;
    Input.lockAllAbilities();
    menuCursor = 0;
    bardCursor = 0;
    player = null;
    wm = WaveManager.create();
    waveIndex = 0;
    waveBannerTimer = waveClearTimer = victoryTimer = 0;
    unlockThisWave = null;
    C.ROOM_W = C.W; C.ROOM_H = C.H;
  }

  function beginWave(idx) {
    waveIndex = idx;
    unlockThisWave = null;
    C.ROOM_W = C.W; C.ROOM_H = C.H;
    WaveManager.startWave(wm, waveIndex, player);
    waveBannerTimer = 90;
    state = ST.PLAYING;
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

  function startFresh(color) {
    player = Player.create(color);
    Save.clear();
    beginWave(0);
  }

  function restartFromSave() {
    var s = Save.load();
    if (!s) { state = ST.SIDE_SELECT; return; }
    player = Player.create(s.color);
    player.hp = s.hp;
    s.abilities.forEach(function(a) { Player.unlockAbility(player, a); });
    Player.heal(player, C.WAVE_HEAL);
    beginWave(s.wave);
  }

  function doSave() {
    var abList = Object.keys(player.abilities).filter(function(a){ return player.abilities[a]; });
    Save.save({ wave: waveIndex+1, color: player.color, hp: player.hp, abilities: abList });
    Audio.save();
  }

  function proceedFromBard() {
    if (waveIndex + 1 < C.WAVES.length) beginWave(waveIndex + 1);
    else { state = ST.VICTORY; victoryTimer = 0; Audio.victory(); }
  }

  // Returns 'quit' to go back to the main menu
  function update(inp) {
    if (state === ST.SIDE_SELECT) {
      if (inp.pauseJustPressed) return 'quit';
      if (inp.leftJustPressed || inp.rightJustPressed) {
        menuCursor = menuCursor === 0 ? 1 : 0;
        Audio.menuSelect();
      }
      if (inp.attackJustPressed || inp.jumpJustPressed) {
        startFresh(menuCursor === 0 ? '#000000' : '#ffffff');
        Audio.menuSelect();
      }
      return null;
    }

    if (inp.pauseJustPressed) {
      if (state === ST.PLAYING) state = ST.PAUSED;
      else if (state === ST.PAUSED) state = ST.PLAYING;
    }
    if (state === ST.PAUSED) return null;

    if (state === ST.WAVE_CLEAR) {
      waveClearTimer--;
      if (waveClearTimer <= 0) {
        var waveData = C.WAVES[waveIndex];
        if (waveData.bard) state = ST.BARD;
        else if (waveIndex + 1 < C.WAVES.length) beginWave(waveIndex + 1);
        else { state = ST.VICTORY; victoryTimer = 0; Audio.victory(); }
      }
      return null;
    }

    if (state === ST.BARD) {
      if (inp.jumpJustPressed || inp.leftJustPressed)   bardCursor = 0;
      if (inp.shieldJustPressed || inp.rightJustPressed) bardCursor = 1;
      if (inp.attackJustPressed) {
        if (bardCursor === 0) doSave();
        proceedFromBard();
      }
      if (inp.pauseJustPressed) { bardCursor = 1; proceedFromBard(); }
      return null;
    }

    if (state === ST.GAME_OVER) {
      if (inp.attackJustPressed || inp.jumpJustPressed) {
        if (Save.load()) restartFromSave();
        else state = ST.SIDE_SELECT;
      }
      return null;
    }

    if (state === ST.VICTORY) {
      victoryTimer++;
      if (victoryTimer > 420 && (inp.attackJustPressed || inp.jumpJustPressed)) {
        Save.clear();
        return 'quit';
      }
      return null;
    }

    if (state === ST.PLAYING) {
      if (waveBannerTimer > 0) waveBannerTimer--;
      WaveManager.update(wm, player);
      Player.update(player, inp, wm.platforms, wm.enemies.filter(function(e){ return !e.dead; }));

      if (player.dead) {
        state = ST.GAME_OVER;
        Audio.gameOver();
        return null;
      }

      if (WaveManager.allDefeated(wm)) {
        var wd = WaveManager.currentWaveData(wm);
        applyUnlock(wd);
        Player.heal(player, player.maxHp);
        if (waveIndex === C.WAVES.length - 1) {
          state = ST.VICTORY; victoryTimer = 0; Audio.victory();
        } else {
          state = ST.WAVE_CLEAR; waveClearTimer = 90; Audio.waveClear();
        }
      }
    }
    return null;
  }

  function draw(ctx) {
    if (state === ST.SIDE_SELECT) {
      UI.drawMenu(ctx, menuCursor === 0 ? '#000000' : '#ffffff', menuCursor);
      ctx.fillStyle = '#777';
      ctx.font = '13px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(T('survive_back_hint'), C.W/2, 432);
      ctx.textAlign = 'left';
      return;
    }
    if (state === ST.GAME_OVER) { UI.drawGameOver(ctx, savedWaveNum()); return; }
    if (state === ST.VICTORY)   { UI.drawVictory(ctx, victoryTimer, player ? player.color : '#000'); return; }
    if (!wm.theme) return;
    if (state === ST.BARD)      { UI.drawBard(ctx, player, waveIndex, wm.theme, bardCursor); return; }

    WaveManager.draw(ctx, wm, player);
    UI.drawHUD(ctx, player, waveIndex, wm.theme);

    var living = wm.enemies.filter(function(e){ return !e.dead; }).length;
    UI.drawEnemyCount(ctx, living, C.WAVES[waveIndex].enemies.reduce(function(s,g){ return s+g.count; }, 0), wm.theme);
    UI.drawWaveBanner(ctx, waveIndex, waveBannerTimer, wm.theme);
    if (state === ST.WAVE_CLEAR) UI.drawWaveClear(ctx, waveIndex, unlockThisWave, waveClearTimer);
    if (state === ST.PAUSED)     UI.drawPause(ctx, wm.theme);
  }

  // S key shortcut: save at the bard
  document.addEventListener('keydown', function(e) {
    if (state === ST.BARD && e.code === 'KeyS') {
      bardCursor = 0;
      doSave();
      proceedFromBard();
    }
  });

  function debug() {
    return { state: state, waveIndex: waveIndex,
             playerHP: player ? player.hp : null,
             enemies: wm ? wm.enemies.length : 0 };
  }

  return { start, update, draw, debug };
})();
