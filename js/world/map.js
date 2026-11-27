// The castle: rooms placed on a grid of map cells (one cell = one screen), linked
// by doors. Gates block a link until the hero has the matching power:
//   rook   cracked wall, broken by the Rook dash
//   knight wall/shaft too high for one jump, needs the Knight double jump
//   bishop crystal seal, shattered by the Bishop bolt
//   slide  low tunnel, only the Pawn slide fits
//   seals  the throne door, opens with all five boss seals

export const AREAS = [
  { id: 'field',  art: 'z1', color: '#3f7a4a', enemies: ['pawn', 'bat'] },
  { id: 'woods',  art: 'z2', color: '#2f6a6a', enemies: ['wraith', 'crawler', 'pawn', 'knight'] },
  { id: 'cliffs', art: 'z3', color: '#5a6478', enemies: ['bat', 'corrupt', 'crawler', 'rook'] },
  { id: 'forge',  art: 'z4', color: '#8a3a22', enemies: ['rook', 'bishop', 'crawler'] },
  { id: 'battle', art: 'z5', color: '#8a6a3a', enemies: ['knight', 'corrupt', 'wraith', 'bishop'] },
  { id: 'castle', art: 'z6', color: '#5a3a7a', enemies: ['rook', 'bishop', 'knight', 'corrupt'] },
];

const r = (id, area, x, y, w, h, extra = {}) => ({ id, area, x, y, w, h, ...extra });

export const ROOMS = [
  r('t_west', 0, 3, 3, 2, 1),
  r('t_start', 0, 5, 3, 2, 1, { kind: 'start' }),
  r('t_save', 0, 7, 3, 1, 1, { kind: 'save' }),
  r('t_yard', 0, 8, 3, 3, 1),
  r('t_tower', 0, 11, 1, 1, 3),
  r('t_lookout', 0, 12, 1, 2, 1, { kind: 'item', item: 'shard' }),
  r('t_boss', 0, 12, 3, 2, 1, { kind: 'boss', boss: 'captain' }),
  r('t_altar', 0, 14, 3, 1, 1, { kind: 'altar', item: 'rook' }),

  r('w_save', 1, 0, 3, 1, 1, { kind: 'save' }),
  r('w_gate', 1, 1, 3, 2, 1),
  r('w_drop', 1, 1, 4, 1, 3),
  r('w_item', 1, 2, 5, 2, 1, { kind: 'item', item: 'slide' }),
  r('w_hollow', 1, 2, 6, 3, 1),
  r('w_boss', 1, 5, 6, 2, 1, { kind: 'boss', boss: 'thorn' }),
  r('w_altar', 1, 7, 6, 1, 1, { kind: 'altar', item: 'knight' }),

  r('c_save', 2, 10, -2, 1, 1, { kind: 'save' }),
  r('c_shaft', 2, 11, -2, 1, 3),
  r('c_bridge', 2, 12, -1, 3, 1),
  r('c_item', 2, 14, -3, 1, 1, { kind: 'item', item: 'crystal' }),
  r('c_climb', 2, 15, -3, 1, 3),
  r('c_boss', 2, 16, -3, 2, 1, { kind: 'boss', boss: 'ironrook' }),
  r('c_altar', 2, 18, -3, 1, 1, { kind: 'altar', item: 'bishop' }),

  r('f_entry', 3, 15, 3, 1, 1),
  r('f_shaft', 3, 15, 4, 1, 3),
  r('f_save', 3, 14, 5, 1, 1, { kind: 'save' }),
  r('f_item', 3, 16, 5, 1, 1, { kind: 'item', item: 'shard' }),
  r('f_hall', 3, 16, 6, 3, 1),
  r('f_boss', 3, 19, 6, 2, 1, { kind: 'boss', boss: 'forge' }),
  r('f_after', 3, 21, 6, 1, 1, { kind: 'item', item: 'shard' }),

  r('b_tunnel', 4, 22, 6, 1, 1),
  r('b_ruins', 4, 22, 3, 1, 3),
  r('b_save', 4, 21, 3, 1, 1, { kind: 'save' }),
  r('b_item', 4, 23, 4, 2, 1, { kind: 'item', item: 'crystal' }),
  r('b_field', 4, 23, 3, 3, 1),
  r('b_boss', 4, 26, 3, 2, 1, { kind: 'boss', boss: 'queen' }),
  r('b_altar', 4, 28, 3, 1, 1, { kind: 'altar', item: 'queen' }),

  r('k_gate', 5, 19, -3, 2, 1),
  r('k_save', 5, 21, -3, 1, 1, { kind: 'save' }),
  r('k_hall', 5, 22, -5, 1, 3),
  r('k_throne', 5, 23, -5, 3, 1, { kind: 'boss', boss: 'king' }),
];

// [roomA, roomB, gate?]: rooms must share an edge; the door goes on the first
// shared cell (or the cell given as 4th element: grid x for vertical, y for horizontal).
export const LINKS = [
  ['t_west', 't_start'], ['t_start', 't_save'], ['t_save', 't_yard'],
  ['t_yard', 't_tower'], ['t_tower', 't_boss'], ['t_boss', 't_altar'],
  ['t_tower', 't_lookout', 'knight'],
  ['w_gate', 't_west', 'rook'], ['w_save', 'w_gate'], ['w_gate', 'w_drop'],
  ['w_drop', 'w_item'], ['w_drop', 'w_hollow'], ['w_hollow', 'w_boss'], ['w_boss', 'w_altar'],
  ['c_shaft', 't_tower', 'knight'], ['c_save', 'c_shaft'], ['c_shaft', 'c_bridge'],
  ['c_bridge', 'c_climb'], ['c_item', 'c_climb'], ['c_climb', 'c_boss'], ['c_boss', 'c_altar'],
  ['t_altar', 'f_entry', 'bishop'], ['f_entry', 'f_shaft'], ['f_save', 'f_shaft'],
  ['f_shaft', 'f_hall'], ['f_item', 'f_hall'], ['f_hall', 'f_boss'], ['f_boss', 'f_after'],
  ['f_after', 'b_tunnel', 'slide'], ['b_ruins', 'b_tunnel'], ['b_save', 'b_ruins'],
  ['b_ruins', 'b_field'], ['b_ruins', 'b_item'], ['b_field', 'b_boss'], ['b_boss', 'b_altar'],
  ['c_altar', 'k_gate', 'seals'], ['k_gate', 'k_save'], ['k_hall', 'k_save'], ['k_hall', 'k_throne'],
];

export const START_ROOM = 't_start';
export const BOSS_SEALS = ['captain', 'thorn', 'ironrook', 'forge', 'queen'];

/**
 * Index rooms by id.
 * @returns {Map<string, object>}
 */
export function roomIndex() {
  return new Map(ROOMS.map((room) => [room.id, room]));
}
