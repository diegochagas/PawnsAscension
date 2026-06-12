var Draw = (function() {

  function outline(color) {
    // Handle both '#000' and '#000000' shorthand forms
    var c = color.toLowerCase().replace(/^#/, '');
    var isDark = c === '000' || c === '000000' || parseInt(c.slice(0,2),16) < 80;
    return isDark ? '#ffffff' : '#000000';
  }

  function setupCtx(ctx, color) {
    ctx.fillStyle = color;
    ctx.strokeStyle = outline(color);
    ctx.lineWidth = 1.5;
  }

  // Draw a chess pawn silhouette centred at (cx, cy), height h
  function pawn(ctx, cx, cy, h, color) {
    var w = h * 0.55;
    setupCtx(ctx, color);
    // Base
    var bw = w * 0.9, bh = h * 0.2;
    ctx.beginPath();
    ctx.rect(cx - bw/2, cy - bh, bw, bh);
    ctx.fill(); ctx.stroke();
    // Stem
    ctx.beginPath();
    var sw = w * 0.3, sh = h * 0.4;
    ctx.rect(cx - sw/2, cy - bh - sh, sw, sh);
    ctx.fill(); ctx.stroke();
    // Head
    ctx.beginPath();
    var hr = w * 0.3;
    ctx.arc(cx, cy - bh - sh - hr, hr, 0, Math.PI*2);
    ctx.fill(); ctx.stroke();
  }

  // Draw a bishop silhouette (tall, mitre top)
  function bishop(ctx, cx, cy, h, color) {
    var w = h * 0.5;
    setupCtx(ctx, color);
    // Base
    ctx.beginPath(); ctx.rect(cx - w*0.45, cy - h*0.18, w*0.9, h*0.18); ctx.fill(); ctx.stroke();
    // Body
    ctx.beginPath();
    ctx.moveTo(cx - w*0.3, cy - h*0.18);
    ctx.lineTo(cx + w*0.3, cy - h*0.18);
    ctx.lineTo(cx + w*0.18, cy - h*0.65);
    ctx.lineTo(cx - w*0.18, cy - h*0.65);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    // Mitre
    ctx.beginPath();
    ctx.moveTo(cx - w*0.22, cy - h*0.65);
    ctx.lineTo(cx + w*0.22, cy - h*0.65);
    ctx.lineTo(cx + w*0.1,  cy - h*0.9);
    ctx.lineTo(cx,          cy - h);
    ctx.lineTo(cx - w*0.1,  cy - h*0.9);
    ctx.lineTo(cx - w*0.22, cy - h*0.65);
    ctx.fill(); ctx.stroke();
    // Dot
    ctx.beginPath();
    ctx.arc(cx, cy - h*0.72, w*0.07, 0, Math.PI*2);
    ctx.fillStyle = outline(color); ctx.fill();
    ctx.fillStyle = color;
  }

  // Draw a rook/tower silhouette
  function tower(ctx, cx, cy, h, color) {
    var w = h * 0.6;
    setupCtx(ctx, color);
    // Base
    ctx.beginPath(); ctx.rect(cx - w*0.45, cy - h*0.18, w*0.9, h*0.18); ctx.fill(); ctx.stroke();
    // Body
    ctx.beginPath(); ctx.rect(cx - w*0.35, cy - h*0.75, w*0.7, h*0.57); ctx.fill(); ctx.stroke();
    // Battlements
    [[cx-w*0.35, cx-w*0.15], [cx-w*0.1, cx+w*0.1], [cx+w*0.15, cx+w*0.35]].forEach(function(b) {
      ctx.beginPath(); ctx.rect(b[0], cy - h*0.75 - h*0.15, b[1]-b[0], h*0.15); ctx.fill(); ctx.stroke();
    });
    // Window
    ctx.fillStyle = outline(color);
    ctx.beginPath(); ctx.rect(cx - w*0.1, cy - h*0.55, w*0.2, h*0.2); ctx.fill();
    ctx.fillStyle = color;
  }

  // Draw a knight on/off horse
  function knight(ctx, cx, cy, h, color, mounted) {
    setupCtx(ctx, color);
    if (mounted) {
      // Horse body ellipse
      var hh = h * 0.45;
      ctx.beginPath();
      ctx.ellipse(cx, cy - hh*0.5, h*0.38, hh*0.3, 0, 0, Math.PI*2);
      ctx.fill(); ctx.stroke();
      // Legs
      for (var i=-1; i<=1; i+=2) {
        ctx.beginPath(); ctx.rect(cx + i*h*0.18 - h*0.04, cy - hh*0.28, h*0.08, hh*0.36); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.rect(cx + i*h*0.06 - h*0.04, cy - hh*0.28, h*0.08, hh*0.36); ctx.fill(); ctx.stroke();
      }
      // Horse head
      ctx.beginPath();
      ctx.moveTo(cx + h*0.3, cy - hh*0.6);
      ctx.lineTo(cx + h*0.5, cy - hh*1.05);
      ctx.lineTo(cx + h*0.64, cy - hh*0.88);
      ctx.lineTo(cx + h*0.44, cy - hh*0.4);
      ctx.fill(); ctx.stroke();
      cy = cy - hh; // rider on top
    }
    // Rider body (pawn-like)
    var rh = mounted ? h * 0.55 : h;
    var rw = rh * 0.5;
    ctx.beginPath(); ctx.rect(cx - rw*0.25, cy - rh*0.7, rw*0.5, rh*0.45); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, cy - rh*0.85, rh*0.18, 0, Math.PI*2); ctx.fill(); ctx.stroke();
    // Sword
    ctx.beginPath(); ctx.rect(cx + rw*0.28, cy - rh*0.9, rh*0.06, rh*0.52); ctx.fill(); ctx.stroke();
  }

  // Draw a queen silhouette
  function queen(ctx, cx, cy, h, color) {
    var w = h * 0.55;
    setupCtx(ctx, color);
    // Base
    ctx.beginPath(); ctx.rect(cx - w*0.45, cy - h*0.15, w*0.9, h*0.15); ctx.fill(); ctx.stroke();
    // Body
    ctx.beginPath();
    ctx.moveTo(cx - w*0.35, cy - h*0.15);
    ctx.lineTo(cx + w*0.35, cy - h*0.15);
    ctx.lineTo(cx + w*0.22, cy - h*0.65);
    ctx.lineTo(cx - w*0.22, cy - h*0.65);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    // Crown base
    ctx.beginPath(); ctx.rect(cx - w*0.28, cy - h*0.75, w*0.56, h*0.1); ctx.fill(); ctx.stroke();
    // Crown points
    [-0.25,-0.08,0.08,0.25].forEach(function(px) {
      ctx.beginPath();
      ctx.moveTo(cx+w*px-w*0.04, cy-h*0.75);
      ctx.lineTo(cx+w*px, cy-h*(0.75+0.18+Math.abs(px)*0.1));
      ctx.lineTo(cx+w*px+w*0.04, cy-h*0.75);
      ctx.fill(); ctx.stroke();
    });
    // Head
    ctx.beginPath(); ctx.arc(cx, cy-h*0.78, h*0.1, 0, Math.PI*2); ctx.fill(); ctx.stroke();
  }

  // Draw a king silhouette
  function king(ctx, cx, cy, h, color) {
    var w = h * 0.6;
    setupCtx(ctx, color);
    // Base
    ctx.beginPath(); ctx.rect(cx-w*0.45, cy-h*0.14, w*0.9, h*0.14); ctx.fill(); ctx.stroke();
    // Body
    ctx.beginPath();
    ctx.moveTo(cx-w*0.4, cy-h*0.14);
    ctx.lineTo(cx+w*0.4, cy-h*0.14);
    ctx.lineTo(cx+w*0.25, cy-h*0.65);
    ctx.lineTo(cx-w*0.25, cy-h*0.65);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    // Crown
    ctx.beginPath(); ctx.rect(cx-w*0.3, cy-h*0.75, w*0.6, h*0.1); ctx.fill(); ctx.stroke();
    // Cross
    ctx.beginPath(); ctx.rect(cx-w*0.06, cy-h*0.98, w*0.12, h*0.33); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.rect(cx-w*0.18, cy-h*0.9, w*0.36, h*0.1); ctx.fill(); ctx.stroke();
    // Head
    ctx.beginPath(); ctx.arc(cx, cy-h*0.78, h*0.11, 0, Math.PI*2); ctx.fill(); ctx.stroke();
  }

  // Draw bard (humanoid with hat)
  function bard(ctx, cx, cy, h, color) {
    var w = h * 0.5;
    setupCtx(ctx, color);
    // Body
    ctx.beginPath(); ctx.rect(cx-w*0.25, cy-h*0.65, w*0.5, h*0.45); ctx.fill(); ctx.stroke();
    // Head
    ctx.beginPath(); ctx.arc(cx, cy-h*0.75, h*0.12, 0, Math.PI*2); ctx.fill(); ctx.stroke();
    // Hat brim
    ctx.beginPath(); ctx.rect(cx-w*0.35, cy-h*0.9, w*0.7, h*0.05); ctx.fill(); ctx.stroke();
    // Hat top
    ctx.beginPath(); ctx.rect(cx-w*0.15, cy-h*1.1, w*0.3, h*0.2); ctx.fill(); ctx.stroke();
    // Feather
    ctx.beginPath();
    ctx.moveTo(cx+w*0.15, cy-h*1.1);
    ctx.bezierCurveTo(cx+w*0.4, cy-h*1.25, cx+w*0.5, cy-h*1.0, cx+w*0.15, cy-h*0.9);
    ctx.fill(); ctx.stroke();
    // Lute
    ctx.beginPath(); ctx.arc(cx-w*0.35, cy-h*0.45, h*0.1, 0, Math.PI*2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.rect(cx-w*0.37, cy-h*0.63, h*0.04, h*0.2); ctx.fill(); ctx.stroke();
  }

  // Draw a spear projectile
  function spear(ctx, x, y, w, h, dir, color) {
    ctx.save();
    ctx.translate(x + w/2, y + h/2);
    ctx.rotate(dir > 0 ? 0 : Math.PI);
    setupCtx(ctx, color);
    // Shaft
    ctx.beginPath(); ctx.rect(-w/2, -h/2, w*0.75, h); ctx.fill(); ctx.stroke();
    // Tip
    ctx.beginPath();
    ctx.moveTo(w*0.25, -h*0.8);
    ctx.lineTo(w*0.5, 0);
    ctx.lineTo(w*0.25, h*0.8);
    ctx.fill(); ctx.stroke();
    ctx.restore();
  }

  // Draw player
  function player(ctx, cx, cy, h, color, facing, attacking, shielding, mounted, abilities) {
    var w = h * 0.55;
    setupCtx(ctx, color);

    var offsetY = 0;
    if (mounted) {
      var hh = h * 0.45;
      // Horse body
      ctx.beginPath();
      ctx.ellipse(cx, cy - hh*0.35, h*0.38, hh*0.28, 0, 0, Math.PI*2);
      ctx.fill(); ctx.stroke();
      // Legs
      [-0.22,-0.07,0.07,0.22].forEach(function(px) {
        ctx.beginPath(); ctx.rect(cx+w*px*1.8-h*0.04, cy-hh*0.1, h*0.07, hh*0.38); ctx.fill(); ctx.stroke();
      });
      // Horse head
      var hx = cx + facing*h*0.35;
      ctx.beginPath();
      ctx.moveTo(hx-facing*h*0.08, cy-hh*0.55);
      ctx.lineTo(hx+facing*h*0.15, cy-hh*1.05);
      ctx.lineTo(hx+facing*h*0.28, cy-hh*0.85);
      ctx.lineTo(hx+facing*h*0.1,  cy-hh*0.4);
      ctx.fill(); ctx.stroke();
      offsetY = -hh;
    }

    var by = cy + offsetY;
    setupCtx(ctx, color);
    // Base
    ctx.beginPath(); ctx.rect(cx-w*0.42, by-h*0.22, w*0.84, h*0.22); ctx.fill(); ctx.stroke();
    // Torso
    ctx.beginPath(); ctx.rect(cx-w*0.22, by-h*0.62, w*0.44, h*0.42); ctx.fill(); ctx.stroke();
    // Head
    ctx.beginPath(); ctx.arc(cx, by-h*0.77, h*0.19, 0, Math.PI*2); ctx.fill(); ctx.stroke();

    // Shield or sword
    if (shielding && abilities && abilities.shield) {
      var sx = cx + facing*w*0.38;
      ctx.beginPath(); ctx.rect(sx-h*0.04, by-h*0.7, h*0.08, h*0.55); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.rect(sx-h*0.14, by-h*0.6, h*0.28, h*0.35); ctx.fill(); ctx.stroke();
    } else {
      var swx = cx + facing*w*0.5;
      var swAngle = attacking ? -0.6*facing : 0.3*facing;
      ctx.save();
      ctx.translate(swx, by-h*0.55);
      ctx.rotate(swAngle);
      ctx.beginPath(); ctx.rect(-h*0.04, -h*0.42, h*0.08, h*0.44); ctx.fill(); ctx.stroke();
      // Guard
      ctx.beginPath(); ctx.rect(-h*0.12, -h*0.02, h*0.24, h*0.05); ctx.fill(); ctx.stroke();
      ctx.restore();
    }
  }

  // Draw a sword (shared by player and enemies)
  function sword(ctx, cx, cy, h, color, facing, attacking) {
    var swx = cx + facing * h * 0.3;
    var swAngle = attacking ? -0.55 * facing : 0.25 * facing;
    setupCtx(ctx, color);
    ctx.save();
    ctx.translate(swx, cy - h * 0.55);
    ctx.rotate(swAngle);
    ctx.beginPath(); ctx.rect(-h*0.04, -h*0.42, h*0.08, h*0.44); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.rect(-h*0.12, -h*0.02, h*0.24, h*0.05); ctx.fill(); ctx.stroke();
    ctx.restore();
  }

  // HP bar
  function hpBar(ctx, x, y, w, h, pct, color, bgColor) {
    ctx.fillStyle = bgColor === 'transparent' ? 'rgba(0,0,0,0)' : (bgColor || 'rgba(128,128,128,0.3)');
    if (bgColor !== 'transparent') ctx.fillRect(x, y, w, h);
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w * Math.max(0, pct), h);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, w, h);
  }

  // ════════ Adventure: hand-scribbled ink-on-paper helpers ════════

  // Deterministic jitter so wobbly lines don't flicker every frame
  function jit(seed, mag) {
    var s = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
    return ((s - Math.floor(s)) - 0.5) * 2 * mag;
  }

  // Wobbly hand-drawn line
  function inkLine(ctx, x1, y1, x2, y2, ink, width, seed) {
    ctx.strokeStyle = ink; ctx.lineWidth = width || 2; ctx.lineCap = 'round';
    var segs = Math.max(2, Math.floor(Math.hypot(x2-x1, y2-y1) / 26));
    ctx.beginPath(); ctx.moveTo(x1 + jit(seed, 1.2), y1 + jit(seed+1, 1.2));
    for (var i = 1; i <= segs; i++) {
      var t = i / segs;
      ctx.lineTo(x1 + (x2-x1)*t + jit(seed+i*7, 1.6), y1 + (y2-y1)*t + jit(seed+i*13, 1.6));
    }
    ctx.stroke();
  }

  // Rect drawn as scribble: wobbly outline + diagonal hatch fill
  function inkRect(ctx, x, y, w, h, ink, seed, hatch) {
    seed = seed || (x*7 + y*13);
    if (hatch !== false) {
      ctx.strokeStyle = ink; ctx.lineWidth = 1; ctx.globalAlpha = 0.5;
      var step = 7;
      for (var d = -h; d < w; d += step) {
        var sx = Math.max(x, x + d),         sy = d < 0 ? y - d : y;
        var ex = Math.min(x + w, x + d + h), ey = d + h > w ? y + (w - d) : y + h;
        ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey); ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
    inkLine(ctx, x, y, x+w, y, ink, 2.2, seed);
    inkLine(ctx, x+w, y, x+w, y+h, ink, 2.2, seed+3);
    inkLine(ctx, x+w, y+h, x, y+h, ink, 2.2, seed+5);
    inkLine(ctx, x, y+h, x, y, ink, 2.2, seed+9);
  }

  // Solid ink silhouette rect (for enemies / solid shapes)
  function solidRect(ctx, x, y, w, h, ink) {
    ctx.fillStyle = ink;
    ctx.fillRect(x, y, w, h);
  }

  // The hero: white pawn with pointed helmet (T visor), cross on chest, spear
  function hero(ctx, cx, cy, h, paper, ink, facing, attacking, dashing, form) {
    var w = h * 0.62;
    ctx.fillStyle = paper; ctx.strokeStyle = ink; ctx.lineWidth = 2; ctx.lineJoin = 'round';

    // Legs
    ctx.beginPath(); ctx.rect(cx - w*0.22, cy - h*0.16, w*0.13, h*0.16); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.rect(cx + w*0.09, cy - h*0.16, w*0.13, h*0.16); ctx.fill(); ctx.stroke();

    // Body (tabard with cross)
    ctx.beginPath();
    ctx.moveTo(cx - w*0.34, cy - h*0.16);
    ctx.lineTo(cx + w*0.34, cy - h*0.16);
    ctx.lineTo(cx + w*0.28, cy - h*0.62);
    ctx.lineTo(cx - w*0.28, cy - h*0.62);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    // Cross on chest
    ctx.lineWidth = 1.8;
    inkLine(ctx, cx, cy - h*0.52, cx, cy - h*0.26, ink, 1.8, cx);
    inkLine(ctx, cx - w*0.14, cy - h*0.42, cx + w*0.14, cy - h*0.42, ink, 1.8, cy);

    // Helmet (pointed pawn head with T visor)
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - w*0.26, cy - h*0.62);
    ctx.lineTo(cx + w*0.26, cy - h*0.62);
    ctx.lineTo(cx + w*0.22, cy - h*0.82);
    ctx.lineTo(cx,          cy - h*1.02);
    ctx.lineTo(cx - w*0.22, cy - h*0.82);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    // T visor
    inkLine(ctx, cx - w*0.16, cy - h*0.78, cx + w*0.16, cy - h*0.78, ink, 1.8, cx+1);
    inkLine(ctx, cx + facing*w*0.05, cy - h*0.78, cx + facing*w*0.05, cy - h*0.66, ink, 1.8, cy+1);

    // Spear arm
    var sx = cx + facing * w * 0.42;
    var reach = attacking ? facing * h * 0.55 : 0;
    // Arm
    inkLine(ctx, cx + facing*w*0.2, cy - h*0.5, sx + reach*0.4, cy - h*0.46, ink, 2, cx+2);
    // Spear: vertical at rest, horizontal thrust when attacking
    ctx.strokeStyle = ink;
    if (attacking) {
      var tipX = sx + reach + facing * h * 0.5;
      inkLine(ctx, sx - facing*h*0.2, cy - h*0.46, tipX, cy - h*0.46, ink, 2.4, cx+3);
      // Spearhead
      ctx.fillStyle = ink;
      ctx.beginPath();
      ctx.moveTo(tipX, cy - h*0.46);
      ctx.lineTo(tipX - facing*h*0.14, cy - h*0.56);
      ctx.lineTo(tipX - facing*h*0.14, cy - h*0.36);
      ctx.closePath(); ctx.fill();
    } else {
      inkLine(ctx, sx, cy - h*0.05, sx, cy - h*1.18, ink, 2.4, cx+3);
      ctx.fillStyle = ink;
      ctx.beginPath();
      ctx.moveTo(sx, cy - h*1.34);
      ctx.lineTo(sx - h*0.09, cy - h*1.16);
      ctx.lineTo(sx + h*0.09, cy - h*1.16);
      ctx.closePath(); ctx.fill();
    }

    // Form marker above head (small icon when promoted)
    if (form && form !== 'pawn') {
      ctx.font = '11px ' + C.FONT_HAND;
      ctx.fillStyle = ink; ctx.textAlign = 'center';
      var glyphs = { tower:'♜', knight:'♞', bishop:'♝', queen:'♛' };
      ctx.fillText(glyphs[form] || '', cx, cy - h*1.42);
      ctx.textAlign = 'left';
    }

    // Dash streaks
    if (dashing) {
      ctx.globalAlpha = 0.5;
      for (var i = 1; i <= 3; i++)
        inkLine(ctx, cx - facing*(w*0.6 + i*9), cy - h*(0.3+i*0.14), cx - facing*(w*0.6 + i*9 + 12), cy - h*(0.3+i*0.14), ink, 2, i);
      ctx.globalAlpha = 1;
    }
  }

  // White skull eyes on a black silhouette (adventure enemies)
  function skullFace(ctx, cx, cy, h, paper) {
    ctx.fillStyle = paper;
    ctx.beginPath(); ctx.arc(cx - h*0.07, cy - h*0.78, h*0.045, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + h*0.07, cy - h*0.78, h*0.045, 0, Math.PI*2); ctx.fill();
  }

  // Corruption hatching over a light silhouette (corrupted white pieces)
  function corruption(ctx, x, y, w, h, ink, frame) {
    ctx.strokeStyle = ink; ctx.lineWidth = 1.2; ctx.globalAlpha = 0.65;
    for (var i = 0; i < 5; i++) {
      var sx = x + jit(i*3 + ((frame/20)|0), w*0.4) + w/2;
      inkLine(ctx, sx, y + h*0.1, sx + jit(i+7, 6), y + h*0.9, ink, 1.2, i*11 + ((frame/20)|0));
    }
    ctx.globalAlpha = 1;
  }

  // Bonfire with animated flame + skeleton bard playing a lute
  function bonfire(ctx, x, groundY, ink, paper, frame) {
    // Logs
    inkLine(ctx, x-16, groundY-3, x+16, groundY-8, ink, 3, 1);
    inkLine(ctx, x-14, groundY-8, x+14, groundY-2, ink, 3, 2);
    // Flame: wobbly strokes rising
    var f = frame * 0.12;
    ctx.lineWidth = 2; ctx.strokeStyle = ink;
    for (var i = 0; i < 3; i++) {
      var ox = Math.sin(f + i*2.1) * 4;
      ctx.beginPath();
      ctx.moveTo(x - 8 + i*8, groundY - 6);
      ctx.quadraticCurveTo(x - 8 + i*8 + ox, groundY - 22 - i*4, x + ox*1.5, groundY - 34 - Math.sin(f+i)*5);
      ctx.stroke();
    }
    // Bard: skeleton with hood and lute, sitting to the left
    var bx = x - 46, by = groundY;
    var h = 44;
    ctx.fillStyle = ink;
    // Hooded body (solid silhouette)
    ctx.beginPath();
    ctx.moveTo(bx - h*0.3, by);
    ctx.lineTo(bx + h*0.3, by);
    ctx.lineTo(bx + h*0.24, by - h*0.62);
    ctx.lineTo(bx,         by - h*0.95);
    ctx.lineTo(bx - h*0.24, by - h*0.62);
    ctx.closePath(); ctx.fill();
    // Skull face
    ctx.fillStyle = paper;
    ctx.beginPath(); ctx.arc(bx, by - h*0.62, h*0.14, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = ink;
    ctx.beginPath(); ctx.arc(bx - h*0.05, by - h*0.64, h*0.035, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(bx + h*0.05, by - h*0.64, h*0.035, 0, Math.PI*2); ctx.fill();
    // Lute (strumming bobs with the music)
    var bob = Math.sin(frame * 0.1) * 1.5;
    ctx.beginPath(); ctx.ellipse(bx + h*0.3, by - h*0.3 + bob, h*0.16, h*0.12, -0.5, 0, Math.PI*2); ctx.fill();
    inkLine(ctx, bx + h*0.3, by - h*0.34 + bob, bx + h*0.62, by - h*0.6 + bob, ink, 2, 5);
    // Music notes
    if (Math.floor(frame / 40) % 2 === 0) {
      ctx.font = '10px ' + C.FONT_HAND;
      ctx.fillText('♪', bx + h*0.55, by - h*0.95 - Math.sin(frame*0.05)*3);
    }
  }

  // Chapel altar: stone pedestal with cross
  function altar(ctx, x, groundY, ink, paper) {
    ctx.fillStyle = paper; ctx.strokeStyle = ink; ctx.lineWidth = 2;
    // Mound
    ctx.beginPath();
    ctx.moveTo(x - 26, groundY); ctx.quadraticCurveTo(x, groundY - 16, x + 26, groundY);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    // Pedestal
    inkRect(ctx, x - 10, groundY - 34, 20, 22, ink, x, false);
    // Cross
    inkLine(ctx, x, groundY - 56, x, groundY - 34, ink, 3, x+1);
    inkLine(ctx, x - 8, groundY - 49, x + 8, groundY - 49, ink, 3, x+2);
  }

  // The Realmkeeper: hooded narrator silhouette with staff
  function realmkeeper(ctx, cx, cy, h, ink, paper) {
    ctx.fillStyle = ink;
    // Robe
    ctx.beginPath();
    ctx.moveTo(cx - h*0.32, cy);
    ctx.quadraticCurveTo(cx - h*0.36, cy - h*0.5, cx - h*0.16, cy - h*0.78);
    ctx.lineTo(cx,         cy - h*0.98);
    ctx.lineTo(cx + h*0.16, cy - h*0.78);
    ctx.quadraticCurveTo(cx + h*0.36, cy - h*0.5, cx + h*0.32, cy);
    ctx.closePath(); ctx.fill();
    // Eyes
    ctx.fillStyle = paper;
    ctx.beginPath(); ctx.ellipse(cx - h*0.05, cy - h*0.8, h*0.035, h*0.02, -0.3, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx + h*0.05, cy - h*0.8, h*0.035, h*0.02, 0.3, 0, Math.PI*2); ctx.fill();
    // Staff
    inkLine(ctx, cx + h*0.3, cy, cx + h*0.3, cy - h*1.05, ink, 3, 7);
    ctx.fillStyle = ink;
    ctx.beginPath(); ctx.arc(cx + h*0.3, cy - h*1.08, h*0.05, 0, Math.PI*2); ctx.fill();
  }

  // Essence shard (drop / icon)
  function essenceShard(ctx, x, y, size, ink) {
    ctx.fillStyle = ink;
    ctx.beginPath();
    ctx.moveTo(x, y - size);
    ctx.lineTo(x + size*0.7, y);
    ctx.lineTo(x, y + size);
    ctx.lineTo(x - size*0.7, y);
    ctx.closePath(); ctx.fill();
  }

  // Health as tally marks (every 5th crosses the group)
  function tallyHealth(ctx, x, y, hp, maxHp, ink, faded) {
    var marks = Math.ceil(maxHp / 10);
    var alive = Math.ceil(hp / 10);
    var px = x;
    for (var i = 0; i < marks; i++) {
      var isCross = (i + 1) % 5 === 0;
      var col = i < alive ? ink : faded;
      if (isCross) {
        inkLine(ctx, px - 22, y + 12, px + 2, y - 2, col, 2.2, i*3);
        px += 10;
      } else {
        inkLine(ctx, px + jit(i, 1), y, px + jit(i+1, 1.5), y + 12, col, 2.2, i*7);
        px += 6;
      }
    }
  }

  // Stamina/cooldown circle (empties then refills)
  function staminaCircle(ctx, x, y, r, pct, ink, faded) {
    ctx.strokeStyle = faded; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI*2); ctx.stroke();
    if (pct > 0) {
      ctx.strokeStyle = ink;
      ctx.beginPath(); ctx.arc(x, y, r, -Math.PI/2, -Math.PI/2 + Math.PI*2*pct); ctx.stroke();
      if (pct >= 1) { ctx.fillStyle = ink; ctx.beginPath(); ctx.arc(x, y, r*0.45, 0, Math.PI*2); ctx.fill(); }
    }
  }

  // Floating heal cross shown above the player while regenerating
  function healPulse(ctx, cx, topY, t, color) {
    var cycle = (t % 60) / 60;             // one pulse per second
    var y = topY - 8 - cycle * 10;          // drifts upward
    var a = cycle < 0.2 ? cycle / 0.2 : 1 - (cycle - 0.2) / 0.8; // fade in, then out
    ctx.save();
    ctx.globalAlpha = Math.max(0, a) * 0.9;
    ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(cx, y - 4); ctx.lineTo(cx, y + 4); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx - 4, y); ctx.lineTo(cx + 4, y); ctx.stroke();
    ctx.restore();
  }

  // Magic bolt (bishop magic)
  function magicBolt(ctx, x, y, r, ink, frame) {
    ctx.strokeStyle = ink; ctx.lineWidth = 2;
    var a = frame * 0.3;
    ctx.beginPath(); ctx.arc(x, y, r, a, a + Math.PI*1.5); ctx.stroke();
    ctx.beginPath(); ctx.arc(x, y, r*0.5, -a, -a + Math.PI*1.4); ctx.stroke();
  }

  return { pawn, bishop, tower, knight, queen, king, bard, spear, player, sword, hpBar,
           jit, inkLine, inkRect, solidRect, hero, skullFace, corruption, bonfire, altar,
           realmkeeper, essenceShard, tallyHealth, staminaCircle, magicBolt, healPulse };
})();
