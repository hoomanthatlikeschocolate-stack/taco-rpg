import { Opening, clamp } from './engine.js';
import { Renderer } from './render.js';
import { Soundscape } from './audio.js';
const $ = id => document.getElementById(id);
const setting = (key, fallback) => { try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; } };
const remember = (key, value) => { try { localStorage.setItem(key, String(value)); } catch {} };
const game = new Opening(), renderer = new Renderer($('game'));
let soundOn = setting('opening.sound', 'on') !== 'off';
let reduceEffects = setting('opening.effects', matchMedia('(prefers-reduced-motion: reduce)').matches ? 'reduced' : 'full') === 'reduced';
const sound = new Soundscape(soundOn); renderer.reduceEffects = reduceEffects;
let keys = new Set(), touches = new Map(), paused = false, last = 0, accumulator = 0, lineUntil = 0;
const keyMap = { KeyA: 'left', ArrowLeft: 'left', KeyD: 'right', ArrowRight: 'right', KeyW: 'jump', ArrowUp: 'jump', KeyX: 'dash', ShiftLeft: 'dash', ShiftRight: 'dash', KeyE: 'interact', Enter: 'interact' };
function input() { const out = {}; for (const key of keys) if (keyMap[key]) out[keyMap[key]] = true; for (const action of touches.values()) out[action] = true; return out; }
function clearInput() { keys.clear(); touches.clear(); game.previous = {}; }
function start() {
  clearInput(); paused = false; game.start(); last = 0; accumulator = 0; lineUntil = 0;
  $('start-screen').hidden = true; $('pause-screen').hidden = true; $('replay').hidden = true; $('pause').disabled = false; $('pause').textContent = 'Pause';
  $('subtitle').classList.remove('visible'); $('stage').classList.remove('ended'); sound.ensure(); $('game').focus(); events(); hud();
}
function pause(value = !paused) {
  if (game.phase === 'waiting') return;
  paused = value; clearInput(); accumulator = 0; $('pause-screen').hidden = !value;
  $('pause').textContent = value ? 'Resume' : 'Pause'; if (value) $('resume').focus(); else $('game').focus();
}
function events() {
  for (const event of game.drainEvents()) {
    sound.effect(event);
    if (event.type === 'line') { $('subtitle').textContent = event.text; $('subtitle').classList.add('visible'); lineUntil = game.time + 5.5; }
    if (event.type === 'phase') { clearInput(); $('prompt').hidden = true; if (event.phase === 'blackout') { $('subtitle').classList.remove('visible'); lineUntil = 0; } }
    if (event.type === 'complete') { $('replay').hidden = false; $('stage').classList.add('ended'); }
  }
}
function hud() {
  const phase = game.phase, dream = phase === 'dream', awake = phase === 'awake';
  $('scene-label').innerHTML = dream ? 'DREAM <span>' + (game.corruption < .45 ? 'FOLLOW THE LIGHTS' : game.corruption < .8 ? 'SOMETHING IS WRONG' : 'WAKE UP') + '</span>' : awake ? 'BEDROOM? <span>00:14</span>' : phase === 'blackout' ? '' : 'BEDROOM <span>00:14</span>';
  const coarse = matchMedia('(pointer: coarse)').matches;
  $('touch').hidden = paused || (!dream && !awake) || !coarse;
  $('stage').classList.toggle('touch-enabled', coarse && (dream || awake));
  $('controls').textContent = dream ? 'A / D · Move    W · Jump    X · Dash    ESC · Pause' : awake ? '← / → · Look    E · Bedside lamp    ESC · Pause' : phase === 'waiting' ? "Begin when you're ready." : 'Let yourself fall asleep.';
  $('footer-note').textContent = dream ? game.collected.length + ' / 3 LIGHTS' : 'HEADPHONES / LIGHTS LOW';
  if (dream && game.player.x > 2060 && game.doorReady) { $('prompt').hidden = false; $('prompt').textContent = 'E · Wake up'; }
  else if (dream && game.dreamTime < 7) { $('prompt').hidden = false; $('prompt').textContent = 'A / D to move · W to jump'; }
  else if (awake && game.phaseTime > 1.6 && game.phaseTime < 5.5) { $('prompt').hidden = false; $('prompt').textContent = 'E · Turn on the bedside lamp'; }
  else $('prompt').hidden = true;
  if (game.time > lineUntil) $('subtitle').classList.remove('visible');
}
function settings() {
  $('sound').textContent = 'Sound: ' + (soundOn ? 'on' : 'off'); $('sound').setAttribute('aria-pressed', String(soundOn));
  $('motion').textContent = 'Effects: ' + (reduceEffects ? 'reduced' : 'full'); $('motion').setAttribute('aria-pressed', String(reduceEffects));
}
$('begin').onclick = start; $('replay').onclick = start; $('restart').onclick = start; $('resume').onclick = () => pause(false); $('pause').onclick = () => pause();
$('sound').onclick = () => { soundOn = !soundOn; remember('opening.sound', soundOn ? 'on' : 'off'); sound.setEnabled(soundOn); settings(); };
$('motion').onclick = () => { reduceEffects = !reduceEffects; renderer.reduceEffects = reduceEffects; remember('opening.effects', reduceEffects ? 'reduced' : 'full'); settings(); };
window.addEventListener('keydown', event => {
  if (event.ctrlKey || event.metaKey || event.altKey) return;
  if (event.code === 'Escape' && !event.repeat) { event.preventDefault(); pause(); return; }
  if (game.phase === 'waiting' && (event.code === 'Enter' || event.code === 'KeyE')) { event.preventDefault(); if (!event.repeat) start(); return; }
  if (event.code === 'Space' && event.target === $('game')) event.preventDefault();
  if (keyMap[event.code] && !paused && game.phase !== 'waiting' && !['BUTTON', 'INPUT'].includes(event.target?.tagName)) { event.preventDefault(); keys.add(event.code); }
});
window.addEventListener('keyup', event => keys.delete(event.code));
window.addEventListener('blur', () => { if (game.phase !== 'waiting') pause(true); clearInput(); });
document.addEventListener('visibilitychange', () => { if (document.hidden && game.phase !== 'waiting') pause(true); });
for (const button of document.querySelectorAll('[data-input]')) {
  button.addEventListener('pointerdown', event => { if (paused) return; event.preventDefault(); button.setPointerCapture(event.pointerId); touches.set(event.pointerId, button.dataset.input); });
  for (const name of ['pointerup', 'pointercancel', 'lostpointercapture']) button.addEventListener(name, event => touches.delete(event.pointerId));
}
function frame(now) {
  const elapsed = last ? clamp((now - last) / 1000, 0, .05) : 0; last = now;
  if (!paused) {
    accumulator += elapsed;
    while (accumulator >= 1 / 120) { game.step(1 / 120, input()); events(); accumulator -= 1 / 120; }
  }
  renderer.draw(game); sound.update(game, paused); hud(); requestAnimationFrame(frame);
}
settings(); hud(); renderer.draw(game); requestAnimationFrame(frame);
export { game, renderer, start, pause };
