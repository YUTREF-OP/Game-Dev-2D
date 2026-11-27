// Player: platformer controller with acceleration-based running, variable jump
// height, coyote time, jump buffering, one-way platform drop-through and an
// 8-directional dash with invulnerability frames.
//
// Input comes from two sources that are merged every frame: the touchscreen
// virtual controller (InputSystem, written by UIScene; the primary controller on
// mobile) and the keyboard (desktop development fallback).
//
// The player never touches UI code. It reports changes on the global event bus
// (scene.game.events) and UIScene listens:
//   'player:hp'    (hp, maxHp)
//   'player:state' (state)          one of PLAYER_STATE
//   'player:dash'  (cooldownMs)     emitted when a dash starts
//   'player:died'  ()

export const PLAYER_STATE = Object.freeze({
  IDLE: 'IDLE',
  RUN: 'RUN',
  JUMP: 'JUMP',
  DASH: 'DASH',
});

// All feel-related numbers live here (pixels, pixels/second, milliseconds).
export const PLAYER_TUNING = Object.freeze({
  MAX_HP: 100,

  RUN_SPEED: 110,
  GROUND_ACCEL: 1200,
  GROUND_DECEL: 1500,
  TURN_ACCEL: 2400,
  AIR_ACCEL: 800,
  AIR_DECEL: 420,

  JUMP_VELOCITY: 320,
  JUMP_CUT_MULTIPLIER: 0.45, // vertical speed kept when jump is released early
  JUMP_MIN_HOLD_MS: 70, // a quick touch tap still gives a usable hop
  APEX_THRESHOLD: 40, // |vy| below this while holding jump = floaty apex
  APEX_GRAVITY_EXTRA: -350, // added to world gravity at the apex
  FALL_GRAVITY_EXTRA: 600, // added to world gravity while falling
  MAX_FALL_SPEED: 300,
  MAX_SPEED_X: 320,

  COYOTE_MS: 100,
  JUMP_BUFFER_MS: 120,

  DASH_SPEED: 280,
  DASH_MS: 140,
  DASH_COOLDOWN_MS: 450,
  DASH_IFRAMES_MS: 220,
  DASH_GHOST_INTERVAL_MS: 24,
  DASH_EXIT_UP_SCALE: 0.45, // fraction of upward dash speed kept after the dash

  HURT_IFRAMES_MS: 900,
  HURT_STUN_MS: 220,
  HURT_KNOCKBACK_X: 150,
  HURT_KNOCKBACK_Y: 170,
  RESPAWN_IFRAMES_MS: 900,

  DROP_THROUGH_MS: 220,
});

const T = PLAYER_TUNING;
const GHOST_TINT = 0x73eff7;
const DUST_TINT = 0x94b0c2;

function approach(value, target, maxDelta) {
  if (value < target) return Math.min(value + maxDelta, target);
  if (value > target) return Math.max(value - maxDelta, target);
  return target;
}

