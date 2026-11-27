import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ROOMS, LINKS, START_ROOM, BOSS_SEALS } from '../js/world/map.js';
import { sharedEdge, doorsOf } from '../js/world/doors.js';
import { buildRoom, T } from '../js/world/roomgen.js';
import { reachable, doorStand, canExit } from '../js/world/reach.js';
import { powersOf, collect, newOwned, reachableRooms, gateOpen } from '../js/world/progress.js';

const BASE = { doubleJump: false, dash: false, bolt: false, slide: false, seals: false };
const ALL = { doubleJump: true, dash: true, bolt: true, slide: true, seals: true };

test('rooms do not overlap on the grid', () => {
  const taken = new Map();
  for (const r of ROOMS) {
    for (let x = r.x; x < r.x + r.w; x++) {
      for (let y = r.y; y < r.y + r.h; y++) {
        const key = `${x},${y}`;
        assert.ok(!taken.has(key), `${r.id} overlaps ${taken.get(key)} at ${key}`);
        taken.set(key, r.id);
      }
    }
  }
});

test('every link joins adjacent rooms and every room has a door', () => {
  const ids = new Map(ROOMS.map((r) => [r.id, r]));
  for (const [a, b] of LINKS) assert.doesNotThrow(() => sharedEdge(ids.get(a), ids.get(b)), `${a}-${b}`);
  for (const r of ROOMS) assert.ok(doorsOf(r.id).length > 0, `${r.id} has no door`);
});

test('room layouts are deterministic', () => {
  assert.deepEqual(buildRoom('t_yard').grid.cells, buildRoom('t_yard').grid.cells);
});

function requiredPowers(gate) {
  return { ...BASE, dash: gate === 'rook', doubleJump: gate === 'knight', bolt: gate === 'bishop', slide: gate === 'slide', seals: gate === 'seals' };
}

for (const spec of ROOMS) {
  test(`room ${spec.id}: doors connect (gated doors need only their own power)`, () => {
    const room = buildRoom(spec.id);
    for (const from of room.doors) {
      for (const to of room.doors) {
        if (to === from) continue;
        const powers = merge(requiredPowers(from.gate), requiredPowers(to.gate));
        const start = doorStand(room.grid, from, powers);
        assert.ok(start, `${spec.id}: no landing under door ${from.side}->${from.to}`);
        const seen = reachable(room.grid, start, powers);
        assert.ok(canExit(room.grid, to, seen, powers), `${spec.id}: ${from.side}->${from.to} cannot reach ${to.side}->${to.to}`);
      }
    }
  });
}

function merge(a, b) {
  const out = { ...a };
  for (const k of Object.keys(b)) out[k] = a[k] || b[k];
  return out;
}

test('gates really block without their power', () => {
  const room = buildRoom('t_west');
  const gateDoor = room.doors.find((d) => d.gate === 'rook');
  const other = room.doors.find((d) => !d.gate);
  const seen = reachable(room.grid, doorStand(room.grid, other, BASE), BASE);
  assert.equal(canExit(room.grid, gateDoor, seen, BASE), false);
  assert.equal(room.grid.get(0, gateDoor.floor - 1), T.CRACKED);
});

test('the castle is completable in order and not before', () => {
  let owned = newOwned();
  const rooms = new Map(ROOMS.map((r) => [r.id, r]));
  const order = [];
  for (let step = 0; step < 20; step++) {
    const open = reachableRooms(START_ROOM, powersOf(owned));
    const next = [...open].map((id) => rooms.get(id)).find((r) => isNewReward(r, owned));
    if (!next) break;
    owned = grant(owned, next);
    order.push(next.id);
  }
  assert.ok(owned.seals.length === BOSS_SEALS.length, `seals: ${owned.seals}`);
  assert.ok(reachableRooms(START_ROOM, powersOf(owned)).has('k_throne'));
  assert.ok(reachableRooms(START_ROOM, powersOf(owned)).size === ROOMS.length, 'all rooms reachable at the end');
  assert.ok(!reachableRooms(START_ROOM, powersOf(newOwned())).has('w_save'), 'woods need the Rook');
});

function isNewReward(room, owned) {
  if (room.kind === 'boss') return room.boss !== 'king' && !owned.seals.includes(room.boss);
  if (room.kind === 'altar') return !owned.forms.includes(room.item);
  if (room.kind === 'item' && ['slide'].includes(room.item)) return !owned.relics.includes(room.item);
  return false;
}

function grant(owned, room) {
  if (room.kind === 'boss') return { ...owned, seals: [...owned.seals, room.boss] };
  return collect(owned, room.item);
}

test('gateOpen maps gates to powers', () => {
  assert.equal(gateOpen('rook', { ...BASE, dash: true }), true);
  assert.equal(gateOpen('slide', BASE), false);
  assert.equal(gateOpen(null, BASE), true);
  assert.equal(gateOpen('seals', ALL), true);
});

test('knight gates need the double jump (shaft and wall)', () => {
  const room = buildRoom('t_tower');
  const start = doorStand(room.grid, room.doors.find((d) => d.to === 't_yard'), BASE);
  const seen = reachable(room.grid, start, BASE);
  const withKnight = reachable(room.grid, start, { ...BASE, doubleJump: true });
  for (const to of ['c_shaft', 't_lookout']) {
    const door = room.doors.find((d) => d.to === to);
    assert.equal(canExit(room.grid, door, seen, BASE), false, `${to} open without knight`);
    assert.equal(canExit(room.grid, door, withKnight, { ...BASE, doubleJump: true }), true, `${to} closed with knight`);
  }
});

test('slide tunnel needs the slide', () => {
  const room = buildRoom('f_after');
  const door = room.doors.find((d) => d.gate === 'slide');
  const start = doorStand(room.grid, room.doors.find((d) => !d.gate), BASE);
  assert.equal(canExit(room.grid, door, reachable(room.grid, start, BASE), BASE), false);
});
