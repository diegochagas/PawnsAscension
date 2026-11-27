// The exploration scene: runs the session, draws the world and its overlays.
import { VIEW_W, VIEW_H } from '../config.js';
import { Session } from '../game/session.js';
import { resolveCombat } from '../game/combat.js';
import { interact, rest, drawProps } from '../game/props.js';
import { drawBackground, drawTiles } from '../render/level.js';
import { drawSprite } from '../render/assets.js';
import { drawHud } from '../render/hud.js';
import { drawPause, drawBonfireMenu, drawEnd } from '../render/screens.js';
import { roomIndex } from '../world/map.js';
import { loadGame } from '../save.js';
import { sfx, stopMusic } from '../audio.js';

const PAUSE_TABS = ['map', 'status'];

export class PlayScene {
  /** @param {object} data save data @param {Storage|null} storage @param {(scene: string) => void} goTo */
  constructor(data, storage, goTo) {
    Object.assign(this, { storage, goTo, mode: 'play', menu: 0, tab: 0 });
    this.s = new Session(data, storage);
  }

  update(input) {
    const s = this.s;
    s.tick++;
    s.data.playFrames++;
    if (this.mode === 'pause') return this.updatePause(input);
    if (this.mode === 'bonfire') return this.updateBonfire(input);
    if (this.mode === 'dead' || this.mode === 'victory') return this.updateEnd(input);
    if (input.pressed.pause) { this.mode = 'pause'; this.menu = 0; sfx('menu'); return; }
    this.step(input);
  }

  step(input) {
    const s = this.s;
    if (s.fade > 0) s.fade--;
    const info = s.hero.update(input, s.room, s);
    if (info.spikes) s.hero.hurt(12, s.hero.centerX - s.hero.facing);
    s.checkExit();
    s.armBoss();
    for (const e of s.enemies) e.update(s.room, s.hero, s);
    if (s.boss) s.boss.update(s.room, s.hero, s);
    for (const p of s.shots) p.update(s.room);
    resolveCombat(s);
    if (interact(s, input) === 'bonfire') { this.mode = 'bonfire'; this.menu = 0; }
    s.fx.update();
    if (s.areaTitle && --s.areaTitle.life <= 0) s.areaTitle = null;
    s.updateCamera();
    if (s.hero.dead) { this.mode = 'dead'; stopMusic(); }
    if (s.victory && --s.victory <= 0) { this.mode = 'victory'; s.save(); }
  }

  updatePause(input) {
    if (input.pressed.left || input.pressed.right) { this.tab = (this.tab + 1) % PAUSE_TABS.length; sfx('menu'); }
    if (input.pressed.up || input.pressed.down) { this.menu = (this.menu + 1) % 2; sfx('menu'); }
    if (input.pressed.pause) this.mode = 'play';
    if (!input.confirm()) return;
    if (this.menu === 0) this.mode = 'play';
    else { stopMusic(); this.goTo('title'); }
  }

  bonfireOptions() {
    const rooms = roomIndex();
    const warps = this.s.data.bonfires.filter((id) => id !== this.s.room.id && rooms.has(id));
    return [{ kind: 'rest' }, ...warps.map((id) => ({ kind: 'warp', id, area: rooms.get(id).area }))];
  }

  updateBonfire(input) {
    const options = this.bonfireOptions();
    if (input.pressed.up) this.menu = (this.menu + options.length - 1) % options.length;
    if (input.pressed.down) this.menu = (this.menu + 1) % options.length;
    if (input.pressed.pause || input.pressed.jump) { this.mode = 'play'; return; }
    if (!input.confirm()) return;
    const choice = options[this.menu];
    if (choice.kind === 'rest') rest(this.s);
    else this.warp(choice.id);
    this.mode = 'play';
  }

  warp(id) {
    const s = this.s;
    s.enterRoom(id, null);
    s.placeAtSpawn();
    s.fade = 20;
    rest(s);
  }

