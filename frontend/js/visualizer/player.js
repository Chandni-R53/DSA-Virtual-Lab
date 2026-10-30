/* ==========================================================
   PLAYER – next / prev / play / pause / reset / speed / jump.
   Written ONCE. Works for every algorithm because it only
   moves a number (the current step index) through a list of steps.
   ========================================================== */
class Player {
  // onChange(index, step, total) is called whenever the step changes
  constructor(onChange) {
    this.onChange = onChange;
    this.steps = [];
    this.index = 0;
    this.timer = null;
    this.delay = 800;          // milliseconds between steps while playing
    this.onPlayState = () => {};
  }

  get playing() { return this.timer !== null; }
  get last() { return this.steps.length - 1; }

  setSteps(steps) {            // load a fresh list of steps (e.g. after new input)
    this.pause();
    this.steps = steps;
    this.index = 0;
    this._emit();
  }

  goTo(i) {
    this.index = Math.max(0, Math.min(this.last, i));
    this._emit();
  }
  next()  { this.pause(); this.goTo(this.index + 1); }
  prev()  { this.pause(); this.goTo(this.index - 1); }
  reset() { this.pause(); this.goTo(0); }

  play() {
    if (this.playing) return;
    if (this.index >= this.last) this.index = 0;   // pressing Play at the end restarts
    this._emit();
    this._schedule();
    this.onPlayState(true);
  }
  pause() {
    if (this.timer === null) return;
    clearTimeout(this.timer);
    this.timer = null;
    this.onPlayState(false);
  }
  toggle() { this.playing ? this.pause() : this.play(); }

  setDelay(ms) {                      // changing the speed takes effect immediately, even mid-play
    this.delay = ms;
    if (this.timer !== null) { clearTimeout(this.timer); this._schedule(); }
  }

  _schedule() {
    this.timer = setTimeout(() => {
      if (this.index >= this.last) { this.timer = null; this.onPlayState(false); return; }
      this.index++;
      this._emit();
      if (this.index >= this.last) { this.timer = null; this.onPlayState(false); }
      else this._schedule();
    }, this.delay);
  }

  _emit() { this.onChange(this.index, this.steps[this.index], this.steps.length); }
}