// UIScene: HUD running in parallel with WorldScene. It only listens to the
// global event bus (game.events) and never reaches into world entities.

import { PALETTE } from './BootScene.js';
import { PLAYER_STATE } from '../entities/Player.js';

const BAR = Object.freeze({ x: 18, y: 6, w: 60, h: 5 });
const DASH_BAR = Object.freeze({ x: 26, y: 27, w: 24, h: 3 });

const STATE_COLORS = Object.freeze({
  [PLAYER_STATE.IDLE]: PALETTE.silver,
  [PLAYER_STATE.RUN]: PALETTE.lime,
  [PLAYER_STATE.JUMP]: PALETTE.yellow,
  [PLAYER_STATE.DASH]: PALETTE.cyan,
});

export default class UIScene extends Phaser.Scene {
  constructor() {
    super({ key: 'UIScene' });
  }

  create() {
    this.hp = 100;
    this.maxHp = 100;
    this.lagHp = 100; // trailing "damage taken" segment
    this.dashCooldownMs = 0;
    this.dashStartedAt = -Infinity;

    this.graphics = this.add.graphics();

    this.add.bitmapText(6, 6, 'pixel', 'HP').setTint(PALETTE.white);
    this.hpText = this.add.bitmapText(BAR.x + BAR.w + 4, BAR.y, 'pixel', '').setTint(PALETTE.white);

    this.add.bitmapText(6, 16, 'pixel', 'STATE').setTint(PALETTE.slate);
    this.stateText = this.add.bitmapText(28, 16, 'pixel', '');

    this.add.bitmapText(6, 26, 'pixel', 'DASH').setTint(PALETTE.slate);

    this.banner = this.add.bitmapText(160, 64, 'pixel', '').setOrigin(0.5).setAlpha(0);

    this.hint = this.add.bitmapText(160, 164, 'pixel',
      'A/D OR ARROWS: MOVE   SPACE/W: JUMP   SHIFT: DASH\nDOWN+JUMP: DROP THROUGH   `: PHYSICS DEBUG')
      .setOrigin(0.5, 0)
      .setCenterAlign()
      .setTint(PALETTE.silver);
    this.tweens.add({ targets: this.hint, alpha: 0, delay: 9000, duration: 1500 });

    this.onState(PLAYER_STATE.IDLE);
    this.refreshHpText();

    const bus = this.game.events;
    const listeners = {
      'player:hp': this.onHp,
      'player:state': this.onState,
      'player:dash': this.onDash,
      'player:died': this.onDied,
      'checkpoint:activated': this.onCheckpoint,
    };
    Object.entries(listeners).forEach(([event, fn]) => bus.on(event, fn, this));
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      Object.entries(listeners).forEach(([event, fn]) => bus.off(event, fn, this));
    });

    // Ask the world to push the current player snapshot.
    bus.emit('ui:ready');
  }

  // --- Event handlers -------------------------------------------------------

  onHp(hp, maxHp) {
    const tookDamage = hp < this.hp;
    if (!tookDamage) this.lagHp = hp; // heals snap the trailing bar
    this.hp = hp;
    this.maxHp = maxHp;
    this.refreshHpText();
    if (tookDamage) {
      this.hpText.setTint(PALETTE.red);
      this.time.delayedCall(200, () => this.hpText.setTint(PALETTE.white));
    }
  }

  onState(state) {
    this.stateText.setText(state);
    this.stateText.setTint(STATE_COLORS[state] ?? PALETTE.white);
  }

  onDash(cooldownMs) {
    this.dashCooldownMs = cooldownMs;
    this.dashStartedAt = this.time.now;
  }

  onDied() {
    this.showBanner('SYSTEM FAILURE - REBOOTING', PALETTE.red);
  }

  onCheckpoint() {
    this.showBanner('CHECKPOINT SAVED', PALETTE.cyan);
  }

  showBanner(text, color) {
    this.tweens.killTweensOf(this.banner);
    this.banner.setText(text).setTint(color).setAlpha(1);
    this.tweens.add({ targets: this.banner, alpha: 0, delay: 1100, duration: 400 });
  }

  refreshHpText() {
    this.hpText.setText(`${Math.ceil(this.hp)}/${this.maxHp}`);
  }

  // --- Drawing --------------------------------------------------------------

  update(time, delta) {
    // Trailing damage bar drains toward the real HP after a short beat.
    if (this.lagHp > this.hp) {
      this.lagHp = Math.max(this.hp, this.lagHp - (delta / 1000) * 40);
    }
    this.draw(time);
  }

  draw(time) {
    const g = this.graphics;
    g.clear();

    // HP bar: 1px outline, dark trough, white lag segment, coloured fill, top highlight.
    const ratio = this.maxHp > 0 ? this.hp / this.maxHp : 0;
    const lagRatio = this.maxHp > 0 ? this.lagHp / this.maxHp : 0;
    const fillW = Math.round(BAR.w * ratio);
    const lagW = Math.round(BAR.w * lagRatio);
    let fillColor = PALETTE.green;
    if (ratio <= 0.25) fillColor = PALETTE.red;
    else if (ratio <= 0.5) fillColor = PALETTE.yellow;

    g.fillStyle(PALETTE.black, 1);
    g.fillRect(BAR.x - 1, BAR.y - 1, BAR.w + 2, BAR.h + 2);
    g.fillStyle(PALETTE.charcoal, 1);
    g.fillRect(BAR.x, BAR.y, BAR.w, BAR.h);
    if (lagW > fillW) {
      g.fillStyle(PALETTE.white, 1);
      g.fillRect(BAR.x + fillW, BAR.y, lagW - fillW, BAR.h);
    }
    if (fillW > 0) {
      // Low HP pulses so it reads at a glance.
      const pulse = ratio <= 0.25 && Math.floor(time / 200) % 2 === 0;
      g.fillStyle(pulse ? PALETTE.orange : fillColor, 1);
      g.fillRect(BAR.x, BAR.y, fillW, BAR.h);
      g.fillStyle(PALETTE.white, 0.35);
      g.fillRect(BAR.x, BAR.y, fillW, 1);
    }
    // Segment ticks every 10%.
    g.fillStyle(PALETTE.black, 0.5);
    for (let i = 1; i < 10; i += 1) {
      g.fillRect(BAR.x + Math.round((BAR.w * i) / 10), BAR.y + BAR.h - 2, 1, 2);
    }

    // Dash readiness pip.
    const elapsed = time - this.dashStartedAt;
    const dashRatio = this.dashCooldownMs > 0 ? Phaser.Math.Clamp(elapsed / this.dashCooldownMs, 0, 1) : 1;
    g.fillStyle(PALETTE.black, 1);
    g.fillRect(DASH_BAR.x - 1, DASH_BAR.y - 1, DASH_BAR.w + 2, DASH_BAR.h + 2);
    g.fillStyle(PALETTE.charcoal, 1);
    g.fillRect(DASH_BAR.x, DASH_BAR.y, DASH_BAR.w, DASH_BAR.h);
    g.fillStyle(dashRatio >= 1 ? PALETTE.cyan : PALETTE.teal, 1);
    g.fillRect(DASH_BAR.x, DASH_BAR.y, Math.round(DASH_BAR.w * dashRatio), DASH_BAR.h);
  }
}
