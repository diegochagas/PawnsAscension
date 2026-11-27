// Tile-level reachability for tests: can the hero walk/jump between two doors
// with a given set of powers? Approximates the real physics conservatively.
import { REACH } from '../config.js';
import { T } from './roomgen.js';

const RUN_TILES = 5; // horizontal tiles covered during one jump

function passable(tile, powers) {
  if (tile === T.EMPTY || tile === T.ONEWAY || tile === T.SPIKES) return true;
  if (tile === T.CRACKED) return powers.dash;
  if (tile === T.CRYSTAL) return powers.bolt;
  if (tile === T.LOCK) return powers.seals;
  return false;
}

function standable(tile) {
  return tile === T.SOLID || tile === T.ONEWAY || tile === T.CRACKED || tile === T.CRYSTAL || tile === T.LOCK;
}

function bodyFits(grid, x, row, tall, powers) {
  for (let k = 1; k <= tall; k++) if (!passable(grid.get(x, row - k), powers)) return false;
  return true;
}

function canStand(grid, x, row, powers) {
  if (!standable(grid.get(x, row))) return false;
  return bodyFits(grid, x, row, powers.slide ? 1 : 2, powers);
}

function dropFrom(grid, x, row, powers) {
  let r = row;
  while (r < grid.h - 1 && passable(grid.get(x, r), powers)) {
    if (canStand(grid, x, r + 1, powers) && grid.get(x, r + 1) !== T.SPIKES) return r + 1;
    r++;
  }
  return null;
}

function columnClear(grid, x, fromRow, toRow, powers) {
  for (let r = fromRow; r >= toRow; r--) if (!passable(grid.get(x, r), powers)) return false;
  return true;
}

function jumpTargets(grid, x, row, powers, push) {
  const jump = powers.doubleJump ? REACH.doubleJumpTiles : REACH.jumpTiles;
  for (let dy = 0; dy <= jump; dy++) {
    if (!columnClear(grid, x, row - 1, row - 2 - dy, powers)) break;
    for (const dir of [-1, 1]) {
      for (let dx = 1; dx <= RUN_TILES; dx++) {
        const nx = x + dir * dx;
        if (!columnClear(grid, nx, row - 1 - dy, row - 2 - dy, powers)) break;
        const land = dropFrom(grid, nx, row - 2 - dy + 1, powers);
        if (land !== null) push(nx, land);
      }
    }
    const up = row - dy;
    if (dy >= 2 && canStand(grid, x, up, powers)) push(x, up);
  }
}

function neighbours(grid, x, row, powers, push) {
  for (const dir of [-1, 1]) {
    const nx = x + dir;
    if (canStand(grid, nx, row, powers)) push(nx, row);
    else if (bodyFits(grid, nx, row, powers.slide ? 1 : 2, powers)) {
      const land = dropFrom(grid, nx, row, powers);
      if (land !== null) push(nx, land);
    }
  }
  if (grid.get(x, row) === T.ONEWAY) {
    const land = dropFrom(grid, x, row, powers);
    if (land !== null) push(x, land);
  }
  jumpTargets(grid, x, row, powers, push);
}

/**
 * Every standable tile reachable from a start tile.
 * @param {import('./roomgen.js').Grid} grid
 * @param {{x: number, row: number}} start
 * @param {{doubleJump?: boolean, dash?: boolean, bolt?: boolean, slide?: boolean, seals?: boolean}} powers
 * @returns {Set<string>} keys "x,row"
 */
export function reachable(grid, start, powers) {
  const seen = new Set();
  const queue = [[start.x, start.row]];
  const push = (x, row) => {
    const key = `${x},${row}`;
    if (!seen.has(key)) { seen.add(key); queue.push([x, row]); }
  };
  push(start.x, start.row);
  while (queue.length) {
    const [x, row] = queue.shift();
    neighbours(grid, x, row, powers, push);
  }
  return seen;
}

/**
 * Stand tile just inside a door (where the hero appears / must get to).
 * @returns {{x: number, row: number}|null}
 */
export function doorStand(grid, door, powers) {
  if (door.side === 'L') return { x: 1, row: door.floor };
  if (door.side === 'R') return { x: grid.w - 2, row: door.floor };
  if (door.side === 'D') return { x: door.col + 1, row: grid.h - 2 };
  const row = dropFrom(grid, door.col + 1, 1, powers);
  return row === null ? null : { x: door.col + 1, row };
}

/**
 * Whether a door can be exited from the reachable set.
 * Upward exits need a stand tile close enough to the ceiling to jump through.
 */
export function canExit(grid, door, seen, powers) {
  if (door.side !== 'U') {
    const s = doorStand(grid, door, powers);
    return seen.has(`${s.x},${s.row}`);
  }
  const jump = powers.doubleJump ? REACH.doubleJumpTiles : REACH.jumpTiles;
  for (let x = door.col; x <= door.col + 3; x++) {
    for (let row = 1; row <= jump - 3; row++) if (seen.has(`${x},${row}`)) return true;
  }
  return false;
}
