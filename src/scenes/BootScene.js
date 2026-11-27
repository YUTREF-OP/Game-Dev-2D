// BootScene: loads /data JSON into the registry and generates every placeholder
// texture in code (Graphics.generateTexture), so the game runs with zero .png files.

// "Sweetie 16" palette (by GrafxKid): one limited palette shared by all scenes.
export const PALETTE = Object.freeze({
  black: 0x1a1c2c,
  plum: 0x5d275d,
  red: 0xb13e53,
  orange: 0xef7d57,
  yellow: 0xffcd75,
  lime: 0xa7f070,
  green: 0x38b764,
  teal: 0x257179,
  navy: 0x29366f,
  blue: 0x3b5dc9,
  sky: 0x41a6f6,
  cyan: 0x73eff7,
  white: 0xf4f4f4,
  silver: 0x94b0c2,
  slate: 0x566c86,
  charcoal: 0x333c57,
});

const P = PALETTE;

// Tile indices inside the generated 'tileset' texture (64x16, four 16x16 tiles).
export const TILE_INDEX = Object.freeze({
  GROUND: 0,
  GROUND_FILL: 1,
  PLATFORM: 2,
  SPIKES: 3,
});

// Data schemas from GDD.md section 5. Required keys must exist with the given type.
const DATA_SCHEMAS = {
  items: {
    required: { id: 'string', name: 'string', type: 'string', value: 'number', description: 'string' },
    optional: { atk: 'number' },
  },
  enemies: {
    required: {
      id: 'string', name: 'string', hp: 'number', atk: 'number', def: 'number',
      xp: 'number', ai: 'string', drops: 'array',
    },
    optional: {},
  },
};

// ---------------------------------------------------------------------------
// Pixel maps. One character = one pixel; '.' is transparent.
// ---------------------------------------------------------------------------

const PLAYER_PALETTE = {
  k: P.black,    // outline
  h: P.silver,   // helmet
  v: P.cyan,     // visor
  s: P.orange,   // scarf
  j: P.red,      // jacket
  g: P.slate,    // gloves / arms
  b: P.yellow,   // belt
  l: P.blue,     // front leg
  n: P.navy,     // back leg
  m: P.charcoal, // boots
};

const PLAYER_UPPER = [
  '................',
  '......kkkk......',
  '.....khhhhk.....',
  '....khhhhhhk....',
  '....khhvvvvk....',
  '....khvvvvvk....',
  '....khhvvvvk....',
  '....khhhhhhk....',
  '.....kkhhkk.....',
  '....kssssssk....',
  '...kjssssjjjk...',
  '...kjjjjjjjjk...',
  '..kgkjjjjjjkgk..',
  '..kgkjjjjjjkgk..',
  '..kgkjjjjjjkgk..',
  '...kkbbbbbbkk...',
];

const PLAYER_LEGS = {
  stand: [
    '....kllllllk....',
    '....kllllllk....',
    '....kllkkllk....',
    '....kllkkllk....',
    '....kllkkllk....',
    '...kmmmkkmmmk...',
    '...kmmmkkmmmk...',
    '...kkkkkkkkkk...',
  ],
  strideA: [
    '....kllllllk....',
    '...knnkkkllk....',
    '..knnk...kllk...',
    '..knnk....kllk..',
    '.knnk.....kllk..',
    '.kmmk.....kmmmk.',
    'kmmmk......kkkk.',
    'kkkk............',
  ],
  passing: [
    '....kllllllk....',
    '....kllllllk....',
    '.....kllllk.....',
    '.....kllllk.....',
    '.....kmmmmk.....',
    '....kmmmmmk.....',
    '....kkkkkkk.....',
    '................',
  ],
  tuck: [
    '....kllllllk....',
    '....kllkkllk....',
    '...kllk.kllk....',
    '...kmmk.kmmmk...',
    '...kkkk.kkkkk...',
    '................',
    '................',
    '................',
  ],
  dangle: [
    '....kllllllk....',
    '....kllkkllk....',
    '...kllk..kllk...',
    '...kllk..kllk...',
    '..kllk....kllk..',
    '..kmmk....kmmk..',
    '..kkkk....kkkk..',
    '................',
  ],
};

// Stride B is stride A with the front/back leg shading swapped.
PLAYER_LEGS.strideB = PLAYER_LEGS.strideA.map((row) =>
  row.replace(/[ln]/g, (c) => (c === 'l' ? 'n' : 'l')),
);