export default class Player extends Phaser.Physics.Arcade.Sprite {
  /**
   * @param {Phaser.Scene} scene
   * @param {number} x
   * @param {number} y
   * @param {object} [options]
   * @param {() => boolean} [options.canDropThrough] returns true when the player
   *        is standing only on one-way platforms (supplied by the level).
   * @param {import('../systems/InputSystem.js').default} [options.virtualInput]
   *        shared touch-controller state (supplied by the scene from the registry).
   */
  constructor(scene, x, y, options = {}) {
    super(scene, x, y, 'player', 'idle0');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.bus = scene.game.events;
    this.canDropThrough = options.canDropThrough ?? (() => false);
    this.virtualInput = options.virtualInput ?? null;

    this.setDepth(10);
    this.body.setSize(8, 21);
    this.body.setOffset(4, 3);
    this.body.setMaxVelocity(T.MAX_SPEED_X, T.MAX_FALL_SPEED);
    this.setCollideWorldBounds(true);

    this.keys = scene.input.keyboard.addKeys({
      left: Phaser.Input.Keyboard.KeyCodes.LEFT,
      right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
      up: Phaser.Input.Keyboard.KeyCodes.UP,
      down: Phaser.Input.Keyboard.KeyCodes.DOWN,
      a: Phaser.Input.Keyboard.KeyCodes.A,
      d: Phaser.Input.Keyboard.KeyCodes.D,
      w: Phaser.Input.Keyboard.KeyCodes.W,
      s: Phaser.Input.Keyboard.KeyCodes.S,
      space: Phaser.Input.Keyboard.KeyCodes.SPACE,
      shift: Phaser.Input.Keyboard.KeyCodes.SHIFT,
    });

    this.hp = T.MAX_HP;
    this.maxHp = T.MAX_HP;
    this.facing = 1;
    this.moveState = PLAYER_STATE.IDLE;
    this.dead = false;

    // Timers are absolute scene times (ms). -Infinity = "never happened".
    this.lastGroundedAt = -Infinity;
    this.jumpBufferedAt = -Infinity;
    this.jumpCutAvailable = false;
    this.jumpStartedAt = -Infinity;
    this.dashEndsAt = 0;
    this.dashReadyAt = 0;
    this.nextGhostAt = 0;
    this.airDashAvailable = true;
    this.dashDir = { x: 1, y: 0 };
    this.invulnerableUntil = 0;
    this.blinkUntil = 0;
    this.stunnedUntil = 0;
    this.dropThroughUntil = 0;
    this.wasOnGround = false;
    this.prevVelocityY = 0;

    this.play('player-idle');
  }

  // --- Public API -----------------------------------------------------------

  isDashing() {
    return this.moveState === PLAYER_STATE.DASH;
  }

  isInvulnerable(time = this.scene.time.now) {
    return time < this.invulnerableUntil;
  }

  isDroppingThrough(time = this.scene.time.now) {
    return time < this.dropThroughUntil;
  }

  /** Re-emits every HUD-relevant value (used when the UI scene (re)starts). */
  broadcast() {
    this.bus.emit('player:hp', this.hp, this.maxHp);
    this.bus.emit('player:state', this.moveState);
  }

  /**
   * @param {number} amount
   * @param {number|null} sourceX world x of the damage source (for knockback), or null
   * @param {{ignoreInvulnerability?: boolean, knockback?: boolean}} [opts]
   * @returns {{applied: boolean, died: boolean}}
   */
  takeDamage(amount, sourceX, opts = {}) {
    const now = this.scene.time.now;
    if (this.dead || (!opts.ignoreInvulnerability && this.isInvulnerable(now))) {
      return { applied: false, died: false };
    }

    this.hp = Math.max(0, this.hp - amount);
    this.bus.emit('player:hp', this.hp, this.maxHp);

    if (this.hp === 0) {
      this.dead = true;
      this.bus.emit('player:died');
      return { applied: true, died: true };
    }

    this.invulnerableUntil = now + T.HURT_IFRAMES_MS;
    this.blinkUntil = now + T.HURT_IFRAMES_MS;

    if (opts.knockback !== false && this.body.enable) {
      if (this.isDashing()) this.endDash(false);
      const dir = sourceX === null || sourceX === undefined ? -this.facing : Math.sign(this.x - sourceX) || -this.facing;
      this.setVelocity(dir * T.HURT_KNOCKBACK_X, -T.HURT_KNOCKBACK_Y);
      this.stunnedUntil = now + T.HURT_STUN_MS;
      this.jumpCutAvailable = false;
    }
    this.scene.cameras.main.shake(90, 0.004);
    return { applied: true, died: false };
  }

  restoreFullHealth() {
    this.hp = this.maxHp;
    this.dead = false;
    this.bus.emit('player:hp', this.hp, this.maxHp);
  }

  /** Hides the player and stops physics (used while the screen fades out). */
  freeze() {
    if (this.isDashing()) this.endDash(false);
    this.disableBody(false, true);
  }

