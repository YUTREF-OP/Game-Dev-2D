// UIScene: HUD and touchscreen controller, running in parallel with WorldScene.
// It listens to the global event bus (game.events) for player status and
// writes touch input into the shared InputSystem ('virtualInput' in the
// registry). It never reaches into world entities.
//
// Touch layout (mobile is the primary platform):
//   left half  - floating joystick: appears under the thumb, 8-way
//   right side - JUMP (hold for higher jumps) and DASH buttons
//   top right  - fullscreen toggle (where the browser supports it)

import { PALETTE } from './BootScene.js';
import { PLAYER_STATE } from '../entities/Player.js';

const BAR = Object.freeze({ x: 18, y: 6, w: 60, h: 5 });
const DASH_BAR = Object.freeze({ x: 26, y: 27, w: 24, h: 3 });

const TOUCH = Object.freeze({
  STICK_ZONE_MAX_X: 160, // touches left of this spawn the joystick
  STICK_RADIUS: 16, // max knob travel from the base centre
  STICK_DEADZONE: 5, // px of travel before a direction registers
  STICK_FOLLOW: 10, // extra px past the radius before the base follows the thumb
  STICK_REST: Object.freeze({ x: 40, y: 140 }), // where the idle stick is shown
  JUMP: Object.freeze({ x: 290, y: 148, hitRadius: 26 }),
  DASH: Object.freeze({ x: 252, y: 158, hitRadius: 22 }),
  IDLE_ALPHA: 0.4,
  ACTIVE_ALPHA: 0.9,
});

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

    this.createTouchControls();

    this.hint = this.add.bitmapText(160, 44, 'pixel',
      'DRAG LEFT SIDE: MOVE    BUTTONS: JUMP / DASH\nSTICK DOWN + JUMP: DROP THROUGH PLATFORMS')
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
    // Losing focus or hiding the tab must not leave a direction or button stuck.
    bus.on(Phaser.Core.Events.BLUR, this.resetTouch, this);
    bus.on(Phaser.Core.Events.HIDDEN, this.resetTouch, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      Object.entries(listeners).forEach(([event, fn]) => bus.off(event, fn, this));
      bus.off(Phaser.Core.Events.BLUR, this.resetTouch, this);
      bus.off(Phaser.Core.Events.HIDDEN, this.resetTouch, this);
      this.vinput?.reset(); // HUD objects are already gone; just release the controller
    });

    // Ask the world to push the current player snapshot.
    bus.emit('ui:ready');
  }

  // --- Touch controls -------------------------------------------------------

  createTouchControls() {
    this.vinput = this.registry.get('virtualInput');
    this.stickPointerId = null;
    this.jumpPointerId = null;
    this.dashPointerId = null;
    this.stickOrigin = { ...TOUCH.STICK_REST };

    const depth = 50;
    this.stickBase = this.add.image(TOUCH.STICK_REST.x, TOUCH.STICK_REST.y, 'touch_stick_base')
      .setDepth(depth).setAlpha(TOUCH.IDLE_ALPHA);
    this.stickKnob = this.add.image(TOUCH.STICK_REST.x, TOUCH.STICK_REST.y, 'touch_stick_knob')
      .setDepth(depth + 1).setAlpha(TOUCH.IDLE_ALPHA);
    this.jumpButton = this.add.image(TOUCH.JUMP.x, TOUCH.JUMP.y, 'touch_btn_jump')
      .setDepth(depth).setAlpha(TOUCH.IDLE_ALPHA);
    this.dashButton = this.add.image(TOUCH.DASH.x, TOUCH.DASH.y, 'touch_btn_dash')
      .setDepth(depth).setAlpha(TOUCH.IDLE_ALPHA);
    this.jumpButton.setData('restY', TOUCH.JUMP.y);
    this.dashButton.setData('restY', TOUCH.DASH.y);

    this.fullscreenButton = null;
    if (this.scale.fullscreen.available) {
      this.fullscreenButton = this.add.image(302, 4, 'touch_btn_fullscreen')
        .setOrigin(0).setDepth(depth).setAlpha(0.6);
      // Phones usually allow an orientation lock only while fullscreen.
      this.scale.on(Phaser.Scale.Events.ENTER_FULLSCREEN, this.lockLandscape, this);
      this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
        this.scale.off(Phaser.Scale.Events.ENTER_FULLSCREEN, this.lockLandscape, this);
      });
    }

    this.input.on(Phaser.Input.Events.POINTER_DOWN, this.onPointerDown, this);
    this.input.on(Phaser.Input.Events.POINTER_MOVE, this.onPointerMove, this);
    this.input.on(Phaser.Input.Events.POINTER_UP, this.onPointerUp, this);
    this.input.on(Phaser.Input.Events.POINTER_UP_OUTSIDE, this.onPointerUp, this);
  }

  /** Returns 'jump', 'dash' or null for the nearest button under (x, y). */
  buttonAt(x, y) {
    const dJump = Math.hypot(x - TOUCH.JUMP.x, y - TOUCH.JUMP.y);
    const dDash = Math.hypot(x - TOUCH.DASH.x, y - TOUCH.DASH.y);
    const inJump = dJump <= TOUCH.JUMP.hitRadius;
    const inDash = dDash <= TOUCH.DASH.hitRadius;
    if (inJump && inDash) return dJump <= dDash ? 'jump' : 'dash';
    if (inJump) return 'jump';
    if (inDash) return 'dash';
    return null;
  }

  hitsFullscreenButton(x, y) {
    if (!this.fullscreenButton) return false;
    const b = this.fullscreenButton;
    return x >= b.x - 6 && x <= b.x + b.width + 6 && y >= b.y - 6 && y <= b.y + b.height + 6;
  }

  onPointerDown(pointer) {
    const { x, y } = pointer;
    if (this.hitsFullscreenButton(x, y)) return; // toggled on pointer up (browser rule)

    const button = this.buttonAt(x, y);
    if (button === 'jump') {
      if (this.jumpPointerId === null) {
        this.jumpPointerId = pointer.id;
        this.vinput.pressJump();
        this.setButtonPressed(this.jumpButton, true);
      }
      return;
    }
    if (button === 'dash') {
      if (this.dashPointerId === null) {
        this.dashPointerId = pointer.id;
        this.vinput.pressDash();
        this.setButtonPressed(this.dashButton, true);
      }
      return;
    }

    if (x < TOUCH.STICK_ZONE_MAX_X && this.stickPointerId === null) {
      this.stickPointerId = pointer.id;
      this.stickOrigin = { x: Phaser.Math.Clamp(x, 22, 200), y: Phaser.Math.Clamp(y, 22, 158) };
      this.stickBase.setPosition(Math.round(this.stickOrigin.x), Math.round(this.stickOrigin.y));
      this.stickBase.setAlpha(TOUCH.ACTIVE_ALPHA);
      this.stickKnob.setAlpha(TOUCH.ACTIVE_ALPHA);
      this.updateStick(x, y);
    }
  }

  onPointerMove(pointer) {
    if (pointer.id === this.stickPointerId) this.updateStick(pointer.x, pointer.y);
  }

  onPointerUp(pointer) {
    if (pointer.id === this.stickPointerId) {
      this.releaseStick();
    } else if (pointer.id === this.jumpPointerId) {
      this.jumpPointerId = null;
      this.vinput.releaseJump();
      this.setButtonPressed(this.jumpButton, false);
    } else if (pointer.id === this.dashPointerId) {
      this.dashPointerId = null;
      this.setButtonPressed(this.dashButton, false);
    } else if (this.hitsFullscreenButton(pointer.x, pointer.y)) {
      this.toggleFullscreen();
    }
  }

  updateStick(x, y) {
    let dx = x - this.stickOrigin.x;
    let dy = y - this.stickOrigin.y;
    let dist = Math.hypot(dx, dy);

    // Let the base trail a thumb that slides far past the ring.
    const followAt = TOUCH.STICK_RADIUS + TOUCH.STICK_FOLLOW;
    if (dist > followAt) {
      const shift = (dist - followAt) / dist;
      this.stickOrigin.x = Phaser.Math.Clamp(this.stickOrigin.x + dx * shift, 22, 200);
      this.stickOrigin.y = Phaser.Math.Clamp(this.stickOrigin.y + dy * shift, 22, 158);
      this.stickBase.setPosition(Math.round(this.stickOrigin.x), Math.round(this.stickOrigin.y));
      dx = x - this.stickOrigin.x;
      dy = y - this.stickOrigin.y;
      dist = Math.hypot(dx, dy);
    }

    const clamp = dist > TOUCH.STICK_RADIUS ? TOUCH.STICK_RADIUS / dist : 1;
    this.stickKnob.setPosition(
      Math.round(this.stickOrigin.x + dx * clamp),
      Math.round(this.stickOrigin.y + dy * clamp),
    );

    if (dist < TOUCH.STICK_DEADZONE) {
      this.vinput.setAxis(0, 0);
      return;
    }
    // Snap to 8 directions: horizontal drags run, near-vertical drags aim dashes / drop.
    const angle = Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) * (Math.PI / 4);
    this.vinput.setAxis(Math.round(Math.cos(angle)), Math.round(Math.sin(angle)));
  }

  releaseStick() {
    this.stickPointerId = null;
    this.vinput.setAxis(0, 0);
    this.stickOrigin = { ...TOUCH.STICK_REST };
    this.stickBase.setPosition(TOUCH.STICK_REST.x, TOUCH.STICK_REST.y).setAlpha(TOUCH.IDLE_ALPHA);
    this.stickKnob.setPosition(TOUCH.STICK_REST.x, TOUCH.STICK_REST.y).setAlpha(TOUCH.IDLE_ALPHA);
  }

  setButtonPressed(button, pressed) {
    // A 1px press-down plus brighter alpha; no scaling, so pixels stay crisp.
    button.setAlpha(pressed ? TOUCH.ACTIVE_ALPHA : TOUCH.IDLE_ALPHA);
    button.y = button.getData('restY') + (pressed ? 1 : 0);
  }

  resetTouch() {
    if (!this.vinput) return;
    this.vinput.reset();
    this.releaseStick();
    this.jumpPointerId = null;
    this.dashPointerId = null;
    this.setButtonPressed(this.jumpButton, false);
    this.setButtonPressed(this.dashButton, false);
  }

  toggleFullscreen() {
    if (this.scale.isFullscreen) this.scale.stopFullscreen();
    else this.scale.startFullscreen();
  }

  lockLandscape() {
    const orientation = window.screen && window.screen.orientation;
    if (orientation && typeof orientation.lock === 'function') {
      orientation.lock('landscape').catch(() => { /* not supported here; the CSS rotate hint covers it */ });
    }
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
