var Player = (function() {

  function create(color) {
    return {
      x: C.W/2 - C.PW/2,
      y: C.H - 200,
      w: C.PW, h: C.PH,
      vx: 0, vy: 0,
      onGround: false,
      color: color,        // '#000000' or '#ffffff'
      enemyColor: color === '#000000' ? '#ffffff' : '#000000',

      hp: C.PHP, maxHp: C.PHP,
      facing: 1,           // 1 = right, -1 = left
      attacking: false,
      atkTimer: 0,
      atkCd: 0,
      shielding: false,
      iframes: 0,          // invincibility frames

      // Abilities
      abilities: { dash:false, spear:false, shield:false },
      dashTimer: 0,
      dashCd: 0,
      mounted: false,      // true when dash unlocked AND hp > 50%
      mountW: C.PW, mountH: C.PH,

      // Spear
      spearOut: null,      // projectile object or null
      spearReturning: false,

      dead: false,
      score: 0,
    };
  }

  function update(p, inp, platforms, enemies) {
    if (p.dead) return;

    var onGround = p.onGround;

    // Horizontal movement
    if (!p.dashTimer) {
      if (inp.left)  { p.vx = -C.PSPD; p.facing = -1; }
      else if (inp.right) { p.vx =  C.PSPD; p.facing =  1; }
      else           { p.vx *= 0.72; if (Math.abs(p.vx) < 0.1) p.vx = 0; }
    }

    // Jump
    if (inp.jumpJustPressed && onGround) {
      p.vy = C.PJUMP;
      Audio.jump();
    }

    // Dash
    if (inp.dashJustPressed && p.abilities.dash && p.mounted && p.dashCd <= 0 && !p.dashTimer) {
      p.dashTimer = C.DASH_DUR;
      p.iframes = C.DASH_IF;
      p.vx = C.DASH_V * p.facing;
      p.dashCd = C.DASH_CD;
      Audio.dash();
    }

    // Dash timer
    if (p.dashTimer > 0) {
      p.dashTimer--;
      p.vx = C.DASH_V * p.facing;
      if (p.dashTimer === 0) p.vx = 0;
    }

    // Attack
    if (inp.attackJustPressed && p.atkCd <= 0 && !p.shielding) {
      p.attacking = true;
      p.atkTimer = C.ATK_DUR;
      p.atkCd = C.ATK_CD;
      Audio.swing();
      // Check hits
      var hitbox = {
        x: p.facing > 0 ? p.x + p.w : p.x - C.ATK_RANGE,
        y: p.y,
        w: C.ATK_RANGE, h: p.h,
      };
      enemies.forEach(function(e) {
        if (!e.dead && Physics.rectOverlap(hitbox.x, hitbox.y, hitbox.w, hitbox.h, e.x, e.y, e.w, e.h)) {
          if (e.shielding && e.facing !== p.facing) {
            Audio.shield(); return; // tower blocked
          }
          var dmg = C.ATK_DMG;
          e.hp -= dmg;
          e.iframes = 12;
          e.vx += p.facing * C.ATK_KNOCKBACK;
          Audio.hit();
          if (e.hp <= 0) { e.dead = true; Audio.enemyDie(); }
          else if (e.type === 'knight' && e.mounted && e.hp < e.maxHp * 0.5) {
            dismountKnight(e);
          }
        }
      });
    }
    if (p.atkTimer > 0) { p.atkTimer--; if (p.atkTimer === 0) p.attacking = false; }
    if (p.atkCd > 0) p.atkCd--;

    // Spear throw / retrieve
    if (inp.spearJustPressed && p.abilities.spear) {
      if (!p.spearOut) {
        p.spearOut = {
          x: p.x + (p.facing > 0 ? p.w : -C.SPEAR_W),
          y: p.y + p.h/2 - C.SPEAR_H/2,
          w: C.SPEAR_W, h: C.SPEAR_H,
          vx: C.SPEAR_V * p.facing,
          dir: p.facing,
          dist: 0,
          stuck: false,
          stuckX: 0, stuckY: 0,
        };
        Audio.spearThrow();
      } else {
        // Retrieve
        p.spearOut.stuck = false;
        p.spearReturning = true;
      }
    }

    // Shield
    p.shielding = inp.shield && p.abilities.shield;
    if (p.shielding) Audio.shield && null; // just holding, no repeat sound

    // Timers
    if (p.dashCd > 0) p.dashCd--;
    if (p.iframes > 0) p.iframes--;
    if (p.atkCd > 0) {}; // already decremented above

    // Gravity & physics
    Physics.applyGravity(p);
    p.x += p.vx;
    p.y += p.vy;
    Physics.clampX(p);
    var res = Physics.resolvePlatforms(p, platforms);
    p.onGround = res.onGround;
    if (Physics.fellOff(p)) { p.y = -p.h; p.vy = 0; } // respawn above — rare

    // Mount state: lose horse below 50% HP, regain above 50%
    if (p.abilities.dash) {
      var wasMounted = p.mounted;
      if (wasMounted && p.hp < p.maxHp * 0.5) {
        p.mounted = false;
      } else if (!wasMounted && p.hp >= p.maxHp * 0.5) {
        p.mounted = true;
      }
      if (wasMounted && !p.mounted) {
        p.w = C.PW; p.h = C.PH;
      }
    }

    // Update spear projectile
    if (p.spearOut) updateSpear(p, enemies, platforms);
  }

  function dismountKnight(e) {
    e.mounted = false;
    e.w = C.ENEMY.knight.w;
    e.h = C.PH; // dismounted height
    e.y += 20; // drop to ground level approx
  }

  function updateSpear(p, enemies, platforms) {
    var s = p.spearOut;
    if (!s) return;

    if (p.spearReturning) {
      // Fly back to player
      var tx = p.x + p.w/2 - s.w/2;
      var ty = p.y + p.h/2 - s.h/2;
      var dx = tx - s.x, dy = ty - s.y;
      var dist = Math.sqrt(dx*dx + dy*dy);
      if (dist < 10) {
        p.spearOut = null;
        p.spearReturning = false;
        return;
      }
      var spd = 10;
      s.x += (dx/dist) * spd;
      s.y += (dy/dist) * spd;
      // Hit enemies on return too
      checkSpearHits(s, enemies, p);
      return;
    }

    if (s.stuck) return; // embedded

    s.x += s.vx;
    s.dist += Math.abs(s.vx);

    // Hit enemies
    if (checkSpearHits(s, enemies, p)) return;

    // Hit platforms or walls
    for (var i = 0; i < platforms.length; i++) {
      var pl = platforms[i];
      if (Physics.rectOverlap(s.x, s.y, s.w, s.h, pl.x, pl.y, pl.w, pl.h)) {
        s.stuck = true;
        s.vx = 0;
        return;
      }
    }
    if (s.x < 0 || s.x + s.w > C.W || s.dist > C.SPEAR_MAX) {
      s.stuck = true;
      s.vx = 0;
    }
  }

  function checkSpearHits(s, enemies, p) {
    for (var i = 0; i < enemies.length; i++) {
      var e = enemies[i];
      if (e.dead) continue;
      if (Physics.rectOverlap(s.x, s.y, s.w, s.h, e.x, e.y, e.w, e.h)) {
        if (e.shielding && e.facing !== s.dir) { s.stuck = true; Audio.shield(); return true; }
        e.hp -= C.SPEAR_DMG;
        e.iframes = 12;
        e.vx += s.dir * 3;
        Audio.spearHit();
        if (e.hp <= 0) { e.dead = true; Audio.enemyDie(); }
        else if (e.type === 'knight' && e.mounted && e.hp < e.maxHp * 0.5) {
          dismountKnight(e);
        }
        s.stuck = true;
        // Auto-retrieve after hitting
        p.spearReturning = true;
        return true;
      }
    }
    return false;
  }

  function takeDamage(p, dmg) {
    if (p.iframes > 0 || p.dead) return;
    if (p.shielding) dmg = Math.round(dmg * (1 - C.SHIELD_BLOCK));
    p.hp -= dmg;
    p.iframes = 40;
    Audio.playerHurt();
    if (p.hp <= 0) { p.hp = 0; p.dead = true; Audio.gameOver(); }
  }

  function heal(p, amount) {
    p.hp = Math.min(p.maxHp, p.hp + amount);
    // Re-mount check
    if (p.abilities.dash && p.hp > p.maxHp * 0.5) p.mounted = true;
  }

  function unlockAbility(p, ability) {
    p.abilities[ability] = true;
    if (ability === 'dash') p.mounted = true; // always get horse on first unlock
    Input.unlockAbility(ability);
  }

  function reset(p) {
    p.x = C.W/2 - C.PW/2;
    p.y = C.H - 200;
    p.vx = 0; p.vy = 0;
    p.onGround = false;
    p.attacking = false; p.atkTimer = 0; p.atkCd = 0;
    p.shielding = false;
    p.iframes = 0;
    p.dashTimer = 0; p.dashCd = 0;
    p.spearOut = null; p.spearReturning = false;
    p.dead = false;
  }

  function draw(ctx, p, theme) {
    if (p.dead) return;
    var col = p.color;
    // Flicker when invincible
    if (p.iframes > 0 && Math.floor(p.iframes / 4) % 2 === 0) return;

    var cx = p.x + p.w/2;
    var cy = p.y + p.h;
    Draw.player(ctx, cx, cy, p.h, col, p.facing, p.attacking, p.shielding, p.mounted, p.abilities);

    // Spear projectile
    if (p.spearOut) {
      Draw.spear(ctx, p.spearOut.x, p.spearOut.y, C.SPEAR_W, C.SPEAR_H, p.spearOut.dir, col);
    }

    // HP bar (above player)
    var barW = 50, barH = 6;
    Draw.hpBar(ctx, p.x + p.w/2 - barW/2, p.y - 10, barW, barH,
      p.hp / p.maxHp, col, theme.bg);
  }

  return { create, update, draw, takeDamage, heal, unlockAbility, reset, dismountKnight };
})();
