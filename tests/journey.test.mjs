import test from 'node:test';
import assert from 'node:assert/strict';
import { Game, cleanProgress, xpRequired, overlaps } from '../dist/engine.js';
import { objectiveFor } from '../dist/story.js';
import { ANCHORS, ARCHIVE_PAGES } from '../dist/world.js';
const step=(g,n,input={})=>{g.started=true;for(let i=0;i<n;i++)g.step(1/120,input);};
const totalXP=g=>Array.from({length:g.progress.level-1},(_,i)=>xpRequired(i+1)).reduce((a,b)=>a+b,0)+g.progress.xp;
const light=(g,index)=>{const a=ANCHORS[index];if(!g.progress.collected.includes(a.seal))g.progress.collected.push(a.seal);g.player.x=a.x;g.player.y=a.y-22;g.interact();g.drainEvents();};
test('Holding jump into a tall wall climbs continuously and pulls over its edge',()=>{
  const g=new Game();
  g.world.platforms=[{id:'floor',x:0,y:400,w:800,h:160,phase:'both',originX:0,previousX:0},{id:'tall-wall',x:220,y:260,w:35,h:140,phase:'both',originX:220,previousX:220}];
  g.world.enemies=[];g.player.x=204;step(g,20);let highest=g.player.y;
  for(let i=0;i<220;i++){step(g,1,{right:true,jump:true,up:true});highest=Math.min(highest,g.player.y);}
  assert.ok(highest<=238,'Climbing must reach the top of a wall higher than a normal jump');
  assert.ok(g.player.x>255,'The player must pull over the ledge and continue walking');
  assert.ok(!g.world.platforms.some(s=>overlaps(g.player,s)));
});
test('Second Wind unlocks at its lantern and allows exactly one extra airborne jump',()=>{
  const g=new Game();assert.equal(g.hasPower('doubleJump'),false);light(g,0);assert.equal(g.hasPower('doubleJump'),true);
  g.player.x=90;g.player.y=378;g.player.vy=0;step(g,20);step(g,8,{jump:true});step(g,2);step(g,1,{jump:true});
  assert.equal(g.player.doubleUsed,true);assert.ok(g.player.vy<-380);step(g,2);step(g,1,{jump:true});assert.ok(g.player.vy>-250);
});
test('Rift Bolts use focus and actually open the Archive floodgate',()=>{
  const g=new Game();assert.equal(g.castBolt(),false);light(g,1);
  g.player.x=6348;g.player.y=378;g.player.facing=1;const focus=g.player.focus;
  assert.equal(g.castBolt(),true);assert.equal(g.player.focus,focus-18);assert.equal(g.castBolt(),false);
  step(g,20);assert.ok(g.progress.switches.includes('archive-switch'));assert.ok(!g.solids().some(s=>s.id==='floodgate'));
});
test('Ward blocks incoming damage, expires, and observes its cooldown',()=>{
  const g=new Game();light(g,2);g.player.x=90;g.player.y=378;assert.equal(g.castWard(),true);
  const hp=g.player.hp;g.hurt(30,110);assert.equal(g.player.hp,hp);assert.equal(g.castWard(),false);
  step(g,170);g.hurt(30,110);assert.equal(g.player.hp,hp-30);
});
test('Side quest rewards can be earned once and survive reloading',()=>{
  const g=new Game();g.progress.collected.push('gear-1','gear-2','gear-3');g.player.x=1115;g.player.y=378;
  g.interact();assert.equal(g.progress.gearsReturned,true);assert.equal(g.maxFocus,120);
  const xp=totalXP(g);g.interact();assert.equal(totalXP(g),xp);
  const loaded=new Game(JSON.parse(JSON.stringify(g.progress)));assert.equal(loaded.maxFocus,120);assert.equal(loaded.progress.gearsReturned,true);
});
test('Existing version-one saves keep the completed crossing and acquire its powers',()=>{
  const g=new Game({version:1,level:4,xp:22,skills:{vitality:1,edge:1,stride:1},collected:['seal-bridge','seal-canyon','seal-tower'],defeated:['e0'],checkpoint:'warden',bossDefeated:true,completed:true,played:200});
  assert.equal(g.progress.version,3);assert.equal(g.progress.completed,true);assert.equal(g.progress.level,4);assert.equal(g.progress.xp,22);
  assert.equal(g.hasPower('doubleJump'),true);assert.equal(g.hasPower('bolt'),true);assert.equal(g.hasPower('ward'),true);
  assert.equal(objectiveFor(g.progress).badge,'THE DROWNED ARCHIVE');
});
test('A full quest journey unlocks the Archive, an ending and two air dashes',()=>{
  const g=new Game();g.player.x=180;g.player.y=378;g.interact();assert.ok(g.progress.met.includes('maelin'));
  for(let i=0;i<3;i++)light(g,i);
  assert.equal(objectiveFor(g.progress).title,'Break the Warden’s oath');
  g.world.boss.active=true;g.world.boss.aura='past';g.hitBoss(1000);assert.equal(g.progress.bossDefeated,true);
  g.player.x=4635;g.player.y=378;step(g,1);assert.equal(g.progress.completed,true);
  assert.ok(!g.solids().some(s=>s.id==='archive-lock'));assert.equal(g.chooseEnding('home'),false);
  g.progress.collected.push(...ARCHIVE_PAGES);g.progress.switches.push('archive-switch');g.player.x=7100;g.player.y=378;g.interact();
  assert.equal(g.chooseEnding('search'),true);assert.equal(g.maxDashes,2);assert.equal(g.chooseEnding('home'),false);
  const loaded=new Game(g.progress);assert.equal(loaded.progress.archiveComplete,true);assert.equal(loaded.progress.ending,'search');assert.equal(loaded.maxDashes,2);
  loaded.player.x=90;loaded.player.y=280;step(loaded,1,{dash:true,right:true});step(loaded,24);step(loaded,1,{dash:true,right:true});
  assert.equal(loaded.player.dashes,0);assert.ok(loaded.player.dashTime>0);
});
test('The quest marker changes from an Echo to its lantern, then to the next Echo',()=>{
  const g=new Game();g.progress.met.push('maelin');assert.equal(objectiveFor(g.progress).target.x,966);
  g.progress.collected.push('seal-bridge');assert.equal(objectiveFor(g.progress).target.x,1070);
  light(g,0);assert.equal(objectiveFor(g.progress).target.x,1831);
});
test('The bell challenge grants XP once while retaining improved times',()=>{
  const g=new Game();light(g,0);g.world.enemies=[];g.world.hazards=[];g.world.spikes=[];
  const finish=()=>{g.startTrial();for(const b of g.world.trial.bells){g.player.x=b.x-6;g.player.y=b.y-11;g.player.vx=0;g.player.vy=0;step(g,1);}};
  finish();assert.ok(g.progress.trialBest>0);assert.equal(g.trial,null);const xp=totalXP(g);finish();assert.equal(totalXP(g),xp);
});
test('Invalid new quest fields cannot grant powers or fast travel',()=>{
  const p=cleanProgress({version:2,level:1,anchors:['anchor-tower','unknown'],visited:['last-room'],archiveComplete:true,ending:'search',trialBest:Infinity,collected:[]});
  const g=new Game(p);assert.equal(g.hasPower('ward'),false);assert.equal(g.hasPower('riftStep'),false);assert.deepEqual(p.visited,['approach']);assert.equal(p.trialBest,0);
});
