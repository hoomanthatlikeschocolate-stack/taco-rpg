import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { Renderer } from '../dist/render.js';
test('Input, pause, touch controls, settings and replay work through the application', async () => {
  const html = await readFile(new URL('../dist/index.html', import.meta.url), 'utf8');
  const source = await readFile(new URL('../dist/app.js', import.meta.url), 'utf8');
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(x => x[1]);
  for (const [, id] of source.matchAll(/\$\('([^']+)'\)/g)) assert.ok(ids.includes(id), 'Missing DOM id ' + id);
  const context = new Proxy({ createLinearGradient: () => ({ addColorStop() {} }), createRadialGradient: () => ({ addColorStop() {} }) }, { get: (o, key) => o[key] ?? (() => {}) });
  const nodes = {}, events = {}, storage = new Map(); let frame;
  const node = id => nodes[id] ??= { id, style: {}, dataset: {}, hidden: false, tagName: 'DIV', events: {}, classList: { add() {}, remove() {}, toggle() {} }, getContext: () => context, setAttribute() {}, focus() {}, setPointerCapture() {}, addEventListener(type, fn) { this.events[type] = fn; } };
  ids.forEach(node); node('game').tagName = 'CANVAS';
  const buttons = ['left', 'right', 'jump', 'dash', 'interact'].map(action => { const b = node('touch-' + action); b.dataset.input = action; return b; });
  const globals = ['document', 'window', 'localStorage', 'matchMedia', 'requestAnimationFrame'];
  const previous = globals.map(k => Object.getOwnPropertyDescriptor(globalThis, k));
  const draw = Renderer.prototype.draw; Renderer.prototype.draw = () => {};
  try {
    globalThis.document = { hidden: false, getElementById: node, createElement: () => node('scratch'), querySelectorAll: () => buttons, addEventListener: (name, fn) => events['document:' + name] = fn };
    globalThis.window = { addEventListener: (name, fn) => events[name] = fn };
    globalThis.localStorage = { getItem: k => storage.get(k) ?? null, setItem: (k, v) => storage.set(k, v) };
    globalThis.matchMedia = q => ({ matches: q.includes('coarse') }); globalThis.requestAnimationFrame = fn => { frame = fn; };
    const app = await import('../dist/app.js');
    const key = (code, type = 'keydown') => events[type]({ code, target: node('game'), preventDefault() {} });
    let now = 0; const tick = count => { for (let i = 0; i < count; i++) frame(now += 50); };
    key('Enter'); assert.equal(app.game.phase, 'bedroom'); assert.equal(node('start-screen').hidden, true);
    tick(240); assert.equal(app.game.phase, 'dream'); assert.equal(node('touch').hidden, false);
    const x = app.game.player.x; key('KeyD'); tick(8); key('KeyD', 'keyup'); assert.ok(app.game.player.x > x + 35);
    const y = app.game.player.y; key('KeyW'); tick(3); key('KeyW', 'keyup'); assert.ok(app.game.player.y < y - 20);
    key('Escape'); const time = app.game.time; tick(30); assert.equal(app.game.time, time); assert.equal(node('pause-screen').hidden, false);
    node('restart').onclick(); assert.equal(node('pause').textContent, 'Pause'); assert.equal(app.game.phase, 'bedroom');
    node('motion').onclick(); assert.equal(app.renderer.reduceEffects, true); assert.equal(storage.get('opening.effects'), 'reduced');
    node('sound').onclick(); assert.equal(storage.get('opening.sound'), 'off');
    app.game.change('dream'); const beforeTouch = app.game.player.x;
    buttons[1].events.pointerdown({ pointerId: 1, preventDefault() {} }); tick(8); buttons[1].events.pointerup({ pointerId: 1 }); assert.ok(app.game.player.x > beforeTouch);
    app.game.change('awake'); tick(240); assert.equal(app.game.complete, true); assert.equal(node('replay').hidden, false);
    node('replay').onclick(); assert.equal(app.game.complete, false); assert.equal(app.game.phase, 'bedroom'); assert.equal(node('replay').hidden, true);
  } finally {
    Renderer.prototype.draw = draw;
    globals.forEach((k, i) => { if (previous[i]) Object.defineProperty(globalThis, k, previous[i]); else delete globalThis[k]; });
  }
});
