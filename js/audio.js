var Audio = (function() {
  var ctx = null;

  function getCtx() {
    if (!ctx) {
      try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) {}
    }
    return ctx;
  }

  function beep(freq, dur, type, vol, decay) {
    var ac = getCtx(); if (!ac) return;
    try {
      var osc = ac.createOscillator();
      var gain = ac.createGain();
      osc.connect(gain); gain.connect(ac.destination);
      osc.type = type || 'square';
      osc.frequency.setValueAtTime(freq, ac.currentTime);
      gain.gain.setValueAtTime(vol || 0.15, ac.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + (dur || 0.1));
      osc.start(ac.currentTime);
      osc.stop(ac.currentTime + (dur || 0.1));
    } catch(e) {}
  }

  function sweep(f1, f2, dur, type, vol) {
    var ac = getCtx(); if (!ac) return;
    try {
      var osc = ac.createOscillator();
      var gain = ac.createGain();
      osc.connect(gain); gain.connect(ac.destination);
      osc.type = type || 'sawtooth';
      osc.frequency.setValueAtTime(f1, ac.currentTime);
      osc.frequency.linearRampToValueAtTime(f2, ac.currentTime + dur);
      gain.gain.setValueAtTime(vol || 0.12, ac.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + dur);
      osc.start(ac.currentTime);
      osc.stop(ac.currentTime + dur);
    } catch(e) {}
  }

  return {
    swing:   function() { sweep(300, 150, 0.08, 'square', 0.12); },
    hit:     function() { sweep(200, 80,  0.1,  'sawtooth', 0.15); },
    jump:    function() { sweep(220, 440, 0.12, 'square', 0.1); },
    dash:    function() { sweep(440, 660, 0.08, 'square', 0.1); },
    spearThrow: function() { sweep(300, 600, 0.06, 'sawtooth', 0.1); },
    spearHit:   function() { beep(150, 0.12, 'sawtooth', 0.15); },
    shield:  function() { beep(800, 0.05, 'square', 0.08); },
    enemyDie:function() { sweep(300, 50, 0.15, 'square', 0.12); },
    playerHurt:function(){ sweep(800, 100, 0.2, 'sawtooth', 0.18); },
    waveClear: function() {
      var ac = getCtx(); if (!ac) return;
      [523,659,784,1047].forEach(function(f,i){
        setTimeout(function(){ beep(f, 0.18, 'square', 0.12); }, i*100);
      });
    },
    menuSelect:function() { beep(660, 0.07, 'square', 0.1); },
    save:    function() { [440,550,660].forEach(function(f,i){ setTimeout(function(){ beep(f,0.15,'square',0.1); },i*80); }); },
    gameOver:function() { sweep(400, 80, 0.5, 'sawtooth', 0.2); },
    victory: function() {
      [523,659,784,1047,784,659,523].forEach(function(f,i){
        setTimeout(function(){ beep(f, 0.2, 'square', 0.13); }, i*120);
      });
    },
    resume:  function() { if (ctx && ctx.state === 'suspended') ctx.resume(); },
  };
})();
