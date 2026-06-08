var Physics = (function() {

  function rectOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
    return ax < bx+bw && ax+aw > bx && ay < by+bh && ay+ah > by;
  }

  // Resolve entity against array of platforms; returns { onGround, hitCeiling }
  function resolvePlatforms(e, platforms) {
    var onGround = false, hitCeiling = false;
    for (var i = 0; i < platforms.length; i++) {
      var p = platforms[i];
      if (!rectOverlap(e.x, e.y, e.w, e.h, p.x, p.y, p.w, p.h)) continue;

      var overlapX = Math.min(e.x+e.w, p.x+p.w) - Math.max(e.x, p.x);
      var overlapY = Math.min(e.y+e.h, p.y+p.h) - Math.max(e.y, p.y);

      if (overlapX >= overlapY) {
        // Vertical collision
        if (e.vy >= 0 && e.y + e.h - e.vy <= p.y + 2) {
          e.y = p.y - e.h;
          e.vy = 0;
          onGround = true;
        } else if (e.vy < 0) {
          e.y = p.y + p.h;
          e.vy = 0;
          hitCeiling = true;
        }
      } else {
        // Horizontal collision
        if (e.x + e.w/2 < p.x + p.w/2) {
          e.x = p.x - e.w;
        } else {
          e.x = p.x + p.w;
        }
        e.vx = 0;
      }
    }
    return { onGround, hitCeiling };
  }

  // Apply gravity and clamp fall speed
  function applyGravity(e) {
    e.vy += C.GRAVITY;
    if (e.vy > C.MAX_FALL) e.vy = C.MAX_FALL;
  }

  // Clamp entity inside canvas bounds horizontally
  function clampX(e) {
    if (e.x < 0) { e.x = 0; e.vx = 0; }
    if (e.x + e.w > C.W) { e.x = C.W - e.w; e.vx = 0; }
  }

  // Kill floor — entity falls off bottom
  function fellOff(e) {
    return e.y > C.H + 50;
  }

  return { rectOverlap, resolvePlatforms, applyGravity, clampX, fellOff };
})();
