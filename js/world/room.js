// A loaded room at runtime: generated layout + mutable tiles (broken walls,
// boss locks) + world-pixel origin for seamless transitions.
import { TILE, CELL_W, CELL_H } from '../config.js';
import { buildRoom, T } from './roomgen.js';
import { AREAS } from './map.js';

export class Room {
  /** @param {string} id */
  constructor(id) {
    const built = buildRoom(id);
    Object.assign(this, built);
    this.id = id;
    this.area = AREAS[built.spec.area];
    this.originX = built.spec.x * CELL_W * TILE;
    this.originY = built.spec.y * CELL_H * TILE;
    this.pxW = built.grid.w * TILE;
    this.pxH = built.grid.h * TILE;
    this.version = 0; // bumped on tile changes so the renderer re-bakes
    this.getTile = (tx, ty) => edgeAware(this.grid, tx, ty);
  }

  /** Remove a breakable tile (and its vertical neighbours of the same kind). */
  breakTile(tx, ty, kind) {
    for (let y = ty - 3; y <= ty + 3; y++) {
      for (let x = tx - 1; x <= tx + 1; x++) if (this.grid.get(x, y) === kind) this.grid.set(x, y, T.EMPTY);
    }
    this.version++;
  }

  /** Close every doorway with lock tiles (boss fights). */
  lockDoors() {
    this.locked = [];
    for (const d of this.doors) {
      for (const [x, y] of doorwayTiles(this.grid, d)) {
        if (this.grid.get(x, y) !== T.EMPTY && this.grid.get(x, y) !== T.ONEWAY) continue;
        this.locked.push([x, y, this.grid.get(x, y)]);
        this.grid.set(x, y, T.LOCK);
      }
    }
    this.version++;
  }

  /** Undo lockDoors and open seal doors. */
  unlockDoors() {
    for (const [x, y, old] of this.locked || []) this.grid.set(x, y, old);
    this.locked = [];
    this.version++;
  }

  /** Clear the seal locks (throne door) once all seals are owned. */
  openSeals() {
    for (let i = 0; i < this.grid.cells.length; i++) if (this.grid.cells[i] === T.LOCK) this.grid.cells[i] = T.EMPTY;
    this.version++;
  }
}

// Outside the grid, continue the edge tile: open doorways lead out, walls stay shut.
function edgeAware(grid, tx, ty) {
  if (tx >= 0 && ty >= 0 && tx < grid.w && ty < grid.h) return grid.get(tx, ty);
  const edge = grid.get(Math.max(0, Math.min(grid.w - 1, tx)), Math.max(0, Math.min(grid.h - 1, ty)));
  return edge === T.EMPTY || edge === T.ONEWAY ? T.EMPTY : T.SOLID;
}

function doorwayTiles(grid, door) {
  if (door.side === 'L' || door.side === 'R') {
    const x = door.side === 'L' ? 0 : grid.w - 1;
    return [[x, door.floor - 1], [x, door.floor - 2], [x, door.floor - 3]];
  }
  const y = door.side === 'U' ? 0 : grid.h - 2;
  return [0, 1, 2, 3].map((i) => [door.col + i, y]);
}
