var Platforms = (function() {
  var H = C.PLT_H;

  // Ground floor always present
  function ground(color) {
    return { x: 0, y: C.H - 40, w: C.W, h: 40, color: color };
  }

  function plt(x, y, w, color) {
    return { x: x, y: y, w: w, h: H, color: color };
  }

  // 8 distinct layouts (one per wave)
  var layouts = [
    // Wave 1 – open arena, two mid platforms
    function(col) { return [
      ground(col),
      plt(150, C.H-140, 180, col),
      plt(470, C.H-140, 180, col),
      plt(290, C.H-240, 220, col),
    ]; },

    // Wave 2 – stepped platforms
    function(col) { return [
      ground(col),
      plt(60,  C.H-130, 140, col),
      plt(260, C.H-190, 140, col),
      plt(460, C.H-250, 140, col),
      plt(620, C.H-130, 140, col),
    ]; },

    // Wave 3 – wide central with gaps
    function(col) { return [
      ground(col),
      plt(0,   C.H-160, 220, col),
      plt(580, C.H-160, 220, col),
      plt(280, C.H-100, 240, col),
      plt(200, C.H-280, 180, col),
      plt(420, C.H-280, 180, col),
    ]; },

    // Wave 4 – zigzag
    function(col) { return [
      ground(col),
      plt(100, C.H-120, 160, col),
      plt(340, C.H-200, 120, col),
      plt(540, C.H-120, 160, col),
      plt(220, C.H-310, 160, col),
      plt(460, C.H-310, 160, col),
    ]; },

    // Wave 5 – bishop range stage (open + sniper perches)
    function(col) { return [
      ground(col),
      plt(0,   C.H-200, 100, col),
      plt(700, C.H-200, 100, col),
      plt(280, C.H-150, 240, col),
      plt(150, C.H-310, 160, col),
      plt(490, C.H-310, 160, col),
    ]; },

    // Wave 6 – tower fortress feel
    function(col) { return [
      ground(col),
      plt(0,   C.H-160, 180, col),
      plt(620, C.H-160, 180, col),
      plt(180, C.H-160, 60,  col),
      plt(560, C.H-160, 60,  col),
      plt(290, C.H-260, 220, col),
      plt(330, C.H-360, 140, col),
    ]; },

    // Wave 7 – queen's arena, dynamic feel
    function(col) { return [
      ground(col),
      plt(80,  C.H-130, 120, col),
      plt(300, C.H-210, 200, col),
      plt(600, C.H-130, 120, col),
      plt(160, C.H-290, 120, col),
      plt(480, C.H-310, 120, col),
      plt(300, C.H-380, 200, col),
    ]; },

    // Wave 8 – king's throne, grand and open
    function(col) { return [
      ground(col),
      plt(0,   C.H-160, 160, col),
      plt(640, C.H-160, 160, col),
      plt(260, C.H-140, 280, col),
      plt(100, C.H-280, 160, col),
      plt(540, C.H-280, 160, col),
      plt(300, C.H-360, 200, col),
      plt(320, C.H-430, 160, col),
    ]; },
  ];

  function get(waveNum, color) {
    var idx = (waveNum - 1) % layouts.length;
    return layouts[idx](color);
  }

  function draw(ctx, platforms, color) {
    ctx.fillStyle = color;
    platforms.forEach(function(p) {
      ctx.fillRect(p.x, p.y, p.w, p.h);
      // Subtle top highlight for depth
      ctx.fillStyle = color === '#000000' ? '#333' : '#ddd';
      ctx.fillRect(p.x, p.y, p.w, 2);
      ctx.fillStyle = color;
    });
  }

  return { get, draw };
})();
