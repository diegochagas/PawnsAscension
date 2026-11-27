// Title screen with menu, language toggle and the intro story cards.
import { VIEW_W, VIEW_H } from '../config.js';
import { t, getLang, setLang } from '../i18n.js';
import { art, drawSprite } from '../render/assets.js';
import { panel } from '../render/fx.js';
import { sfx, resumeAudio } from '../audio.js';

const INTRO = ['intro1', 'intro2', 'intro3'];

export class TitleScene {
  /** @param {{hasSave: () => boolean, start: (kind: string) => void, onLang: () => void}} hooks */
  constructor(hooks) {
    Object.assign(this, { hooks, cursor: 0, tick: 0, intro: -1 });
    this.saveExists = hooks.hasSave(); // read once: parsing the save every frame is wasted work
  }

  items() {
    const list = this.saveExists ? ['continue'] : [];
    return [...list, 'new_game', 'survive', 'language'];
  }

  update(input) {
    this.tick++;
    if (this.intro >= 0) return this.updateIntro(input);
    const items = this.items();
    if (input.pressed.up) { this.cursor = (this.cursor + items.length - 1) % items.length; sfx('menu'); }
    if (input.pressed.down) { this.cursor = (this.cursor + 1) % items.length; sfx('menu'); }
    this.cursor = Math.min(this.cursor, items.length - 1);
    if (input.confirm()) this.choose(items[this.cursor]);
  }

  choose(item) {
    resumeAudio();
    sfx('menu');
    if (item === 'language') { this.toggleLang(); return; }
    if (item === 'new_game') { this.intro = 0; this.introT = 0; return; }
    this.hooks.start(item);
  }

  toggleLang() {
    setLang(getLang() === 'en' ? 'pt' : 'en');
    this.hooks.onLang();
  }

  updateIntro(input) {
    this.introT++;
    if (!input.confirm() || this.introT < 20) return;
    this.intro++;
    this.introT = 0;
    if (this.intro >= INTRO.length) this.hooks.start('new_game');
  }

  draw(ctx) {
    const img = art.images['assets/title.png'];
    if (img) ctx.drawImage(img, 0, 0, VIEW_W, VIEW_H);
    else { ctx.fillStyle = '#100820'; ctx.fillRect(0, 0, VIEW_W, VIEW_H); }
    if (this.intro >= 0) return this.drawIntro(ctx);
    this.drawLogo(ctx);
    this.drawMenu(ctx);
  }

  drawLogo(ctx) {
    ctx.textAlign = 'center';
    ctx.font = '20px "Press Start 2P", monospace';
    ctx.fillStyle = '#2a0610';
    ctx.fillText(t('title'), VIEW_W / 2 + 2, 52);
    ctx.fillStyle = '#e8d090';
    ctx.fillText(t('title'), VIEW_W / 2, 50);
    ctx.font = '8px "Press Start 2P", monospace';
    ctx.fillStyle = '#c0a0e0';
    ctx.fillText(t('subtitle'), VIEW_W / 2, 66);
    ctx.textAlign = 'left';
  }

  drawMenu(ctx) {
    const items = this.items();
    panel(ctx, VIEW_W / 2 - 80, 150, 160, 18 + items.length * 15);
    ctx.font = '8px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    items.forEach((k, i) => {
      ctx.fillStyle = i === this.cursor ? '#ffffff' : '#9a8aba';
      ctx.fillText((i === this.cursor ? '▶ ' : '') + t(k), VIEW_W / 2, 168 + i * 15);
    });
    ctx.textAlign = 'left';
  }

  drawIntro(ctx) {
    ctx.fillStyle = 'rgba(0,0,0,0.75)';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    panel(ctx, 30, 90, VIEW_W - 60, 70);
    ctx.font = '8px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#f4e4b0';
    wrap(ctx, t(INTRO[this.intro]), VIEW_W / 2, 115, VIEW_W - 90, 14);
    if (this.tick % 60 < 40) { ctx.fillStyle = '#9a8aba'; ctx.fillText('▼', VIEW_W - 50, 152); }
    ctx.textAlign = 'left';
    drawSprite(ctx, 'hero_pawn', VIEW_W / 2, 84, { tick: this.tick });
  }
}

function wrap(ctx, text, x, y, maxW, lineH) {
  const words = text.split(' ');
  let line = '';
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxW && line) { ctx.fillText(line, x, y); line = word; y += lineH; }
    else line = test;
  }
  ctx.fillText(line, x, y);
}
