// Engine config & scene registration.
// Phaser is loaded globally from the CDN <script> tag in index.html. Scene
// modules extend Phaser.Scene at import time, so they are imported dynamically
// only after we know Phaser is available.

const GAME_WIDTH = 320;
const GAME_HEIGHT = 180;

function showBootError(message) {
  const el = document.getElementById('boot-error');
  if (!el) return;
  el.textContent = message;
  el.style.display = 'flex';
}

async function boot() {
  if (typeof Phaser === 'undefined') {
    showBootError('Phaser failed to load from the CDN. Check your connection and reload the page.');
    return;
  }

  // Relative specifiers resolve against this module's URL (GitHub Pages safe).
  const [{ default: BootScene }, { default: WorldScene }, { default: UIScene }] = await Promise.all([
    import('./scenes/BootScene.js'),
    import('./scenes/WorldScene.js'),
    import('./scenes/UIScene.js'),
  ]);

  const config = {
    type: Phaser.AUTO,
    parent: 'game',
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    backgroundColor: '#1a1c2c',

    // Crisp pixel art: nearest-neighbour sampling, no smoothing, integer positions.
    pixelArt: true,
    antialias: false,
    roundPixels: true,

    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },

    physics: {
      default: 'arcade',
      arcade: {
        gravity: { x: 0, y: 900 },
        debug: false,
      },
    },

    // Mobile-first: touch is the primary controller (joystick + JUMP + DASH can
    // all be held at once, so allow 3 simultaneous touches). The keyboard stays
    // enabled as a desktop development fallback.
    input: {
      activePointers: 3,
      touch: true,
      keyboard: true,
      gamepad: false,
    },
    disableContextMenu: true, // no long-press menu on mobile

    scene: [BootScene, WorldScene, UIScene],
  };

  // Exposed for console debugging only; game code never reads this global.
  window.__BROKEN_FIRMAMENT__ = new Phaser.Game(config);
}

boot().catch((err) => {
  console.error(err);
  showBootError(`Failed to start the game: ${err.message}`);
});
