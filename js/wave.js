var WaveManager = (function() {

  function create() {
    return {
      waveIndex: 0,      // 0-based index into C.WAVES
      enemies: [],
      platforms: [],
      spawnQueue: [],
      spawnTimer: 0,
      spawnInterval: 50, // frames between spawns
      allSpawned: false,
      theme: null,
    };
  }

  function startWave(wm, waveIndex, player) {
    wm.waveIndex = waveIndex;
    var waveData = C.WAVES[waveIndex];
    wm.theme = C.THEME[waveData.theme];

    // Build enemy color: enemies are the player's enemy color
    var enemyColor = player.enemyColor;

    // Platforms
    wm.platforms = Platforms.get(waveData.num, wm.theme.plt);

    // Build spawn queue
    wm.spawnQueue = [];
    waveData.enemies.forEach(function(group) {
      for (var i = 0; i < group.count; i++) {
        wm.spawnQueue.push({ type: group.type, color: enemyColor });
      }
    });
    // Shuffle slightly
    wm.spawnQueue.sort(function(){ return Math.random()-0.5; });

    wm.enemies = [];
    wm.spawnTimer = 30; // small delay before first spawn
    wm.allSpawned = false;

    // Reset player position
    Player.reset(player);
    player.x = C.W/2 - player.w/2;
    player.y = C.H - 200;
  }

  function update(wm, player) {
    // Spawn enemies from queue
    if (!wm.allSpawned) {
      wm.spawnTimer--;
      if (wm.spawnTimer <= 0 && wm.spawnQueue.length > 0) {
        var spec = wm.spawnQueue.shift();
        var sx = Math.random() < 0.5 ? 60 + Math.random()*100 : C.W-160 + Math.random()*100;
        var e;
        if (spec.type === 'pawn')   e = Enemies.spawnWave({enemies:[{type:'pawn',count:1}]}, wm.theme, C.W, C.H, wm.platforms)[0];
        else e = Enemies.spawnWave({enemies:[{type:spec.type,count:1}]}, wm.theme, C.W, C.H, wm.platforms)[0];
        if (e) {
          e.x = sx;
          e.color = spec.color;
          wm.enemies.push(e);
        }
        wm.spawnTimer = wm.spawnInterval;
        if (wm.spawnQueue.length === 0) wm.allSpawned = true;
      }
    }

    // Update enemies
    var living = wm.enemies.filter(function(e){ return !e.dead; });
    living.forEach(function(e) {
      Enemies.update(e, player, wm.platforms, living);
    });
  }

  function allDefeated(wm) {
    return wm.allSpawned && wm.enemies.every(function(e){ return e.dead; });
  }

  function currentWaveData(wm) {
    return C.WAVES[wm.waveIndex];
  }

  function draw(ctx, wm, player) {
    var theme = wm.theme;
    if (!theme) return;

    // Background: soft vertical gradient in the wave's theme
    var dark = theme.bg === '#141021' || theme.bg === '#000000';
    var bg = ctx.createLinearGradient(0, 0, 0, C.H);
    if (dark) { bg.addColorStop(0, '#0d0b1c'); bg.addColorStop(1, '#251c42'); }
    else      { bg.addColorStop(0, '#f2ecd9'); bg.addColorStop(1, '#d4c9ac'); }
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, C.W, C.H);
    // Giant faded chess emblem watermark
    ctx.save();
    ctx.globalAlpha = 0.07;
    ctx.font = 'bold 300px serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = dark ? '#f4edda' : '#221c2e';
    ctx.fillText(dark ? '♞' : '♜', C.W/2, C.H*0.78);
    ctx.restore();

    // Platforms (gothic stone slabs with checkered tops)
    wm.platforms.forEach(function(p) { Draw.platform(ctx, p, 5); });

    // Enemies
    wm.enemies.forEach(function(e) { Enemies.draw(ctx, e, theme); });

    // Player
    Player.draw(ctx, player, theme);
  }

  return { create, startWave, update, allDefeated, currentWaveData, draw };
})();
