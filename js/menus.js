function uiText(scene, x, y, str, size, color) {
  return scene.add.text(x, y, str, {
    fontFamily: 'monospace', fontSize: size, color: color || '#f0be28',
    stroke: '#120008', strokeThickness: 5, align: 'center',
  }).setOrigin(0.5);
}

class TitleScene extends Phaser.Scene {
  constructor() { super('Title'); }
  create() {
    RetroAudio.unlock(); RetroAudio.setSong('title');
    this.add.image(ERIS.W / 2, ERIS.H / 2, 'title_art').setDisplaySize(ERIS.W, ERIS.H);
    this.add.rectangle(ERIS.W / 2, ERIS.H / 2, ERIS.W, ERIS.H, 0x100018, 0.28);
    uiText(this, ERIS.W / 2, 46, 'ERIS SLUG', 48, '#ffe07a');
    uiText(this, ERIS.W / 2, 88, 'PRINCIPIA DISCORDIA', 18, '#ff70c0');
    uiText(this, ERIS.W / 2, 114, 'METAL RUN & GUN  ·  5 MISSÕES  ·  HAIL ERIS', 12, '#c0c0d0');
    const blink = uiText(this, ERIS.W / 2, 470, 'TOQUE NA TELA OU PRESSIONE ENTER / Z', 16, '#ffffff');
    this.tweens.add({ targets: blink, alpha: 0.2, yoyo: true, repeat: -1, duration: 500 });
    uiText(this, ERIS.W / 2, 510, '© 23 DISCORDIAN YEAR  ·  LEI DOS CINCOS', 10, '#8060a0');
    this.input.keyboard.once('keydown-ENTER', () => this._go());
    this.input.keyboard.once('keydown-Z', () => this._go());
    this.input.once('pointerdown', () => this._go());
  }
  _go() { RetroAudio.play('start'); this.scene.start('Menu'); }
}

class MenuScene extends Phaser.Scene {
  constructor() { super('Menu'); }
  create() {
    RetroAudio.setSong('title');
    this.add.image(ERIS.W / 2, ERIS.H / 2, 'title_art').setDisplaySize(ERIS.W, ERIS.H).setAlpha(0.45);
    this.add.rectangle(ERIS.W / 2, ERIS.H / 2, ERIS.W, ERIS.H, 0x080010, 0.55);
    uiText(this, ERIS.W / 2, 50, 'ERIS SLUG', 36);
    uiText(this, ERIS.W / 2, 86, 'SELECIONE O CAOS (TOQUE OU TECLADO)', 12, '#ff70c0');
    const P = this.registry.get('progress');
    this.items = [
      { label: 'COMEÇAR JOGO', fn: () => this._start(1) },
      { label: 'SELECIONAR MISSÃO', fn: () => this.scene.start('MissionSelect') },
      { label: 'OPÇÕES', fn: () => this.scene.start('Options') },
      { label: 'CRÉDITOS', fn: () => this.scene.start('Credits') },
      { label: 'ORÁCULO', fn: () => this._oracle() },
    ];
    this.idx = 0;
    this.rows = this.items.map((it, i) => {
      const r = uiText(this, ERIS.W / 2, 160 + i * 42, it.label, 20, '#d0d0d0');
      r.setInteractive({ useHandCursor: true });
      r.on('pointerover', () => { this.idx = i; this._paint(); });
      r.on('pointerdown', () => {
        this.idx = i;
        this._paint();
        RetroAudio.play('ui');
        this.items[i].fn();
      });
      return r;
    });
    this._paint();
    this.input.keyboard.on('keydown-UP', () => { this.idx = (this.idx + this.items.length - 1) % this.items.length; this._paint(); RetroAudio.play('ui'); });
    this.input.keyboard.on('keydown-DOWN', () => { this.idx = (this.idx + 1) % this.items.length; this._paint(); RetroAudio.play('ui'); });
    this.input.keyboard.on('keydown-ENTER', () => this.items[this.idx].fn());
    this.input.keyboard.on('keydown-Z', () => this.items[this.idx].fn());
    uiText(this, ERIS.W / 2, 500, 'HI ' + String(P.hi).padStart(6, '0') + '   ·   DESBLOQUEADAS ' + Math.min(5, P.unlocked) + '/5', 12, '#a09060');
  }
  _paint() {
    this.rows.forEach((r, i) => r.setColor(i === this.idx ? '#ffe07a' : '#d0d0d0').setScale(i === this.idx ? 1.08 : 1));
  }
  _start(m) {
    const P = this.registry.get('progress');
    const d = DIFFICULTY[P.difficulty];
    P.lives = d.lives; P.score = 0; P.bombs = 10; P.weapon = 'pistol'; P.ammo = Infinity; P.continues = 3;
    P.hp = d.hp; P.mission = m;
    RetroAudio.play('start');
    this.scene.start('Briefing', { mission: m });
  }
  _oracle() {
    const list = (typeof ORACLE !== 'undefined' && ORACLE.length) ? ORACLE : null;
    if (list) {
      const o = list[Math.floor(Math.random() * list.length)];
      alert('✦ ORÁCULO DE ERIS ✦\n\n"' + (o.quote || o.q) + '"\n\n— ' + (o.ref || o.r));
      return;
    }
    fetch('/api/oracle').then(r => r.json()).then(d => {
      alert('✦ ORÁCULO DE ERIS ✦\n\n"' + d.quote + '"\n\n— ' + d.ref);
    }).catch(() => {
      alert('✦ ORÁCULO DE ERIS ✦\n\n"Cinco toneladas de linho."\n\n— The Law of Fives');
    });
  }
}