// Frame order inside the 'player' texture strip (each frame 16x24).
export const PLAYER_FRAMES = [
  { name: 'idle0', legs: 'stand' },
  { name: 'idle1', legs: 'stand', palette: { v: P.teal } }, // visor blink
  { name: 'run0', legs: 'strideA' },
  { name: 'run1', legs: 'passing' },
  { name: 'run2', legs: 'strideB' },
  { name: 'run3', legs: 'passing' },
  { name: 'jump', legs: 'tuck' },
  { name: 'fall', legs: 'dangle' },
  { name: 'dash', legs: 'strideA', palette: { s: P.yellow } },
];

const DUMMY_MAP = [
  '................',
  '.....kkkkkk.....',
  '....kwwwwwwk....',
  '...kwwrrrrwwk...',
  '...kwrrwwrrwk...',
  '...kwrwrrwrwk...',
  '...kwrwrrwrwk...',
  '...kwrrwwrrwk...',
  '...kwwrrrrwwk...',
  '....kwwwwwwk....',
  '.....kkkkkk.....',
  '.......kk.......',
  '......kppk......',
  '......kppk......',
  '....kkkppkkk....',
  '...kppppppppk...',
];
const DUMMY_PALETTE = { k: P.black, w: P.white, r: P.red, p: P.slate };

const CHECKPOINT_MAP = [
  '................',
  '......kkkk......',
  '.....kllllk.....',
  '.....kllllk.....',
  '......kkkk......',
  '.......kk.......',
  '.......pk.......',
  '.......pk.......',
  '.......pk.......',
  '.......pk.......',
  '.......pk.......',
  '.......pk.......',
  '......kppk......',
  '.....kppppk.....',
  '....kppppppk....',
  '...kkkkkkkkkk...',
];

const GROUND_MAP = [
  'GGGgGGGGGgGGGGgG',
  'gggggGggggggGggg',
  'cgcCcgccCcgccgcC',
  'cCcccgccccccCgcc',
  'cccccccccccccccc',
  'cxccccCccccccxcc',
  'ccxccccccccccxcc',
  'cccxcccccCcccccc',
  'xxxxxxxxxxxxxxxx',
  'cccccccxcccccccc',
  'cCccccccxcccCccc',
  'cccccccxcccccccc',
  'ccccxccccccccccc',
  'cccxcccccccxcccc',
  'ccccccCcccccxccc',
  'xxxxxxxxxxxxxxxx',
];

const GROUND_FILL_MAP = [
  'xxxxxxxkxxxxxxxx',
  'xcxxxxxxkxxxcxxx',
  'xxxxxxxkxxxxxxxx',
  'xxxxkxxxxxxxxxxx',
  'xxxkxxxxxxxkxxxx',
  'xxxxxxcxxxxxkxxx',
  'xxxxxxxxxxxxxxxx',
  'kkkkkkkkkkkkkkkk',
  'xxxkxxxxxxxxxxxx',
  'xxxxxxxxcxxxkxxx',
  'xcxxxxxxxxxkxxxx',
  'xxxxxkxxxxxxxxxx',
  'xxxxxxkxxxxxxcxx',
  'xxxxxxxxxkxxxxxx',
  'xxxxxxxxxxxxxxxx',
  'kkkkkkkkkkkkkkkk',
];
const GROUND_PALETTE = {
  G: P.lime, g: P.green, c: P.slate, C: P.silver, x: P.charcoal, k: P.black,
};

// One-way girder: the visible beam is the top half; the collision face is its top edge.
const PLATFORM_MAP = [
  'kkkkkkkkkkkkkkkk',
  'oooooooooooooooo',
  'rrrrrrrrrrrrrrrr',
  'rr....rrrr....rr',
  '.rr..rr..rr..rr.',
  '..rrrr....rrrr..',
  'rrrrrrrrrrrrrrrr',
  'kkkkkkkkkkkkkkkk',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
];
const PLATFORM_PALETTE = { k: P.black, o: P.orange, r: P.red };

