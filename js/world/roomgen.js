// Builds a room's tilemap from its spec and doors. Deterministic per room id.
import { CELL_W, CELL_H, REACH } from '../config.js';
import { createRng, seedFrom, randInt } from '../rng.js';
import { roomIndex, AREAS } from './map.js';
import { doorsOf } from './doors.js';
import { decorate } from './decor.js';

export const T = { EMPTY: 0, SOLID: 1, ONEWAY: 2, CRACKED: 3, CRYSTAL: 4, SPIKES: 5, LOCK: 6 };

/** Tile grid with bounds-safe accessors. */
export class Grid {
  /** @param {number} w @param {number} h */
  constructor(w, h) {
    this.w = w;
    this.h = h;
    this.cells = new Uint8Array(w * h);
    this.reserved = new Uint8Array(w * h); // corridors the decorator must keep clear
  }
  get(x, y) {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return T.SOLID;
    return this.cells[y * this.w + x];
  }
  set(x, y, v) {
    if (x >= 0 && y >= 0 && x < this.w && y < this.h) this.cells[y * this.w + x] = v;
  }
  fill(x0, y0, x1, y1, v) {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) this.set(x, y, v);
  }
  reserve(x0, y0, x1, y1) {
    for (let y = Math.max(0, y0); y <= Math.min(this.h - 1, y1); y++) {
      for (let x = Math.max(0, x0); x <= Math.min(this.w - 1, x1); x++) this.reserved[y * this.w + x] = 1;
    }
  }
  isReserved(x, y) {
    return this.reserved[y * this.w + x] === 1;
  }
}

function shell(grid) {
  grid.fill(0, 0, grid.w - 1, 0, T.SOLID);
  grid.fill(0, grid.h - 2, grid.w - 1, grid.h - 1, T.SOLID);
  grid.fill(0, 0, 0, grid.h - 1, T.SOLID);
  grid.fill(grid.w - 1, 0, grid.w - 1, grid.h - 1, T.SOLID);
}

function ladder(grid, x0, x1, fromRow) {
  for (let row = fromRow; row <= grid.h - 3; row += REACH.ladderStep) grid.fill(x0, row, x1, row, T.ONEWAY);
  grid.reserve(x0 - 1, fromRow - 3, x1 + 1, grid.h - 3);
}

const GATE_TILE = { rook: T.CRACKED, bishop: T.CRYSTAL, seals: T.LOCK };

function sideDoor(grid, door) {
  const left = door.side === 'L';
  const wall = left ? 0 : grid.w - 1;
  const inward = left ? 1 : -1;
  const f = door.floor;
  grid.fill(wall, f - 3, wall, f - 1, T.EMPTY);
  grid.reserve(Math.min(wall, wall + inward * 8), f - 4, Math.max(wall, wall + inward * 8), f - 1);
  if (f < grid.h - 2) upperLedge(grid, wall, inward, f);
  gateSide(grid, door, wall, inward, f);
}

function upperLedge(grid, wall, inward, f) {
  const ledgeEnd = wall + inward * 5;
  grid.fill(Math.min(wall, ledgeEnd), f, Math.max(wall, ledgeEnd), f, T.SOLID);
  const l0 = wall + inward * 6;
  const l1 = wall + inward * 9;
  ladder(grid, Math.min(l0, l1), Math.max(l0, l1), f);
}

function gateSide(grid, door, wall, inward, f) {
  const xs = [wall, wall + inward];
  if (GATE_TILE[door.gate]) xs.forEach((x) => grid.fill(x, f - 3, x, f - 1, GATE_TILE[door.gate]));
  if (door.gate === 'slide') slideTunnel(grid, wall, inward, f);
  if (door.gate === 'knight') {
    const x = wall + inward * 2;
    grid.fill(Math.min(x, x + inward), f - REACH.knightWall, Math.max(x, x + inward), f - 1, T.SOLID);
  }
}

function slideTunnel(grid, wall, inward, f) {
  for (let i = 0; i <= 4; i++) grid.fill(wall + inward * i, f - 4, wall + inward * i, f - 2, T.SOLID);
}

function verticalDoor(grid, door) {
  const x0 = door.col;
  const x1 = door.col + 3;
  if (door.side === 'D') {
    grid.fill(x0, grid.h - 2, x1, grid.h - 1, T.EMPTY);
    grid.fill(x0, grid.h - 2, x1, grid.h - 2, T.ONEWAY);
    grid.reserve(x0 - 1, grid.h - 6, x1 + 1, grid.h - 1);
    return;
  }
  grid.fill(x0, 0, x1, 0, T.EMPTY);
  ladder(grid, x0, x1, 2);
  if (door.gate === 'knight') grid.fill(x0, 2, x1, 2, T.EMPTY); // gap only a double jump crosses
  grid.reserve(x0 - 1, 0, x1 + 1, 4);
}

/**
 * Generate the full layout of a room.
 * @param {string} roomId id from ROOMS
 * @returns {{spec: object, grid: Grid, doors: object[], spawns: object[], props: object[]}}
 * @example const room = buildRoom('t_start'); room.grid.get(0, 0) === T.SOLID
 */
export function buildRoom(roomId) {
  const spec = roomIndex().get(roomId);
  if (!spec) throw new Error(`unknown room id "${roomId}" (expected one of ROOMS in world/map.js)`);
  const grid = new Grid(spec.w * CELL_W, spec.h * CELL_H);
  const doors = doorsOf(roomId);
  shell(grid);
  doors.forEach((d) => (d.side === 'L' || d.side === 'R' ? sideDoor(grid, d) : verticalDoor(grid, d)));
  const rnd = createRng(seedFrom(roomId));
  const { spawns, props } = decorate(grid, spec, AREAS[spec.area], rnd, randInt);
  return { spec, grid, doors, spawns, props };
}
