/* Synthesized chiptune + SFX — no external audio files */
const RetroAudio = (() => {
  let ctx, master, musicGain, sfxGain, muted = false, musicOn = true;
  let musicTimer = null, step = 0, song = 'title';
  const songs = {};

  function ac() {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain(); master.gain.value = 0.55; master.connect(ctx.destination);
      musicGain = ctx.createGain(); musicGain.gain.value = 0.22; musicGain.connect(master);
      sfxGain = ctx.createGain(); sfxGain.gain.value = 0.7; sfxGain.connect(master);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function env(node, a, d, s, r, peak = 0.2) {
    const t = ctx.currentTime;
    node.gain.setValueAtTime(0.0001, t);
    node.gain.exponentialRampToValueAtTime(peak, t + a);
    node.gain.exponentialRampToValueAtTime(Math.max(0.0001, peak * s), t + a + d);
    node.gain.exponentialRampToValueAtTime(0.0001, t + a + d + r);
  }

  function osc(type, freq, dur, peak, dest) {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type; o.frequency.value = freq;
    o.connect(g); g.connect(dest || sfxGain);
    env(g, 0.01, 0.05, 0.4, dur, peak);
    o.start(); o.stop(ctx.currentTime + dur + 0.05);
    return o;
  }

  function noise(dur, peak, hp = 800) {
    const n = ctx.createBufferSource();
    const buf = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    n.buffer = buf;
    const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = hp;
    const g = ctx.createGain();
    n.connect(f); f.connect(g); g.connect(sfxGain);
    env(g, 0.005, 0.02, 0.3, dur, peak);
    n.start();
  }

  const SFX = {
    pistol() { osc('square', 880, 0.06, 0.12); noise(0.04, 0.08, 1800); },
    hmg() { osc('square', 720, 0.03, 0.08); noise(0.025, 0.06, 2200); },
    shot() { noise(0.12, 0.22, 900); osc('sawtooth', 180, 0.1, 0.12); },
    rocket() { osc('sawtooth', 220, 0.18, 0.14); osc('square', 90, 0.2, 0.1); },
    flame() { noise(0.08, 0.1, 400); osc('sawtooth', 110, 0.08, 0.06); },
    laser() { const o = osc('square', 1400, 0.1, 0.1); o.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.1); },
    chaser() { osc('triangle', 520, 0.12, 0.1); osc('square', 260, 0.12, 0.06); },
    grenade() { osc('triangle', 300, 0.08, 0.1); },
    boom() {
      noise(0.35, 0.4, 300);
      const o = osc('sine', 90, 0.4, 0.28);
      o.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.35);
    },
    jump() { const o = osc('square', 240, 0.12, 0.08); o.frequency.exponentialRampToValueAtTime(480, ctx.currentTime + 0.1); },
    pickup() { [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => osc('square', f, 0.08, 0.1), i * 40)); },
    prisoner() { [392, 523, 659, 784, 1046].forEach((f, i) => setTimeout(() => osc('triangle', f, 0.1, 0.1), i * 50)); },
    death() { const o = osc('sawtooth', 400, 0.5, 0.16); o.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.45); noise(0.3, 0.2, 200); },
    melee() { noise(0.06, 0.15, 1200); osc('square', 200, 0.07, 0.1); },
    hit() { noise(0.05, 0.12, 700); osc('square', 140, 0.06, 0.08); },
    alarm() { osc('square', 880, 0.25, 0.12); setTimeout(() => osc('square', 660, 0.25, 0.12), 280); },
    ui() { osc('square', 660, 0.05, 0.08); },
    start() { [262, 330, 392, 523].forEach((f, i) => setTimeout(() => osc('square', f, 0.12, 0.12), i * 90)); },
    empty() { osc('square', 90, 0.04, 0.05); },
    vehicle() { osc('sawtooth', 80, 0.3, 0.1); noise(0.2, 0.1, 200); },
  };

  // Song patterns: [freq or 0, length-in-steps] sequences, 16th notes
  function mkSong(tempo, bass, lead, perc) {
    return { tempo, bass, lead, perc };
  }
  songs.title = mkSong(110,
    [98,0,98,0, 110,0,98,0, 87,0,87,0, 82,0,87,0],
    [392,0,440,392, 523,0,440,0, 349,392,0,330, 294,0,330,0],
    [1,0,0,1, 1,0,1,0, 1,0,0,1, 1,1,0,0]
  );
  songs.m1 = mkSong(140,
    [130,130,0,130, 146,0,130,0, 116,116,0,110, 98,0,110,0],
    [523,0,587,523, 659,0,587,0, 784,659,0,587, 523,0,440,0],
    [1,0,1,0, 1,0,1,1, 1,0,1,0, 1,1,0,1]
  );
  songs.m2 = mkSong(128,
    [87,0,87,92, 98,0,87,0, 78,0,78,82, 87,0,73,0],
    [349,0,330,349, 392,0,330,0, 294,330,0,262, 247,0,262,0],
    [1,0,0,1, 1,0,1,0, 1,0,0,1, 1,0,1,1]
  );
  songs.m3 = mkSong(118,
    [73,73,0,73, 82,0,73,0, 65,65,0,61, 55,0,61,0],
    [294,0,277,294, 330,0,277,0, 247,262,0,220, 196,0,220,0],
    [1,1,0,1, 1,0,1,0, 1,1,0,1, 1,0,0,1]
  );
  songs.m4 = mkSong(100,
    [65,0,65,73, 82,0,65,0, 55,0,55,61, 65,0,49,0],
    [262,294,0,330, 262,0,220,0, 196,220,0,247, 262,0,196,0],
    [1,0,0,0, 1,0,1,0, 1,0,0,1, 1,0,0,0]
  );
  songs.m5 = mkSong(150,
    [55,55,0,61, 65,0,55,0, 49,49,0,41, 37,0,41,0],
    [440,0,523,440, 659,0,523,0, 392,440,0,349, 330,0,392,0],
    [1,0,1,1, 1,0,1,0, 1,1,1,0, 1,0,1,1]
  );
  songs.boss = mkSong(160,
    [41,41,41,0, 49,0,41,0, 37,37,37,0, 33,0,37,0],
    [659,0,0,622, 659,784,0,659, 523,0,587,0, 659,0,784,0],
    [1,1,1,0, 1,0,1,1, 1,1,1,0, 1,1,0,1]
  );

  function tick() {
    if (!ctx || muted || !musicOn) return;
    const s = songs[song] || songs.title;
    const i = step % 16;
    const t = ctx.currentTime;
    const b = s.bass[i];
    if (b) {
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.type = 'triangle'; o.frequency.value = b;
      o.connect(g); g.connect(musicGain);
      g.gain.setValueAtTime(0.18, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
      o.start(); o.stop(t + 0.2);
    }
    const l = s.lead[i];
    if (l) {
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.type = 'square'; o.frequency.value = l;
      o.connect(g); g.connect(musicGain);
      g.gain.setValueAtTime(0.07, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
      o.start(); o.stop(t + 0.16);
    }
    if (s.perc[i]) {
      const n = ctx.createBufferSource();
      const buf = ctx.createBuffer(1, 800, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let k = 0; k < d.length; k++) d[k] = (Math.random() * 2 - 1) * (1 - k / d.length);
      n.buffer = buf;
      const g = ctx.createGain(); g.gain.value = s.perc[i] === 1 ? 0.12 : 0.06;
      n.connect(g); g.connect(musicGain); n.start();
    }
    step++;
    const ms = (60 / s.tempo) * 250;
    musicTimer = setTimeout(tick, ms);
  }

  return {
    unlock() { ac(); },
    play(name) { if (muted) return; ac(); (SFX[name] || SFX.ui)(); },
    setSong(n) {
      song = n; step = 0;
      if (musicTimer) { clearTimeout(musicTimer); musicTimer = null; }
      ac(); tick();
    },
    stopMusic() { if (musicTimer) { clearTimeout(musicTimer); musicTimer = null; } },
    setMute(v) { muted = v; if (master) master.gain.value = v ? 0 : 0.55; },
    setMusic(v) { musicOn = v; if (!v) this.stopMusic(); else tick(); },
    setVolumes(m, s) {
      ac();
      musicGain.gain.value = m * 0.22;
      sfxGain.gain.value = s * 0.7;
    },
    isMuted() { return muted; },
  };
})();
window.retroAudio = RetroAudio;