const SPIKES_MAP = [
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '...kk......kk...',
  '..kwsk....kwsk..',
  '..kwsk....kwsk..',
  '.kwwssk..kwwssk.',
  '.kwwssk..kwwssk.',
  'kwwwssskkwwwsssk',
  'kxxxxxxkkxxxxxxk',
  'kkkkkkkkkkkkkkkk',
];
const SPIKES_PALETTE = { k: P.black, w: P.white, s: P.silver, x: P.charcoal };

// 3x5 glyphs for the generated pixel font (each glyph sits in a 4x6 cell).
const FONT_CHARS = ' ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.:/-!?()+,<>=`\'';
const GLYPHS = {
  A: ['010', '101', '111', '101', '101'],
  B: ['110', '101', '110', '101', '110'],
  C: ['011', '100', '100', '100', '011'],
  D: ['110', '101', '101', '101', '110'],
  E: ['111', '100', '110', '100', '111'],
  F: ['111', '100', '110', '100', '100'],
  G: ['011', '100', '101', '101', '011'],
  H: ['101', '101', '111', '101', '101'],
  I: ['111', '010', '010', '010', '111'],
  J: ['001', '001', '001', '101', '010'],
  K: ['101', '101', '110', '101', '101'],
  L: ['100', '100', '100', '100', '111'],
  M: ['101', '111', '111', '101', '101'],
  N: ['110', '101', '101', '101', '101'],
  O: ['010', '101', '101', '101', '010'],
  P: ['110', '101', '110', '100', '100'],
  Q: ['010', '101', '101', '110', '011'],
  R: ['110', '101', '110', '101', '101'],
  S: ['011', '100', '010', '001', '110'],
  T: ['111', '010', '010', '010', '010'],
  U: ['101', '101', '101', '101', '111'],
  V: ['101', '101', '101', '101', '010'],
  W: ['101', '101', '111', '111', '101'],
  X: ['101', '101', '010', '101', '101'],
  Y: ['101', '101', '010', '010', '010'],
  Z: ['111', '001', '010', '100', '111'],
  0: ['111', '101', '101', '101', '111'],
  1: ['010', '110', '010', '010', '111'],
  2: ['110', '001', '010', '100', '111'],
  3: ['110', '001', '010', '001', '110'],
  4: ['101', '101', '111', '001', '001'],
  5: ['111', '100', '110', '001', '110'],
  6: ['011', '100', '111', '101', '111'],
  7: ['111', '001', '010', '010', '010'],
  8: ['111', '101', '111', '101', '111'],
  9: ['111', '101', '111', '001', '110'],
  '.': ['000', '000', '000', '000', '010'],
  ':': ['000', '010', '000', '010', '000'],
  '/': ['001', '001', '010', '100', '100'],
  '-': ['000', '000', '111', '000', '000'],
  '!': ['010', '010', '010', '000', '010'],
  '?': ['110', '001', '010', '000', '010'],
  '(': ['001', '010', '010', '010', '001'],
  ')': ['100', '010', '010', '010', '100'],
  '+': ['000', '010', '111', '010', '000'],
  ',': ['000', '000', '000', '010', '100'],
  '<': ['001', '010', '100', '010', '001'],
  '>': ['100', '010', '001', '010', '100'],
  '=': ['000', '111', '000', '111', '000'],
  '`': ['100', '010', '000', '000', '000'],
  "'": ['010', '010', '000', '000', '000'],
};

// Exposed for tooling/tests that want to validate the art without a browser.
export const PIXEL_ART = {
  PLAYER_UPPER, PLAYER_LEGS, DUMMY_MAP, CHECKPOINT_MAP, GROUND_MAP, GROUND_FILL_MAP,
  PLATFORM_MAP, SPIKES_MAP, FONT_CHARS, GLYPHS,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// Small deterministic PRNG so procedural backgrounds look identical every load.
function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function assertMap(name, rows, width, height) {
  if (rows.length !== height) {
    throw new Error(`[BootScene] Pixel map "${name}" has ${rows.length} rows, expected ${height}.`);
  }
  rows.forEach((row, y) => {
    if (row.length !== width) {
      throw new Error(`[BootScene] Pixel map "${name}" row ${y} is ${row.length}px wide, expected ${width}.`);
    }
  });
}

// Draws a pixel map with run-length merged fillRects (integer rects = no anti-aliasing).
function drawPixelMap(g, rows, palette, ox = 0, oy = 0) {
  rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const ch = row[x];
      let run = 1;
      while (x + run < row.length && row[x + run] === ch) run += 1;
      if (ch !== '.') {
        const color = palette[ch];
        if (color === undefined) {
          throw new Error(`[BootScene] Unknown pixel key "${ch}" (row ${y}).`);
        }
        g.fillStyle(color, 1);
        g.fillRect(ox + x, oy + y, run, 1);
      }
      x += run;
    }
  });
}

