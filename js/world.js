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

    // Enemies respawn on entry; bosses stay dead
    w.enemies = [];
    (room.enemies || []).forEach(function(spec) {
      var opts = {}; for (var k in spec.opts) opts[k] = spec.opts[k];
      opts.adv = true;
      var e = Enemies.createAt(spec.type, spec.x, room.h - 240, C.THEME.paper.ink, opts);
      if (e) w.enemies.push(e);
    });
    if (room.boss && !w.bossesDead[roomId]) {
      var bopts = {}; for (var k2 in room.boss.opts) bopts[k2] = room.boss.opts[k2];
      bopts.adv = true;
      var b = Enemies.createAt(room.boss.type, room.boss.x, room.h - 300, C.THEME.paper.ink, bopts);
      if (b) { w.enemies.push(b); w.bossAlert = 110; Audio.bossRoar(); }
    }

    // Player entry position
    Player.reset(player);
    if (enterFrom === 'left')       player.x = 30;
    else if (enterFrom === 'right') player.x = room.w - 30 - player.w;
    else if (typeof enterFrom === 'number') player.x = enterFrom;
    else player.x = room.bonfire ? room.bonfire - 40 : 60;
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
  // Returns { finalBossDied: bool }
  function update(w, player) {
    w.frame++;
    var events = { finalBossDied: false };
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
        }
      }
    });
    w.essenceFx.forEach(function(f) { f.t--; f.y -= 0.6; });
    w.essenceFx = w.essenceFx.filter(function(f) { return f.t > 0; });

    // Boss doors open when the room's boss is gone
    if (w.bossesDead[w.roomId]) {
      w.doors.filter(function(d) { return d.req === 'boss'; })
        .forEach(function(d) { breakDoor(w, d); });
    }

    // Door interactions
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
      } else if (d.req === 'queen') {
        if (touching) {
          if (player.forms.queen) { breakDoor(w, d); return; }
          showHint(w, 'door_queen');
        }
      } else if (d.req === 'boss') {
        if (touching) showHint(w, 'door_boss');
      }
    });

    // Room transitions at the edges
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
  function drawProps(ctx, w) {
    var room = w.room, t = C.THEME.paper;
    var gy = room.h - 40;
    var zone = room.zone;
    // Per-zone scribbled background props, spaced along the room
    for (var x = 150; x < room.w - 100; x += 320) {
      var s = x * 7 + zone * 31;
      ctx.globalAlpha = 0.55;
      if (zone === 1) { // woods: scribble tree
        Draw.inkLine(ctx, x, gy, x, gy - 70, t.ink, 2.5, s);
        for (var b = 0; b < 3; b++)
          Draw.inkLine(ctx, x, gy - 40 - b*12, x + (b%2?28:-26), gy - 58 - b*12, t.ink, 1.6, s+b);
      } else if (zone === 2) { // cliffs: jagged rock
        Draw.inkLine(ctx, x - 26, gy, x, gy - 44, t.ink, 2, s);
        Draw.inkLine(ctx, x, gy - 44, x + 22, gy, t.ink, 2, s+1);
      } else if (zone === 3) { // forge: chimney with smoke
        Draw.inkRect(ctx, x - 12, gy - 60, 24, 60, t.ink, s, true);
        ctx.globalAlpha = 0.35;
        for (var sm = 0; sm < 3; sm++) {
          var oy = (w.frame * 0.4 + sm * 22) % 66;
          ctx.beginPath();
          ctx.arc(x + Math.sin((w.frame + sm*40) * 0.03) * 6, gy - 70 - oy, 5 + sm, 0, Math.PI*2);
          ctx.strokeStyle = t.ink; ctx.lineWidth = 1.2; ctx.stroke();
        }
      } else if (zone === 4) { // battlefield: planted broken spear
        Draw.inkLine(ctx, x, gy, x + 8, gy - 52, t.ink, 2, s);
        Draw.inkLine(ctx, x - 9, gy - 34, x + 19, gy - 42, t.ink, 1.6, s+2);
      } else if (zone === 5) { // castle: hanging banner
        Draw.inkLine(ctx, x - 14, gy - 150, x + 14, gy - 150, t.ink, 2, s);
        ctx.fillStyle = t.ink; ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.moveTo(x - 10, gy - 150); ctx.lineTo(x + 10, gy - 150);
        ctx.lineTo(x + 10, gy - 105); ctx.lineTo(x, gy - 92); ctx.lineTo(x - 10, gy - 105);
        ctx.closePath(); ctx.fill();
      } else { // training field: fence post
        Draw.inkLine(ctx, x, gy, x, gy - 26, t.ink, 2, s);
        Draw.inkLine(ctx, x - 18, gy - 18, x + 18, gy - 18, t.ink, 1.6, s+1);
      }
      ctx.globalAlpha = 1;
    }
    // Castle zone: battlement line across the top
    if (zone === 5) {
      ctx.globalAlpha = 0.5;
      for (var bx = 0; bx < room.w; bx += 56)
        Draw.inkRect(ctx, bx, 22, 30, 18, t.ink, bx, false);
      ctx.globalAlpha = 1;
    }
  }

  function drawDoors(ctx, w) {
    var t = C.THEME.paper;
    w.doors.forEach(function(d) {
      if (d.req === 'shade') {
        // Shadow barrier: solid dark, wavering
        ctx.fillStyle = t.ink;
        ctx.globalAlpha = 0.8 + Math.sin(w.frame * 0.1) * 0.12;
        ctx.fillRect(d.x, d.y, d.w, d.h);
        ctx.globalAlpha = 1;
      } else if (d.req === 'crack') {
        Draw.inkRect(ctx, d.x, d.y, d.w, d.h, t.ink, d.x, true);
        // Crack zigzag
        Draw.inkLine(ctx, d.x + d.w/2 - 5, d.y + 8, d.x + d.w/2 + 4, d.y + d.h*0.4, t.ink, 1.6, d.x+1);
        Draw.inkLine(ctx, d.x + d.w/2 + 4, d.y + d.h*0.4, d.x + d.w/2 - 6, d.y + d.h*0.8, t.ink, 1.6, d.x+2);
      } else if (d.req === 'queen') {
        Draw.inkRect(ctx, d.x, d.y, d.w, d.h, t.ink, d.x, true);
        ctx.font = '16px ' + C.FONT_HAND;
        ctx.fillStyle = t.paper; ctx.textAlign = 'center';
        ctx.fillText('♛', d.x + d.w/2, d.y + d.h/2);
        ctx.textAlign = 'left';
      } else { // boss seal
        Draw.inkRect(ctx, d.x, d.y, d.w, d.h, t.ink, d.x, true);
      }
    });
  }

  function draw(ctx, w, player) {
    var room = w.room, t = C.THEME.paper;
    if (!room) return;

    drawProps(ctx, w);

    // Platforms (skip doors — drawn separately)
    room.plats.forEach(function(p) {
      ctx.fillStyle = t.paper;
      ctx.fillRect(p.x, p.y, p.w, p.h);
      Draw.inkRect(ctx, p.x, p.y, p.w, p.h, t.ink, p.x + p.y, true);
    });
    drawDoors(ctx, w);

    // Bonfire & altar
    var gy = room.h - 40;
    if (room.bonfire) Draw.bonfire(ctx, room.bonfire, gy, t.ink, t.paper, w.frame);
    if (room.altar)   Draw.altar(ctx, room.altar, gy, t.ink, t.paper);

    // Enemies & player
    w.enemies.forEach(function(e) { Enemies.draw(ctx, e, t); });
    Player.draw(ctx, player, t);

    // Essence float text
    ctx.font = '13px ' + C.FONT_HAND;
    w.essenceFx.forEach(function(f) {
      ctx.globalAlpha = Math.min(1, f.t / 30);
      Draw.essenceShard(ctx, f.x - 14, f.y - 4, 5, t.ink);
      ctx.fillStyle = t.ink;
      ctx.fillText('+' + f.n, f.x - 6, f.y);
      ctx.globalAlpha = 1;
    });
  }

  return { create, loadRoom, update, draw, nearBonfire, nearAltar, bonfireDistance };
})();
