// One play session: the current room, the hero, enemies, projectiles and the
// save progress they change. Scenes drive it; combat/props modules act on it.
import { VIEW_W, VIEW_H, TILE, CELL_W, CELL_H, ENEMIES } from '../config.js';
import { Room } from '../world/room.js';
import { LINKS } from '../world/map.js';
import { roomAtCell } from '../world/doors.js';
import { powersOf } from '../world/progress.js';
import { heroStats, levelFor } from '../stats.js';
import { saveGame } from '../save.js';
import { Hero } from '../entities/hero.js';
import { Enemy } from '../entities/enemies.js';
import { Boss } from '../entities/boss.js';
import { Projectile } from '../entities/projectiles.js';
import { Effects } from '../render/fx.js';
import { sfx, playMusic } from '../audio.js';
import { t } from '../i18n.js';

const AREA_KEYS = ['area_field', 'area_woods', 'area_cliffs', 'area_forge', 'area_battle', 'area_castle'];

export class Session {
  /** @param {ReturnType<import('../save.js').newGame>} progress @param {Storage|null} storage */
  constructor(progress, storage) {
    Object.assign(this, { progress, storage, fx: new Effects(), tick: 0, cam: { x: 0, y: 0 }, fade: 0 });
    this.hero = new Hero(0, 0);
    this.hero.forms = progress.owned.forms;
    this.hero.relics = progress.owned.relics;
    this.hero.form = progress.form;
    this.refreshStats(true);
    this.enterRoom(progress.respawn || progress.room, null);
    this.placeAtSpawn();
  }

  stats() { return heroStats({ xp: this.progress.xp, shards: this.progress.owned.shards, crystals: this.progress.owned.crystals }, this.hero.form); }

  refreshStats(full = false) {
    const s = this.stats();
    this.maxHp = s.maxHp;
    this.maxMp = s.maxMp;
    this.hero.hp = full ? s.maxHp : Math.min(this.hero.hp, s.maxHp);
    this.hero.mp = full ? s.maxMp : Math.min(this.hero.mp, s.maxMp);
  }

  placeAtSpawn() {
    const prop = this.room.props.find((p) => p.type === 'bonfire');
    const x = prop ? prop.x - 30 : this.room.pxW / 2;
    this.hero.x = x - this.hero.w / 2;
    this.hero.y = (this.room.grid.h - 2) * TILE - this.hero.h;
    this.snapCamera();
  }

  /** Load a room; `global` = hero position in world pixels to carry over. */
  enterRoom(id, global) {
    const prevArea = this.room ? this.room.spec.area : -1;
    this.room = new Room(id);
    this.progress.room = id;
    if (!this.progress.visited.includes(id)) this.progress.visited.push(id);
    this.enemies = this.room.spawns.map((s) => new Enemy(s.type, s.x, s.y));
    this.shots = [];
    this.boss = null;
    this.bossArmed = this.room.spec.kind === 'boss' && !this.progress.bosses.includes(this.room.spec.boss);
    if (powersOf(this.progress.owned).seals) this.room.openSeals();
    if (global) { this.hero.x = global.x - this.room.originX; this.hero.y = global.y - this.room.originY; }
    if (this.room.spec.area !== prevArea) this.announceArea();
    playMusic(this.room.spec.area);
  }

  announceArea() {
    this.areaTitle = { text: t(AREA_KEYS[this.room.spec.area]), life: 150 };
  }

  /** Room transition when the hero crosses an edge (seamless, world-pixel based). */
  checkExit() {
    const h = this.hero;
    const cx = h.centerX;
    const cy = h.y + h.h / 2;
    if (cx >= 0 && cx < this.room.pxW && cy >= 0 && cy < this.room.pxH) return;
    const gx = this.room.originX + cx;
    const gy = this.room.originY + cy;
    const next = roomAtCell(Math.floor(gx / (CELL_W * TILE)), Math.floor(gy / (CELL_H * TILE)));
    if (!next || !linked(this.room.id, next.id)) { this.clampHero(); return; }
    this.enterRoom(next.id, { x: this.room.originX + h.x, y: this.room.originY + h.y });
    this.fade = 10;
    sfx('door');
    this.snapCamera();
  }