  /** Places the player at (x, y) with feet on the ground and fresh state. */
  respawn(x, y) {
    const now = this.scene.time.now;
    this.enableBody(true, x, y, true, true);
    this.body.setAllowGravity(true);
    this.setVelocity(0, 0);
    this.body.setGravityY(0);
    this.setAlpha(1);
    this.dashEndsAt = 0;
    this.dashReadyAt = 0;
    this.airDashAvailable = true;
    this.stunnedUntil = 0;
    this.dropThroughUntil = 0;
    this.lastGroundedAt = -Infinity;
    this.jumpBufferedAt = -Infinity;
    this.jumpCutAvailable = false;
    this.invulnerableUntil = now + T.RESPAWN_IFRAMES_MS;
    this.blinkUntil = now + T.RESPAWN_IFRAMES_MS;
    this.setMoveState(PLAYER_STATE.IDLE);
  }

  // --- Frame update ---------------------------------------------------------

  update(time, delta) {
    if (!this.body.enable) {
      // Frozen (respawn fade): drop taps so they don't fire after respawning.
      this.virtualInput?.clearPresses();
      return;
    }

    const dt = Math.min(delta, 50) / 1000; // clamp so a lag spike can't teleport us
    const body = this.body;
    const onGround = body.blocked.down || body.touching.down;
    const input = this.readInput(time);

    if (onGround) {
      this.lastGroundedAt = time;
      if (!this.isDashing()) this.airDashAvailable = true;
      if (!this.wasOnGround && this.prevVelocityY > 160) this.spawnDust(3);
    }

    if (input.jumpPressed) this.jumpBufferedAt = time;

    if (this.isDashing()) {
      this.updateDash(time, input, onGround);
    } else if (input.dashPressed && this.canDash(time, onGround)) {
      this.startDash(time, input, onGround);
    } else {
      this.updateMovement(time, dt, input, onGround);
    }

    this.updateFacing(input);
    this.updateState(onGround, input);
    this.updateVisuals(time);

    this.wasOnGround = onGround;
    this.prevVelocityY = body.velocity.y;
  }

  readInput(time) {
    const k = this.keys;
    const v = this.virtualInput;
    const JustDown = Phaser.Input.Keyboard.JustDown;

    // Read (and so consume) every press flag each frame, even while stunned,
    // so no stale press leaks into a later frame.
    const keyJump = [JustDown(k.space), JustDown(k.w), JustDown(k.up)].some(Boolean);
    const keyDash = JustDown(k.shift);
    const touchJump = v ? v.consumeJumpPressed() : false;
    const touchDash = v ? v.consumeDashPressed() : false;

    if (time < this.stunnedUntil) {
      return { x: 0, y: 0, jumpPressed: false, jumpHeld: false, dashPressed: false, down: false };
    }

    const keyX = (k.right.isDown || k.d.isDown ? 1 : 0) - (k.left.isDown || k.a.isDown ? 1 : 0);
    const keyY = (k.down.isDown || k.s.isDown ? 1 : 0) - (k.up.isDown || k.w.isDown ? 1 : 0);
    const x = Phaser.Math.Clamp(keyX + (v ? v.axisX : 0), -1, 1);
    const y = Phaser.Math.Clamp(keyY + (v ? v.axisY : 0), -1, 1);

    return {
      x,
      y,
      jumpPressed: keyJump || touchJump,
      jumpHeld: k.space.isDown || k.w.isDown || k.up.isDown || (v ? v.jumpHeld : false),
      dashPressed: keyDash || touchDash,
      down: y > 0,
    };
  }

