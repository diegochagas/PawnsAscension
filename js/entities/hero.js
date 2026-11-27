// The pawn hero: SOTN-style moves plus a traversal power per promotion form.
import { PHYS, HERO, FORMS, POWER, FORM_ORDER } from '../config.js';
import { step, boxBlocked, TILES } from '../physics.js';

export class Hero {
  constructor(x, y) {
    Object.assign(this, { x, y, w: HERO.w, h: HERO.h, vx: 0, vy: 0, facing: 1 });
    Object.assign(this, { form: 'pawn', hp: 1, mp: 1, ground: false, coyote: 0, airJumps: 0 });
    Object.assign(this, { attackT: 0, cooldown: 0, invuln: 0, hurtT: 0, dashT: 0, slideT: 0 });
    Object.assign(this, { powerCd: 0, switchCd: 0, dropT: 0, tick: 0, dead: false });
  }

  get centerX() { return this.x + this.w / 2; }
  get feetY() { return this.y + this.h; }
  get formDef() { return FORMS[this.form]; }

  can(power) {
    const p = this.formDef.power;
    if (power === 'slide') return this.form === 'pawn' && this.relics.includes('slide');
    return p === power || (p === 'all' && power !== 'slide');
  }

  /**
   * Advance one frame. `game` provides spawn(), fx(), stats() and room tiles.
   * @returns {{broken: number[][], spikes: boolean}}
   */
  update(input, room, game) {
    this.tick++;
    this.timers();
    if (this.dead) return { broken: [], spikes: false };
    this.switchForm(input, game);
    if (this.hurtT <= 0 && this.dashT <= 0 && this.slideT <= 0) this.control(input, room, game);
    this.applyDashSlide();
    const info = this.move(room);
    this.afterMove(info, room);
    return info;
  }

  timers() {
    for (const k of ['attackT', 'cooldown', 'invuln', 'hurtT', 'dashT', 'powerCd', 'switchCd', 'dropT']) {
      if (this[k] > 0) this[k]--;
    }
  }

  switchForm(input, game) {
    if (this.switchCd > 0 || !(input.pressed.prevForm || input.pressed.nextForm)) return;
    if (this.slideT > 0) return;
    const owned = FORM_ORDER.filter((f) => this.forms.includes(f));
    const i = owned.indexOf(this.form);
    const next = owned[(i + (input.pressed.nextForm ? 1 : owned.length - 1)) % owned.length];
    if (next === this.form) return;
    this.form = next;
    this.switchCd = 12;
    game.onFormChange(this);
  }

  control(input, room, game) {
    const dir = (input.down.right ? 1 : 0) - (input.down.left ? 1 : 0);
    const speed = PHYS.runSpeed * this.formDef.speed * (this.attackT > 0 && this.ground ? 0.3 : 1);
    if (dir) { this.vx += (dir * speed - this.vx) * PHYS.accel; if (this.attackT <= 0) this.facing = dir; }
    else this.vx *= 1 - PHYS.friction;
    if (input.pressed.jump) this.jump(input, room, game);
    if (input.pressed.attack && this.cooldown <= 0) this.attack(game);
    if (input.pressed.power && this.powerCd <= 0) this.power(input, game);
    if (input.pressed.sub && this.powerCd <= 0) this.throwSpear(game);
  }

  jump(input, room, game) {
    const onOneway = room.getTile(Math.floor(this.centerX / 16), Math.floor((this.feetY + 1) / 16)) === TILES.ONEWAY;
    if (input.down.down && this.ground && onOneway) { this.dropT = 12; return; } // hatches beat the slide
    if (input.down.down && this.ground && this.can('slide')) return this.startSlide(game);
    if (this.ground || this.coyote > 0) { this.vy = PHYS.jumpV; this.coyote = 0; game.sound('jump'); return; }
    if (this.airJumps > 0 && this.can('doubleJump')) {
      this.airJumps--;
      this.vy = PHYS.doubleJumpV;
      game.effect('ljump', this.centerX, this.feetY);
      game.sound('jump2');
    }
  }

  attack(game) {
    this.attackT = 14;
    this.cooldown = this.formDef.cd;
    game.sound('swing');
  }

