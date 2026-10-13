export const VIEW = { width: 640, height: 360 };
export const WORLD_WIDTH = 7600;
export const WORLD_HEIGHT = 520;
export const SAVE_KEY = 'riftbound.journey.v1';
export const ZONES = [
  { x: 0, name: 'Lantern Camp', subtitle: 'Your brother left a light burning.', region: 'crossing' },
  { x: 690, name: 'The Broken Crossing', subtitle: 'The river remembers a bridge that you cannot see.', region: 'crossing' },
  { x: 1520, name: 'Whisper Canyon', subtitle: 'Do not answer a voice that sounds like your own.', region: 'crossing' },
  { x: 2100, name: 'The Bellkeeper’s Tower', subtitle: 'Climb. The dark cannot follow every step.', region: 'crossing' },
  { x: 3050, name: 'The Unremembered Wood', subtitle: 'Something here has learned to wear a face.', region: 'crossing' },
  { x: 3890, name: 'The Warden’s Oath', subtitle: 'He was ordered to keep everyone safe. Everyone.', region: 'crossing' },
  { x: 4800, name: 'The Drowned Archive', subtitle: 'Every name the kingdom forgot is written here.', region: 'archive' },
  { x: 5900, name: 'The Listening Stacks', subtitle: 'The books open when you turn your back.', region: 'archive' },
  { x: 6760, name: 'The Last Remembered Room', subtitle: 'You know this voice. This time, it knows you.', region: 'archive' },
];
export const SKILLS = [
  { id: 'vitality', name: 'Steadfast', symbol: '♡', detail: '+20 maximum health.', max: 4 },
  { id: 'edge', name: 'Rift Edge', symbol: '⚔', detail: '+4 sword damage; stronger finishers.', max: 4 },
  { id: 'stride', name: 'Longstride', symbol: '➶', detail: '+12% dash distance.', max: 3 },
  { id: 'focus', name: 'Deep Light', symbol: '✧', detail: '+20 focus; faster regeneration.', max: 3 },
];
export const CHECKPOINTS = [
  { id: 'approach', x: 90, y: 400, phase: 'present', label: 'Lantern Camp' },
  { id: 'crossing', x: 645, y: 400, phase: 'present', label: 'Broken Crossing' },
  { id: 'canyon', x: 1460, y: 400, phase: 'present', label: 'Whisper Canyon' },
  { id: 'watchtower', x: 2160, y: 400, phase: 'present', label: 'Bellkeeper’s Tower' },
  { id: 'warden', x: 3420, y: 400, phase: 'present', label: 'Unremembered Wood' },
  { id: 'archive', x: 4910, y: 400, phase: 'present', label: 'Drowned Archive' },
  { id: 'stacks', x: 6200, y: 400, phase: 'present', label: 'Listening Stacks' },
  { id: 'last-room', x: 7000, y: 400, phase: 'present', label: 'Last Remembered Room' },
];
export const ANCHORS = [
  { id: 'anchor-bridge', seal: 'seal-bridge', x: 1070, y: 400, name: 'Crossing Lantern', power: 'doubleJump', powerName: 'Second Wind', detail: 'Press W again in the air to double jump.' },
  { id: 'anchor-canyon', seal: 'seal-canyon', x: 2090, y: 400, name: 'Canyon Lantern', power: 'bolt', powerName: 'Rift Bolt', detail: 'K fires a bolt. It also activates eye switches.' },
  { id: 'anchor-tower', seal: 'seal-tower', x: 3060, y: 400, name: 'Woodland Lantern', power: 'ward', powerName: 'Ward Pulse', detail: 'L blocks damage, clears enemy bolts, and knocks back nearby creatures.' },
];
export const POWERS = [
  { id: 'dash', key: 'X', name: 'Rift Dash', detail: 'Aim with WASD. Recharges on landing and wall jumps.' },
  { id: 'doubleJump', key: 'W W', name: 'Second Wind', detail: 'One extra jump in the air. Light the Crossing Lantern.' },
  { id: 'bolt', key: 'K', name: 'Rift Bolt', detail: 'A ranged focus attack. Light the Canyon Lantern.' },
  { id: 'ward', key: 'L', name: 'Ward Pulse', detail: 'A protective burst; 5-second cooldown. Light the Woodland Lantern.' },
  { id: 'riftStep', key: 'X X', name: 'Echo Step', detail: 'Two dashes before landing. Find Ivo in the Archive.' },
];
export const LORE = [
  { id: 'lore-camp', x: 380, y: 400, name: 'A letter without a name', text: 'Nara: if I am late, leave my lantern lit. If Maelin tells you I never existed, do not believe her. The bells only ring for names that are still remembered. — Ivo', xp: 18 },
  { id: 'lore-bridge', x: 1160, y: 400, name: 'The first bargain', text: 'The town asked the rift to undo one winter. It did. The grain returned. The graves emptied. The price was one memory from every household. Nobody noticed what was missing until the next winter.', xp: 18 },
  { id: 'lore-canyon', x: 1500, y: 400, name: 'Rules for the Hollow', text: 'Do not count the figures between the trees. Do not follow a lantern that moves without a hand. If the dark calls you by your name, say nothing. It has not learned your voice yet.', xp: 18 },
  { id: 'lore-tower', x: 2388, y: 345, name: 'The bellkeeper’s tally', text: 'One bell for every name. Today I rang forty-three. Yesterday there were forty-four. There is an empty chair at my table and I cannot remember why it makes me cry.', xp: 22 },
  { id: 'lore-warden', x: 3660, y: 356, name: 'An order never rescinded', text: 'Captain Lumen: seal the crossing until every villager has returned. No one is to be left behind. Hold your post until relieved. The ink is a century old. Beneath it, in a shaking hand: I am still waiting.', xp: 25 },
  { id: 'lore-archive', x: 4970, y: 400, name: 'A kingdom made of absences', text: 'The Archive was built underneath the river so the Hollow could not hear us writing. These shelves do not hold books. They hold the lives we paid away. Somewhere among them, a boy has been keeping a light on.', xp: 22 },
  { id: 'lore-switch', x: 6310, y: 400, name: 'The lock that listens', text: 'The floodgate answers light, not force. Face its eye and send a Rift Bolt with K. Beyond it, the last page remembers who opened the crossing.', xp: 15 },
];
export const ARCHIVE_PAGES = ['archive-page-1', 'archive-page-2', 'archive-page-3'];
export const PAGE_TEXT = [
  'I found the missing names. They are not dead. They are being used to keep the other world alive. — Ivo',
  'Maelin was the first keeper. She traded her own brother to stop the winter. Now she cannot remember his face. I think that is why she helped me. — Ivo',
  'I opened the crossing to give the names back. The Hollow came through with them. If Nara finds this: I am sorry. I wanted to bring everyone home. — Ivo',
];

