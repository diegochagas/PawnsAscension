// Parallax backgrounds and the baked tile layer of the current room.
import { TILE, VIEW_W, VIEW_H } from '../config.js';
import { art, drawSprite } from './assets.js';
import { T } from '../world/roomgen.js';

let baked = { room: null, version: -1, canvas: null };

function solidish(tile) {
  return tile === T.SOLID;
}

function drawSolid(g, tex, room, tx, ty) {
  const x = tx * TILE;
  const y = ty * TILE;
  if (tex) g.drawImage(tex, (tx * TILE) % 128, (ty * TILE) % 128, TILE, TILE, x, y, TILE, TILE);
  else { g.fillStyle = '#3a3448'; g.fillRect(x, y, TILE, TILE); }
  g.fillStyle = 'rgba(0,0,0,0.28)';
  g.fillRect(x, y, TILE, TILE); // darken so sprites read in front of terrain
  if (!solidish(room.getTile(tx, ty - 1))) { g.fillStyle = 'rgba(255,240,210,0.35)'; g.fillRect(x, y, TILE, 2); }
  g.fillStyle = 'rgba(0,0,0,0.55)';
  if (!solidish(room.getTile(tx, ty + 1))) g.fillRect(x, y + TILE - 2, TILE, 2);
  if (!solidish(room.getTile(tx - 1, ty))) g.fillRect(x, y, 1, TILE);
  if (!solidish(room.getTile(tx + 1, ty))) g.fillRect(x + TILE - 1, y, 1, TILE);
}

function drawOneway(g, tex, tx, ty) {
  const x = tx * TILE;
  const y = ty * TILE;
  if (tex) g.drawImage(tex, (tx * TILE) % 128, 0, TILE, 6, x, y, TILE, 6);
  g.fillStyle = 'rgba(255,230,190,0.4)';
  g.fillRect(x, y, TILE, 1);
  g.fillStyle = 'rgba(0,0,0,0.6)';
  g.fillRect(x, y + 5, TILE, 2);
}

const SPECIAL = { [T.CRACKED]: 'block_cracked', [T.CRYSTAL]: 'block_crystal', [T.SPIKES]: 'spikes_small' };

function drawSpecial(g, tile, tx, ty) {
  const x = tx * TILE + TILE / 2;
  const y = (ty + 1) * TILE;
  if (tile === T.LOCK) {
    g.fillStyle = '#5a0f14'; g.fillRect(tx * TILE + 3, ty * TILE, 10, TILE);
    g.fillStyle = '#c0383c'; g.fillRect(tx * TILE + 5, ty * TILE, 2, TILE); g.fillRect(tx * TILE + 9, ty * TILE, 2, TILE);
    return;
  }
  if (!drawSprite(g, SPECIAL[tile], x, y)) { g.fillStyle = '#888'; g.fillRect(tx * TILE, ty * TILE, TILE, TILE); }
}

function bake(room) {
  const c = document.createElement('canvas');
  c.width = room.pxW;
  c.height = room.pxH;
  const g = c.getContext('2d');
  const tex = art.images[`assets/${room.area.art}_tiles.png`];
  for (let ty = 0; ty < room.grid.h; ty++) {
    for (let tx = 0; tx < room.grid.w; tx++) {
      const tile = room.getTile(tx, ty);
      if (tile === T.SOLID) drawSolid(g, tex, room, tx, ty);
      else if (tile === T.ONEWAY) drawOneway(g, tex, tx, ty);
      else if (tile !== T.EMPTY) drawSpecial(g, tile, tx, ty);
    }
  }
  return c;
}

function parallax(ctx, img, camX, camY, factor, roomH) {
  if (!img) return;
  const offX = -((camX * factor) % img.width);
  const maxY = Math.max(0, roomH - VIEW_H);
  const offY = maxY ? -((camY / maxY) * Math.max(0, img.height - VIEW_H)) : VIEW_H - img.height;
  for (let x = offX; x < VIEW_W; x += img.width) ctx.drawImage(img, Math.round(x), Math.round(Math.min(0, offY)));
}

/**
 * Draw backgrounds behind the room.
 * @param {CanvasRenderingContext2D} ctx
 */
export function drawBackground(ctx, room, cam) {
  const z = room.area.art;
  ctx.fillStyle = '#0b0912';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  parallax(ctx, art.images[`assets/${z}_far.png`], cam.x, cam.y, 0.15, room.pxH);
  ctx.fillStyle = 'rgba(8,6,16,0.25)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  parallax(ctx, art.images[`assets/${z}_mid.png`], cam.x, cam.y, 0.45, room.pxH);
  ctx.fillStyle = 'rgba(8,6,16,0.35)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
}

/** Draw the room's tiles (baked once per room/version). */
export function drawTiles(ctx, room, cam) {
  if (baked.room !== room || baked.version !== room.version) {
    baked = { room, version: room.version, canvas: bake(room) };
  }
  ctx.drawImage(baked.canvas, -Math.round(cam.x), -Math.round(cam.y));
}
