// Particles, floating damage numbers (SOTN) and centred banner messages.

export class Effects {
  constructor() {
    this.particles = [];
    this.numbers = [];
    this.banner = null;
    this.shakeT = 0;
  }

  burst(x, y, color, count = 10, speed = 2) {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = Math.random() * speed;
      this.particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 0.5, life: 20 + Math.random() * 20, color });
    }
  }

  number(x, y, value, color = '#fff') {
    this.numbers.push({ x, y, text: String(value), life: 45, color });
  }

  /** Show a message box in the centre for a while (pickups, saves). */
  show(text, frames = 180, sub = '') {
    this.banner = { text, sub, life: frames };
  }

  shake(frames) {
    this.shakeT = Math.max(this.shakeT, frames);
  }

  update() {
    for (const p of this.particles) { p.x += p.vx; p.y += p.vy; p.vy += 0.08; p.life--; }
    for (const n of this.numbers) { n.y -= 0.5; n.life--; }
    this.particles = this.particles.filter((p) => p.life > 0);
    this.numbers = this.numbers.filter((n) => n.life > 0);
    if (this.banner && --this.banner.life <= 0) this.banner = null;
    if (this.shakeT > 0) this.shakeT--;
  }

  /** Camera offset from screen shake. */
  offset() {
    if (!this.shakeT) return { x: 0, y: 0 };
    return { x: (Math.random() - 0.5) * 4, y: (Math.random() - 0.5) * 4 };
  }

  drawWorld(ctx, cam) {
    for (const p of this.particles) {
      ctx.globalAlpha = Math.min(1, p.life / 15);
      ctx.fillStyle = p.color;
      ctx.fillRect(Math.round(p.x - cam.x), Math.round(p.y - cam.y), 2, 2);
    }
    ctx.globalAlpha = 1;
    ctx.font = 'bold 9px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    for (const n of this.numbers) {
      const x = Math.round(n.x - cam.x);
      const y = Math.round(n.y - cam.y);
      ctx.fillStyle = '#000'; ctx.fillText(n.text, x + 1, y + 1);
      ctx.fillStyle = n.color; ctx.fillText(n.text, x, y);
    }
    ctx.textAlign = 'left';
  }

  drawBanner(ctx, w) {
    if (!this.banner) return;
    const { text, sub } = this.banner;
    ctx.font = '8px "Press Start 2P", monospace';
    const width = Math.min(w - 20, Math.max(ctx.measureText(text).width, ctx.measureText(sub).width) + 24);
    const x = (w - width) / 2;
    panel(ctx, x, 64, width, sub ? 40 : 26);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#f4e4b0';
    ctx.fillText(text, w / 2, 81);
    if (sub) { ctx.fillStyle = '#b8a8d8'; ctx.fillText(sub, w / 2, 95); }
    ctx.textAlign = 'left';
  }
}

/**
 * Ornate SOTN-style panel: dark blue fill, gold double border.
 * @param {CanvasRenderingContext2D} ctx
 */
export function panel(ctx, x, y, w, h) {
  ctx.fillStyle = 'rgba(10,8,34,0.88)';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = '#c9a24a';
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  ctx.strokeStyle = '#5a4520';
  ctx.strokeRect(x + 2.5, y + 2.5, w - 5, h - 5);
  ctx.fillStyle = '#e8c860';
  for (const [cx, cy] of [[x, y], [x + w - 3, y], [x, y + h - 3], [x + w - 3, y + h - 3]]) ctx.fillRect(cx, cy, 3, 3);
}