class MissionSelect extends Phaser.Scene {
  constructor() { super('MissionSelect'); }
  create() {
    this.add.rectangle(0, 0, ERIS.W, ERIS.H, 0x100018).setOrigin(0);
    uiText(this, ERIS.W / 2, 36, 'SELECIONAR MISSÃO', 24);
    const P = this.registry.get('progress');
    this.idx = 0;
    this.cards = MISSIONS.map((m, i) => {
      const locked = i + 1 > P.unlocked;
      const x = 96 + i * 176, y = 200;
      const c = this.add.container(x, y);
      const img = this.add.image(0, 0, m.env).setDisplaySize(160, 90);
      const frame = this.add.rectangle(0, 0, 168, 130, 0x000000, 0.2).setStrokeStyle(2, locked ? 0x403050 : 0xf0be28);
      const t = this.add.text(0, 62, locked ? '???' : m.code + '  ' + m.name, { fontFamily: 'monospace', fontSize: 9, color: locked ? '#605070' : '#ffe07a' }).setOrigin(0.5);
      c.add([img, frame, t]); c.locked = locked; c.mid = i + 1;
      c.setSize(168, 130);
      c.setInteractive({ useHandCursor: true });
      c.on('pointerover', () => { this.idx = i; this._paint(); });
      c.on('pointerdown', () => {
        this.idx = i;
        this._paint();
        this._go();
      });
      return c;
    });
    this._paint();
    this.input.keyboard.on('keydown-LEFT', () => { this.idx = (this.idx + 4) % 5; this._paint(); });
    this.input.keyboard.on('keydown-RIGHT', () => { this.idx = (this.idx + 1) % 5; this._paint(); });
    this.input.keyboard.on('keydown-ENTER', () => this._go());
    this.input.keyboard.on('keydown-Z', () => this._go());
    this.input.keyboard.on('keydown-ESC', () => this.scene.start('Menu'));

    const backBtn = uiText(this, ERIS.W / 2, 450, '◀ VOLTAR AO MENU', 16, '#ffe07a');
    backBtn.setInteractive({ useHandCursor: true });
    backBtn.on('pointerdown', () => this.scene.start('Menu'));

    uiText(this, ERIS.W / 2, 500, 'Toque no card para jogar ou use os controles', 12, '#a09060');
  }
  _paint() { this.cards.forEach((c, i) => c.setScale(i === this.idx ? 1.08 : 1).setAlpha(c.locked ? 0.4 : 1)); }
  _go() {
    const c = this.cards[this.idx];
    if (c.locked) { RetroAudio.play('empty'); return; }
    const P = this.registry.get('progress');
    const d = DIFFICULTY[P.difficulty];
    P.lives = d.lives; P.score = 0; P.bombs = 10; P.weapon = 'pistol'; P.continues = 3;
    this.scene.start('Briefing', { mission: c.mid });
  }
}