export function makeWorld() {
  const platforms = [];
  const add = (x,y,w,h=24,phase='both',extra={}) => platforms.push({id:'p'+platforms.length,x,y,w,h,originX:x,previousX:x,phase,...extra});
  add(-40,400,760,160);add(1020,400,530,160);add(2020,400,740,160);add(3020,400,1780,160);
  add(300,374,72,26);add(492,348,72,18);
  add(724,376,90,22,'past');add(826,348,82,22,'past');add(920,376,100,22,'past');
  add(842,298,80,22,'present');add(1120,338,110,20,'past');add(1320,318,90,22,'present');
  add(1570,369,82,22,'past');add(1678,336,82,22,'present');add(1790,304,88,22,'past');add(1900,354,82,22,'present');
  add(2250,298,34,102);add(2300,345,136,20);add(2455,250,36,150);
  add(2485,328,166,22,'present');add(2510,232,80,20,'past');add(2680,340,80,20);
  add(2792,367,76,22,'both',{moving:true,amplitude:35,speed:1.25});
  add(2902,328,100,22,'present');add(2902,369,100,22,'past');
  add(3120,337,120,22,'past');add(3290,298,94,22,'present');
  add(3170,235,94,22,'present');add(3250,345,30,55);
  add(3610,356,100,44);add(3790,339,80,22,'past');add(4450,338,98,22,'present');
  add(4800,400,460,160);add(5500,400,320,160);add(6020,400,450,160);add(6710,400,930,160);
  add(5050,346,45,54);add(5140,358,100,22,'past');
  add(5280,370,70,22,'past');add(5368,340,70,22,'present');add(5445,370,55,22,'past');
  add(5540,309,110,22,'present');add(5730,340,65,60);
  add(5830,369,80,22,'present');add(5918,327,90,22,'past');
  add(6045,287,35,113);add(6080,287,100,22);
  add(6250,331,100,20,'past');
  add(6490,359,70,22,'past');add(6570,320,80,22,'both',{moving:true,amplitude:13,speed:1});
  add(6650,353,90,22,'present');add(6810,365,40,35);add(6860,312,130,22,'past');
  add(7290,300,120,22,'present');add(7430,250,90,22,'past');

  const pickups = [];
  const mote=(x,y,phase='both')=>pickups.push({id:'m'+pickups.length,x,y,phase,type:'mote',xp:12,radius:7});
  [[265,362],[327,344],[521,314],[595,365],[750,342],[864,310],[1080,365],
    [1165,306],[1360,285],[1607,338],[1720,302],[1930,322],[2310,313],
    [2394,309],[2540,198],[2715,307],[2950,296],[3170,301],[3335,264],
    [3670,321],[3828,307],[4500,302],[5090,314],[5330,333],[5558,275],
    [5800,350],[5970,294],[6120,365],[6278,298],[6610,287],[6888,276],[7350,265],[7470,215]].forEach(([x,y])=>mote(x,y));
  pickups.push(
    {id:'seal-bridge',x:966,y:348,phase:'past',type:'seal',xp:65,radius:11,name:'Echo of the Crossing'},
    {id:'seal-canyon',x:1831,y:275,phase:'past',type:'seal',xp:65,radius:11,name:'Echo of the Canyon'},
    {id:'seal-tower',x:2560,y:299,phase:'present',type:'seal',xp:65,radius:11,name:'Echo of the Watchtower'},
    {id:'secret-bell',x:878,y:267,phase:'present',type:'secret',xp:50,radius:9,name:'The Silent Bell'},
    {id:'gear-1',x:1190,y:307,phase:'past',type:'gear',xp:18,radius:8,name:'Pip’s brass gear'},
    {id:'gear-2',x:2330,y:314,phase:'both',type:'gear',xp:18,radius:8,name:'Pip’s silver gear'},
    {id:'gear-3',x:3334,y:268,phase:'present',type:'gear',xp:18,radius:8,name:'Pip’s blue gear'},
    {id:'lantern-glass',x:3215,y:205,phase:'present',type:'lantern',xp:35,radius:9,name:'Sera’s lantern glass'},
    {id:'archive-page-1',x:5190,y:330,phase:'past',type:'page',xp:45,radius:10,name:'Ivo’s first page'},
    {id:'archive-page-2',x:6120,y:258,phase:'present',type:'page',xp:45,radius:10,name:'Ivo’s second page'},
    {id:'archive-page-3',x:6920,y:285,phase:'past',type:'page',xp:45,radius:10,name:'Ivo’s last page'},
    {id:'secret-archive',x:7470,y:217,phase:'past',type:'secret',xp:80,radius:9,name:'The name beneath the ink'}
  );
  const seeds=[
    {id:'e0',x:450,y:384,min:405,max:478,phase:'both',type:'crawler'},
    {id:'e1',x:1260,y:384,min:1238,max:1308,phase:'both',type:'crawler'},
    {id:'e2',x:1390,y:365,min:1370,max:1520,phase:'past',type:'wisp'},
    {id:'e3',x:2210,y:384,min:2178,max:2240,phase:'both',type:'crawler'},
    {id:'e4',x:2550,y:382,min:2495,max:2650,phase:'past',type:'crawler'},
    {id:'e5',x:3190,y:370,min:3078,max:3340,phase:'present',type:'wisp'},
    {id:'e6',x:3500,y:384,min:3460,max:3585,phase:'both',type:'crawler'},
    {id:'husk-wood',x:3380,y:376,min:3300,max:3580,phase:'present',type:'husk'},
    {id:'watcher-canyon',x:1700,y:208,min:1700,max:1700,phase:'present',type:'watcher'},
    {id:'mimic-wood',x:3850,y:382,min:3800,max:3880,phase:'present',type:'mimic'},
    {id:'watcher-archive',x:5630,y:250,min:5630,max:5630,phase:'present',type:'watcher'},
    {id:'husk-stacks',x:6240,y:376,min:6205,max:6310,phase:'present',type:'husk'},
    {id:'wisp-archive',x:5580,y:350,min:5510,max:5685,phase:'past',type:'wisp'},
    {id:'mimic-archive',x:7040,y:382,min:7005,max:7150,phase:'present',type:'mimic'},
    {id:'watcher-last',x:7360,y:240,min:7360,max:7360,phase:'present',type:'watcher'}
  ];
  const enemies=seeds.map(e=>({...e,originY:e.y,w:e.type==='husk'?16:18,h:e.type==='husk'?24:16,
    hp:e.type==='husk'?46:e.type==='watcher'?34:28,maxHp:e.type==='husk'?46:e.type==='watcher'?34:28,
    dir:1,hurt:0,shoot:1.7,tell:0,awake:false,dead:false}));
  return {
    platforms,pickups,enemies,anchors:ANCHORS.map(a=>({...a})),lore:LORE,
    npcs:[
      {id:'maelin',x:180,y:400,name:'Maelin',role:'Lantern keeper'},
      {id:'pip',x:1115,y:400,name:'Pip',role:'Clockwork crow'},
      {id:'sera',x:3355,y:400,name:'Sera',role:'The last ferryman'},
      {id:'ivo-echo',x:4930,y:400,name:'Ivo’s echo',role:'A familiar voice'},
      {id:'ivo',x:7100,y:400,name:'Ivo',role:'Your missing brother'}
    ],
    spikes:[{x:1174,y:392,w:40,h:8,phase:'both'},{x:2605,y:392,w:36,h:8,phase:'both'},
      {x:3730,y:392,w:40,h:8,phase:'both'},{x:5550,y:392,w:38,h:8,phase:'present'},{x:6340,y:392,w:38,h:8,phase:'past'}],
    refills:[{x:1724,y:263,ready:0},{x:2840,y:303,ready:0},{x:5420,y:291,ready:0},{x:6588,y:275,ready:0}],
    hazards:[{x:5590,y:343,range:39,speed:1.4,r:9,phase:'present'},{x:6670,y:285,range:35,speed:1.8,r:9,phase:'past'}],
    switches:[{id:'archive-switch',x:6380,y:382,name:'Floodgate eye'}],
    chests:[{id:'cache-wood',x:3150,y:337,xp:60,name:'Bellkeeper’s cache',power:'doubleJump'},
      {id:'cache-archive',x:6285,y:331,xp:70,name:'Keeper’s supplies',power:'bolt'}],
    trial:{id:'bell-run',x:2710,y:340,limit:18,bells:[{x:2830,y:334},{x:3060,y:355},{x:3318,y:266}]},
    boss:{id:'warden',x:4140,y:362,w:28,h:38,hp:300,maxHp:300,hurt:0,active:false,dead:false,
      aura:'present',state:'idle',timer:2.5,cycle:0,tell:0,charge:0,chargeDir:1},
    gate:{x:4640,y:400}
  };
}
export function activeIn(phase,timeline){return phase==='both'||phase===timeline;}
export function zoneAt(x){return [...ZONES].reverse().find(z=>x>=z.x)||ZONES[0];}
