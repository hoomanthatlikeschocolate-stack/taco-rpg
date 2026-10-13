import test from 'node:test';
import assert from 'node:assert/strict';
import { Game, cleanProgress, xpRequired, overlaps } from '../dist/engine.js';
const step=(g,n,input={})=>{g.started=true;for(let i=0;i<n;i++)g.step(1/120,input);};
test('Player lands on the ground, moves, jumps, and lands again',()=>{
  const g=new Game();step(g,30);assert.equal(g.player.y,378);assert.equal(g.player.grounded,true);
  step(g,30,{right:true});assert.ok(g.player.x>110);
  const startY=g.player.y;step(g,15,{jump:true});assert.ok(g.player.y<startY-35);
  step(g,150);assert.equal(g.player.grounded,true);
});
test('Short jumps are lower than held jumps',()=>{
  const a=new Game(),b=new Game();step(a,30);step(b,30);
  step(a,1,{jump:true});step(a,16);step(b,17,{jump:true});assert.ok(b.player.y<a.player.y-20);
});
test('Dash is limited in the air and recharges on landing',()=>{
  const g=new Game();step(g,30);step(g,20,{jump:true});step(g,1,{dash:true,right:true});
  assert.equal(g.player.dashReady,false);const x=g.player.x;step(g,10,{dash:true,right:true});assert.ok(g.player.x>x+35);
  step(g,180);assert.equal(g.player.dashReady,true);
});
test('Changing timelines refuses to embed the player in a wall',()=>{
  const g=new Game();g.player.x=850;g.player.y=307;g.timeline='past';assert.equal(g.shift(),false);assert.equal(g.timeline,'past');
  g.player.x=700;g.player.y=325;assert.equal(g.shift(),true);assert.equal(g.timeline,'present');
});
test('Echo seals collect once and only in their timeline',()=>{
  const g=new Game();const seal=g.world.pickups.find(p=>p.id==='seal-bridge');g.player.x=seal.x-6;g.player.y=seal.y-11;
  step(g,1);assert.equal(g.seals,0);g.timeline='past';step(g,1);assert.equal(g.seals,1);
  const xp=g.progress.xp;step(g,1);assert.equal(g.progress.xp,xp);
});
test('XP levels up, grants a skill point, and upgrades change stats',()=>{
  const g=new Game();g.gainXP(xpRequired(1));assert.equal(g.progress.level,2);assert.equal(g.progress.skillPoints,1);
  assert.equal(g.buySkill('vitality'),true);assert.equal(g.maxHealth,120);assert.equal(g.buySkill('edge'),false);
});
test('Respawn keeps earned XP, collected seals, and upgrades',()=>{
  const g=new Game();g.progress.collected=['seal-bridge'];g.gainXP(100);g.buySkill('edge');g.progress.checkpoint='watchtower';g.player.hp=0;
  g.respawn();assert.equal(g.player.x,2160);assert.equal(g.progress.level,2);assert.equal(g.damage,16);assert.equal(g.seals,1);assert.equal(g.player.hp,g.maxHealth);
});
test('Saved rewards and completed bosses remain completed after loading',()=>{
  const g=new Game();g.progress.defeated=['e0'];g.progress.bossDefeated=true;g.progress.collected=['seal-bridge','seal-canyon','seal-tower'];g.progress.completed=true;
  const loaded=new Game(JSON.parse(JSON.stringify(g.progress)));assert.equal(loaded.world.enemies[0].dead,true);assert.equal(loaded.world.boss.dead,true);assert.equal(loaded.progress.completed,true);
});
test('Corrupt save values cannot break physics or inject unknown rewards',()=>{
  const p=cleanProgress({version:1,level:Infinity,xp:NaN,skills:{vitality:100},collected:['bogus'],checkpoint:'missing'});
  assert.equal(p.level,1);assert.equal(p.skills.vitality,0);assert.equal(p.xp,0);assert.deepEqual(p.collected,[]);assert.equal(p.checkpoint,'approach');
});
test('The player cannot tunnel through a wall during a dash',()=>{
  const g=new Game();g.world.platforms.push({id:'testwall',x:220,y:100,w:12,h:300,phase:'both',originX:220,previousX:220});
  g.player.x=170;g.player.y=250;step(g,20,{dash:true,right:true});assert.ok(g.player.x+g.player.w<=220.01);
  assert.ok(!overlaps(g.player,g.world.platforms.at(-1)));
});