class OptionsScene extends Phaser.Scene {
  constructor() { super('Options'); }
  create() {
    this.add.rectangle(0, 0, ERIS.W, ERIS.H, 0x100018).setOrigin(0);
    uiText(this, ERIS.W / 2, 40, 'OPÇÕES', 28);
    const P = this.registry.get('progress');
    const diffs = ['easy', 'normal', 'hard', 'mania'];
    this.opts = [
      { k: 'difficulty', label: 'DIFICULDADE', get: () => DIFFICULTY[P.difficulty].name, cycle: () => { P.difficulty = diffs[(diffs.indexOf(P.difficulty) + 1) % 4]; } },
      { k: 'music', label: 'MÚSICA', get: () => P.music ? 'ON' : 'OFF', cycle: () => { P.music = !P.music; RetroAudio.setMusic(P.music); } },
      { k: 'sfx', label: 'EFEITOS', get: () => P.sfx ? 'ON' : 'OFF', cycle: () => { P.sfx = !P.sfx; RetroAudio.setMute(!P.sfx); } },
      { k: 'crt', label: 'FILTRO CRT', get: () => P.crt ? 'ON' : 'OFF', cycle: () => { P.crt = !P.crt; const crtEl = document.getElementById('crt-overlay'); if (crtEl) crtEl.style.display = P.crt ? 'block' : 'none'; } },
      { k: 'shake', label: 'TREME TELA', get: () => P.shake ? 'ON' : 'OFF', cycle: () => { P.shake = !P.shake; } },
    ];
    this.idx = 0;
    this.rows = this.opts.map((o, i) => {
      const r = uiText(this, ERIS.W / 2, 115 + i * 38, '', 18);
      r.setInteractive({ useHandCursor: true });
      r.on('pointerdown', () => { this.idx = i; this._cyc(); });
      return r;
    });
    this._paint();
    this.input.keyboard.on('keydown-UP', () => { this.idx = (this.idx + this.opts.length - 1) % this.opts.length; this._paint(); });
    this.input.keyboard.on('keydown-DOWN', () => { this.idx = (this.idx + 1) % this.opts.length; this._paint(); });
    this.input.keyboard.on('keydown-LEFT', () => this._cyc());
    this.input.keyboard.on('keydown-RIGHT', () => this._cyc());
    this.input.keyboard.on('keydown-ENTER', () => this._cyc());
    this.input.keyboard.on('keydown-Z', () => this._cyc());
    this.input.keyboard.on('keydown-ESC', () => { this._save(); this.scene.start('Menu'); });

    uiText(this, ERIS.W / 2, 335, 'CONTROLES', 14, '#ff70c0');
    uiText(this, ERIS.W / 2, 360, '← → andar    ↑ mirar cima    ↓ agachar    ESPAÇO/C pular', 11, '#c0c0d0');
    uiText(this, ERIS.W / 2, 380, 'Z atirar    X granada    ↓+pulo sair do slug    P pausar', 11, '#c0c0d0');
    uiText(this, ERIS.W / 2, 400, 'No celular: use o D-Pad virtual e botões na tela', 11, '#a090b0');

    const backBtn = uiText(this, ERIS.W / 2, 460, '◀ SALVAR E VOLTAR AO MENU', 18, '#ffe07a');
    backBtn.setInteractive({ useHandCursor: true });
    backBtn.on('pointerdown', () => { this._save(); this.scene.start('Menu'); });
  }
  _cyc() { this.opts[this.idx].cycle(); this._paint(); RetroAudio.play('ui'); }
  _paint() {
    this.rows.forEach((r, i) => {
      const o = this.opts[i];
      r.setText((i === this.idx ? '▸ ' : '  ') + o.label + '   ' + o.get());
      r.setColor(i === this.idx ? '#ffe07a' : '#d0d0d0');
    });
  }
  _save() {
    const P = this.registry.get('progress');
    localStorage.setItem('eris_slug_save', JSON.stringify(P));
    fetch('/api/save', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(P) }).catch(() => {});
  }
}

