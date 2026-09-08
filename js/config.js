/* ERIS SLUG: PRINCIPIA DISCORDIA — game data (Metal Slug 5 structure) */
const ERIS = {
  W: 960,
  H: 540,
  GRAVITY: 1280,
  VERSION: '5.23.5',
};

const DIFFICULTY = {
  easy:   { name: 'EASY',   hp: 3, dmgIn: 1, enemyHp: 0.7,  fire: 1.35, drops: 1.4, lives: 5 },
  normal: { name: 'NORMAL', hp: 1, dmgIn: 1, enemyHp: 1.0,  fire: 1.0,  drops: 1.0, lives: 3 },
  hard:   { name: 'HARD',   hp: 1, dmgIn: 1, enemyHp: 1.45, fire: 0.75, drops: 0.7, lives: 2 },
  mania:  { name: 'MANIA',  hp: 1, dmgIn: 1, enemyHp: 1.9,  fire: 0.55, drops: 0.45, lives: 1 },
};

const WEAPONS = {
  pistol: { id: 'pistol', label: 'MAÇÃ DE BOLSO',     dmg: 12, rate: 150, ammo: Infinity, speed: 560, spread: 2,  count: 1, sprite: 'bullet_pistol', sfx: 'pistol', life: 700 },
  hmg:    { id: 'hmg',    label: 'HMG PENTABARFO',    dmg: 8,  rate: 50,  ammo: 200,      speed: 640, spread: 6,  count: 1, sprite: 'bullet_hmg',    sfx: 'hmg',    life: 650 },
  shot:   { id: 'shot',   label: 'ESPINGARDA KALLISTI',dmg: 10, rate: 360, ammo: 32,       speed: 500, spread: 16, count: 5, sprite: 'bullet_shot',   sfx: 'shot',   life: 380 },
  rocket: { id: 'rocket', label: 'FOGUETE DO CHAO',   dmg: 78, rate: 460, ammo: 22,       speed: 400, spread: 0,  count: 1, sprite: 'bullet_rocket', sfx: 'rocket', life: 900, explode: 86 },
  flame:  { id: 'flame',  label: 'SOPRO PINEAL',      dmg: 6,  rate: 40,  ammo: 90,       speed: 260, spread: 10, count: 1, sprite: 'bullet_flame',  sfx: 'flame',  life: 260 },
  laser:  { id: 'laser',  label: 'RAIO DA DISCÓRDIA', dmg: 15, rate: 70,  ammo: 220,      speed: 920, spread: 0,  count: 1, sprite: 'bullet_laser',  sfx: 'laser',  life: 500, pierce: 4 },
  chaser: { id: 'chaser', label: 'PERSEGUIDOR FNORD', dmg: 34, rate: 300, ammo: 18,       speed: 280, spread: 0,  count: 1, sprite: 'bullet_chaser', sfx: 'chaser', life: 1400, homing: true },
  lizard: { id: 'lizard', label: 'LAGARTO DE FERRO',  dmg: 42, rate: 380, ammo: 16,       speed: 240, spread: 0,  count: 1, sprite: 'bullet_lizard', sfx: 'rocket', life: 1800, ground: true, explode: 48 },
  drop:   { id: 'drop',   label: 'DROP SHOT',         dmg: 58, rate: 340, ammo: 18,       speed: 90,  spread: 0,  count: 1, sprite: 'bullet_rocket', sfx: 'grenade', life: 1200, drop: true, explode: 72 },
};

const WEAPON_DROP = ['hmg', 'shot', 'rocket', 'flame', 'laser', 'chaser', 'lizard'];

