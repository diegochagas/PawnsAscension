import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRng, seedFrom } from '../js/rng.js';
import { xpForLevel, levelFor, heroStats, damage } from '../js/stats.js';
import { newGame, saveGame, loadGame, migrate } from '../js/save.js';
import { step, TILES } from '../js/physics.js';
import { powersOf, collect, newOwned } from '../js/world/progress.js';

test('seeded RNG is deterministic', () => {
  const a = createRng(42);
  const b = createRng(42);
  assert.deepEqual([a(), a(), a()], [b(), b(), b()]);
  assert.notEqual(seedFrom('a'), seedFrom('b'));
});

test('levels grow with experience', () => {
  assert.equal(xpForLevel(1), 0);
  assert.equal(levelFor(0), 1);
  assert.equal(levelFor(xpForLevel(5)), 5);
  assert.equal(levelFor(xpForLevel(5) - 1), 4);
});

test('forms change attack and defense; shards add HP', () => {
  const hero = { xp: 0, shards: 2, crystals: 1 };
  assert.ok(heroStats(hero, 'rook').atk > heroStats(hero, 'pawn').atk);
  assert.equal(heroStats(hero, 'pawn').maxHp, 80 + 40);
  assert.throws(() => heroStats(hero, 'king'), /unknown form "king"/);
});

test('damage never drops below 1', () => {
  assert.equal(damage(5, 50), 1);
  assert.equal(damage(20, 5, 1.5), 25);
});

class FakeStorage {
  constructor() { this.map = new Map(); }
  getItem(k) { return this.map.get(k) ?? null; }
  setItem(k, v) { this.map.set(k, v); }
}

test('save round-trips and rejects old versions', () => {
  const storage = new FakeStorage();
  const game = { ...newGame(), xp: 123, room: 'w_save' };
  assert.equal(saveGame(storage, game), true);
  assert.deepEqual(loadGame(storage), game);
  assert.equal(migrate({ version: 1 }), null);
  storage.setItem('pawns-ascension-v2', '{broken');
  assert.equal(loadGame(storage), null);
});

test('save fixture from this version still loads', () => {
  const fixture = { version: 2, room: 'c_save', owned: { forms: ['pawn', 'rook'], relics: [], seals: ['captain'] }, xp: 300 };
  const loaded = migrate(fixture);
  assert.equal(loaded.owned.shards, 0);
  assert.deepEqual(loaded.bosses, []);
});

function grid(rows) {
  return (tx, ty) => (rows[ty] && rows[ty][tx] !== undefined ? Number(rows[ty][tx]) : 1);
}

test('bodies land on floors and one-way platforms, and walls stop them', () => {
  const g = grid(['00000', '00000', '00200', '11111']);
  const body = { x: 33, y: 0, w: 12, h: 10, vx: 0, vy: 0 };
  let info;
  for (let i = 0; i < 40; i++) info = step(body, g);
  assert.equal(body.y + body.h, 32);
  assert.ok(info.ground);
  body.dropping = true;
  for (let i = 0; i < 40; i++) step(body, g);
  assert.equal(body.y + body.h, 48);
  const wall = { x: 2, y: 30, w: 10, h: 10, vx: -3, vy: 0 };
  assert.equal(step(wall, grid(['10000', '10000', '10000', '11111'])).wall, -1);
});

test('dashing bodies break cracked tiles', () => {
  const g = grid(['00300', '00300', '11111']);
  const body = { x: 14, y: 4, w: 12, h: 12, vx: 4, vy: 0, breaks: true };
  const broken = [];
  for (let i = 0; i < 4; i++) broken.push(...step(body, g).broken);
  assert.ok(broken.some(([x]) => x === 2), JSON.stringify(broken));
  assert.equal(TILES.CRACKED, 3);
});

test('queen grants every power except the slide relic', () => {
  const owned = collect(newOwned(), 'queen');
  const p = powersOf(owned);
  assert.ok(p.dash && p.doubleJump && p.bolt);
  assert.equal(p.slide, false);
  assert.throws(() => collect(owned, 'sword'), /unknown item "sword"/);
});
