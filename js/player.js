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

      // Adventure mode (Metroidvania)
      adventure: false,
      form: 'pawn',                       // active promotion
      forms: { pawn:true, tower:false, knight:false, bishop:false, queen:false },
      skills: { vigor:false, spear:false, calm:false, destroyer:false, hdash:false, dmagic:false },
      essence: 0,
      airJumps: 0,         // knight L-jump charges
      magics: [],          // bishop magic bolts
      magicCd: 0,
      healCd: 0,
      calmTimer: 0,
      regening: false,

      dead: false,
      score: 0,
    };
  }

  // Damage of one melee hit, with form/skill modifiers
  function meleeDamage(p) {
    var dmg = C.ATK_DMG;
    if (p.adventure) {
      dmg *= C.FORM[p.form].dmg;
      if (p.skills.destroyer) dmg *= 1.5;
    }
    return Math.round(dmg);
  }

  function dashAllowed(p) {
    if (p.adventure) return p.form === 'tower' || p.form === 'queen';
    return p.abilities.dash && p.mounted;
  }

  function update(p, inp, platforms, enemies) {
    if (p.dead) return;

    var onGround = p.onGround;

    // Horizontal movement
    var spd = C.PSPD * (p.adventure ? C.FORM[p.form].spd : 1);
    if (!p.dashTimer) {
      if (inp.left)  { p.vx = -spd; p.facing = -1; }
      else if (inp.right) { p.vx =  spd; p.facing =  1; }
      else           { p.vx *= 0.72; if (Math.abs(p.vx) < 0.1) p.vx = 0; }
    }

    // Jump (+ Knight L-jump in mid-air)
    if (inp.jumpJustPressed) {
      if (onGround) {
        p.vy = C.PJUMP;
        if (p.adventure) p.airJumps = (p.form === 'knight' || p.form === 'queen') ? 1 : 0;
        Audio.jump();
      } else if (p.adventure && p.airJumps > 0) {
        p.airJumps--;
        p.vy = C.PJUMP * 0.92;
        p.vx = p.facing * spd * 1.4; // the "L" — a sideways kick
        Audio.dash();
      }
    }
    if (onGround && p.adventure) p.airJumps = (p.form === 'knight' || p.form === 'queen') ? 1 : 0;

    // Dash (Survive: horse / Adventure: Tower form)
    var dashCdMax = (p.adventure && p.skills.hdash) ? Math.round(C.DASH_CD * 0.55) : C.DASH_CD;
    if (inp.dashJustPressed && dashAllowed(p) && p.dashCd <= 0 && !p.dashTimer) {
      p.dashTimer = C.DASH_DUR;
      p.iframes = C.DASH_IF;
      p.vx = C.DASH_V * p.facing;
      p.dashCd = dashCdMax;
      Audio.dash();
    }

    // Dash timer
    if (p.dashTimer > 0) {
      p.dashTimer--;
      p.vx = C.DASH_V * p.facing;
      if (p.dashTimer === 0) p.vx = 0;
    }

    // Attack (Knight form: spinning attack hits both sides with longer reach)
    if (inp.attackJustPressed && p.atkCd <= 0 && !p.shielding) {
      p.attacking = true;
      p.atkTimer = C.ATK_DUR;
      p.atkCd = C.ATK_CD;
      Audio.swing();
      var spin = p.adventure && (p.form === 'knight' || p.form === 'queen');
      var range = spin ? Math.round(C.ATK_RANGE * 1.4) : C.ATK_RANGE;
      var hitbox = spin
        ? { x: p.x - range, y: p.y - 6, w: p.w + range*2, h: p.h + 6 }
        : { x: p.facing > 0 ? p.x + p.w : p.x - range, y: p.y, w: range, h: p.h };
      enemies.forEach(function(e) {
        if (!e.dead && Physics.rectOverlap(hitbox.x, hitbox.y, hitbox.w, hitbox.h, e.x, e.y, e.w, e.h)) {
          if (e.shielding && e.facing !== p.facing && !spin) {
            Audio.shield(); return; // tower blocked
          }
          var dmg = meleeDamage(p);
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

    // Power button (Q):
    //  Survive / Pawn-with-skill / Queen → spear throw
    //  Adventure Bishop / Queen → magic bolt
    var canThrow = p.adventure
      ? ((p.form === 'pawn' && p.skills.spear) || p.form === 'queen' || (p.form === 'tower' && p.skills.spear) || (p.form === 'knight' && p.skills.spear))
      : p.abilities.spear;
    var canMagic = p.adventure && (p.form === 'bishop' || p.form === 'queen');

    if (inp.spearJustPressed && canMagic && p.magicCd <= 0) {
      // Magic bolt: flies straight ahead
      var mdmg = C.MAGIC_DMG * (p.skills.dmagic ? 1.6 : 1) * (p.skills.destroyer ? 1.3 : 1);
      p.magics.push({
        x: p.x + p.w/2 + p.facing * p.w,
        y: p.y + p.h * 0.4,
        vx: C.MAGIC_V * p.facing,
        vy: 0,
        r: C.MAGIC_R * (p.skills.dmagic ? 1.4 : 1),
        dmg: Math.round(mdmg),
        dist: 0, dir: p.facing,
      });
      p.magicCd = C.MAGIC_CD;
      Audio.magic();
    } else if (inp.spearJustPressed && canThrow) {
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

    // Shield (Survive) / Heal prayer (Adventure Bishop/Queen on E)
    if (p.adventure) {
      p.shielding = false;
      if (inp.shieldJustPressed && (p.form === 'bishop' || p.form === 'queen') && p.healCd <= 0 && p.hp < p.maxHp) {
        heal(p, C.HEAL_AMOUNT);
        p.healCd = C.HEAL_CD;
        Audio.heal();
      }
    } else {
      p.shielding = inp.shield && p.abilities.shield;
    }

    // Slow regeneration while standing still (the Still Healing skill speeds it up)
    var still = Math.abs(p.vx) < 0.2 && p.onGround && !p.attacking && !p.shielding;
    p.calmTimer = still ? p.calmTimer + 1 : 0;
    var regenDelay    = p.skills.calm ? 30 : 60;  // frames still before it kicks in
    var regenInterval = p.skills.calm ? 30 : 45;  // frames between ticks
    var regenAmount   = p.skills.calm ? 2 : 1;
    p.regening = still && p.hp < p.maxHp && p.calmTimer > regenDelay;
    if (p.regening && p.calmTimer % regenInterval === 0) {
      heal(p, regenAmount);
    }

    // Timers
    if (p.dashCd > 0) p.dashCd--;
    if (p.iframes > 0) p.iframes--;
    if (p.magicCd > 0) p.magicCd--;
    if (p.healCd > 0) p.healCd--;

    // Magic bolts
    if (p.magics.length) updateMagics(p, enemies, platforms);

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
    if (s.x < 0 || s.x + s.w > (C.ROOM_W || C.W) || s.dist > C.SPEAR_MAX) {
      s.stuck = true;
      s.vx = 0;
    }
  }

  // Bishop/Queen magic bolts
  function updateMagics(p, enemies, platforms) {
    for (var i = p.magics.length - 1; i >= 0; i--) {
      var m = p.magics[i];
      m.x += m.vx; m.y += m.vy;
      m.dist += Math.abs(m.vx) + Math.abs(m.vy);
      var remove = false;

      for (var j = 0; j < enemies.length; j++) {
        var e = enemies[j];
        if (e.dead) continue;
        if (Physics.rectOverlap(m.x - m.r, m.y - m.r, m.r*2, m.r*2, e.x, e.y, e.w, e.h)) {
          e.hp -= m.dmg;
          e.iframes = 12;
          Audio.spearHit();
          if (e.hp <= 0) { e.dead = true; Audio.enemyDie(); }
          else if (e.type === 'knight' && e.mounted && e.hp < e.maxHp * 0.5) dismountKnight(e);
          remove = true;
          break;
        }
      }
      // Shade doors are broken by World (it scans p.magics); platforms stop bolts
      if (!remove) {
        for (var k = 0; k < platforms.length; k++) {
          var pl = platforms[k];
          if (pl.door) continue; // pass through door checks — World resolves those
          if (Physics.rectOverlap(m.x - m.r, m.y - m.r, m.r*2, m.r*2, pl.x, pl.y, pl.w, pl.h)) { remove = true; break; }
        }
      }
      if (m.dist > C.MAGIC_MAX || m.y < -40 || m.x < -40 || m.x > (C.ROOM_W || C.W) + 40) remove = true;
      if (remove) p.magics.splice(i, 1);
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
    if (p.adventure) dmg = Math.max(1, Math.round(dmg * C.FORM[p.form].def));
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
    p.magics = []; p.magicCd = 0; p.healCd = 0; p.calmTimer = 0; p.airJumps = 0;
    p.dead = false;
  }

  function draw(ctx, p, theme) {
    if (p.dead) return;
    var col = p.color;
    // Flicker when invincible
    if (p.iframes > 0 && Math.floor(p.iframes / 4) % 2 === 0) return;

    var cx = p.x + p.w/2;
    var cy = p.y + p.h;

    if (p.adventure) {
      var ink = theme.ink || theme.fg;
      Draw.hero(ctx, cx, cy, p.h, p.color, ink, p.facing, p.attacking, p.dashTimer > 0, p.form);
      if (p.spearOut) Draw.spear(ctx, p.spearOut.x, p.spearOut.y, C.SPEAR_W, C.SPEAR_H, p.spearOut.dir, p.color);
      p.magics.forEach(function(m) { Draw.magicBolt(ctx, m.x, m.y, m.r, ink, m.dist); });
      if (p.regening) Draw.healPulse(ctx, cx, p.y - 14, p.calmTimer, ink);
      return; // health shown on the HUD bar
    }

    Draw.player(ctx, cx, cy, p.h, col, p.facing, p.attacking, p.shielding, p.mounted, p.abilities);
    if (p.regening) Draw.healPulse(ctx, cx, p.y - 16, p.calmTimer, col);

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
