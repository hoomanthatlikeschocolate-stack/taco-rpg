export const VIEW = { width: 640, height: 360 };
export const WORLD_WIDTH = 2300;
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const approach = (v, target, delta) => v < target ? Math.min(target, v + delta) : Math.max(target, v - delta);
export const TERRAIN = [
  { x: 0, y: 292, w: 620, h: 110 },
  { x: 684, y: 278, w: 144, h: 124 },
  { x: 892, y: 292, w: 482, h: 110 },
  { x: 1430, y: 264, w: 140, h: 138 },
  { x: 1630, y: 292, w: 670, h: 110 },
  { x: 350, y: 244, w: 72, h: 12 },
  { x: 1030, y: 240, w: 88, h: 12 },
  { x: 1690, y: 252, w: 92, h: 12 }
];
export const LIGHTS = [
  { x: 510, y: 246, text: 'I know this place.' },
  { x: 1175, y: 244, text: 'That door was not here before.' },
  { x: 1735, y: 218, text: 'Something is dreaming with me.' }
];
export class Opening {
  constructor() { this.reset(); }
  reset() {
    this.phase = 'waiting'; this.phaseTime = 0; this.time = 0; this.dreamTime = 0;
    this.corruption = 0; this.furthest = 80; this.collected = []; this.events = [];
    this.previous = {}; this.camera = 0; this.complete = false; this.falls = 0;
    this.player = { x: 80, y: 264, w: 14, h: 28, vx: 0, vy: 0, grounded: true, facing: 1, coyote: .1, buffer: 0, dash: 0, dashReady: true };
    this.gaze = 0; this.lampCooldown = 0; this.lampAttempt = 0;
  }
  start() { this.reset(); this.change('bedroom'); }
  change(phase) {
    this.phase = phase; this.phaseTime = 0; this.previous = {};
    this.events.push({ type: 'phase', phase });
    if (phase === 'dream') this.events.push({ type: 'line', text: 'It feels like somewhere you have been before.' });
    if (phase === 'awake') this.events.push({ type: 'line', text: 'You woke up. You must have.' });
  }
  drainEvents() { return this.events.splice(0); }
  get eyesVisible() { return this.phase === 'awake' && this.phaseTime >= 3.2; }
  get doorReady() { return this.corruption >= .78; }
  step(dt, input = {}) {
    if (!Number.isFinite(dt)) return;
    dt = clamp(dt, 0, .034); this.time += dt;
    if (this.phase === 'waiting') return;
    this.phaseTime += dt;
    if (this.phase === 'bedroom' && this.phaseTime >= 6.2) this.change('zoom');
    else if (this.phase === 'zoom' && this.phaseTime >= 4.8) this.change('dream');
    else if (this.phase === 'dream') this.stepDream(dt, input);
    else if (this.phase === 'blackout' && this.phaseTime >= 2.1) this.change('awake');
    else if (this.phase === 'awake') {
      this.gaze = clamp(this.gaze + ((input.right ? 1 : 0) - (input.left ? 1 : 0)) * dt * .7, -1, 1);
      this.lampCooldown = Math.max(0, this.lampCooldown - dt);
      this.lampAttempt = Math.max(0, this.lampAttempt - dt);
      if (input.interact && !this.previous.interact && this.lampCooldown === 0) {
        this.lampCooldown = 1.6; this.lampAttempt = .35;
        this.events.push({ type: 'lamp' }, { type: 'line', text: 'The switch clicks. The light does not come on.' });
      }
      if (this.phaseTime >= 5.2 && this.phaseTime - dt < 5.2) this.events.push({ type: 'eyes' }, { type: 'line', text: 'Do not move.' });
      if (this.phaseTime >= 11 && !this.complete) { this.complete = true; this.events.push({ type: 'complete' }); }
    }
    this.previous = { ...input };
  }
  stepDream(dt, input) {
    const p = this.player; this.dreamTime += dt;
    p.buffer = input.jump && !this.previous.jump ? .13 : Math.max(0, p.buffer - dt);
    p.coyote = p.grounded ? .11 : Math.max(0, p.coyote - dt);
    const direction = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    if (direction) p.facing = direction;
    if (p.buffer > 0 && p.coyote > 0) {
      p.vy = -330; p.grounded = false; p.coyote = 0; p.buffer = 0;
      this.events.push({ type: 'jump' });
    }
    if (input.dash && !this.previous.dash && p.dashReady) {
      p.dash = .14; p.dashReady = false; p.vy = 0; this.events.push({ type: 'dash' });
    }
    if (p.dash > 0) { p.dash = Math.max(0, p.dash - dt); p.vx = p.facing * 360; }
    else {
      p.vx = approach(p.vx, direction * 150, dt * (p.grounded ? 1250 : 720));
      if (!input.jump && this.previous.jump && p.vy < -120) p.vy = -120;
      p.vy = Math.min(480, p.vy + dt * 880);
    }
    p.x = clamp(p.x + p.vx * dt, 0, WORLD_WIDTH - p.w);
    const oldBottom = p.y + p.h; p.y += p.vy * dt; p.grounded = false;
    if (p.vy >= 0) {
      for (const s of TERRAIN) if (p.x + p.w > s.x && p.x < s.x + s.w && oldBottom <= s.y + .6 && p.y + p.h >= s.y) {
        p.y = s.y - p.h; p.vy = 0; p.grounded = true; p.dashReady = true; break;
      }
    }
    if (p.y > 420) {
      this.falls++;
      const x = this.furthest >= 1680 ? 1660 : this.furthest >= 930 ? 930 : 80;
      Object.assign(p, { x, y: 264, vx: 0, vy: 0, dash: 0, dashReady: true, grounded: true });
      this.events.push({ type: 'return' }, { type: 'line', text: 'You fall. You are still here.' });
    }
    this.furthest = Math.max(this.furthest, p.x);
    for (let i = 0; i < LIGHTS.length; i++) if (!this.collected.includes(i) && Math.hypot(p.x + 7 - LIGHTS[i].x, p.y + 14 - LIGHTS[i].y) < 30) {
      this.collected.push(i); this.events.push({ type: 'light', x: LIGHTS[i].x, y: LIGHTS[i].y }, { type: 'line', text: LIGHTS[i].text });
    }
    const spatial = clamp((this.furthest - 360) / 1760, 0, .94);
    const temporal = clamp((this.dreamTime - 18) / 70, 0, 1);
    const desired = Math.max(spatial, temporal);
    const before = this.corruption;
    this.corruption = Math.max(before, approach(before, desired, dt * .105));
    for (const [threshold, text] of [[.26, 'The wind stopped.'], [.52, 'You cannot remember the way back.'], [.76, 'Wake up. Wake up. Wake up.'], [.91, 'This is not your dream anymore.']]) {
      if (before < threshold && this.corruption >= threshold) this.events.push({ type: 'fracture' }, { type: 'line', text });
    }
    this.camera = approach(this.camera, clamp(p.x - 235, 0, WORLD_WIDTH - VIEW.width), dt * 230);
    if ((p.x > 2125 && this.doorReady && (input.interact || p.x > 2190)) || this.corruption >= .998) this.change('blackout');
  }
}
