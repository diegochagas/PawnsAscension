// Super Metroid-style grid map: explored rooms as coloured cell blocks with
// walls, doors marked as gaps, bonfires and the hero's blinking cell.
import { ROOMS, AREAS } from '../world/map.js';
import { doorsOf } from '../world/doors.js';

const doorCache = new Map();
function doorsCached(id) {
  if (!doorCache.has(id)) doorCache.set(id, doorsOf(id));
  return doorCache.get(id);
}

function drawRoom(ctx, room, ox, oy, cell, current) {
  const x = ox + room.x * cell;
  const y = oy + room.y * cell;
  ctx.fillStyle = current ? '#e0507a' : AREAS[room.area].color;
  ctx.fillRect(x, y, room.w * cell, room.h * cell);
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  for (let i = 0; i < room.w; i++) for (let j = 0; j < room.h; j++) ctx.fillRect(x + i * cell + 1, y + j * cell + 1, cell - 2, 1);
  ctx.strokeStyle = '#f4f0e0';
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, room.w * cell - 1, room.h * cell - 1);
  drawDoors(ctx, room, x, y, cell);
  if (room.kind === 'save') mark(ctx, x + cell / 2, y + cell / 2, '#ffb040');
  if (room.kind === 'boss') mark(ctx, x + cell / 2, y + cell / 2, '#ff3040');
}

function drawDoors(ctx, room, x, y, cell) {
  for (const d of doorsCached(room.id)) {
    const fx = d.side === 'L' ? 0 : d.side === 'R' ? room.w * cell - 1 : null;
    const fy = d.side === 'U' ? 0 : d.side === 'D' ? room.h * cell - 1 : null;
    ctx.fillStyle = d.gate ? '#ffd040' : '#30a0ff';
    if (fx !== null) ctx.fillRect(x + fx, y + Math.floor(d.floor / 17) * cell + cell / 2 - 1, 1, 3);
    else ctx.fillRect(x + Math.floor(d.col / 30) * cell + cell / 2 - 1, y + fy, 3, 1);
  }
}

function mark(ctx, x, y, color) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x) - 1, Math.round(y) - 1, 3, 3);
}

/**
 * Draw the explored map centred on a point.
 * @param {CanvasRenderingContext2D} ctx
 * @param {{visited: Set<string>|string[], current: string, heroCell: {x:number,y:number}, cell: number, cx: number, cy: number, blink: boolean}} o
 */
export function drawMap(ctx, o) {
  const visited = new Set(o.visited);
  const ox = Math.round(o.cx - o.heroCell.x * o.cell - o.cell / 2);
  const oy = Math.round(o.cy - o.heroCell.y * o.cell - o.cell / 2);
  for (const room of ROOMS) {
    if (visited.has(room.id)) drawRoom(ctx, room, ox, oy, o.cell, room.id === o.current);
  }
  if (o.blink) {
    ctx.fillStyle = '#fff';
    ctx.fillRect(ox + o.heroCell.x * o.cell + 2, oy + o.heroCell.y * o.cell + 2, o.cell - 4, o.cell - 4);
  }
}

/** Explored percentage (SOTN shows this on the status screen). */
export function explored(visited) {
  return Math.round((new Set(visited).size / ROOMS.length) * 100);
}
