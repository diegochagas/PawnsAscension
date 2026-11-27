// Bosses: a shared state machine (idle → wind-up → move → recover) running the
// move list from config. Below half HP they enrage and recover faster.
import { BOSSES } from '../config.js';
import { step } from '../physics.js';

const FLYING = new Set(['queen']);
const STATIC = new Set(['king']);

export class Boss {
  /** @param {string} id key of BOSSES */
  constructor(id, x, y) {
    const def = BOSSES[id];
    if (!def) throw new Error(`unknown boss "${id}" (expected one of ${Object.keys(BOSSES).join(', ')})`);
    Object.assign(this, { id, def, w: def.w, h: def.h, x: x - def.w / 2, y: y - def.h, vx: 0, vy: 0 });
    Object.assign(this, { hp: def.hp, maxHp: def.hp, facing: -1, t: 0, state: 'intro', stateT: 90 });
    Object.assign(this, { move: null, moveIndex: 0, flash: 0, hitCd: 0, dead: false, alpha: 1 });
    this.noGravity = FLYING.has(id);
    this.homeY = this.y;
  }

  get centerX() { return this.x + this.w / 2; }
  get centerY() { return this.y + this.h / 2; }
  get enraged() { return this.hp < this.maxHp / 2; }

  update(room, hero, game) {
    this.t++;
    if (this.flash > 0) this.flash--;
    if (this.hitCd > 0) this.hitCd--;
    if (this.stateT > 0) this.stateT--;
    this.think(room, hero, game);
    if (this.noGravity) this.hover();
    if (!STATIC.has(this.id)) this.info = step(this, room.getTile);
  }

  hover() {
    this.vy = (this.homeY + Math.sin(this.t / 30) * 10 - this.y) * 0.05;
  }

  think(room, hero, game) {
    if (this.state === 'intro') { if (!this.stateT) this.idle(); return; }
    if (this.state === 'idle') return this.stroll(hero, game);
    if (this.state === 'windup') { this.vx = 0; if (!this.stateT) this.begin(room, hero, game); return; }
    if (this.state === 'move') return MOVES[this.move].tick(this, room, hero, game);
    if (this.state === 'recover') { this.vx *= 0.85; if (!this.stateT) this.idle(); }
  }

  idle() {
    this.state = 'idle';
    this.stateT = this.enraged ? 30 : 55;
  }

  stroll(hero, game) {
    this.facing = hero.centerX < this.centerX ? -1 : 1;
    if (!STATIC.has(this.id) && !this.noGravity) this.vx = this.facing * 0.6;
    if (this.stateT) return;
    this.move = this.def.moves[this.moveIndex++ % this.def.moves.length];
    this.state = 'windup';
    this.stateT = this.enraged ? 22 : 34;
    this.flash = 6;
    game.sound('windup');
  }

  begin(room, hero, game) {
    this.state = 'move';
    this.stateT = 0;
    MOVES[this.move].start(this, room, hero, game);
  }

  finish(frames = 40) {
    this.state = 'recover';
    this.stateT = this.enraged ? Math.round(frames * 0.6) : frames;
  }

  /** Apply damage; returns true when this kills it. */
  hurt(amount) {
    if (this.state === 'intro' || this.alpha < 0.5) return false;
    this.hp = Math.max(0, this.hp - amount);
    this.flash = 6;
    this.hitCd = 8;
    if (this.hp <= 0) this.dead = true;
    return this.dead;
  }

  anim() { return 'idle'; }
}

function fan(boss, hero, game, kind, count, spread) {
  const base = Math.atan2(hero.y - boss.centerY, hero.centerX - boss.centerX);
  for (let i = 0; i < count; i++) {
    const a = base + (i - (count - 1) / 2) * spread;
    game.shoot(kind, boss.centerX, boss.centerY, Math.cos(a) * 2.6, Math.sin(a) * 2.6, boss.def.atk / 14);
  }
}

const MOVES = {
  charge: {
    start: (b) => { b.stateT = 80; },
    tick: (b) => {
      b.vx = b.facing * (b.enraged ? 4.6 : 3.8);
      if (!b.stateT || (b.info && b.info.wall)) b.finish(50);
    },
  },
  leap: {
    start: (b, room, hero) => { b.vy = -9; b.vx = (hero.centerX - b.centerX) / 50; b.stateT = 10; },
    tick: (b, room, hero, game) => {
      if (b.stateT || !(b.info && b.info.ground)) return;
      game.shake(10);
      for (const dir of [-1, 1]) game.shoot('thorn', b.centerX, b.y + b.h - 6, dir * 3, 0, b.def.atk / 14);
      b.finish(45);
    },
  },
  quake: {
    start: (b, room, hero, game) => {
      game.shake(16);
      for (let i = 0; i < 6; i++) game.shoot('rock', hero.centerX + (i - 2.5) * 46, 20, 0, 0, b.def.atk / 14);
      b.stateT = 20;
    },
    tick: (b) => { if (!b.stateT) b.finish(50); },
  },
  spread: {
    start: (b, room, hero, game) => { fan(b, hero, game, 'orb', b.enraged ? 7 : 5, 0.22); b.stateT = 16; },
    tick: (b) => { if (!b.stateT) b.finish(40); },
  },
  rain: {
    start: (b) => { b.stateT = 60; },
    tick: (b, room, hero, game) => {
      if (b.stateT % 10 === 0) game.shoot('ember', hero.centerX + (Math.random() - 0.5) * 120, 24, 0, 1, b.def.atk / 14);
      if (!b.stateT) b.finish(40);
    },
  },
  thorns: {
    start: (b, room, hero, game) => {
      for (let i = 0; i < 3; i++) game.shoot('thorn', b.centerX, b.y + b.h - 6, b.facing * (2 + i), 0, b.def.atk / 14);
      b.stateT = 20;
    },
    tick: (b) => { if (!b.stateT) b.finish(45); },
  },
  summon: {
    start: (b, room, hero, game) => { game.summon(b); b.stateT = 20; },
    tick: (b) => { if (!b.stateT) b.finish(60); },
  },
  teleport: {
    start: (b) => { b.stateT = 50; },
    tick: (b, room, hero) => {
      b.alpha = Math.abs(b.stateT - 25) / 25;
      if (b.stateT === 25) { b.x = Math.max(32, Math.min(room.pxW - 32 - b.w, hero.centerX + (Math.random() < 0.5 ? -110 : 110))); }
      if (!b.stateT) { b.alpha = 1; b.finish(20); }
    },
  },
};

export const BOSS_MOVES = Object.keys(MOVES);
