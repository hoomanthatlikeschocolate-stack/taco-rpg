import { clamp } from './engine.js';
export class Soundscape {
  constructor(enabled = true) { this.enabled = enabled; this.ctx = null; this.next = 0; this.step = 0; this.phase = ''; }
  ensure() {
    try {
      if (!this.ctx) {
        const Audio = window.AudioContext || window.webkitAudioContext; if (!Audio) return;
        this.ctx = new Audio(); this.master = this.ctx.createGain(); this.master.gain.value = this.enabled ? .55 : 0; this.master.connect(this.ctx.destination);
        this.drone = this.ctx.createOscillator(); this.drone.type = 'sine'; this.drone.frequency.value = 55;
        this.droneGain = this.ctx.createGain(); this.droneGain.gain.value = 0; this.drone.connect(this.droneGain); this.droneGain.connect(this.master); this.drone.start();
        this.upper = this.ctx.createOscillator(); this.upper.type = 'triangle'; this.upper.frequency.value = 110;
        this.upperGain = this.ctx.createGain(); this.upperGain.gain.value = 0; this.upper.connect(this.upperGain); this.upperGain.connect(this.master); this.upper.start();
      }
      if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
    } catch { this.ctx = null; }
  }
  setEnabled(value) { this.enabled = !!value; this.ensure(); if (this.ctx) this.master.gain.setTargetAtTime(value ? .55 : 0, this.ctx.currentTime, .15); }
  tone(hz, duration = .5, gain = .04, type = 'sine', at = null, detune = 0) {
    if (!this.ctx || !this.enabled || this.ctx.state !== 'running') return;
    const t = at ?? this.ctx.currentTime, o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(hz, t); o.detune.setValueAtTime(detune, t);
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(.0002, gain), t + .03); g.gain.exponentialRampToValueAtTime(.0001, t + duration);
    o.connect(g); g.connect(this.master); o.start(t); o.stop(t + duration + .04);
  }
  update(game, paused = false) {
    if (!this.ctx || this.ctx.state !== 'running') return;
    const now = this.ctx.currentTime, active = this.enabled && !paused && game.phase !== 'waiting', k = game.corruption;
    const dread = game.phase === 'awake' ? .82 : game.phase === 'blackout' ? 0 : k;
    this.droneGain.gain.setTargetAtTime(active ? .008 + dread * .029 : 0, now, .4);
    this.upperGain.gain.setTargetAtTime(active ? dread * .01 : 0, now, .4);
    this.drone.frequency.setTargetAtTime(game.phase === 'awake' ? 43 : 55 - dread * 13, now, .8);
    this.upper.frequency.setTargetAtTime(110 - dread * 22 + Math.sin(game.time * .2) * dread * 2, now, .5);
    if (!active) { this.next = now + .1; return; }
    if (this.phase !== game.phase) { this.phase = game.phase; this.step = 0; this.next = now + .15; }
    if (this.next < now) this.next = now + .08;
    if (game.phase === 'dream' && k < .92) {
      const notes = [0, 7, 12, 10, 3, 7, 5, 2], beat = 1.2 + k * .9;
      while (this.next < now + .18) {
        const n = notes[this.step % notes.length], hz = 220 * Math.pow(2, n / 12);
        this.tone(hz, 2.1, .034 * (1 - k), 'sine', this.next, k * (this.step % 2 ? -14 : 9));
        if (this.step % 4 === 0) this.tone(hz / 2, 3.5, .021 * (1 - k), 'triangle', this.next);
        this.next += beat; this.step++;
      }
    }
    if (game.phase === 'awake' && game.eyesVisible && this.next <= now + .15) { this.tone(51, .8, .036, 'sine', this.next); this.next = now + 2.4; }
  }
  effect(event) {
    if (!this.ctx || !this.enabled) return;
    const now = this.ctx.currentTime;
    if (event.type === 'light') { this.tone(660, .7, .035); this.tone(880, .8, .018, 'sine', now + .1); }
    else if (event.type === 'jump') this.tone(285, .1, .016, 'triangle');
    else if (event.type === 'dash') this.tone(146, .15, .025, 'triangle');
    else if (event.type === 'fracture') { this.tone(73, 1, .027, 'triangle'); this.tone(78, 1.3, .02); }
    else if (event.type === 'lamp') this.tone(130, .04, .035, 'triangle');
    else if (event.type === 'eyes') { this.tone(43, 2.5, .044); this.tone(89, 3, .012); }
    else if (event.type === 'phase' && event.phase === 'blackout') this.tone(34, 1.4, .025);
    else if (event.type === 'phase' && event.phase === 'awake') this.tone(180, .45, .018, 'sine');
  }
}
