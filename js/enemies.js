var Enemies = (function() {

  function createBase(type, x, y, color) {
    var cfg = C.ENEMY[type];
    return {
      type: type,
      x: x, y: y,
      w: cfg.w, h: cfg.h,
      vx: 0, vy: 0,
      onGround: false,
      color: color,
      hp: cfg.hp, maxHp: cfg.hp,
      spd: cfg.spd,
      dmg: cfg.dmg,
      ar: cfg.ar,
      ac: cfg.ac,
      atkCd: 0,
      atkTimer: 0,    // frames left in swing animation
      atkHit: false,  // whether damage was dealt this swing
      attacking: false,
      iframes: 0,
      facing: -1,
      dead: false,
      shielding: false,
      aiTimer: 0,
      aiState: 'patrol',
    };
  }

  // ── Shared attack helpers ─────────────────────────────────────────────────

  // Start a melee swing
  function beginAttack(e) {
    e.attacking = true;
    e.atkTimer  = C.ATK_DUR;
    e.atkHit    = false;
    e.atkCd     = e.ac;
  }

  // Tick the swing and land damage on the impact frame
  function tickMeleeAttack(e, player) {
    if (e.atkTimer <= 0) return;
    e.atkTimer--;
    if (e.atkTimer === 0) e.attacking = false;

    // Impact frame: past the midpoint of the swing
    var impactFrame = Math.floor(C.ATK_DUR * 0.55);
    if (!e.atkHit && e.atkTimer <= impactFrame) {
      e.atkHit = true;
      var hitbox = {
        x: e.facing > 0 ? e.x + e.w : e.x - e.ar,
        y: e.y, w: e.ar, h: e.h,
      };
      if (Physics.rectOverlap(hitbox.x, hitbox.y, hitbox.w, hitbox.h, player.x, player.y, player.w, player.h)) {
        if (player.shielding && player.abilities.shield && player.facing !== e.facing) {
          // Player blocked — no damage
        } else {
          Player.takeDamage(player, e.dmg);
        }
      }
    }
  }

  // ── Pawn ──────────────────────────────────────────────────────────────────
  function createPawn(x, y, color) {
    return createBase('pawn', x, y, color);
  }

  function updatePawn(e, player, platforms) {
    if (e.dead || player.dead) return;

    tickMeleeAttack(e, player);
    if (e.atkCd > 0) e.atkCd--;

    var dx = (player.x + player.w/2) - (e.x + e.w/2);
    var dist = Math.abs(dx);
    e.facing = dx > 0 ? 1 : -1;

    if (!e.attacking) {
      if (dist > e.ar) {
        e.vx = e.spd * e.facing;
      } else {
        e.vx *= 0.6;
        if (e.atkCd <= 0) beginAttack(e);
      }
    } else {
      e.vx *= 0.5;
    }

    applyPhysics(e, platforms);
  }

  // ── Knight ─────────────────────────────────────────────────────────────────
  function createKnight(x, y, color) {
    var e = createBase('knight', x, y, color);
    e.mounted = true;
    e.h = C.ENEMY.knight.h; // tall when mounted (horse+rider)
    e.dashCd = 0;
    e.dashTimer = 0;
    return e;
  }

  function updateKnight(e, player, platforms) {
    if (e.dead || player.dead) return;
    var dx = (player.x + player.w/2) - (e.x + e.w/2);
    var dist = Math.abs(dx);
    e.facing = dx > 0 ? 1 : -1;

    tickMeleeAttack(e, player);
    if (e.atkCd > 0) e.atkCd--;

    if (e.mounted) {
      if (e.dashTimer > 0) {
        e.vx = C.DASH_V * e.facing;
        e.dashTimer--;
      } else if (dist > 160 && e.dashCd <= 0 && e.onGround && !e.attacking) {
        e.dashTimer = C.DASH_DUR;
        e.dashCd = C.DASH_CD + 30;
        e.vx = C.DASH_V * e.facing;
      } else if (!e.attacking) {
        if (dist > e.ar) {
          e.vx = e.spd * e.facing;
        } else {
          e.vx *= 0.6;
          if (e.atkCd <= 0) beginAttack(e);
        }
      } else {
        e.vx *= 0.5;
      }
      if (e.dashCd > 0) e.dashCd--;
    } else {
      if (!e.attacking) {
        if (dist > e.ar) {
          e.vx = e.spd * 0.65 * e.facing;
        } else {
          e.vx *= 0.6;
          if (e.atkCd <= 0) { beginAttack(e); e.atkCd = e.ac + 10; }
        }
      } else {
        e.vx *= 0.5;
      }
    }

    applyPhysics(e, platforms);
  }

  function dismountKnight(e) {
    e.mounted = false;
    e.h = C.PH;
    e.y += C.ENEMY.knight.h - C.PH;
  }

  // ── Bishop ─────────────────────────────────────────────────────────────────
  function createBishop(x, y, color) {
    var e = createBase('bishop', x, y, color);
    e.spear = null;
    e.spearReturning = false;
    e.preferDist = 180;
    return e;
  }

  function updateBishop(e, player, platforms) {
    if (e.dead || player.dead) return;
    var dx = (player.x + player.w/2) - (e.x + e.w/2);
    var dist = Math.abs(dx);
    e.facing = dx > 0 ? 1 : -1;

    // Maintain preferred distance
    if (!e.spear) {
      if (dist < e.preferDist - 40) {
        e.vx = -e.spd * 0.6 * e.facing; // back away
      } else if (dist > e.preferDist + 40) {
        e.vx = e.spd * 0.6 * e.facing;  // move closer
      } else {
        e.vx *= 0.5;
      }
      // Throw spear when in range and no cooldown
      if (dist < e.ar && e.atkCd <= 0) {
        e.atkCd = e.ac;
        e.spear = {
          x: e.x + (e.facing > 0 ? e.w : -C.SPEAR_W),
          y: e.y + e.h/2 - C.SPEAR_H/2,
          w: C.SPEAR_W, h: C.SPEAR_H,
          vx: C.SPEAR_V * 0.75 * e.facing,
          dir: e.facing,
          dist: 0,
          stuck: false,
        };
      }
    }
    if (e.atkCd > 0) e.atkCd--;

    // Update spear
    if (e.spear) updateBishopSpear(e, player);

    applyPhysics(e, platforms);
  }

  function updateBishopSpear(e, player) {
    var s = e.spear;
    if (e.spearReturning) {
      var tx = e.x + e.w/2 - s.w/2;
      var ty = e.y + e.h/2 - s.h/2;
      var ddx = tx - s.x, ddy = ty - s.y;
      var d = Math.sqrt(ddx*ddx + ddy*ddy);
      if (d < 12) { e.spear = null; e.spearReturning = false; return; }
      var spd = 8;
      s.x += (ddx/d)*spd; s.y += (ddy/d)*spd;
      checkSpearHitPlayer(s, player, e.dmg);
      return;
    }
    if (s.stuck) {
      // Wait a moment then retrieve
      s.dist++; // repurpose dist as stuck timer
      if (s.dist > 90) e.spearReturning = true;
      return;
    }
    s.x += s.vx; s.dist += Math.abs(s.vx);
    if (checkSpearHitPlayer(s, player, e.dmg)) { s.stuck = true; e.spearReturning = true; return; }
    if (s.x < 0 || s.x+s.w > (C.ROOM_W || C.W) || s.dist > C.SPEAR_MAX) {
      s.stuck = true;
      s.dist = 0;
    }
  }

  function checkSpearHitPlayer(s, player, dmg) {
    if (!Physics.rectOverlap(s.x, s.y, s.w, s.h, player.x, player.y, player.w, player.h)) return false;
    if (player.shielding && player.abilities.shield && player.facing !== s.dir) {
      Audio.shield(); return true;
    }
    Player.takeDamage(player, dmg);
    return true;
  }

  // ── Tower ──────────────────────────────────────────────────────────────────
  function createTower(x, y, color) {
    var e = createBase('tower', x, y, color);
    e.shieldUp = false;
    return e;
  }

  function updateTower(e, player, platforms) {
    if (e.dead || player.dead) return;

    tickMeleeAttack(e, player);
    if (e.atkCd > 0) e.atkCd--;

    var dx = (player.x + player.w/2) - (e.x + e.w/2);
    var dist = Math.abs(dx);
    e.facing = dx > 0 ? 1 : -1;

    // Raise shield when player is swinging at the tower
    var playerFacingMe = player.facing === e.facing && dist < 150;
    e.shielding = playerFacingMe && player.atkTimer > 0;

    if (!e.shielding && !e.attacking) {
      if (dist > e.ar) {
        e.vx = e.spd * e.facing;
      } else {
        e.vx *= 0.6;
        if (e.atkCd <= 0) beginAttack(e);
      }
    } else {
      e.vx *= 0.4;
    }

    applyPhysics(e, platforms);
  }

  // ── Queen ──────────────────────────────────────────────────────────────────
  function createQueen(x, y, color) {
    var e = createBase('queen', x, y, color);
    e.mounted = false;
    e.dashCd = 0;
    e.dashTimer = 0;
    e.queenSpear = null;
    e.queenSpearReturning = false;
    e.aiPhase = 0;
    e.aiTimer = 120;
    return e;
  }

  function updateQueen(e, player, platforms) {
    if (e.dead || player.dead) return;
    var dx = (player.x + player.w/2) - (e.x + e.w/2);
    var dist = Math.abs(dx);
    e.facing = dx > 0 ? 1 : -1;

    e.aiTimer--;
    if (e.aiTimer <= 0) {
      e.aiPhase = (e.aiPhase + 1) % 3;
      e.aiTimer = 80 + Math.floor(Math.random()*60);
    }

    // Phase 0: melee rush
    // Phase 1: ranged spear
    // Phase 2: dash attack
    tickMeleeAttack(e, player);
    if (e.atkCd > 0) e.atkCd--;

    if (e.aiPhase === 0) {
      e.shielding = false;
      if (e.dashTimer > 0) { e.vx = C.DASH_V*e.facing; e.dashTimer--; }
      else if (!e.attacking) {
        if (dist > e.ar) { e.vx = e.spd * e.facing; }
        else { e.vx *= 0.6; if (e.atkCd <= 0) beginAttack(e); }
      } else { e.vx *= 0.5; }
    } else if (e.aiPhase === 1) {
      // Ranged — keep distance and throw spear
      if (dist < 150) e.vx = -e.spd * 0.7 * e.facing;
      else e.vx *= 0.5;
      if (!e.queenSpear && e.atkCd <= 0) {
        e.atkCd = e.ac + 20;
        e.queenSpear = {
          x: e.x + (e.facing>0?e.w:-C.SPEAR_W), y: e.y+e.h/2-C.SPEAR_H/2,
          w: C.SPEAR_W, h: C.SPEAR_H, vx: C.SPEAR_V*e.facing,
          dir: e.facing, dist:0, stuck:false,
        };
      }
    } else {
      e.shielding = dist > 60;
      if (!e.shielding && !e.attacking && e.atkCd <= 0) beginAttack(e);
      e.vx *= 0.5;
    }

    if (e.dashCd > 0) e.dashCd--;

    if (e.queenSpear) {
      e.queenSpear.x += e.queenSpear.vx;
      e.queenSpear.dist += Math.abs(e.queenSpear.vx);
      if (checkSpearHitPlayer(e.queenSpear, player, e.dmg)) { e.queenSpear = null; }
      else if (e.queenSpear && e.queenSpear.dist > C.SPEAR_MAX) e.queenSpear = null;
    }

    applyPhysics(e, platforms);
  }

  // ── King ───────────────────────────────────────────────────────────────────
  function createKing(x, y, color) {
    var e = createBase('king', x, y, color);
    e.mounted = false;
    e.dashCd = 0;
    e.dashTimer = 0;
    e.kingSpear = null;
    e.shieldTimer = 0;
    e.teleportCd = 0;
    e.aiPhase = 0;
    e.aiTimer = 100;
    return e;
  }

  function updateKing(e, player, platforms, allEnemies) {
    if (e.dead || player.dead) return;
    var dx = (player.x + player.w/2) - (e.x + e.w/2);
    var dist = Math.abs(dx);
    e.facing = dx > 0 ? 1 : -1;

    e.aiTimer--;
    if (e.aiTimer <= 0) {
      e.aiPhase = (e.aiPhase + 1) % 4;
      e.aiTimer = 70 + Math.floor(Math.random()*60);

      // Teleport swap with a living tower
      if (e.teleportCd <= 0 && allEnemies) {
        var towers = allEnemies.filter(function(t){ return t.type==='tower' && !t.dead; });
        if (towers.length > 0) {
          var t = towers[Math.floor(Math.random()*towers.length)];
          var tx=t.x, ty=t.y;
          t.x=e.x; t.y=e.y;
          e.x=tx; e.y=ty;
          e.teleportCd = 300;
          // Flash effect (brief iframes)
          e.iframes = 20;
          t.iframes = 20;
        }
      }
    }
    if (e.teleportCd > 0) e.teleportCd--;

    tickMeleeAttack(e, player);
    if (e.atkCd > 0) e.atkCd--;

    if (e.aiPhase === 0 || e.aiPhase === 3) {
      e.shielding = false;
      if (e.dashTimer > 0) { e.vx = (C.DASH_V+2)*e.facing; e.dashTimer--; }
      else if (dist > 200 && e.dashCd <= 0 && e.onGround && !e.attacking) {
        e.dashTimer = C.DASH_DUR; e.dashCd = C.DASH_CD;
      }
      else if (!e.attacking) {
        if (dist > e.ar) { e.vx = e.spd * e.facing; }
        else { e.vx *= 0.5; if (e.atkCd <= 0) beginAttack(e); }
      } else { e.vx *= 0.5; }
    } else if (e.aiPhase === 1) {
      if (dist < 180) e.vx = -e.spd * e.facing;
      else e.vx *= 0.5;
      if (!e.kingSpear && e.atkCd <= 0) {
        e.atkCd = e.ac + 10;
        e.kingSpear = {
          x: e.x+(e.facing>0?e.w:-C.SPEAR_W), y: e.y+e.h/2-C.SPEAR_H/2,
          w: C.SPEAR_W+10, h: C.SPEAR_H+2,
          vx: (C.SPEAR_V+2)*e.facing, dir:e.facing, dist:0, stuck:false,
        };
      }
    } else {
      e.shielding = true;
      e.vx *= 0.4;
      if (e.shieldTimer++ > 60) { e.shielding = false; e.shieldTimer=0; e.aiPhase=(e.aiPhase+1)%4; }
    }

    if (e.dashCd > 0) e.dashCd--;
    if (e.iframes > 0) e.iframes--;

    if (e.kingSpear) {
      e.kingSpear.x += e.kingSpear.vx;
      e.kingSpear.dist += Math.abs(e.kingSpear.vx);
      if (checkSpearHitPlayer(e.kingSpear, player, e.dmg+2)) { e.kingSpear = null; }
      else if (e.kingSpear && e.kingSpear.dist > C.SPEAR_MAX+50) e.kingSpear = null;
    }

    applyPhysics(e, platforms);
  }

  // ── Shared ─────────────────────────────────────────────────────────────────

  function applyPhysics(e, platforms) {
    if (e.iframes > 0) e.iframes--;
    Physics.applyGravity(e);
    e.x += e.vx;
    e.y += e.vy;
    Physics.clampX(e);
    var res = Physics.resolvePlatforms(e, platforms);
    e.onGround = res.onGround;

    // Edge avoidance (simple: reverse on ground edges)
    if (e.onGround) {
      // Look ahead for edge
      var lookX = e.x + e.vx * 8 + (e.vx >= 0 ? e.w : 0);
      var onEdge = true;
      for (var i=0; i < platforms.length; i++) {
        var p = platforms[i];
        if (lookX >= p.x && lookX <= p.x+p.w && e.y+e.h >= p.y-2 && e.y+e.h <= p.y+p.h+2) {
          onEdge = false; break;
        }
      }
      if (onEdge && Math.abs(e.vx) > 0.1) { e.vx *= -1; e.facing *= -1; }
    }

    if (Physics.fellOff(e)) { e.dead = true; }
  }

  function update(e, player, platforms, allEnemies) {
    if (e.dead) return;
    if (e.type === 'pawn')   updatePawn(e, player, platforms);
    else if (e.type === 'knight') updateKnight(e, player, platforms);
    else if (e.type === 'bishop') updateBishop(e, player, platforms);
    else if (e.type === 'tower')  updateTower(e, player, platforms);
    else if (e.type === 'queen')  updateQueen(e, player, platforms);
    else if (e.type === 'king')   updateKing(e, player, platforms, allEnemies);
  }

  function draw(ctx, e, theme) {
    if (e.dead) return;
    var col = e.color;
    // Corrupted white pieces: light body with dark corruption scribbles
    if (e.corrupted) col = theme.white || '#fbf8ee';
    // Flicker when invincible
    if (e.iframes > 0 && Math.floor(e.iframes/4) % 2 === 0) col = theme.bg;

    var cx = e.x + e.w/2;
    var cy = e.y + e.h;

    if (e.type === 'pawn') {
      Draw.pawn(ctx, cx, cy, e.h, col);
      Draw.sword(ctx, cx, cy, e.h, col, e.facing, e.attacking);
    }
    else if (e.type === 'knight') {
      Draw.knight(ctx, cx, cy, e.h, col, e.mounted);
      Draw.sword(ctx, cx, cy - (e.mounted ? e.h*0.45 : 0), e.mounted ? e.h*0.55 : e.h, col, e.facing, e.attacking);
    }
    else if (e.type === 'bishop') {
      Draw.bishop(ctx, cx, cy, e.h, col);
      if (e.spear) Draw.spear(ctx, e.spear.x, e.spear.y, C.SPEAR_W, C.SPEAR_H, e.spear.dir, col);
    }
    else if (e.type === 'tower') {
      Draw.tower(ctx, cx, cy, e.h, col);
      if (e.shielding) {
        drawShieldOverlay(ctx, cx, cy, e, col);
      } else {
        Draw.sword(ctx, cx, cy, e.h, col, e.facing, e.attacking);
      }
    }
    else if (e.type === 'queen') {
      Draw.queen(ctx, cx, cy, e.h, col);
      if (e.queenSpear) Draw.spear(ctx, e.queenSpear.x, e.queenSpear.y, C.SPEAR_W, C.SPEAR_H, e.queenSpear.dir, col);
      else if (e.shielding) drawShieldOverlay(ctx, cx, cy, e, col);
      else Draw.sword(ctx, cx, cy, e.h, col, e.facing, e.attacking);
    }
    else if (e.type === 'king') {
      Draw.king(ctx, cx, cy, e.h, col);
      if (e.kingSpear) Draw.spear(ctx, e.kingSpear.x, e.kingSpear.y, C.SPEAR_W+10, C.SPEAR_H+2, e.kingSpear.dir, col);
      else if (e.shielding) drawShieldOverlay(ctx, cx, cy, e, col);
      else Draw.sword(ctx, cx, cy, e.h, col, e.facing, e.attacking);
    }

    // Adventure styling: white skull eyes on black pieces, corruption hatching on white ones
    if (e.adv) {
      if (e.corrupted) {
        Draw.corruption(ctx, e.x, e.y, e.w, e.h, theme.ink || '#000', e.aiTimer + e.x);
      } else {
        Draw.skullFace(ctx, cx, cy, e.h, theme.white || theme.bg);
      }
    }

    // HP bar (bosses get a big bar drawn by the HUD instead)
    if (!e.boss) {
      var barW = e.w + 12, barH = 5;
      Draw.hpBar(ctx, e.x + e.w/2 - barW/2, e.y - 9, barW, barH, e.hp/e.maxHp, e.corrupted ? (theme.ink||col) : col, theme.bg);
    }
  }

  function drawShieldOverlay(ctx, cx, cy, e, col) {
    var sx = cx + e.facing * e.w*0.55;
    var outline = col === '#000000' ? '#ffffff' : '#000000';
    ctx.fillStyle = col; ctx.strokeStyle = outline; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.rect(sx-4, cy-e.h*0.75, 8, e.h*0.55); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.rect(sx-14, cy-e.h*0.65, 28, e.h*0.35); ctx.fill(); ctx.stroke();
  }

  // Create a single enemy at a position (Adventure rooms).
  // opts: { boss:true, corrupted:true, hpMul, dmgMul, scale }
  function createAt(type, x, y, color, opts) {
    opts = opts || {};
    var e;
    if (type === 'pawn')        e = createPawn(x, y, color);
    else if (type === 'knight') e = createKnight(x, y, color);
    else if (type === 'bishop') e = createBishop(x, y, color);
    else if (type === 'tower')  e = createTower(x, y, color);
    else if (type === 'queen')  e = createQueen(x, y, color);
    else if (type === 'king')   e = createKing(x, y, color);
    if (!e) return null;
    if (opts.scale) {
      e.w = Math.round(e.w * opts.scale);
      e.h = Math.round(e.h * opts.scale);
    }
    if (opts.hpMul)  { e.hp = Math.round(e.hp * opts.hpMul); e.maxHp = e.hp; }
    if (opts.dmgMul) e.dmg = Math.round(e.dmg * opts.dmgMul);
    e.boss = !!opts.boss;
    e.corrupted = !!opts.corrupted;
    e.adv = !!opts.adv; // adventure styling (skull eyes)
    return e;
  }

  function spawnWave(waveConfig, theme, canvasW, canvasH, platforms) {
    var enemies = [];
    var col = theme.fg; // enemies are opposite color from bg
    var spawnXs = [80, 180, 620, 720, 350, 450, 140, 660];
    var idx = 0;

    waveConfig.enemies.forEach(function(group) {
      for (var i = 0; i < group.count; i++) {
        var sx = spawnXs[idx % spawnXs.length] + (Math.random()-0.5)*30;
        idx++;
        // Find a platform to spawn on
        var sy = 50;
        var e;
        if (group.type === 'pawn')   e = createPawn(sx, sy, col);
        else if (group.type === 'knight') e = createKnight(sx, sy, col);
        else if (group.type === 'bishop') e = createBishop(sx, sy, col);
        else if (group.type === 'tower')  e = createTower(sx, sy, col);
        else if (group.type === 'queen')  e = createQueen(sx, sy, col);
        else if (group.type === 'king')   e = createKing(sx, sy, col);
        if (e) enemies.push(e);
      }
    });
    return enemies;
  }

  return { update, draw, spawnWave, createAt, dismountKnight };
})();