function typeOfValue(value) {
  if (Array.isArray(value)) return 'array';
  if (value === null) return 'null';
  return typeof value;
}

// Validates a /data JSON array against its schema. Invalid entries are skipped
// (with a console warning) so bad external content never crashes the game.
function validateDataset(key, raw, warnings) {
  const schema = DATA_SCHEMAS[key];
  if (!Array.isArray(raw)) {
    warnings.push(`${key}.json: expected a top-level array, got ${typeOfValue(raw)}.`);
    return [];
  }
  const seen = new Set();
  const valid = [];
  raw.forEach((entry, i) => {
    const label = `${key}.json[${i}]${entry && entry.id ? ` (${entry.id})` : ''}`;
    if (typeOfValue(entry) !== 'object') {
      warnings.push(`${label}: entry is not an object.`);
      return;
    }
    const problems = [];
    Object.entries(schema.required).forEach(([field, type]) => {
      if (!(field in entry)) problems.push(`missing "${field}"`);
      else if (typeOfValue(entry[field]) !== type) problems.push(`"${field}" should be ${type}`);
    });
    Object.entries(schema.optional).forEach(([field, type]) => {
      if (field in entry && typeOfValue(entry[field]) !== type) problems.push(`"${field}" should be ${type}`);
    });
    if (typeof entry.id === 'string' && seen.has(entry.id)) problems.push(`duplicate id "${entry.id}"`);
    if (problems.length > 0) {
      warnings.push(`${label}: ${problems.join(', ')} — entry skipped.`);
      return;
    }
    seen.add(entry.id);
    valid.push(Object.freeze({ ...entry }));
  });
  return valid;
}

// ---------------------------------------------------------------------------
// Scene
// ---------------------------------------------------------------------------