const ENEMIES = {
  mib:     { hp: 18,  speed: 72,  score: 200,  shoot: 1500, range: 420, scale: 0.38, ai: 'walker',    bullet: 'bullet_enemy', bspeed: 280 },
  ninja:   { hp: 14,  speed: 120, score: 250,  shoot: 1100, range: 380, scale: 0.36, ai: 'jumper',    bullet: 'bullet_enemy', bspeed: 320 },
  alien:   { hp: 16,  speed: 80,  score: 300,  shoot: 900,  range: 500, scale: 0.38, ai: 'flyer',     bullet: 'bullet_orb',   bspeed: 240 },
  robot:   { hp: 70,  speed: 40,  score: 800,  shoot: 700,  range: 520, scale: 0.5,  ai: 'tank',      bullet: 'bullet_enemy', bspeed: 360 },
  viper:   { hp: 20,  speed: 90,  score: 280,  shoot: 1000, range: 360, scale: 0.38, ai: 'walker',    bullet: 'bullet_orb',   bspeed: 220, acid: true },
  freddy:  { hp: 36,  speed: 70,  score: 600,  shoot: 800,  range: 300, scale: 0.42, ai: 'teleport',  bullet: 'bullet_flame', bspeed: 200 },
  jason:   { hp: 55,  speed: 55,  score: 700,  shoot: 1600, range: 180, scale: 0.48, ai: 'brute',     bullet: 'bullet_rock',  bspeed: 260 },
  mcjoker: { hp: 18,  speed: 100, score: 320,  shoot: 900,  range: 400, scale: 0.38, ai: 'grenadier', bullet: 'bullet_enemy', bspeed: 240 },
  tv_man:  { hp: 28,  speed: 60,  score: 450,  shoot: 800,  range: 480, scale: 0.4,  ai: 'flyer',     bullet: 'bullet_orb',   bspeed: 260 },
  vodoo:   { hp: 22,  speed: 65,  score: 340,  shoot: 1200, range: 440, scale: 0.4,  ai: 'walker',    bullet: 'bullet_chaser',bspeed: 180, homing: true },
  chtulu:  { hp: 30,  speed: 50,  score: 500,  shoot: 1000, range: 460, scale: 0.44, ai: 'flyer',     bullet: 'bullet_orb',   bspeed: 230 },
  gollen:  { hp: 90,  speed: 30,  score: 1200, shoot: 1400, range: 400, scale: 0.62, ai: 'tank',      bullet: 'bullet_rock',  bspeed: 250 },
  masson:  { hp: 40,  speed: 55,  score: 650,  shoot: 700,  range: 520, scale: 0.42, ai: 'turret',    bullet: 'bullet_laser', bspeed: 420 },
  dark_spirit: { hp: 24, speed: 90, score: 400, shoot: 900, range: 440, scale: 0.4, ai: 'flyer',     bullet: 'bullet_orb',   bspeed: 300 },
  turret:  { hp: 45,  speed: 0,   score: 450,  shoot: 850,  range: 520, scale: 0.42, ai: 'turret',    bullet: 'bullet_enemy', bspeed: 340, sprite: 'turret' },
};

const BOSSES = {
  gollen: {
    key: 'gollen', title: 'GOLLEN', subtitle: 'O GOLIAS DE PEDRA', hp: 900, scale: 0.82,
    quote: 'A ordem de pedra não se curva ao caos.',
  },
  tv_man: {
    key: 'tv_man', title: 'TV-MAN', subtitle: 'A FORTALEZA DE SINAIS', hp: 860, scale: 0.72,
    quote: 'Sintonize o dogma. Desligue a pineal.',
  },
  robot: {
    key: 'robot', title: 'CYBER-01', subtitle: 'A BROCA DA BUROCRACIA', hp: 940, scale: 0.78,
    quote: 'Formulário 23-B: destruição autorizada.',
  },
  chtulu: {
    key: 'chtulu', title: 'CTHULHU', subtitle: 'O LULAS DO ABISMO', hp: 1100, scale: 0.8,
    quote: 'Ph\'nglui mglw\'nafh — Hail Eris even here.',
  },
  dark_spirit: {
    key: 'dark_spirit', title: 'DARK SPIRIT', subtitle: 'O REI DO DOGMA', hp: 1300, scale: 0.88,
    quote: 'Greyface é eterno. O caos é um erro.',
  },
};

