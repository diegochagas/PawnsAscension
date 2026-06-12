// ── Scrolling camera for Adventure rooms ─────────────────────────────────────
var Camera = (function() {

  function create() { return { x: 0, y: 0 }; }

  function follow(cam, player, room) {
    if (!room) return;
    var tx = player.x + player.w/2 - C.W/2;
    var ty = player.y + player.h/2 - C.H * 0.58;
    tx = Math.max(0, Math.min(room.w - C.W, tx));
    ty = Math.max(0, Math.min(room.h - C.H, ty));
    // Smooth approach
    cam.x += (tx - cam.x) * 0.14;
    cam.y += (ty - cam.y) * 0.14;
    if (Math.abs(tx - cam.x) < 0.5) cam.x = tx;
    if (Math.abs(ty - cam.y) < 0.5) cam.y = ty;
  }

  function snap(cam, player, room) {
    if (!room) return;
    cam.x = Math.max(0, Math.min(room.w - C.W, player.x + player.w/2 - C.W/2));
    cam.y = Math.max(0, Math.min(room.h - C.H, player.y + player.h/2 - C.H * 0.58));
  }

  return { create, follow, snap };
})();
