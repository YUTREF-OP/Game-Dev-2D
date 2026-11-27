// WorldScene: Milestone 1 movement sandbox. A side-scrolling test arena with
// solid ground, raised blocks, one-way platforms, spike pits that respawn the
// player at the last checkpoint, training dummies (contact damage, so dash
// i-frames can be tested), parallax background and a smooth look-ahead camera.

import Player from '../entities/Player.js';
import { PALETTE, TILE_INDEX } from './BootScene.js';

const TILE = 16;
const EMPTY = -1;

const PIT_DAMAGE = 15;
const DUMMY_DAMAGE = 10;
const CAMERA_LERP_X = 0.12;
const CAMERA_LERP_Y = 0.1;
const LOOK_AHEAD_PX = 24;

// Level layout in tile units. Columns run left->right, rows top->bottom.
// Solid ground/blocks extend from their top row down to the bottom of the map;
// any bottom-row column left empty becomes a spike pit.
const LEVEL = {
  cols: 120,
  rows: 15,
  groundRow: 13,
  ground: [[0, 25], [29, 50], [55, 78], [86, 120]], // [startCol, endCol)
  blocks: [[12, 12, 3], [15, 11, 3], [42, 9, 2], [96, 11, 2]], // [col, topRow, width]
  platforms: [ // one-way: [col, row, width]
    [5, 10, 4], [10, 7, 4], [19, 9, 3],
    [33, 10, 4], [37, 7, 3],
    [60, 10, 3], [64, 7, 3], [68, 4, 5],
    [80, 10, 3],
    [91, 10, 4], [99, 8, 4], [104, 5, 3],
  ],
  dummies: [[22, 13], [46, 13], [70, 4], [101, 8], [109, 13]], // [col, surfaceRow]
  checkpoints: [[2, 13], [31, 13], [57, 13], [88, 13]], // first one is the spawn
  signs: [
    { col: 9, row: 4, text: 'BROKE WORLD - M1 SANDBOX' },
    { col: 6, row: 9, text: 'DOWN+JUMP: DROP' },
    { col: 22, row: 10, text: 'DASH THROUGH DUMMIES' },
    { col: 52, row: 9, text: 'JUMP+DASH!' },
    { col: 111, row: 11, text: 'END OF ARENA' },
  ],
};

export default class WorldScene extends Phaser.Scene {
  constructor() {
    super({ key: 'WorldScene' });
  }