class BriefingScene extends Phaser.Scene {
  constructor() { super('Briefing'); }
  init(d) { this.mid = d.mission; }
  create() {
    const spec = MISSIONS[this.mid - 1];
    this.add.image(ERIS.W / 2, ERIS.H / 2, spec.env).setDisplaySize(ERIS.W, ERIS.H).setAlpha(0.4);
    this.add.rectangle(0, 0, ERIS.W, ERIS.H, 0x080010, 0.55).setOrigin(0);
    uiText(this, ERIS.W / 2, 50, spec.season, 14, '#ff70c0');
    uiText(this, ERIS.W / 2, 90, spec.code + '  ' + spec.name, 28);
    uiText(this, ERIS.W / 2, 128, spec.subtitle, 16, '#ffe07a');
    const brief = this.add.text(ERIS.W / 2, 220, spec.briefing, {
      fontFamily: 'monospace', fontSize: 14, color: '#e0e0e0', wordWrap: { width: 640 }, align: 'center', lineSpacing: 8,
    }).setOrigin(0.5);
    const bdef = BOSSES[spec.boss];
    uiText(this, ERIS.W / 2, 340, 'CHEFE: ' + bdef.title + ' — ' + bdef.subtitle, 14, '#ff8080');
    uiText(this, ERIS.W / 2, 370, '"' + bdef.quote + '"', 12, '#a090b0');
    const go = uiText(this, ERIS.W / 2, 470, 'TOQUE NA TELA OU Z / ENTER PARA INICIAR', 16);
    this.tweens.add({ targets: go, alpha: 0.25, yoyo: true, repeat: -1, duration: 450 });
    go.setInteractive({ useHandCursor: true });
    go.on('pointerdown', () => this._go());
    this.input.keyboard.once('keydown-ENTER', () => this._go());
    this.input.keyboard.once('keydown-Z', () => this._go());
    this.input.once('pointerdown', () => this._go());
  }
  _go() { RetroAudio.play('start'); this.scene.start('Play', { mission: this.mid }); }
}

