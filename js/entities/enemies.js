// Regular enemies. Each AI is a small function that steers the body;
// contact always hurts the hero, some AIs add a strike or a projectile.
import { ENEMIES, TILE } from '../config.js';
import { step, isBlocking } from '../physics.js';

export class Enemy {
  /** @param {string} type key of ENEMIES @param {number} x centre @param {number} y feet */
  constructor(type, x, y) {
    const def = ENEMIES[type];
    if (!def) throw new Error(`unknown enemy type "${type}" (expected one of ${Object.keys(ENEMIES).join(', ')})`);
    Object.assign(this, { type, def, w: def.w, h: def.h, x: x - def.w / 2, y: y - def.h, vx: 0, vy: 0 });
    Object.assign(this, { hp: def.hp, facing: -1, t: Math.floor(Math.random() * 60), state: 'idle', stateT: 0 });
    Object.assign(this, { flash: 0, hitCd: 0, dead: false, homeY: y - def.h });
    this.noGravity = def.ai === 'flyer' || def.ai === 'floater';
  }

  get centerX() { return this.x + this.w / 2; }
  get centerY() { return this.y + this.h / 2; }

  update(room, hero, game) {
    this.t++;
    if (this.flash > 0) this.flash--;
    if (this.hitCd > 0) this.hitCd--;
    if (this.stateT > 0) this.stateT--;
    AI[this.def.ai](this, room, hero, game);
    if (this.def.ai === 'floater') { this.x += this.vx; this.y += this.vy; return; }
    this.info = step(this, room.getTile);
  }

  setState(state, frames) {
    this.state = state;
    this.stateT = frames;
  }

  facePlayer(hero) {
    this.facing = hero.centerX < this.centerX ? -1 : 1;
  }

  near(hero, dx, dy = 40) {
    return Math.abs(hero.centerX - this.centerX) < dx && Math.abs(hero.feetY - (this.y + this.h)) < dy;
  }

  ledgeAhead(room) {
    const fx = Math.floor((this.facing > 0 ? this.x + this.w + 2 : this.x - 2) / TILE);
    const below = room.getTile(fx, Math.floor((this.y + this.h + 2) / TILE));
    const ahead = room.getTile(fx, Math.floor((this.y + this.h - 4) / TILE));
    return below === 0 || below === 5 || isBlocking(ahead);
  }

  /** Strike hitbox during an attack, else null. */
  hitbox() {
    if (this.state !== 'strike') return null;
    const reach = 18;
    return { x: this.facing > 0 ? this.x + this.w : this.x - reach, y: this.y + 4, w: reach, h: this.h - 8 };
  }

  /** Apply damage; returns true when this kills it. */
  hurt(amount, fromX) {
    this.hp -= amount;
    this.flash = 8;
    this.hitCd = 10;
    if (this.def.ai !== 'floater' && this.type !== 'rook') this.vx = (this.centerX < fromX ? -1 : 1) * 2;
    if (this.hp <= 0) this.dead = true;
    return this.dead;
  }

  anim() {
    if (this.flash > 4) return 'hurt';
    if (this.state === 'windup') return 'windup';
    if (this.state === 'strike' || this.state === 'charge') return 'attack';
    return Math.abs(this.vx) > 0.1 ? 'walk' : 'idle';
  }
}

function patrol(e, room, speed) {
  if (e.ledgeAhead(room) || (e.info && e.info.wall)) e.facing *= -1;
  e.vx = e.facing * speed;
}

function walker(e, room, hero) {
  if (e.state === 'windup') { e.vx = 0; if (!e.stateT) e.setState('strike', 12); return; }
  if (e.state === 'strike') { e.vx = 0; if (!e.stateT) e.setState('idle', 30); return; }
  if (e.near(hero, 34, 30) && !e.stateT) { e.facePlayer(hero); e.setState('windup', 22); return; }
  if (e.near(hero, 140)) e.facePlayer(hero);
  if (e.flash <= 0) patrol(e, room, e.def.speed);
}

function charger(e, room, hero) {
  if (e.state === 'windup') { e.vx = 0; if (!e.stateT) e.setState('charge', 70); return; }
  if (e.state === 'charge') {
    e.vx = e.facing * e.def.speed;
    if (!e.stateT || (e.info && e.info.wall) || e.ledgeAhead(room)) e.setState('idle', 60);
    return;
  }
  if (e.near(hero, 200, 30) && !e.stateT) { e.facePlayer(hero); e.setState('windup', 28); return; }
  patrol(e, room, 0.5);
}

function caster(e, room, hero, game, shot = 'fire') {
  e.vx *= 0.8;
  if (e.state === 'windup') {
    if (!e.stateT) { e.setState('strike', 10); game.enemyShot(shot, e, hero); }
    return;
  }
  if (e.state === 'strike') { if (!e.stateT) e.setState('idle', 100); return; }
  if (e.near(hero, 230, 120)) { e.facePlayer(hero); if (!e.stateT) e.setState('windup', 30); }
  else if (e.flash <= 0) patrol(e, room, e.def.speed);
}

function flyer(e, room, hero) {
  const chasing = Math.abs(hero.centerX - e.centerX) < 180 && Math.abs(hero.y - e.y) < 140;
  const tx = chasing ? hero.centerX : e.centerX + e.facing * 20;
  const ty = chasing ? hero.y + 4 : e.homeY + Math.sin(e.t / 20) * 18;
  e.vx += Math.sign(tx - e.centerX) * 0.06;
  e.vy += Math.sign(ty - e.centerY) * 0.05 + Math.sin(e.t / 6) * 0.04;
  e.vx = Math.max(-e.def.speed, Math.min(e.def.speed, e.vx));
  e.vy = Math.max(-e.def.speed, Math.min(e.def.speed, e.vy));
  e.facing = e.vx < 0 ? -1 : 1;
}

function floater(e, room, hero) {
  const dx = hero.centerX - e.centerX;
  const dy = hero.y - e.y;
  const d = Math.hypot(dx, dy) || 1;
  const s = d < 220 ? e.def.speed : 0.15;
  e.vx = (dx / d) * s;
  e.vy = (dy / d) * s + Math.sin(e.t / 15) * 0.3;
  e.facing = dx < 0 ? -1 : 1;
}

function crawler(e, room) {
  patrol(e, room, e.def.speed);
}

const AI = {
  walker, charger, flyer, floater, crawler,
  caster: (e, room, hero, game) => caster(e, room, hero, game, 'fire'),
  shooter: (e, room, hero, game) => caster(e, room, hero, game, 'arrow'),
};