  updateMovement(time, dt, input, onGround) {
    const body = this.body;
    const stunned = time < this.stunnedUntil;

    // Horizontal: accelerate toward the target speed; turning around is snappier.
    if (!stunned) {
      const target = input.x * T.RUN_SPEED;
      let accel;
      if (onGround) {
        if (input.x === 0) accel = T.GROUND_DECEL;
        else if (body.velocity.x !== 0 && Math.sign(body.velocity.x) !== input.x) accel = T.TURN_ACCEL;
        else accel = T.GROUND_ACCEL;
      } else {
        accel = input.x === 0 ? T.AIR_DECEL : T.AIR_ACCEL;
      }
      body.setVelocityX(approach(body.velocity.x, target, accel * dt));
    }

    const buffered = time - this.jumpBufferedAt <= T.JUMP_BUFFER_MS;
    const coyote = time - this.lastGroundedAt <= T.COYOTE_MS;

    if (buffered && input.down && onGround && this.canDropThrough()) {
      // Down + Jump on a one-way platform drops through it instead of jumping.
      this.jumpBufferedAt = -Infinity;
      this.dropThroughUntil = time + T.DROP_THROUGH_MS;
      this.lastGroundedAt = -Infinity;
      body.setVelocityY(40);
    } else if (buffered && coyote) {
      this.jump();
    }

    // Variable jump height: releasing jump while rising cuts the ascent.
    if (this.jumpCutAvailable && !input.jumpHeld && body.velocity.y < 0
      && time - this.jumpStartedAt >= T.JUMP_MIN_HOLD_MS) {
      body.setVelocityY(body.velocity.y * T.JUMP_CUT_MULTIPLIER);
      this.jumpCutAvailable = false;
    }
    if (body.velocity.y >= 0) this.jumpCutAvailable = false;

    // Gravity shaping: floaty apex while holding jump, heavier fall.
    if (body.velocity.y > T.APEX_THRESHOLD || (!onGround && body.velocity.y > 0 && !input.jumpHeld)) {
      body.setGravityY(T.FALL_GRAVITY_EXTRA);
    } else if (!onGround && input.jumpHeld && Math.abs(body.velocity.y) < T.APEX_THRESHOLD) {
      body.setGravityY(T.APEX_GRAVITY_EXTRA);
    } else {
      body.setGravityY(0);
    }
  }

  jump() {
    this.jumpStartedAt = this.scene.time.now;
    this.body.setVelocityY(-T.JUMP_VELOCITY);
    this.jumpBufferedAt = -Infinity;
    this.lastGroundedAt = -Infinity; // consume coyote time so it can't double-jump
    this.jumpCutAvailable = true;
    this.body.setGravityY(0);
    this.spawnDust(2);
  }

  canDash(time, onGround) {
    return time >= this.dashReadyAt && (onGround || this.airDashAvailable);
  }

  startDash(time, input, onGround) {
    let dx = input.x;
    let dy = input.y;
    if (onGround && dy > 0) dy = 0; // can't dash into the floor
    if (dx === 0 && dy === 0) dx = this.facing;
    const len = Math.hypot(dx, dy);
    this.dashDir = { x: dx / len, y: dy / len };

    this.dashEndsAt = time + T.DASH_MS;
    this.dashReadyAt = time + T.DASH_COOLDOWN_MS;
    this.nextGhostAt = time;
    this.invulnerableUntil = Math.max(this.invulnerableUntil, time + T.DASH_IFRAMES_MS);
    if (!onGround) this.airDashAvailable = false;
    this.jumpCutAvailable = false;

    this.body.setAllowGravity(false);
    this.body.setGravityY(0);
    this.body.setVelocity(this.dashDir.x * T.DASH_SPEED, this.dashDir.y * T.DASH_SPEED);
    if (this.dashDir.x !== 0) this.facing = Math.sign(this.dashDir.x);

    this.setMoveState(PLAYER_STATE.DASH);
    this.bus.emit('player:dash', T.DASH_COOLDOWN_MS);
  }

