// Keyboard + touch buttons mapped to game actions, with per-frame "pressed" edges.

const KEYS = {
  ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down',
  KeyZ: 'attack', KeyX: 'jump', Space: 'jump', KeyC: 'power', KeyQ: 'sub',
  KeyA: 'prevForm', KeyS: 'nextForm', Enter: 'start', Escape: 'pause', KeyP: 'pause',
  KeyJ: 'attack', KeyK: 'jump', KeyL: 'power', KeyW: 'up',
};

export const ACTIONS = ['left', 'right', 'up', 'down', 'attack', 'jump', 'power', 'sub', 'prevForm', 'nextForm', 'start', 'pause'];

/** Live input state; call frame() once per tick to update edges. */
export class Input {
  constructor() {
    this.down = Object.fromEntries(ACTIONS.map((a) => [a, false]));
    this.prev = { ...this.down };
    this.pressed = { ...this.down };
    this.latched = new Set(); // taps shorter than one frame still count
  }

  /** Attach keyboard and on-screen button listeners. */
  bind(doc) {
    doc.addEventListener('keydown', (e) => this.key(e, true));
    doc.addEventListener('keyup', (e) => this.key(e, false));
    doc.querySelectorAll('[data-action]').forEach((el) => this.bindButton(el));
  }

  key(event, isDown) {
    const action = KEYS[event.code];
    if (!action) return;
    if (isDown && !event.repeat) this.latched.add(action);
    this.down[action] = isDown;
    event.preventDefault();
  }

  bindButton(el) {
    const action = el.dataset.action;
    const set = (v) => (e) => {
      e.preventDefault();
      if (v) this.latched.add(action);
      this.down[action] = v;
      el.classList.toggle('on', v);
    };
    el.addEventListener('pointerdown', set(true));
    ['pointerup', 'pointerleave', 'pointercancel'].forEach((n) => el.addEventListener(n, set(false)));
  }

  /** Compute this tick's pressed edges. */
  frame() {
    for (const a of ACTIONS) this.pressed[a] = (this.down[a] && !this.prev[a]) || this.latched.has(a);
    this.latched.clear();
    this.prev = { ...this.down };
  }

  /** Confirm = Enter or attack (menus). */
  confirm() {
    return this.pressed.start || this.pressed.attack;
  }
}
