/* ERIS SLUG — run-and-gun core (perf + Metal Slug feel) */
const FX_CAP = 22;
const BULLET_CAP = 40;
const EBU_CAP = 30;

function boom(scene, x, y, scale = 1, shake = 0.008) {
  scene._fx = (scene._fx || 0) + 1;
  if (scene._fx > FX_CAP) { scene._fx--; return; }
  const s = scene.add.sprite(x, y, 'boom_0').setScale(0.85 * scale).setDepth(20);
  s.play('boom');
  s.on('animationcomplete', () => { s.destroy(); scene._fx = Math.max(0, scene._fx - 1); });
  const n = scene._fx > 12 ? 2 : 4;
  for (let i = 0; i < n; i++) {
    const p = scene.add.image(x, y, 'apple_small').setScale(0.28).setDepth(21);
    scene.tweens.add({
      targets: p,
      x: x + Phaser.Math.Between(-50, 50) * scale,
      y: y + Phaser.Math.Between(-70, 20) * scale,
      alpha: 0, duration: 260,
      onComplete: () => p.destroy(),
    });
  }
  const now = scene.time.now;
  if (scene.registry.get('progress').shake !== false && now - (scene._lastShake || 0) > 90) {
    scene._lastShake = now;
    scene.cameras.main.shake(90, Math.min(0.012, shake * scale));
  }
  if (now - (scene._lastBoomSnd || 0) > 50) {
    scene._lastBoomSnd = now;
    RetroAudio.play('boom');
  }
}

function popup(scene, x, y, text, color = '#ffe07a') {
  const t = scene.add.text(x, y, text, {
    fontFamily: 'monospace', fontSize: 13, color, stroke: '#000', strokeThickness: 4,
  }).setOrigin(0.5).setDepth(30);
  scene.tweens.add({ targets: t, y: y - 36, alpha: 0, duration: 520, onComplete: () => t.destroy() });
}

function buildLayout(spec) {
  const gy = 470;
  const L = {
    groundY: gy, width: spec.width, platforms: [], spawns: [], crates: [],
    barrels: [], prisoners: [], vehicles: [], pits: [], checks: [],
    waterFrom: spec.water ? spec.width * 0.42 : 99999,
  };
  if (spec.vehicleAt) L.vehicles.push({ x: spec.vehicleAt, y: gy });
  L.checks.push(180);
  L.crates.push({ x: 380, y: gy, loot: 'hmg' });
  const sec = 560;
  const nsec = Math.floor((spec.width - 1500) / sec);
  for (let i = 0; i < nsec; i++) {
    const x0 = 880 + i * sec;
    const kind = i % 7;
    const roster = spec.roster;
    const pick = () => roster[Math.floor(hash23(spec.id * 90 + i + 3) * roster.length)];
    if (kind === 0) {
      for (let k = 0; k < 4; k++) L.spawns.push({ x: x0 + 30 + k * 95, y: gy, type: pick() });
      L.barrels.push({ x: x0 + 220, y: gy });
      if (i > 1) L.spawns.push({ x: x0 + 480, y: gy, type: 'turret' });
    } else if (kind === 1) {
      L.platforms.push({ x: x0 + 80, y: gy - 108, w: 200 });
      L.platforms.push({ x: x0 + 300, y: gy - 188, w: 170 });
      L.spawns.push({ x: x0 + 120, y: gy - 108, type: pick() });
      L.spawns.push({ x: x0 + 340, y: gy - 188, type: pick() });
      L.crates.push({ x: x0 + 360, y: gy - 188, loot: WEAPON_DROP[i % WEAPON_DROP.length] });
    } else if (kind === 2) {
      L.crates.push({ x: x0 + 50, y: gy, loot: 'random' });
      L.barrels.push({ x: x0 + 130, y: gy });
      L.barrels.push({ x: x0 + 190, y: gy });
      L.prisoners.push({ x: x0 + 280, y: gy });
      L.spawns.push({ x: x0 + 400, y: gy, type: pick() });
      L.spawns.push({ x: x0 + 490, y: gy, type: spec.heavies[i % spec.heavies.length] });
    } else if (kind === 3) {
      L.pits.push({ x: x0 + 90, w: 150 });
      L.platforms.push({ x: x0 + 110, y: gy - 96, w: 130 });
      L.platforms.push({ x: x0 + 300, y: gy - 74, w: 150 });
      L.spawns.push({ x: x0 + 330, y: gy - 74, type: pick() });
    } else if (kind === 4) {
      for (let k = 0; k < 3; k++) L.spawns.push({ x: x0 + 50 + k * 140, y: gy, type: pick() });
      L.spawns.push({ x: x0 + 220, y: gy - 200, type: 'alien', fly: true });
      L.prisoners.push({ x: x0 + 500, y: gy });
      L.checks.push(x0 + 40);
    } else if (kind === 5) {
      L.platforms.push({ x: x0 + 70, y: gy - 128, w: 230 });
      L.crates.push({ x: x0 + 100, y: gy - 128, loot: i % 2 ? 'bomb' : 'food' });
      L.spawns.push({ x: x0 + 180, y: gy - 128, type: spec.heavies[0] });
      L.spawns.push({ x: x0 + 430, y: gy, type: pick() });
    } else {
      L.spawns.push({ x: x0 + 50, y: gy, type: pick() });
      L.spawns.push({ x: x0 + 160, y: gy, type: pick() });
      L.spawns.push({ x: x0 + 340, y: gy, type: spec.heavies[i % spec.heavies.length] });
      L.barrels.push({ x: x0 + 240, y: gy });
    }
    if (spec.mid && Math.abs(x0 - spec.mid.x) < sec / 2) {
      L.spawns.push({ x: spec.mid.x, y: gy, type: spec.mid.type, elite: true });
    }
  }
  L.spawns.sort((a, b) => a.x - b.x);
  L.bossX = spec.width - 980;
  L.pits = L.pits.filter(p => p.x < L.bossX - 500);
  L.checks.push(L.bossX - 420);
  return L;
}

class PlayScene extends Phaser.Scene {
  constructor() { super('Play'); }

  init(data) {
    this.mid = data.mission || this.registry.get('progress').mission || 1;
    this.spec = MISSIONS[this.mid - 1];
    this.diff = DIFFICULTY[this.registry.get('progress').difficulty] || DIFFICULTY.normal;
  }

