import test from 'node:test';
import assert from 'node:assert/strict';
import { Opening, TERRAIN, LIGHTS, WORLD_WIDTH } from '../dist/engine.js';
const frames = (g, n, input = {}) => { for (let i = 0; i < n; i++) g.step(1 / 120, input); };
const dream = () => { const g = new Opening(); g.start(); frames(g, 1324); assert.equal(g.phase, 'dream'); return g; };
test('Opening waits for a gesture, then plays bedtime and head zoom before releasing control', () => {
  const g = new Opening(); frames(g, 600); assert.equal(g.phase, 'waiting');
  g.start(); frames(g, 720, { right: true }); assert.equal(g.phase, 'bedroom'); assert.equal(g.player.x, 80);
  frames(g, 30); assert.equal(g.phase, 'zoom'); frames(g, 574); assert.equal(g.phase, 'dream');
});
test('The dream responds to movement, jumping and held jump height', () => {
  const g = dream(); frames(g, 30, { right: true }); assert.ok(g.player.x > 100);
  frames(g, 20, { jump: true }); assert.ok(g.player.y < 224); frames(g, 150); assert.equal(g.player.grounded, true);
  const a = dream(), b = dream(); frames(a, 1, { jump: true }); frames(a, 20); frames(b, 21, { jump: true }); assert.ok(b.player.y < a.player.y - 20);
});
test('Dash is limited in the air and restored after landing', () => {
  const g = dream(); frames(g, 20, { jump: true }); frames(g, 1, { dash: true, right: true }); assert.equal(g.player.dashReady, false);
  const x = g.player.x; frames(g, 10, { dash: true, right: true }); assert.ok(g.player.x > x + 25); frames(g, 180); assert.equal(g.player.dashReady, true);
});
test('Dream lights collect once and corruption never reverses while walking back', () => {
  const g = dream(), light = LIGHTS[0]; Object.assign(g.player, { x: light.x - 7, y: light.y - 14, vy: 0 }); frames(g, 1); assert.deepEqual(g.collected, [0]);
  const events = g.drainEvents().filter(e => e.type === 'light'); assert.equal(events.length, 1); frames(g, 2); assert.equal(g.drainEvents().filter(e => e.type === 'light').length, 0);
  g.furthest = 1500; frames(g, 600); const c = g.corruption; assert.ok(c > .5); g.player.x = 80; frames(g, 120); assert.ok(g.corruption >= c);
});
test('Falling restores a reachable checkpoint without losing lights or corruption', () => {
  const g = dream(); g.collected = [0, 1]; g.corruption = .6; g.furthest = 1180; g.player.y = 430; frames(g, 1);
  assert.equal(g.player.x, 930); assert.equal(g.player.y, 264); assert.equal(g.falls, 1); assert.deepEqual(g.collected, [0, 1]); assert.ok(g.corruption >= .6);
});
test('The full dream route is traversable using real movement and jumps', () => {
  const g = dream(); let jumpTime = 0;
  for (let i = 0; i < 120 * 42 && g.phase === 'dream'; i++) {
    const floor = TERRAIN.find(s => s.h > 100 && g.player.x + 7 >= s.x && g.player.x + 7 < s.x + s.w);
    if (floor && g.player.grounded && floor.x + floor.w < WORLD_WIDTH && g.player.x > floor.x + floor.w - 38 && jumpTime <= 0) jumpTime = .35;
    g.step(1 / 120, { right: true, jump: jumpTime > 0, interact: g.player.x > 2130 }); jumpTime -= 1 / 120;
  }
  assert.equal(g.phase, 'blackout'); assert.equal(g.falls, 0); assert.ok(g.furthest > 2125); assert.ok(g.corruption >= .78);
});
test('Even an idle player experiences blackening, blackout, awakening and delayed red eyes', () => {
  const g = dream(); frames(g, 120 * 95); assert.equal(g.phase, 'awake'); assert.ok(g.corruption >= .998);
  g.change('awake'); assert.equal(g.eyesVisible, false); frames(g, 380); assert.equal(g.eyesVisible, false); frames(g, 6); assert.equal(g.eyesVisible, true);
  frames(g, 1000); assert.equal(g.complete, true); assert.equal(g.drainEvents().filter(e => e.type === 'complete').length, 1);
});
test('False awakening permits looking and a failed lamp interaction with a cooldown', () => {
  const g = new Opening(); g.change('awake'); frames(g, 120, { right: true }); assert.ok(g.gaze > .5); frames(g, 1200, { right: true }); assert.equal(g.gaze, 1);
  g.drainEvents(); frames(g, 1, { interact: true }); assert.ok(g.lampAttempt > 0); frames(g, 60, { interact: true }); assert.equal(g.drainEvents().filter(e => e.type === 'lamp').length, 1);
});
test('Restart resets the nightmare, and invalid frame deltas cannot break its state', () => {
  const g = dream(); g.corruption = .9; g.collected = [0, 1, 2]; g.complete = true; g.start();
  assert.equal(g.phase, 'bedroom'); assert.equal(g.corruption, 0); assert.deepEqual(g.collected, []); assert.equal(g.complete, false);
  const time = g.time; g.step(NaN, {}); assert.equal(g.time, time); g.step(-20, {}); assert.equal(g.time, time);
});
