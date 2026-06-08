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

  return { pawn, bishop, tower, knight, queen, king, bard, spear, player, hpBar };
})();
