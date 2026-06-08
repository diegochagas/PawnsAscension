var UI = (function() {

  var FONT_BIG   = 'bold 42px "Courier New", monospace';
  var FONT_MED   = 'bold 22px "Courier New", monospace';
  var FONT_SMALL = '16px "Courier New", monospace';
  var FONT_TINY  = '13px "Courier New", monospace';

  function text(ctx, str, x, y, font, color, align) {
    ctx.font = font || FONT_SMALL;
    ctx.fillStyle = color || '#000';
    ctx.textAlign = align || 'center';
    ctx.fillText(str, x, y);
    ctx.textAlign = 'left';
  }

  // ── Menu ───────────────────────────────────────────────────────────────────
  function drawMenu(ctx, selectedColor, cursor) {
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, C.W, C.H);

    // Title
    ctx.fillStyle = '#fff';
    ctx.font = FONT_BIG;
    ctx.textAlign = 'center';
    ctx.fillText("PAWN'S ASCENSION", C.W/2, 90);

    ctx.font = FONT_SMALL;
    ctx.fillStyle = '#888';
    ctx.fillText('ETERNAL BOARDS — Chapter I', C.W/2, 118);

    // Choose side
    ctx.fillStyle = '#ccc';
    ctx.font = FONT_MED;
    ctx.fillText('Choose your side:', C.W/2, 185);

    var bx = C.W/2 - 190, wx = C.W/2 + 50;
    var bw = 140, bh = 110;

    // Black option box
    ctx.lineWidth = cursor === 0 ? 3 : 1.5;
    ctx.strokeStyle = cursor === 0 ? '#fff' : '#666';
    ctx.fillStyle = '#000';
    ctx.fillRect(bx, 205, bw, bh);
    ctx.strokeRect(bx, 205, bw, bh);
    Draw.pawn(ctx, bx + bw/2, 205 + bh - 10, 68, '#000000');
    ctx.fillStyle = '#fff';
    ctx.font = cursor === 0 ? 'bold '+FONT_SMALL : FONT_SMALL;
    ctx.fillText(cursor === 0 ? '► BLACK ◄' : 'BLACK', bx + bw/2, 205 + bh + 20);

    // White option box
    ctx.lineWidth = cursor === 1 ? 3 : 1.5;
    ctx.strokeStyle = cursor === 1 ? '#fff' : '#666';
    ctx.fillStyle = '#fff';
    ctx.fillRect(wx, 205, bw, bh);
    ctx.strokeRect(wx, 205, bw, bh);
    Draw.pawn(ctx, wx + bw/2, 205 + bh - 10, 68, '#ffffff');
    ctx.fillStyle = '#fff';
    ctx.font = cursor === 1 ? 'bold '+FONT_SMALL : FONT_SMALL;
    ctx.fillText(cursor === 1 ? '► WHITE ◄' : 'WHITE', wx + bw/2, 205 + bh + 20);

    ctx.fillStyle = '#aaa';
    ctx.font = FONT_SMALL;
    ctx.fillText('← → to choose    ENTER / Z to confirm', C.W/2, 360);
    ctx.fillText('Arrow keys / WASD to move    Space / ↑ to jump', C.W/2, 385);
    ctx.fillText('Z = attack   Shift = dash   Q = spear   E = shield', C.W/2, 408);

    ctx.textAlign = 'left';
  }

  // ── HUD ────────────────────────────────────────────────────────────────────
  function drawHUD(ctx, player, waveIndex, theme) {
    var waveData = C.WAVES[waveIndex];
    var fg = theme.ui;
    var bgBox = theme.uiBg;

    // Wave number
    ctx.fillStyle = bgBox;
    ctx.fillRect(C.W/2 - 70, 6, 140, 24);
    text(ctx, 'WAVE ' + waveData.num + ' / 8', C.W/2, 23, FONT_SMALL, fg);

    // Player HP
    ctx.fillStyle = bgBox;
    ctx.fillRect(8, 8, 160, 24);
    text(ctx, 'HP', 16, 24, FONT_TINY, fg, 'left');
    Draw.hpBar(ctx, 32, 12, 130, 14, player.hp/player.maxHp, fg, 'transparent');

    // Abilities row
    var abilities = ['dash','spear','shield'];
    var icons = {'dash':'»', 'spear':'🗡', 'shield':'🛡'};
    var ax = C.W - 120;
    ctx.fillStyle = bgBox;
    ctx.fillRect(ax - 4, 6, 116, 24);
    abilities.forEach(function(a, i) {
      var unlocked = player.abilities[a];
      ctx.fillStyle = unlocked ? fg : (fg === '#000' ? '#bbb' : '#444');
      ctx.font = FONT_TINY;
      ctx.textAlign = 'center';
      ctx.fillText(icons[a], ax + i*36 + 16, 22);
      if (!unlocked) {
        ctx.fillStyle = fg === '#000' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)';
        ctx.fillRect(ax + i*36 + 4, 9, 24, 16);
      }
    });
    ctx.textAlign = 'left';

    // Enemy counter
    ctx.fillStyle = bgBox;
    ctx.fillRect(C.W - 68, C.H - 30, 60, 22);
    // (count shown in game.js)
  }

  function drawEnemyCount(ctx, living, total, theme) {
    var fg = theme.ui;
    text(ctx, living + ' / ' + total, C.W - 38, C.H - 14, FONT_TINY, fg);
  }

  // ── Wave intro banner ──────────────────────────────────────────────────────
  function drawWaveBanner(ctx, waveIndex, timer, theme) {
    if (timer <= 0) return;
    var alpha = Math.min(1, timer / 20);
    var waveData = C.WAVES[waveIndex];
    var names = ['','PAWNS','PAWNS','THE KNIGHT','THE KNIGHT',
                 'THE BISHOPS','THE TOWERS','THE QUEEN','THE KING'];
    ctx.fillStyle = 'rgba(0,0,0,' + alpha*0.6 + ')';
    ctx.fillRect(0, C.H/2 - 50, C.W, 100);
    ctx.fillStyle = 'rgba(255,255,255,' + alpha + ')';
    ctx.font = FONT_BIG;
    ctx.textAlign = 'center';
    ctx.fillText('WAVE ' + waveData.num, C.W/2, C.H/2 - 8);
    ctx.font = FONT_MED;
    ctx.fillText(names[waveData.num] || '', C.W/2, C.H/2 + 24);
    ctx.textAlign = 'left';
  }

  // ── Wave clear ─────────────────────────────────────────────────────────────
  function drawWaveClear(ctx, waveIndex, unlocked, timer) {
    var alpha = Math.min(1, (90 - timer) / 20);
    ctx.fillStyle = 'rgba(0,0,0,' + alpha*0.7 + ')';
    ctx.fillRect(0, C.H/2 - 80, C.W, 160);

    ctx.fillStyle = 'rgba(255,255,255,' + alpha + ')';
    ctx.font = FONT_BIG;
    ctx.textAlign = 'center';
    ctx.fillText('WAVE CLEAR!', C.W/2, C.H/2 - 20);

    if (unlocked) {
      ctx.font = FONT_MED;
      ctx.fillStyle = 'rgba(200,230,255,' + alpha + ')';
      ctx.fillText('New ability: ' + unlocked.toUpperCase() + ' unlocked!', C.W/2, C.H/2 + 20);
    }
    ctx.fillStyle = 'rgba(180,180,180,' + alpha + ')';
    ctx.font = FONT_SMALL;
    ctx.fillText('(+' + C.WAVE_HEAL + ' HP restored)', C.W/2, C.H/2 + 50);
    ctx.textAlign = 'left';
  }

  // ── Bard save screen ───────────────────────────────────────────────────────
  function drawBard(ctx, player, waveIndex, theme, cursor) {
    var fg = theme.ui, bg = theme.bg;
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, C.W, C.H);

    var cx = C.W/2;

    // Speech bubble text at top
    ctx.fillStyle = fg;
    ctx.font = FONT_MED;
    ctx.textAlign = 'center';
    ctx.fillText('"Shall I record your tale,', cx, 100);
    ctx.fillText('brave pawn?"', cx, 132);

    // Bard figure below the text
    Draw.bard(ctx, cx, 310, 130, fg);

    // Options
    var optY = 370;
    var opts = ['SAVE  [S / ENTER]', 'CONTINUE  [ESC]'];
    opts.forEach(function(label, i) {
      var selected = cursor === i;
      ctx.font = selected ? 'bold ' + FONT_MED : FONT_SMALL;
      ctx.fillStyle = selected ? fg : (fg === '#ffffff' ? '#888' : '#666');
      ctx.fillText((selected ? '► ' : '  ') + label + (selected ? ' ◄' : ''), cx, optY + i * 36);
    });

    ctx.font = FONT_TINY;
    ctx.fillStyle = fg === '#ffffff' ? '#666' : '#aaa';
    ctx.fillText('↑ ↓  or  ← →  to navigate   ENTER / Z to confirm', cx, C.H - 18);
    ctx.textAlign = 'left';
  }

  // ── Game over ──────────────────────────────────────────────────────────────
  function drawGameOver(ctx, savedWave) {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, C.W, C.H);

    ctx.fillStyle = '#fff';
    ctx.font = FONT_BIG;
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', C.W/2, C.H/2 - 50);

    ctx.font = FONT_MED;
    if (savedWave > 0) {
      ctx.fillText('Restart from Wave ' + savedWave, C.W/2, C.H/2 + 10);
    } else {
      ctx.fillText('Start from the beginning?', C.W/2, C.H/2 + 10);
    }
    ctx.font = FONT_SMALL;
    ctx.fillStyle = '#aaa';
    ctx.fillText('[ENTER / Z] to continue', C.W/2, C.H/2 + 55);
    ctx.textAlign = 'left';
  }

  // ── Pause ──────────────────────────────────────────────────────────────────
  function drawPause(ctx, theme) {
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0, 0, C.W, C.H);
    ctx.fillStyle = '#fff';
    ctx.font = FONT_BIG;
    ctx.textAlign = 'center';
    ctx.fillText('PAUSED', C.W/2, C.H/2);
    ctx.font = FONT_SMALL;
    ctx.fillStyle = '#bbb';
    ctx.fillText('[P / ESC] to resume', C.W/2, C.H/2 + 40);
    ctx.textAlign = 'left';
  }

  // ── Victory / Cutscene ─────────────────────────────────────────────────────
  function drawVictory(ctx, timer, playerColor) {
    var t = timer;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, C.W, C.H);

    // Stars / board fade in
    if (t > 180) {
      var alpha = Math.min(1, (t-180)/40);
      ctx.fillStyle = 'rgba(255,255,255,' + alpha + ')';
      ctx.font = 'bold 36px "Courier New"';
      ctx.textAlign = 'center';
      ctx.fillText('YOU HAVE ASCENDED.', C.W/2, 130);
    }
    if (t > 240) {
      var a2 = Math.min(1, (t-240)/40);
      ctx.fillStyle = 'rgba(200,200,255,' + a2 + ')';
      ctx.font = FONT_MED;
      ctx.textAlign = 'center';
      ctx.fillText('But beyond the board…', C.W/2, 200);
      ctx.fillText('…other worlds await.', C.W/2, 235);
    }
    if (t > 330) {
      var a3 = Math.min(1, (t-330)/50);
      ctx.fillStyle = 'rgba(255,220,100,' + a3 + ')';
      ctx.font = FONT_BIG;
      ctx.textAlign = 'center';
      ctx.fillText('ETERNAL BOARDS', C.W/2, 330);
      ctx.font = FONT_SMALL;
      ctx.fillStyle = 'rgba(180,180,180,' + a3 + ')';
      ctx.fillText('The universe holds more than chess…', C.W/2, 365);
    }
    if (t > 420) {
      var a4 = Math.min(1, (t-420)/30);
      ctx.fillStyle = 'rgba(255,255,255,' + a4 + ')';
      ctx.font = FONT_SMALL;
      ctx.textAlign = 'center';
      ctx.fillText('[ENTER] to return to menu', C.W/2, C.H - 30);
    }
    ctx.textAlign = 'left';
  }

  return {
    drawMenu, drawHUD, drawEnemyCount, drawWaveBanner,
    drawWaveClear, drawBard, drawGameOver, drawPause, drawVictory,
  };
})();
