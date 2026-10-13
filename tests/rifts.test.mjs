import test from 'node:test';
import assert from 'node:assert/strict';
import { Game, cleanProgress } from '../dist/engine.js';
import { SCENES, RIFT_CORES, ANCHORS, ARCHIVE_PAGES, CHECKPOINTS } from '../dist/world.js';
import { objectiveFor, dialogueFor } from '../dist/story.js';
const frames=(g,n,input={})=>{g.started=true;for(let i=0;i<n;i++)g.step(1/120,input);};
const ready=()=>{
  const g=new Game();Object.assign(g.progress,{anchors:ANCHORS.map(a=>a.id),collected:[...ANCHORS.map(a=>a.seal),...ARCHIVE_PAGES],met:['maelin','ivo','orin'],bossDefeated:true,completed:true,archiveComplete:true,ending:'search'});
  g.world.boss.dead=true;g.world.enemies=[];g.world.hazards=[];g.started=true;g.refillMovement();return g;
};
const enter=(g,scene)=>{
  const door=g.world.portals.find(q=>q.id===scene+'-door');
  g.scene='overworld';g.player.x=door.x-6;g.player.y=door.y-11;g.portalCooldown=0;
  assert.equal(g.warpPortal(door),true);frames(g,45);
};
const hop=(g,target)=>{
  const goal=target.x+Math.min(target.w/2,38)-6;
  if(target.phase!=='both'&&g.timeline!==target.phase){g.player.riftCooldown=0;assert.equal(g.shift(),true);}
  for(let n=0;n<220;n++){
    frames(g,1,{jump:n<31,up:n<31,right:g.player.x<goal-2,left:g.player.x>goal+2});
    if(n>12&&g.player.grounded&&g.player.groundId===target.id){frames(g,1);return;}
    if(g.player.dead)break;
  }
  assert.fail('Route could not reach '+target.id+' at '+target.x);
};
test('Rift doors gate progress and preserve an early chamber checkpoint on reload',()=>{
  const g=new Game(),door=g.world.portals.find(q=>q.id==='fold-door');
  g.player.x=524;g.player.y=354;assert.equal(g.warpPortal(door),false);
  g.progress.collected.push('seal-bridge');g.progress.anchors.push('anchor-bridge');
  assert.equal(g.warpPortal(door),true);assert.equal(g.scene,'fold');assert.equal(g.progress.checkpoint,'rift-fold');
  const loaded=new Game(JSON.parse(JSON.stringify(g.progress)));
  assert.equal(loaded.scene,'fold');assert.equal(loaded.progress.completed,false);assert.equal(loaded.progress.version,3);
});
test('Occupied portal exits refuse a warp without embedding or moving the player',()=>{
  const g=ready(),door=g.world.portals.find(q=>q.id==='fold-door'),exit=g.world.portals.find(q=>q.id===door.target);
  g.player.x=524;g.player.y=354;
  g.world.platforms.push({id:'blocked-exit',scene:'fold',x:exit.x-20,y:exit.y-30,w:40,h:60,phase:'both'});
  assert.equal(g.warpPortal(door),false);assert.equal(g.scene,'overworld');assert.equal(g.player.x,524);
});
test('The Fold is reachable through a real jump, momentum dash and timed realm landing',()=>{
  const g=ready();enter(g,'fold');
  frames(g,90,{right:true});frames(g,35,{right:true,jump:true,up:true});frames(g,20,{right:true,dash:true});
  assert.ok(g.player.x>8100);assert.equal(g.timeline,'present');
  frames(g,12,{right:true});frames(g,1,{right:true,rift:true});assert.equal(g.timeline,'past');
  frames(g,95,{right:true});frames(g,1,{rift:true});frames(g,18,{right:true});
  assert.ok(g.progress.collected.includes('rift-core-fold'));assert.equal(g.progress.deaths,0);
});
test('Lettered apertures preserve dash speed, change realms and prevent immediate reentry',()=>{
  const g=ready();g.scene='fold';g.timeline='past';const p=g.world.portals.find(q=>q.id==='fold-launch');
  Object.assign(g.player,{x:p.x-6,y:p.y-11,vx:500,vy:-50});assert.equal(g.warpPortal(p),true);
  assert.ok(g.player.vx>=500);assert.equal(g.timeline,'present');assert.ok(g.player.dashTime>0);
  assert.equal(g.warpPortal(g.world.portals.find(q=>q.id==='fold-catch')),false);
});
test('Rift Anchor costs focus, makes a temporary foothold and recalls with movement restored',()=>{
  const g=ready();g.progress.collected.push('rift-core-fold');g.timeline='past';
  Object.assign(g.player,{x:900,y:280,grounded:false,focus:100});
  assert.equal(g.placeRiftAnchor(),true);assert.equal(g.player.focus,70);assert.ok(g.solids().some(s=>s.id==='personal-anchor'));
  Object.assign(g.player,{x:1030,y:335,dashes:0});
  assert.equal(g.placeRiftAnchor(),true);assert.equal(g.player.x,900);assert.equal(g.player.y,280);assert.equal(g.player.focus,60);assert.equal(g.player.dashes,2);
  assert.equal(g.riftAnchor,null);assert.equal(g.placeRiftAnchor(),true);g.time+=6.1;frames(g,1);assert.equal(g.riftAnchor,null);
});
test('Crumbling platforms fall after waiting and recover without permanent save changes',()=>{
  const g=ready(),s=g.world.platforms.find(s=>s.crumble);g.timeline=s.phase;
  Object.assign(g.player,{x:s.x+10,y:s.y-22,grounded:true,groundId:s.id,vy:0});
  frames(g,85);assert.equal(g.isSolidPlatform(s),false);
  Object.assign(g.player,{x:90,y:378});g.time+=3.3;frames(g,1);assert.equal(g.isSolidPlatform(s),true);
  assert.deepEqual(new Game(g.progress).crumbling,{});
});
test('Clock eye freezes ledges temporarily and can be shot again',()=>{
  const g=ready();enter(g,'clock');Object.assign(g.player,{x:8760,y:378,facing:1});
  assert.equal(g.castBolt(),true);frames(g,15);assert.ok(g.freezeUntil>g.time);
  assert.ok(!g.progress.switches.includes('clock-stop'));const timed=g.world.platforms.find(s=>s.scene==='clock'&&s.timed);
  assert.equal(g.isSolidPlatform(timed),true);g.time+=6.5;g.player.boltCooldown=0;
  assert.equal(g.castBolt(),true);frames(g,15);assert.ok(g.freezeUntil>g.time);
});
test('Quiet stone opens a seven-second bridge and the Choir keystone makes it permanent',()=>{
  const g=ready();enter(g,'choir');Object.assign(g.player,{x:9814,y:378});frames(g,10);
  const bridge=g.world.platforms.find(s=>s.relay);assert.equal(g.isSolidPlatform(bridge),false);
  frames(g,155,{down:true});assert.equal(g.isSolidPlatform(bridge),true);frames(g,1);g.time+=7.5;
  assert.equal(g.isSolidPlatform(bridge),false);g.progress.collected.push('rift-core-choir');assert.equal(g.isSolidPlatform(bridge),true);
});
test('Sentinels require flanking or a charged finisher, and fresh Ward reflects bolts',()=>{
  const g=ready(),e=new Game().world.enemies.find(e=>e.type==='sentinel');g.world.enemies=[e];e.dir=-1;const hp=e.hp;
  g.hitEnemy(e,12,{kind:'sword',x:e.x-20,finisher:false});assert.equal(e.hp,hp);
  g.hitEnemy(e,12,{kind:'sword',x:e.x+25,finisher:false});assert.ok(e.hp<hp);e.hurt=0;
  g.hitEnemy(e,20,{kind:'sword',x:e.x-20,finisher:true});assert.ok(e.guardBroken>0);
  g.hitEnemy(e,12,{kind:'bolt'});assert.ok(e.stun>0);
  g.player.x=90;g.player.y=378;g.timeline='past';assert.equal(g.castWard(),true);
  const shot={x:96,y:389,vx:-140,vy:0,r:4,life:2,phase:'past',team:'enemy',damage:18};g.projectiles.push(shot);
  const vitality=g.player.hp;frames(g,1);assert.equal(shot.team,'player');assert.ok(shot.vx>0);assert.equal(g.player.hp,vitality);
});
test('Hollow noise wakes a pursuer while quiet movement lowers dread and Before clears it',()=>{
  const g=ready();g.scene='choir';g.timeline='present';Object.assign(g.player,{x:10400,y:378,grounded:true});g.dread=.76;
  frames(g,1);assert.ok(g.pursuer);const dread=g.dread;frames(g,35,{down:true});
  assert.ok(g.dread<dread);assert.equal(g.player.sneaking,true);g.player.riftCooldown=0;assert.equal(g.shift(),true);frames(g,1);assert.equal(g.pursuer,null);
});
test('The Borrowed telegraphs the last action and resets its fight when the player falls',()=>{
  const g=ready();g.progress.collected.push(...RIFT_CORES.map(c=>c.id));enter(g,'house');
  Object.assign(g.player,{x:11140,y:378,invincible:100});const b=g.world.borrowed;Object.assign(b,{active:true,state:'idle',timer:.62});
  frames(g,1,{right:true,dash:true});assert.equal(b.copy,'dash');assert.ok(b.warning.includes('DASH'));
  frames(g,75,{bolt:true});assert.equal(b.lastCopy,'dash');assert.ok(b.rush>0);
  b.hp=1;g.respawn(false);assert.equal(b.hp,b.maxHp);assert.equal(b.active,false);assert.equal(b.lastCopy,null);
});
test('The House ending is gated, awarded once and persists its distinct power benefit',()=>{
  for(const choice of ['remember','bind']){
    const g=ready();assert.equal(g.finishRiftStory(choice),false);g.progress.collected.push(...RIFT_CORES.map(c=>c.id));g.progress.houseBossDefeated=true;g.world.borrowed.dead=true;
    assert.equal(g.finishRiftStory(choice),true);assert.equal(g.maxFocus,120);assert.equal(g.finishRiftStory(choice),false);
    const loaded=new Game(JSON.parse(JSON.stringify(g.progress)));assert.equal(loaded.progress.riftEnding,choice);assert.equal(loaded.progress.houseComplete,true);
    if(choice==='bind'){assert.equal(loaded.castWard(),true);assert.equal(loaded.player.wardCooldown,4);}
    else assert.ok(dialogueFor({id:'rift-ending'},loaded).lines.length>1);
  }
});
test('Version-two journeys keep the Archive ending while gaining the new quest',()=>{
  const g=ready(),old={...g.progress,version:2};const loaded=new Game(old);
  assert.equal(loaded.progress.version,3);assert.equal(loaded.progress.ending,'search');assert.equal(loaded.hasPower('riftStep'),true);
  assert.equal(objectiveFor(loaded.progress).badge,'THE THREE WOUNDS · 0 / 3');
});
test('Invalid chamber rewards and House flags cannot bypass story gates',()=>{
  const p=cleanProgress({version:3,collected:['rift-core-choir'],houseComplete:true,houseBossDefeated:true,riftEnding:'bind',checkpoint:'rift-house',visited:['rift-house']});
  assert.equal(p.collected.length,0);assert.equal(p.houseComplete,false);assert.equal(p.houseBossDefeated,false);assert.equal(p.riftEnding,null);assert.equal(p.checkpoint,'approach');
  for(const scene of Object.values(SCENES))assert.ok(scene.right-scene.left>=640);
  for(const cp of CHECKPOINTS.filter(c=>c.scene))assert.ok(cp.x>=SCENES[cp.scene].left&&cp.x<SCENES[cp.scene].right);
});
test('Clockwell ledges can be crossed with real jumps and shifts during six frozen seconds',()=>{
  const g=ready();enter(g,'clock');frames(g,70,{right:true});assert.equal(g.castBolt(),true);frames(g,4);
  assert.ok(g.freezeUntil>g.time);
  for(const target of g.world.platforms.filter(s=>s.scene==='clock'&&s.x>=8850).sort((a,b)=>a.x-b.x))hop(g,target);
  assert.ok(g.freezeUntil>g.time);frames(g,40,{right:true});assert.ok(g.progress.collected.includes('rift-core-clock'));assert.equal(g.progress.deaths,0);
});
test('The quiet Choir path reaches its keystone with real jumps and realm shifts',()=>{
  const g=ready();enter(g,'choir');frames(g,45,{right:true});frames(g,155,{down:true});frames(g,1);
  for(const target of g.world.platforms.filter(s=>s.scene==='choir'&&s.x>=9930).sort((a,b)=>a.x-b.x))hop(g,target);
  frames(g,1,{rift:true});frames(g,10,{right:true});assert.ok(g.progress.collected.includes('rift-core-choir'));assert.equal(g.progress.deaths,0);
});