const MISSIONS = [
  {
    id: 1,
    code: 'M1',
    name: 'WINDY DISCORDIA',
    subtitle: 'A Cidade do Caos',
    season: 'I · CAOS',
    briefing: 'Greyface selou a Cidade do Caos com asfalto cinza e agentes MIB. Eris, recupere a primeira fatia do Sagrado Chao. KALLISTI!',
    width: 10800,
    env: 'env1', sky: '#3a1848', tile: 'ground1', plat: 'plat_city',
    music: 'm1', water: false, weather: 'paper',
    roster: ['mib', 'ninja', 'mcjoker', 'jason'],
    heavies: ['robot', 'jason'],
    mid: { type: 'jason', x: 4800 },
    boss: 'gollen',
    vehicleAt: 2100,
  },
  {
    id: 2,
    code: 'M2',
    name: 'HEAVY CONFUSION',
    subtitle: 'A Selva da Discórdia',
    season: 'II · DISCÓRDIA',
    briefing: 'A selva cresce ao avesso. Venenos, totens Fnord e o sinal de TV-Man contaminam a Lei dos Cincos. Queime o estático.',
    width: 11200,
    env: 'env2', sky: '#06241c', tile: 'ground2', plat: 'plat_jungle',
    music: 'm2', water: false, weather: 'spores',
    roster: ['viper', 'vodoo', 'alien', 'freddy', 'ninja'],
    heavies: ['freddy', 'chtulu'],
    mid: { type: 'freddy', x: 5000 },
    boss: 'tv_man',
    vehicleAt: 2400,
  },
  {
    id: 3,
    code: 'M3',
    name: 'THE WALL OF GREYFACE',
    subtitle: 'A Muralha da Ordem',
    season: 'III · CONFUSÃO',
    briefing: 'A Grande Muralha de formulários. Carimbos gigantes. A Broca da Burocracia fura a realidade. Não assine nada.',
    width: 11600,
    env: 'env3', sky: '#3a2a18', tile: 'ground3', plat: 'plat_canyon',
    music: 'm3', water: false, weather: 'dust',
    roster: ['robot', 'mib', 'ninja', 'masson', 'jason'],
    heavies: ['robot', 'masson'],
    mid: { type: 'masson', x: 5200 },
    boss: 'robot',
    vehicleAt: 1800,
  },
  {
    id: 4,
    code: 'M4',
    name: 'SAND MARINE OF CHAO',
    subtitle: 'O Submarino Pineal',
    season: 'IV · BUROCRACIA',
    briefing: 'Dunas douradas escondem o Submarino Pineal. Nas profundezas, Cthulhu guarda a quarta fatia. Respire o caos.',
    width: 12000,
    env: 'env4', sky: '#0a2030', tile: 'ground4', plat: 'plat_marine',
    music: 'm4', water: true, weather: 'bubbles',
    roster: ['alien', 'vodoo', 'viper', 'chtulu', 'tv_man'],
    heavies: ['chtulu', 'robot'],
    mid: { type: 'alien', x: 5400 },
    boss: 'chtulu',
    vehicleAt: 2600,
  },
  {
    id: 5,
    code: 'M5',
    name: 'LAST DITCH OF ERIS',
    subtitle: 'O Sanctum do Sagrado Chao',
    season: 'V · O DEPOIS',
    briefing: 'A Pirâmide do Olho. Masson abre o portão. Dark Spirit, avatar de Greyface, espera no vazio. Cinco toneladas de linho. HAIL ERIS!',
    width: 12400,
    env: 'env5', sky: '#1a0418', tile: 'ground5', plat: 'plat_void',
    music: 'm5', water: false, weather: 'apples',
    roster: ['mib', 'ninja', 'masson', 'dark_spirit', 'freddy', 'jason', 'mcjoker'],
    heavies: ['robot', 'gollen', 'masson'],
    mid: { type: 'masson', x: 5600 },
    boss: 'dark_spirit',
    vehicleAt: 2000,
  },
];

const ORACLE = [
  { q: 'Convence um homem de uma mentira e ele a defenderá pelo resto da vida.', r: 'Principia Discordia' },
  { q: 'O Sagrado Chao não é o Yin-Yang. É o Yin-Yang com um pentágono e uma maçã. Preste atenção.', r: 'Malaclypse the Younger' },
  { q: 'Cinco toneladas de linho.', r: 'The Law of Fives' },
  { q: 'Greyface ensinou que ordem é verdadeira e caos é falso. Greyface é um palhaço triste.', r: 'Curse of Greyface' },
  { q: 'Todo homem, mulher e criança neste planeta é um Papa Discordiano.', r: 'Principia Discordia · pg. 00004' },
  { q: 'Fnord.', r: 'Illuminatus!' },
  { q: 'Kallisti — para a mais bela.', r: 'A Maçã Dourada' },
  { q: 'Se o telefone tocar, não atenda. É a Discórdia cobrando o aluguel.', r: 'Oráculo de Eris' },
  { q: 'A hot dog é o sacramento de sexta-feira. Honre o pão e o caos.', r: 'Hot Dog Day' },
  { q: 'Não há deusa além de Eris, e Ela é a sua Deusa.', r: 'Principia Discordia' },
  { q: '23. Sempre 23.', r: 'Law of Fives (subcláusula)' },
  { q: 'A pineal não é uma glândula. É uma janela.', r: 'Hagbard Celine' },
];

const CHAR_LIST = [
  'eris','mib','ninja','alien','robot','viper','freddy','jason',
  'mcjoker','tv_man','vodoo','chtulu','gollen','masson','dark_spirit'
];

const ANIM = {
  idle:  { count: 4, rate: 8,  repeat: -1 },
  run:   { count: 5, rate: 12, repeat: -1 },
  jump:  { count: 3, rate: 10, repeat: 0 },
  shoot: { count: 3, rate: 12, repeat: 0 },
  die:   { count: 4, rate: 8,  repeat: 0 },
};

function hash23(n) {
  n = (n ^ 23) >>> 0;
  n = Math.imul(n ^ (n >>> 16), 2246822507);
  n = Math.imul(n ^ (n >>> 13), 3266489909);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}