  updateEnd(input) {
    this.s.fx.update();
    if (!input.confirm()) return;
    if (this.mode === 'victory') { this.goTo('title'); return; }
    const saved = this.storage && loadGame(this.storage);
    if (saved) this.s = new Session(saved, this.storage);
    else this.goTo('title');
    this.mode = 'play';
  }

  // ── drawing ──
  draw(ctx) {
    const s = this.s;
    const shake = s.fx.offset();
    const cam = { x: s.cam.x + shake.x, y: s.cam.y + shake.y };
    drawBackground(ctx, s.room, cam);
    drawProps(ctx, s, cam, s.tick);
    drawTiles(ctx, s.room, cam);
    this.drawActors(ctx, cam);
    for (const p of s.shots) p.draw(ctx, cam, s.tick);
    s.fx.drawWorld(ctx, cam);
    drawHud(ctx, this.hudState());
    s.fx.drawBanner(ctx, VIEW_W);
    this.drawOverlay(ctx);
  }

  drawActors(ctx, cam) {
    const s = this.s;
    for (const e of s.enemies) drawEnemy(ctx, e, cam);
    if (s.boss) drawBoss(ctx, s.boss, cam);
    drawHero(ctx, s.hero, cam);
  }

  hudState() {
    const s = this.s;
    const spec = s.room.spec;
    const heroCell = { x: spec.x + Math.floor(s.hero.centerX / 480), y: spec.y + Math.floor(s.hero.y / 272) };
    return {
      form: s.hero.form, level: s.stats().level, hp: s.hero.hp, maxHp: s.maxHp, mp: s.hero.mp, maxMp: s.maxMp,
      essence: s.data.xp, boss: s.boss, areaTitle: s.areaTitle,
      map: { visited: s.data.visited, current: s.room.id, heroCell, blink: s.tick % 40 < 20 },
    };
  }

  drawOverlay(ctx) {
    const s = this.s;
    if (s.fade > 0) { ctx.fillStyle = `rgba(0,0,0,${s.fade / 10})`; ctx.fillRect(0, 0, VIEW_W, VIEW_H); }
    if (this.mode === 'pause') drawPause(ctx, s, PAUSE_TABS[this.tab], this.menu, this.hudState());
    if (this.mode === 'bonfire') drawBonfireMenu(ctx, this.bonfireOptions(), this.menu);
    if (this.mode === 'dead' || this.mode === 'victory') drawEnd(ctx, this.mode, s.tick);
  }
}

function drawHero(ctx, h, cam) {
  if (h.invuln > 0 && Math.floor(h.invuln / 3) % 2 === 0 && !h.dead) return;
  const lift = h.slideT > 0 ? 8 : 0;
  drawSprite(ctx, `hero_${h.form}`, h.centerX - cam.x, h.feetY - cam.y + lift, {
    anim: h.anim(), tick: h.tick, flip: h.facing < 0, speed: 6, alpha: h.dead ? 0.5 : 1,
  });
}

function drawEnemy(ctx, e, cam) {
  const bob = e.def.ai === 'floater' ? Math.sin(e.t / 10) * 2 : 0;
  const ok = drawSprite(ctx, `en_${e.type}`, e.centerX - cam.x, e.y + e.h - cam.y + bob, {
    anim: e.anim(), tick: e.t, flip: e.facing < 0, speed: e.type === 'bat' ? 4 : 9, flash: e.flash > 0,
    alpha: e.def.ai === 'floater' ? 0.8 : 1,
  });
  if (!ok) { ctx.fillStyle = '#a03050'; ctx.fillRect(e.x - cam.x, e.y - cam.y, e.w, e.h); }
}

function drawBoss(ctx, b, cam) {
  const glow = b.state === 'windup' && b.t % 6 < 3;
  drawSprite(ctx, `boss_${b.id}`, b.centerX - cam.x, b.y + b.h - cam.y + 4, {
    flip: b.facing < 0 && b.id !== 'king', flash: b.flash > 0 || glow, alpha: b.alpha,
  });
}