class CompleteScene extends Phaser.Scene {
  constructor() { super('Complete'); }
  init(d) { this.d = d; }
  create() {
    RetroAudio.setSong('title');
    this.add.rectangle(0, 0, ERIS.W, ERIS.H, 0x100018).setOrigin(0);
    uiText(this, ERIS.W / 2, 60, 'MISSION COMPLETE', 32, '#ffe07a');
    uiText(this, ERIS.W / 2, 100, this.d.spec.name, 16, '#ff70c0');
    const s = this.d.stats || { kills: 0, rescued: 0, vehicles: 0 };
    const lines = [
      ['INIMIGOS DESTRUÍDOS', s.kills, s.kills * 100],
      ['PAPAS RESGATADOS', s.rescued, s.rescued * 1000],
      ['VEÍCULOS', s.vehicles, s.vehicles * 2000],
      ['BÔNUS DE MISSÃO', 1, 20000],
    ];
    let y = 160;
    lines.forEach(L => {
      this.add.text(220, y, L[0], { fontFamily: 'monospace', fontSize: 14, color: '#d0d0d0' });
      this.add.text(700, y, String(L[2]), { fontFamily: 'monospace', fontSize: 14, color: '#ffe07a' }).setOrigin(1, 0);
      y += 32;
    });
    uiText(this, ERIS.W / 2, 340, 'SCORE  ' + String(this.d.score).padStart(6, '0'), 20);
    const P = this.registry.get('progress');
    localStorage.setItem('eris_slug_save', JSON.stringify(P));
    fetch('/api/score', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ score: P.score, name: 'ERIS' }) }).catch(() => {});
    const next = this.d.mission >= 5 ? 'Ending' : 'Briefing';
    const arg = this.d.mission >= 5 ? {} : { mission: this.d.mission + 1 };
    const go = uiText(this, ERIS.W / 2, 460, this.d.mission >= 5 ? 'TOQUE NA TELA OU Z  ·  O DEPOIS' : 'TOQUE NA TELA OU Z  ·  PRÓXIMA MISSÃO', 16);
    this.tweens.add({ targets: go, alpha: 0.25, yoyo: true, repeat: -1, duration: 400 });
    go.setInteractive({ useHandCursor: true });
    go.on('pointerdown', () => this.scene.start(next, arg));
    this.input.keyboard.once('keydown-Z', () => this.scene.start(next, arg));
    this.input.keyboard.once('keydown-ENTER', () => this.scene.start(next, arg));
    this.input.once('pointerdown', () => this.scene.start(next, arg));
  }
}

class ContinueScene extends Phaser.Scene {
  constructor() { super('Continue'); }
  init(d) { this.play = d.play; this.n = d.continues; this.count = 10; this.done = false; }
  create() {
    this.add.rectangle(0, 0, ERIS.W, ERIS.H, 0x000000, 0.65).setOrigin(0).setScrollFactor(0);
    uiText(this, ERIS.W / 2, 160, 'CONTINUE?', 38, '#ff4050').setScrollFactor(0);
    this.num = uiText(this, ERIS.W / 2, 230, '10', 64, '#ffe07a').setScrollFactor(0);

    const yesBtn = uiText(this, ERIS.W / 2 - 130, 320, '[ CONTINUAR ]', 20, '#40ff80').setScrollFactor(0);
    yesBtn.setInteractive({ useHandCursor: true });
    yesBtn.on('pointerdown', () => this._yes());

    const noBtn = uiText(this, ERIS.W / 2 + 130, 320, '[ DESISTIR ]', 20, '#ff6070').setScrollFactor(0);
    noBtn.setInteractive({ useHandCursor: true });
    noBtn.on('pointerdown', () => this._no());

    uiText(this, ERIS.W / 2, 380, 'Toque em CONTINUAR / Z para sim, DESISTIR / ESC para não · restam ' + this.n, 12, '#d0d0d0').setScrollFactor(0);
    this.timer = this.time.addEvent({ delay: 1000, repeat: 9, callback: () => { this.count--; this.num.setText(String(this.count)); if (this.count <= 0) this._no(); } });
    this.input.keyboard.once('keydown-Z', () => this._yes());
    this.input.keyboard.once('keydown-ENTER', () => this._yes());
    this.input.keyboard.once('keydown-ESC', () => this._no());
  }
  _yes() { if (this.done) return; this.done = true; if (this.timer) this.timer.remove(false); this.scene.stop(); this.play.onContinue(true); }
  _no() { if (this.done) return; this.done = true; if (this.timer) this.timer.remove(false); this.scene.stop(); this.play.onContinue(false); }
}

class GameOverScene extends Phaser.Scene {
  constructor() { super('GameOver'); }
  init(d) { this.score = d.score || 0; }
  create() {
    RetroAudio.setSong('title');
    this.add.rectangle(0, 0, ERIS.W, ERIS.H, 0x100010).setOrigin(0);
    uiText(this, ERIS.W / 2, 180, 'GAME OVER', 48, '#ff4050');
    uiText(this, ERIS.W / 2, 250, 'Greyface sorri. A pineal se fecha.', 14, '#a090b0');
    uiText(this, ERIS.W / 2, 300, 'SCORE  ' + String(this.score).padStart(6, '0'), 18);
    const go = uiText(this, ERIS.W / 2, 420, 'TOQUE NA TELA OU Z  ·  MENU', 16);
    go.setInteractive({ useHandCursor: true });
    go.on('pointerdown', () => this.scene.start('Menu'));
    this.input.keyboard.once('keydown-Z', () => this.scene.start('Menu'));
    this.input.keyboard.once('keydown-ENTER', () => this.scene.start('Menu'));
    this.input.once('pointerdown', () => this.scene.start('Menu'));
  }
}