  create() {
    this.worldWidth = LEVEL.cols * TILE;
    this.worldHeight = LEVEL.rows * TILE;
    this.respawning = false;
    this.lookAhead = 0;

    // Left/right/top walls collide; the bottom is open so the player can fall into pits.
    this.physics.world.setBounds(0, 0, this.worldWidth, this.worldHeight, true, true, true, false);

    this.createBackground();
    this.createTilemap();
    this.createSigns();
    this.createCheckpoints();
    this.createDummies();
    this.createPitTriggers();
    this.createPlayer();
    this.createCamera();
    this.createDebugToggle();

    // HUD runs in parallel and talks to us only through game.events.
    this.bus = this.game.events;
    this.bus.on('ui:ready', this.onUiReady, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.bus.off('ui:ready', this.onUiReady, this);
    });
    this.scene.launch('UIScene');
  }

  onUiReady() {
    this.player.broadcast();
  }

  // --- Construction ---------------------------------------------------------

  createBackground() {
    this.add.image(0, 0, 'bg_sky').setOrigin(0).setScrollFactor(0).setDepth(-30);

    // Parallax layers: [texture, height, scrollX factor, scrollY factor, base y at scrollY = 0]
    this.parallax = [
      { key: 'bg_city', h: 128, fx: 0.15, fy: 0.3, baseY: 50, depth: -20 },
      { key: 'bg_ruins', h: 64, fx: 0.4, fy: 0.5, baseY: 131, depth: -10 },
    ].map((layer) => ({
      ...layer,
      sprite: this.add.tileSprite(0, layer.baseY, 320, layer.h, layer.key)
        .setOrigin(0)
        .setScrollFactor(0)
        .setDepth(layer.depth),
    }));
  }

  createTilemap() {
    const { cols, rows, groundRow } = LEVEL;
    const solid = Array.from({ length: rows }, () => new Array(cols).fill(false));

    const fillSolid = (col, topRow, width) => {
      for (let c = col; c < Math.min(cols, col + width); c += 1) {
        for (let r = topRow; r < rows; r += 1) solid[r][c] = true;
      }
    };
    LEVEL.ground.forEach(([start, end]) => fillSolid(start, groundRow, end - start));
    LEVEL.blocks.forEach(([col, topRow, width]) => fillSolid(col, topRow, width));

    const data = Array.from({ length: rows }, () => new Array(cols).fill(EMPTY));
    for (let r = 0; r < rows; r += 1) {
      for (let c = 0; c < cols; c += 1) {
        if (solid[r][c]) {
          data[r][c] = r > 0 && solid[r - 1][c] ? TILE_INDEX.GROUND_FILL : TILE_INDEX.GROUND;
        }
      }
    }
    LEVEL.platforms.forEach(([col, row, width]) => {
      for (let c = col; c < col + width; c += 1) {
        if (data[row][c] === EMPTY) data[row][c] = TILE_INDEX.PLATFORM;
      }
    });

    // Spike strip along the bottom of every pit, and remember the pit spans.
    this.pitSpans = [];
    let spanStart = null;
    for (let c = 0; c <= cols; c += 1) {
      const open = c < cols && !solid[rows - 1][c];
      if (open) {
        data[rows - 1][c] = TILE_INDEX.SPIKES;
        if (spanStart === null) spanStart = c;
      } else if (spanStart !== null) {
        this.pitSpans.push([spanStart, c]);
        spanStart = null;
      }
    }

    this.map = this.make.tilemap({ data, tileWidth: TILE, tileHeight: TILE });
    const tileset = this.map.addTilesetImage('tileset', 'tileset', TILE, TILE, 0, 0);
    this.groundLayer = this.map.createLayer(0, tileset, 0, 0);

    this.groundLayer.setCollision([TILE_INDEX.GROUND, TILE_INDEX.GROUND_FILL]);
    // One-way platforms only collide on their top face.
    this.groundLayer.forEachTile((tile) => {
      if (tile.index === TILE_INDEX.PLATFORM) tile.setCollision(false, false, true, false);
    });
  }

  createSigns() {
    LEVEL.signs.forEach(({ col, row, text }) => {
      this.add.bitmapText(col * TILE + TILE / 2, row * TILE + 4, 'pixel', text)
        .setOrigin(0.5, 0)
        .setTint(PALETTE.silver)
        .setAlpha(0.85)
        .setDepth(2);
    });
  }

  createCheckpoints() {
    this.checkpoints = this.physics.add.staticGroup();
    LEVEL.checkpoints.forEach(([col, surfaceRow], i) => {
      const cp = this.checkpoints.create(col * TILE + TILE / 2, surfaceRow * TILE - TILE / 2, 'checkpoint_off');
      cp.setDepth(3);
      cp.setData('index', i);
      cp.setData('active', false);
      cp.body.setSize(10, 16);
    });
    this.activeCheckpoint = null;
  }

  createDummies() {
    this.dummies = this.physics.add.staticGroup();
    LEVEL.dummies.forEach(([col, surfaceRow]) => {
      const dummy = this.dummies.create(col * TILE + TILE / 2, surfaceRow * TILE - TILE / 2, 'dummy');
      dummy.setDepth(4);
      dummy.body.setSize(10, 14);
      dummy.setData('homeX', dummy.x);
      dummy.setData('cooldownUntil', 0);
    });
  }

  createPitTriggers() {
    this.pitZones = this.physics.add.staticGroup();
    const triggerTop = this.worldHeight - TILE + 8; // spike tips
    const triggerHeight = 96;
    this.pitSpans.forEach(([start, end]) => {
      const width = (end - start) * TILE;
      const zone = this.add.zone(start * TILE + width / 2, triggerTop + triggerHeight / 2, width, triggerHeight);
      this.pitZones.add(zone);
    });
  }

  createPlayer() {
    const [col, surfaceRow] = LEVEL.checkpoints[0];
    this.spawnPoint = { x: col * TILE + TILE / 2 + TILE, y: surfaceRow * TILE - 12 };

    this.player = new Player(this, this.spawnPoint.x, this.spawnPoint.y, {
      canDropThrough: () => this.isStandingOnlyOnPlatforms(),
    });

    // Ignore one-way platforms while the player is dropping through them.
    this.physics.add.collider(this.player, this.groundLayer, null, (player, tile) =>
      !(tile.index === TILE_INDEX.PLATFORM && player.isDroppingThrough()), this);

    this.physics.add.overlap(this.player, this.pitZones, this.onPitFall, null, this);
    this.physics.add.overlap(this.player, this.dummies, this.onDummyContact, null, this);
    this.physics.add.overlap(this.player, this.checkpoints, this.onCheckpoint, null, this);

    // Activate the spawn checkpoint without a banner.
    this.activateCheckpoint(this.checkpoints.getChildren()[0], true);
  }

  createCamera() {
    const cam = this.cameras.main;
    cam.setBounds(0, 0, this.worldWidth, this.worldHeight);
    cam.setRoundPixels(true);
    cam.startFollow(this.player, true, CAMERA_LERP_X, CAMERA_LERP_Y);
    cam.setDeadzone(20, 40);
  }

  createDebugToggle() {
    // Backtick (`) toggles arcade physics debug drawing.
    this.input.keyboard.on('keydown-BACKTICK', () => {
      const world = this.physics.world;
      if (!world.debugGraphic) world.createDebugGraphic();
      world.drawDebug = !world.drawDebug;
      world.debugGraphic.clear();
      world.debugGraphic.setVisible(world.drawDebug);
    });
  }

  // --- Queries --------------------------------------------------------------

  /** True when every tile under the player's feet is a one-way platform. */
  isStandingOnlyOnPlatforms() {
    const body = this.player.body;
    const y = body.bottom + 1;
    let sawPlatform = false;
    for (const x of [body.left + 1, body.right - 1]) {
      const tile = this.groundLayer.getTileAtWorldXY(x, y);
      if (!tile) continue;
      if (tile.index === TILE_INDEX.PLATFORM) sawPlatform = true;
      else if (tile.collides) return false;
    }
    return sawPlatform;
  }

  // --- Interactions ---------------------------------------------------------

  onPitFall() {
    if (this.respawning) return;
    const result = this.player.takeDamage(PIT_DAMAGE, null, { ignoreInvulnerability: true, knockback: false });
    this.respawnPlayer(result.died);
  }

  onDummyContact(player, dummy) {
    const now = this.time.now;
    if (this.respawning || now < dummy.getData('cooldownUntil')) return;

    if (player.isDashing()) {
      // Dash i-frames: phase straight through and make the dummy react.
      this.flashDummy(dummy, PALETTE.cyan);
      dummy.setData('cooldownUntil', now + 250);
      return;
    }

    const result = player.takeDamage(DUMMY_DAMAGE, dummy.x);
    if (!result.applied) return;
    this.flashDummy(dummy, PALETTE.white);
    dummy.setData('cooldownUntil', now + 250);
    if (result.died) this.respawnPlayer(true);
  }

  flashDummy(dummy, color) {
    const homeX = dummy.getData('homeX');
    dummy.setTintFill(color);
    this.tweens.killTweensOf(dummy);
    dummy.x = homeX;
    this.tweens.add({
      targets: dummy,
      x: { from: homeX + 2, to: homeX },
      duration: 160,
      ease: 'Bounce.easeOut',
      onUpdate: () => { dummy.x = Math.round(dummy.x); },
      onComplete: () => dummy.clearTint(),
    });
  }

  onCheckpoint(player, checkpoint) {
    if (!checkpoint.getData('active')) this.activateCheckpoint(checkpoint, false);
  }

  activateCheckpoint(checkpoint, silent) {
    if (this.activeCheckpoint && this.activeCheckpoint !== checkpoint) {
      this.activeCheckpoint.setData('active', false);
      this.activeCheckpoint.setTexture('checkpoint_off');
    }
    checkpoint.setData('active', true);
    checkpoint.setTexture('checkpoint_on');
    this.activeCheckpoint = checkpoint;
    this.spawnPoint = { x: checkpoint.x + TILE, y: checkpoint.y + TILE / 2 - 12 };
    if (!silent) this.game.events.emit('checkpoint:activated', checkpoint.getData('index'));
  }

  /** Fade out, move the player to the active checkpoint, fade back in. */
  respawnPlayer(fullHeal) {
    if (this.respawning) return;
    this.respawning = true;
    this.player.freeze();

    const cam = this.cameras.main;
    cam.fadeOut(180, 26, 28, 44);
    cam.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      if (fullHeal) this.player.restoreFullHealth();
      this.player.respawn(this.spawnPoint.x, this.spawnPoint.y);
      this.lookAhead = 0;
      cam.setFollowOffset(0, 0);
      cam.startFollow(this.player, true, CAMERA_LERP_X, CAMERA_LERP_Y); // snap to the player
      cam.fadeIn(220, 26, 28, 44);
      this.game.events.emit('player:respawn');
      this.respawning = false;
    });
  }

  // --- Frame update ---------------------------------------------------------

  update(time, delta) {
    this.player.update(time, delta);

    // Failsafe in case the player ever slips past a pit trigger.
    if (!this.respawning && this.player.body.enable && this.player.y > this.worldHeight + 64) {
      this.onPitFall();
    }

    const cam = this.cameras.main;

    // Smooth look-ahead in the facing direction.
    const targetLook = this.player.facing * LOOK_AHEAD_PX;
    this.lookAhead += (targetLook - this.lookAhead) * Math.min(1, delta / 250);
    cam.setFollowOffset(-Math.round(this.lookAhead), 0);

    // Parallax, snapped to whole pixels to keep the art crisp.
    this.parallax.forEach((layer) => {
      layer.sprite.tilePositionX = Math.round(cam.scrollX * layer.fx);
      layer.sprite.y = layer.baseY - Math.round(cam.scrollY * layer.fy);
    });
  }
}
