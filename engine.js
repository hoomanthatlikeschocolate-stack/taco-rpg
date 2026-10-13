import { makeWorld, activeIn, CHECKPOINTS, SKILLS, ANCHORS, ARCHIVE_PAGES, WORLD_WIDTH, WORLD_HEIGHT, zoneAt } from './world.js';
export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const approach=(v,target,step)=>v<target?Math.min(target,v+step):Math.max(target,v-step);
export const overlaps=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
export const xpRequired=level=>80+(level-1)*35;
export function freshProgress(){
  return {version:2,level:1,xp:0,skillPoints:0,skills:{vitality:0,edge:0,stride:0,focus:0},
    collected:[],defeated:[],anchors:[],met:[],lore:[],opened:[],switches:[],visited:['approach'],
    checkpoint:'approach',bossDefeated:false,completed:false,archiveComplete:false,ending:null,
    gearsReturned:false,lanternReturned:false,trialBest:0,deaths:0,played:0};
}
export function cleanProgress(input){
  const p=freshProgress();
  if(!input||![1,2].includes(input.version))return p;
  const integer=(v,max)=>Number.isFinite(v)?clamp(Math.floor(v),0,max):0;
  const ids=(list,valid)=>[...new Set(Array.isArray(list)?list:[])].filter(id=>valid.includes(id));
  const world=makeWorld();
  p.level=Math.max(1,integer(input.level,50));p.xp=integer(input.xp,xpRequired(p.level)-1);
  for(const s of SKILLS)p.skills[s.id]=integer(input.skills?.[s.id],s.max);
  if(Object.values(p.skills).reduce((a,b)=>a+b,0)>p.level-1)p.skills={vitality:0,edge:0,stride:0,focus:0};
  p.skillPoints=p.level-1-Object.values(p.skills).reduce((a,b)=>a+b,0);
  p.collected=ids(input.collected,world.pickups.map(o=>o.id));
  p.defeated=ids(input.defeated,world.enemies.map(o=>o.id));
  p.anchors=ids(input.anchors,ANCHORS.map(a=>a.id)).filter(id=>p.collected.includes(ANCHORS.find(a=>a.id===id).seal));
  if(input.version===1)p.anchors=ANCHORS.filter(a=>p.collected.includes(a.seal)).map(a=>a.id);
  p.met=ids(input.met,world.npcs.map(o=>o.id));
  if(input.version===1&&(input.played>0||p.collected.length||input.checkpoint!=='approach'))p.met.push('maelin');
  p.met=[...new Set(p.met)];
  p.lore=ids(input.lore,world.lore.map(o=>o.id));p.opened=ids(input.opened,world.chests.map(o=>o.id));
  p.switches=ids(input.switches,world.switches.map(o=>o.id));
  p.bossDefeated=input.bossDefeated===true;
  p.completed=input.completed===true&&p.bossDefeated&&p.anchors.length===3;
  p.ending=['home','search'].includes(input.ending)?input.ending:null;
  p.archiveComplete=input.archiveComplete===true&&p.completed&&ARCHIVE_PAGES.every(id=>p.collected.includes(id))&&!!p.ending;
  if(!p.archiveComplete)p.ending=null;
  p.gearsReturned=input.gearsReturned===true&&p.collected.filter(id=>id.startsWith('gear-')).length===3;
  p.lanternReturned=input.lanternReturned===true&&p.collected.includes('lantern-glass');
  p.trialBest=Number.isFinite(input.trialBest)&&input.trialBest>0&&input.trialBest<=world.trial.limit?input.trialBest:0;
  p.checkpoint=CHECKPOINTS.some(c=>c.id===input.checkpoint)?input.checkpoint:'approach';
  if(!p.completed&&CHECKPOINTS.find(c=>c.id===p.checkpoint).x>=4800)p.checkpoint='warden';
  p.visited=ids(input.visited,CHECKPOINTS.filter(c=>p.completed||c.x<4800).map(c=>c.id));
  if(input.version===1)p.visited=CHECKPOINTS.filter(c=>c.x<=CHECKPOINTS.find(c=>c.id===p.checkpoint).x).map(c=>c.id);
  p.visited=[...new Set(['approach',...p.visited,p.checkpoint])];
  p.deaths=integer(input.deaths,100000);p.played=Number.isFinite(input.played)?clamp(input.played,0,10000000):0;
  return p;
}
export class Game{
  constructor(progress){
    this.progress=cleanProgress(progress);this.world=makeWorld();
    const cp=CHECKPOINTS.find(c=>c.id===this.progress.checkpoint);
    this.timeline=cp.phase;this.time=0;this.events=[];this.projectiles=[];this.particles=[];this.floats=[];this.trails=[];
    this.camera={x:clamp(cp.x-170,0,WORLD_WIDTH-640),y:60};this.shake=0;this.flash=0;this.riftFlash=0;
    this.zone=zoneAt(cp.x).name;this.started=false;this.previous={};this.respawnTimer=0;this.trial=null;this.reduceMotion=false;
    this.world.enemies.forEach(e=>e.dead=this.progress.defeated.includes(e.id));this.world.boss.dead=this.progress.bossDefeated;
    this.player={x:cp.x,y:cp.y-22,w:12,h:22,vx:0,vy:0,facing:1,grounded:false,groundId:null,wall:0,
      coyote:0,buffer:0,wallLock:0,climbing:false,doubleUsed:false,dashTime:0,dashReady:true,dashes:this.maxDashes,dashX:0,dashY:0,
      riftCooldown:0,attack:0,attackCooldown:0,attackHits:[],combo:0,comboWindow:0,
      boltCooldown:0,wardCooldown:0,wardTime:0,focus:this.maxFocus,invincible:0,hp:this.maxHealth,dead:false};
  }
  get maxHealth(){return 100+this.progress.skills.vitality*20+(this.progress.lanternReturned?10:0)+(this.progress.ending==='home'?10:0);}
  get maxFocus(){return 100+this.progress.skills.focus*20+(this.progress.gearsReturned?20:0);}
  get damage(){return 12+this.progress.skills.edge*4;}
  get maxDashes(){return this.hasPower('riftStep')?2:1;}
  get seals(){return this.progress.collected.filter(id=>id.startsWith('seal-')).length;}
  hasPower(id){return id==='dash'||(id==='riftStep'&&this.progress.archiveComplete)||ANCHORS.some(a=>a.power===id&&this.progress.anchors.includes(a.id));}
  emit(type,data={}){this.events.push({type,...data});}
  drainEvents(){return this.events.splice(0);}
  save(){this.emit('save');}
  burst(x,y,color,count=10,speed=55){
    for(let i=0;i<count;i++){const a=i/count*Math.PI*2+this.time;
      this.particles.push({x,y,vx:Math.cos(a)*speed*(.5+i%3*.2),vy:Math.sin(a)*speed-20,color,life:.38+i%4*.09,max:.65,size:i%3===0?3:2});}
  }
  float(text,x,y,color='#fff0bd'){this.floats.push({text,x,y,color,life:1.2});}
  gainXP(amount){
    this.progress.xp+=amount;
    while(this.progress.xp>=xpRequired(this.progress.level)){
      this.progress.xp-=xpRequired(this.progress.level);this.progress.level++;this.progress.skillPoints++;
      this.player.hp=this.maxHealth;this.player.focus=this.maxFocus;
      this.burst(this.player.x+6,this.player.y+12,'#ffdc8c',26,100);this.emit('level',{level:this.progress.level});
    }this.save();
  }
  buySkill(id){
    const s=SKILLS.find(s=>s.id===id);if(!s||this.progress.skillPoints<1||this.progress.skills[id]>=s.max)return false;
    this.progress.skills[id]++;this.progress.skillPoints--;
    if(id==='vitality')this.player.hp=Math.min(this.maxHealth,this.player.hp+20);
    if(id==='focus')this.player.focus=Math.min(this.maxFocus,this.player.focus+20);
    this.emit('upgrade',{name:s.name});this.save();return true;
  }
  solids(timeline=this.timeline){
    const solids=this.world.platforms.filter(s=>activeIn(s.phase,timeline));
    if(this.progress.anchors.length<3&&!this.progress.bossDefeated)solids.push({id:'oath-lock',x:3890,y:-160,w:18,h:560,phase:'both'});
    if(!this.progress.completed)solids.push({id:'archive-lock',x:4750,y:-160,w:18,h:560,phase:'both'});
    if(!this.progress.switches.includes('archive-switch'))solids.push({id:'floodgate',x:6420,y:-160,w:18,h:560,phase:'both'});
    return solids;
  }
  shift(){
    const p=this.player;if(p.dead||p.riftCooldown>0)return false;
    const target=this.timeline==='present'?'past':'present';
    const box={...p,x:p.x+.3,y:p.y+.3,w:p.w-.6,h:p.h-.6};
    if(this.solids(target).some(s=>overlaps(box,s))){this.emit('toast',{text:'A wall is here in the other realm. Move clear, then press Q.'});return false;}
    this.timeline=target;p.riftCooldown=.28;this.riftFlash=.55;
    this.burst(p.x+6,p.y+11,target==='past'?'#ffca86':'#ac8ade',18,72);this.emit('rift',{timeline:target});return true;
  }
  refillMovement(){const p=this.player;p.dashes=this.maxDashes;p.dashReady=true;p.doubleUsed=false;}
  respawn(countDeath=true){
    const cp=CHECKPOINTS.find(c=>c.id===this.progress.checkpoint),p=this.player;
    if(countDeath)this.progress.deaths++;
    if(this.trial){this.trial=null;this.emit('toast',{text:'Bell run interrupted. Return to the bell marker to retry.'});}
    Object.assign(p,{x:cp.x,y:cp.y-22,vx:0,vy:0,hp:this.maxHealth,focus:this.maxFocus,dead:false,grounded:false,groundId:null,wall:0,
      invincible:1,coyote:0,buffer:0,wallLock:0,climbing:false,dashTime:0,attack:0,attackCooldown:0,riftCooldown:0,
      boltCooldown:0,wardCooldown:0,wardTime:0,combo:0,comboWindow:0});
    this.refillMovement();this.timeline=cp.phase;this.projectiles=[];this.respawnTimer=0;
    const b=this.world.boss;
    if(!b.dead)Object.assign(b,{x:4140,hp:b.maxHp,active:false,state:'idle',timer:2.5,cycle:0,tell:0,hurt:0,charge:0});
    this.camera.x=clamp(p.x-170,0,WORLD_WIDTH-640);this.camera.y=60;this.emit('respawn');this.save();
  }
  travel(id){
    if(this.player.dead||!this.progress.visited.includes(id))return false;
    if(this.world.boss.active&&!this.world.boss.dead){this.emit('toast',{text:'Fast travel is unavailable during the Warden fight.'});return false;}
    this.progress.checkpoint=id;this.respawn(false);this.emit('toast',{text:'Travelled to '+CHECKPOINTS.find(c=>c.id===id).label+'.'});return true;
  }
  hurt(amount,sourceX){
    const p=this.player;if(p.invincible>0||p.dead||p.wardTime>0)return;
    p.hp=Math.max(0,p.hp-amount);p.invincible=.9;p.vx=p.x<sourceX?-170:170;p.vy=-150;p.wallLock=.17;
    p.dashTime=0;this.shake=.22;this.flash=.18;this.burst(p.x+6,p.y+10,'#ff7e99',12,80);this.emit('hurt');
    if(p.hp<=0)this.die();
  }
  die(){if(this.player.dead)return;this.player.dead=true;this.respawnTimer=.7;this.emit('death');this.burst(this.player.x+6,this.player.y+11,'#b7eaff',26,100);}
  hitEnemy(e,amount){
    if(e.dead||e.hurt>0)return;e.hp=Math.max(0,e.hp-amount);e.hurt=.14;
    this.float(String(Math.ceil(amount)),e.x+e.w/2,e.y-5,'#fff6d1');this.burst(e.x+e.w/2,e.y+e.h/2,'#f4abde',8,55);this.emit('hit');
    if(e.hp<=0){e.dead=true;if(!this.progress.defeated.includes(e.id))this.progress.defeated.push(e.id);
      const xp=e.type==='crawler'?25:35;this.gainXP(xp);this.float('+'+xp+' XP',e.x,e.y-20,'#b7f9cf');}
  }
  castBolt(input={}){
    const p=this.player;if(!this.hasPower('bolt')){this.emit('toast',{text:'Rift Bolt awakens at the Canyon Lantern.'});return false;}
    if(p.boltCooldown>0)return false;if(p.focus<18){this.emit('toast',{text:'Not enough focus. Give the lantern a moment to recover.'});return false;}
    let dx=(input.right?1:0)-(input.left?1:0),dy=(input.down?1:0)-(input.up?1:0);
    if(!dx&&!dy)dx=p.facing;const len=Math.hypot(dx,dy);
    p.focus-=18;p.boltCooldown=.42;
    this.projectiles.push({x:p.x+6+dx/len*11,y:p.y+11,vx:dx/len*340,vy:dy/len*340,r:4,life:1.25,
      damage:18+this.progress.skills.edge*2,phase:this.timeline,team:'player'});
    this.emit('bolt');return true;
  }
  castWard(){
    const p=this.player;if(!this.hasPower('ward')){this.emit('toast',{text:'Ward Pulse awakens at the Woodland Lantern.'});return false;}
    if(p.wardCooldown>0)return false;if(p.focus<34){this.emit('toast',{text:'Ward needs 34 focus. Let your lantern recover.'});return false;}
    p.focus-=34;p.wardCooldown=5;p.wardTime=1.35;
    this.projectiles=this.projectiles.filter(o=>o.team==='player'||Math.hypot(o.x-p.x,o.y-p.y)>145);
    for(const e of this.world.enemies)if(activeIn(e.phase,this.timeline)&&Math.hypot(e.x-p.x,e.y-p.y)<105)this.hitEnemy(e,24);
    const b=this.world.boss;if(b.active&&Math.hypot(b.x-p.x,b.y-p.y)<100)this.hitBoss(20);
    this.burst(p.x+6,p.y+11,'#a9fff2',40,150);this.emit('ward');return true;
  }
  nearby(){
    const p=this.player,entries=[];
    const add=(kind,o)=>{if(Math.abs(p.x+6-o.x)<62&&Math.abs(p.y+p.h-o.y)<62)entries.push({kind,...o,distance:Math.hypot(p.x+6-o.x,p.y+p.h-o.y)});};
    for(const n of this.world.npcs)add('npc',n);
    for(const a of this.world.anchors)add('anchor',a);
    for(const l of this.world.lore)add('lore',l);
    for(const chest of this.world.chests)if(!this.progress.opened.includes(chest.id))add('chest',chest);
    add('trial',{...this.world.trial,name:'Bellkeeper’s run'});
    for(const s of this.world.switches)if(!this.progress.switches.includes(s.id))add('switch',{...s,y:400});
    return entries.sort((a,b)=>a.distance-b.distance)[0]||null;
  }
  interact(){
    const o=this.nearby();if(!o)return false;const p=this.progress;
    if(o.kind==='npc'){
      const first=!p.met.includes(o.id);if(first)p.met.push(o.id);let reward=null;
      if(o.id==='maelin'&&first)this.gainXP(20);
      if(o.id==='pip'&&p.collected.filter(id=>id.startsWith('gear-')).length===3&&!p.gearsReturned){
        p.gearsReturned=true;reward='gears';this.player.focus=this.maxFocus;this.gainXP(90);this.emit('quest',{name:'A crow out of time',reward:'+20 focus · wider pickup reach'});
      }
      if(o.id==='sera'&&p.collected.includes('lantern-glass')&&!p.lanternReturned){
        p.lanternReturned=true;reward='lantern';this.player.hp=this.maxHealth;this.gainXP(75);this.emit('quest',{name:'The last light',reward:'+10 maximum health'});
      }
      this.emit('dialogue',{id:o.id,first,reward});this.save();return true;
    }
    if(o.kind==='anchor'){
      if(p.anchors.includes(o.id)){this.player.hp=this.maxHealth;this.player.focus=this.maxFocus;this.emit('toast',{text:o.name+' is restored. Health and focus replenished.'});return true;}
      if(!p.collected.includes(o.seal)){this.emit('toast',{text:'This lantern needs its Echo. Follow the quest marker.'});return true;}
      p.anchors.push(o.id);this.player.hp=this.maxHealth;this.player.focus=this.maxFocus;this.refillMovement();
      this.gainXP(45);this.burst(o.x,o.y-30,'#ffe3a8',40,110);this.emit('power',{id:o.power,name:o.powerName,detail:o.detail,anchor:o.id});this.save();return true;
    }
    if(o.kind==='lore'){
      if(!p.lore.includes(o.id)){p.lore.push(o.id);this.gainXP(o.xp);}
      this.emit('dialogue',{id:o.id});this.save();return true;
    }
    if(o.kind==='chest'){
      if(!this.hasPower(o.power)){this.emit('toast',{text:'The cache responds to '+(o.power==='bolt'?'Rift Bolt':'Second Wind')+'. Restore its lantern first.'});return true;}
      p.opened.push(o.id);this.player.hp=Math.min(this.maxHealth,this.player.hp+35);this.player.focus=this.maxFocus;
      this.gainXP(o.xp);this.emit('toast',{text:o.name+' opened · +'+o.xp+' XP · health and focus restored'});this.burst(o.x,o.y-10,'#ffce7d',25,85);return true;
    }
    if(o.kind==='switch'){this.emit('toast',{text:'Face the floodgate eye and fire a Rift Bolt with K.'});return true;}
    if(o.kind==='trial')return this.startTrial();
    return false;
  }
  startTrial(){
    if(!this.hasPower('doubleJump')){this.emit('toast',{text:'Restore the Crossing Lantern before trying the bell run.'});return false;}
    this.trial={time:0,next:0};this.emit('trialStart');this.emit('toast',{text:'Bell run! Touch the three gold rings in 18 seconds. W climbs; X dashes.'});return true;
  }
  updateTrial(dt){
    if(!this.trial)return;const run=this.trial;run.time+=dt;
    if(run.time>this.world.trial.limit){this.trial=null;this.emit('toast',{text:'The last bell fell silent. E at the tower marker starts a new run.'});return;}
    const bell=this.world.trial.bells[run.next];
    if(Math.hypot(this.player.x+6-bell.x,this.player.y+11-bell.y)<24){
      run.next++;this.burst(bell.x,bell.y,'#ffe5a4',15,70);this.emit('bell');
      if(run.next===3){
        const first=!this.progress.trialBest;this.progress.trialBest=this.progress.trialBest?Math.min(this.progress.trialBest,run.time):run.time;
        const medal=run.time<8?'GOLD':run.time<12?'SILVER':'BRONZE';
        this.emit('toast',{text:medal+' · Bell run '+run.time.toFixed(2)+'s'+(first?' · +110 XP':' · best '+this.progress.trialBest.toFixed(2)+'s')});
        if(first)this.gainXP(110);this.trial=null;this.save();
      }
    }
  }
  chooseEnding(ending){
    const p=this.progress;if(!['home','search'].includes(ending)||p.archiveComplete||!p.completed||!p.met.includes('ivo')||!ARCHIVE_PAGES.every(id=>p.collected.includes(id)))return false;
    p.ending=ending;p.archiveComplete=true;this.refillMovement();this.player.hp=this.maxHealth;this.gainXP(130);
    this.emit('power',{id:'riftStep',name:'Echo Step',detail:'You can now dash twice before landing. X, release, X.',ending:true});this.save();return true;
  }
  step(dt,input={}){
    dt=clamp(dt,0,.025);this.time+=dt;
    for(const k of ['shake','flash','riftFlash'])this[k]=Math.max(0,this[k]-dt);
    this.particles=this.particles.filter(o=>{o.life-=dt;o.x+=o.vx*dt;o.y+=o.vy*dt;o.vy+=110*dt;return o.life>0;});
    this.floats=this.floats.filter(o=>{o.life-=dt;o.y-=18*dt;return o.life>0;});this.trails=this.trails.filter(o=>(o.life-=dt)>0);
    if(!this.started)return;this.progress.played+=dt;const p=this.player;
    if(p.dead){this.respawnTimer-=dt;if(this.respawnTimer<=0)this.respawn();this.previous={...input};return;}
    const pressed=key=>input[key]&&!this.previous[key];
    for(const k of ['coyote','buffer','wallLock','dashTime','riftCooldown','attack','attackCooldown','invincible','boltCooldown','wardCooldown','wardTime','comboWindow'])p[k]=Math.max(0,p[k]-dt);
    p.focus=Math.min(this.maxFocus,p.focus+dt*(this.timeline==='past'?13:10)*(1+this.progress.skills.focus*.18)+(this.progress.ending==='search'?dt*2:0));
    for(const s of this.world.platforms){s.previousX=s.x;if(s.moving)s.x=s.originX+Math.sin(this.time*s.speed)*s.amplitude;
      if(p.grounded&&p.groundId===s.id&&activeIn(s.phase,this.timeline))p.x+=s.x-s.previousX;}
    if(pressed('rift'))this.shift();
    const solids=this.solids(),move=(input.right?1:0)-(input.left?1:0);
    const touching=solids.find(s=>p.y+p.h>s.y+2&&p.y<s.y+s.h-2&&(Math.abs(p.x+p.w-s.x)<5||Math.abs(p.x-(s.x+s.w))<5));
    p.wall=touching?(p.x+p.w<=touching.x+5?1:-1):0;
    if(pressed('jump'))p.buffer=.16;if(p.grounded)p.coyote=.14;
    if(p.buffer>0){
      if(p.grounded||p.coyote>0){p.vy=-455;p.grounded=false;p.coyote=0;p.buffer=0;p.groundId=null;this.emit('jump');this.burst(p.x+6,p.y+22,'#c9dcdf',6,28);}
      else if(p.wall){
        p.vx=-p.wall*170;p.vy=-445;p.wallLock=.075;p.wall=0;p.buffer=0;this.refillMovement();this.emit('jump');this.burst(p.x+6,p.y+13,'#cadce9',6,35);
      }else if(this.hasPower('doubleJump')&&!p.doubleUsed){
        p.vy=-415;p.doubleUsed=true;p.buffer=0;this.emit('doubleJump');this.burst(p.x+6,p.y+20,'#ffd49a',16,65);
      }
    }
    if(pressed('dash')&&p.dashes>0){
      let dx=move,dy=(input.down?1:0)-(input.up?1:0);if(!dx&&!dy)dx=p.facing;const len=Math.hypot(dx,dy);
      p.dashX=dx/len;p.dashY=dy/len;p.dashTime=.16*(1+.12*this.progress.skills.stride);p.dashes--;p.dashReady=p.dashes>0;p.grounded=false;
      p.vx=p.dashX*550;p.vy=p.dashY*550;this.emit('dash');this.burst(p.x+6,p.y+11,'#99f3ed',8,70);
    }
    if(input.attack&&p.attackCooldown<=0){
      p.combo=p.comboWindow>0?p.combo%3+1:1;p.comboWindow=.85;p.attack=.2;p.attackCooldown=p.combo===3?.38:.29;p.attackHits=[];this.emit('swing',{combo:p.combo});
    }
    if(pressed('bolt'))this.castBolt(input);if(pressed('ward'))this.castWard();
    if(move&&p.wallLock<=0)p.facing=move;
    p.climbing=false;
    if(p.dashTime>0){p.vx=p.dashX*550;p.vy=p.dashY*550;if(this.trails.length<25)this.trails.push({x:p.x,y:p.y,facing:p.facing,life:.2});}
    else{
      if(p.wallLock<=0)p.vx=approach(p.vx,move*185,(p.grounded?1750:1200)*dt);
      p.vy=Math.min(570,p.vy+1100*dt);
      if(!input.jump&&p.vy<-175)p.vy=-175;
      if(p.wall&&move===p.wall&&p.wallLock<=0){
        if((input.jump||input.up)&&p.vy>-180&&!p.grounded){p.vy=-160;p.climbing=true;}
        else if(p.vy>0)p.vy=Math.min(p.vy,58);
      }
    }
    const previousBottom=p.y+p.h;
    p.wall=0;p.x+=p.vx*dt;let contacted=null;
    for(const s of solids)if(overlaps(p,s)){
      if(p.vx>0){p.x=s.x-p.w;p.wall=1;contacted=s;}else if(p.vx<0){p.x=s.x+s.w;p.wall=-1;contacted=s;}
      p.vx=0;if(p.dashTime>0&&Math.abs(p.dashX)>.5)p.dashTime=0;
    }
    p.x=clamp(p.x,0,WORLD_WIDTH-p.w);p.y+=p.vy*dt;p.y=Math.max(-60,p.y);p.grounded=false;p.groundId=null;
    for(const s of solids)if(overlaps(p,s)){
      if(p.vy>=0){p.y=s.y-p.h;p.grounded=true;p.groundId=s.id;this.refillMovement();}
      else p.y=s.y+s.h;p.vy=0;if(p.dashTime>0&&Math.abs(p.dashY)>.5)p.dashTime=0;
    }
    // Pull over the lip instead of requiring a precisely timed wall jump.
    if(contacted&&move===p.wall&&(input.jump||input.up)&&p.wallLock<=0&&p.dashTime<=0&&p.y<contacted.y+9&&p.y+p.h>contacted.y){
      const box={x:p.wall>0?contacted.x+2:contacted.x+contacted.w-p.w-2,y:contacted.y-p.h,w:p.w,h:p.h};
      if(!solids.some(s=>s.id!==contacted.id&&overlaps(box,s))){
        p.x=box.x;p.y=box.y;p.vx=move*65;p.vy=0;p.grounded=true;p.groundId=contacted.id;p.climbing=false;this.refillMovement();this.emit('climb');
      }
    }
    if(p.y>WORLD_HEIGHT+30)this.die();
    for(const s of this.world.spikes)if(activeIn(s.phase,this.timeline)&&overlaps(p,s))this.hurt(25,s.x+s.w/2);
    for(const h of this.world.hazards){
      const x=h.x+Math.sin(this.time*h.speed)*h.range;
      if(activeIn(h.phase,this.timeline)&&Math.hypot(p.x+6-x,p.y+11-h.y)<h.r+10)this.hurt(24,x);
    }
    for(const item of this.world.pickups){
      if(this.progress.collected.includes(item.id)||!activeIn(item.phase,this.timeline))continue;
      if(Math.hypot(p.x+6-item.x,p.y+11-item.y)<item.radius+(this.progress.gearsReturned?24:13)){
        this.progress.collected.push(item.id);this.gainXP(item.xp);this.burst(item.x,item.y,item.type==='seal'?'#ffd698':'#aef9de',item.type==='seal'?22:9,60);
        this.float('+'+item.xp+' XP',item.x,item.y-12,'#bdf6d5');this.emit('collect',{id:item.id,kind:item.type,name:item.name});
      }
    }
    for(const r of this.world.refills){r.ready=Math.max(0,r.ready-dt);
      if(r.ready===0&&Math.hypot(p.x+6-r.x,p.y+11-r.y)<18){this.refillMovement();r.ready=2;this.burst(r.x,r.y,'#90f4f2',14,50);this.emit('refill');}}
    for(const cp of CHECKPOINTS){
      if(cp.x>=4800&&!this.progress.completed)continue;
      if(cp.id!==this.progress.checkpoint&&Math.abs(p.x-cp.x)<18&&Math.abs(p.y+p.h-cp.y)<24){
        this.progress.checkpoint=cp.id;if(!this.progress.visited.includes(cp.id))this.progress.visited.push(cp.id);
        p.hp=this.maxHealth;p.focus=this.maxFocus;this.emit('checkpoint',{name:cp.label});this.burst(cp.x,cp.y-25,'#aae7ef',22,70);this.save();
      }
    }
    const reach=p.combo===3?43:34;
    const attackBox={x:p.facing>0?p.x+p.w-3:p.x-reach,y:p.y-4,w:reach+3,h:31};
    this.updateEnemies(dt,attackBox,previousBottom);this.updateBoss(dt,attackBox);this.updateProjectiles(dt);
    if(pressed('interact'))this.interact();this.updateTrial(dt);
    if(p.x>4580&&p.x<4800&&this.seals===3&&this.progress.anchors.length===3&&this.progress.bossDefeated&&!this.progress.completed){
      this.progress.completed=true;this.emit('complete');this.save();
    }
    const zone=zoneAt(p.x);if(zone.name!==this.zone){this.zone=zone.name;this.emit('zone',zone);}
    this.camera.x+=(clamp(p.x-245+p.vx*.17,0,WORLD_WIDTH-640)-this.camera.x)*Math.min(1,dt*7);
    this.camera.y+=(clamp(p.y-205,0,WORLD_HEIGHT-360)-this.camera.y)*Math.min(1,dt*5);this.previous={...input};
  }
  updateEnemies(dt,attackBox,previousBottom){
    const p=this.player;
    for(const e of this.world.enemies){
      e.hurt=Math.max(0,e.hurt-dt);e.tell=Math.max(0,e.tell-dt);
      if(e.dead||!activeIn(e.phase,this.timeline))continue;
      const near=Math.abs(p.x-e.x)<290;
      if(e.type==='watcher'){
        e.y=e.originY+Math.sin(this.time*1.6+e.x)*4;
        if(near){e.shoot-=dt;if(e.shoot<.5)e.tell=.5;
          if(e.shoot<=0){const a=Math.atan2(p.y+11-e.y-8,p.x+6-e.x-9);
            this.projectiles.push({x:e.x+9,y:e.y+8,vx:Math.cos(a)*145,vy:Math.sin(a)*145,r:4,life:3,damage:17,phase:e.phase,team:'enemy'});
            e.shoot=2.3;e.tell=0;this.emit('watcher');}}
      }else{
        if(e.type==='mimic'&&!e.awake&&Math.abs(p.x-e.x)<84){e.awake=true;e.tell=.6;this.emit('mimic');}
        let speed=e.type==='wisp'?35:e.type==='husk'?45:32;
        if(e.type==='husk'&&near){e.dir=Math.sign(p.x-e.x)||e.dir;e.shoot-=dt;if(e.shoot<.5)e.tell=.45;
          if(e.shoot<=0){e.rush=.38;e.rushDir=e.dir;e.shoot=2.5;}if(e.rush>0){e.rush-=dt;speed=190;e.dir=e.rushDir;}}
        if(e.type==='mimic'){speed=e.awake?100:0;if(e.awake)e.dir=Math.sign(p.x-e.x)||e.dir;}
        e.x+=e.dir*speed*dt*(e.hurt>0?.2:1);
        if(e.x<e.min){e.x=e.min;e.dir=1;}if(e.x>e.max){e.x=e.max;e.dir=-1;}
        if(e.type==='wisp')e.y=e.originY+Math.sin(this.time*2.3+e.min)*12;
      }
      if(p.attack>0&&overlaps(attackBox,e)&&!p.attackHits.includes(e.id)){p.attackHits.push(e.id);this.hitEnemy(e,Math.ceil(this.damage*(p.combo===3?1.6:1)));}
      if(!e.dead&&overlaps(p,e)){
        if(p.vy>40&&previousBottom<=e.y+8&&e.type!=='husk'){this.hitEnemy(e,20);p.vy=-330;this.refillMovement();}
        else if(p.dashTime>0)this.hitEnemy(e,12);else this.hurt(e.type==='husk'?22:16,e.x+e.w/2);
      }
    }
  }
  updateProjectiles(dt){
    const p=this.player;
    this.projectiles=this.projectiles.filter(o=>{
      o.life-=dt;o.x+=o.vx*dt;o.y+=o.vy*dt;if(o.life<=0)return false;
      const box={x:o.x-o.r,y:o.y-o.r,w:o.r*2,h:o.r*2};
      if(o.team==='player'){
        for(const s of this.world.switches)if(!this.progress.switches.includes(s.id)&&Math.hypot(o.x-s.x,o.y-s.y)<o.r+13){
          this.progress.switches.push(s.id);this.gainXP(35);this.burst(s.x,s.y,'#ffe2a0',25,85);this.emit('toast',{text:'Floodgate opened. The last page is waiting beyond it.'});this.emit('switch');return false;
        }
        for(const e of this.world.enemies)if(!e.dead&&activeIn(e.phase,o.phase)&&overlaps(box,e)){this.hitEnemy(e,o.damage);return false;}
        const b=this.world.boss;if(b.active&&!b.dead&&overlaps(box,b)){this.hitBoss(o.damage,o.phase);return false;}
      }else if(activeIn(o.phase,this.timeline)&&overlaps(p,box)){if(p.dashTime<=0)this.hurt(o.damage,o.x);return false;}
      if(this.solids(o.phase).some(s=>overlaps(box,s)))return false;
      return true;
    });
  }
  hitBoss(amount,phase=this.timeline){
    const b=this.world.boss;if(b.dead||b.hurt>0||!b.active)return;
    const damage=Math.ceil(amount*(phase===b.aura?.6:1.5));b.hp=Math.max(0,b.hp-damage);b.hurt=.14;
    this.float(String(damage),b.x+14,b.y-10,'#ffdf9d');this.burst(b.x+14,b.y+15,'#ffc9ea',10,60);this.emit('hit');
    if(b.hp<=0){b.dead=true;this.progress.bossDefeated=true;this.gainXP(170);this.burst(b.x+14,b.y+15,'#ffdda5',45,130);this.emit('bossDefeated');this.save();}
  }
  updateBoss(dt,attackBox){
    const b=this.world.boss,p=this.player;if(b.dead)return;b.hurt=Math.max(0,b.hurt-dt);b.tell=Math.max(0,b.tell-dt);
    if(Math.abs(p.x-b.x)<260&&!b.active&&this.progress.anchors.length===3){b.active=true;this.emit('boss');}
    if(!b.active)return;b.timer-=dt;
    if(b.charge>0){b.charge-=dt;b.x=clamp(b.x+b.chargeDir*310*dt,3950,4360);b.state='rushing';}
    else if(b.timer>.65){b.state='idle';b.x=approach(b.x,clamp(p.x,3980,4300),23*dt);}
    if(b.timer<.65&&b.timer>0){b.state='windup';b.tell=b.timer;}
    if(b.timer<=0){
      const pattern=b.cycle%3,castPhase=b.aura;b.cycle++;b.timer=b.hp<b.maxHp*.5?1.95:2.65;b.state='idle';
      const x=b.x+14,y=b.y+14,angle=Math.atan2(p.y+11-y,p.x+6-x);
      if(pattern===0){const count=b.hp<b.maxHp*.5?5:3;
        for(let i=0;i<count;i++){const a=angle+(i-(count-1)/2)*.22;this.projectiles.push({x,y,vx:Math.cos(a)*155,vy:Math.sin(a)*155,r:4,life:4.5,damage:20,phase:castPhase,team:'enemy'});}
      }else if(pattern===1){b.charge=.48;b.chargeDir=Math.sign(p.x-b.x)||1;b.state='rushing';}
      else{for(const dir of [-1,1])this.projectiles.push({x,y:392,vx:dir*195,vy:0,r:7,life:3,damage:25,phase:'both',team:'enemy'});this.shake=.17;}
      b.aura=b.aura==='past'?'present':'past';this.emit('bossCast',{pattern});
    }
    if(p.attack>0&&overlaps(attackBox,b)&&!p.attackHits.includes(b.id)){p.attackHits.push(b.id);this.hitBoss(this.damage*(p.combo===3?1.6:1));}
    if(!b.dead&&overlaps(p,b)&&p.dashTime<=0)this.hurt(b.state==='rushing'?28:23,b.x+14);
  }
}