  create() {
    const P = this.registry.get('progress');
    const spec = this.spec;
    this.layout = buildLayout(spec);
    this.worldW = spec.width;
    this.gy = this.layout.groundY;
    this._fx = 0;
    this.physics.world.setBounds(0, 0, this.worldW, ERIS.H + 80);
    this.cameras.main.setBounds(0, 0, this.worldW, ERIS.H);
    this.cameras.main.setBackgroundColor(spec.sky);
    RetroAudio.setSong(spec.music);

    this.skyTile = this.add.tileSprite(0, 0, ERIS.W, ERIS.H, `sky${spec.id}`)
      .setOrigin(0, 0).setScrollFactor(0).setDepth(-30).setAlpha(0.95);
    this.envTile = this.add.tileSprite(0, 0, ERIS.W, ERIS.H, spec.env)
      .setOrigin(0, 0).setScrollFactor(0).setDepth(-20);

    this.groundGroup = this.physics.add.staticGroup();
    this.platGroup = this.physics.add.staticGroup();
    this._carveGround();

    this.bullets = this.physics.add.group({ allowGravity: false, maxSize: BULLET_CAP });
    this.ebullets = this.physics.add.group({ allowGravity: false, maxSize: EBU_CAP });
    this.grenades = this.physics.add.group();
    this.enemies = this.physics.add.group();
    this.crates = this.physics.add.group();
    this.barrels = this.physics.add.group();
    this.items = this.physics.add.group();
    this.prisoners = this.physics.add.group();

    this.spawnI = 0;
    this.bossOn = false;
    this.bossDead = false;
    this.iframes = 1800;
    this.meleeCD = 0;
    this.shootCD = 0;
    this.grenCD = 0;
    this.shootFlash = 0;
    this.coyote = 0;
    this.jBuf = 0;
    this.facing = 1;
    this.camLook = 80;
    this.aim = { x: 1, y: 0 };
    this.inSlug = false;
    this.slugHP = 14;
    this.checkpoint = 160;
    this.stats = { kills: 0, rescued: 0, vehicles: 0 };
    this.weapon = WEAPONS[P.weapon] || WEAPONS.pistol;
    this.ammo = this.weapon.id === 'pistol' ? Infinity : (P.ammo || this.weapon.ammo);
    this.bombs = P.bombs || 10;
    this.hp = this.diff.hp;
    this.dead = false;
    this.paused = false;

    this.player = this.physics.add.sprite(140, this.gy - 2, 'eris_hero_idle');
    this.player.setOrigin(0.5, 1).setScale(0.56).setDepth(8);
    this.player.body.setSize(46, 108).setOffset(105, 148);
    this.player.setCollideWorldBounds(true);
    this.player.setMaxVelocity(340, 860);
    this.player.setDrag(0, 0);
    this.shadow = this.add.ellipse(140, this.gy, 46, 12, 0x000000, 0.28).setDepth(4);

    this.physics.add.collider(this.player, this.groundGroup);
    this.physics.add.collider(this.player, this.platGroup, null, (p, plat) => {
      if (this.keys.down.isDown) return false;
      return p.body.velocity.y >= 0 && p.y <= plat.body.top + 8;
    });
    this.physics.add.collider(this.enemies, this.groundGroup);
    this.physics.add.collider(this.enemies, this.platGroup);
    this.physics.add.collider(this.crates, this.groundGroup);
    this.physics.add.collider(this.barrels, this.groundGroup);
    this.physics.add.collider(this.prisoners, this.groundGroup);
    this.physics.add.collider(this.items, this.groundGroup);
    this.physics.add.collider(this.grenades, this.groundGroup, (g) => this._explodeGrenade(g));
    this.physics.add.collider(this.bullets, this.groundGroup, null, (b) => !!(b.ground || b.drop));

    this.physics.add.overlap(this.bullets, this.enemies, (b, e) => this._hitEnemy(b, e));
    this.physics.add.overlap(this.bullets, this.crates, (b, c) => this._breakCrate(b, c));
    this.physics.add.overlap(this.bullets, this.barrels, (b, c) => this._breakBarrel(b, c));
    this.physics.add.overlap(this.player, this.ebullets, (p, b) => this._hurt(b));
    this.physics.add.overlap(this.player, this.enemies, (p, e) => { if (e && !e.dying) this._hurt(e); });
    this.physics.add.overlap(this.player, this.items, (p, it) => this._pickup(it));
    this.physics.add.overlap(this.player, this.prisoners, (p, r) => this._rescue(r));
    this.physics.add.overlap(this.bullets, this.prisoners, (b, r) => { if (b.friendly) this._rescue(r); });

    this._placeStatics();
    this._makeHUD();
    this._bindInput();
    this._initWeather();

    this.cameras.main.startFollow(this.player, true, 0.16, 0.1);
    this.cameras.main.setFollowOffset(-80, 70);
    this.cameras.main.setDeadzone(40, 24);

    const title = this.add.text(ERIS.W / 2, 86, spec.name, {
      fontFamily: 'monospace', fontSize: 26, color: '#f0be28', stroke: '#000', strokeThickness: 6,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(40);
    const sub = this.add.text(ERIS.W / 2, 116, spec.subtitle, {
      fontFamily: 'monospace', fontSize: 13, color: '#ff70c0', stroke: '#000', strokeThickness: 4,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(40);
    this.time.delayedCall(2000, () => { title.destroy(); sub.destroy(); });
    this._maybeAutotest();
  }

  _maybeAutotest() {
    if (typeof location === 'undefined' || !/[?&]autotest=boss/.test(location.search)) return;
    this.time.delayedCall(400, () => {
      const report = (ok, extra) => {
        const msg = (ok ? 'AUTOTEST_PASS' : 'AUTOTEST_FAIL') + (extra ? ' ' + extra : '');
        document.title = msg;
        window.__erisAutotest = { ok, extra, bossOn: this.bossOn, hasBoss: !!(this.boss && this.boss.active) };
        const el = document.getElementById('autotest-result') || document.createElement('pre');
        el.id = 'autotest-result';
        el.textContent = JSON.stringify(window.__erisAutotest);
        document.body.appendChild(el);
      };
      try {
        this.iframes = 99999;
        this.player.x = this.layout.bossX;
        this._startBoss();
        for (let i = 0; i < 10; i++) this._shockwave(this.player.x + 180, this.gy - 24, 1);
        this.ebullets.getChildren().slice().forEach(b => { b.life = 0; });
        this._updateProjectiles(2500);
        for (let i = 0; i < 10; i++) {
          this._fireEbullet(this.player.x + 80, this.gy - 50, 'bullet_rock', -220, -180, 1800, { gravity: true });
        }
        this._updateProjectiles(16);
        if (!this.boss || !this.boss.active || !this.boss.isBoss) {
          report(false, 'boss_missing');
          return;
        }
        const hp0 = this.boss.hp;
        this._damage(this.boss, 40);
        if (this.boss.hp >= hp0) { report(false, 'boss_not_damaged'); return; }
        report(true, 'hp=' + Math.floor(this.boss.hp) + ' bullets=' + this.ebullets.countActive(true));
      } catch (err) {
        report(false, String(err && err.stack || err));
      }
    });
  }

  _carveGround() {
    const gy = this.gy;
    const pits = this.layout.pits.slice().sort((a, b) => a.x - b.x);
    let x = 0;
    const segs = [];
    pits.forEach(p => {
      if (p.x > x) segs.push({ x, w: p.x - x });
      x = p.x + p.w;
    });
    if (x < this.worldW) segs.push({ x, w: this.worldW - x });

    this.groundVis = this.add.tileSprite(0, gy, this.worldW, 28, this.spec.tile)
      .setOrigin(0, 0).setDepth(2);
    this.add.rectangle(0, gy + 28, this.worldW, ERIS.H - gy, 0x141018).setOrigin(0, 0).setDepth(2);
    this.add.rectangle(0, gy, this.worldW, 3, 0xf0be28, 0.55).setOrigin(0, 0).setDepth(3);

    segs.forEach(s => {
      const body = this.add.rectangle(s.x + s.w / 2, gy + 36, s.w, 72, 0x000000, 0);
      this.physics.add.existing(body, true);
      this.groundGroup.add(body);
    });
    pits.forEach(p => {
      this.add.rectangle(p.x, gy, p.w, ERIS.H - gy + 40, 0x050208, 0.85).setOrigin(0, 0).setDepth(1);
    });
    this.layout.platforms.forEach(p => {
      const vis = this.add.tileSprite(p.x, p.y, p.w, 16, this.spec.plat).setOrigin(0, 0).setDepth(3);
      const body = this.add.rectangle(p.x + p.w / 2, p.y + 8, p.w, 16, 0x000000, 0);
      this.physics.add.existing(body, true);
      this.platGroup.add(body);
      vis._ref = body;
    });
    if (this.spec.water) {
      this.waterTile = this.add.tileSprite(0, gy - 6, ERIS.W, 40, 'water')
        .setOrigin(0, 1).setScrollFactor(0).setDepth(6).setAlpha(0.45);
    }
  }

  _placeStatics() {
    const gy = this.gy;
    this.layout.crates.forEach(c => {
      const s = this.physics.add.sprite(c.x, c.y, 'crate').setOrigin(0.5, 1).setScale(0.34).setDepth(5);
      s.body.setSize(160, 130).setOffset(48, 90);
      s.loot = c.loot; s.hp = 8;
      this.crates.add(s);
    });
    this.layout.barrels.forEach(c => {
      const s = this.physics.add.sprite(c.x, c.y, 'barrel').setOrigin(0.5, 1).setScale(0.28).setDepth(5);
      s.body.setSize(120, 160).setOffset(68, 70);
      s.hp = 6; s.blown = false;
      this.barrels.add(s);
    });
    this.layout.prisoners.forEach(c => {
      const s = this.physics.add.sprite(c.x, c.y, 'prisoner').setOrigin(0.5, 1).setScale(0.38).setDepth(5);
      s.body.setSize(80, 140).setOffset(88, 90);
      s.rescued = false;
      this.prisoners.add(s);
    });
    this.layout.vehicles.forEach(v => {
      this.slug = this.physics.add.sprite(v.x, v.y, 'slug').setOrigin(0.5, 1).setScale(0.48).setDepth(7);
      this.slug.body.setSize(360, 130).setOffset(76, 110);
      this.physics.add.collider(this.slug, this.groundGroup);
      this.physics.add.overlap(this.player, this.slug, () => {
        if (!this.inSlug && !this.dead && this.keys.down.isDown) this._enterSlug();
      });
    });
  }

  _bindInput() {
    this.keys = this.input.keyboard.addKeys({
      left: 'LEFT', right: 'RIGHT', up: 'UP', down: 'DOWN',
      a: 'A', d: 'D', w: 'W', s: 'S',
      shoot: 'Z', shoot2: 'J', gren: 'X', gren2: 'K',
      jump: 'SPACE', jump2: 'C', pause: 'P', esc: 'ESC',
    });
    this.hold = { l: false, r: false, u: false, d: false, sh: false, jp: false, gr: false };
    this.input.keyboard.on('keydown', (e) => {
      const c = e.code || e.key;
      if (c === 'ArrowLeft' || c === 'KeyA' || c === 'a' || c === 'A') this.hold.l = true;
      if (c === 'ArrowRight' || c === 'KeyD' || c === 'd' || c === 'D') this.hold.r = true;
      if (c === 'ArrowUp' || c === 'KeyW' || c === 'w' || c === 'W') this.hold.u = true;
      if (c === 'ArrowDown' || c === 'KeyS' || c === 's' || c === 'S') this.hold.d = true;
      if (c === 'KeyZ' || c === 'KeyJ' || c === 'z' || c === 'j') this.hold.sh = true;
      if (c === 'Space' || c === 'KeyC' || c === ' ') { if (!this.hold.jp) this.hold.jpPress = true; this.hold.jp = true; }
      if (c === 'KeyX' || c === 'KeyK' || c === 'x' || c === 'k') { if (!this.hold.gr) this.hold.grPress = true; this.hold.gr = true; }
    });
    this.input.keyboard.on('keyup', (e) => {
      const c = e.code || e.key;
      if (c === 'ArrowLeft' || c === 'KeyA' || c === 'a' || c === 'A') this.hold.l = false;
      if (c === 'ArrowRight' || c === 'KeyD' || c === 'd' || c === 'D') this.hold.r = false;
      if (c === 'ArrowUp' || c === 'KeyW' || c === 'w' || c === 'W') this.hold.u = false;
      if (c === 'ArrowDown' || c === 'KeyS' || c === 's' || c === 'S') this.hold.d = false;
      if (c === 'KeyZ' || c === 'KeyJ' || c === 'z' || c === 'j') this.hold.sh = false;
      if (c === 'Space' || c === 'KeyC' || c === ' ') this.hold.jp = false;
      if (c === 'KeyX' || c === 'KeyK' || c === 'x' || c === 'k') this.hold.gr = false;
    });
    this.input.keyboard.on('keydown-P', () => this._pause());
    this.input.keyboard.on('keydown-ESC', () => this._pause());
  }

  _makeHUD() {
    this.hud = this.add.container(0, 0).setScrollFactor(0).setDepth(50);
    const bg = this.add.rectangle(0, 0, ERIS.W, 38, 0x080410, 0.78).setOrigin(0);
    this.add.rectangle(0, 38, ERIS.W, 2, 0xf0be28, 0.7).setOrigin(0).setScrollFactor(0).setDepth(50);
    this.scoreT = this.add.text(18, 10, 'SCORE 000000', { fontFamily: 'monospace', fontSize: 14, color: '#ffe07a' });
    this.hiT = this.add.text(200, 10, 'HI 000000', { fontFamily: 'monospace', fontSize: 12, color: '#c0a040' });
    this.wepT = this.add.text(350, 10, 'PISTOL ∞', { fontFamily: 'monospace', fontSize: 13, color: '#7af0ff' });
    this.bombT = this.add.text(560, 10, '● 10', { fontFamily: 'monospace', fontSize: 13, color: '#f0be28' });
    this.lifeT = this.add.text(650, 10, 'ERIS ×3', { fontFamily: 'monospace', fontSize: 13, color: '#ff70c0' });
    this.misT = this.add.text(800, 10, this.spec.code, { fontFamily: 'monospace', fontSize: 13, color: '#ffffff' });
    this.bossBar = this.add.rectangle(ERIS.W / 2, 52, 420, 12, 0x401018).setScrollFactor(0).setDepth(51).setVisible(false);
    this.bossFill = this.add.rectangle(ERIS.W / 2 - 208, 52, 416, 8, 0xff4050).setOrigin(0, 0.5).setScrollFactor(0).setDepth(52).setVisible(false);
    this.bossName = this.add.text(ERIS.W / 2, 38, '', { fontFamily: 'monospace', fontSize: 11, color: '#ffd0d0' }).setOrigin(0.5).setScrollFactor(0).setDepth(52).setVisible(false);
    this.hud.add([bg, this.scoreT, this.hiT, this.wepT, this.bombT, this.lifeT, this.misT]);
  }

  _initWeather() {
    this.wbits = [];
    const key = this.spec.weather === 'paper' ? 'penta' : 'apple_small';
    for (let i = 0; i < 10; i++) {
      const p = this.add.image(Math.random() * ERIS.W, Math.random() * ERIS.H, key)
        .setScrollFactor(0).setDepth(1).setAlpha(0.4).setScale(0.22 + Math.random() * 0.18);
      p.spd = 40 + Math.random() * 50;
      p.drift = (Math.random() - 0.3) * 30;
      this.wbits.push(p);
    }
  }

  update(t, dt) {
    if (this.paused) return;
    dt = Math.min(dt, 28);
    this.iframes = Math.max(0, this.iframes - dt);
    this.meleeCD = Math.max(0, this.meleeCD - dt);
    this.shootCD = Math.max(0, this.shootCD - dt);
    this.grenCD = Math.max(0, this.grenCD - dt);
    this.shootFlash = Math.max(0, this.shootFlash - dt);
    this.coyote = Math.max(0, this.coyote - dt);
    this.jBuf = Math.max(0, this.jBuf - dt);

    const camX = this.cameras.main.scrollX;
    this.skyTile.tilePositionX = camX * 0.12;
    this.envTile.tilePositionX = camX * 0.38;
    if (this.waterTile) {
      this.waterTile.tilePositionX = camX * 0.7;
      this.waterTile.visible = camX + ERIS.W > this.layout.waterFrom;
    }
    this.wbits.forEach(p => {
      p.y += p.spd * dt / 1000;
      p.x += p.drift * dt / 1000;
      p.rotation += dt * 0.001;
      if (p.y > ERIS.H + 12) { p.y = -12; p.x = Math.random() * ERIS.W; }
    });

    this._spawnAhead();
    if (!this.dead) this._control(dt);
    this._updateEnemies(dt);
    this._updateBoss(dt);
    this._updateProjectiles(dt);
    this._waterPhysics();
    this._hud();

    this.shadow.setPosition(this.player.x, this.gy + 2);
    this.shadow.setScale(this.player.body.blocked.down ? 1 : 0.55);
    this.shadow.setVisible(!this.dead && !this.inSlug);

    this.camLook += (this.facing * 100 - this.camLook) * 0.07;
    this.cameras.main.setFollowOffset(-this.camLook, 70);

    if (!this.dead && this.player.y > ERIS.H + 60) this._die();
    if (!this.bossOn && this.player.x > this.layout.bossX - 20) this._startBoss();
  }

  _control() {
    const k = this.keys;
    const h = this.hold;
    const left = h.l || k.left.isDown || k.a.isDown;
    const right = h.r || k.right.isDown || k.d.isDown;
    const up = h.u || k.up.isDown || k.w.isDown;
    const down = h.d || k.down.isDown || k.s.isDown;
    const jumpDown = h.jpPress || Phaser.Input.Keyboard.JustDown(k.jump) || Phaser.Input.Keyboard.JustDown(k.jump2);
    h.jpPress = false;
    const shoot = h.sh || k.shoot.isDown || k.shoot2.isDown;
    const gren = h.grPress || Phaser.Input.Keyboard.JustDown(k.gren) || Phaser.Input.Keyboard.JustDown(k.gren2);
    h.grPress = false;
    const p = this.player;
    const grounded = p.body.blocked.down || p.body.touching.down;
    const crouch = down && grounded && !this.inSlug && !up;

    if (this.inSlug) { this._driveSlug(left, right, up, jumpDown, shoot, gren); return; }

    if (grounded) this.coyote = 110;
    if (jumpDown) this.jBuf = 120;

    if (left && !right) { this.facing = -1; p.setFlipX(true); }
    else if (right && !left) { this.facing = 1; p.setFlipX(false); }

    this.aim.x = left && !right ? -1 : right && !left ? 1 : (up || (down && !grounded) ? 0 : this.facing);
    this.aim.y = up ? -1 : (down && !grounded ? 1 : 0);
    if (this.aim.x === 0 && this.aim.y === 0) this.aim.x = this.facing;

    const spd = crouch ? 95 : 258;
    if (left && !right) p.setVelocityX(grounded ? -spd : -spd * 0.88);
    else if (right && !left) p.setVelocityX(grounded ? spd : spd * 0.88);
    else p.setVelocityX(0);

    if (this.jBuf > 0 && this.coyote > 0) {
      p.setVelocityY(-555);
      this.coyote = 0; this.jBuf = 0;
      RetroAudio.play('jump');
    }

    if (shoot) this._tryShoot();
    if (gren) this._tryGrenade();
    const near = this._nearestEnemy(46);
    if (shoot && near && this.meleeCD <= 0) this._melee(near);

    const moving = Math.abs(p.body.velocity.x) > 20;
    if (!grounded) {
      p.anims.stop();
      p.setTexture('eris_hero_jump');
    } else if (crouch) {
      p.anims.stop();
      p.setTexture('eris_hero_crouch');
    } else if (this.shootFlash > 0 && !moving) {
      p.anims.stop();
      p.setTexture('eris_hero_shoot');
    } else if (moving) {
      p.anims.play('eris_hero_run', true);
    } else {
      p.anims.stop();
      p.setTexture('eris_hero_idle');
    }
  }

  _driveSlug(left, right, up, jump, shoot, gren) {
    const s = this.slug;
    if (!s || !s.active) { this.inSlug = false; this.player.setVisible(true); return; }
    if (left) { s.setVelocityX(-190); s.setFlipX(true); this.facing = -1; }
    else if (right) { s.setVelocityX(190); s.setFlipX(false); this.facing = 1; }
    else s.setVelocityX(0);
    if (jump && (s.body.blocked.down || s.body.touching.down)) s.setVelocityY(-440);
    this.player.x = s.x; this.player.y = s.y;
    this.aim.x = this.facing; this.aim.y = up ? -0.45 : 0;
    if (shoot) { this.weapon = WEAPONS.hmg; this.ammo = 999; this._tryShoot(); }
    if (gren && this.grenCD <= 0) {
      this.grenCD = 380;
      this._spawnBullet(WEAPONS.rocket, s.x + this.facing * 80, s.y - 48);
      RetroAudio.play('rocket');
    }
    if (this.keys.down.isDown && jump) this._exitSlug();
  }

  _enterSlug() {
    this.inSlug = true; this.player.setVisible(false);
    RetroAudio.play('vehicle'); popup(this, this.slug.x, this.slug.y - 70, 'APPLE SLUG!');
  }
  _exitSlug(explode) {
    this.inSlug = false; this.player.setVisible(true);
    if (this.slug) {
      this.player.x = this.slug.x; this.player.y = this.slug.y - 10;
      if (explode) { boom(this, this.slug.x, this.slug.y - 40, 1.3, 0.016); this.slug.destroy(); this.slug = null; this.stats.vehicles++; }
    }
    this.weapon = WEAPONS.pistol; this.ammo = Infinity;
  }

  _tryShoot() {
    if (this.shootCD > 0) return;
    const w = this.weapon;
    if (this.ammo <= 0) { this.weapon = WEAPONS.pistol; this.ammo = Infinity; RetroAudio.play('empty'); return; }
    this.shootCD = w.rate;
    this.shootFlash = 90;
    const originX = this.player.x + this.facing * 30;
    const originY = this.player.y - (this.keys.down.isDown ? 28 : 52);
    if (this.bullets.countActive(true) >= BULLET_CAP - w.count) return;
    for (let i = 0; i < w.count; i++) this._spawnBullet(w, originX, originY, i);
    if (w.id !== 'pistol') this.ammo--;
    RetroAudio.play(w.sfx);
    const mz = this.add.image(originX + this.facing * 14, originY, 'muzzle')
      .setScale(0.9).setFlipX(this.facing < 0).setDepth(12);
    this.tweens.add({ targets: mz, alpha: 0, duration: 50, onComplete: () => mz.destroy() });
  }

  _spawnBullet(w, x, y, i = 0) {
    const ang = Math.atan2(this.aim.y, this.aim.x) + ((i - (w.count - 1) / 2) * w.spread * Math.PI / 180);
    const b = this.bullets.get(x, y, w.sprite);
    if (!b) return;
    b.setActive(true).setVisible(true);
    b.friendly = true; b.dmg = w.dmg; b.pierce = w.pierce || 0; b.explode = w.explode || 0; b.homing = !!w.homing;
    b.ground = !!w.ground; b.drop = !!w.drop;
    b.setScale(w.id === 'rocket' || w.id === 'lizard' ? 0.55 : 1).setDepth(11);
    if (w.id === 'lizard') b.setScale(0.42);
    if (b.body) {
      b.body.enable = true;
      b.body.allowGravity = !!(w.ground || w.drop);
    }
    if (w.drop) b.setVelocity(this.facing * 40, 220);
    else b.setVelocity(Math.cos(ang) * w.speed, w.ground ? -80 : Math.sin(ang) * w.speed);
    b.setFlipX(this.facing < 0);
    b.life = w.life;
    b.dir = this.facing;
  }

  _tryGrenade() {
    if (this.grenCD > 0 || this.bombs <= 0) return;
    this.grenCD = 340; this.bombs--;
    const g = this.grenades.create(this.player.x + this.facing * 18, this.player.y - 40, 'grenade');
    g.setVelocity(this.facing * 300, -300); g.setBounce(0.25); g.setDepth(12);
    g.life = 900;
    RetroAudio.play('grenade');
  }

  _explodeGrenade(g) {
    if (!g || !g.active) return;
    this._explodeAt(g.x, g.y, 55, false);
    g.destroy();
  }

  _explodeAt(x, y, dmg, chainBarrels) {
    boom(this, x, y, 0.85, 0.01);
    this.enemies.getChildren().forEach(e => {
      if (e.active && !e.dying && Phaser.Math.Distance.Between(x, y, e.x, e.y) < 80) this._damage(e, dmg);
    });
    if (chainBarrels) {
      this.barrels.getChildren().forEach(e => {
        if (e.active && !e.blown && Phaser.Math.Distance.Between(x, y, e.x, e.y) < 64) {
          this.time.delayedCall(70, () => { if (e.active) this._breakBarrel(null, e); });
        }
      });
    }
  }

  _melee(e) {
    this.meleeCD = 260;
    this._damage(e, 24);
    RetroAudio.play('melee');
    popup(this, e.x, e.y - 40, 'KALLISTI!');
  }

  _nearestEnemy(r) {
    let best = null, bd = r;
    this.enemies.getChildren().forEach(e => {
      if (!e.active || e.dying) return;
      const d = Phaser.Math.Distance.Between(this.player.x, this.player.y - 40, e.x, e.y - 40);
      if (d < bd) { bd = d; best = e; }
    });
    return best;
  }

  _spawnAhead() {
    if (this.bossOn) return;
    const camR = this.cameras.main.scrollX + ERIS.W + 60;
    const list = this.layout.spawns;
    while (this.spawnI < list.length && list[this.spawnI].x < camR) {
      this._spawnEnemy(list[this.spawnI]);
      this.spawnI++;
    }
  }

  _spawnEnemy(sp) {
    const def = ENEMIES[sp.type]; if (!def) return;
    if (!sp.force && this.enemies.countActive(true) > 22 && !sp.elite) return;
    const tex = def.sprite || `${sp.type}_idle_1`;
    const e = this.enemies.create(sp.x, sp.y, tex);
    if (def.sprite === 'turret') {
      e.setOrigin(0.5, 1).setScale(0.42).setDepth(6);
      e.body.setSize(180, 110).setOffset(58, 40);
    } else {
      e.setOrigin(0.5, 1).setScale(def.scale * 2.05).setDepth(6);
      e.body.setSize(50, 90).setOffset(39, 36);
    }
    e.etype = sp.type; e.def = def;
    e.hp = def.hp * this.diff.enemyHp * (sp.elite ? 2.4 : 1);
    e.maxhp = e.hp; e.ai = def.ai; e.shootT = 1400 + Math.random() * def.shoot;
    e.elite = !!sp.elite; e.dying = false;
    if (def.ai === 'flyer' || sp.fly) { e.body.allowGravity = false; e.y = sp.y - 90; e.baseY = e.y; }
    if (!def.sprite && this.anims.exists(`${sp.type}_idle`)) e.anims.play(`${sp.type}_idle`, true);
    if (sp.elite) { e.setTint(0xffd070); popup(this, e.x, e.y - 70, 'MID-BOSS', '#ff8080'); }
    return e;
  }

  _updateEnemies(dt) {
    const px = this.player.x;
    const left = this.cameras.main.scrollX - 160;
    this.enemies.getChildren().slice().forEach(e => {
      if (!e.active || e.dying || e.isBoss) return;
      if (!e.body) { e.destroy(); return; }
      if (e.x < left) { e.destroy(); return; }
      const def = e.def;
      const dir = Math.sign(px - e.x) || 1;
      e.setFlipX(dir < 0);
      const grounded = e.body.blocked.down || e.body.touching.down;
      const dist = Math.abs(px - e.x);
      switch (e.ai) {
        case 'walker':
        case 'grenadier':
          if (dist > 52) e.setVelocityX(dir * def.speed);
          else e.setVelocityX(0);
          if (grounded && dist > 52 && this.anims.exists(`${e.etype}_run`)) e.anims.play(`${e.etype}_run`, true);
          break;
        case 'jumper':
          if (dist > 48) e.setVelocityX(dir * def.speed);
          if (grounded && Math.random() < 0.012) e.setVelocityY(-400);
          break;
        case 'brute':
          e.setVelocityX(dir * def.speed * 0.75);
          break;
        case 'tank':
          e.setVelocityX(dir * def.speed);
          break;
        case 'turret':
          e.setVelocityX(0);
          break;
        case 'flyer':
          e.body.allowGravity = false;
          e.y = (e.baseY || e.y) + Math.sin(this.time.now / 380 + e.x) * 22;
          e.setVelocityX(dir * def.speed * 0.4);
          break;
        case 'teleport':
          if (Math.random() < 0.003) {
            e.x = px + (Math.random() < 0.5 ? -160 : 160);
            e.y = this.gy;
          }
          e.setVelocityX(dir * def.speed * 0.5);
          break;
      }
      e.shootT -= dt;
      if (e.shootT <= 0 && dist < def.range && dist > 40 && !this.dead && this.iframes <= 0) {
        e.shootT = def.shoot * this.diff.fire * (0.8 + Math.random() * 0.5);
        this._enemyShoot(e);
      }
    });
  }

  _fireEbullet(x, y, key, vx, vy, life, opts = {}) {
    if (this.ebullets.countActive(true) >= EBU_CAP) return null;
    let b = this.ebullets.get(x, y, key);
    if (b && (typeof b.setVelocity !== 'function' || !b.body)) {
      this.ebullets.remove(b, true, true);
      b = this.ebullets.get(x, y, key);
    }
    if (!b || typeof b.setVelocity !== 'function' || !b.body) return null;
    if (typeof b.setTexture === 'function' && key) b.setTexture(key);
    b.setActive(true).setVisible(true).setDepth(11).setScale(opts.scale || 1.05);
    b.body.enable = true;
    b.body.allowGravity = !!opts.gravity;
    b.setVelocity(vx, vy);
    b.life = life;
    b.homing = !!opts.homing;
    return b;
  }

  _recycleEbullet(b) {
    if (!b) return;
    if (typeof b.setVelocity !== 'function') {
      this.ebullets.remove(b, true, true);
      return;
    }
    this.ebullets.killAndHide(b);
    if (b.body) b.body.enable = false;
  }

  _enemyShoot(e) {
    const def = e.def;
    const ang = Math.atan2((this.player.y - 48) - (e.y - 40), this.player.x - e.x);
    const count = e.ai === 'grenadier' ? 2 : 1;
    for (let i = 0; i < count; i++) {
      const a = ang + (i - (count - 1) / 2) * 0.18;
      this._fireEbullet(e.x, e.y - 42, def.bullet, Math.cos(a) * def.bspeed, Math.sin(a) * def.bspeed, 1700, { homing: !!def.homing });
    }
  }

  _updateProjectiles(dt) {
    this.bullets.getChildren().forEach(b => {
      if (!b.active || !b.body) return;
      b.life = (b.life || 400) - dt;
      if (b.homing) {
        const t = this._nearestEnemy(520);
        if (t) {
          const ang = Math.atan2(t.y - 40 - b.y, t.x - b.x);
          b.body.velocity.x += Math.cos(ang) * 16;
          b.body.velocity.y += Math.sin(ang) * 16;
        }
      }
      if (b.ground && (b.body.blocked.down || b.body.touching.down)) {
        b.body.allowGravity = false;
        b.setVelocity((b.dir || 1) * 260, 0);
      }
      if (b.life <= 0 || b.x < this.cameras.main.scrollX - 50 || b.x > this.cameras.main.scrollX + ERIS.W + 50) {
        if (b.explode) this._explodeAt(b.x, b.y, b.explode, false);
        this.bullets.killAndHide(b); if (b.body) b.body.enable = false;
      }
    });
    this.ebullets.getChildren().slice().forEach(b => {
      if (!b.active) return;
      if (!b.body || typeof b.setVelocity !== 'function') { this._recycleEbullet(b); return; }
      b.life = (b.life || 1200) - dt;
      if (b.homing && this.player) {
        const ang = Math.atan2(this.player.y - 48 - b.y, this.player.x - b.x);
        b.body.velocity.x += Math.cos(ang) * 7;
        b.body.velocity.y += Math.sin(ang) * 7;
      }
      if (b.life <= 0 || b.x < this.cameras.main.scrollX - 80 || b.x > this.cameras.main.scrollX + ERIS.W + 80) {
        this._recycleEbullet(b);
      }
    });
    this.grenades.getChildren().forEach(g => {
      if (!g.active) return;
      g.life = (g.life || 900) - dt;
      if (g.life <= 0) this._explodeGrenade(g);
    });
  }

  _waterPhysics() {
    if (!this.spec.water) return;
    if (this.player.x > this.layout.waterFrom && this.player.y > 240) {
      this.player.body.setGravityY(-780);
      if ((this.keys.up.isDown || this.keys.w.isDown || this.keys.jump.isDown) && !this.dead) {
        this.player.setVelocityY(-170);
      }
    } else this.player.body.setGravityY(0);
  }

  _hitEnemy(b, e) {
    if (!b.active || !e.active || e.dying) return;
    if (b.explode) { this._explodeAt(b.x, b.y, b.explode, true); this.bullets.killAndHide(b); if (b.body) b.body.enable = false; return; }
    this._damage(e, b.dmg);
    if (!b.pierce) { this.bullets.killAndHide(b); if (b.body) b.body.enable = false; }
    else b.pierce--;
  }

  _damage(e, dmg) {
    e.hp -= dmg;
    e.setTintFill(0xffffff);
    this.time.delayedCall(40, () => { if (e.active) e.clearTint(); });
    if (this.time.now - (this._lastHitSnd || 0) > 40) { this._lastHitSnd = this.time.now; RetroAudio.play('hit'); }
    if (e.hp <= 0) this._kill(e);
  }

  _kill(e) {
    if (e.dying) return;
    e.dying = true;
    const score = Math.floor((e.def ? e.def.score : 200) * (e.elite ? 4 : 1));
    this._addScore(score);
    popup(this, e.x, e.y - 36, `+${score}`);
    boom(this, e.x, e.y - 30, e.isBoss ? 1.6 : (e.elite ? 1.1 : 0.65), e.isBoss ? 0.018 : 0.006);
    this.stats.kills++;
    if (Math.random() < 0.2 * this.diff.drops) this._drop(e.x, e.y - 20, 'random');
    if (e.body) e.body.enable = false;
    if (e.isBoss) {
      this._bossKilled(e);
      if (e.active) e.destroy();
      return;
    }
    if (this.anims.exists(`${e.etype}_die`)) {
      e.anims.play(`${e.etype}_die`);
      this.time.delayedCall(280, () => { if (e.active) e.destroy(); });
    } else e.destroy();
  }

  _hurt(src) {
    if (this.dead || this.bossDead || this.iframes > 0) return;
    if (src && src.texture && String(src.texture.key).startsWith('bullet')) {
      this._recycleEbullet(src);
    }
    if (this.inSlug) {
      this.slugHP--;
      this.cameras.main.flash(60, 255, 90, 40);
      if (this.slugHP <= 0) this._exitSlug(true);
      this.iframes = 500;
      return;
    }
    this.hp--;
    this.iframes = 1100;
    this.player.setVelocity(-this.facing * 220, -260);
    if (src && src.body && src.setVelocity) src.setVelocity(this.facing * 160, -40);
    this.cameras.main.flash(80, 255, 50, 40);
    RetroAudio.play('death');
    if (this.hp <= 0) this._die();
  }

  _die() {
    if (this.dead) return;
    this.dead = true;
    this.player.setVelocity(0, -240);
    boom(this, this.player.x, this.player.y - 40, 1.05, 0.014);
    this.weapon = WEAPONS.pistol; this.ammo = Infinity;
    const P = this.registry.get('progress');
    P.lives--;
    this.time.delayedCall(900, () => {
      if (P.lives < 0) this._continue();
      else this._respawn();
    });
  }

  _respawn() {
    this.dead = false; this.hp = this.diff.hp;
    let rx = this.checkpoint;
    if (this.bossOn) {
      const arenaX = this.layout.bossX - 40;
      rx = Math.max(rx, arenaX + 90);
    }
    this.player.x = rx; this.player.y = this.gy - 8;
    this.player.setVelocity(0, 0); this.player.setVisible(true);
    this.iframes = 2200;
    this.enemies.getChildren().forEach(e => {
      if (e.active && !e.isBoss && Math.abs(e.x - this.player.x) < 240) e.x += 280;
    });
    this.ebullets.clear(true, true);
    this.player.setTint(0x88e0ff);
    this.time.delayedCall(2200, () => { if (this.player.active) this.player.clearTint(); });
  }

  _continue() {
    this.scene.pause();
    const P = this.registry.get('progress');
    this.scene.launch('Continue', { play: this, continues: P.continues });
  }

  onContinue(yes) {
    const P = this.registry.get('progress');
    if (yes && P.continues > 0) {
      P.continues--; P.lives = this.diff.lives;
      this.scene.resume(); this._respawn();
    } else {
      this.scene.stop('Continue');
      this.scene.start('GameOver', { score: P.score });
    }
  }

  _breakCrate(b, c) {
    if (b && b.active) { this.bullets.killAndHide(b); if (b.body) b.body.enable = false; }
    if (!c.active) return;
    c.hp -= 8;
    if (c.hp <= 0) {
      boom(this, c.x, c.y - 20, 0.45, 0.003);
      this._drop(c.x, c.y - 20, c.loot || 'random');
      this._addScore(200); c.destroy();
    }
  }

  _breakBarrel(b, c) {
    if (b && b.active) { this.bullets.killAndHide(b); if (b.body) b.body.enable = false; }
    if (!c.active || c.blown) return;
    c.blown = true;
    const x = c.x, y = c.y - 24;
    c.destroy();
    boom(this, x, y, 0.7, 0.008);
    this.enemies.getChildren().forEach(e => {
      if (e.active && Phaser.Math.Distance.Between(x, y, e.x, e.y) < 86) this._damage(e, 36);
    });
    if (Math.random() < 0.35) this._drop(x, y, 'food');
  }

  _drop(x, y, loot) {
    let key, kind;
    if (loot === 'random') {
      const r = Math.random();
      if (r < 0.45) { kind = 'wep'; key = 'wep_' + WEAPON_DROP[Math.floor(Math.random() * WEAPON_DROP.length)]; }
      else if (r < 0.7) { kind = 'food'; key = 'food_' + ['apple', 'hotdog', 'pineapple', 'medal'][Math.floor(Math.random() * 4)]; }
      else if (r < 0.88) { kind = 'bomb'; key = 'food_bomb'; }
      else if (r < 0.96) { kind = 'chao'; key = 'food_chao'; }
      else { kind = 'life'; key = 'food_life'; }
    } else if (WEAPON_DROP.includes(loot) || loot === 'hmg') { kind = 'wep'; key = 'wep_' + loot; }
    else if (loot === 'bomb') { kind = 'bomb'; key = 'food_bomb'; }
    else if (loot === 'food') { kind = 'food'; key = 'food_hotdog'; }
    else { kind = 'food'; key = 'food_apple'; }
    const it = this.items.create(x, y, key);
    it.setOrigin(0.5, 1).setScale(0.95).setDepth(9).setBounce(0.35);
    it.kind = kind; it.wep = key.replace('wep_', '');
    it.setVelocity(Phaser.Math.Between(-50, 50), -200);
  }

  _pickup(it) {
    if (!it.active) return;
    RetroAudio.play('pickup');
    if (it.kind === 'wep' && WEAPONS[it.wep]) {
      this.weapon = WEAPONS[it.wep]; this.ammo = this.weapon.ammo;
      popup(this, it.x, it.y - 20, this.weapon.label, '#7af0ff');
    } else if (it.kind === 'bomb') { this.bombs = Math.min(20, this.bombs + 5); popup(this, it.x, it.y - 20, '+5 BOMBS'); }
    else if (it.kind === 'life') { this.registry.get('progress').lives++; popup(this, it.x, it.y - 20, '1UP', '#ff70c0'); }
    else if (it.kind === 'chao') { this._addScore(5000); this.hp = this.diff.hp; popup(this, it.x, it.y - 20, 'SACRED CHAO +5000', '#ff70c0'); }
    else { this._addScore(500); popup(this, it.x, it.y - 20, '+500'); }
    it.destroy();
  }

  _rescue(r) {
    if (!r.active || r.rescued) return;
    r.rescued = true; r.body.enable = false;
    RetroAudio.play('prisoner');
    this.stats.rescued++; this._addScore(1000);
    popup(this, r.x, r.y - 40, 'HAIL ERIS +1000', '#ffe07a');
    this._drop(r.x, r.y - 10, 'random');
    this.tweens.add({ targets: r, x: r.x + 180, alpha: 0, duration: 700, onComplete: () => r.destroy() });
  }

  _addScore(n) {
    const P = this.registry.get('progress');
    P.score += n;
    if (P.score > P.hi) P.hi = P.score;
  }

  _hud() {
    const P = this.registry.get('progress');
    this.scoreT.setText('SCORE ' + String(P.score).padStart(6, '0'));
    this.hiT.setText('HI ' + String(P.hi).padStart(6, '0'));
    const ammo = this.weapon.id === 'pistol' ? '∞' : this.ammo;
    this.wepT.setText(this.weapon.label.split(' ')[0] + ' ' + ammo);
    this.bombT.setText('● ' + this.bombs);
    this.lifeT.setText('ERIS ×' + Math.max(0, P.lives));
    this.layout.checks.forEach(cx => { if (this.player.x > cx && cx > this.checkpoint) this.checkpoint = cx; });
  }

  _startBoss() {
    if (this.bossDead) return;
    const first = !this.bossOn;
    this.bossOn = true;

    if (first) {
      RetroAudio.setSong('boss'); RetroAudio.play('alarm');
      this.enemies.getChildren().slice().forEach(en => {
        if (en.active && !en.isBoss) en.destroy();
      });
      this.ebullets.clear(true, true);
      this.spawnI = this.layout.spawns.length;
      const viewW = ERIS.W;
      const ax = Math.min(this.layout.bossX - 40, this.worldW - viewW);
      this.arenaX = ax;
      this.arenaW = viewW;
      this.physics.world.setBounds(ax, 0, viewW, ERIS.H + 80);
      this.cameras.main.setBounds(ax, 0, viewW, ERIS.H);
      this.cameras.main.stopFollow();
      this.cameras.main.setScroll(ax, 0);
      this.player.x = ax + 150;
      this.player.y = this.gy - 8;
      this.player.setVelocity(0, 0);
      this.iframes = Math.max(this.iframes, 1200);
      this.checkpoint = ax + 150;
      const bdef = BOSSES[this.spec.boss];
      this.bossName.setText(bdef.title + ' — ' + bdef.subtitle).setVisible(true);
      this.bossBar.setVisible(true); this.bossFill.setVisible(true);
      this.cameras.main.flash(280, 180, 20, 30);
      popup(this, ax + viewW / 2, 140, 'WARNING!', '#ff3040');
    }
    this._spawnBoss();
  }

  _spawnBoss() {
    if (this.bossDead) return;
    if (this.boss && this.boss.active && !this.boss.dying) return;
    const bdef = BOSSES[this.spec.boss];
    if (!bdef) return;
    const fly = this.spec.boss === 'tv_man' || this.spec.boss === 'chtulu' || this.spec.boss === 'dark_spirit';
    const ax = this.arenaX || (this.layout.bossX - 40);
    const e = this._spawnEnemy({
      x: ax + 720,
      y: this.gy,
      type: this.spec.boss,
      force: true,
    });
    if (!e || !e.body) return;
    e.isBoss = true;
    e.elite = false;
    e.clearTint();
    e.hp = bdef.hp * this.diff.enemyHp;
    e.maxhp = e.hp;
    const btex = 'boss_' + this.spec.boss;
    if (this.textures.exists(btex)) {
      if (e.anims) e.anims.stop();
      e.setTexture(btex);
      e.setOrigin(0.5, fly ? 0.55 : 1);
      e.setScale(bdef.scale);
      e.y = fly ? 278 : this.gy + 2;
      e.body.allowGravity = !fly;
      const fw = e.frame.width, fh = e.frame.height;
      const bw = fw * (fly ? 0.46 : 0.40);
      const bh = fh * (fly ? 0.52 : 0.70);
      e.body.setSize(bw, bh);
      e.body.setOffset((fw - bw) / 2, fly ? fh * 0.22 : fh - bh - 6);
    } else {
      e.setScale(bdef.scale * 1.85);
      e.body.setSize(70, 100).setOffset(29, 20);
      e.body.allowGravity = !fly;
    }
    e.body.enable = true;
    e.setCollideWorldBounds(true);
    e.phase = 1; e.st = 0; e.ai = 'boss'; e.dying = false;
    this.boss = e;
  }

  _updateBoss(dt) {
    if (!this.bossOn || this.bossDead) return;
    if (!this.boss || !this.boss.active) {
      if (!this.bossDead) this._spawnBoss();
      return;
    }
    const e = this.boss;
    if (!e.body || e.dying) return;
    this.bossFill.width = 416 * Math.max(0, e.hp / e.maxhp);
    e.st += dt;
    const px = this.player.x;
    const dir = Math.sign(px - e.x) || -1;
    e.setFlipX(dir < 0);
    if (e.hp < e.maxhp * 0.45 && e.phase === 1) {
      e.phase = 2; boom(this, e.x, e.y - 40, 1.2, 0.016); popup(this, e.x, e.y - 90, 'PHASE 2', '#ff4050');
    }
    const id = e.etype;
    if (id === 'gollen') this._bossGollen(e, dt, dir);
    else if (id === 'tv_man') this._bossTV(e, dt);
    else if (id === 'robot') this._bossRobot(e, dt, dir);
    else if (id === 'chtulu') this._bossCthulhu(e, dt);
    else this._bossDark(e, dt, dir);
    if (e.y > ERIS.H + 40) { e.y = this.gy; e.setVelocityY(0); }
    const minX = (this.arenaX || this.layout.bossX) + 160;
    const maxX = (this.arenaX || this.layout.bossX) + (this.arenaW || 1040) - 120;
    if (e.x < minX) { e.x = minX; if (e.body.velocity.x < 0) e.setVelocityX(0); }
    if (e.x > maxX) { e.x = maxX; if (e.body.velocity.x > 0) e.setVelocityX(0); }
  }

  _bossGollen(e, dt, dir) {
    if (e.st < 700) { e.setVelocityX(0); return; }
    const cycle = e.st % 3800;
    if (cycle < 1500) e.setVelocityX(dir * 48 * e.phase);
    else if (cycle < 1900) {
      e.setVelocityX(0);
      if (!e._didWave) { this._shockwave(e.x, e.y - 10, dir); e._didWave = true; }
    } else {
      e._didWave = false;
      e.setVelocityX(0);
      if (e.st % 520 < dt + 16) {
        for (let i = 0; i < e.phase + 1; i++) {
          this._fireEbullet(e.x, e.y - 50, 'bullet_rock', dir * 200 + i * 40, -260 - i * 30, 2000, { gravity: true });
        }
      }
    }
  }

  _shockwave(x, y, dir) {
    boom(this, x, y, 0.7, 0.01);
    this._fireEbullet(x, y - 8, 'bullet_rock', dir * 320, 0, 1100, { scale: 1.85 });
  }

  _bossTV(e, dt) {
    e.body.allowGravity = false;
    e.y = 278 + Math.sin(this.time.now / 420) * 28;
    e.x = (this.arenaX || this.layout.bossX) + 520 + Math.sin(this.time.now / 900) * 140;
    if (e.st % (e.phase === 2 ? 720 : 1100) < dt + 16) {
      for (let i = -2; i <= 2; i++) {
        const a = Math.atan2(this.player.y - 40 - e.y, this.player.x - e.x) + i * 0.26;
        this._fireEbullet(e.x, e.y - 20, 'bullet_orb', Math.cos(a) * 250, Math.sin(a) * 250, 1800);
      }
    }
  }

  _bossRobot(e, dt, dir) {
    const cycle = e.st % 4800;
    if (cycle < 1900) {
      e.body.allowGravity = true;
      e.setVelocityX(dir * 80);
      if (e.st % 380 < dt + 16) {
        this._fireEbullet(e.x + dir * 40, e.y - 40, 'bullet_enemy', dir * 360, 0, 1500);
      }
    } else if (cycle < 2700) {
      e.body.allowGravity = false;
      e.y = this.gy - 8;
      e.setVelocityX(0);
      if (e.st % 340 < dt + 16) {
        this._fireEbullet(e.x, e.y - 20, 'bullet_rocket', 0, 70, 1800, { gravity: true });
      }
    } else {
      e.body.allowGravity = true;
    }
  }

  _bossCthulhu(e, dt) {
    e.body.allowGravity = false;
    e.x = (this.arenaX || this.layout.bossX) + 540 + Math.sin(this.time.now / 800) * 150;
    e.y = 270 + Math.cos(this.time.now / 600) * 28;
    if (e.st % 920 < dt + 16) {
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2 + e.st / 500;
        this._fireEbullet(e.x, e.y - 30, 'bullet_orb', Math.cos(a) * 170, Math.sin(a) * 170, 2000);
      }
    }
  }

  _bossDark(e, dt, dir) {
    e.body.allowGravity = false;
    if (e.phase === 1) {
      e.y = 288 + Math.sin(this.time.now / 480) * 24;
      if (e.st % 580 < dt + 16) {
        const a = Math.atan2(this.player.y - 40 - e.y, this.player.x - e.x);
        this._fireEbullet(e.x, e.y - 20, 'bullet_laser', Math.cos(a) * 400, Math.sin(a) * 400, 1400);
      }
    } else {
      if (e.st % 1700 < 30) { e.x = this.player.x + (Math.random() < 0.5 ? 170 : -170); e.y = 280; }
      if (e.st % 420 < dt + 16) {
        this._fireEbullet(e.x, e.y - 20, 'bullet_orb', dir * 220, 0, 1600);
      }
    }
  }

  _bossKilled(e) {
    if (this.bossDead) return;
    this.bossDead = true;
    const x = e.x, y = e.y;
    this.boss = null;
    this._addScore(50000);
    this.bossBar.setVisible(false); this.bossFill.setVisible(false); this.bossName.setVisible(false);
    for (let i = 0; i < 5; i++) {
      this.time.delayedCall(i * 140, () => boom(this, x + Phaser.Math.Between(-50, 50), y - 30, 1.1, 0.012));
    }
    this.ebullets.clear(true, true);
    this.iframes = 4000;
    const P = this.registry.get('progress');
    P.weapon = this.weapon.id;
    P.ammo = this.weapon.id === 'pistol' ? 9999 : this.ammo;
    P.bombs = this.bombs;
    P.unlocked = Math.max(P.unlocked, this.mid + 1);
    P.mission = Math.min(5, this.mid + 1);
    this.time.delayedCall(1800, () => {
      if (!this.sys || !this.sys.isActive()) return;
      this.scene.start('Complete', { mission: this.mid, score: P.score, stats: this.stats, spec: this.spec });
    });
  }

  _pause() {
    if (this.dead) return;
    this.paused = !this.paused;
    if (this.paused) {
      this.physics.pause();
      this.pauseTxt = this.add.text(this.cameras.main.scrollX + ERIS.W / 2, 250, 'PAUSADO\nP continua', {
        fontFamily: 'monospace', fontSize: 22, color: '#f0be28', align: 'center', stroke: '#000', strokeThickness: 6,
      }).setOrigin(0.5).setDepth(80);
    } else {
      this.physics.resume();
      if (this.pauseTxt) this.pauseTxt.destroy();
    }
  }
}
