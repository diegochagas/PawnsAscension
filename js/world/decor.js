// Seeded interior decoration, enemy spawns and props for a generated room.
import { TILE, CELL_W, CELL_H } from '../config.js';

const SOLID = 1;
const ONEWAY = 2;
const SPIKES = 5;
const FLYERS = new Set(['bat', 'wraith']);

function areaFree(grid, x0, y0, x1, y1) {
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      if (x < 1 || y < 1 || x >= grid.w - 1 || y >= grid.h || grid.isReserved(x, y)) return false;
    }
  }
  return true;
}

function tryBump(grid, cx, rnd, randInt) {
  const w = randInt(rnd, 3, 5);
  const h = randInt(rnd, 1, 3);
  const top = grid.h - 2 - h;
  if (!areaFree(grid, cx - 1, top - 4, cx + w, grid.h - 3)) return;
  grid.fill(cx, top, cx + w - 1, grid.h - 3, SOLID);
  grid.reserve(cx - 1, top - 4, cx + w, grid.h - 3);
}

function tryPit(grid, cx, rnd, randInt) {
  const w = randInt(rnd, 2, 3);
  if (!areaFree(grid, cx - 2, grid.h - 6, cx + w + 1, grid.h - 3)) return;
  grid.fill(cx, grid.h - 2, cx + w - 1, grid.h - 2, SPIKES);
  grid.reserve(cx - 2, grid.h - 6, cx + w + 1, grid.h - 2);
}

function tryFloat(grid, cx, row, rnd, randInt) {
  const w = randInt(rnd, 4, 7);
  if (!areaFree(grid, cx - 1, row - 3, cx + w, row + 1)) return;
  grid.fill(cx, row, cx + w - 1, row, ONEWAY);
  grid.reserve(cx - 1, row - 3, cx + w, row + 1);
}

function decorateCells(grid, spec, rnd, randInt) {
  for (let cx = 0; cx < spec.w; cx++) {
    const base = cx * CELL_W + randInt(rnd, 8, 18);
    const pick = rnd();
    if (pick < 0.35) tryBump(grid, base, rnd, randInt);
    else if (pick < 0.6) tryPit(grid, base, rnd, randInt);
    tryFloat(grid, cx * CELL_W + randInt(rnd, 6, 20), grid.h - 2 - randInt(rnd, 4, 5), rnd, randInt);
  }
  for (let r = 0; r < spec.h - 1; r++) {
    tryFloat(grid, randInt(rnd, 4, grid.w - 12), r * CELL_H + randInt(rnd, 8, 12), rnd, randInt);
  }
}

function floorSpot(grid, rnd, randInt) {
  for (let tries = 0; tries < 30; tries++) {
    const x = randInt(rnd, 6, grid.w - 7);
    const row = grid.h - 2;
    if (grid.get(x, row) === SOLID && grid.get(x, row - 1) === 0 && grid.get(x, row - 2) === 0) {
      return { x: x * TILE + TILE / 2, y: row * TILE };
    }
  }
  return null;
}

function airSpot(grid, rnd, randInt) {
  const x = randInt(rnd, 6, grid.w - 7);
  const y = randInt(rnd, 3, grid.h - 6);
  return grid.get(x, y) === 0 ? { x: x * TILE + TILE / 2, y: y * TILE } : null;
}

function enemySpawns(grid, spec, area, rnd, randInt) {
  const count = Math.round(spec.w * spec.h * 1.4) + randInt(rnd, 0, 1);
  const spawns = [];
  for (let i = 0; i < count; i++) {
    const type = area.enemies[randInt(rnd, 0, area.enemies.length - 1)];
    const spot = FLYERS.has(type) ? airSpot(grid, rnd, randInt) : floorSpot(grid, rnd, randInt);
    if (spot) spawns.push({ type, ...spot });
  }
  return spawns;
}

function centerProp(grid, type, extra = {}) {
  return { type, x: (grid.w * TILE) / 2, y: (grid.h - 2) * TILE, ...extra };
}

function wallProps(grid, rnd, randInt) {
  const props = [];
  for (let x = 4; x < grid.w - 4; x += randInt(rnd, 7, 11)) {
    props.push({ type: rnd() < 0.7 ? 'torch' : 'candle', x: x * TILE, y: (grid.h - 7) * TILE, decor: true });
  }
  return props;
}

/**
 * Fill a room with decoration, spawns and props according to its kind.
 * @returns {{spawns: object[], props: object[]}}
 */
export function decorate(grid, spec, area, rnd, randInt) {
  const props = wallProps(grid, rnd, randInt);
  const kind = spec.kind || 'normal';
  if (kind === 'save') return { spawns: [], props: [...props, centerProp(grid, 'bonfire')] };
  if (kind === 'boss') return { spawns: [], props, boss: spec.boss };
  if (kind === 'altar' || kind === 'item') {
    return { spawns: [], props: [...props, centerProp(grid, kind, { item: spec.item })] };
  }
  decorateCells(grid, spec, rnd, randInt);
  const spawns = kind === 'start' ? [] : enemySpawns(grid, spec, area, rnd, randInt);
  return { spawns, props };
}
