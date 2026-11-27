// InputSystem: shared virtual-controller state.
//
// The touchscreen HUD (UIScene) writes to it; gameplay entities (Player) read
// from it. Neither side knows about the other, so touch controls can be
// restyled or replaced without touching entity code. One instance lives in the
// game registry under 'virtualInput'.
//
// Button presses are latched: a tap shorter than one frame still registers,
// because the reader consumes the "pressed" flag on its next update.

export default class InputSystem {
  constructor() {
    this.reset();
  }

  /** Clears every axis, held button and pending press (e.g. on blur or respawn). */
  reset() {
    this.axisX = 0; // -1, 0, 1
    this.axisY = 0; // -1 (up), 0, 1 (down)
    this.jumpHeld = false;
    this.jumpPressed = false;
    this.dashPressed = false;
  }

  // --- Writer side (touch HUD) ------------------------------------------------

  setAxis(x, y) {
    this.axisX = Math.sign(x);
    this.axisY = Math.sign(y);
  }

  pressJump() {
    this.jumpPressed = true;
    this.jumpHeld = true;
  }

  releaseJump() {
    this.jumpHeld = false;
  }

  pressDash() {
    this.dashPressed = true;
  }

  // --- Reader side (entities) -------------------------------------------------

  consumeJumpPressed() {
    const pressed = this.jumpPressed;
    this.jumpPressed = false;
    return pressed;
  }

  consumeDashPressed() {
    const pressed = this.dashPressed;
    this.dashPressed = false;
    return pressed;
  }

  /** Drops latched presses without touching held state (used while frozen). */
  clearPresses() {
    this.jumpPressed = false;
    this.dashPressed = false;
  }
}
