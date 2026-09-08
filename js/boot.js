function frameN(char, anim) {
  const spec = {
    eris: { jump: 3, shoot: 4 },
    gollen: { jump: 3, shoot: 3 },
    alien: { shoot: 4 },
    mcjoker: { shoot: 4 },
    mib: { shoot: 4 },
    tv_man: { shoot: 4 },
  };
  const def = { idle: 4, run: 5, jump: 4, shoot: 3, die: 4 };
  return (spec[char] && spec[char][anim]) || def[anim];
}

class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }
  preload() {
    const W = ERIS.W, H = ERIS.H;
    this.cameras.main.setBackgroundColor('#0a0014');
    const bar = this.add.rectangle(W / 2, H / 2, 400, 14, 0x241018).setOrigin(0.5);
    const fill = this.add.rectangle(W / 2 - 196, H / 2, 4, 10, 0xf0be28).setOrigin(0, 0.5);
    this.add.text(W / 2, H / 2 - 48, 'ERIS SLUG', { fontFamily: 'monospace', fontSize: 28, color: '#f0be28' }).setOrigin(0.5);
    this.add.text(W / 2, H / 2 - 22, 'PRINCIPIA DISCORDIA', { fontFamily: 'monospace', fontSize: 12, color: '#ff70c0' }).setOrigin(0.5);
    this.load.on('progress', p => { fill.width = 392 * p; });

    CHAR_LIST.forEach(c => {
      ['idle', 'run', 'jump', 'shoot', 'die'].forEach(anim => {
        const n = frameN(c, anim);
        for (let i = 1; i <= n; i++) {
          this.load.image(`${c}_${anim}_${i}`, `assets/processed/characters/${c}/${anim}/frame_${i}.png`);
        }
      });
    });

    ['idle', 'crouch', 'shoot', 'jump'].forEach(p => {
      this.load.image(`eris_hero_${p}`, `assets/processed/eris/hero_${p}.png`);
    });
    for (let i = 1; i <= 4; i++) {
      this.load.image(`eris_hero_run_${i}`, `assets/processed/eris/hero_run_${i}.png`);
    }

    this.load.image('title_art', 'assets/ui/title_art.jpg');
    for (let i = 1; i <= 5; i++) {
      this.load.image(`env${i}`, `assets/env/mission${i}_${['city','jungle','canyon','marine','void'][i-1]}.jpg`);
      this.load.image(`sky${i}`, `assets/backgrounds/bg_season${i}.png`);
      this.load.image(`ground${i}`, `assets/tiles/ground${i}.png`);
    }
    ['city', 'jungle', 'canyon', 'marine', 'void'].forEach(n => {
      this.load.image(`plat_${n}`, `assets/tiles/plat_${n}.png`);
    });

    this.load.image('slug', 'assets/processed/vehicles/apple_slug.png');
    this.load.image('boss_gollen', 'assets/processed/bosses/boss_gollen.png');
    this.load.image('boss_tv_man', 'assets/processed/bosses/boss_tv_man.png');
    this.load.image('boss_robot', 'assets/processed/bosses/boss_robot.png');
    this.load.image('boss_chtulu', 'assets/processed/bosses/boss_chtulu.png');
    this.load.image('boss_dark_spirit', 'assets/processed/bosses/boss_dark_spirit.png');
    this.load.image('turret', 'assets/processed/items/turret.png');
    this.load.image('bullet_lizard', 'assets/fx/bullet_lizard.png');
    this.load.image('crate', 'assets/processed/items/crate.png');
    this.load.image('barrel', 'assets/processed/items/barrel.png');
    this.load.image('prisoner', 'assets/processed/items/prisoner.png');
    this.load.image('boom_big', 'assets/processed/fx/explosion.png');

    ['hmg', 'shot', 'rocket', 'flame', 'laser', 'chaser', 'lizard', 'sgren'].forEach(w => {
      this.load.image(`wep_${w}`, `assets/items/wep_${w}.png`);
    });
    ['apple', 'hotdog', 'pineapple', 'chao', 'life', 'bomb', 'medal'].forEach(f => {
      this.load.image(`food_${f}`, `assets/items/food_${f}.png`);
    });
    ['pistol', 'hmg', 'shot', 'rocket', 'laser', 'flame', 'chaser', 'enemy', 'orb', 'rock'].forEach(b => {
      this.load.image(`bullet_${b}`, `assets/fx/bullet_${b}.png`);
    });
    for (let i = 0; i < 6; i++) this.load.image(`boom_${i}`, `assets/fx/boom_${i}.png`);
    this.load.image('grenade', 'assets/fx/grenade.png');
    this.load.image('muzzle', 'assets/fx/muzzle.png');
    this.load.image('penta', 'assets/fx/penta.png');
    this.load.image('apple_small', 'assets/fx/apple_small.png');
    this.load.image('water', 'assets/fx/water.png');
    this.load.image('white', 'assets/fx/white.png');
    this.load.image('heart', 'assets/ui/heart.png');
    this.load.image('bomb_icon', 'assets/ui/bomb_icon.png');
    this.load.image('hud_bar', 'assets/ui/hud_bar.png');
    this.load.image('btn_n', 'assets/ui/btn_n.png');
  }

  create() {
    CHAR_LIST.forEach(c => {
      ['idle', 'run', 'jump', 'shoot', 'die'].forEach(anim => {
        const n = frameN(c, anim);
        const frames = [];
        for (let i = 1; i <= n; i++) frames.push({ key: `${c}_${anim}_${i}` });
        this.anims.create({
          key: `${c}_${anim}`,
          frames,
          frameRate: ANIM[anim] ? ANIM[anim].rate : 8,
          repeat: anim === 'idle' || anim === 'run' ? -1 : 0,
        });
      });
    });
    this.anims.create({
      key: 'boom',
      frames: [0, 1, 2, 3, 4, 5].map(i => ({ key: `boom_${i}` })),
      frameRate: 16,
      repeat: 0,
    });
    this.anims.create({
      key: 'eris_hero_run',
      frames: [1, 2, 3, 4].map(i => ({ key: `eris_hero_run_${i}` })),
      frameRate: 14,
      repeat: -1,
    });

    const save = JSON.parse(localStorage.getItem('eris_slug_save') || 'null') || {};
    this.registry.set('progress', {
      lives: 3,
      continues: 3,
      score: 0,
      hi: save.hi || 0,
      mission: save.mission || 1,
      unlocked: save.unlocked || 5,
      difficulty: save.difficulty || 'normal',
      bombs: 10,
      weapon: 'pistol',
      ammo: Infinity,
      hp: 1,
      prisoners: 0,
      music: save.music !== false,
      sfx: save.sfx !== false,
      crt: save.crt !== false,
      shake: save.shake !== false,
      volumeM: save.volumeM ?? 1,
      volumeS: save.volumeS ?? 1,
    });
    if (typeof location !== 'undefined' && /[?&]autotest=boss/.test(location.search)) {
      this.scene.start('Play', { mission: 1 });
      return;
    }
    this.scene.start('Title');
  }
}
