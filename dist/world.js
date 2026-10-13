export const VIEW = { width: 640, height: 360 };
export const WORLD_WIDTH = 4800;
export const WORLD_HEIGHT = 520;
export const SAVE_KEY = 'riftbound.journey.v1';
export const ZONES = [
  { x: 0, name: 'The Quiet Approach', subtitle: 'Every journey begins with a fracture.' },
  { x: 690, name: 'The Broken Crossing', subtitle: 'What is missing here still exists in the past.' },
  { x: 1520, name: 'Echo Canyon', subtitle: 'Two worlds. One way forward.' },
  { x: 2100, name: 'The Old Watchtower', subtitle: 'Some things endure both timelines.' },
  { x: 3050, name: 'The Warden’s Reach', subtitle: 'The rift remembers its guardian.' },
];
export const SKILLS = [
  { id: 'vitality', name: 'Steadfast', icon: 'heart', detail: '+20 maximum health per rank.', max: 3 },
  { id: 'edge', name: 'Rift Edge', icon: 'blade', detail: '+4 sword damage per rank.', max: 3 },
  { id: 'stride', name: 'Longstride', icon: 'wing', detail: '+12% dash distance per rank.', max: 3 },
];
export const CHECKPOINTS = [
  { id: 'approach', x: 90, y: 400, phase: 'present', label: 'The Quiet Approach' },
  { id: 'crossing', x: 645, y: 400, phase: 'present', label: 'The Broken Crossing' },
  { id: 'canyon', x: 1460, y: 400, phase: 'present', label: 'Echo Canyon' },
  { id: 'watchtower', x: 2160, y: 400, phase: 'present', label: 'The Old Watchtower' },
  { id: 'warden', x: 3420, y: 400, phase: 'present', label: 'The Warden’s Reach' },
];

export function makeWorld() {
  const platforms = [];
  const add = (x, y, w, h = 24, phase = 'both', extra = {}) => platforms.push({
    id: `p${platforms.length}`, x, y, w, h, originX: x, previousX: x, phase, ...extra,
  });
  add(-40, 400, 760, 160);
  add(1020, 400, 530, 160);
  add(2020, 400, 740, 160);
  add(3020, 400, 1820, 160);
  add(300, 374, 72, 26);
  add(492, 348, 72, 18);
  add(724, 376, 90, 22, 'past');
  add(826, 348, 82, 22, 'past');
  add(920, 376, 100, 22, 'past');
  add(842, 298, 80, 22, 'present');
  add(1120, 338, 110, 20, 'past');
  add(1320, 318, 90, 22, 'present');
  add(1570, 369, 82, 22, 'past');
  add(1678, 336, 82, 22, 'present');
  add(1790, 304, 88, 22, 'past');
  add(1900, 354, 82, 22, 'present');
  add(2250, 298, 34, 102);
  add(2360, 345, 76, 20);
  add(2455, 250, 36, 150);
  add(2485, 328, 166, 22, 'present');
  add(2510, 232, 80, 20, 'past');
  add(2680, 340, 80, 20);
  add(2792, 367, 76, 22, 'both', { moving: true, amplitude: 46, speed: 1.25 });
  add(2902, 328, 80, 22, 'present');
  add(2902, 369, 80, 22, 'past');
  add(3120, 337, 120, 22, 'past');
  add(3290, 298, 94, 22, 'present');
  add(3610, 356, 100, 44);
  add(3790, 339, 80, 22, 'past');
  add(4450, 338, 98, 22, 'present');

  const pickups = [];
  const mote = (x, y, phase = 'both') => pickups.push({
    id: `m${pickups.length}`, x, y, phase, type: 'mote', xp: 12, radius: 7,
  });
  [[265,362],[327,344],[521,314],[595,365],[750,342],[864,310],[1080,365],
    [1165,306],[1360,285],[1607,338],[1720,302],[1930,322],[2310,353],
    [2394,309],[2540,198],[2715,307],[2950,296],[3170,301],[3335,264],
    [3670,321],[3828,307],[4500,302]].forEach(([x,y]) => mote(x,y));
  pickups.push(
    { id: 'seal-bridge', x: 966, y: 348, phase: 'past', type: 'seal', xp: 60, radius: 11, name: 'Echo of the Crossing' },
    { id: 'seal-canyon', x: 1831, y: 275, phase: 'past', type: 'seal', xp: 60, radius: 11, name: 'Echo of the Canyon' },
    { id: 'seal-tower', x: 2560, y: 299, phase: 'present', type: 'seal', xp: 60, radius: 11, name: 'Echo of the Watchtower' },
    { id: 'secret-bell', x: 878, y: 267, phase: 'present', type: 'secret', xp: 45, radius: 9, name: 'The Silent Bell' },
  );
  const enemies = [
    { id:'e0', x:450, y:384, min:405, max:478, phase:'both', type:'crawler' },
    { id:'e1', x:1260, y:384, min:1238, max:1308, phase:'both', type:'crawler' },
    { id:'e2', x:1390, y:372, min:1420, max:1520, phase:'past', type:'wisp' },
    { id:'e3', x:2080, y:384, min:2040, max:2130, phase:'both', type:'crawler' },
    { id:'e4', x:2550, y:382, min:2495, max:2650, phase:'past', type:'crawler' },
    { id:'e5', x:3190, y:373, min:3050, max:3340, phase:'present', type:'wisp' },
    { id:'e6', x:3500, y:384, min:3480, max:3585, phase:'both', type:'crawler' },
  ].map(e => ({ ...e, originY:e.y, w:18, h:16, hp:28, maxHp:28, dir:1, hurt:0, shoot:3, dead:false }));
  return {
    platforms, pickups, enemies,
    spikes:[{x:1174,y:392,w:40,h:8},{x:2605,y:392,w:36,h:8},{x:3730,y:392,w:36,h:8}],
    refills:[{x:1724,y:263,ready:0},{x:2840,y:303,ready:0}],
    npc:{x:180,y:400,name:'Maelin'},
    boss:{id:'warden',x:4140,y:362,w:28,h:38,hp:220,maxHp:220,hurt:0,active:false,dead:false,
      aura:'present',state:'idle',timer:2.3,cycle:0,tell:0},
    gate:{x:4640,y:400},
  };
}

export function activeIn(phase, timeline) { return phase === 'both' || phase === timeline; }
export function zoneAt(x) { return [...ZONES].reverse().find(z=>x >= z.x) || ZONES[0]; }
