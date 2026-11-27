// Loads atlases, backgrounds and sprite metadata; draws animated sprites.

const ZONES = ['z1', 'z2', 'z3', 'z4', 'z5', 'z6'];
export const art = { images: {}, sprites: {} };

function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null); // missing art degrades to placeholders, never blocks boot
    img.src = src;
  });
}

/**
 * Load every asset the game uses.
 * @returns {Promise<typeof art>}
 */
export async function loadAssets() {
  const meta = await fetch('assets/sprites.json').then((r) => r.json());
  const paths = ['assets/chars.png', 'assets/props.png', 'assets/title.png'];
  for (const z of ZONES) paths.push(`assets/${z}_far.png`, `assets/${z}_mid.png`, `assets/${z}_tiles.png`);
  const imgs = await Promise.all(paths.map(loadImage));
  paths.forEach((p, i) => { art.images[p] = imgs[i]; });
  art.sprites = meta;
  return art;
}

function frameOf(sprite, anim, tick, speed) {
  const frames = sprite.anims[anim] || sprite.anims.idle || [0];
  return frames[Math.floor(tick / speed) % frames.length];
}

/**
 * Draw a sprite with its feet at (x, y).
 * @param {CanvasRenderingContext2D} ctx
 * @param {string} name key in sprites.json
 * @param {{anim?: string, tick?: number, flip?: boolean, speed?: number, alpha?: number, flash?: boolean, scale?: number}} [opts]
 * @returns {boolean} false when the sprite is unknown (caller may draw a placeholder)
 */
export function drawSprite(ctx, name, x, y, opts = {}) {
  const sprite = art.sprites[name];
  const img = sprite && art.images[sprite.atlas];
  if (!img) return false;
  const index = frameOf(sprite, opts.anim || 'idle', opts.tick || 0, opts.speed || 8);
  const [sx, sy, sw, sh] = sprite.frames[index];
  const [ax, ay] = sprite.anchors[index];
  const s = opts.scale || 1;
  ctx.save();
  ctx.globalAlpha = opts.alpha ?? 1;
  ctx.translate(Math.round(x), Math.round(y));
  if (opts.flip) ctx.scale(-1, 1);
  ctx.drawImage(img, sx, sy, sw, sh, Math.round(-ax * s), Math.round(-ay * s), Math.round(sw * s), Math.round(sh * s));
  if (opts.flash) flashOver(ctx, img, [sx, sy, sw, sh], ax, ay, s);
  ctx.restore();
  return true;
}

const flashCanvas = typeof document !== 'undefined' ? document.createElement('canvas') : null;

function flashOver(ctx, img, [sx, sy, sw, sh], ax, ay, s) {
  flashCanvas.width = sw;
  flashCanvas.height = sh;
  const f = flashCanvas.getContext('2d');
  f.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
  f.globalCompositeOperation = 'source-in';
  f.fillStyle = '#fff';
  f.fillRect(0, 0, sw, sh);
  ctx.globalAlpha = 0.75;
  ctx.drawImage(flashCanvas, Math.round(-ax * s), Math.round(-ay * s), Math.round(sw * s), Math.round(sh * s));
}

/** Sprite height in pixels (first frame), for health bars and hit effects. */
export function spriteHeight(name) {
  const sprite = art.sprites[name];
  return sprite ? sprite.frames[0][3] : 32;
}
