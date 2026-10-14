import { VIEW, WORLD_WIDTH, TERRAIN, LIGHTS, clamp } from './engine.js';
const hash = n => { const v = Math.sin(n * 127.1 + 91.7) * 43758.5453; return v - Math.floor(v); };
const ease = t => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
const mix = (a, b, t) => {
  const x = parseInt(a.slice(1), 16), y = parseInt(b.slice(1), 16);
  return '#' + [16, 8, 0].map(s => Math.round(((x >> s) & 255) * (1 - t) + ((y >> s) & 255) * t).toString(16).padStart(2, '0')).join('');
};
export class Renderer {
  constructor(canvas, makeCanvas = () => document.createElement('canvas')) {
    this.canvas = canvas; this.ctx = canvas.getContext('2d'); canvas.width = VIEW.width; canvas.height = VIEW.height;
    this.scratch = makeCanvas(); this.scratch.width = VIEW.width; this.scratch.height = VIEW.height;
    this.reduceEffects = false; this.ctx.imageSmoothingEnabled = false;
  }
  rect(x, y, w, h, color) { const c = this.ctx; c.fillStyle = color; c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); }
  text(text, x, y, color, size = 7, align = 'center') { const c = this.ctx; c.font = size + 'px monospace'; c.textAlign = align; c.fillStyle = color; c.fillText(text, Math.round(x), Math.round(y)); }
  diamond(x, y, r, color) { const c = this.ctx; c.fillStyle = color; c.beginPath(); c.moveTo(x, y - r); c.lineTo(x + r, y); c.lineTo(x, y + r); c.lineTo(x - r, y); c.closePath(); c.fill(); }
  glow(x, y, r, color, strength = .3) {
    const c = this.ctx, g = c.createRadialGradient(x, y, 1, x, y, r);
    g.addColorStop(0, color); g.addColorStop(1, '#00000000'); c.save(); c.globalAlpha = strength; c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2); c.restore();
  }
  boy(x, feet, time, moving = false, facing = 1) {
    const c = this.ctx; c.save(); c.translate(Math.round(x + 7), Math.round(feet)); c.scale(facing, 1);
    const stride = moving ? Math.round(Math.sin(time * 15) * 2) : 0;
    this.rect(-6, -28, 13, 7, '#292635'); this.rect(-5, -22, 11, 8, '#cfaf99'); this.rect(-6, -24, 5, 5, '#463545');
    this.rect(3, -21, 2, 2, '#242337'); this.rect(5, -18, 2, 2, '#e3bda3'); this.rect(-5, -14, 11, 11, '#697d95');
    this.rect(-4, -13, 2, 10, '#899bb0'); this.rect(-8, -12, 3, 9, '#7489a2'); this.rect(6, -12, 3, 7, '#7489a2');
    this.rect(-8, -4, 3, 3, '#cfaf99'); this.rect(6, -6, 3, 3, '#cfaf99'); this.rect(-5, -4, 5, 5 + stride, '#344559');
    this.rect(2, -4, 5, 5 - stride, '#344559'); this.rect(-6, stride, 6, 2, '#c0c4c7'); this.rect(2, -stride, 6, 2, '#c0c4c7'); c.restore();
  }
  sleepingBoy(awake = false, time = 0, gaze = 0) {
    const breath = this.reduceEffects ? 0 : Math.sin(time * 1.6) * .6;
    this.rect(200, 211, 14, 7, '#312837'); this.rect(202, 216, 14, 11, '#d7b29b'); this.rect(201, 216, 5, 6, '#4b3540');
    this.rect(212, 220, 4, 2, '#ba8d81'); this.rect(205, 226, 12, 3, '#b99488');
    if (awake) { this.rect(208, 219, 4, 2, '#e9dfc9'); this.rect(210 + Math.round(gaze), 219, 1, 2, '#363141'); }
    else this.rect(208, 219, 4, 1, '#715154');
    this.rect(216, 219 + breath, 65, 13, '#71829b'); this.rect(218, 231 + breath, 58, 8, '#47596f');
    this.rect(218, 222, 16, 4, '#b6ad9f');
  }
  bedroom(game, awake = false) {
    const c = this.ctx, t = game.phaseTime, sleeping = awake || game.phase === 'zoom' || t > 3.9;
    const lamp = awake ? game.lampAttempt * .12 : game.phase === 'zoom' ? 0 : game.phase === 'waiting' ? 1 : 1 - ease((t - 3.8) / 1.2);
    c.save();
    const wakeZoom = awake ? 1 + .16 * (1 - ease(t / 6)) : 1;
    if (awake) { c.translate(320, 180); c.scale(wakeZoom, wakeZoom); c.translate(-320 + game.gaze * 5, -180); }
    this.rect(0, 0, 640, 360, '#101321'); this.rect(34, 48, 574, 234, '#252638');
    this.rect(34, 48, 574, 5, '#41404b'); this.rect(34, 53, 8, 229, '#1c1e2e'); this.rect(597, 53, 11, 230, '#161b2b');
    for (let x = 54; x < 598; x += 25) { this.rect(x, 59, 1, 212, '#2d2d40'); for (let y = 77; y < 260; y += 26) this.diamond(x + 12, y, 1, '#353344'); }
    this.rect(34, 270, 574, 12, '#464254'); this.rect(34, 280, 574, 80, '#242637');
    for (let y = 287; y < 360; y += 15) { this.rect(35, y, 573, 1, '#111929'); for (let x = 42 + (y % 2) * 17; x < 602; x += 91) this.rect(x, y + 1, 1, 14, '#151b2c'); }
    // Moonlight, curtains and an ordinary street outside.
    this.rect(68, 79, 91, 131, '#161c31'); this.rect(72, 84, 81, 118, '#384660'); this.rect(76, 88, 72, 110, '#26334d');
    this.rect(89, 154, 22, 44, '#162b42'); this.rect(116, 166, 31, 32, '#1a293f'); this.rect(118, 178, 3, 4, '#b99470');
    this.rect(95, 159, 3, 5, '#a5a19b'); this.rect(139, 171, 3, 3, '#ad968a');
    c.fillStyle = '#c0c7d1'; c.beginPath(); c.arc(127, 109, 11, 0, Math.PI * 2); c.fill();
    this.rect(112, 86, 4, 115, '#667188'); this.rect(73, 141, 80, 4, '#667188'); this.rect(65, 204, 94, 6, '#777684');
    for (let i = 0; i < 5; i++) { this.rect(57 + i * 4, 75, 4, 147 - i * 4, i % 2 ? '#34415a' : '#4b5369'); this.rect(152 + i * 4, 75, 4, 139 + i * 2, i % 2 ? '#34415a' : '#4b5369'); }
    this.rect(55, 72, 122, 4, '#696477');
    c.globalAlpha = .14; c.fillStyle = '#a9c0dc'; c.beginPath(); c.moveTo(76, 205); c.lineTo(146, 205); c.lineTo(368, 334); c.lineTo(184, 334); c.closePath(); c.fill(); c.globalAlpha = 1;
    // Bed, bedside table, rug and the lamp that will not help later.
    this.rect(125, 304, 260, 32, '#424350'); this.rect(128, 307, 254, 2, '#65606b'); this.rect(135, 313, 240, 15, '#4e4a58');
    for (let x = 135; x < 374; x += 15) this.rect(x, 329, 5, 3, '#797080');
    this.rect(143, 189, 10, 89, '#575464'); this.rect(141, 187, 183, 8, '#77707b'); this.rect(151, 195, 171, 37, '#353547');
    for (let x = 168; x < 320; x += 23) this.rect(x, 196, 5, 23, '#625866');
    this.rect(146, 231, 174, 22, '#514d61'); this.rect(150, 252, 9, 31, '#403e52'); this.rect(307, 252, 8, 31, '#403e52');
    this.rect(148, 213, 171, 20, '#8d8fa0'); this.rect(153, 213, 161, 4, '#c0b8b8'); this.rect(176, 216, 42, 14, '#cbc3bf');
    this.rect(180, 216, 34, 3, '#e1d5c6'); this.rect(179, 227, 35, 2, '#9a949f');
    if (sleeping) this.sleepingBoy(awake, game.time, game.gaze);
    this.rect(231, 218, 85, 37, '#555f7a'); this.rect(234, 220, 78, 4, '#82849a'); this.rect(250, 224, 4, 28, '#6d7590');
    this.rect(285, 224, 3, 29, '#3f4c65'); this.rect(233, 249, 82, 5, '#39465f'); this.rect(235, 253, 77, 9, '#354157');
    this.rect(335, 245, 44, 31, '#4c485c'); this.rect(339, 250, 36, 12, '#62576a'); this.rect(355, 254, 6, 2, '#b6a19d');
    this.rect(333, 241, 48, 5, '#827281'); this.rect(339, 276, 5, 8, '#39394e'); this.rect(371, 276, 5, 8, '#39394e');
    this.rect(353, 206, 3, 34, '#8a7e87'); this.rect(345, 237, 20, 3, '#807783');
    c.globalAlpha = .45 + lamp * .55; this.rect(340, 194, 29, 17, '#c4ad98'); this.rect(336, 208, 37, 4, '#dabda0'); c.globalAlpha = 1;
    this.glow(353, 212, 127, '#ffbf84', lamp * .22); this.rect(365, 229, 12, 9, '#182033'); this.text('00:14', 371, 235, awake ? '#654557' : '#a79186', 4);
    // Desk clutter and one unfinished drawing.
    this.rect(390, 245, 68, 6, '#777386'); this.rect(395, 251, 5, 34, '#4d4a5f'); this.rect(449, 251, 5, 34, '#4d4a5f');
    this.rect(400, 230, 10, 14, '#6a7386'); this.rect(412, 235, 10, 9, '#ada08f'); this.rect(425, 233, 27, 10, '#b5aea8'); this.rect(429, 235, 18, 1, '#786b7e');
    this.rect(422, 257, 23, 8, '#313448'); this.rect(426, 265, 4, 24, '#494a5f'); this.rect(439, 265, 4, 24, '#494a5f');
    this.rect(405, 133, 33, 39, '#756478'); this.rect(408, 136, 27, 33, '#aa9a92'); this.rect(414, 144, 14, 15, '#5e6479'); this.rect(416, 144, 10, 7, '#80839a');
    // An open closet. It is empty before the false awakening.
    this.rect(477, 109, 91, 172, '#474354'); this.rect(475, 106, 95, 7, '#746370'); this.rect(482, 114, 79, 160, '#1d1d2d');
    this.rect(482, 117, 24, 153, '#605367'); this.rect(485, 119, 2, 149, '#897181'); this.rect(502, 123, 5, 145, '#342d40');
    this.rect(537, 115, 25, 156, '#51475d'); this.rect(542, 119, 2, 150, '#756175'); this.rect(550, 185, 3, 9, '#a0838a');
    this.rect(507, 115, 30, 157, '#0a0d18'); this.rect(511, 118, 22, 4, '#252537'); this.rect(508, 265, 27, 6, '#171a29');
    if (!sleeping) {
      const walking = t < 2.6;
      this.boy(walking ? 480 - ease(t / 2.6) * 189 : 291, walking ? 283 : 239 - ease((t - 2.6) / 1.1) * 5, game.time, walking, -1);
    }
    // A cooler, recognizably identical room after waking.
    if (awake) { c.globalAlpha = .54; this.rect(0, 0, 640, 360, '#020612'); c.globalAlpha = 1; }
    const shade = c.createRadialGradient(255, 220, 62, 280, 206, 365); shade.addColorStop(0, '#02050c00'); shade.addColorStop(1, awake ? '#010309c9' : '#030410a8'); c.fillStyle = shade; c.fillRect(0, 0, 640, 360);
    if (awake && game.eyesVisible) {
      const strength = ease((t - 3.2) / 2), y = 173 + (this.reduceEffects ? 0 : Math.sin(game.time * .6) * .7);
      this.glow(521, y, 35, '#ad142f', strength * .27);
      c.globalAlpha = strength;
      for (const x of [515, 531]) {
        this.rect(x - 3, y - 2, 6, 3, '#8c1730'); this.rect(x - 2, y - 2, 4, 2, '#e54758'); this.rect(x + (game.gaze > .4 ? -1 : 0), y - 2, 1, 3, '#ff9f9e');
        this.rect(x - 3, y + 1, 5, 1, '#550f24');
      }
      c.globalAlpha = 1;
    }
    c.restore();
    if (awake && t < 1.5) { const blink = 180 * (1 - ease(t / 1.5)); this.rect(0, 0, 640, blink, '#000000'); this.rect(0, 360 - blink, 640, blink, '#000000'); }
  }
  tree(x, ground, height, color) {
    const c = this.ctx; this.rect(x - 2, ground - height * .68, 4, height * .68, color);
    for (let i = 0; i < 4; i++) { const y = ground - height + i * height * .2, w = height * (.13 + i * .045); c.fillStyle = color; c.beginPath(); c.moveTo(x, y); c.lineTo(x + w, y + height * .37); c.lineTo(x - w, y + height * .37); c.closePath(); c.fill(); }
  }
  dream(game) {
    const c = this.ctx, t = this.reduceEffects ? 0 : game.time, k = game.corruption, cam = game.camera;
    const sky = c.createLinearGradient(0, 0, 0, 360); sky.addColorStop(0, mix('#495574', '#06050d', k)); sky.addColorStop(.63, mix('#d3a19a', '#18101f', k)); sky.addColorStop(1, mix('#738a8e', '#05050c', k)); c.fillStyle = sky; c.fillRect(0, 0, 640, 360);
    const moonX = 491 - cam * .08, moonY = 77;
    this.glow(moonX, moonY, 56, '#ffdfbc', (1 - k) * .22); c.fillStyle = mix('#fff0c9', '#5a3345', k); c.beginPath(); c.arc(moonX, moonY, 21, 0, Math.PI * 2); c.fill();
    for (let i = 0; i < 36; i++) { c.globalAlpha = (1 - k) * (.12 + hash(i) * .35); this.rect(hash(i + 41) * 640, 24 + hash(i + 74) * 95, 1, 1, '#ffffff'); } c.globalAlpha = 1;
    for (let i = 0; i < 7; i++) {
      const x = i * 133 - (cam * .16) % 133, y = 115 + hash(i) * 72 + Math.sin(t * .2 + i) * 2;
      c.globalAlpha = .19 * (1 - k); this.rect(x, y, 82, 3, '#ffe7c7'); this.rect(x + 12, y - 3, 50, 3, '#ffe7c7'); c.globalAlpha = 1;
    }
    // Distant mountains distort before the path itself goes black.
    for (let i = 0; i < 11; i++) {
      const x = i * 112 - (cam * .24) % 112, top = 132 + hash(i + 3) * 46;
      const shift = this.reduceEffects ? 0 : Math.sin(t * .7 + i) * k * 18;
      c.fillStyle = mix('#687a8b', '#251528', k); c.beginPath(); c.moveTo(x - 90, 320); c.lineTo(x + shift, top); c.lineTo(x + 111, 320); c.closePath(); c.fill();
      c.fillStyle = mix('#b6a9ab', '#4d2d42', k); c.beginPath(); c.moveTo(x + shift, top); c.lineTo(x + 18 + shift, top + 48); c.lineTo(x - 11, top + 39); c.closePath(); c.fill();
    }
    for (let i = 0; i < 25; i++) this.tree(i * 33 - (cam * .38) % 33, 295, 56 + hash(i + 7) * 67, mix('#486b72', '#14101d', k));
    c.save(); c.translate(-Math.floor(cam), 0);
    for (const s of TERRAIN) {
      if (s.x + s.w < cam - 10 || s.x > cam + 650) continue;
      this.rect(s.x, s.y, s.w, s.h, mix('#4c6570', '#080811', k)); this.rect(s.x, s.y, s.w, 4, mix('#bacaa4', '#756171', k));
      this.rect(s.x, s.y + 4, s.w, 4, mix('#83a395', '#292031', k));
      for (let x = s.x + 6; x < s.x + s.w - 6; x += 13) {
        const h = 2 + hash(x) * 5; this.rect(x, s.y - h, 1, h, mix('#c5d6b3', '#4d384f', k));
        if (hash(x + 2) > .55) this.rect(x - 1, s.y - h, 3, 2, mix('#f2d1b3', '#4d233a', k));
      }
      for (let y = s.y + 15; y < Math.min(360, s.y + s.h); y += 19) for (let x = s.x + 9; x < s.x + s.w; x += 31) {
        this.rect(x, y, 14, 1, mix('#3f535f', '#13101c', k)); this.rect(x + 14, y, 1, 8, mix('#3f535f', '#13101c', k));
      }
    }
    // Familiar objects that do not belong outdoors.
    for (const [x, y] of [[380, 244], [1054, 240], [1835, 292]]) {
      this.rect(x, y - 35, 3, 35, mix('#8b8c97', '#685464', k)); this.rect(x - 9, y - 43, 23, 11, mix('#e7cbaf', '#6d334c', k)); this.rect(x - 12, y - 33, 29, 3, '#c6ac9f');
      this.glow(x, y - 36, 41, '#ffe1aa', (1 - k) * .14);
    }
    for (let i = 0; i < LIGHTS.length; i++) {
      const o = LIGHTS[i]; if (game.collected.includes(i)) continue;
      const y = o.y + Math.sin(t * 2 + i) * 3; this.glow(o.x, y, 30, '#fff0ba', .23); this.diamond(o.x, y, 5, mix('#ffecb0', '#ce9aab', k)); this.diamond(o.x, y, 2, '#fffae7');
      for (let j = 0; j < 3; j++) this.rect(o.x + Math.sin(t + j * 2) * 12, y + Math.cos(t + j * 2) * 10, 1, 1, '#fff5d5');
    }
    // A bedroom door, impossibly standing in the meadow.
    const dx = 2168, dy = 221;
    this.rect(dx - 5, dy - 5, 43, 76, mix('#d8c4b3', '#60505e', k)); this.rect(dx, dy, 33, 71, '#1b2034');
    if (game.doorReady) { this.rect(dx + 3, dy + 3, 15, 66, '#07050c'); this.rect(dx + 19, dy + 2, 13, 68, '#504052'); this.rect(dx + 20, dy + 12, 1, 53, '#947188'); }
    else { this.rect(dx + 3, dy + 3, 27, 66, '#758096'); this.rect(dx + 7, dy + 7, 19, 25, '#67748b'); }
    this.rect(dx + 23, dy + 40, 3, 3, '#e6c6a1'); this.text(game.doorReady ? 'WAKE UP' : 'HOME', dx + 16, dy - 14, '#dcc6c5', 7);
    if (game.doorReady) this.glow(dx + 16, dy + 36, 67, '#bda7d7', .08);
    if (k > .39) {
      c.globalAlpha = (k - .39) * .5;
      for (const x of [920, 1425, 1850]) { const y = 193; this.rect(x - 15, y - 19, 30, 28, '#ad8b9c'); this.rect(x - 23, y + 9, 45, 90, '#1a1023'); this.rect(x - 8, y - 10, 5, 3, '#1a0d1d'); this.rect(x + 5, y - 10, 5, 3, '#1a0d1d'); }
      c.globalAlpha = 1;
    }
    // The light follows the player even as everything else disappears.
    const p = game.player; this.glow(p.x + 7, p.y + 15, 44, '#b8dee5', .09);
    if (p.dash > 0) { c.globalAlpha = .22; this.boy(p.x - p.facing * 15, p.y + 28, t, false, p.facing); c.globalAlpha = 1; }
    this.boy(p.x, p.y + 28, t, Math.abs(p.vx) > 20 && p.grounded, p.facing); c.restore();
    for (let i = 0; i < 28; i++) {
      c.globalAlpha = Math.max(.05, (1 - k) * .5); const x = (hash(i + 81) * 640 + t * (3 + hash(i) * 6)) % 640;
      this.rect(x, 170 + hash(i + 42) * 126 + Math.sin(t + i) * 4, 1, 1, '#fff0c7');
    } c.globalAlpha = 1;
    if (k > .13) this.distort(game);
    const radius = 270 - Math.pow(k, 2) * 215, px = clamp(p.x - cam + 7, 0, 640), py = p.y + 14;
    const darkness = c.createRadialGradient(px, py, radius * .35, px, py, radius);
    darkness.addColorStop(0, '#03020a00'); darkness.addColorStop(1, '#03020a'); c.save(); c.globalAlpha = Math.pow(k, 1.9) * .98; c.fillStyle = darkness; c.fillRect(0, 0, 640, 360); c.restore();
    if (k > .95) { c.globalAlpha = ease((k - .95) / .048) * .84; this.rect(0, 0, 640, 360, '#000000'); c.globalAlpha = 1; }
  }
  distort(game) {
    const c = this.ctx, k = game.corruption, tick = Math.floor(game.time * 2);
    const scratch = this.scratch.getContext('2d'); scratch.clearRect(0, 0, 640, 360); scratch.drawImage(this.canvas, 0, 0);
    if (!this.reduceEffects) for (let i = 0; i < Math.floor(k * 7); i++) {
      const y = Math.floor(hash(tick * 7 + i) * 338), h = 2 + Math.floor(hash(i + tick * 3) * 14), offset = (hash(tick * 13 + i) - .5) * k * 39;
      c.drawImage(this.scratch, 0, y, 640, h, offset, y, 640, h);
      c.globalAlpha = k * .12; this.rect(0, y, 640, 1, '#b6597a'); c.globalAlpha = 1;
    }
    for (let i = 0; i < Math.floor(k * 22); i++) {
      const seed = this.reduceEffects ? i + 80 : i + tick * 17;
      c.globalAlpha = .14 + k * .55; this.rect(hash(seed) * 620, hash(seed + 41) * 340, 8 + hash(seed + 92) * 52, 3 + hash(seed + 6) * 24, '#03040b');
    } c.globalAlpha = 1;
    if (k > .6) { c.globalAlpha = .14; this.text('YOU ARE NOT ALONE HERE', 320, 148, '#d494a9', 7); c.globalAlpha = 1; }
  }
  draw(game) {
    const c = this.ctx; c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.imageSmoothingEnabled = false; c.clearRect(0, 0, 640, 360);
    if (game.phase === 'dream') this.dream(game);
    else if (game.phase === 'blackout') this.rect(0, 0, 640, 360, '#000000');
    else if (game.phase === 'zoom') {
      const progress = ease(game.phaseTime / 4.8), scale = Math.pow(38, progress);
      const focusX = 210 + 110 * (1 - progress) / scale, focusY = 220 - 40 * (1 - progress) / scale;
      c.save(); c.translate(320, 180); c.scale(scale, scale); c.translate(-focusX, -focusY); this.bedroom(game); c.restore();
      if (progress > .86) { c.globalAlpha = ease((progress - .86) / .14); this.rect(0, 0, 640, 360, '#d3ad9a'); c.globalAlpha = 1; }
      if (progress > .91) { c.globalAlpha = ease((progress - .91) / .09); this.rect(0, 0, 640, 360, '#354259'); c.globalAlpha = 1; }
    } else this.bedroom(game, game.phase === 'awake');
    // Film grain is static in reduced effects mode. No full-screen flashes.
    const tick = this.reduceEffects ? 0 : Math.floor(game.time * 3);
    c.globalAlpha = .055;
    for (let i = 0; i < 95; i++) this.rect(hash(i + tick * 31) * 640, hash(i + 7 + tick * 19) * 360, 1, 1, '#bac0d1');
    c.globalAlpha = 1;
  }
}
