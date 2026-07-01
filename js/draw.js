// ── Art library: cartoon chess pieces in a gothic, Symphony-of-the-Night mood ─
// Every piece is a chunky cartoon chess piece: thick outlines, gradient bodies,
// expressive eyes (white pieces get friendly dark eyes, black pieces get a red
// glow). Backgrounds are layered parallax paintings per zone.
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
             outline:g.outlineW, eye:'#2c2118', eyeGlow:null, glowing:false };
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
      ctx.save();
      ctx.shadowColor = p.eyeGlow;
      ctx.shadowBlur = s * 1.6;
      ctx.fillStyle = p.eye;
      // Angled glowing almonds
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

  // Bishop — tall mitre with the diagonal slash, plague-doctor mood for black
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
    // Diagonal mitre slash — glows on black pieces
    ctx.strokeStyle = p.glowing ? '#c86bff' : p.dk;
    ctx.lineWidth = Math.max(1.4, h*0.045);
    if (p.glowing) { ctx.save(); ctx.shadowColor = 'rgba(190,110,255,0.9)'; ctx.shadowBlur = 6; }
    ctx.beginPath();
    ctx.moveTo(cx - w*0.14, cy - h*0.74);
    ctx.lineTo(cx + w*0.1, cy - h*0.94);
    ctx.stroke();
    if (p.glowing) ctx.restore();
    // Orb on tip
    ctx.fillStyle = p.glowing ? '#c86bff' : p.hi;
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
    ctx.fillStyle = p.dk;
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

  // Knight — the horse-head piece. Unmounted: living piece; mounted: full horse.
  function knight(ctx, cx, cy, h, color, mounted, facing) {
    var p = palFor(color);
    var f = facing || -1;
    if (mounted) {
      var bob = Math.sin(tick() * 0.18 + cx * 0.01) * h * 0.015;
      var hh = h * 0.5;
      setPiece(ctx, cx, cy, h, p);
      // Legs (bent, mid-gallop)
      ctx.lineWidth = Math.max(2, h*0.06);
      [[-0.3,-0.12],[-0.1,0.06],[0.12,-0.1],[0.3,0.08]].forEach(function(l, i) {
        ctx.beginPath();
        ctx.moveTo(cx + l[0]*h*0.8, cy - hh*0.5 + bob);
        ctx.quadraticCurveTo(cx + l[0]*h*0.8 + l[1]*h, cy - hh*0.2, cx + l[0]*h*0.8 + l[1]*h*0.6, cy);
        ctx.stroke();
      });
      // Horse body
      ctx.beginPath();
      ctx.ellipse(cx, cy - hh*0.62 + bob, h*0.42, hh*0.36, 0, 0, Math.PI*2);
      ctx.fill(); ctx.stroke();
      // Neck + chess-knight head
      ctx.beginPath();
      ctx.moveTo(cx + f*h*0.18, cy - hh*0.8 + bob);
      ctx.quadraticCurveTo(cx + f*h*0.44, cy - hh*1.25, cx + f*h*0.4, cy - hh*1.5 + bob);
      ctx.lineTo(cx + f*h*0.62, cy - hh*1.28 + bob);           // muzzle
      ctx.quadraticCurveTo(cx + f*h*0.66, cy - hh*1.1, cx + f*h*0.5, cy - hh*1.02 + bob);
      ctx.quadraticCurveTo(cx + f*h*0.42, cy - hh*0.72, cx + f*h*0.34, cy - hh*0.6 + bob);
      ctx.closePath();
      ctx.fill(); ctx.stroke();
      // Ear + mane
      ctx.beginPath();
      ctx.moveTo(cx + f*h*0.34, cy - hh*1.48 + bob);
      ctx.lineTo(cx + f*h*0.3, cy - hh*1.68 + bob);
      ctx.lineTo(cx + f*h*0.42, cy - hh*1.52 + bob);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = p.dk; ctx.lineWidth = Math.max(1.5, h*0.045);
      ctx.beginPath();
      ctx.moveTo(cx + f*h*0.24, cy - hh*1.35 + bob);
      ctx.quadraticCurveTo(cx - f*h*0.02, cy - hh*1.0, cx - f*h*0.05, cy - hh*0.85 + bob);
      ctx.stroke();
      eyes(ctx, cx + f*h*0.4, cy - hh*1.32 + bob, h*0.055, p, 0, 'mean');
      // Armored rider hump
      ctx.fillStyle = bodyGrad(ctx, cx, cy, h, p);
      ctx.strokeStyle = p.outline; ctx.lineWidth = Math.max(1.6, h*0.05);
      ctx.beginPath();
      ctx.arc(cx - f*h*0.18, cy - hh*1.06 + bob, h*0.13, Math.PI, 0);
      ctx.closePath(); ctx.fill(); ctx.stroke();
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
    // Ball tips on the crown points
    ctx.fillStyle = p.glowing ? G().arcane : G().gold;
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
    // Dark aura for big (boss-scaled) black kings
    if (p.glowing && h > 48) {
      var t2 = tick();
      ctx.save();
      ctx.globalAlpha = 0.35;
      ctx.fillStyle = '#1a0b22';
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
    // Cross on top
    ctx.fillStyle = p.glowing ? G().blood : G().gold;
    ctx.strokeStyle = p.outline; ctx.lineWidth = Math.max(1.3, h*0.04);
    ctx.beginPath(); ctx.rect(cx - w*0.035, cy - h*1.12, w*0.07, h*0.24); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.rect(cx - w*0.11, cy - h*1.06, w*0.22, h*0.06); ctx.fill(); ctx.stroke();
    eyes(ctx, cx, cy - h*0.74, h*0.065, p, 0, 'mean');
  }

  // Skeleton bard with lute — the save-point troubadour
  function bard(ctx, cx, cy, h, color) {
    var p = palFor(color);
    var g = G();
    var bob = Math.sin(tick() * 0.09) * h * 0.015;
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    // Hooded robe
    var robe = ctx.createLinearGradient(cx, cy - h, cx, cy);
    robe.addColorStop(0, '#3d3357'); robe.addColorStop(1, '#191227');
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
    ctx.fillStyle = '#12101c';
    ctx.beginPath(); ctx.ellipse(cx - h*0.055, cy - h*0.7 + bob, h*0.045, h*0.055, 0, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx + h*0.055, cy - h*0.7 + bob, h*0.045, h*0.055, 0, 0, Math.PI*2); ctx.fill();
    // Grin
    ctx.strokeStyle = '#12101c'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(cx - h*0.05, cy - h*0.6 + bob); ctx.lineTo(cx + h*0.05, cy - h*0.6 + bob); ctx.stroke();
    for (var i = -1; i <= 1; i++) {
      ctx.beginPath(); ctx.moveTo(cx + i*h*0.03, cy - h*0.62 + bob); ctx.lineTo(cx + i*h*0.03, cy - h*0.58 + bob); ctx.stroke();
    }
    // Lute (strums)
    var strum = Math.sin(tick() * 0.14) * h*0.02;
    ctx.fillStyle = '#7a5427'; ctx.strokeStyle = g.outline; ctx.lineWidth = Math.max(1.3, h*0.03);
    ctx.beginPath(); ctx.ellipse(cx + h*0.26, cy - h*0.3 + strum, h*0.16, h*0.12, -0.5, 0, Math.PI*2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx + h*0.32, cy - h*0.4 + strum); ctx.lineTo(cx + h*0.52, cy - h*0.62 + strum); ctx.stroke();
    ctx.strokeStyle = g.goldHi; ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.moveTo(cx + h*0.2, cy - h*0.26 + strum); ctx.lineTo(cx + h*0.5, cy - h*0.58 + strum); ctx.stroke();
    // Bony strumming hand
    ctx.fillStyle = g.ivory;
    ctx.beginPath(); ctx.arc(cx + h*0.24, cy - h*0.28 + strum*2, h*0.04, 0, Math.PI*2); ctx.fill();
    // Music notes
    var nf = tick();
    if (Math.floor(nf / 50) % 2 === 0) {
      ctx.fillStyle = g.goldHi; ctx.font = Math.round(h*0.22) + 'px serif';
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
    ctx.fillStyle = '#6e4a26';
    ctx.strokeStyle = g.outline; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.rect(-w/2, -h*0.28, w*0.72, h*0.56); ctx.fill(); ctx.stroke();
    // Gold band
    ctx.fillStyle = g.gold;
    ctx.fillRect(w*0.1, -h*0.32, w*0.06, h*0.64);
    // Steel leaf tip
    var steel = ctx.createLinearGradient(w*0.2, -h, w*0.5, h);
    steel.addColorStop(0, '#e8ecf4'); steel.addColorStop(1, '#8a93a8');
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
    steel.addColorStop(0, '#eef2f8'); steel.addColorStop(1, '#97a1b5');
    ctx.fillStyle = steel; ctx.strokeStyle = g.outline; ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(-h*0.045, 0);
    ctx.lineTo(-h*0.045, -h*0.42);
    ctx.lineTo(0, -h*0.5);
    ctx.lineTo(h*0.045, -h*0.42);
    ctx.lineTo(h*0.045, 0);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    // Gold guard + pommel
    ctx.fillStyle = g.gold;
    ctx.beginPath(); ctx.rect(-h*0.13, -h*0.015, h*0.26, h*0.05); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.rect(-h*0.03, h*0.03, h*0.06, h*0.1); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(0, h*0.16, h*0.035, 0, Math.PI*2); ctx.fill(); ctx.stroke();
    // Swing arc
    if (attacking) {
      ctx.restore();
      ctx.save();
      ctx.strokeStyle = 'rgba(240,245,255,0.35)';
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
    var offsetY = 0;
    if (mounted) {
      knight(ctx, cx, cy, h * 1.5, color, true, facing);
      offsetY = -h * 0.62;
    }
    pawnHero(ctx, cx, cy + offsetY, h, p, facing, attacking, false, 'pawn', { sword:true, shielding:shielding && abilities && abilities.shield });
  }

  // ── The Adventure hero: cartoon white pawn, cape, spear, form accents ──────
  function hero(ctx, cx, cy, h, paperCol, inkCol, facing, attacking, dashing, form) {
    var p = palFor('#ffffff');
    pawnHero(ctx, cx, cy, h, p, facing, attacking, dashing, form || 'pawn', { spear:true });
  }

  function pawnHero(ctx, cx, cy, h, p, facing, attacking, dashing, form, opts) {
    opts = opts || {};
    var g = G();
    var w = h * 0.74;
    var t2 = tick();
    var sway = Math.sin(t2 * 0.08 + cx * 0.02);

    // Cape — flows behind the hero
    var capeX = -facing;
    var flap = dashing ? h*0.34 : h*0.1 * (1 + sway*0.4);
    var cape = ctx.createLinearGradient(cx, cy - h*0.8, cx + capeX * h*0.5, cy);
    cape.addColorStop(0, '#3d2a63'); cape.addColorStop(1, '#1b1030');
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
    // Red cross tabard mark
    ctx.fillStyle = g.blood;
    ctx.fillRect(cx - h*0.025, cy - h*0.5, h*0.05, h*0.22);
    ctx.fillRect(cx - h*0.085, cy - h*0.44, h*0.17, h*0.05);
    // Gold collar
    ctx.fillStyle = g.gold; ctx.strokeStyle = p.outline; ctx.lineWidth = Math.max(1.4, h*0.045);
    ctx.beginPath();
    ctx.ellipse(cx, cy - h*0.58, w*0.42, h*0.075, 0, 0, Math.PI*2);
    ctx.fill(); ctx.stroke();

    // Head: rounded helmet with T-visor
    ctx.fillStyle = bodyGrad(ctx, cx, cy, h, p);
    ctx.beginPath();
    ctx.arc(cx, cy - h*0.79, h*0.215, 0, Math.PI*2);
    ctx.fill(); ctx.stroke();
    // Visor slit (dark T) with bright eyes inside
    ctx.fillStyle = '#241c30';
    ctx.beginPath();
    ctx.rect(cx - h*0.13, cy - h*0.85, h*0.26, h*0.075);
    ctx.fill();
    ctx.fillRect(cx + facing*h*0.02 - h*0.028, cy - h*0.85, h*0.056, h*0.17);
    // Eyes in the slit
    ctx.fillStyle = '#eaf2ff';
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
      ctx.fillStyle = '#9aa2b8';
      for (var i = -1; i <= 1; i++) {
        ctx.beginPath(); ctx.rect(cx + i*h*0.09 - h*0.032, cy - h*1.06, h*0.064, h*0.075); ctx.fill(); ctx.stroke();
      }
    } else if (form === 'knight') {
      // Horsehair crest
      ctx.fillStyle = g.blood;
      ctx.beginPath();
      ctx.moveTo(cx - facing*h*0.06, cy - h*0.99);
      ctx.quadraticCurveTo(cx - facing*h*0.2, cy - h*1.16, cx - facing*h*0.3, cy - h*1.0);
      ctx.quadraticCurveTo(cx - facing*h*0.16, cy - h*1.02, cx - facing*h*0.02, cy - h*0.94);
      ctx.closePath(); ctx.fill(); ctx.stroke();
    } else if (form === 'bishop') {
      // Mitre point
      ctx.fillStyle = g.arcane;
      ctx.beginPath();
      ctx.moveTo(cx - h*0.07, cy - h*0.97);
      ctx.lineTo(cx, cy - h*1.14);
      ctx.lineTo(cx + h*0.07, cy - h*0.97);
      ctx.closePath(); ctx.fill(); ctx.stroke();
    } else if (form === 'queen') {
      // Gold crown
      ctx.fillStyle = g.gold;
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
      ctx.fillStyle = '#8a93a8'; ctx.strokeStyle = g.outline; ctx.lineWidth = Math.max(1.5, h*0.05);
      ctx.beginPath();
      ctx.moveTo(sx0 - h*0.13, cy - h*0.72);
      ctx.lineTo(sx0 + h*0.13, cy - h*0.72);
      ctx.lineTo(sx0 + h*0.13, cy - h*0.4);
      ctx.quadraticCurveTo(sx0, cy - h*0.24, sx0 - h*0.13, cy - h*0.4);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = g.gold;
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
        ctx.strokeStyle = '#6e4a26'; ctx.lineWidth = Math.max(2.2, h*0.07);
        ctx.beginPath(); ctx.moveTo(sx - facing*h*0.25, cy - h*0.45); ctx.lineTo(tipX - facing*h*0.12, cy - h*0.45); ctx.stroke();
        var steel = ctx.createLinearGradient(tipX - facing*h*0.2, cy - h*0.55, tipX, cy - h*0.35);
        steel.addColorStop(0, '#eef2f8'); steel.addColorStop(1, '#97a1b5');
        ctx.fillStyle = steel; ctx.strokeStyle = g.outline; ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(tipX, cy - h*0.45);
        ctx.lineTo(tipX - facing*h*0.17, cy - h*0.55);
        ctx.lineTo(tipX - facing*h*0.17, cy - h*0.35);
        ctx.closePath(); ctx.fill(); ctx.stroke();
        // Thrust streaks
        ctx.strokeStyle = 'rgba(240,245,255,0.3)'; ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.moveTo(sx, cy - h*0.56); ctx.lineTo(tipX - facing*h*0.2, cy - h*0.56); ctx.stroke();
      } else {
        // Vertical at rest
        ctx.strokeStyle = '#6e4a26'; ctx.lineWidth = Math.max(2.2, h*0.07);
        ctx.beginPath(); ctx.moveTo(sx, cy - h*0.02); ctx.lineTo(sx, cy - h*1.14); ctx.stroke();
        ctx.strokeStyle = g.gold; ctx.lineWidth = Math.max(1, h*0.03);
        ctx.beginPath(); ctx.moveTo(sx - h*0.035, cy - h*0.62); ctx.lineTo(sx + h*0.035, cy - h*0.62); ctx.stroke();
        var steel2 = ctx.createLinearGradient(sx - h*0.09, cy - h*1.36, sx + h*0.09, cy - h*1.1);
        steel2.addColorStop(0, '#eef2f8'); steel2.addColorStop(1, '#97a1b5');
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
      ctx.globalAlpha = 0.3;
      for (var d2 = 1; d2 <= 2; d2++) {
        ctx.globalAlpha = 0.3 / d2;
        ctx.fillStyle = '#cfe2ff';
        ctx.beginPath();
        ctx.ellipse(cx - facing * d2 * w*0.7, cy - h*0.45, w*0.34, h*0.42, 0, 0, Math.PI*2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  // ── HP bars ────────────────────────────────────────────────────────────────
  function hpBar(ctx, x, y, w, h, pct, color, bgColor) {
    ctx.fillStyle = 'rgba(8,5,15,0.75)';
    ctx.fillRect(x-1, y-1, w+2, h+2);
    var gr = ctx.createLinearGradient(x, y, x, y+h);
    gr.addColorStop(0, '#e0374a'); gr.addColorStop(1, '#7c1120');
    ctx.fillStyle = gr;
    ctx.fillRect(x, y, w * Math.max(0, Math.min(1, pct)), h);
    ctx.strokeStyle = G().goldLo;
    ctx.lineWidth = 1;
    ctx.strokeRect(x - 0.5, y - 0.5, w + 1, h + 1);
  }

  // Ornate SOTN-style resource bar
  function barOrnate(ctx, x, y, w, h, pct, colHi, colLo, label) {
    var g = G();
    // Frame
    ctx.fillStyle = 'rgba(6,4,12,0.85)';
    ctx.fillRect(x - 2, y - 2, w + 4, h + 4);
    ctx.strokeStyle = g.goldLo; ctx.lineWidth = 1;
    ctx.strokeRect(x - 2.5, y - 2.5, w + 5, h + 5);
    ctx.strokeStyle = g.gold;
    ctx.strokeRect(x - 0.5, y - 0.5, w + 1, h + 1);
    // Fill
    pct = Math.max(0, Math.min(1, pct));
    if (pct > 0) {
      var gr = ctx.createLinearGradient(x, y, x, y + h);
      gr.addColorStop(0, colHi); gr.addColorStop(1, colLo);
      ctx.fillStyle = gr;
      ctx.fillRect(x, y, w * pct, h);
      // Shine
      ctx.fillStyle = 'rgba(255,255,255,0.28)';
      ctx.fillRect(x, y + 1, w * pct, Math.max(1, h * 0.24));
    }
    // Quarter ticks
    ctx.strokeStyle = 'rgba(0,0,0,0.4)';
    for (var i = 1; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(x + w*i/4 + 0.5, y); ctx.lineTo(x + w*i/4 + 0.5, y + h);
      ctx.stroke();
    }
    if (label) {
      ctx.font = 'bold ' + Math.round(h + 2) + 'px ' + C.FONT_GOTH;
      ctx.fillStyle = g.goldHi;
      ctx.textAlign = 'right';
      ctx.fillText(label, x - 7, y + h - 1);
      ctx.textAlign = 'left';
    }
  }

  // Dark translucent panel with gold ornate frame + corner diamonds
  function panel(ctx, x, y, w, h) {
    var g = G();
    ctx.fillStyle = g.panel;
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = g.goldLo; ctx.lineWidth = 3;
    ctx.strokeRect(x + 1.5, y + 1.5, w - 3, h - 3);
    ctx.strokeStyle = g.gold; ctx.lineWidth = 1;
    ctx.strokeRect(x + 5.5, y + 5.5, w - 11, h - 11);
    // Corner diamonds
    ctx.fillStyle = g.gold;
    [[x+5.5, y+5.5],[x+w-5.5, y+5.5],[x+5.5, y+h-5.5],[x+w-5.5, y+h-5.5]].forEach(function(c2) {
      ctx.save();
      ctx.translate(c2[0], c2[1]);
      ctx.rotate(Math.PI/4);
      ctx.fillRect(-3.4, -3.4, 6.8, 6.8);
      ctx.restore();
    });
    // Top sheen
    var sheen = ctx.createLinearGradient(x, y, x, y + 26);
    sheen.addColorStop(0, 'rgba(255,255,255,0.06)'); sheen.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = sheen;
    ctx.fillRect(x + 4, y + 4, w - 8, 22);
  }

  // Full-canvas ornate border (used on menu screens)
  function ornateFrame(ctx) {
    panelFrameOnly(ctx, 10, 10, C.W - 20, C.H - 20);
  }
  function panelFrameOnly(ctx, x, y, w, h) {
    var g = G();
    ctx.strokeStyle = g.goldLo; ctx.lineWidth = 3;
    ctx.strokeRect(x + 1.5, y + 1.5, w - 3, h - 3);
    ctx.strokeStyle = g.gold; ctx.lineWidth = 1;
    ctx.strokeRect(x + 5.5, y + 5.5, w - 11, h - 11);
    ctx.fillStyle = g.gold;
    [[x+5.5, y+5.5],[x+w-5.5, y+5.5],[x+5.5, y+h-5.5],[x+w-5.5, y+h-5.5]].forEach(function(c2) {
      ctx.save(); ctx.translate(c2[0], c2[1]); ctx.rotate(Math.PI/4);
      ctx.fillRect(-3.4, -3.4, 6.8, 6.8);
      ctx.restore();
    });
  }

  // ── Legacy simple primitives (kept for compatibility) ──────────────────────
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

  // ── Adventure decorations ──────────────────────────────────────────────────

  // Glowing red eyes overlay (legacy hook — pieces now have faces built in)
  function skullFace(ctx, cx, cy, h, paper) { /* faces are part of the pieces now */ }

  // Corruption: violet veins crawling over corrupted white pieces
  function corruption(ctx, x, y, w, h, ink, frame) {
    ctx.save();
    ctx.strokeStyle = 'rgba(150,70,255,0.75)';
    ctx.lineWidth = 1.3;
    ctx.shadowColor = 'rgba(150,70,255,0.8)';
    ctx.shadowBlur = 4;
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

  // Bonfire + skeleton bard: warm glowing save point
  function bonfire(ctx, x, groundY, ink, paperCol, frame) {
    var g = G();
    frame = frame == null ? tick() : frame;
    // Warm ground glow
    var glow = ctx.createRadialGradient(x, groundY - 10, 4, x, groundY - 10, 85);
    glow.addColorStop(0, 'rgba(255,150,50,0.30)');
    glow.addColorStop(1, 'rgba(255,150,50,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(x - 90, groundY - 95, 180, 100);
    // Logs
    ctx.strokeStyle = '#4a2f16'; ctx.lineWidth = 5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x-16, groundY-4); ctx.lineTo(x+16, groundY-9); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x-14, groundY-9); ctx.lineTo(x+14, groundY-3); ctx.stroke();
    // Flames: layered teardrops
    var f = frame * 0.13;
    function flame(fx, fy, fw, fh, col, ph) {
      var ox = Math.sin(f + ph) * fw * 0.35;
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.moveTo(fx - fw, fy);
      ctx.quadraticCurveTo(fx - fw*0.8, fy - fh*0.55, fx + ox, fy - fh - Math.sin(f*1.7+ph)*3);
      ctx.quadraticCurveTo(fx + fw*0.8, fy - fh*0.55, fx + fw, fy);
      ctx.closePath(); ctx.fill();
    }
    flame(x, groundY - 6, 13, 34, '#e8541e', 0);
    flame(x, groundY - 6, 9,  26, '#ff9a2a', 1.7);
    flame(x, groundY - 6, 5,  16, '#ffe08a', 3.1);
    // Sparks
    ctx.fillStyle = '#ffcf7a';
    for (var i = 0; i < 3; i++) {
      var st = (frame * 1.2 + i * 47) % 90;
      ctx.globalAlpha = 1 - st / 90;
      ctx.fillRect(x + Math.sin(f + i*2.4) * (6 + st*0.2), groundY - 22 - st*0.6, 2, 2);
    }
    ctx.globalAlpha = 1;
    // Bard sits to the left
    bard(ctx, x - 46, groundY, 46, '#000');
  }

  // Chapel altar: candles, pedestal and a glowing cross
  function altar(ctx, x, groundY, ink, paperCol) {
    var g = G();
    var f = tick() * 0.12;
    // Ambient holy glow
    var glow = ctx.createRadialGradient(x, groundY - 40, 5, x, groundY - 40, 70);
    glow.addColorStop(0, 'rgba(200,170,255,0.18)');
    glow.addColorStop(1, 'rgba(200,170,255,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(x - 72, groundY - 112, 144, 115);
    // Steps
    var stone = ctx.createLinearGradient(x, groundY - 20, x, groundY);
    stone.addColorStop(0, '#59516e'); stone.addColorStop(1, '#2c2740');
    ctx.fillStyle = stone; ctx.strokeStyle = g.outline; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.rect(x - 30, groundY - 10, 60, 10); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.rect(x - 22, groundY - 20, 44, 10); ctx.fill(); ctx.stroke();
    // Pedestal
    ctx.beginPath(); ctx.rect(x - 11, groundY - 46, 22, 26); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.rect(x - 15, groundY - 52, 30, 6); ctx.fill(); ctx.stroke();
    // Cross (gold, glowing)
    ctx.save();
    ctx.shadowColor = 'rgba(255,230,160,0.9)';
    ctx.shadowBlur = 8;
    ctx.fillStyle = g.gold; ctx.strokeStyle = g.goldLo; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.rect(x - 2.5, groundY - 78, 5, 26); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.rect(x - 8.5, groundY - 71, 17, 5); ctx.fill(); ctx.stroke();
    ctx.restore();
    // Candles either side
    [-24, 24].forEach(function(dx, i) {
      ctx.fillStyle = '#e8e2d0';
      ctx.fillRect(x + dx - 2, groundY - 34, 4, 14);
      var co = Math.sin(f * 2 + i * 2) * 1.2;
      ctx.fillStyle = '#ffb84a';
      ctx.beginPath();
      ctx.ellipse(x + dx + co * 0.4, groundY - 38, 2, 4.5, co * 0.1, 0, Math.PI*2);
      ctx.fill();
      ctx.fillStyle = '#fff3c8';
      ctx.beginPath(); ctx.ellipse(x + dx + co * 0.3, groundY - 37, 0.9, 2, 0, 0, Math.PI*2); ctx.fill();
    });
  }

  // The Realmkeeper: hooded narrator, glowing eyes, chess-orb staff
  function realmkeeper(ctx, cx, cy, h, ink, paperCol) {
    var g = G();
    var f = tick() * 0.05;
    // Robe
    var robe = ctx.createLinearGradient(cx, cy - h, cx, cy);
    robe.addColorStop(0, '#463a68'); robe.addColorStop(1, '#161024');
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
    ctx.fillStyle = '#0a0714';
    ctx.beginPath();
    ctx.ellipse(cx, cy - h*0.78, h*0.13, h*0.15, 0, 0, Math.PI*2);
    ctx.fill();
    // Glowing eyes
    ctx.save();
    ctx.shadowColor = 'rgba(140,190,255,0.95)';
    ctx.shadowBlur = 7;
    ctx.fillStyle = '#bfe0ff';
    ctx.beginPath(); ctx.ellipse(cx - h*0.05, cy - h*0.79, h*0.026, h*0.017, -0.25, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx + h*0.05, cy - h*0.79, h*0.026, h*0.017, 0.25, 0, Math.PI*2); ctx.fill();
    ctx.restore();
    // Staff topped with a floating pawn orb
    ctx.strokeStyle = '#5c4a2e'; ctx.lineWidth = Math.max(2.4, h*0.035);
    ctx.beginPath(); ctx.moveTo(cx + h*0.32, cy); ctx.lineTo(cx + h*0.32, cy - h*1.02); ctx.stroke();
    var ob = Math.sin(f * 3) * h * 0.015;
    ctx.save();
    ctx.shadowColor = 'rgba(160,120,255,0.9)';
    ctx.shadowBlur = 9;
    pawn(ctx, cx + h*0.32, cy - h*1.06 + ob, h*0.16, '#f4edda');
    ctx.restore();
  }

  // Faceted essence gem with a violet glow
  function essenceShard(ctx, x, y, size, ink) {
    ctx.save();
    ctx.shadowColor = 'rgba(154,92,255,0.85)';
    ctx.shadowBlur = size * 1.2;
    var gr = ctx.createLinearGradient(x - size, y - size, x + size, y + size);
    gr.addColorStop(0, '#cba6ff'); gr.addColorStop(0.5, '#8a4de8'); gr.addColorStop(1, '#4a1d8a');
    ctx.fillStyle = gr;
    ctx.beginPath();
    ctx.moveTo(x, y - size);
    ctx.lineTo(x + size*0.72, y);
    ctx.lineTo(x, y + size);
    ctx.lineTo(x - size*0.72, y);
    ctx.closePath(); ctx.fill();
    ctx.restore();
    // Facet lines
    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.moveTo(x, y - size); ctx.lineTo(x, y + size); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - size*0.72, y); ctx.lineTo(x + size*0.72, y); ctx.stroke();
  }

  // Legacy tally health (unused by the new HUD, kept callable)
  function tallyHealth(ctx, x, y, hp, maxHp, ink, faded) {
    barOrnate(ctx, x, y, 150, 10, hp / maxHp, '#e0374a', '#7c1120', 'HP');
  }

  // Cooldown circle — gold ring that refills
  function staminaCircle(ctx, x, y, r, pct, ink, faded) {
    var g = G();
    ctx.fillStyle = 'rgba(6,4,12,0.7)';
    ctx.beginPath(); ctx.arc(x, y, r + 2, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = 'rgba(201,164,76,0.28)'; ctx.lineWidth = 2.4;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI*2); ctx.stroke();
    if (pct > 0) {
      ctx.strokeStyle = pct >= 1 ? g.goldHi : g.gold;
      ctx.beginPath(); ctx.arc(x, y, r, -Math.PI/2, -Math.PI/2 + Math.PI*2*Math.min(1, pct)); ctx.stroke();
      if (pct >= 1) {
        ctx.fillStyle = g.goldHi;
        ctx.beginPath(); ctx.arc(x, y, r*0.42, 0, Math.PI*2); ctx.fill();
      }
    }
  }

  // Heal pulse: soft golden cross drifting up
  function healPulse(ctx, cx, topY, t, color) {
    var cycle = (t % 60) / 60;
    var y = topY - 8 - cycle * 12;
    var a = cycle < 0.2 ? cycle / 0.2 : 1 - (cycle - 0.2) / 0.8;
    ctx.save();
    ctx.globalAlpha = Math.max(0, a) * 0.95;
    ctx.shadowColor = 'rgba(255,235,150,0.9)';
    ctx.shadowBlur = 6;
    ctx.strokeStyle = '#ffe9a8'; ctx.lineWidth = 2.4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(cx, y - 5); ctx.lineTo(cx, y + 5); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx - 5, y); ctx.lineTo(cx + 5, y); ctx.stroke();
    ctx.restore();
  }

  // Arcane bolt
  function magicBolt(ctx, x, y, r, ink, frame) {
    ctx.save();
    ctx.shadowColor = 'rgba(154,92,255,0.95)';
    ctx.shadowBlur = r * 1.6;
    var gr = ctx.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, '#f0e4ff'); gr.addColorStop(0.5, '#a86bff'); gr.addColorStop(1, 'rgba(90,40,180,0)');
    ctx.fillStyle = gr;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI*2); ctx.fill();
    // Orbiting sparks
    var a = (frame || 0) * 0.25;
    ctx.fillStyle = '#e0ccff';
    for (var i = 0; i < 3; i++) {
      var ang = a + i * Math.PI * 2 / 3;
      ctx.beginPath();
      ctx.arc(x + Math.cos(ang) * r * 1.1, y + Math.sin(ang) * r * 0.8, r * 0.18, 0, Math.PI*2);
      ctx.fill();
    }
    ctx.restore();
  }

  // ══════════════ ENVIRONMENT ══════════════

  function moon(ctx, x, y, r) {
    ctx.save();
    ctx.shadowColor = 'rgba(240,238,220,0.5)';
    ctx.shadowBlur = r * 0.9;
    var gr = ctx.createRadialGradient(x - r*0.25, y - r*0.25, r*0.1, x, y, r);
    gr.addColorStop(0, '#fdfbf0'); gr.addColorStop(0.8, '#e8e2c8'); gr.addColorStop(1, '#cfc7a4');
    ctx.fillStyle = gr;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI*2); ctx.fill();
    ctx.restore();
    // Craters
    ctx.fillStyle = 'rgba(160,150,120,0.35)';
    ctx.beginPath(); ctx.arc(x + r*0.3, y - r*0.15, r*0.16, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(x - r*0.2, y + r*0.3, r*0.11, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(x - r*0.35, y - r*0.35, r*0.08, 0, Math.PI*2); ctx.fill();
  }

  function stars(ctx, w, h, frame, seed) {
    ctx.fillStyle = '#e8e8ff';
    for (var i = 0; i < 42; i++) {
      var x = rnd(i * 7 + seed) * w;
      var y = rnd(i * 13 + seed + 5) * h * 0.6;
      var twinkle = 0.35 + 0.65 * Math.abs(Math.sin(frame * 0.02 + i * 1.7));
      ctx.globalAlpha = twinkle * 0.8;
      var s = rnd(i * 3) > 0.85 ? 1.8 : 1.1;
      ctx.fillRect(x, y, s, s);
    }
    ctx.globalAlpha = 1;
  }

  // Wall torch with flickering flame + light pool
  function torch(ctx, x, y, frame, scale) {
    var s = scale || 1;
    var f = frame * 0.2 + x * 0.7;
    // Light pool
    var glow = ctx.createRadialGradient(x, y - 14*s, 2, x, y - 14*s, 46*s);
    glow.addColorStop(0, 'rgba(255,160,60,0.30)');
    glow.addColorStop(1, 'rgba(255,160,60,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(x - 48*s, y - 62*s, 96*s, 96*s);
    // Bracket
    ctx.strokeStyle = '#241c30'; ctx.lineWidth = 3*s; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - 10*s); ctx.stroke();
    ctx.fillStyle = '#39304e';
    ctx.beginPath();
    ctx.moveTo(x - 4*s, y - 10*s); ctx.lineTo(x + 4*s, y - 10*s);
    ctx.lineTo(x + 2.6*s, y - 16*s); ctx.lineTo(x - 2.6*s, y - 16*s);
    ctx.closePath(); ctx.fill();
    // Flame
    var ox = Math.sin(f) * 2 * s;
    ctx.fillStyle = '#ff8a1e';
    ctx.beginPath();
    ctx.moveTo(x - 4*s, y - 15*s);
    ctx.quadraticCurveTo(x - 4*s + ox, y - 26*s, x + ox*1.4, y - 30*s - Math.sin(f*1.6)*2*s);
    ctx.quadraticCurveTo(x + 4*s + ox, y - 24*s, x + 4*s, y - 15*s);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ffe08a';
    ctx.beginPath();
    ctx.ellipse(x + ox*0.5, y - 20*s, 2*s, 4*s, 0, 0, Math.PI*2);
    ctx.fill();
  }

  // Giant stone statue of a chess piece (background monument)
  function statue(ctx, type, x, groundY, h, broken) {
    ctx.save();
    ctx.globalAlpha = 0.9;
    // Stone recolor: draw piece in stone hues by temporarily faking a palette
    var stonePal = { body:'#4d4664', hi:'#6b628a', lo:'#332e49', dk:'#232032',
                     outline:'#12101c', eye:'#232032', eyeGlow:null, glowing:false };
    drawPieceShape(ctx, type, x, groundY, h, stonePal);
    if (broken) {
      // Crack lines
      ctx.strokeStyle = '#12101c'; ctx.lineWidth = Math.max(1.4, h*0.02);
      ctx.beginPath();
      ctx.moveTo(x - h*0.1, groundY - h*0.75);
      ctx.lineTo(x + h*0.04, groundY - h*0.5);
      ctx.lineTo(x - h*0.06, groundY - h*0.3);
      ctx.stroke();
    }
    // Moss at base
    ctx.fillStyle = 'rgba(60,110,70,0.5)';
    ctx.beginPath();
    ctx.ellipse(x, groundY - h*0.03, h*0.3, h*0.05, 0, 0, Math.PI*2);
    ctx.fill();
    ctx.restore();
  }

  // Internal: draw a piece silhouette with an explicit palette (no eyes glow)
  function drawPieceShape(ctx, type, cx, cy, h, p) {
    // Simplified stone versions
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

  // Gothic stained-glass window (background, glowing)
  function glassWindow(ctx, x, y, w, h, frame) {
    var g = G();
    // Pointed arch shape
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x - w/2, y + h);
    ctx.lineTo(x - w/2, y + h*0.3);
    ctx.quadraticCurveTo(x - w/2, y, x, y - h*0.06);
    ctx.quadraticCurveTo(x + w/2, y, x + w/2, y + h*0.3);
    ctx.lineTo(x + w/2, y + h);
    ctx.closePath();
    var gl = ctx.createLinearGradient(x, y, x, y + h);
    gl.addColorStop(0, 'rgba(120,90,220,0.65)');
    gl.addColorStop(0.5, 'rgba(70,120,220,0.5)');
    gl.addColorStop(1, 'rgba(160,60,120,0.45)');
    ctx.fillStyle = gl;
    ctx.fill();
    // Mullions
    ctx.strokeStyle = 'rgba(10,8,20,0.8)'; ctx.lineWidth = 2;
    ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x, y - h*0.04); ctx.lineTo(x, y + h); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - w/2, y + h*0.45); ctx.lineTo(x + w/2, y + h*0.45); ctx.stroke();
    // Moonbeam shaft
    ctx.globalAlpha = 0.10 + Math.sin(frame * 0.01 + x) * 0.02;
    ctx.fillStyle = '#cdd6ff';
    ctx.beginPath();
    ctx.moveTo(x - w/2, y + h*0.1);
    ctx.lineTo(x + w/2, y + h*0.1);
    ctx.lineTo(x + w*1.6, y + h*2.4);
    ctx.lineTo(x - w*0.2, y + h*2.4);
    ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  // Hanging banner with a chess emblem
  function bannerFlag(ctx, x, y, w, h, emblem, frame) {
    var g = G();
    var sway = Math.sin(frame * 0.03 + x * 0.1) * w * 0.08;
    // Rod
    ctx.strokeStyle = '#241c30'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(x - w*0.7, y); ctx.lineTo(x + w*0.7, y); ctx.stroke();
    // Cloth
    var cloth = ctx.createLinearGradient(x, y, x, y + h);
    cloth.addColorStop(0, '#6e1622'); cloth.addColorStop(1, '#3a0a12');
    ctx.fillStyle = cloth;
    ctx.strokeStyle = '#12060a'; ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(x - w/2, y);
    ctx.lineTo(x + w/2, y);
    ctx.lineTo(x + w/2 + sway*0.4, y + h*0.72);
    ctx.lineTo(x + sway, y + h);
    ctx.lineTo(x - w/2 + sway*0.4, y + h*0.72);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    // Gold trim
    ctx.strokeStyle = g.gold; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(x - w/2 + 2, y + 4); ctx.lineTo(x + w/2 - 2, y + 4); ctx.stroke();
    // Emblem
    ctx.fillStyle = g.goldHi;
    ctx.font = Math.round(h*0.34) + 'px serif';
    ctx.textAlign = 'center';
    ctx.fillText(emblem || '♟', x + sway*0.4, y + h*0.5);
    ctx.textAlign = 'left';
  }

  // Twisted leafless tree
  function deadTree(ctx, x, groundY, h, seed) {
    ctx.strokeStyle = '#0d1a10'; ctx.lineCap = 'round';
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
    stone.addColorStop(0, '#565073'); stone.addColorStop(1, '#2b2740');
    ctx.fillStyle = stone;
    ctx.strokeStyle = '#12101c'; ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-s*0.4, 0);
    ctx.lineTo(-s*0.4, -s*0.75);
    ctx.arc(0, -s*0.75, s*0.4, Math.PI, 0);
    ctx.lineTo(s*0.4, 0);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(18,16,28,0.7)'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(-s*0.18, -s*0.72); ctx.lineTo(s*0.18, -s*0.72); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, -s*0.9); ctx.lineTo(0, -s*0.58); ctx.stroke();
    ctx.restore();
  }

  function chain(ctx, x, y, len, frame, seed) {
    var sway = Math.sin(frame * 0.02 + seed) * len * 0.06;
    ctx.strokeStyle = '#3c3752'; ctx.lineWidth = 2;
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
    ctx.fillStyle = '#3a2620'; ctx.strokeStyle = '#160d0a'; ctx.lineWidth = 2;
    ctx.beginPath();
    for (var i = 0; i < 8; i++) {
      var ang = i * Math.PI / 4;
      ctx.save(); ctx.rotate(ang);
      ctx.rect(-r*0.12, -r - r*0.18, r*0.24, r*0.2);
      ctx.restore();
    }
    ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI*2); ctx.fill(); ctx.stroke();
    for (var j = 0; j < 8; j++) {
      var ang2 = j * Math.PI / 4;
      ctx.fillRect(Math.cos(ang2)*r - r*0.1, Math.sin(ang2)*r - r*0.09, r*0.22, r*0.18);
    }
    ctx.fillStyle = '#160d0a';
    ctx.beginPath(); ctx.arc(0, 0, r*0.3, 0, Math.PI*2); ctx.fill();
    ctx.restore();
  }

  // ── Platforms: stone slabs with checkerboard marble tops ──────────────────
  function platform(ctx, p, zone) {
    var g = G();
    var isGround = p.h >= 30;
    // Stone body
    var body = ctx.createLinearGradient(p.x, p.y, p.x, p.y + p.h);
    body.addColorStop(0, '#4a4363');
    body.addColorStop(1, isGround ? '#1c1830' : '#2a2540');
    ctx.fillStyle = body;
    ctx.fillRect(p.x, p.y, p.w, p.h);
    // Checkerboard top strip
    var tileW = 24, stripH = Math.min(8, p.h * 0.5);
    for (var tx = 0; tx < p.w; tx += tileW) {
      var even = (Math.floor((p.x + tx) / tileW) % 2) === 0;
      ctx.fillStyle = even ? '#d9d0b8' : '#221d33';
      ctx.fillRect(p.x + tx, p.y, Math.min(tileW, p.w - tx), stripH);
    }
    // Bevel + outline
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.fillRect(p.x, p.y, p.w, 1.5);
    ctx.strokeStyle = '#0e0b1a'; ctx.lineWidth = 1.5;
    ctx.strokeRect(p.x + 0.5, p.y + 0.5, p.w - 1, p.h - 1);
    // Stone seams on ground
    if (isGround) {
      ctx.strokeStyle = 'rgba(10,8,20,0.5)'; ctx.lineWidth = 1;
      for (var sx = 40; sx < p.w; sx += 76) {
        ctx.beginPath();
        ctx.moveTo(p.x + sx, p.y + stripH);
        ctx.lineTo(p.x + sx + jit(sx, 5), p.y + p.h);
        ctx.stroke();
      }
    } else {
      // Floating slab: little support corbels
      ctx.fillStyle = '#241f38';
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

    // Sky
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
      ctx.fillStyle = 'rgba(210,225,250,0.35)';
      [[140, 0.34],[420, 0.24],[700, 0.36]].forEach(function(m2) {
        ctx.beginPath();
        ctx.moveTo(ox + m2[0] - 22, H*m2[1] + 22);
        ctx.lineTo(ox + m2[0], H*m2[1]);
        ctx.lineTo(ox + m2[0] + 22, H*m2[1] + 22);
        ctx.closePath(); ctx.fill();
      });
      ctx.fillStyle = Z.far;
    } else if (zone === 3) {
      // Furnace skyline: chimneys and glow
      var glow = ctx.createLinearGradient(0, H*0.4, 0, H);
      glow.addColorStop(0, 'rgba(255,90,20,0)');
      glow.addColorStop(1, 'rgba(255,90,20,0.22)');
      ctx.fillStyle = glow;
      ctx.fillRect(ox, H*0.4, 800, H*0.6);
      ctx.fillStyle = Z.far;
      ctx.fillRect(ox, H*0.7, 800, H*0.3);
      for (var c2 = 0; c2 < 4; c2++) {
        var chx = ox + 90 + c2 * 200;
        ctx.fillRect(chx, H*0.42, 34, H*0.32);
        ctx.fillRect(chx - 6, H*0.42 - 8, 46, 10);
        // Chimney mouth glow
        ctx.fillStyle = 'rgba(255,130,40,0.65)';
        ctx.fillRect(chx + 4, H*0.42 - 4, 26, 4);
        ctx.fillStyle = Z.far;
      }
    } else if (zone === 4) {
      // Ruined wall + broken giant pieces on the horizon
      ctx.fillRect(ox, H*0.72, 800, H*0.28);
      for (var r2 = 0; r2 < 5; r2++) {
        var rx = ox + 70 + r2 * 160;
        var rh = 30 + rnd(r2 * 7) * 55;
        ctx.fillRect(rx, H*0.72 - rh, 44 + rnd(r2) * 30, rh);
      }
      drawPieceShape(ctx, 'king', ox + 420, H*0.72, 90,
        { body:Z.mid, hi:Z.mid, lo:Z.far, dk:Z.far, outline:'rgba(0,0,0,0.4)' });
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
      // Rolling hedge + fence hills
      ctx.beginPath();
      ctx.moveTo(ox, H);
      ctx.quadraticCurveTo(ox + 200, H*0.8, ox + 420, H*0.86);
      ctx.quadraticCurveTo(ox + 640, H*0.92, ox + 800, H*0.85);
      ctx.lineTo(ox + 800, H);
      ctx.closePath(); ctx.fill();
    } else if (zone === 1) {
      // Big twisted foreground-ish trees
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
      ctx.fillStyle = '#2a1512';
      ctx.fillRect(ox + 380, H*0.3, 18, H*0.7);
      ctx.fillRect(ox + 340, H*0.46, 100, 14);
    } else if (zone === 4) {
      // Planted swords + gravestones on a mound line
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
        col.addColorStop(0, '#241a44'); col.addColorStop(0.5, '#38295e'); col.addColorStop(1, '#1c1338');
        ctx.fillStyle = col;
        ctx.fillRect(cx - 20, 40, 40, H);
        ctx.fillRect(cx - 30, 20, 60, 26);
        ctx.fillRect(cx - 28, H - 60, 56, 60);
      }
      // Stained glass between columns
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
        ctx.fillStyle = 'rgba(190,255,140,' + (blink * 0.8) + ')';
        ctx.beginPath(); ctx.arc(fx2, fy, 1.6, 0, Math.PI*2); ctx.fill();
      } else if (kind === 'embers') {
        var ey = H - ((frame * (0.6 + rnd(i) * 0.7) + i * 53) % (H + 40));
        var ex = (seedX + Math.sin(frame * 0.02 + i) * 18 - camX * 0.5) % (W + 60);
        if (ex < -30) ex += W + 60;
        var life = 1 - Math.abs(ey - H * 0.4) / (H * 0.7);
        ctx.fillStyle = 'rgba(255,' + (120 + ((i * 37) % 80)) + ',40,' + Math.max(0, life * 0.9) + ')';
        ctx.fillRect(ex, ey, 2.2, 2.2);
      } else if (kind === 'leaves') {
        var ly = ((frame * (0.4 + rnd(i) * 0.5) + i * 67) % (H + 40)) - 20;
        var lx = (seedX + Math.sin(frame * 0.015 + i * 1.3) * 40 - camX * 0.5) % (W + 60);
        if (lx < -30) lx += W + 60;
        ctx.save();
        ctx.translate(lx, ly);
        ctx.rotate(frame * 0.02 + i);
        ctx.fillStyle = 'rgba(110,160,90,0.5)';
        ctx.fillRect(-2.4, -1.2, 4.8, 2.4);
        ctx.restore();
      } else if (kind === 'wind') {
        var wx = ((frame * (3 + rnd(i) * 3) + i * 71) % (W + 140)) - 70;
        var wy = H * (0.15 + rnd(i * 7) * 0.7);
        ctx.strokeStyle = 'rgba(200,220,255,0.16)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(wx, wy);
        ctx.quadraticCurveTo(wx + 20, wy - 3, wx + 44, wy);
        ctx.stroke();
      } else if (kind === 'ash') {
        var ay = ((frame * (0.3 + rnd(i) * 0.4) + i * 61) % (H + 40)) - 20;
        var ax2 = (seedX + Math.sin(frame * 0.01 + i * 2.1) * 26 - camX * 0.5) % (W + 60);
        if (ax2 < -30) ax2 += W + 60;
        ctx.fillStyle = 'rgba(200,190,200,0.30)';
        ctx.fillRect(ax2, ay, 1.8, 1.8);
      } else if (kind === 'dust') {
        var dx2 = (seedX + Math.sin(frame * 0.006 + i) * 24 - camX * 0.4) % (W + 60);
        if (dx2 < -30) dx2 += W + 60;
        var dy = H * (0.15 + rnd(i * 5) * 0.75) + Math.sin(frame * 0.012 + i * 3) * 9;
        var tw = 0.12 + 0.12 * Math.sin(frame * 0.03 + i * 1.9);
        ctx.fillStyle = 'rgba(210,200,255,' + tw + ')';
        ctx.fillRect(dx2, dy, 1.6, 1.6);
      }
    }
  }

  // Soft vignette over the play field
  function vignette(ctx) {
    var v = ctx.createRadialGradient(C.W/2, C.H/2, C.H*0.45, C.W/2, C.H/2, C.W*0.72);
    v.addColorStop(0, 'rgba(0,0,0,0)');
    v.addColorStop(1, 'rgba(4,2,10,0.42)');
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, C.W, C.H);
  }

  // ── Castle for the stage map / menu ────────────────────────────────────────
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
    // Lit windows
    ctx.fillStyle = 'rgba(255,190,90,' + (0.5 + Math.sin((frame||0) * 0.03) * 0.15) + ')';
    ctx.fillRect(cx - 12*s, baseY - 120*s, 8*s, 14*s);
    ctx.fillRect(cx + 6*s, baseY - 95*s, 8*s, 14*s);
    ctx.fillRect(cx - 70*s, baseY - 85*s, 7*s, 12*s);
    ctx.fillRect(cx + 55*s, baseY - 80*s, 7*s, 12*s);
  }

  // Full detailed castle for the stage map
  function castleMap(ctx, cx, baseY, s, frame) {
    var g = G();
    function towerGrad(x, w) {
      var gr = ctx.createLinearGradient(x, 0, x + w, 0);
      gr.addColorStop(0, '#4d4568');
      gr.addColorStop(0.5, '#39324e');
      gr.addColorStop(1, '#252038');
      return gr;
    }
    function rookTower(x, y, w, h) {
      ctx.fillStyle = towerGrad(x, w);
      ctx.strokeStyle = '#0e0b1a'; ctx.lineWidth = 2;
      ctx.fillRect(x, y - h, w, h);
      ctx.strokeRect(x, y - h, w, h);
      // Battlements
      var mw = w / 5;
      ctx.fillStyle = '#4d4568';
      for (var i = 0; i < 3; i++) {
        ctx.fillRect(x + i * mw * 2 - mw*0.1, y - h - mw*1.4, mw*1.2, mw*1.4);
        ctx.strokeRect(x + i * mw * 2 - mw*0.1, y - h - mw*1.4, mw*1.2, mw*1.4);
      }
      // Window
      ctx.fillStyle = 'rgba(255,190,90,' + (0.45 + 0.25 * Math.abs(Math.sin(frame * 0.02 + x))) + ')';
      var wx = x + w/2;
      ctx.beginPath();
      ctx.moveTo(wx - w*0.1, y - h*0.5);
      ctx.lineTo(wx - w*0.1, y - h*0.62);
      ctx.arc(wx, y - h*0.62, w*0.1, Math.PI, 0);
      ctx.lineTo(wx + w*0.1, y - h*0.5);
      ctx.closePath(); ctx.fill();
    }
    // Wall base
    ctx.fillStyle = towerGrad(cx - 190*s, 380*s);
    ctx.strokeStyle = '#0e0b1a'; ctx.lineWidth = 2;
    ctx.fillRect(cx - 190*s, baseY - 90*s, 380*s, 90*s);
    ctx.strokeRect(cx - 190*s, baseY - 90*s, 380*s, 90*s);
    // Wall battlements
    for (var b = 0; b < 10; b++) {
      ctx.fillStyle = '#443c5e';
      ctx.fillRect(cx - 190*s + b * 40*s, baseY - 102*s, 22*s, 12*s);
    }
    // Gate
    ctx.fillStyle = '#151022';
    ctx.beginPath();
    ctx.moveTo(cx - 34*s, baseY);
    ctx.lineTo(cx - 34*s, baseY - 46*s);
    ctx.arc(cx, baseY - 46*s, 34*s, Math.PI, 0);
    ctx.lineTo(cx + 34*s, baseY);
    ctx.closePath(); ctx.fill();
    // Portcullis
    ctx.strokeStyle = '#5a5170'; ctx.lineWidth = 2*s;
    for (var pc = -2; pc <= 2; pc++) {
      ctx.beginPath(); ctx.moveTo(cx + pc * 12*s, baseY); ctx.lineTo(cx + pc * 12*s, baseY - 62*s); ctx.stroke();
    }
    ctx.beginPath(); ctx.moveTo(cx - 34*s, baseY - 30*s); ctx.lineTo(cx + 34*s, baseY - 30*s); ctx.stroke();
    // Towers
    rookTower(cx - 230*s, baseY, 70*s, 200*s);
    rookTower(cx + 160*s, baseY, 70*s, 200*s);
    rookTower(cx - 120*s, baseY, 64*s, 150*s);
    rookTower(cx + 56*s, baseY, 64*s, 150*s);
    rookTower(cx - 40*s, baseY, 80*s, 260*s); // central keep
    // Keep banner
    bannerFlag(ctx, cx, baseY - 260*s + 30*s, 30*s, 44*s, '♚', frame);
  }

  // Padlock icon
  function lockIcon(ctx, x, y, s) {
    var g = G();
    ctx.strokeStyle = '#8b93a8'; ctx.lineWidth = s*0.22;
    ctx.beginPath();
    ctx.arc(x, y - s*0.28, s*0.34, Math.PI, 0);
    ctx.stroke();
    var gr = ctx.createLinearGradient(x, y - s*0.3, x, y + s*0.6);
    gr.addColorStop(0, '#a8b0c4'); gr.addColorStop(1, '#5d647a');
    ctx.fillStyle = gr;
    ctx.strokeStyle = '#12101c'; ctx.lineWidth = 1.4;
    ctx.beginPath();
    var w = s * 1.0, h = s * 0.85;
    ctx.rect(x - w/2, y - s*0.28, w, h);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#12101c';
    ctx.beginPath(); ctx.arc(x, y + s*0.06, s*0.14, 0, Math.PI*2); ctx.fill();
    ctx.fillRect(x - s*0.05, y + s*0.06, s*0.1, s*0.24);
  }

  // Small gold crown badge
  function crownIcon(ctx, x, y, s) {
    var g = G();
    ctx.save();
    ctx.shadowColor = 'rgba(242,226,166,0.7)';
    ctx.shadowBlur = s * 0.5;
    var gr = ctx.createLinearGradient(x, y - s, x, y);
    gr.addColorStop(0, g.goldHi); gr.addColorStop(1, g.gold);
    ctx.fillStyle = gr;
    ctx.strokeStyle = g.goldLo; ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(x - s*0.7, y);
    ctx.lineTo(x - s*0.8, y - s*0.75);
    ctx.lineTo(x - s*0.35, y - s*0.4);
    ctx.lineTo(x, y - s*0.95);
    ctx.lineTo(x + s*0.35, y - s*0.4);
    ctx.lineTo(x + s*0.8, y - s*0.75);
    ctx.lineTo(x + s*0.7, y);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.restore();
  }

  return { pawn, bishop, tower, knight, queen, king, bard, spear, player, sword, hpBar,
           jit, rnd, inkLine, inkRect, solidRect, hero, skullFace, corruption, bonfire, altar,
           realmkeeper, essenceShard, tallyHealth, staminaCircle, magicBolt, healPulse,
           // gothic kit
           palFor, barOrnate, panel, ornateFrame, panelFrameOnly,
           background, platform, vignette, particles,
           moon, stars, torch, statue, glassWindow, bannerFlag, deadTree, gravestone, chain, gear,
           castleSilhouette, castleMap, lockIcon, crownIcon };
})();
