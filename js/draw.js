// ── Art library: cartoon chess pieces, hand-drawn black & white on paper ─────
// Every character is a chunky cartoon chess piece: thick ink outlines,
// grayscale shading, expressive eyes (white pieces get ink eyes, black pieces
// get pale skull-white eyes). Backgrounds are layered pencil-tone paintings.
var Draw = (function() {

  function G() { return C.THEME.gothic; }

  // Animation clock for draw calls that have no frame parameter
  function tick() { return (Date.now() / 16.7) | 0; }

  // ── Deterministic jitter (stable pseudo-random per seed) ───────────────────
  function jit(seed, mag) {
    var s = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
    return ((s - Math.floor(s)) - 0.5) * 2 * mag;
  }
  function rnd(seed) { // 0..1
    var s = Math.sin(seed * 91.7 + 47.3) * 24634.6345;
    return s - Math.floor(s);
  }

  // ── Palettes ────────────────────────────────────────────────────────────────
  function isDarkColor(color) {
    var c = String(color || '#000').toLowerCase().replace(/^#/, '');
    if (c.length === 3) c = c[0]+c[0]+c[1]+c[1]+c[2]+c[2];
    var r = parseInt(c.slice(0,2),16) || 0, g2 = parseInt(c.slice(2,4),16) || 0, b = parseInt(c.slice(4,6),16) || 0;
    return (r*0.3 + g2*0.6 + b*0.1) < 110;
  }

  function palFor(color) {
    var g = G();
    if (isDarkColor(color)) {
      return { body:g.onyx, hi:g.onyxHi, lo:g.onyxLo, dk:g.onyxDk,
               outline:g.outline, eye:g.eye, eyeGlow:g.eyeGlow, glowing:true };
    }
    return { body:g.ivory, hi:g.ivoryHi, lo:g.ivoryLo, dk:g.ivoryDk,
             outline:g.outlineW, eye:'#1a1712', eyeGlow:null, glowing:false };
  }

  // Vertical body gradient
  function bodyGrad(ctx, x, y, h2, p) {
    var gr = ctx.createLinearGradient(x - h2*0.4, y - h2, x + h2*0.5, y);
    gr.addColorStop(0, p.hi);
    gr.addColorStop(0.45, p.body);
    gr.addColorStop(1, p.lo);
    return gr;
  }

  function setPiece(ctx, cx, cy, h, p) {
    ctx.fillStyle = bodyGrad(ctx, cx, cy, h, p);
    ctx.strokeStyle = p.outline;
    ctx.lineWidth = Math.max(1.6, h * 0.055);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
  }

  // Cartoon eyes. mood: 'mean' (angled brows), 'calm'
  function eyes(ctx, cx, ey, s, p, facing, mood) {
    var dx = (facing || 0) * s * 0.25;
    if (p.glowing) {
      // Pale skull-white eyes on the black pieces
      ctx.save();
      if (p.eyeGlow) { ctx.shadowColor = p.eyeGlow; ctx.shadowBlur = s * 1.2; }
      ctx.fillStyle = p.eye;
      [-1, 1].forEach(function(side) {
        ctx.beginPath();
        ctx.ellipse(cx + side*s*0.85 + dx, ey, s*0.55, s*0.34, side * (mood==='mean'? 0.45:0.15), 0, Math.PI*2);
        ctx.fill();
      });
      ctx.restore();
    } else {
      ctx.fillStyle = p.eye;
      [-1, 1].forEach(function(side) {
        ctx.beginPath();
        ctx.ellipse(cx + side*s*0.8 + dx, ey, s*0.42, s*0.55, 0, 0, Math.PI*2);
        ctx.fill();
      });
      // Glints
      ctx.fillStyle = '#ffffff';
      [-1, 1].forEach(function(side) {
        ctx.beginPath();
        ctx.arc(cx + side*s*0.8 + dx + s*0.14, ey - s*0.18, s*0.14, 0, Math.PI*2);
        ctx.fill();
      });
      if (mood === 'mean') {
        ctx.strokeStyle = p.outline; ctx.lineWidth = s*0.22;
        [-1, 1].forEach(function(side) {
          ctx.beginPath();
          ctx.moveTo(cx + side*s*1.3 + dx, ey - s*0.85);
          ctx.lineTo(cx + side*s*0.3 + dx, ey - s*0.5);
          ctx.stroke();
        });
      }
    }
  }

  // Rounded pedestal base shared by most pieces
  function pieceBase(ctx, cx, cy, h, w, p) {
    ctx.beginPath();
    ctx.moveTo(cx - w*0.5, cy);
    ctx.quadraticCurveTo(cx - w*0.52, cy - h*0.14, cx - w*0.3, cy - h*0.18);
    ctx.lineTo(cx + w*0.3, cy - h*0.18);
    ctx.quadraticCurveTo(cx + w*0.52, cy - h*0.14, cx + w*0.5, cy);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
  }

  // Collar ring (the classic chess-piece neck ring)
  function collar(ctx, cx, y, w, h, p) {
    ctx.beginPath();
    ctx.ellipse(cx, y, w*0.5, h*0.5, 0, 0, Math.PI*2);
    ctx.fill(); ctx.stroke();
  }

  // ══════════════ CHESS PIECES (cartoon) ══════════════

  // Pawn — round head, squat body, worried little soldier
  function pawn(ctx, cx, cy, h, color) {
    var p = palFor(color);
    var w = h * 0.72;
    setPiece(ctx, cx, cy, h, p);
    pieceBase(ctx, cx, cy, h, w, p);
    // Body: plump cone
    ctx.beginPath();
    ctx.moveTo(cx - w*0.3, cy - h*0.18);
    ctx.quadraticCurveTo(cx - w*0.34, cy - h*0.45, cx - w*0.17, cy - h*0.55);
    ctx.lineTo(cx + w*0.17, cy - h*0.55);
    ctx.quadraticCurveTo(cx + w*0.34, cy - h*0.45, cx + w*0.3, cy - h*0.18);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
    collar(ctx, cx, cy - h*0.57, w*0.52, h*0.09, p);
    // Big round head
    ctx.beginPath();
    ctx.arc(cx, cy - h*0.78, h*0.21, 0, Math.PI*2);
    ctx.fill(); ctx.stroke();
    // Highlight blob on head
    ctx.fillStyle = p.hi; ctx.globalAlpha = 0.55;
    ctx.beginPath(); ctx.arc(cx - h*0.07, cy - h*0.84, h*0.07, 0, Math.PI*2); ctx.fill();
    ctx.globalAlpha = 1;
    eyes(ctx, cx, cy - h*0.78, h*0.08, p, 0, p.glowing ? 'mean' : 'calm');
  }

  // Bishop — tall mitre with the diagonal slash
  function bishop(ctx, cx, cy, h, color) {
    var p = palFor(color);
    var w = h * 0.6;
    setPiece(ctx, cx, cy, h, p);
    pieceBase(ctx, cx, cy, h, w, p);
    // Robe body
    ctx.beginPath();
    ctx.moveTo(cx - w*0.28, cy - h*0.18);
    ctx.quadraticCurveTo(cx - w*0.3, cy - h*0.5, cx - w*0.16, cy - h*0.58);
    ctx.lineTo(cx + w*0.16, cy - h*0.58);
    ctx.quadraticCurveTo(cx + w*0.3, cy - h*0.5, cx + w*0.28, cy - h*0.18);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
    collar(ctx, cx, cy - h*0.6, w*0.5, h*0.08, p);
    // Mitre head (egg with a point)
    ctx.beginPath();
    ctx.moveTo(cx - w*0.24, cy - h*0.68);
    ctx.quadraticCurveTo(cx - w*0.28, cy - h*0.9, cx, cy - h*1.0);
    ctx.quadraticCurveTo(cx + w*0.28, cy - h*0.9, cx + w*0.24, cy - h*0.68);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
    // Diagonal mitre slash — carved in contrast
    ctx.strokeStyle = p.glowing ? p.eye : p.dk;
    ctx.lineWidth = Math.max(1.4, h*0.045);
    ctx.beginPath();
    ctx.moveTo(cx - w*0.14, cy - h*0.74);
    ctx.lineTo(cx + w*0.1, cy - h*0.94);
    ctx.stroke();
    // Orb on tip
    ctx.fillStyle = p.glowing ? p.eye : p.dk;
    ctx.strokeStyle = p.outline; ctx.lineWidth = Math.max(1.2, h*0.04);
    ctx.beginPath(); ctx.arc(cx, cy - h*1.02, h*0.05, 0, Math.PI*2); ctx.fill(); ctx.stroke();
    eyes(ctx, cx, cy - h*0.76, h*0.065, p, 0, p.glowing ? 'mean' : 'calm');
  }

  // Tower / rook — stout keep with battlements; eyes glower from the arrow slit
  function tower(ctx, cx, cy, h, color) {
    var p = palFor(color);
    var w = h * 0.78;
    setPiece(ctx, cx, cy, h, p);
    pieceBase(ctx, cx, cy, h, w, p);
    // Tower body (slightly tapered)
    ctx.beginPath();
    ctx.moveTo(cx - w*0.34, cy - h*0.18);
    ctx.lineTo(cx - w*0.28, cy - h*0.72);
    ctx.lineTo(cx + w*0.28, cy - h*0.72);
    ctx.lineTo(cx + w*0.34, cy - h*0.18);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
    // Battlement crown
    ctx.beginPath();
    ctx.moveTo(cx - w*0.38, cy - h*0.72);
    ctx.lineTo(cx - w*0.38, cy - h*0.95);
    ctx.lineTo(cx - w*0.22, cy - h*0.95);
    ctx.lineTo(cx - w*0.22, cy - h*0.82);
    ctx.lineTo(cx - w*0.08, cy - h*0.82);
    ctx.lineTo(cx - w*0.08, cy - h*0.95);
    ctx.lineTo(cx + w*0.08, cy - h*0.95);
    ctx.lineTo(cx + w*0.08, cy - h*0.82);
    ctx.lineTo(cx + w*0.22, cy - h*0.82);
    ctx.lineTo(cx + w*0.22, cy - h*0.95);
    ctx.lineTo(cx + w*0.38, cy - h*0.95);
    ctx.lineTo(cx + w*0.38, cy - h*0.72);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
    // Brick seams
    ctx.strokeStyle = p.dk; ctx.lineWidth = 1; ctx.globalAlpha = 0.6;
    ctx.beginPath(); ctx.moveTo(cx - w*0.29, cy - h*0.4); ctx.lineTo(cx + w*0.29, cy - h*0.4); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx - w*0.31, cy - h*0.27); ctx.lineTo(cx + w*0.31, cy - h*0.27); ctx.stroke();
    ctx.globalAlpha = 1;
    // Arrow-slit window with eyes
    ctx.fillStyle = p.glowing ? p.dk : p.dk;
    ctx.beginPath();
    var wy = cy - h*0.56;
    ctx.moveTo(cx - w*0.16, wy + h*0.1);
    ctx.lineTo(cx - w*0.16, wy - h*0.04);
    ctx.arc(cx, wy - h*0.04, w*0.16, Math.PI, 0);
    ctx.lineTo(cx + w*0.16, wy + h*0.1);
    ctx.closePath();
    ctx.fill();
    eyes(ctx, cx, wy, h*0.06, p, 0, 'mean');
  }

  // The rearing warhorse (shared by the mounted knight and the mounted player).
  // Ground contact at (cx, cy); h is the total height of the rearing pose.
  function horse(ctx, cx, cy, h, color, facing) {
    var p = palFor(color);
    var f = facing || -1;
    var bob = Math.sin(tick() * 0.12 + cx * 0.01) * h * 0.012;
    setPiece(ctx, cx, cy, h, p);
    var lw = Math.max(1.6, h * 0.05);

    // Tail (swishing behind)
    ctx.strokeStyle = p.outline; ctx.lineWidth = lw * 0.9;
    ctx.fillStyle = p.lo;
    ctx.beginPath();
    ctx.moveTo(cx - f*h*0.3, cy - h*0.4 + bob);
    ctx.quadraticCurveTo(cx - f*h*0.52, cy - h*0.34, cx - f*h*0.48, cy - h*0.1 + Math.sin(tick()*0.07)*h*0.03);
    ctx.quadraticCurveTo(cx - f*h*0.4, cy - h*0.24, cx - f*h*0.26, cy - h*0.3 + bob);
    ctx.closePath(); ctx.fill(); ctx.stroke();

    // Hind legs (planted, bearing the rear)
    ctx.lineWidth = lw * 1.15; ctx.strokeStyle = p.outline;
    [[-0.16, -0.04], [-0.04, 0.06]].forEach(function(l) {
      ctx.beginPath();
      ctx.moveTo(cx + f*l[0]*h, cy - h*0.32 + bob);
      ctx.quadraticCurveTo(cx + f*(l[0] - 0.1)*h, cy - h*0.16, cx + f*(l[0] + l[1])*h, cy);
      ctx.stroke();
    });

    // Body: tilted upward toward the chest
    ctx.fillStyle = bodyGrad(ctx, cx, cy, h, p);
    ctx.strokeStyle = p.outline; ctx.lineWidth = lw;
    ctx.save();
    ctx.translate(cx, cy - h*0.42 + bob);
    ctx.rotate(-f * 0.5);
    ctx.beginPath();
    ctx.ellipse(0, 0, h*0.34, h*0.175, 0, 0, Math.PI*2);
    ctx.fill(); ctx.stroke();
    ctx.restore();

    // Front legs: raised and curled mid-air
    ctx.lineWidth = lw * 1.05;
    [[0.3, 0.62, 0.16, 0.5], [0.36, 0.5, 0.26, 0.36]].forEach(function(l) {
      ctx.beginPath();
      ctx.moveTo(cx + f*h*l[0], cy - h*l[1] + bob);
      ctx.quadraticCurveTo(cx + f*h*(l[0] + 0.14), cy - h*(l[1] - 0.02), cx + f*h*l[2], cy - h*l[3] + bob);
      ctx.stroke();
      // Hoof
      ctx.fillStyle = p.dk;
      ctx.beginPath(); ctx.arc(cx + f*h*l[2], cy - h*l[3] + bob, h*0.035, 0, Math.PI*2); ctx.fill();
    });

    // Neck + head, arched high — blunt cartoon muzzle
    ctx.fillStyle = bodyGrad(ctx, cx, cy, h, p);
    ctx.strokeStyle = p.outline; ctx.lineWidth = lw;
    ctx.beginPath();
    ctx.moveTo(cx + f*h*0.16, cy - h*0.62 + bob);
    ctx.quadraticCurveTo(cx + f*h*0.33, cy - h*0.82, cx + f*h*0.3, cy - h*0.94 + bob);    // crest
    ctx.quadraticCurveTo(cx + f*h*0.42, cy - h*0.94 + bob, cx + f*h*0.49, cy - h*0.87 + bob); // brow to nose
    ctx.quadraticCurveTo(cx + f*h*0.54, cy - h*0.8 + bob, cx + f*h*0.45, cy - h*0.74 + bob);  // rounded nose→jaw
    ctx.quadraticCurveTo(cx + f*h*0.36, cy - h*0.58, cx + f*h*0.3, cy - h*0.5 + bob);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
    // Nostril
    ctx.fillStyle = p.dk;
    ctx.beginPath(); ctx.arc(cx + f*h*0.475, cy - h*0.81 + bob, h*0.018, 0, Math.PI*2); ctx.fill();
    // Ear
    ctx.fillStyle = bodyGrad(ctx, cx, cy, h, p);
    ctx.beginPath();
    ctx.moveTo(cx + f*h*0.26, cy - h*0.93 + bob);
    ctx.lineTo(cx + f*h*0.25, cy - h*1.01 + bob);
    ctx.lineTo(cx + f*h*0.32, cy - h*0.94 + bob);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    // Mane down the neck
    ctx.strokeStyle = p.dk; ctx.lineWidth = Math.max(1.2, h*0.035);
    ctx.beginPath();
    ctx.moveTo(cx + f*h*0.26, cy - h*0.9 + bob);
    ctx.quadraticCurveTo(cx + f*h*0.1, cy - h*0.7, cx + f*h*0.08, cy - h*0.56 + bob);
    ctx.stroke();
    // Bridle
    ctx.beginPath();
    ctx.moveTo(cx + f*h*0.44, cy - h*0.84 + bob);
    ctx.lineTo(cx + f*h*0.38, cy - h*0.78 + bob);
    ctx.stroke();
    eyes(ctx, cx + f*h*0.37, cy - h*0.865 + bob, h*0.042, p, 0, 'mean');
    return bob;
  }

  // Knight — mounted: an armored rider on a rearing horse (checkered shield);
  // unmounted: the classic living horse-head piece.
  function knight(ctx, cx, cy, h, color, mounted, facing) {
    var p = palFor(color);
    var f = facing || -1;
    if (mounted) {
      var bob = horse(ctx, cx, cy, h, color, f);
      // ── The rider, seated on the tilted back ──
      var rx = cx - f*h*0.1, ry = cy - h*0.6 + bob;
      var rh = h * 0.34;
      ctx.fillStyle = bodyGrad(ctx, rx, ry, rh, p);
      ctx.strokeStyle = p.outline; ctx.lineWidth = Math.max(1.4, h*0.04);
      // Torso leaning forward
      ctx.save();
      ctx.translate(rx, ry);
      ctx.rotate(f * 0.22);
      ctx.beginPath();
      ctx.moveTo(-rh*0.3, 0);
      ctx.quadraticCurveTo(-rh*0.32, -rh*0.6, -rh*0.14, -rh*0.72);
      ctx.lineTo(rh*0.14, -rh*0.72);
      ctx.quadraticCurveTo(rh*0.32, -rh*0.6, rh*0.3, 0);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.restore();
      // Helmeted head with plume
      var hx = rx + f*rh*0.18, hy = ry - rh*0.86;
      ctx.beginPath(); ctx.arc(hx, hy, rh*0.26, 0, Math.PI*2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = p.dk;
      ctx.fillRect(hx - rh*0.2 + (f>0?rh*0.06:0), hy - rh*0.06, rh*0.34, rh*0.1); // visor slit
      ctx.fillStyle = p.glowing ? p.hi : p.dk; // plume
      ctx.beginPath();
      ctx.moveTo(hx - f*rh*0.06, hy - rh*0.24);
      ctx.quadraticCurveTo(hx - f*rh*0.4, hy - rh*0.5, hx - f*rh*0.5, hy - rh*0.18);
      ctx.quadraticCurveTo(hx - f*rh*0.3, hy - rh*0.28, hx - f*rh*0.02, hy - rh*0.16);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      // Raised rear arm with mace
      ctx.strokeStyle = p.outline; ctx.lineWidth = Math.max(1.6, h*0.045);
      ctx.beginPath();
      ctx.moveTo(rx - f*rh*0.2, ry - rh*0.5);
      ctx.lineTo(rx - f*rh*0.52, ry - rh*0.95);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(rx - f*rh*0.52, ry - rh*0.95);
      ctx.lineTo(rx - f*rh*0.62, ry - rh*1.3);
      ctx.stroke();
      // Mace head (spiked ball)
      var mx = rx - f*rh*0.62, my = ry - rh*1.38;
      ctx.fillStyle = p.body;
      ctx.beginPath(); ctx.arc(mx, my, rh*0.14, 0, Math.PI*2); ctx.fill(); ctx.stroke();
      ctx.lineWidth = Math.max(1.2, h*0.03);
      for (var sp = 0; sp < 6; sp++) {
        var ang = sp * Math.PI / 3 + 0.3;
        ctx.beginPath();
        ctx.moveTo(mx + Math.cos(ang)*rh*0.13, my + Math.sin(ang)*rh*0.13);
        ctx.lineTo(mx + Math.cos(ang)*rh*0.24, my + Math.sin(ang)*rh*0.24);
        ctx.stroke();
      }
      // Checkered heater shield on the leading side
      var sx = rx + f*rh*0.44, sy = ry - rh*0.28;
      ctx.fillStyle = p.hi;
      ctx.strokeStyle = p.outline; ctx.lineWidth = Math.max(1.5, h*0.045);
      ctx.beginPath();
      ctx.moveTo(sx - rh*0.26, sy - rh*0.34);
      ctx.lineTo(sx + rh*0.26, sy - rh*0.34);
      ctx.lineTo(sx + rh*0.24, sy + rh*0.1);
      ctx.quadraticCurveTo(sx, sy + rh*0.44, sx - rh*0.24, sy + rh*0.1);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      // 2×2 checker on the shield
      ctx.fillStyle = p.dk;
      ctx.fillRect(sx - rh*0.24, sy - rh*0.32, rh*0.24, rh*0.24);
      ctx.fillRect(sx, sy - rh*0.08, rh*0.22, rh*0.26);
      return;
    }
    // Unmounted: the classic knight bust, alive
    var w = h * 0.72;
    setPiece(ctx, cx, cy, h, p);
    pieceBase(ctx, cx, cy, h, w, p);
    ctx.beginPath();
    ctx.moveTo(cx - f*w*0.2, cy - h*0.18);
    ctx.quadraticCurveTo(cx - f*w*0.4, cy - h*0.55, cx - f*w*0.26, cy - h*0.82);
    ctx.quadraticCurveTo(cx - f*w*0.16, cy - h*0.98, cx + f*w*0.12, cy - h*0.95); // crown of head
    ctx.lineTo(cx + f*w*0.42, cy - h*0.72);                                        // muzzle out
    ctx.quadraticCurveTo(cx + f*w*0.46, cy - h*0.6, cx + f*w*0.28, cy - h*0.58);
    ctx.quadraticCurveTo(cx + f*w*0.2, cy - h*0.4, cx + f*w*0.24, cy - h*0.18);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
    // Ear
    ctx.beginPath();
    ctx.moveTo(cx - f*w*0.05, cy - h*0.95);
    ctx.lineTo(cx - f*w*0.1, cy - h*1.1);
    ctx.lineTo(cx + f*w*0.08, cy - h*0.97);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    // Mane notches
    ctx.strokeStyle = p.dk; ctx.lineWidth = Math.max(1.2, h*0.04);
    for (var i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(cx - f*w*(0.26 - i*0.01), cy - h*(0.75 - i*0.14));
      ctx.lineTo(cx - f*w*0.12, cy - h*(0.68 - i*0.14));
      ctx.stroke();
    }
    eyes(ctx, cx + f*w*0.14, cy - h*0.76, h*0.07, p, 0, 'mean');
  }

  // Queen — elegant, crowned, regal and terrifying
  function queen(ctx, cx, cy, h, color) {
    var p = palFor(color);
    var w = h * 0.66;
    setPiece(ctx, cx, cy, h, p);
    pieceBase(ctx, cx, cy, h, w, p);
    // Gown (flared)
    ctx.beginPath();
    ctx.moveTo(cx - w*0.34, cy - h*0.18);
    ctx.quadraticCurveTo(cx - w*0.18, cy - h*0.42, cx - w*0.13, cy - h*0.62);
    ctx.lineTo(cx + w*0.13, cy - h*0.62);
    ctx.quadraticCurveTo(cx + w*0.18, cy - h*0.42, cx + w*0.34, cy - h*0.18);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
    collar(ctx, cx, cy - h*0.63, w*0.42, h*0.07, p);
    // Head
    ctx.beginPath(); ctx.arc(cx, cy - h*0.76, h*0.145, 0, Math.PI*2); ctx.fill(); ctx.stroke();
    // Crown: points with ball tips
    ctx.beginPath();
    ctx.moveTo(cx - w*0.3, cy - h*0.84);
    for (var i = 0; i <= 4; i++) {
      var px = cx - w*0.3 + i * w*0.15;
      ctx.lineTo(px, cy - h*0.84);
      if (i < 4) ctx.lineTo(px + w*0.075, cy - h*(1.0 + (i===1||i===2 ? 0.05 : 0)));
    }
    ctx.closePath(); ctx.fill(); ctx.stroke();
    // Ball tips on the crown points (contrast)
    ctx.fillStyle = p.glowing ? p.eye : p.dk;
    for (var k = 0; k < 4; k++) {
      var tx = cx - w*0.3 + k*w*0.15 + w*0.075;
      ctx.beginPath();
      ctx.arc(tx, cy - h*(1.0 + (k===1||k===2 ? 0.05 : 0)), h*0.035, 0, Math.PI*2);
      ctx.fill();
    }
    eyes(ctx, cx, cy - h*0.77, h*0.06, p, 0, 'mean');
  }

  // King — broad, cross-crowned, wreathed in menace
  function king(ctx, cx, cy, h, color) {
    var p = palFor(color);
    var w = h * 0.74;
    // Smoky aura for big (boss-scaled) kings
    if (p.glowing && h > 48) {
      var t2 = tick();
      ctx.save();
      ctx.globalAlpha = 0.18;
      ctx.fillStyle = '#1a1712';
      for (var a = 0; a < 3; a++) {
        var ox = Math.sin(t2*0.05 + a*2.1) * w*0.2;
        ctx.beginPath();
        ctx.ellipse(cx + ox, cy - h*0.45 - a*h*0.12, w*(0.55 - a*0.1), h*(0.4 - a*0.08), 0, 0, Math.PI*2);
        ctx.fill();
      }
      ctx.restore();
    }
    setPiece(ctx, cx, cy, h, p);
    pieceBase(ctx, cx, cy, h, w, p);
    // Robust body
    ctx.beginPath();
    ctx.moveTo(cx - w*0.36, cy - h*0.18);
    ctx.quadraticCurveTo(cx - w*0.24, cy - h*0.45, cx - w*0.18, cy - h*0.6);
    ctx.lineTo(cx + w*0.18, cy - h*0.6);
    ctx.quadraticCurveTo(cx + w*0.24, cy - h*0.45, cx + w*0.36, cy - h*0.18);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
    collar(ctx, cx, cy - h*0.61, w*0.5, h*0.07, p);
    // Head
    ctx.beginPath(); ctx.arc(cx, cy - h*0.73, h*0.15, 0, Math.PI*2); ctx.fill(); ctx.stroke();
    // Crown band
    ctx.beginPath();
    ctx.rect(cx - w*0.26, cy - h*0.9, w*0.52, h*0.08);
    ctx.fill(); ctx.stroke();
    // Cross on top (contrast)
    ctx.fillStyle = p.glowing ? p.eye : p.dk;
    ctx.strokeStyle = p.outline; ctx.lineWidth = Math.max(1.3, h*0.04);
    ctx.beginPath(); ctx.rect(cx - w*0.035, cy - h*1.12, w*0.07, h*0.24); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.rect(cx - w*0.11, cy - h*1.06, w*0.22, h*0.06); ctx.fill(); ctx.stroke();
    eyes(ctx, cx, cy - h*0.74, h*0.065, p, 0, 'mean');
  }

  // Skeleton bard with lute — the save-point troubadour
  function bard(ctx, cx, cy, h, color) {
    var g = G();
    var bob = Math.sin(tick() * 0.09) * h * 0.015;
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    // Hooded robe (solid ink)
    var robe = ctx.createLinearGradient(cx, cy - h, cx, cy);
    robe.addColorStop(0, '#3a352c'); robe.addColorStop(1, '#14110c');
    ctx.fillStyle = robe;
    ctx.strokeStyle = g.outline; ctx.lineWidth = Math.max(1.6, h*0.04);
    ctx.beginPath();
    ctx.moveTo(cx - h*0.3, cy);
    ctx.quadraticCurveTo(cx - h*0.34, cy - h*0.55, cx - h*0.18, cy - h*0.75);
    ctx.quadraticCurveTo(cx, cy - h*0.98, cx + h*0.18, cy - h*0.75);
    ctx.quadraticCurveTo(cx + h*0.34, cy - h*0.55, cx + h*0.3, cy);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
    // Skull face in hood
    ctx.fillStyle = g.ivory;
    ctx.beginPath(); ctx.arc(cx, cy - h*0.68 + bob, h*0.14, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#14110c';
    ctx.beginPath(); ctx.ellipse(cx - h*0.055, cy - h*0.7 + bob, h*0.045, h*0.055, 0, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx + h*0.055, cy - h*0.7 + bob, h*0.045, h*0.055, 0, 0, Math.PI*2); ctx.fill();
    // Grin
    ctx.strokeStyle = '#14110c'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(cx - h*0.05, cy - h*0.6 + bob); ctx.lineTo(cx + h*0.05, cy - h*0.6 + bob); ctx.stroke();
    for (var i = -1; i <= 1; i++) {
      ctx.beginPath(); ctx.moveTo(cx + i*h*0.03, cy - h*0.62 + bob); ctx.lineTo(cx + i*h*0.03, cy - h*0.58 + bob); ctx.stroke();
    }
    // Lute (strums)
    var strum = Math.sin(tick() * 0.14) * h*0.02;
    ctx.fillStyle = '#8a8272'; ctx.strokeStyle = g.outline; ctx.lineWidth = Math.max(1.3, h*0.03);
    ctx.beginPath(); ctx.ellipse(cx + h*0.26, cy - h*0.3 + strum, h*0.16, h*0.12, -0.5, 0, Math.PI*2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx + h*0.32, cy - h*0.4 + strum); ctx.lineTo(cx + h*0.52, cy - h*0.62 + strum); ctx.stroke();
    ctx.strokeStyle = g.ivory; ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.moveTo(cx + h*0.2, cy - h*0.26 + strum); ctx.lineTo(cx + h*0.5, cy - h*0.58 + strum); ctx.stroke();
    // Bony strumming hand
    ctx.fillStyle = g.ivory;
    ctx.beginPath(); ctx.arc(cx + h*0.24, cy - h*0.28 + strum*2, h*0.04, 0, Math.PI*2); ctx.fill();
    // Music notes
    var nf = tick();
    if (Math.floor(nf / 50) % 2 === 0) {
      ctx.fillStyle = g.ink; ctx.font = Math.round(h*0.22) + 'px serif';
      ctx.fillText('♪', cx + h*0.42, cy - h*0.95 - Math.sin(nf*0.06)*4);
    }
  }

  // ── Weapons ────────────────────────────────────────────────────────────────

  function spear(ctx, x, y, w, h, dir, color) {
    var g = G();
    ctx.save();
    ctx.translate(x + w/2, y + h/2);
    if (dir < 0) ctx.rotate(Math.PI);
    ctx.lineJoin = 'round';
    // Shaft
    ctx.fillStyle = '#57514a';
    ctx.strokeStyle = g.outline; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.rect(-w/2, -h*0.28, w*0.72, h*0.56); ctx.fill(); ctx.stroke();
    // Band
    ctx.fillStyle = '#a49c83';
    ctx.fillRect(w*0.1, -h*0.32, w*0.06, h*0.64);
    // Steel leaf tip
    var steel = ctx.createLinearGradient(w*0.2, -h, w*0.5, h);
    steel.addColorStop(0, '#f0ece0'); steel.addColorStop(1, '#8a8272');
    ctx.fillStyle = steel;
    ctx.beginPath();
    ctx.moveTo(w*0.2, -h*0.7);
    ctx.quadraticCurveTo(w*0.42, -h*0.3, w*0.5, 0);
    ctx.quadraticCurveTo(w*0.42, h*0.3, w*0.2, h*0.7);
    ctx.quadraticCurveTo(w*0.28, 0, w*0.2, -h*0.7);
    ctx.fill(); ctx.stroke();
    ctx.restore();
  }

  function sword(ctx, cx, cy, h, color, facing, attacking) {
    var g = G();
    var swx = cx + facing * h * 0.34;
    var swAngle = attacking ? -0.62 * facing : 0.3 * facing;
    ctx.save();
    ctx.translate(swx, cy - h * 0.55);
    ctx.rotate(swAngle);
    ctx.lineJoin = 'round';
    // Blade
    var steel = ctx.createLinearGradient(-h*0.05, -h*0.5, h*0.05, 0);
    steel.addColorStop(0, '#f4f0e4'); steel.addColorStop(1, '#968c6d');
    ctx.fillStyle = steel; ctx.strokeStyle = g.outline; ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(-h*0.045, 0);
    ctx.lineTo(-h*0.045, -h*0.42);
    ctx.lineTo(0, -h*0.5);
    ctx.lineTo(h*0.045, -h*0.42);
    ctx.lineTo(h*0.045, 0);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    // Guard + pommel
    ctx.fillStyle = '#57514a';
    ctx.beginPath(); ctx.rect(-h*0.13, -h*0.015, h*0.26, h*0.05); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.rect(-h*0.03, h*0.03, h*0.06, h*0.1); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(0, h*0.16, h*0.035, 0, Math.PI*2); ctx.fill(); ctx.stroke();
    // Swing arc
    if (attacking) {
      ctx.restore();
      ctx.save();
      ctx.strokeStyle = 'rgba(26,23,18,0.28)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(cx, cy - h*0.5, h*0.62, facing > 0 ? -1.2 : Math.PI - 0.4, facing > 0 ? 0.4 : Math.PI + 1.2);
      ctx.stroke();
    }
    ctx.restore();
  }

  // ── Survive-mode player (cartoon pawn with sword/shield/steed) ─────────────
  function player(ctx, cx, cy, h, color, facing, attacking, shielding, mounted, abilities) {
    var p = palFor(color);
    var offsetY = 0, offsetX = 0;
    if (mounted) {
      horse(ctx, cx, cy, h * 1.6, color, facing);
      offsetY = -h * 0.72;
      offsetX = -facing * h * 0.16;
    }
    pawnHero(ctx, cx + offsetX, cy + offsetY, h, p, facing, attacking, false, 'pawn', { sword:true, shielding:shielding && abilities && abilities.shield });
  }

  // ── The Adventure hero: cartoon pawn, cape, spear, form accents ────────────
  // color picks the side ('#fff…' white pawn / '#000…' black pawn).
  function hero(ctx, cx, cy, h, color, inkCol, facing, attacking, dashing, form) {
    var p = palFor(color || '#ffffff');
    pawnHero(ctx, cx, cy, h, p, facing, attacking, dashing, form || 'pawn', { spear:true });
  }

  function pawnHero(ctx, cx, cy, h, p, facing, attacking, dashing, form, opts) {
    opts = opts || {};
    var g = G();
    var w = h * 0.74;
    var t2 = tick();
    var sway = Math.sin(t2 * 0.08 + cx * 0.02);
    // Contrast tones: dark cape/marks on a white pawn, pale on a black pawn
    var markCol = p.glowing ? g.ivory : '#1a1712';
    var capeHi  = p.glowing ? '#d8d1b8' : '#3a352c';
    var capeLo  = p.glowing ? '#a49c83' : '#14110c';

    // Cape — flows behind the hero
    var capeX = -facing;
    var flap = dashing ? h*0.34 : h*0.1 * (1 + sway*0.4);
    var cape = ctx.createLinearGradient(cx, cy - h*0.8, cx + capeX * h*0.5, cy);
    cape.addColorStop(0, capeHi); cape.addColorStop(1, capeLo);
    ctx.fillStyle = cape;
    ctx.strokeStyle = g.outline; ctx.lineWidth = Math.max(1.4, h*0.045);
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(cx + capeX*w*0.1, cy - h*0.72);
    ctx.quadraticCurveTo(cx + capeX*(w*0.44 + flap), cy - h*0.5, cx + capeX*(w*0.4 + flap*1.4), cy - h*0.08);
    ctx.quadraticCurveTo(cx + capeX*w*0.32, cy - h*0.14, cx + capeX*w*0.16, cy - h*0.16);
    ctx.closePath();
    ctx.fill(); ctx.stroke();

    // Body
    setPiece(ctx, cx, cy, h, p);
    pieceBase(ctx, cx, cy, h, w, p);
    ctx.beginPath();
    ctx.moveTo(cx - w*0.3, cy - h*0.18);
    ctx.quadraticCurveTo(cx - w*0.34, cy - h*0.45, cx - w*0.17, cy - h*0.56);
    ctx.lineTo(cx + w*0.17, cy - h*0.56);
    ctx.quadraticCurveTo(cx + w*0.34, cy - h*0.45, cx + w*0.3, cy - h*0.18);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
    // Cross tabard mark (contrast)
    ctx.fillStyle = markCol;
    ctx.fillRect(cx - h*0.025, cy - h*0.5, h*0.05, h*0.22);
    ctx.fillRect(cx - h*0.085, cy - h*0.44, h*0.17, h*0.05);
    // Collar band
    ctx.fillStyle = p.glowing ? p.hi : p.dk;
    ctx.strokeStyle = p.outline; ctx.lineWidth = Math.max(1.4, h*0.045);
    ctx.beginPath();
    ctx.ellipse(cx, cy - h*0.58, w*0.42, h*0.075, 0, 0, Math.PI*2);
    ctx.fill(); ctx.stroke();

    // Head: rounded helmet with T-visor
    ctx.fillStyle = bodyGrad(ctx, cx, cy, h, p);
    ctx.beginPath();
    ctx.arc(cx, cy - h*0.79, h*0.215, 0, Math.PI*2);
    ctx.fill(); ctx.stroke();
    // Visor slit (contrast T) with eyes inside
    var slitCol = p.glowing ? g.ivory : '#241f16';
    var eyeCol  = p.glowing ? '#14110c' : '#fdfbf1';
    ctx.fillStyle = slitCol;
    ctx.beginPath();
    ctx.rect(cx - h*0.13, cy - h*0.85, h*0.26, h*0.075);
    ctx.fill();
    ctx.fillRect(cx + facing*h*0.02 - h*0.028, cy - h*0.85, h*0.056, h*0.17);
    // Eyes in the slit
    ctx.fillStyle = eyeCol;
    ctx.beginPath(); ctx.arc(cx - h*0.06 + facing*h*0.015, cy - h*0.815, h*0.026, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + h*0.06 + facing*h*0.015, cy - h*0.815, h*0.026, 0, Math.PI*2); ctx.fill();
    // Helmet shine
    ctx.fillStyle = p.hi; ctx.globalAlpha = 0.6;
    ctx.beginPath(); ctx.arc(cx - h*0.08, cy - h*0.9, h*0.05, 0, Math.PI*2); ctx.fill();
    ctx.globalAlpha = 1;

    // Form accents
    ctx.strokeStyle = p.outline; ctx.lineWidth = Math.max(1.3, h*0.04);
    if (form === 'tower') {
      // Battlement circlet
      ctx.fillStyle = '#a49c83';
      for (var i = -1; i <= 1; i++) {
        ctx.beginPath(); ctx.rect(cx + i*h*0.09 - h*0.032, cy - h*1.06, h*0.064, h*0.075); ctx.fill(); ctx.stroke();
      }
    } else if (form === 'knight') {
      // Horsehair crest
      ctx.fillStyle = markCol;
      ctx.beginPath();
      ctx.moveTo(cx - facing*h*0.06, cy - h*0.99);
      ctx.quadraticCurveTo(cx - facing*h*0.2, cy - h*1.16, cx - facing*h*0.3, cy - h*1.0);
      ctx.quadraticCurveTo(cx - facing*h*0.16, cy - h*1.02, cx - facing*h*0.02, cy - h*0.94);
      ctx.closePath(); ctx.fill(); ctx.stroke();
    } else if (form === 'bishop') {
      // Mitre point
      ctx.fillStyle = markCol;
      ctx.beginPath();
      ctx.moveTo(cx - h*0.07, cy - h*0.97);
      ctx.lineTo(cx, cy - h*1.14);
      ctx.lineTo(cx + h*0.07, cy - h*0.97);
      ctx.closePath(); ctx.fill(); ctx.stroke();
    } else if (form === 'queen') {
      // Crown
      ctx.fillStyle = markCol;
      ctx.beginPath();
      ctx.moveTo(cx - h*0.13, cy - h*0.96);
      ctx.lineTo(cx - h*0.13, cy - h*1.1);
      ctx.lineTo(cx - h*0.055, cy - h*1.0);
      ctx.lineTo(cx, cy - h*1.13);
      ctx.lineTo(cx + h*0.055, cy - h*1.0);
      ctx.lineTo(cx + h*0.13, cy - h*1.1);
      ctx.lineTo(cx + h*0.13, cy - h*0.96);
      ctx.closePath(); ctx.fill(); ctx.stroke();
    }

    // Weapon
    if (opts.shielding) {
      var sx0 = cx + facing*w*0.42;
      ctx.fillStyle = '#a49c83'; ctx.strokeStyle = g.outline; ctx.lineWidth = Math.max(1.5, h*0.05);
      ctx.beginPath();
      ctx.moveTo(sx0 - h*0.13, cy - h*0.72);
      ctx.lineTo(sx0 + h*0.13, cy - h*0.72);
      ctx.lineTo(sx0 + h*0.13, cy - h*0.4);
      ctx.quadraticCurveTo(sx0, cy - h*0.24, sx0 - h*0.13, cy - h*0.4);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = markCol;
      ctx.beginPath(); ctx.arc(sx0, cy - h*0.52, h*0.035, 0, Math.PI*2); ctx.fill();
    } else if (opts.sword) {
      sword(ctx, cx, cy, h, null, facing, attacking);
    } else if (opts.spear) {
      var sx = cx + facing * w * 0.46;
      ctx.strokeStyle = g.outline;
      if (attacking) {
        var reach = facing * h * 0.55;
        var tipX = sx + reach + facing * h * 0.5;
        // Arm
        ctx.lineWidth = Math.max(1.8, h*0.055);
        ctx.beginPath(); ctx.moveTo(cx + facing*w*0.18, cy - h*0.48); ctx.lineTo(sx + reach*0.4, cy - h*0.45); ctx.stroke();
        // Horizontal thrust
        ctx.strokeStyle = '#57514a'; ctx.lineWidth = Math.max(2.2, h*0.07);
        ctx.beginPath(); ctx.moveTo(sx - facing*h*0.25, cy - h*0.45); ctx.lineTo(tipX - facing*h*0.12, cy - h*0.45); ctx.stroke();
        var steel = ctx.createLinearGradient(tipX - facing*h*0.2, cy - h*0.55, tipX, cy - h*0.35);
        steel.addColorStop(0, '#f4f0e4'); steel.addColorStop(1, '#968c6d');
        ctx.fillStyle = steel; ctx.strokeStyle = g.outline; ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(tipX, cy - h*0.45);
        ctx.lineTo(tipX - facing*h*0.17, cy - h*0.55);
        ctx.lineTo(tipX - facing*h*0.17, cy - h*0.35);
        ctx.closePath(); ctx.fill(); ctx.stroke();
        // Thrust streaks
        ctx.strokeStyle = 'rgba(26,23,18,0.25)'; ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.moveTo(sx, cy - h*0.56); ctx.lineTo(tipX - facing*h*0.2, cy - h*0.56); ctx.stroke();
      } else {
        // Vertical at rest
        ctx.strokeStyle = '#57514a'; ctx.lineWidth = Math.max(2.2, h*0.07);
        ctx.beginPath(); ctx.moveTo(sx, cy - h*0.02); ctx.lineTo(sx, cy - h*1.14); ctx.stroke();
        ctx.strokeStyle = '#a49c83'; ctx.lineWidth = Math.max(1, h*0.03);
        ctx.beginPath(); ctx.moveTo(sx - h*0.035, cy - h*0.62); ctx.lineTo(sx + h*0.035, cy - h*0.62); ctx.stroke();
        var steel2 = ctx.createLinearGradient(sx - h*0.09, cy - h*1.36, sx + h*0.09, cy - h*1.1);
        steel2.addColorStop(0, '#f4f0e4'); steel2.addColorStop(1, '#968c6d');
        ctx.fillStyle = steel2; ctx.strokeStyle = g.outline; ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(sx, cy - h*1.36);
        ctx.quadraticCurveTo(sx + h*0.09, cy - h*1.22, sx, cy - h*1.08);
        ctx.quadraticCurveTo(sx - h*0.09, cy - h*1.22, sx, cy - h*1.36);
        ctx.fill(); ctx.stroke();
        // Hand on shaft
        ctx.fillStyle = p.body;
        ctx.beginPath(); ctx.arc(sx, cy - h*0.45, h*0.05, 0, Math.PI*2); ctx.fill(); ctx.stroke();
      }
    }

    // Dash afterimages
    if (dashing) {
      ctx.save();
      for (var d2 = 1; d2 <= 2; d2++) {
        ctx.globalAlpha = 0.22 / d2;
        ctx.fillStyle = p.glowing ? '#14110c' : '#57514a';
        ctx.beginPath();
        ctx.ellipse(cx - facing * d2 * w*0.7, cy - h*0.45, w*0.34, h*0.42, 0, 0, Math.PI*2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  // ── HP bars ────────────────────────────────────────────────────────────────
  function hpBar(ctx, x, y, w, h, pct, color, bgColor) {
    var g = G();
    ctx.fillStyle = 'rgba(247,243,228,0.85)';
    ctx.fillRect(x-1, y-1, w+2, h+2);
    ctx.fillStyle = g.ink;
    ctx.fillRect(x, y, w * Math.max(0, Math.min(1, pct)), h);
    ctx.strokeStyle = g.ink;
    ctx.lineWidth = 1;
    ctx.strokeRect(x - 0.5, y - 0.5, w + 1, h + 1);
  }

  // Ornate ink-framed resource bar
  function barOrnate(ctx, x, y, w, h, pct, colHi, colLo, label) {
    var g = G();
    // Frame: paper inner, double ink border
    ctx.fillStyle = 'rgba(252,249,240,0.9)';
    ctx.fillRect(x - 2, y - 2, w + 4, h + 4);
    ctx.strokeStyle = g.goldLo; ctx.lineWidth = 1;
    ctx.strokeRect(x - 2.5, y - 2.5, w + 5, h + 5);
    ctx.strokeStyle = g.ink;
    ctx.strokeRect(x - 0.5, y - 0.5, w + 1, h + 1);
    // Fill
    pct = Math.max(0, Math.min(1, pct));
    if (pct > 0) {
      var gr = ctx.createLinearGradient(x, y, x, y + h);
      gr.addColorStop(0, colHi || g.ink); gr.addColorStop(1, colLo || g.ink);
      ctx.fillStyle = gr;
      ctx.fillRect(x, y, w * pct, h);
      // Shine
      ctx.fillStyle = 'rgba(255,255,255,0.22)';
      ctx.fillRect(x, y + 1, w * pct, Math.max(1, h * 0.24));
    }
    // Quarter ticks
    ctx.strokeStyle = 'rgba(26,23,18,0.35)';
    for (var i = 1; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(x + w*i/4 + 0.5, y); ctx.lineTo(x + w*i/4 + 0.5, y + h);
      ctx.stroke();
    }
    if (label) {
      ctx.font = 'bold ' + Math.round(h + 2) + 'px ' + C.FONT_GOTH;
      ctx.fillStyle = g.ink;
      ctx.textAlign = 'right';
      ctx.fillText(label, x - 7, y + h - 1);
      ctx.textAlign = 'left';
    }
  }

  // Paper panel with double ink frame + corner diamonds
  function panel(ctx, x, y, w, h) {
    var g = G();
    ctx.fillStyle = g.panel;
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = g.ink; ctx.lineWidth = 2.4;
    ctx.strokeRect(x + 1.5, y + 1.5, w - 3, h - 3);
    ctx.strokeStyle = g.ink; ctx.lineWidth = 1;
    ctx.strokeRect(x + 5.5, y + 5.5, w - 11, h - 11);
    // Corner diamonds
    ctx.fillStyle = g.ink;
    [[x+5.5, y+5.5],[x+w-5.5, y+5.5],[x+5.5, y+h-5.5],[x+w-5.5, y+h-5.5]].forEach(function(c2) {
      ctx.save();
      ctx.translate(c2[0], c2[1]);
      ctx.rotate(Math.PI/4);
      ctx.fillRect(-3.4, -3.4, 6.8, 6.8);
      ctx.restore();
    });
  }

  // Full-canvas ornate border (used on menu screens)
  function ornateFrame(ctx) {
    panelFrameOnly(ctx, 10, 10, C.W - 20, C.H - 20);
  }
  function panelFrameOnly(ctx, x, y, w, h) {
    var g = G();
    ctx.strokeStyle = g.ink; ctx.lineWidth = 2.4;
    ctx.strokeRect(x + 1.5, y + 1.5, w - 3, h - 3);
    ctx.strokeStyle = g.ink; ctx.lineWidth = 1;
    ctx.strokeRect(x + 5.5, y + 5.5, w - 11, h - 11);
    ctx.fillStyle = g.ink;
    [[x+5.5, y+5.5],[x+w-5.5, y+5.5],[x+5.5, y+h-5.5],[x+w-5.5, y+h-5.5]].forEach(function(c2) {
      ctx.save(); ctx.translate(c2[0], c2[1]); ctx.rotate(Math.PI/4);
      ctx.fillRect(-3.4, -3.4, 6.8, 6.8);
      ctx.restore();
    });
  }

  // ── Pencil-texture primitives ──────────────────────────────────────────────
  function inkLine(ctx, x1, y1, x2, y2, ink, width, seed) {
    ctx.strokeStyle = ink; ctx.lineWidth = width || 2; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  }
  function inkRect(ctx, x, y, w, h, ink, seed, hatch) {
    ctx.strokeStyle = ink; ctx.lineWidth = 1.5;
    ctx.strokeRect(x, y, w, h);
  }
  function solidRect(ctx, x, y, w, h, ink) {
    ctx.fillStyle = ink;
    ctx.fillRect(x, y, w, h);
  }
  // Diagonal pencil hatching over a rect
  function hatchRect(ctx, x, y, w, h, ink, step, alpha) {
    ctx.save();
    ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
    ctx.strokeStyle = ink || G().ink;
    ctx.lineWidth = 1;
    ctx.globalAlpha = alpha == null ? 0.3 : alpha;
    step = step || 7;
    for (var d = -h; d < w; d += step) {
      ctx.beginPath();
      ctx.moveTo(x + d, y);
      ctx.lineTo(x + d + h, y + h);
      ctx.stroke();
    }
    ctx.restore();
  }
  // Rough hand-drawn rectangle outline
  function roughRect(ctx, x, y, w, h, ink, lw, seed) {
    seed = seed || (x * 7 + y * 13);
    ctx.strokeStyle = ink || G().ink;
    ctx.lineWidth = lw || 2;
    ctx.lineCap = 'round';
    function seg(x1, y1, x2, y2, s) {
      var n = Math.max(2, Math.floor(Math.hypot(x2-x1, y2-y1) / 30));
      ctx.beginPath();
      ctx.moveTo(x1 + jit(s, 1.2), y1 + jit(s+1, 1.2));
      for (var i = 1; i <= n; i++) {
        var t = i / n;
        ctx.lineTo(x1 + (x2-x1)*t + jit(s+i*7, 1.4), y1 + (y2-y1)*t + jit(s+i*13, 1.4));
      }
      ctx.stroke();
    }
    seg(x, y, x+w, y, seed);
    seg(x+w, y, x+w, y+h, seed+3);
    seg(x+w, y+h, x, y+h, seed+5);
    seg(x, y+h, x, y, seed+9);
  }

  // ── Adventure decorations ──────────────────────────────────────────────────

  function skullFace(ctx, cx, cy, h, paper) { /* faces are part of the pieces now */ }

  // Corruption: scribbled veins in the contrast tone of the piece
  function corruption(ctx, x, y, w, h, pieceColor, frame) {
    var dark = isDarkColor(pieceColor || '#fff');
    ctx.save();
    ctx.strokeStyle = dark ? 'rgba(247,243,228,0.8)' : 'rgba(26,23,18,0.75)';
    ctx.lineWidth = 1.3;
    var ph = ((frame || 0) / 24) | 0;
    for (var i = 0; i < 4; i++) {
      var sx = x + w * (0.25 + 0.5 * rnd(i * 3 + ph));
      ctx.beginPath();
      ctx.moveTo(sx, y + h*0.12);
      ctx.quadraticCurveTo(sx + jit(i + ph, w*0.3), y + h*0.5, sx + jit(i*7 + ph, w*0.35), y + h*0.9);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Cartoon ink flame: dark silhouette with a pale core
  function inkFlame(ctx, x, baseY, fw, fh, phase) {
    var f = tick() * 0.13 + phase;
    var ox = Math.sin(f) * fw * 0.35;
    ctx.fillStyle = '#1a1712';
    ctx.beginPath();
    ctx.moveTo(x - fw, baseY);
    ctx.quadraticCurveTo(x - fw*0.8, baseY - fh*0.55, x + ox, baseY - fh - Math.sin(f*1.7)*3);
    ctx.quadraticCurveTo(x + fw*0.8, baseY - fh*0.55, x + fw, baseY);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#f7f3e4';
    ctx.beginPath();
    ctx.moveTo(x - fw*0.4, baseY);
    ctx.quadraticCurveTo(x - fw*0.32, baseY - fh*0.3, x + ox*0.5, baseY - fh*0.55);
    ctx.quadraticCurveTo(x + fw*0.32, baseY - fh*0.3, x + fw*0.4, baseY);
    ctx.closePath(); ctx.fill();
  }

  // Bonfire + skeleton bard: the save point
  function bonfire(ctx, x, groundY, ink, paperCol, frame) {
    frame = frame == null ? tick() : frame;
    // Soft pencil glow
    var glow = ctx.createRadialGradient(x, groundY - 10, 4, x, groundY - 10, 80);
    glow.addColorStop(0, 'rgba(26,23,18,0.10)');
    glow.addColorStop(1, 'rgba(26,23,18,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(x - 85, groundY - 90, 170, 95);
    // Logs
    ctx.strokeStyle = '#1a1712'; ctx.lineWidth = 5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x-16, groundY-4); ctx.lineTo(x+16, groundY-9); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x-14, groundY-9); ctx.lineTo(x+14, groundY-3); ctx.stroke();
    // Flames
    inkFlame(ctx, x, groundY - 6, 13, 34, 0);
    // Sparks
    ctx.fillStyle = '#1a1712';
    for (var i = 0; i < 3; i++) {
      var st = (frame * 1.2 + i * 47) % 90;
      ctx.globalAlpha = 1 - st / 90;
      ctx.fillRect(x + Math.sin(frame*0.13 + i*2.4) * (6 + st*0.2), groundY - 22 - st*0.6, 2, 2);
    }
    ctx.globalAlpha = 1;
    // Bard sits to the left
    bard(ctx, x - 46, groundY, 46, '#000');
  }

  // Chapel altar: candles, pedestal and a cross
  function altar(ctx, x, groundY, ink, paperCol) {
    var g = G();
    var f = tick() * 0.12;
    // Steps
    var stone = ctx.createLinearGradient(x, groundY - 20, x, groundY);
    stone.addColorStop(0, '#b3ab92'); stone.addColorStop(1, '#847c64');
    ctx.fillStyle = stone; ctx.strokeStyle = g.outline; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.rect(x - 30, groundY - 10, 60, 10); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.rect(x - 22, groundY - 20, 44, 10); ctx.fill(); ctx.stroke();
    // Pedestal
    ctx.beginPath(); ctx.rect(x - 11, groundY - 46, 22, 26); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.rect(x - 15, groundY - 52, 30, 6); ctx.fill(); ctx.stroke();
    // Cross (heavy ink)
    ctx.fillStyle = g.ink; ctx.strokeStyle = g.outline; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.rect(x - 2.5, groundY - 78, 5, 26); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.rect(x - 8.5, groundY - 71, 17, 5); ctx.fill(); ctx.stroke();
    // Candles either side
    [-24, 24].forEach(function(dx, i) {
      ctx.fillStyle = '#f7f3e4';
      ctx.strokeStyle = g.ink; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.rect(x + dx - 2, groundY - 34, 4, 14); ctx.fill(); ctx.stroke();
      inkFlame(ctx, x + dx, groundY - 34, 2.4, 8, i * 2);
    });
  }

  // The Realmkeeper: hooded narrator, pale eyes, chess-orb staff
  function realmkeeper(ctx, cx, cy, h, ink, paperCol) {
    var g = G();
    var f = tick() * 0.05;
    // Robe
    var robe = ctx.createLinearGradient(cx, cy - h, cx, cy);
    robe.addColorStop(0, '#3a352c'); robe.addColorStop(1, '#14110c');
    ctx.fillStyle = robe;
    ctx.strokeStyle = g.outline; ctx.lineWidth = Math.max(1.8, h*0.03);
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(cx - h*0.34, cy);
    ctx.quadraticCurveTo(cx - h*0.38, cy - h*0.5, cx - h*0.16, cy - h*0.8);
    ctx.quadraticCurveTo(cx, cy - h*1.02, cx + h*0.16, cy - h*0.8);
    ctx.quadraticCurveTo(cx + h*0.38, cy - h*0.5, cx + h*0.34, cy);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
    // Hood hollow
    ctx.fillStyle = '#080705';
    ctx.beginPath();
    ctx.ellipse(cx, cy - h*0.78, h*0.13, h*0.15, 0, 0, Math.PI*2);
    ctx.fill();
    // Pale eyes
    ctx.fillStyle = '#f7f3e4';
    ctx.beginPath(); ctx.ellipse(cx - h*0.05, cy - h*0.79, h*0.026, h*0.017, -0.25, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx + h*0.05, cy - h*0.79, h*0.026, h*0.017, 0.25, 0, Math.PI*2); ctx.fill();
    // Staff topped with a floating pawn orb
    ctx.strokeStyle = '#3a352c'; ctx.lineWidth = Math.max(2.4, h*0.035);
    ctx.beginPath(); ctx.moveTo(cx + h*0.32, cy); ctx.lineTo(cx + h*0.32, cy - h*1.02); ctx.stroke();
    var ob = Math.sin(f * 3) * h * 0.015;
    pawn(ctx, cx + h*0.32, cy - h*1.06 + ob, h*0.16, '#f7f3e4');
  }

  // Faceted essence gem — solid ink diamond with white facet lines
  function essenceShard(ctx, x, y, size, ink) {
    var g = G();
    ctx.fillStyle = g.ink;
    ctx.beginPath();
    ctx.moveTo(x, y - size);
    ctx.lineTo(x + size*0.72, y);
    ctx.lineTo(x, y + size);
    ctx.lineTo(x - size*0.72, y);
    ctx.closePath(); ctx.fill();
    // Facet lines
    ctx.strokeStyle = 'rgba(247,243,228,0.85)';
    ctx.lineWidth = 0.9;
    ctx.beginPath(); ctx.moveTo(x, y - size); ctx.lineTo(x, y + size); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - size*0.72, y); ctx.lineTo(x + size*0.72, y); ctx.stroke();
  }

  // Legacy tally health (unused by the new HUD, kept callable)
  function tallyHealth(ctx, x, y, hp, maxHp, ink, faded) {
    barOrnate(ctx, x, y, 150, 10, hp / maxHp, null, null, 'HP');
  }

  // Cooldown circle — ink ring that refills
  function staminaCircle(ctx, x, y, r, pct, ink, faded) {
    var g = G();
    ctx.fillStyle = 'rgba(252,249,240,0.8)';
    ctx.beginPath(); ctx.arc(x, y, r + 2, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = 'rgba(26,23,18,0.25)'; ctx.lineWidth = 2.4;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI*2); ctx.stroke();
    if (pct > 0) {
      ctx.strokeStyle = g.ink;
      ctx.beginPath(); ctx.arc(x, y, r, -Math.PI/2, -Math.PI/2 + Math.PI*2*Math.min(1, pct)); ctx.stroke();
      if (pct >= 1) {
        ctx.fillStyle = g.ink;
        ctx.beginPath(); ctx.arc(x, y, r*0.42, 0, Math.PI*2); ctx.fill();
      }
    }
  }

  // Heal pulse: small ink cross drifting up
  function healPulse(ctx, cx, topY, t, color) {
    var cycle = (t % 60) / 60;
    var y = topY - 8 - cycle * 12;
    var a = cycle < 0.2 ? cycle / 0.2 : 1 - (cycle - 0.2) / 0.8;
    ctx.save();
    ctx.globalAlpha = Math.max(0, a) * 0.95;
    ctx.strokeStyle = G().ink; ctx.lineWidth = 2.4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(cx, y - 5); ctx.lineTo(cx, y + 5); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx - 5, y); ctx.lineTo(cx + 5, y); ctx.stroke();
    ctx.restore();
  }

  // Arcane bolt — ink swirl with pale core
  function magicBolt(ctx, x, y, r, ink, frame) {
    var g = G();
    var gr = ctx.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, '#f7f3e4'); gr.addColorStop(0.55, '#57514a'); gr.addColorStop(1, 'rgba(26,23,18,0)');
    ctx.fillStyle = gr;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = g.ink; ctx.lineWidth = 1.6;
    var a = (frame || 0) * 0.25;
    ctx.beginPath(); ctx.arc(x, y, r, a, a + Math.PI*1.5); ctx.stroke();
    ctx.beginPath(); ctx.arc(x, y, r*0.55, -a, -a + Math.PI*1.4); ctx.stroke();
  }

  // ══════════════ ENVIRONMENT ══════════════

  function moon(ctx, x, y, r) {
    var g = G();
    ctx.fillStyle = '#fdfbf1';
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = 'rgba(26,23,18,0.75)'; ctx.lineWidth = 1.6;
    ctx.stroke();
    // Craters
    ctx.fillStyle = 'rgba(26,23,18,0.18)';
    ctx.beginPath(); ctx.arc(x + r*0.3, y - r*0.15, r*0.16, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(x - r*0.2, y + r*0.3, r*0.11, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(x - r*0.35, y - r*0.35, r*0.08, 0, Math.PI*2); ctx.fill();
  }

  function stars(ctx, w, h, frame, seed) {
    ctx.fillStyle = '#1a1712';
    for (var i = 0; i < 30; i++) {
      var x = rnd(i * 7 + seed) * w;
      var y = rnd(i * 13 + seed + 5) * h * 0.5;
      var twinkle = 0.15 + 0.3 * Math.abs(Math.sin(frame * 0.02 + i * 1.7));
      ctx.globalAlpha = twinkle;
      ctx.fillRect(x, y, 1.4, 1.4);
    }
    ctx.globalAlpha = 1;
  }

  // Wall torch with cartoon ink flame
  function torch(ctx, x, y, frame, scale) {
    var s = scale || 1;
    // Bracket
    ctx.strokeStyle = '#1a1712'; ctx.lineWidth = 3*s; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - 10*s); ctx.stroke();
    ctx.fillStyle = '#57514a';
    ctx.strokeStyle = '#1a1712'; ctx.lineWidth = 1.2*s;
    ctx.beginPath();
    ctx.moveTo(x - 4*s, y - 10*s); ctx.lineTo(x + 4*s, y - 10*s);
    ctx.lineTo(x + 2.6*s, y - 16*s); ctx.lineTo(x - 2.6*s, y - 16*s);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    // Flame
    inkFlame(ctx, x, y - 15*s, 5.5*s, 13*s, x * 0.7);
  }

  // Giant stone statue of a chess piece (background monument)
  function statue(ctx, type, x, groundY, h, broken) {
    ctx.save();
    ctx.globalAlpha = 0.92;
    var stonePal = { body:'#a9a28c', hi:'#c5beaa', lo:'#7d7660', dk:'#57514a',
                     outline:'#1a1712', eye:'#57514a', eyeGlow:null, glowing:false };
    drawPieceShape(ctx, type, x, groundY, h, stonePal);
    if (broken) {
      ctx.strokeStyle = '#1a1712'; ctx.lineWidth = Math.max(1.4, h*0.02);
      ctx.beginPath();
      ctx.moveTo(x - h*0.1, groundY - h*0.75);
      ctx.lineTo(x + h*0.04, groundY - h*0.5);
      ctx.lineTo(x - h*0.06, groundY - h*0.3);
      ctx.stroke();
    }
    // Grass tufts at base
    ctx.strokeStyle = 'rgba(26,23,18,0.45)'; ctx.lineWidth = 1.2;
    for (var t2 = -2; t2 <= 2; t2++) {
      ctx.beginPath();
      ctx.moveTo(x + t2*h*0.12, groundY);
      ctx.lineTo(x + t2*h*0.12 + jit(t2, 3), groundY - h*0.06);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Internal: draw a piece silhouette with an explicit palette
  function drawPieceShape(ctx, type, cx, cy, h, p) {
    setPiece(ctx, cx, cy, h, p);
    var w = h * 0.7;
    pieceBase(ctx, cx, cy, h, w, p);
    if (type === 'rook' || type === 'tower') {
      ctx.beginPath();
      ctx.moveTo(cx - w*0.3, cy - h*0.18); ctx.lineTo(cx - w*0.26, cy - h*0.78);
      ctx.lineTo(cx - w*0.36, cy - h*0.78); ctx.lineTo(cx - w*0.36, cy - h*0.95);
      ctx.lineTo(cx - w*0.12, cy - h*0.95); ctx.lineTo(cx - w*0.12, cy - h*0.84);
      ctx.lineTo(cx + w*0.12, cy - h*0.84); ctx.lineTo(cx + w*0.12, cy - h*0.95);
      ctx.lineTo(cx + w*0.36, cy - h*0.95); ctx.lineTo(cx + w*0.36, cy - h*0.78);
      ctx.lineTo(cx + w*0.26, cy - h*0.78); ctx.lineTo(cx + w*0.3, cy - h*0.18);
      ctx.closePath(); ctx.fill(); ctx.stroke();
    } else if (type === 'knight') {
      ctx.beginPath();
      ctx.moveTo(cx - w*0.2, cy - h*0.18);
      ctx.quadraticCurveTo(cx - w*0.4, cy - h*0.55, cx - w*0.24, cy - h*0.84);
      ctx.quadraticCurveTo(cx - w*0.1, cy - h*1.0, cx + w*0.14, cy - h*0.94);
      ctx.lineTo(cx + w*0.44, cy - h*0.7);
      ctx.quadraticCurveTo(cx + w*0.3, cy - h*0.5, cx + w*0.24, cy - h*0.18);
      ctx.closePath(); ctx.fill(); ctx.stroke();
    } else if (type === 'bishop') {
      ctx.beginPath();
      ctx.moveTo(cx - w*0.26, cy - h*0.18);
      ctx.quadraticCurveTo(cx - w*0.3, cy - h*0.55, cx - w*0.1, cy - h*0.72);
      ctx.quadraticCurveTo(cx - w*0.24, cy - h*0.92, cx, cy - h*1.0);
      ctx.quadraticCurveTo(cx + w*0.24, cy - h*0.92, cx + w*0.1, cy - h*0.72);
      ctx.quadraticCurveTo(cx + w*0.3, cy - h*0.55, cx + w*0.26, cy - h*0.18);
      ctx.closePath(); ctx.fill(); ctx.stroke();
    } else if (type === 'king') {
      ctx.beginPath();
      ctx.moveTo(cx - w*0.32, cy - h*0.18);
      ctx.quadraticCurveTo(cx - w*0.2, cy - h*0.5, cx - w*0.16, cy - h*0.72);
      ctx.lineTo(cx + w*0.16, cy - h*0.72);
      ctx.quadraticCurveTo(cx + w*0.2, cy - h*0.5, cx + w*0.32, cy - h*0.18);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.rect(cx - w*0.22, cy - h*0.82, w*0.44, h*0.1); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.rect(cx - w*0.04, cy - h*1.06, w*0.08, h*0.24); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.rect(cx - w*0.12, cy - h*1.0, w*0.24, h*0.06); ctx.fill(); ctx.stroke();
    } else if (type === 'queen') {
      ctx.beginPath();
      ctx.moveTo(cx - w*0.3, cy - h*0.18);
      ctx.quadraticCurveTo(cx - w*0.14, cy - h*0.5, cx - w*0.1, cy - h*0.74);
      ctx.lineTo(cx + w*0.1, cy - h*0.74);
      ctx.quadraticCurveTo(cx + w*0.14, cy - h*0.5, cx + w*0.3, cy - h*0.18);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx - w*0.24, cy - h*0.74);
      for (var i = 0; i < 4; i++) {
        ctx.lineTo(cx - w*0.24 + (i + 0.5) * w*0.12, cy - h*0.95);
        ctx.lineTo(cx - w*0.24 + (i + 1) * w*0.12, cy - h*0.74);
      }
      ctx.closePath(); ctx.fill(); ctx.stroke();
    } else { // pawn
      ctx.beginPath();
      ctx.moveTo(cx - w*0.28, cy - h*0.18);
      ctx.quadraticCurveTo(cx - w*0.32, cy - h*0.48, cx - w*0.14, cy - h*0.58);
      ctx.lineTo(cx + w*0.14, cy - h*0.58);
      ctx.quadraticCurveTo(cx + w*0.32, cy - h*0.48, cx + w*0.28, cy - h*0.18);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(cx, cy - h*0.78, h*0.2, 0, Math.PI*2); ctx.fill(); ctx.stroke();
    }
  }

  // Gothic window (background, grayscale panes)
  function glassWindow(ctx, x, y, w, h, frame) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x - w/2, y + h);
    ctx.lineTo(x - w/2, y + h*0.3);
    ctx.quadraticCurveTo(x - w/2, y, x, y - h*0.06);
    ctx.quadraticCurveTo(x + w/2, y, x + w/2, y + h*0.3);
    ctx.lineTo(x + w/2, y + h);
    ctx.closePath();
    var gl = ctx.createLinearGradient(x, y, x, y + h);
    gl.addColorStop(0, 'rgba(250,247,238,0.9)');
    gl.addColorStop(0.5, 'rgba(220,214,192,0.8)');
    gl.addColorStop(1, 'rgba(180,172,146,0.7)');
    ctx.fillStyle = gl;
    ctx.fill();
    // Mullions
    ctx.strokeStyle = 'rgba(26,23,18,0.85)'; ctx.lineWidth = 2;
    ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x, y - h*0.04); ctx.lineTo(x, y + h); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - w/2, y + h*0.45); ctx.lineTo(x + w/2, y + h*0.45); ctx.stroke();
    // Light shaft
    ctx.globalAlpha = 0.10 + Math.sin(frame * 0.01 + x) * 0.02;
    ctx.fillStyle = '#fdfbf1';
    ctx.beginPath();
    ctx.moveTo(x - w/2, y + h*0.1);
    ctx.lineTo(x + w/2, y + h*0.1);
    ctx.lineTo(x + w*1.6, y + h*2.4);
    ctx.lineTo(x - w*0.2, y + h*2.4);
    ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  // Hanging banner with a chess emblem (ink cloth, pale emblem)
  function bannerFlag(ctx, x, y, w, h, emblem, frame) {
    var g = G();
    var sway = Math.sin(frame * 0.03 + x * 0.1) * w * 0.08;
    // Rod
    ctx.strokeStyle = '#1a1712'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(x - w*0.7, y); ctx.lineTo(x + w*0.7, y); ctx.stroke();
    // Cloth
    var cloth = ctx.createLinearGradient(x, y, x, y + h);
    cloth.addColorStop(0, '#3a352c'); cloth.addColorStop(1, '#14110c');
    ctx.fillStyle = cloth;
    ctx.strokeStyle = '#0c0a07'; ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(x - w/2, y);
    ctx.lineTo(x + w/2, y);
    ctx.lineTo(x + w/2 + sway*0.4, y + h*0.72);
    ctx.lineTo(x + sway, y + h);
    ctx.lineTo(x - w/2 + sway*0.4, y + h*0.72);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    // Pale trim
    ctx.strokeStyle = 'rgba(247,243,228,0.8)'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(x - w/2 + 2, y + 4); ctx.lineTo(x + w/2 - 2, y + 4); ctx.stroke();
    // Emblem
    ctx.fillStyle = '#f7f3e4';
    ctx.font = Math.round(h*0.34) + 'px serif';
    ctx.textAlign = 'center';
    ctx.fillText(emblem || '♟', x + sway*0.4, y + h*0.5);
    ctx.textAlign = 'left';
  }

  // Twisted leafless tree
  function deadTree(ctx, x, groundY, h, seed) {
    ctx.strokeStyle = '#1a1712'; ctx.lineCap = 'round';
    function branch(bx, by, angle, len, w2, depth) {
      if (depth <= 0 || len < 4) return;
      var ex = bx + Math.cos(angle) * len;
      var ey = by + Math.sin(angle) * len;
      ctx.lineWidth = w2;
      ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(ex, ey); ctx.stroke();
      branch(ex, ey, angle - 0.5 - rnd(seed+depth)*0.4, len * 0.68, w2 * 0.65, depth - 1);
      branch(ex, ey, angle + 0.45 + rnd(seed+depth+3)*0.4, len * 0.62, w2 * 0.65, depth - 1);
    }
    branch(x, groundY, -Math.PI/2 + jit(seed, 0.2), h * 0.42, h * 0.075, 4);
  }

  function gravestone(ctx, x, groundY, s, seed) {
    var lean = jit(seed, 0.12);
    ctx.save();
    ctx.translate(x, groundY);
    ctx.rotate(lean);
    var stone = ctx.createLinearGradient(-s/2, -s, s/2, 0);
    stone.addColorStop(0, '#b3ab92'); stone.addColorStop(1, '#7d7660');
    ctx.fillStyle = stone;
    ctx.strokeStyle = '#1a1712'; ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-s*0.4, 0);
    ctx.lineTo(-s*0.4, -s*0.75);
    ctx.arc(0, -s*0.75, s*0.4, Math.PI, 0);
    ctx.lineTo(s*0.4, 0);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(26,23,18,0.6)'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(-s*0.18, -s*0.72); ctx.lineTo(s*0.18, -s*0.72); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, -s*0.9); ctx.lineTo(0, -s*0.58); ctx.stroke();
    ctx.restore();
  }

  function chain(ctx, x, y, len, frame, seed) {
    var sway = Math.sin(frame * 0.02 + seed) * len * 0.06;
    ctx.strokeStyle = '#3a352c'; ctx.lineWidth = 2;
    var links = Math.floor(len / 9);
    for (var i = 0; i < links; i++) {
      var t2 = i / links;
      var lx = x + sway * t2 * t2;
      var ly = y + i * 9;
      ctx.beginPath();
      ctx.ellipse(lx, ly + 4, 3, 5, sway * 0.01, 0, Math.PI*2);
      ctx.stroke();
    }
  }

  function gear(ctx, x, y, r, frame, dir) {
    var a = frame * 0.01 * (dir || 1);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(a);
    ctx.fillStyle = '#3a352c'; ctx.strokeStyle = '#0c0a07'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI*2); ctx.fill(); ctx.stroke();
    for (var j = 0; j < 8; j++) {
      var ang2 = j * Math.PI / 4;
      ctx.fillRect(Math.cos(ang2)*r - r*0.1, Math.sin(ang2)*r - r*0.09, r*0.22, r*0.18);
    }
    ctx.fillStyle = '#0c0a07';
    ctx.beginPath(); ctx.arc(0, 0, r*0.3, 0, Math.PI*2); ctx.fill();
    ctx.restore();
  }

  // ── Platforms: stone slabs with checkerboard tops ──────────────────────────
  function platform(ctx, p, zone) {
    var isGround = p.h >= 30;
    // Stone body
    var body = ctx.createLinearGradient(p.x, p.y, p.x, p.y + p.h);
    body.addColorStop(0, '#9a9179');
    body.addColorStop(1, isGround ? '#453f32' : '#6e6753');
    ctx.fillStyle = body;
    ctx.fillRect(p.x, p.y, p.w, p.h);
    // Checkerboard top strip
    var tileW = 24, stripH = Math.min(8, p.h * 0.5);
    for (var tx = 0; tx < p.w; tx += tileW) {
      var even = (Math.floor((p.x + tx) / tileW) % 2) === 0;
      ctx.fillStyle = even ? '#f2edda' : '#1a1712';
      ctx.fillRect(p.x + tx, p.y, Math.min(tileW, p.w - tx), stripH);
    }
    // Bevel + outline
    ctx.strokeStyle = '#1a1712'; ctx.lineWidth = 1.5;
    ctx.strokeRect(p.x + 0.5, p.y + 0.5, p.w - 1, p.h - 1);
    // Stone seams on ground
    if (isGround) {
      ctx.strokeStyle = 'rgba(26,23,18,0.4)'; ctx.lineWidth = 1;
      for (var sx = 40; sx < p.w; sx += 76) {
        ctx.beginPath();
        ctx.moveTo(p.x + sx, p.y + stripH);
        ctx.lineTo(p.x + sx + jit(sx, 5), p.y + p.h);
        ctx.stroke();
      }
    } else {
      // Floating slab: little support corbels
      ctx.fillStyle = '#453f32';
      ctx.beginPath();
      ctx.moveTo(p.x + 6, p.y + p.h); ctx.lineTo(p.x + 16, p.y + p.h); ctx.lineTo(p.x + 11, p.y + p.h + 7);
      ctx.closePath(); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(p.x + p.w - 16, p.y + p.h); ctx.lineTo(p.x + p.w - 6, p.y + p.h); ctx.lineTo(p.x + p.w - 11, p.y + p.h + 7);
      ctx.closePath(); ctx.fill();
    }
  }

  // ── Parallax background per zone ───────────────────────────────────────────
  function background(ctx, zone, camX, camY, frame, roomW, roomH) {
    var Z = C.ZONE_ART[zone] || C.ZONE_ART[0];
    var W = C.W, H = C.H;

    // Paper sky
    var sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, Z.skyTop);
    sky.addColorStop(0.75, Z.skyBot);
    sky.addColorStop(1, Z.horizon);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    if (Z.stars) stars(ctx, W, H, frame, zone * 17);
    if (Z.moon) moon(ctx, W - 130 - camX * 0.02, 74 - camY * 0.02, 34);

    // Far layer (parallax 0.15)
    var fx = -(camX * 0.15) % 800;
    ctx.save();
    for (var rep = -1; rep <= Math.ceil(W / 800) + 1; rep++) {
      farLayer(ctx, zone, fx + rep * 800, H, frame);
    }
    ctx.restore();

    // Mid layer (parallax 0.4)
    var mx = -(camX * 0.4) % 800;
    ctx.save();
    for (var rep2 = -1; rep2 <= Math.ceil(W / 800) + 1; rep2++) {
      midLayer(ctx, zone, mx + rep2 * 800, H, frame);
    }
    ctx.restore();

    // Fog band
    var fog = ctx.createLinearGradient(0, H * 0.55, 0, H);
    fog.addColorStop(0, 'rgba(0,0,0,0)');
    fog.addColorStop(1, Z.fog);
    ctx.fillStyle = fog;
    ctx.fillRect(0, H * 0.55, W, H * 0.45);

    particles(ctx, Z.particles, frame, camX);
  }

  function farLayer(ctx, zone, ox, H, frame) {
    var Z = C.ZONE_ART[zone];
    ctx.fillStyle = Z.far;
    if (zone === 0) {
      // The distant castle on its hill — the goal
      ctx.beginPath();
      ctx.moveTo(ox, H*0.72);
      ctx.quadraticCurveTo(ox + 200, H*0.55, ox + 400, H*0.6);
      ctx.quadraticCurveTo(ox + 620, H*0.66, ox + 800, H*0.72);
      ctx.lineTo(ox + 800, H); ctx.lineTo(ox, H);
      ctx.closePath(); ctx.fill();
      castleSilhouette(ctx, ox + 340, H*0.585, 0.5, Z.far, frame);
    } else if (zone === 1) {
      // Treeline
      for (var i = 0; i < 7; i++) {
        var tx = ox + i * 120 + jit(i, 25);
        ctx.beginPath();
        ctx.moveTo(tx - 34, H*0.78);
        ctx.quadraticCurveTo(tx - 40, H*0.5, tx, H*0.38 + jit(i*3, 20));
        ctx.quadraticCurveTo(tx + 40, H*0.5, tx + 34, H*0.78);
        ctx.closePath(); ctx.fill();
      }
      ctx.fillRect(ox, H*0.74, 800, H*0.26);
    } else if (zone === 2) {
      // Mountain range
      ctx.beginPath();
      ctx.moveTo(ox, H);
      ctx.lineTo(ox, H*0.62);
      ctx.lineTo(ox + 140, H*0.34);
      ctx.lineTo(ox + 260, H*0.56);
      ctx.lineTo(ox + 420, H*0.24);
      ctx.lineTo(ox + 560, H*0.52);
      ctx.lineTo(ox + 700, H*0.36);
      ctx.lineTo(ox + 800, H*0.6);
      ctx.lineTo(ox + 800, H);
      ctx.closePath(); ctx.fill();
      // Snow caps
      ctx.fillStyle = 'rgba(253,251,241,0.75)';
      [[140, 0.34],[420, 0.24],[700, 0.36]].forEach(function(m2) {
        ctx.beginPath();
        ctx.moveTo(ox + m2[0] - 22, H*m2[1] + 22);
        ctx.lineTo(ox + m2[0], H*m2[1]);
        ctx.lineTo(ox + m2[0] + 22, H*m2[1] + 22);
        ctx.closePath(); ctx.fill();
      });
      ctx.fillStyle = Z.far;
    } else if (zone === 3) {
      // Furnace skyline: chimneys and soot
      var soot = ctx.createLinearGradient(0, H*0.4, 0, H);
      soot.addColorStop(0, 'rgba(26,23,18,0)');
      soot.addColorStop(1, 'rgba(26,23,18,0.16)');
      ctx.fillStyle = soot;
      ctx.fillRect(ox, H*0.4, 800, H*0.6);
      ctx.fillStyle = Z.far;
      ctx.fillRect(ox, H*0.7, 800, H*0.3);
      for (var c2 = 0; c2 < 4; c2++) {
        var chx = ox + 90 + c2 * 200;
        ctx.fillRect(chx, H*0.42, 34, H*0.32);
        ctx.fillRect(chx - 6, H*0.42 - 8, 46, 10);
        // White-hot chimney mouth
        ctx.fillStyle = 'rgba(253,251,241,0.7)';
        ctx.fillRect(chx + 4, H*0.42 - 4, 26, 4);
        ctx.fillStyle = Z.far;
      }
    } else if (zone === 4) {
      // Ruined wall + a fallen giant king on the horizon
      ctx.fillRect(ox, H*0.72, 800, H*0.28);
      for (var r2 = 0; r2 < 5; r2++) {
        var rx = ox + 70 + r2 * 160;
        var rh = 30 + rnd(r2 * 7) * 55;
        ctx.fillRect(rx, H*0.72 - rh, 44 + rnd(r2) * 30, rh);
      }
      drawPieceShape(ctx, 'king', ox + 420, H*0.72, 90,
        { body:Z.mid, hi:Z.mid, lo:Z.far, dk:Z.far, outline:'rgba(26,23,18,0.4)' });
    } else {
      // Castle interior far wall: arches
      ctx.fillStyle = Z.far;
      ctx.fillRect(ox, 0, 800, H);
      ctx.fillStyle = Z.mid;
      for (var a2 = 0; a2 < 4; a2++) {
        var ax = ox + 100 + a2 * 200;
        ctx.beginPath();
        ctx.moveTo(ax - 55, H);
        ctx.lineTo(ax - 55, H*0.4);
        ctx.quadraticCurveTo(ax, H*0.22, ax + 55, H*0.4);
        ctx.lineTo(ax + 55, H);
        ctx.closePath(); ctx.fill();
      }
    }
  }

  function midLayer(ctx, zone, ox, H, frame) {
    var Z = C.ZONE_ART[zone];
    ctx.fillStyle = Z.mid;
    if (zone === 0) {
      // Rolling hedge hills
      ctx.beginPath();
      ctx.moveTo(ox, H);
      ctx.quadraticCurveTo(ox + 200, H*0.8, ox + 420, H*0.86);
      ctx.quadraticCurveTo(ox + 640, H*0.92, ox + 800, H*0.85);
      ctx.lineTo(ox + 800, H);
      ctx.closePath(); ctx.fill();
    } else if (zone === 1) {
      // Big twisted trees
      for (var i = 0; i < 3; i++) {
        deadTree(ctx, ox + 120 + i * 280, H, 240 + jit(i, 40), i * 9 + 3);
      }
    } else if (zone === 2) {
      // Rock spires + hanging chains
      for (var s2 = 0; s2 < 3; s2++) {
        var sx = ox + 110 + s2 * 260;
        ctx.beginPath();
        ctx.moveTo(sx - 40, H);
        ctx.lineTo(sx - 14, H*0.5 + jit(s2, 30));
        ctx.lineTo(sx + 8, H*0.62);
        ctx.lineTo(sx + 36, H);
        ctx.closePath(); ctx.fill();
      }
      chain(ctx, ox + 210, 0, 110, frame, 1);
      chain(ctx, ox + 580, 0, 150, frame, 4);
    } else if (zone === 3) {
      // Gears and pipes
      gear(ctx, ox + 170, H*0.42, 42, frame, 1);
      gear(ctx, ox + 232, H*0.52, 26, frame, -1);
      gear(ctx, ox + 600, H*0.36, 34, frame, -1);
      ctx.fillStyle = '#3a352c';
      ctx.fillRect(ox + 380, H*0.3, 18, H*0.7);
      ctx.fillRect(ox + 340, H*0.46, 100, 14);
    } else if (zone === 4) {
      // Gravestones on a mound line
      ctx.beginPath();
      ctx.moveTo(ox, H);
      ctx.quadraticCurveTo(ox + 300, H*0.84, ox + 800, H*0.9);
      ctx.lineTo(ox + 800, H);
      ctx.closePath(); ctx.fill();
      for (var g2 = 0; g2 < 4; g2++) {
        gravestone(ctx, ox + 120 + g2 * 190, H*0.9 + 4, 34, g2 * 5 + 1);
      }
    } else {
      // Columns marching down the hall
      for (var c3 = 0; c3 < 3; c3++) {
        var cx = ox + 130 + c3 * 270;
        var col = ctx.createLinearGradient(cx - 24, 0, cx + 24, 0);
        col.addColorStop(0, '#57514a'); col.addColorStop(0.5, '#847c64'); col.addColorStop(1, '#453f32');
        ctx.fillStyle = col;
        ctx.fillRect(cx - 20, 40, 40, H);
        ctx.fillRect(cx - 30, 20, 60, 26);
        ctx.fillRect(cx - 28, H - 60, 56, 60);
      }
      // Windows between columns
      glassWindow(ctx, ox + 265, 60, 64, 150, frame);
      glassWindow(ctx, ox + 535, 60, 64, 150, frame);
    }
  }

  function particles(ctx, kind, frame, camX) {
    var W = C.W, H = C.H;
    if (!kind) return;
    for (var i = 0; i < 26; i++) {
      var seedX = rnd(i * 11) * (W + 60) - 30;
      if (kind === 'fireflies') {
        var fx2 = (seedX + Math.sin(frame * 0.011 + i) * 30 - camX * 0.5) % (W + 60);
        if (fx2 < -30) fx2 += W + 60;
        var fy = H * (0.35 + rnd(i * 3) * 0.55) + Math.sin(frame * 0.02 + i * 2) * 12;
        var blink = Math.max(0, Math.sin(frame * 0.035 + i * 2.7));
        ctx.fillStyle = 'rgba(26,23,18,' + (blink * 0.55) + ')';
        ctx.beginPath(); ctx.arc(fx2, fy, 1.5, 0, Math.PI*2); ctx.fill();
      } else if (kind === 'embers') {
        var ey = H - ((frame * (0.6 + rnd(i) * 0.7) + i * 53) % (H + 40));
        var ex = (seedX + Math.sin(frame * 0.02 + i) * 18 - camX * 0.5) % (W + 60);
        if (ex < -30) ex += W + 60;
        var life = 1 - Math.abs(ey - H * 0.4) / (H * 0.7);
        ctx.fillStyle = 'rgba(26,23,18,' + Math.max(0, life * 0.7) + ')';
        ctx.fillRect(ex, ey, 2.2, 2.2);
      } else if (kind === 'leaves') {
        var ly = ((frame * (0.4 + rnd(i) * 0.5) + i * 67) % (H + 40)) - 20;
        var lx = (seedX + Math.sin(frame * 0.015 + i * 1.3) * 40 - camX * 0.5) % (W + 60);
        if (lx < -30) lx += W + 60;
        ctx.save();
        ctx.translate(lx, ly);
        ctx.rotate(frame * 0.02 + i);
        ctx.fillStyle = 'rgba(26,23,18,0.4)';
        ctx.fillRect(-2.4, -1.2, 4.8, 2.4);
        ctx.restore();
      } else if (kind === 'wind') {
        var wx = ((frame * (3 + rnd(i) * 3) + i * 71) % (W + 140)) - 70;
        var wy = H * (0.15 + rnd(i * 7) * 0.7);
        ctx.strokeStyle = 'rgba(26,23,18,0.14)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(wx, wy);
        ctx.quadraticCurveTo(wx + 20, wy - 3, wx + 44, wy);
        ctx.stroke();
      } else if (kind === 'ash') {
        var ay = ((frame * (0.3 + rnd(i) * 0.4) + i * 61) % (H + 40)) - 20;
        var ax2 = (seedX + Math.sin(frame * 0.01 + i * 2.1) * 26 - camX * 0.5) % (W + 60);
        if (ax2 < -30) ax2 += W + 60;
        ctx.fillStyle = 'rgba(26,23,18,0.28)';
        ctx.fillRect(ax2, ay, 1.8, 1.8);
      } else if (kind === 'dust') {
        var dx2 = (seedX + Math.sin(frame * 0.006 + i) * 24 - camX * 0.4) % (W + 60);
        if (dx2 < -30) dx2 += W + 60;
        var dy = H * (0.15 + rnd(i * 5) * 0.75) + Math.sin(frame * 0.012 + i * 3) * 9;
        var tw = 0.08 + 0.08 * Math.sin(frame * 0.03 + i * 1.9);
        ctx.fillStyle = 'rgba(26,23,18,' + tw + ')';
        ctx.fillRect(dx2, dy, 1.6, 1.6);
      }
    }
  }

  // Soft pencil-shaded edges around the play field
  function vignette(ctx) {
    var v = ctx.createRadialGradient(C.W/2, C.H/2, C.H*0.5, C.W/2, C.H/2, C.W*0.74);
    v.addColorStop(0, 'rgba(0,0,0,0)');
    v.addColorStop(1, 'rgba(26,23,18,0.20)');
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, C.W, C.H);
  }

  // ── Castle drawings ────────────────────────────────────────────────────────
  function castleSilhouette(ctx, cx, baseY, s, color, frame) {
    ctx.fillStyle = color;
    // Keep + two towers, rook-style tops
    function rookTop(x, y, w) {
      ctx.fillRect(x - w*0.08, y - 8*s, w*1.16, 8*s);
      for (var i = 0; i < 4; i++) {
        ctx.fillRect(x - w*0.08 + i * w * 1.16/3.4, y - 15*s, w*0.18, 8*s);
      }
    }
    ctx.fillRect(cx - 90*s, baseY - 110*s, 60*s, 110*s); rookTop(cx - 90*s, baseY - 110*s, 60*s);
    ctx.fillRect(cx + 30*s, baseY - 110*s, 60*s, 110*s); rookTop(cx + 30*s, baseY - 110*s, 60*s);
    ctx.fillRect(cx - 45*s, baseY - 150*s, 90*s, 150*s); rookTop(cx - 45*s, baseY - 150*s, 90*s);
    ctx.fillRect(cx - 130*s, baseY - 70*s, 260*s, 70*s);
    // Pale lit windows
    ctx.fillStyle = 'rgba(253,251,241,' + (0.5 + Math.sin((frame||0) * 0.03) * 0.15) + ')';
    ctx.fillRect(cx - 12*s, baseY - 120*s, 8*s, 14*s);
    ctx.fillRect(cx + 6*s, baseY - 95*s, 8*s, 14*s);
    ctx.fillRect(cx - 70*s, baseY - 85*s, 7*s, 12*s);
    ctx.fillRect(cx + 55*s, baseY - 80*s, 7*s, 12*s);
  }

  // The dungeon castle mass for the stage map — matches the pencil concept:
  // a dark hatched castle cross-section; chambers/corridors are cut into it
  // by the map screen afterwards. Fills the rect (x0,y0,w,h).
  function dungeonCastle(ctx, x0, y0, w, h, frame) {
    var g = G();
    var ink = '#26221b';
    var cx = x0 + w/2;
    var wallTop = y0 + h * 0.2;

    function towerBody(tx, tw, top, domed) {
      ctx.fillStyle = ink;
      ctx.fillRect(tx, top, tw, wallTop - top + 10);
      if (domed) {
        // Rounded cap
        ctx.beginPath();
        ctx.moveTo(tx - tw*0.12, top);
        ctx.quadraticCurveTo(tx + tw*0.5, top - tw*0.85, tx + tw*1.12, top);
        ctx.closePath(); ctx.fill();
        ctx.fillRect(tx - tw*0.12, top - 2, tw*1.24, 5);
      } else {
        // Battlement top
        var mw = tw / 5;
        for (var i = 0; i < 3; i++) {
          ctx.fillRect(tx + i * mw * 2, top - mw*1.3, mw*1.25, mw*1.3 + 2);
        }
        ctx.fillRect(tx - tw*0.08, top - 2, tw*1.16, 6);
      }
      // Tiny pale window
      ctx.fillStyle = 'rgba(242,237,218,0.9)';
      var wy = top + (wallTop - top) * 0.3;
      ctx.fillRect(tx + tw/2 - 3, wy, 6, 10);
      ctx.fillStyle = ink;
    }

    // Main mass
    ctx.fillStyle = ink;
    ctx.fillRect(x0, wallTop, w, h - (wallTop - y0));

    // Wall battlements between towers
    for (var b = 0; b < Math.floor(w / 34); b++) {
      ctx.fillRect(x0 + 6 + b * 34, wallTop - 12, 18, 14);
    }

    // Towers: flanking turrets (domed), mid towers, tall central keep
    towerBody(x0 + w*0.02, w*0.075, wallTop - h*0.12, true);
    towerBody(x0 + w*0.2,  w*0.1,   wallTop - h*0.18, false);
    towerBody(x0 + w*0.44, w*0.12,  wallTop - h*0.26, false); // keep
    towerBody(x0 + w*0.7,  w*0.1,   wallTop - h*0.16, false);
    towerBody(x0 + w*0.905, w*0.075, wallTop - h*0.1, true);
    // Keep's cap turret
    ctx.fillStyle = ink;
    ctx.fillRect(cx - w*0.025, wallTop - h*0.34, w*0.05, h*0.1);
    ctx.beginPath();
    ctx.moveTo(cx - w*0.035, wallTop - h*0.34);
    ctx.quadraticCurveTo(cx, wallTop - h*0.4, cx + w*0.035, wallTop - h*0.34);
    ctx.closePath(); ctx.fill();

    // Pencil hatching over the whole mass
    hatchRect(ctx, x0 - 10, y0 - h*0.45, w + 20, h * 1.5, 'rgba(242,237,218,0.10)', 5, 1);
    hatchRect(ctx, x0 - 10, wallTop, w + 20, h - (wallTop - y0), 'rgba(12,10,7,0.5)', 9, 0.5);

    // Rough scribbled edge around the mass
    ctx.strokeStyle = 'rgba(12,10,7,0.8)';
    roughRect(ctx, x0, wallTop, w, h - (wallTop - y0), 'rgba(12,10,7,0.8)', 2, 5);
  }

  // Padlock icon
  function lockIcon(ctx, x, y, s) {
    ctx.strokeStyle = '#847c64'; ctx.lineWidth = s*0.22;
    ctx.beginPath();
    ctx.arc(x, y - s*0.28, s*0.34, Math.PI, 0);
    ctx.stroke();
    var gr = ctx.createLinearGradient(x, y - s*0.3, x, y + s*0.6);
    gr.addColorStop(0, '#c5beaa'); gr.addColorStop(1, '#847c64');
    ctx.fillStyle = gr;
    ctx.strokeStyle = '#1a1712'; ctx.lineWidth = 1.4;
    ctx.beginPath();
    var w = s * 1.0, h = s * 0.85;
    ctx.rect(x - w/2, y - s*0.28, w, h);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#1a1712';
    ctx.beginPath(); ctx.arc(x, y + s*0.06, s*0.14, 0, Math.PI*2); ctx.fill();
    ctx.fillRect(x - s*0.05, y + s*0.06, s*0.1, s*0.24);
  }

  // Small crown badge (ink)
  function crownIcon(ctx, x, y, s) {
    var g = G();
    ctx.fillStyle = g.ink;
    ctx.strokeStyle = g.ink; ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x - s*0.7, y);
    ctx.lineTo(x - s*0.8, y - s*0.75);
    ctx.lineTo(x - s*0.35, y - s*0.4);
    ctx.lineTo(x, y - s*0.95);
    ctx.lineTo(x + s*0.35, y - s*0.4);
    ctx.lineTo(x + s*0.8, y - s*0.75);
    ctx.lineTo(x + s*0.7, y);
    ctx.closePath();
    ctx.fill();
    // Jewel dots
    ctx.fillStyle = '#f7f3e4';
    ctx.beginPath(); ctx.arc(x, y - s*0.25, s*0.09, 0, Math.PI*2); ctx.fill();
  }

  return { pawn, bishop, tower, knight, horse, queen, king, bard, spear, player, sword, hpBar,
           jit, rnd, isDarkColor, inkLine, inkRect, solidRect, hatchRect, roughRect,
           hero, skullFace, corruption, bonfire, altar, inkFlame,
           realmkeeper, essenceShard, tallyHealth, staminaCircle, magicBolt, healPulse,
           palFor, barOrnate, panel, ornateFrame, panelFrameOnly,
           background, platform, vignette, particles,
           moon, stars, torch, statue, glassWindow, bannerFlag, deadTree, gravestone, chain, gear,
           castleSilhouette, dungeonCastle, lockIcon, crownIcon };
})();
