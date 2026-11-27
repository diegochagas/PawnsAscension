// Door placement: where two linked rooms touch, and which tiles the door uses.
import { CELL_W, CELL_H } from '../config.js';
import { ROOMS, LINKS, roomIndex } from './map.js';

const DOOR_COL = 13; // vertical openings use columns 13..16 of their cell

function overlap(a0, a1, b0, b1) {
  const lo = Math.max(a0, b0);
  const hi = Math.min(a1, b1);
  return lo < hi ? lo : null;
}

/**
 * Work out the shared edge between two rooms.
 * @param {object} a room spec
 * @param {object} b room spec
 * @returns {{side: string, at: number}} side of `a` (L/R/U/D) and the shared grid cell
 * @throws {Error} when the rooms do not touch
 */
export function sharedEdge(a, b) {
  const row = overlap(a.y, a.y + a.h, b.y, b.y + b.h);
  const col = overlap(a.x, a.x + a.w, b.x, b.x + b.w);
  if (row !== null && b.x === a.x + a.w) return { side: 'R', at: row };
  if (row !== null && a.x === b.x + b.w) return { side: 'L', at: row };
  if (col !== null && b.y === a.y + a.h) return { side: 'D', at: col };
  if (col !== null && a.y === b.y + b.h) return { side: 'U', at: col };
  throw new Error(`rooms ${a.id} and ${b.id} do not share an edge (expected adjacent grid rectangles)`);
}

const OPPOSITE = { L: 'R', R: 'L', U: 'D', D: 'U' };

/**
 * All doors of one room, in tile coordinates of that room.
 * Horizontal doors carry `floor` (tile row the hero stands on); vertical doors `col`.
 * @param {string} roomId
 * @returns {Array<{side: string, to: string, gate: string|null, floor?: number, col?: number}>}
 */
export function doorsOf(roomId) {
  const rooms = roomIndex();
  const room = rooms.get(roomId);
  const doors = [];
  for (const [aId, bId, gate = null] of LINKS) {
    if (aId !== roomId && bId !== roomId) continue;
    const other = rooms.get(aId === roomId ? bId : aId);
    const edge = sharedEdge(rooms.get(aId), rooms.get(bId));
    const side = aId === roomId ? edge.side : OPPOSITE[edge.side];
    doors.push(placeDoor(room, side, edge.at, other.id, gate));
  }
  return doors;
}

function placeDoor(room, side, at, to, gate) {
  if (side === 'L' || side === 'R') {
    return { side, to, gate, floor: (at - room.y) * CELL_H + CELL_H - 2 };
  }
  return { side, to, gate, col: (at - room.x) * CELL_W + DOOR_COL };
}

/**
 * Room containing a grid cell, if any.
 * @param {number} gx
 * @param {number} gy
 * @returns {object|undefined}
 */
export function roomAtCell(gx, gy) {
  return ROOMS.find((r) => gx >= r.x && gx < r.x + r.w && gy >= r.y && gy < r.y + r.h);
}
