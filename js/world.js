// ── Adventure world engine: rooms, doors, transitions, essence ──────────────
var World = (function() {

  function create() {
    return {
      roomId: null,
      room: null,
      platforms: [],      // room platforms + unbroken doors
      enemies: [],
      doors: [],          // live door objects this room
      brokenDoors: {},    // persistent: doorId -> true
      bossesDead: {},     // persistent: roomId -> true
      visited: {},        // persistent: roomId -> true
      essenceFx: [],      // floating "+N" particles
      hintKey: null, hintTimer: 0,
      zoneBannerTimer: 0, lastZone: -1,
      bossAlert: 0,
      frame: 0,
    };
  }

  // ── Room loading ───────────────────────────────────────────────────────────
  function loadRoom(w, player, roomId, enterFrom) {
    var room = Rooms.get(roomId);
    if (!room) return;
    w.roomId = roomId;
    w.room = room;
    w.visited[roomId] = true;
    C.ROOM_W = room.w;
    C.ROOM_H = room.h;

    // Doors still standing
    w.doors = (room.doors || []).filter(function(d) { return !w.brokenDoors[d.id]; })
      .map(function(d) {
        return { id:d.id, x:d.x, y:d.y, w:d.w, h:d.h, req:d.req, door:true };
      });
    rebuildPlatforms(w);

    // Enemies respawn on entry; bosses stay dead. Enemies are the opposite
    // side of the player; corrupted pieces are the player's own side.
    var foe = player.enemyColor || '#14110c';
    var own = player.color || '#f7f3e4';
    w.enemies = [];
    (room.enemies || []).forEach(function(spec) {
      var opts = {}; for (var k in spec.opts) opts[k] = spec.opts[k];
      opts.adv = true;
      var e = Enemies.createAt(spec.type, spec.x, room.h - 240, opts.corrupted ? own : foe, opts);
      if (e) w.enemies.push(e);
    });
    if (room.boss && !w.bossesDead[roomId]) {
      var bopts = {}; for (var k2 in room.boss.opts) bopts[k2] = room.boss.opts[k2];
      bopts.adv = true;
      var b = Enemies.createAt(room.boss.type, room.boss.x, room.h - 300, bopts.corrupted ? own : foe, bopts);
      if (b) { w.enemies.push(b); w.bossAlert = 110; Audio.bossRoar(); }
    }

    // Player entry position
    Player.reset(player);
    if (enterFrom === 'left')       player.x = 30;
    else if (enterFrom === 'right') player.x = room.w - 30 - player.w;
    else if (typeof enterFrom === 'number') player.x = enterFrom;
    else player.x = room.bonfire ? room.bonfire + 48 : 60;
    player.y = room.h - 40 - player.h - 2;

    // Zone banner on zone change
    if (room.zone !== w.lastZone) {
      w.zoneBannerTimer = 130;
      w.lastZone = room.zone;
    }
  }

  function rebuildPlatforms(w) {
    w.platforms = w.room.plats.concat(w.doors);
  }

  function breakDoor(w, d) {
    w.brokenDoors[d.id] = true;
    w.doors = w.doors.filter(function(x) { return x.id !== d.id; });
    rebuildPlatforms(w);
    Audio.doorBreak();
  }

  function showHint(w, key) {
    w.hintKey = key; w.hintTimer = 90;
  }

  // ── Update ─────────────────────────────────────────────────────────────────
  // Returns { finalBossDied: bool, stageCleared: zoneIdx|null }
  function update(w, player) {
    w.frame++;
    var events = { finalBossDied: false, stageCleared: null };
    var room = w.room;
    if (!room) return events;

    // Enemies AI
    var living = w.enemies.filter(function(e) { return !e.dead; });
    living.forEach(function(e) { Enemies.update(e, player, w.platforms, living); });

    // Essence on deaths
    w.enemies.forEach(function(e) {
      if (e.dead && !e.essenceGiven) {
        e.essenceGiven = true;
        var amt = C.ESSENCE[e.type] || 5;
        if (e.corrupted) amt *= C.ESSENCE.corruptedMul;
        if (e.boss)      amt *= C.ESSENCE.bossMul;
        player.essence += amt;
        w.essenceFx.push({ x: e.x + e.w/2, y: e.y, n: amt, t: 70 });
        Audio.essence();
        if (e.boss) {
          w.bossesDead[w.roomId] = true;
          if (room.boss && room.boss.final) events.finalBossDied = true;
          else events.stageCleared = room.zone;
        }
      }
    });
    w.essenceFx.forEach(function(f) { f.t--; f.y -= 0.6; });
    w.essenceFx = w.essenceFx.filter(function(f) { return f.t > 0; });

    // Door interactions (in-stage gates)
    var pr = { x: player.x - 6, y: player.y, w: player.w + 12, h: player.h };
    w.doors.slice().forEach(function(d) {
      var touching = Physics.rectOverlap(pr.x, pr.y, pr.w, pr.h, d.x, d.y, d.w, d.h);
      if (d.req === 'crack') {
        if (player.dashTimer > 0 && (player.form === 'tower' || player.form === 'queen') &&
            Physics.rectOverlap(player.x - 14, player.y, player.w + 28, player.h, d.x, d.y, d.w, d.h)) {
          breakDoor(w, d); return;
        }
        if (touching) showHint(w, 'door_crack');
      } else if (d.req === 'shade') {
        for (var i = 0; i < player.magics.length; i++) {
          var m = player.magics[i];
          if (Physics.rectOverlap(m.x - m.r, m.y - m.r, m.r*2, m.r*2, d.x, d.y, d.w, d.h)) {
            player.magics.splice(i, 1);
            breakDoor(w, d); return;
          }
        }
        if (touching) showHint(w, 'door_shade');
      }
    });

    // Room transitions at the edges (within the stage)
    if (player.x <= 0 && room.exits.left) {
      loadRoom(w, player, room.exits.left, 'right');
      return events;
    }
    if (player.x + player.w >= room.w && room.exits.right) {
      loadRoom(w, player, room.exits.right, 'left');
      return events;
    }

    // Fell into a pit: small damage, respawn at room start
    if (player.y > room.h + 50) {
      Player.takeDamage(player, 10);
      player.iframes = 60;
      if (!player.dead) {
        player.x = 60; player.y = room.h - 40 - player.h - 2;
        player.vx = 0; player.vy = 0;
      }
    }

    if (w.hintTimer > 0) w.hintTimer--;
    if (w.zoneBannerTimer > 0) w.zoneBannerTimer--;
    if (w.bossAlert > 0) w.bossAlert--;

    return events;
  }

  // ── Interactables ──────────────────────────────────────────────────────────
  function nearBonfire(w, player) {
    var room = w.room;
    if (!room || !room.bonfire) return false;
    return Math.abs(player.x + player.w/2 - room.bonfire) < 56;
  }
  function nearAltar(w, player) {
    var room = w.room;
    if (!room || !room.altar) return false;
    return Math.abs(player.x + player.w/2 - room.altar) < 56;
  }

  // Rooms-away distance to nearest bonfire (BFS over the room graph)
  function bonfireDistance(w, player) {
    var room = w.room;
    if (!room) return 0;
    if (room.bonfire) return Math.max(1, Math.round(Math.abs(player.x + player.w/2 - room.bonfire) / 32));
    var seen = {}; seen[room.id] = true;
    var queue = [{ id: room.id, d: 0 }];
    while (queue.length) {
      var cur = queue.shift();
      var r = Rooms.get(cur.id);
      if (r.bonfire && cur.d > 0) return cur.d * 50;
      ['left','right'].forEach(function(dir) {
        var next = r.exits[dir];
        if (next && !seen[next]) { seen[next] = true; queue.push({ id: next, d: cur.d + 1 }); }
      });
    }
    return 999;
  }

  // ── Drawing ────────────────────────────────────────────────────────────────

  // Parallax painting behind the world (drawn in screen space, before the
  // camera translate).
  function drawBg(ctx, w, cam) {
    if (!w.room) return;
    Draw.background(ctx, w.room.zone, cam.x, cam.y, w.frame, w.room.w, w.room.h);
  }

  // World-space scenery per zone, placed along the room
  function drawProps(ctx, w) {
    var room = w.room;
    var gy = room.h - 40;
    var zone = room.zone;

    for (var x = 150; x < room.w - 100; x += 300) {
      var s = (x * 7 + zone * 31) | 0;
      var v = Draw.rnd(s);
      if (zone === 0) {
        // Training field: pawn statues and practice banners
        if (v > 0.5) Draw.statue(ctx, 'pawn', x, gy, 64 + Draw.jit(s, 10));
        else {
          // Fence
          ctx.strokeStyle = '#241a30'; ctx.lineWidth = 3; ctx.lineCap = 'round';
          ctx.beginPath(); ctx.moveTo(x - 26, gy); ctx.lineTo(x - 26, gy - 24); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(x + 26, gy); ctx.lineTo(x + 26, gy - 24); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(x - 32, gy - 17); ctx.lineTo(x + 32, gy - 17); ctx.stroke();
        }
      } else if (zone === 1) {
        // Woods: near trees + pale mushrooms
        Draw.deadTree(ctx, x, gy, 150 + Draw.jit(s, 40), s);
        if (v > 0.4) {
          ctx.fillStyle = '#1a1712';
          ctx.beginPath(); ctx.arc(x + 40, gy - 4, 5, Math.PI, 0); ctx.fill();
          ctx.fillStyle = '#f2edda';
          ctx.strokeStyle = '#1a1712'; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.rect(x + 38, gy - 4, 4, 5); ctx.fill(); ctx.stroke();
        }
      } else if (zone === 2) {
        // Cliffs: rock spurs and hanging chains
        ctx.fillStyle = '#57514a';
        ctx.strokeStyle = '#1a1712'; ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(x - 30, gy);
        ctx.lineTo(x - 8, gy - 46 - Draw.jit(s, 16));
        ctx.lineTo(x + 10, gy - 30);
        ctx.lineTo(x + 26, gy);
        ctx.closePath(); ctx.fill(); ctx.stroke();
        if (v > 0.5) Draw.chain(ctx, x + 60, gy - 190, 90, w.frame, s);
      } else if (zone === 3) {
        // Forge: anvils, chimneys, gears
        if (v > 0.55) {
          Draw.gear(ctx, x, gy - 120, 26, w.frame, v > 0.75 ? 1 : -1);
        } else {
          // Anvil
          ctx.fillStyle = '#3a352c'; ctx.strokeStyle = '#0c0a07'; ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.moveTo(x - 18, gy - 18); ctx.lineTo(x + 20, gy - 18);
          ctx.lineTo(x + 12, gy - 10); ctx.lineTo(x + 8, gy - 4);
          ctx.lineTo(x - 8, gy - 4); ctx.lineTo(x - 12, gy - 10);
          ctx.closePath(); ctx.fill(); ctx.stroke();
          // White-hot edge
          ctx.fillStyle = 'rgba(253,251,241,0.85)';
          ctx.fillRect(x - 14, gy - 18, 30, 2);
        }
      } else if (zone === 4) {
        // Battlefield: broken statues, graves, planted swords
        if (v > 0.66)      Draw.statue(ctx, v > 0.8 ? 'knight' : 'rook', x, gy, 76, true);
        else if (v > 0.33) Draw.gravestone(ctx, x, gy, 30, s);
        else {
          // Planted sword
          ctx.save();
          ctx.translate(x, gy);
          ctx.rotate(Draw.jit(s, 0.2));
          ctx.fillStyle = '#a9a28c'; ctx.strokeStyle = '#1a1712'; ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.moveTo(-2.6, -8); ctx.lineTo(-2.6, -42); ctx.lineTo(0, -48); ctx.lineTo(2.6, -42); ctx.lineTo(2.6, -8);
          ctx.closePath(); ctx.fill(); ctx.stroke();
          ctx.fillStyle = '#1a1712';
          ctx.fillRect(-8, -10, 16, 4);
          ctx.restore();
        }
      } else {
        // Castle interior: torches, banners, candelabra
        if (v > 0.6)      Draw.torch(ctx, x, gy - 120, w.frame, 1.1);
        else if (v > 0.3) Draw.bannerFlag(ctx, x, gy - 210, 34, 66, ['♜','♞','♝','♛'][s % 4], w.frame);
        else {
          // Candelabrum
          ctx.strokeStyle = '#1a1712'; ctx.lineWidth = 3; ctx.lineCap = 'round';
          ctx.beginPath(); ctx.moveTo(x, gy); ctx.lineTo(x, gy - 44); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(x - 14, gy - 44); ctx.lineTo(x + 14, gy - 44); ctx.stroke();
          [-14, 0, 14].forEach(function(dx, i) {
            ctx.fillStyle = '#f7f3e4';
            ctx.strokeStyle = '#1a1712'; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.rect(x + dx - 1.6, gy - 54, 3.2, 10); ctx.fill(); ctx.stroke();
            Draw.inkFlame(ctx, x + dx, gy - 54, 2, 7, i * 2.1);
          });
        }
      }
    }

    // Torches flanking bonfires and altars in every zone
    if (room.bonfire) Draw.torch(ctx, room.bonfire - 90, room.h - 40 - 60, w.frame, 0.9);
    if (room.altar) {
      Draw.torch(ctx, room.altar - 70, room.h - 40 - 60, w.frame, 0.9);
      Draw.torch(ctx, room.altar + 70, room.h - 40 - 60, w.frame, 0.9);
    }
  }

  function drawDoors(ctx, w) {
    w.doors.forEach(function(d) {
      if (d.req === 'shade') {
        // Shadow barrier: wavering ink veil
        var a = 0.55 + Math.sin(w.frame * 0.1) * 0.12;
        ctx.fillStyle = 'rgba(26,23,18,' + a + ')';
        ctx.fillRect(d.x, d.y, d.w, d.h);
        Draw.hatchRect(ctx, d.x, d.y, d.w, d.h, 'rgba(242,237,218,0.3)', 5, 1);
      } else {
        // Cracked / sealed stone
        var st = ctx.createLinearGradient(d.x, d.y, d.x + d.w, d.y);
        st.addColorStop(0, '#9a9179'); st.addColorStop(1, '#6e6753');
        ctx.fillStyle = st;
        ctx.fillRect(d.x, d.y, d.w, d.h);
        ctx.strokeStyle = '#1a1712'; ctx.lineWidth = 1.6;
        ctx.strokeRect(d.x + 0.5, d.y + 0.5, d.w - 1, d.h - 1);
        if (d.req === 'crack') {
          ctx.strokeStyle = '#1a1712'; ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(d.x + d.w/2 - 5, d.y + 8);
          ctx.lineTo(d.x + d.w/2 + 4, d.y + d.h*0.4);
          ctx.lineTo(d.x + d.w/2 - 6, d.y + d.h*0.8);
          ctx.stroke();
        }
      }
    });
  }

  function draw(ctx, w, player) {
    var room = w.room;
    if (!room) return;

    drawProps(ctx, w);

    // Platforms (skip doors — drawn separately)
    room.plats.forEach(function(p) {
      Draw.platform(ctx, p, room.zone);
    });
    drawDoors(ctx, w);

    // Bonfire & altar
    var gy = room.h - 40;
    if (room.bonfire) Draw.bonfire(ctx, room.bonfire, gy, null, null, w.frame);
    if (room.altar)   Draw.altar(ctx, room.altar, gy);

    // Enemies & player
    var theme = C.THEME.gothic;
    w.enemies.forEach(function(e) { Enemies.draw(ctx, e, theme); });
    Player.draw(ctx, player, theme);

    // Essence float text
    ctx.font = 'bold 13px ' + C.FONT_GOTH;
    w.essenceFx.forEach(function(f) {
      ctx.globalAlpha = Math.min(1, f.t / 30);
      Draw.essenceShard(ctx, f.x - 14, f.y - 4, 5);
      ctx.fillStyle = theme.goldHi;
      ctx.fillText('+' + f.n, f.x - 6, f.y);
      ctx.globalAlpha = 1;
    });
  }

  return { create, loadRoom, update, draw, drawBg, nearBonfire, nearAltar, bonfireDistance };
})();