class EndingScene extends Phaser.Scene {
  constructor() { super('Ending'); }
  create() {
    RetroAudio.setSong('title');
    this.add.image(ERIS.W / 2, ERIS.H / 2, 'title_art').setDisplaySize(ERIS.W, ERIS.H).setAlpha(0.5);
    this.add.rectangle(0, 0, ERIS.W, ERIS.H, 0x100018, 0.5).setOrigin(0);
    const lines = [
      'O Sagrado Chao se reconstitui.',
      'Greyface dissolve-se em formulários em branco.',
      'Eris morde a maçã dourada. KALLISTI.',
      '',
      'Todo homem, mulher e criança',
      'neste planeta é um Papa.',
      '',
      'Cinco toneladas de linho.',
      'Hail Eris. All hail Discordia.',
    ];
    lines.forEach((l, i) => uiText(this, ERIS.W / 2, 80 + i * 32, l, 16, i > 6 ? '#ffe07a' : '#f0e8ff'));
    const P = this.registry.get('progress');
    uiText(this, ERIS.W / 2, 430, 'SCORE FINAL  ' + String(P.score).padStart(6, '0'), 18);
    const go = uiText(this, ERIS.W / 2, 490, 'TOQUE NA TELA OU Z  ·  CRÉDITOS', 14);
    go.setInteractive({ useHandCursor: true });
    go.on('pointerdown', () => this.scene.start('Credits'));
    this.input.keyboard.once('keydown-Z', () => this.scene.start('Credits'));
    this.input.once('pointerdown', () => this.scene.start('Credits'));
  }
}

class CreditsScene extends Phaser.Scene {
  constructor() { super('Credits'); }
  create() {
    this.add.rectangle(0, 0, ERIS.W, ERIS.H, 0x100018).setOrigin(0);
    const lines = [
      'ERIS SLUG: PRINCIPIA DISCORDIA',
      '',
      'Estrutura inspirada em Metal Slug 5',
      'Tema, lore e simbologia: Discordianismo',
      '',
      'Protagonista  ·  ERIS',
      'Inimigos  ·  MIB, Ninja, Alien, Robot, Viper,',
      'Freddy, Jason, McJoker, TV-Man, Vodoo',
      'Chefes  ·  Gollen, TV-Man, Cyber-01, Cthulhu, Dark Spirit',
      '',
      'Python + Phaser 3 (WebGL / Canvas)',
      'Áudio sintetizado em tempo real',
      '',
      'Não há deusa além de Eris.',
      'HAIL ERIS  ·  KALLISTI',
    ];
    lines.forEach((l, i) => uiText(this, ERIS.W / 2, 40 + i * 26, l, i === 0 ? 20 : 13, i === 0 ? '#ffe07a' : '#d0c8e0'));
    const go = uiText(this, ERIS.W / 2, 490, 'TOQUE NA TELA PARA RETORNAR AO MENU', 13, '#ffe07a');
    go.setInteractive({ useHandCursor: true });
    go.on('pointerdown', () => this.scene.start('Menu'));
    this.input.keyboard.once('keydown-ESC', () => this.scene.start('Menu'));
    this.input.keyboard.once('keydown-Z', () => this.scene.start('Menu'));
    this.input.keyboard.once('keydown-ENTER', () => this.scene.start('Menu'));
    this.input.once('pointerdown', () => this.scene.start('Menu'));
  }
}