  clampHero() {
    const h = this.hero;
    h.x = Math.max(0, Math.min(this.room.pxW - h.w, h.x));
    h.y = Math.max(0, Math.min(this.room.pxH - h.h, h.y));
  }

  /** Spawn the boss once the hero is well inside its arena. */
  armBoss() {
    if (!this.bossArmed || this.boss) return;
    const h = this.hero;
    if (h.x < 48 || h.x > this.room.pxW - 64) return;
    let x = clamp(h.centerX + h.facing * 200, 70, this.room.pxW - 70); // ahead and in view
    if (Math.abs(x - h.centerX) < 120) x = clamp(h.centerX - h.facing * 200, 70, this.room.pxW - 70);
    this.boss = new Boss(this.room.spec.boss, x, (this.room.grid.h - 2) * TILE);
    this.room.lockDoors();
    this.bossArmed = false;
    sfx('windup');
  }

  updateCamera() {
    const tx = this.hero.centerX - VIEW_W / 2;
    const ty = this.hero.y - VIEW_H / 2 + 10;
    this.cam.x += (clamp(tx, 0, this.room.pxW - VIEW_W) - this.cam.x) * 0.2;
    this.cam.y += (clamp(ty, 0, this.room.pxH - VIEW_H) - this.cam.y) * 0.2;
  }

  snapCamera() {
    this.cam.x = clamp(this.hero.centerX - VIEW_W / 2, 0, this.room.pxW - VIEW_W);
    this.cam.y = clamp(this.hero.y - VIEW_H / 2 + 10, 0, this.room.pxH - VIEW_H);
  }

  // ── services the hero / enemies / bosses call ──
  spendMp(cost) {
    if (this.hero.mp < cost) return false;
    this.hero.mp -= cost;
    return true;
  }

  heal(amount) {
    this.hero.hp = Math.min(this.maxHp, this.hero.hp + amount);
    this.fx.number(this.hero.centerX, this.hero.y - 4, amount, '#7aff8a');
    this.fx.burst(this.hero.centerX, this.hero.y + 10, '#9affb0', 14);
    sfx('magic');
  }

  spawn(kind, x, y, v) {
    const scale = this.stats().atk / 10;
    this.shots.push(new Projectile(kind, x, y, v.vx, v.vy, scale));
  }

  shoot(kind, x, y, vx, vy, scale = 1) {
    this.shots.push(new Projectile(kind, x, y, vx, vy, scale));
  }

  enemyShot(kind, enemy, hero) {
    const dx = hero.centerX - enemy.centerX;
    const dy = hero.y + 10 - (enemy.y + 8);
    const d = Math.hypot(dx, dy) || 1;
    const speed = kind === 'arrow' ? 3.2 : 1.8;
    this.shoot(kind, enemy.centerX, enemy.y + 8, (dx / d) * speed, kind === 'arrow' ? 0 : (dy / d) * speed);
  }

  summon(boss) {
    if (this.enemies.length >= 3) return;
    const types = this.room.area.enemies.filter((ty) => ENEMIES[ty].ai !== 'charger');
    for (let i = 0; i < 2; i++) {
      const type = types[(this.tick + i) % types.length];
      this.enemies.push(new Enemy(type, boss.centerX + (i ? 40 : -40), boss.y + boss.h));
    }
  }

  sound(name) { sfx(name); }
  effect(name, x, y) { this.fx.burst(x, y, name === 'ljump' ? '#ffd890' : '#fff', 8); }
  shake(frames) { this.fx.shake(frames); }

  onFormChange(hero) {
    this.progress.form = hero.form;
    this.refreshStats();
    this.fx.burst(hero.centerX, hero.y + 12, '#f8f0ff', 24, 2.5);
    this.fx.number(hero.centerX, hero.y - 6, t(`f_${hero.form}`), '#f4e4b0');
    sfx('form');
  }

  /** Grant experience (Black Essence) and handle level-ups. */
  gainXp(amount) {
    const before = levelFor(this.progress.xp);
    this.progress.xp += amount;
    if (levelFor(this.progress.xp) > before) {
      this.refreshStats(true);
      this.fx.show(t('level_up'), 120);
      sfx('level');
    }
  }

  save() {
    this.progress.form = this.hero.form;
    if (this.storage) saveGame(this.storage, this.progress);
  }
}

function linked(a, b) {
  return LINKS.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
}

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(Math.max(lo, hi), v));
}
