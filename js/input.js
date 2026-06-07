var Input = (function() {
  var state = {
    left:false, right:false, up:false, down:false,
    attack:false, jump:false, dash:false, spear:false, shield:false, pause:false,
    attackJustPressed:false, jumpJustPressed:false, dashJustPressed:false,
    spearJustPressed:false, pauseJustPressed:false,
    leftJustPressed:false, rightJustPressed:false,
  };
  var prev = {};

  function copyState() {
    var s = {};
    for (var k in state) s[k] = state[k];
    return s;
  }

  // Keyboard map
  var keyMap = {
    ArrowLeft:'left', KeyA:'left',
    ArrowRight:'right', KeyD:'right',
    ArrowUp:'up', KeyW:'up', Space:'jump',
    ArrowDown:'down', KeyS:'down',
    KeyZ:'attack', Enter:'attack',
    ShiftLeft:'dash', ShiftRight:'dash',
    KeyQ:'spear',
    KeyE:'shield',
    Escape:'pause', KeyP:'pause',
  };

  document.addEventListener('keydown', function(e) {
    var a = keyMap[e.code];
    if (a) { state[a] = true; e.preventDefault(); }
  });
  document.addEventListener('keyup', function(e) {
    var a = keyMap[e.code];
    if (a) state[a] = false;
  });

  // Virtual controller buttons
  function bindBtn(id, action) {
    var el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('pointerdown', function(e) {
      e.preventDefault();
      state[action] = true;
      el.classList.add('pressed');
    });
    el.addEventListener('pointerup', function(e) {
      e.preventDefault();
      state[action] = false;
      el.classList.remove('pressed');
    });
    el.addEventListener('pointerleave', function(e) {
      state[action] = false;
      el.classList.remove('pressed');
    });
    el.addEventListener('pointercancel', function(e) {
      state[action] = false;
      el.classList.remove('pressed');
    });
    // Fallback for environments that only fire click (e.g. automated testing)
    el.addEventListener('click', function(e) {
      state[action] = true;
      el.classList.add('pressed');
      setTimeout(function() { state[action] = false; el.classList.remove('pressed'); }, 80);
    });
  }

  bindBtn('btn-left',   'left');
  bindBtn('btn-right',  'right');
  bindBtn('btn-up',     'jump');
  bindBtn('btn-jump',   'jump');
  bindBtn('btn-attack', 'attack');
  bindBtn('btn-dash',   'dash');
  bindBtn('btn-spear',  'spear');
  bindBtn('btn-shield', 'shield');
  bindBtn('btn-pause',  'pause');

  function lockBtn(id) {
    var el = document.getElementById(id);
    if (el) { el.classList.add('locked'); el.style.pointerEvents = 'none'; }
  }
  function unlockBtn(id) {
    var el = document.getElementById(id);
    if (el) { el.classList.remove('locked'); el.style.pointerEvents = ''; }
  }

  return {
    get: function() { return state; },
    update: function() {
      state.jumpJustPressed  = state.jump   && !prev.jump;
      state.attackJustPressed= state.attack && !prev.attack;
      state.dashJustPressed  = state.dash   && !prev.dash;
      state.spearJustPressed = state.spear  && !prev.spear;
      state.pauseJustPressed = state.pause  && !prev.pause;
      state.leftJustPressed  = state.left   && !prev.left;
      state.rightJustPressed = state.right  && !prev.right;
      prev = copyState();
    },
    unlockAbility: function(ability) {
      if (ability === 'dash')   unlockBtn('btn-dash');
      if (ability === 'spear')  unlockBtn('btn-spear');
      if (ability === 'shield') unlockBtn('btn-shield');
    },
  };
})();
