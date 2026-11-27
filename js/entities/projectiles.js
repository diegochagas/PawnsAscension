// Projectiles for both sides. Hero bolts shatter crystal seals.
import { TILE, POWER } from '../config.js';
import { isBlocking, TILES } from '../physics.js';

const KINDS = {
  bolt:  { r: 4, life: 70, hero: true, dmg: POWER.bolt.dmg, color: '#9fe8ff', glow: '#3aa8ff' },
  spear: { r: 4, life: 60, hero: true, dmg: POWER.spear.dmg, pierce: true, color: '#e8dcc0' },
  fire:  { r: 5, life: 160, dmg: 10, color: '#8dff6a', glow: '#2a9a2a' },
  arrow: { r: 3, life: 120, dmg: 9, color: '#e0d0b0' },
  orb:   { r: 6, life: 220, dmg: 14, color: '#d07cff', glow: '#7a2ab0' },
  rock:  { r: 6, life: 200, dmg: 14, gravity: 0.18, color: '#9a8a78' },
  thorn: { r: 6, life: 90, dmg: 14, color: '#6ab04a', glow: '#2a5a1a', ground: true },
  ember: { r: 5, life: 200, dmg: 14, gravity: 0.12, color: '#ffb040', glow: '#ff5a10' },
};

export class Projectile {
  constructor(kind, x, y, vx, vy, dmgScale = 1) {
    const def = KINDS[kind];
    if (!def) throw new Error(`unknown projectile "${kind}" (expected one of ${Object.keys(KINDS).join(', ')})`);
    Object.assign(this, { kind, def, x, y, vx, vy, life: def.life, dead: false, hits: new Set() });
    this.dmg = Math.round(def.dmg * dmgScale);
    this.hero = Boolean(def.hero);
  }

  /** Bounding box for overlap tests. */
  box() {
    const r = this.def.r;
    return { x: this.x - r, y: this.y - r, w: r * 2, h: r * 2 };
  }

  update(room) {
    if (this.def.gravity) this.vy += this.def.gravity;
    this.x += this.vx;
    this.y += this.vy;
    if (--this.life <= 0) this.dead = true;
    const tx = Math.floor(this.x / TILE);
    const ty = Math.floor(this.y / TILE);
    const tile = room.getTile(tx, ty);
    if (this.kind === 'bolt' && tile === TILES.CRYSTAL) { room.breakTile(tx, ty, TILES.CRYSTAL); this.dead = true; }
    else if (isBlocking(tile)) this.dead = true;
  }

  draw(ctx, cam, tick) {
    const x = Math.round(this.x - cam.x);
    const y = Math.round(this.y - cam.y);
    if (this.kind === 'spear' || this.kind === 'arrow') return drawShaft(ctx, x, y, this.vx, this.def.color);
    if (this.def.glow) {
      ctx.fillStyle = this.def.glow;
      ctx.globalAlpha = 0.45 + 0.2 * Math.sin(tick / 3);
      ctx.beginPath(); ctx.arc(x, y, this.def.r + 3, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
    }
    ctx.fillStyle = this.def.color;
    ctx.beginPath(); ctx.arc(x, y, this.def.r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.fillRect(x - 1, y - 1, 2, 2);
  }
}

function drawShaft(ctx, x, y, vx, color) {
  const dir = Math.sign(vx) || 1;
  ctx.fillStyle = '#5a3a20';
  ctx.fillRect(x - 10 * dir - (dir < 0 ? 0 : 0), y - 1, 16 * dir, 2);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x + 9 * dir, y); ctx.lineTo(x + 4 * dir, y - 3); ctx.lineTo(x + 4 * dir, y + 3);
  ctx.fill();
}

export const PROJECTILE_KINDS = Object.keys(KINDS);