  updateDash(time, input, onGround) {
    // Dash-jump: a buffered jump while grounded cancels the dash and keeps momentum.
    const buffered = time - this.jumpBufferedAt <= T.JUMP_BUFFER_MS;
    if (buffered && (onGround || time - this.lastGroundedAt <= T.COYOTE_MS)) {
      this.endDash(true);
      this.jump();
      return;
    }

    if (time >= this.dashEndsAt) {
      this.endDash(true);
      return;
    }

    // Hold dash velocity constant (collisions may have zeroed an axis).
    this.body.setVelocity(this.dashDir.x * T.DASH_SPEED, this.dashDir.y * T.DASH_SPEED);

    if (time >= this.nextGhostAt) {
      this.spawnGhost();
      this.nextGhostAt = time + T.DASH_GHOST_INTERVAL_MS;
    }
  }

  endDash(keepMomentum) {
    this.body.setAllowGravity(true);
    if (keepMomentum) {
      const vx = this.dashDir.x * Math.max(T.RUN_SPEED, Math.abs(this.body.velocity.x) * 0.6);
      const vy = this.dashDir.y < 0 ? this.dashDir.y * T.DASH_SPEED * T.DASH_EXIT_UP_SCALE : this.body.velocity.y * 0.5;
      this.body.setVelocity(vx, vy);
    }
    this.dashEndsAt = 0;
    this.setMoveState(PLAYER_STATE.JUMP); // corrected by updateState on the same frame
  }

  updateFacing(input) {
    if (!this.isDashing() && input.x !== 0 && this.scene.time.now >= this.stunnedUntil) {
      this.facing = input.x;
    }
    this.setFlipX(this.facing < 0);
  }

  updateState(onGround, input) {
    if (this.isDashing()) return;
    let next;
    if (!onGround) next = PLAYER_STATE.JUMP;
    else if (Math.abs(this.body.velocity.x) > 12 || input.x !== 0) next = PLAYER_STATE.RUN;
    else next = PLAYER_STATE.IDLE;
    this.setMoveState(next);
  }

  setMoveState(next) {
    if (next === this.moveState) return this;
    this.moveState = next;
    this.bus.emit('player:state', next);
    return this;
  }

  updateVisuals(time) {
    let anim;
    switch (this.moveState) {
      case PLAYER_STATE.DASH: anim = 'player-dash'; break;
      case PLAYER_STATE.JUMP: anim = this.body.velocity.y < 0 ? 'player-jump' : 'player-fall'; break;
      case PLAYER_STATE.RUN: anim = 'player-run'; break;
      default: anim = 'player-idle';
    }
    this.anims.play(anim, true);
    this.anims.timeScale = this.moveState === PLAYER_STATE.RUN
      ? Phaser.Math.Clamp(Math.abs(this.body.velocity.x) / T.RUN_SPEED, 0.6, 1.4)
      : 1;

    // Blink only for hurt/respawn i-frames; dash i-frames show the ghost trail instead.
    this.setAlpha(time < this.blinkUntil && Math.floor(time / 60) % 2 === 0 ? 0.3 : 1);
  }

  // --- Effects --------------------------------------------------------------

  spawnGhost() {
    const ghost = this.scene.add.image(this.x, this.y, 'player', this.frame.name)
      .setFlipX(this.flipX)
      .setDepth(this.depth - 1)
      .setTintFill(GHOST_TINT)
      .setAlpha(0.65);
    this.scene.tweens.add({
      targets: ghost,
      alpha: 0,
      duration: 180,
      onComplete: () => ghost.destroy(),
    });
  }

  spawnDust(count) {
    const footY = this.body.bottom - 1;
    for (let i = 0; i < count; i += 1) {
      const dir = i % 2 === 0 ? -1 : 1;
      const puff = this.scene.add.image(Math.round(this.x + dir * (2 + i)), footY, 'px')
        .setTint(DUST_TINT)
        .setDepth(this.depth - 1);
      this.scene.tweens.add({
        targets: puff,
        x: puff.x + dir * (6 + i * 2),
        y: footY - 3 - i,
        alpha: 0,
        duration: 260,
        onComplete: () => puff.destroy(),
      });
    }
  }
}