export default class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    this.failedFiles = [];
    this.load.on(Phaser.Loader.Events.FILE_LOAD_ERROR, (file) => {
      this.failedFiles.push(file.key);
    });

    // Relative paths only (GitHub Pages subpath hosting).
    this.load.json('items', './data/items.json');
    this.load.json('enemies', './data/enemies.json');
  }

  create() {
    this.registerData();
    this.generateTextures();
    this.generatePixelFont();
    this.createAnimations();
    this.scene.start('WorldScene');
  }

  // --- Data -----------------------------------------------------------------

  registerData() {
    const warnings = [];
    this.failedFiles.forEach((key) => warnings.push(`${key}.json failed to load — using an empty list.`));

    const items = validateDataset('items', this.cache.json.get('items') ?? [], warnings);
    const enemies = validateDataset('enemies', this.cache.json.get('enemies') ?? [], warnings);

    const itemsById = new Map(items.map((item) => [item.id, item]));
    const enemiesById = new Map(enemies.map((enemy) => [enemy.id, enemy]));

    // Cross-reference: every enemy drop must point at a known item id.
    enemies.forEach((enemy) => {
      enemy.drops.forEach((dropId) => {
        if (!itemsById.has(dropId)) warnings.push(`enemies.json (${enemy.id}): drop "${dropId}" is not in items.json.`);
      });
    });

    warnings.forEach((w) => console.warn(`[data] ${w}`));

    this.registry.set('items', items);
    this.registry.set('enemies', enemies);
    this.registry.set('itemsById', itemsById);
    this.registry.set('enemiesById', enemiesById);
    this.registry.set('dataWarnings', warnings);

    console.info(`[data] Loaded ${items.length} item(s) and ${enemies.length} enemy type(s).`);
  }

  // --- Textures -------------------------------------------------------------

  newGraphics() {
    return this.make.graphics({ x: 0, y: 0, add: false });
  }

  textureFromMap(key, rows, palette, width = 16, height = 16) {
    assertMap(key, rows, width, height);
    const g = this.newGraphics();
    drawPixelMap(g, rows, palette);
    g.generateTexture(key, width, height);
    g.destroy();
  }

  generateTextures() {
    this.generatePlayerTexture();

    this.textureFromMap('tile_ground', GROUND_MAP, GROUND_PALETTE);
    this.textureFromMap('tile_ground_fill', GROUND_FILL_MAP, GROUND_PALETTE);
    this.textureFromMap('tile_platform', PLATFORM_MAP, PLATFORM_PALETTE);
    this.textureFromMap('tile_spikes', SPIKES_MAP, SPIKES_PALETTE);
    this.generateTileset();

    this.textureFromMap('dummy', DUMMY_MAP, DUMMY_PALETTE);
    this.textureFromMap('checkpoint_off', CHECKPOINT_MAP, { k: P.black, p: P.slate, l: P.charcoal });
    this.textureFromMap('checkpoint_on', CHECKPOINT_MAP, { k: P.black, p: P.slate, l: P.cyan });

    // 2x2 white pixel used for dust particles (tinted at runtime).
    const px = this.newGraphics();
    px.fillStyle(0xffffff, 1);
    px.fillRect(0, 0, 2, 2);
    px.generateTexture('px', 2, 2);
    px.destroy();

    this.generateSky();
    this.generateSkyline('bg_city', 256, 128, 0xc17, P.plum, P.red, { minH: 40, maxH: 110, windowChance: 0.05 });
    this.generateSkyline('bg_ruins', 256, 64, 0x5eed, P.navy, P.orange, { minH: 16, maxH: 52, windowChance: 0.02 });
  }

  generatePlayerTexture() {
    const frameW = 16;
    const frameH = 24;
    const g = this.newGraphics();

    assertMap('player_upper', PLAYER_UPPER, frameW, 16);
    PLAYER_FRAMES.forEach((frame, i) => {
      const legs = PLAYER_LEGS[frame.legs];
      assertMap(`player_legs_${frame.legs}`, legs, frameW, 8);
      const palette = { ...PLAYER_PALETTE, ...(frame.palette ?? {}) };
      drawPixelMap(g, [...PLAYER_UPPER, ...legs], palette, i * frameW, 0);
    });

    g.generateTexture('player', frameW * PLAYER_FRAMES.length, frameH);
    g.destroy();

    const texture = this.textures.get('player');
    PLAYER_FRAMES.forEach((frame, i) => texture.add(frame.name, 0, i * frameW, 0, frameW, frameH));
  }

  generateTileset() {
    const g = this.newGraphics();
    drawPixelMap(g, GROUND_MAP, GROUND_PALETTE, TILE_INDEX.GROUND * 16, 0);
    drawPixelMap(g, GROUND_FILL_MAP, GROUND_PALETTE, TILE_INDEX.GROUND_FILL * 16, 0);
    drawPixelMap(g, PLATFORM_MAP, PLATFORM_PALETTE, TILE_INDEX.PLATFORM * 16, 0);
    drawPixelMap(g, SPIKES_MAP, SPIKES_PALETTE, TILE_INDEX.SPIKES * 16, 0);
    g.generateTexture('tileset', 64, 16);
    g.destroy();
  }

  generateSky() {
    const w = 320;
    const h = 180;
    const g = this.newGraphics();
    const rng = mulberry32(0x5ca1ab1e);

    // Hard colour bands with a 1px checker dither at each boundary.
    const bands = [
      { color: P.black, to: 34 },
      { color: P.navy, to: 72 },
      { color: P.plum, to: 112 },
      { color: P.red, to: 146 },
      { color: P.orange, to: h },
    ];
    let y0 = 0;
    bands.forEach((band, i) => {
      g.fillStyle(band.color, 1);
      g.fillRect(0, y0, w, band.to - y0);
      const next = bands[i + 1];
      if (next) {
        g.fillStyle(next.color, 1);
        for (let x = 0; x < w; x += 2) {
          g.fillRect(x, band.to - 2, 1, 1);
          g.fillRect(x + 1, band.to - 1, 1, 1);
        }
      }
      y0 = band.to;
    });

    // Stars in the upper sky.
    for (let i = 0; i < 70; i += 1) {
      const x = Math.floor(rng() * w);
      const y = Math.floor(rng() * 80);
      g.fillStyle(rng() < 0.3 ? P.white : P.silver, 1);
      g.fillRect(x, y, 1, 1);
    }

    // A pale, dying sun built from integer scanlines (no anti-aliased arcs).
    const cx = 236;
    const cy = 120;
    const r = 20;
    for (let dy = -r; dy <= r; dy += 1) {
      const half = Math.floor(Math.sqrt(r * r - dy * dy));
      g.fillStyle(dy > 6 && dy % 3 === 0 ? P.orange : P.yellow, 1);
      g.fillRect(cx - half, cy + dy, half * 2 + 1, 1);
    }

    g.generateTexture('bg_sky', w, h);
    g.destroy();
  }

  // Seamless-ish horizontal skyline of ruined buildings for parallax TileSprites.
  generateSkyline(key, w, h, seed, bodyColor, windowColor, opts) {
    const g = this.newGraphics();
    const rng = mulberry32(seed);
    let x = 0;
    while (x < w) {
      const bw = Math.min(w - x, 10 + Math.floor(rng() * 22));
      const bh = opts.minH + Math.floor(rng() * (opts.maxH - opts.minH));
      const top = h - bh;
      g.fillStyle(bodyColor, 1);
      g.fillRect(x, top, bw, bh);

      // Jagged, ruined rooftops: stack a few rubble chunks on the top edge.
      g.fillStyle(bodyColor, 1);
      for (let n = 0; n < 3; n += 1) {
        if (rng() < 0.6) {
          const nx = x + Math.floor(rng() * bw);
          const nw = Math.max(1, Math.min(1 + Math.floor(rng() * 4), x + bw - nx));
          const nh = 1 + Math.floor(rng() * 6);
          g.fillRect(nx, top - nh, nw, nh);
        }
      }

      // Antenna on some towers.
      if (rng() < 0.25 && bw > 4) {
        g.fillStyle(bodyColor, 1);
        g.fillRect(x + Math.floor(bw / 2), top - 8, 1, 8);
      }

      // Sparse lit windows.
      g.fillStyle(windowColor, 1);
      for (let wy = top + 3; wy < h - 2; wy += 4) {
        for (let wx = x + 2; wx < x + bw - 2; wx += 3) {
          if (rng() < opts.windowChance) g.fillRect(wx, wy, 1, 2);
        }
      }

      x += bw + (rng() < 0.3 ? 2 + Math.floor(rng() * 6) : 0);
    }
    g.generateTexture(key, w, h);
    g.destroy();
  }

  // Builds a fixed-width bitmap font from GLYPHS and registers it as 'pixel'.
  generatePixelFont() {
    const cellW = 4;
    const cellH = 6;
    const perRow = 16;
    const rows = Math.ceil(FONT_CHARS.length / perRow);
    const g = this.newGraphics();
    g.fillStyle(0xffffff, 1);

    [...FONT_CHARS].forEach((ch, i) => {
      const glyph = GLYPHS[ch];
      if (!glyph) return; // space
      const ox = (i % perRow) * cellW;
      const oy = Math.floor(i / perRow) * cellH;
      glyph.forEach((bits, y) => {
        [...bits].forEach((bit, x) => {
          if (bit === '1') g.fillRect(ox + x, oy + y, 1, 1);
        });
      });
    });

    g.generateTexture('font_pixel', perRow * cellW, rows * cellH);
    g.destroy();

    const fontData = Phaser.GameObjects.RetroFont.Parse(this, {
      image: 'font_pixel',
      width: cellW,
      height: cellH,
      chars: FONT_CHARS,
      charsPerRow: perRow,
      spacing: { x: 0, y: 0 },
      offset: { x: 0, y: 0 },
      lineSpacing: 2,
    });
    this.cache.bitmapFont.add('pixel', fontData);
  }

  // --- Animations -----------------------------------------------------------

  createAnimations() {
    const f = (name) => ({ key: 'player', frame: name });

    this.anims.create({
      key: 'player-idle',
      frames: [{ ...f('idle0'), duration: 2400 }, { ...f('idle1'), duration: 40 }],
      frameRate: 10,
      repeat: -1,
    });
    this.anims.create({
      key: 'player-run',
      frames: [f('run0'), f('run1'), f('run2'), f('run3')],
      frameRate: 12,
      repeat: -1,
    });
    this.anims.create({ key: 'player-jump', frames: [f('jump')], frameRate: 1 });
    this.anims.create({ key: 'player-fall', frames: [f('fall')], frameRate: 1 });
    this.anims.create({ key: 'player-dash', frames: [f('dash')], frameRate: 1 });
  }
}
