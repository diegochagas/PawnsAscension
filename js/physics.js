// Axis-separated AABB vs tile collision. Bodies: {x, y, w, h, vx, vy} in pixels,
// (x, y) = top-left. Pure: takes a tile lookup so tests can use plain grids.
import { TILE, PHYS } from './config.js';

export const TILES = { EMPTY: 0, SOLID: 1, ONEWAY: 2, CRACKED: 3, CRYSTAL: 4, SPIKES: 5, LOCK: 6 };
const BLOCKING = new Set([TILES.SOLID, TILES.CRACKED, TILES.CRYSTAL, TILES.LOCK]);

/** @param {number} tile */
export function isBlocking(tile) {
  return BLOCKING.has(tile);
}

function tileRange(a, b) {
  return [Math.floor(a / TILE), Math.floor((b - 0.001) / TILE)];
}

function moveX(body, getTile, info) {
  body.x += body.vx;
  const [ty0, ty1] = tileRange(body.y, body.y + body.h);
  const edge = body.vx > 0 ? body.x + body.w : body.x;
  const tx = Math.floor((body.vx > 0 ? edge - 0.001 : edge) / TILE);
  for (let ty = ty0; ty <= ty1; ty++) {
    const tile = getTile(tx, ty);
    if (!isBlocking(tile)) continue;
    if (body.breaks && tile === TILES.CRACKED) { info.broken.push([tx, ty]); continue; }
    body.x = body.vx > 0 ? tx * TILE - body.w : (tx + 1) * TILE;
    info.wall = body.vx > 0 ? 1 : -1;
    body.vx = 0;
    return;
  }
}

function landsOnOneway(body, tile, ty, prevBottom) {
  return tile === TILES.ONEWAY && body.vy >= 0 && !body.dropping && prevBottom <= ty * TILE + 0.01;
}

function moveY(body, getTile, info) {
  const prevBottom = body.y + body.h;
  body.y += body.vy;
  const [tx0, tx1] = tileRange(body.x, body.x + body.w);
  const down = body.vy >= 0;
  const ty = Math.floor((down ? body.y + body.h - 0.001 : body.y) / TILE);
  for (let tx = tx0; tx <= tx1; tx++) {
    const tile = getTile(tx, ty);
    if (!isBlocking(tile) && !(down && landsOnOneway(body, tile, ty, prevBottom))) continue;
    body.y = down ? ty * TILE - body.h : (ty + 1) * TILE;
    if (down) info.ground = true;
    else info.ceiling = true;
    body.vy = 0;
    return;
  }
}

function touchesSpikes(body, getTile) {
  const [tx0, tx1] = tileRange(body.x + 2, body.x + body.w - 2);
  // Spikes are not solid: the feet sink into the spike row and rest on the tile below it.
  const rows = [Math.floor((body.y + body.h - 1) / TILE), Math.floor((body.y + body.h + 1) / TILE)];
  for (const ty of rows) for (let tx = tx0; tx <= tx1; tx++) if (getTile(tx, ty) === TILES.SPIKES) return true;
  return false;
}

/**
 * Apply gravity and move a body through the tilemap.
 * @param {{x:number,y:number,w:number,h:number,vx:number,vy:number,breaks?:boolean,dropping?:boolean,noGravity?:boolean}} body
 * @param {(tx:number, ty:number) => number} getTile
 * @returns {{ground:boolean, ceiling:boolean, wall:number, spikes:boolean, broken:number[][]}}
 * @example step(body, (x, y) => grid.get(x, y)).ground
 */
export function step(body, getTile) {
  const info = { ground: false, ceiling: false, wall: 0, spikes: false, broken: [] };
  if (!body.noGravity) body.vy = Math.min(body.vy + PHYS.gravity, PHYS.maxFall);
  moveX(body, getTile, info);
  moveY(body, getTile, info);
  info.spikes = info.ground && touchesSpikes(body, getTile);
  return info;
}

/**
 * Whether a box overlaps any blocking tile (used before standing up from a slide).
 * @returns {boolean}
 */
export function boxBlocked(x, y, w, h, getTile) {
  const [tx0, tx1] = tileRange(x, x + w);
  const [ty0, ty1] = tileRange(y, y + h);
  for (let ty = ty0; ty <= ty1; ty++) for (let tx = tx0; tx <= tx1; tx++) if (isBlocking(getTile(tx, ty))) return true;
  return false;
}

/**
 * Axis-aligned overlap test.
 * @param {{x:number,y:number,w:number,h:number}} a
 * @param {{x:number,y:number,w:number,h:number}} b
 * @returns {boolean}
 */
export function overlaps(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}
