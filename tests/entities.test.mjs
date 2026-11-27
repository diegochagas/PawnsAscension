import { test } from 'node:test';
import assert from 'node:assert/strict';
import { keysOf, t, setLang } from '../js/i18n.js';
import { Room } from '../js/world/room.js';
import { ROOMS } from '../js/world/map.js';
import { Enemy } from '../js/entities/enemies.js';
import { Boss, BOSS_MOVES } from '../js/entities/boss.js';
import { Hero } from '../js/entities/hero.js';
import { Projectile } from '../js/entities/projectiles.js';
import { ENEMIES, BOSSES } from '../js/config.js';
import { T } from '../js/world/roomgen.js';

test('English and Portuguese have the same keys', () => {
  assert.deepEqual(keysOf('pt').sort(), keysOf('en').sort());
  setLang('pt');
  assert.equal(t('new_game'), 'Novo Jogo');
  setLang('en');
  assert.equal(t('survive_over', { n: 4 }), 'Survived 4 waves');
  assert.throws(() => setLang('fr'), /unknown language "fr"/);
});

/** Records what entities ask the game to do. */
class FakeGame {
  constructor() { this.calls = []; this.mp = 100; }
  spendMp(c) { if (this.mp < c) return false; this.mp -= c; return true; }
  stats() { return { atk: 10 }; }
  spawn(kind) { this.calls.push(['spawn', kind]); }
  shoot(kind) { this.calls.push(['shoot', kind]); }
  enemyShot(kind) { this.calls.push(['shot', kind]); }
  summon() { this.calls.push(['summon']); }
  heal(n) { this.calls.push(['heal', n]); }
  sound() {}
  effect() {}
  shake() {}
  onFormChange() {}
}

function heroIn(room, form = 'pawn') {
  const hero = new Hero(room.pxW / 2, (room.grid.h - 2) * 16 - 28);
  hero.forms = ['pawn', 'rook', 'knight', 'bishop', 'queen'];
  hero.relics = ['slide'];
  hero.form = form;
  return hero;
}

const idle = () => ({ down: {}, pressed: {} });

test('every enemy type runs 300 frames without leaving the room', () => {
  const room = new Room('t_yard');
  const hero = heroIn(room);
  for (const type of Object.keys(ENEMIES)) {
    const e = new Enemy(type, 400, (room.grid.h - 2) * 16);
    for (let i = 0; i < 300; i++) e.update(room, hero, new FakeGame());
    assert.ok(Number.isFinite(e.x) && e.y < room.pxH + 64, `${type} escaped: ${e.x},${e.y}`);
  }
});

test('every boss uses its moves and can be defeated', () => {
  const room = new Room('c_boss');
  const hero = heroIn(room);
  for (const id of Object.keys(BOSSES)) {
    const game = new FakeGame();
    const boss = new Boss(id, 600, (room.grid.h - 2) * 16);
    for (let i = 0; i < 900; i++) boss.update(room, hero, game);
    assert.ok(BOSSES[id].moves.every((m) => BOSS_MOVES.includes(m)), id);
    assert.ok(boss.moveIndex >= 2, `${id} only used ${boss.moveIndex} moves`);
    boss.hurt(99999);
    assert.equal(boss.dead, true);
  }
});

test('hero lands on the floor and double-jumps only as a knight', () => {
  const room = new Room('t_yard');
  const hero = heroIn(room, 'pawn');
  for (let i = 0; i < 30; i++) hero.update(idle(), room, new FakeGame());
  assert.ok(hero.ground);
  const jump = { down: { jump: true }, pressed: { jump: true } };
  hero.update(jump, room, new FakeGame());
  for (let i = 0; i < 10; i++) hero.update(idle(), room, new FakeGame());
  const before = hero.vy;
  hero.update(jump, room, new FakeGame());
  assert.ok(hero.vy > before, 'pawn has no double jump (no upward boost)');
  hero.form = 'knight';
  hero.airJumps = 1;
  hero.update(jump, room, new FakeGame());
  assert.ok(hero.vy < before - 2, 'knight double-jumps');
});

test('bishop bolt shatters a crystal seal', () => {
  const room = new Room('t_altar');
  const door = room.doors.find((d) => d.gate === 'bishop');
  const x = room.pxW - 8;
  const y = (door.floor - 2) * 16 + 8;
  assert.equal(room.grid.get(room.grid.w - 1, door.floor - 2), T.CRYSTAL);
  const bolt = new Projectile('bolt', x - 40, y, 4, 0);
  for (let i = 0; i < 20 && !bolt.dead; i++) bolt.update(room);
  assert.notEqual(room.grid.get(room.grid.w - 2, door.floor - 2), T.CRYSTAL);
});

test('hero powers spawn the right things per form', () => {
  const room = new Room('t_yard');
  const game = new FakeGame();
  const hero = heroIn(room, 'bishop');
  for (let i = 0; i < 30; i++) hero.update(idle(), room, game);
  hero.update({ down: { power: true }, pressed: { power: true } }, room, game);
  assert.equal(game.calls.filter(([c, k]) => c === 'spawn' && k === 'bolt').length, 2);
  hero.form = 'rook';
  hero.powerCd = 0;
  hero.update({ down: { power: true }, pressed: { power: true } }, room, game);
  assert.ok(hero.dashT > 0);
});

test('boss rooms lock and unlock their doors', () => {
  const room = new Room('t_boss');
  room.lockDoors();
  assert.ok(room.locked.length > 0);
  assert.equal(room.getTile(0, 14), T.LOCK);
  room.unlockDoors();
  assert.equal(room.getTile(0, 14), T.EMPTY);
  assert.ok(ROOMS.filter((r) => r.kind === 'boss').length === 6);
});

test('regression: spike pits hurt (feet sink into the non-solid spike row)', async () => {
  const { step } = await import('../js/physics.js');
  const room = new Room('t_west');
  let px = -1;
  for (let x = 0; x < room.grid.w && px < 0; x++) if (room.grid.get(x, room.grid.h - 2) === T.SPIKES) px = x;
  assert.ok(px > 0, 't_west has a spike pit');
  const body = { x: px * 16 + 2, y: (room.grid.h - 4) * 16, w: 12, h: 28, vx: 0, vy: 0 };
  let hurt = false;
  for (let i = 0; i < 60; i++) hurt = step(body, room.getTile).spikes || hurt;
  assert.equal(hurt, true);
});

test('regression: pawn with the slide relic still drops through floor hatches', () => {
  const room = new Room('w_gate');
  const hatch = room.doors.find((d) => d.side === 'D');
  const hero = heroIn(room, 'pawn');
  hero.x = (hatch.col + 1) * 16;
  hero.y = (room.grid.h - 2) * 16 - hero.h;
  for (let i = 0; i < 5; i++) hero.update(idle(), room, new FakeGame());
  hero.update({ down: { down: true, jump: true }, pressed: { jump: true } }, room, new FakeGame());
  assert.equal(hero.slideT, 0, 'did not slide');
  assert.ok(hero.dropT > 0, 'dropping through the hatch');
});
