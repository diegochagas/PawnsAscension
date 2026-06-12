var Physics = (function() {

  function rectOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
    return ax < bx+bw && ax+aw > bx && ay < by+bh && ay+ah > by;
  }

  // Resolve entity against array of platforms; returns { onGround, hitCeiling }
  // Uses minimal-translation: push out along the axis with the smallest
  // penetration, toward the nearest edge. (Comparing overlap sizes alone made
  // deep landings on wide platforms resolve horizontally, teleporting the
  // entity to the platform's far edge.)
  function resolvePlatforms(e, platforms) {
    var onGround = false, hitCeiling = false;
    for (var i = 0; i < platforms.length; i++) {
      var p = platforms[i];
      if (!rectOverlap(e.x, e.y, e.w, e.h, p.x, p.y, p.w, p.h)) continue;

      var penUp    = e.y + e.h - p.y;   // distance to push up (land on top)
      var penDown  = p.y + p.h - e.y;   // distance to push down (ceiling)
      var penLeft  = e.x + e.w - p.x;   // distance to push out left
      var penRight = p.x + p.w - e.x;   // distance to push out right
      var minY = Math.min(penUp, penDown);
      var minX = Math.min(penLeft, penRight);

      if (minY <= minX) {
        if (penUp <= penDown) {
          if (e.vy >= 0) { e.y = p.y - e.h; e.vy = 0; onGround = true; }
        } else {
          if (e.vy < 0) { e.y = p.y + p.h; e.vy = 0; hitCeiling = true; }
        }
      } else {
        e.x = penLeft <= penRight ? p.x - e.w : p.x + p.w;
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

  // Clamp entity inside current world bounds horizontally
  function clampX(e) {
    var w = C.ROOM_W || C.W;
    if (e.x < 0) { e.x = 0; e.vx = 0; }
    if (e.x + e.w > w) { e.x = w - e.w; e.vx = 0; }
  }

  // Kill floor — entity falls off bottom
  function fellOff(e) {
    return e.y > (C.ROOM_H || C.H) + 50;
  }

  return { rectOverlap, resolvePlatforms, applyGravity, clampX, fellOff };
})();