  /** Attack hitbox while the thrust is active, else null. */
  hitbox() {
    if (this.attackT < 4 || this.attackT > 11) return null;
    const reach = this.formDef.reach;
    const x = this.facing > 0 ? this.x + this.w : this.x - reach;
    return { x, y: this.y + 6, w: reach, h: 12 };
  }

  power(input, game) {
    const stats = game.stats();
    if (this.can('bolt') && input.down.up && this.form === 'bishop') return this.pray(game);
    if (this.can('dash') && !(this.form === 'queen' && input.down.up)) return this.startDash(game);
    if (this.can('bolt')) return this.castBolt(game, stats);
  }

  startDash(game) {
    this.dashT = POWER.dash.frames;
    this.powerCd = POWER.dash.cooldown;
    this.invuln = Math.max(this.invuln, POWER.dash.frames);
    game.sound('dash');
  }

  castBolt(game) {
    if (!game.spendMp(POWER.bolt.mp)) return;
    this.powerCd = POWER.bolt.cooldown;
    const v = POWER.bolt.speed;
    game.spawn('bolt', this.centerX + this.facing * 8, this.y + 8, { vx: this.facing * v * 0.75, vy: -v * 0.75 });
    game.spawn('bolt', this.centerX + this.facing * 8, this.y + 12, { vx: this.facing * v, vy: 0 });
    game.sound('magic');
  }

  pray(game) {
    if (!game.spendMp(POWER.pray.mp)) return;
    this.powerCd = POWER.pray.cooldown;
    game.heal(POWER.pray.heal);
  }

  throwSpear(game) {
    if (!game.spendMp(POWER.spear.mp)) return;
    this.powerCd = POWER.spear.cooldown;
    game.spawn('spear', this.centerX, this.y + 10, { vx: this.facing * POWER.spear.speed, vy: 0 });
    game.sound('swing');
  }

  startSlide(game) {
    this.slideT = POWER.slide.frames;
    this.setHeight(HERO.slideH);
    game.sound('dash');
  }

  setHeight(h) {
    this.y += this.h - h;
    this.h = h;
  }

  applyDashSlide() {
    if (this.dashT > 0) { this.vx = this.facing * POWER.dash.speed; this.vy = Math.min(this.vy, 0.5); }
    if (this.slideT > 0) { this.vx = this.facing * POWER.slide.speed; this.slideT--; }
  }

  move(room) {
    this.breaks = this.dashT > 0;
    this.dropping = this.dropT > 0;
    const info = step(this, room.getTile);
    if (this.slideT <= 0 && this.h !== HERO.h) this.tryStand(room);
    return info;
  }

  tryStand(room) {
    if (boxBlocked(this.x, this.y + this.h - HERO.h, this.w, HERO.h, room.getTile)) { this.slideT = 2; return; }
    this.setHeight(HERO.h);
  }

  afterMove(info, room) {
    if (info.ground) { this.ground = true; this.coyote = PHYS.coyoteFrames; this.airJumps = 1; }
    else { if (this.ground) this.coyote = PHYS.coyoteFrames; this.ground = false; if (this.coyote > 0) this.coyote--; }
    if (info.wall && this.dashT > 0) this.dashT = 0;
    for (const [tx, ty] of info.broken) room.breakTile(tx, ty, TILES.CRACKED);
  }

  /**
   * Take a hit unless invulnerable.
   * @returns {boolean} whether damage was applied
   */
  hurt(amount, fromX) {
    if (this.invuln > 0 || this.dead) return false;
    this.hp = Math.max(0, this.hp - amount);
    this.invuln = HERO.invuln;
    this.hurtT = this.form === 'rook' ? 0 : 16;
    this.vx = (this.centerX < fromX ? -1 : 1) * 2.6;
    this.vy = -3.5;
    this.attackT = 0;
    if (this.hp <= 0) this.dead = true;
    return true;
  }

  /** Animation name for the current state. */
  anim() {
    if (this.hurtT > 0) return 'hurt';
    if (this.attackT > 0) return 'attack';
    if (this.slideT > 0 || this.dashT > 0) return 'attack';
    if (!this.ground) return 'jump';
    return Math.abs(this.vx) > 0.4 ? 'run' : 'idle';
  }
}
