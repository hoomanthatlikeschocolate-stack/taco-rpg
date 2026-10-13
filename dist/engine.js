import { makeWorld, activeIn, CHECKPOINTS, SKILLS, WORLD_WIDTH, WORLD_HEIGHT, zoneAt } from './world.js';

export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const approach = (v, target, step) => v < target ? Math.min(target, v+step) : Math.max(target, v-step);
export const overlaps = (a,b) => a.x < b.x+b.w && a.x+a.w > b.x && a.y < b.y+b.h && a.y+a.h > b.y;
export const xpRequired = level => 80 + (level-1)*35;

export function freshProgress() {
  return { version:1, level:1, xp:0, skillPoints:0, skills:{vitality:0,edge:0,stride:0},
    collected:[], defeated:[], checkpoint:'approach', bossDefeated:false, completed:false,
    deaths:0, played:0 };
}
export function cleanProgress(input) {
  const p=freshProgress();
  if (!input || input.version!==1) return p;
  const integer=(v,max)=>Number.isFinite(v)?clamp(Math.floor(v),0,max):0;
  p.level=Math.max(1,integer(input.level,30));
  p.xp=integer(input.xp,xpRequired(p.level)-1);
  for(const s of SKILLS) p.skills[s.id]=integer(input.skills?.[s.id],s.max);
  const spent=Object.values(p.skills).reduce((a,b)=>a+b,0);
  if(spent > p.level-1) p.skills={vitality:0,edge:0,stride:0};
  p.skillPoints=Math.max(0,p.level-1-Object.values(p.skills).reduce((a,b)=>a+b,0));
  const world=makeWorld();
  p.collected=[...new Set(Array.isArray(input.collected)?input.collected:[])].filter(id=>world.pickups.some(o=>o.id===id));
  p.defeated=[...new Set(Array.isArray(input.defeated)?input.defeated:[])].filter(id=>world.enemies.some(o=>o.id===id));
  p.checkpoint=CHECKPOINTS.some(c=>c.id===input.checkpoint)?input.checkpoint:'approach';
  p.bossDefeated=input.bossDefeated===true;
  p.completed=input.completed===true && p.bossDefeated && p.collected.filter(id=>id.startsWith('seal-')).length===3;
  p.deaths=integer(input.deaths,100000);
  p.played=Number.isFinite(input.played)?clamp(input.played,0,10000000):0;
  return p;
}

export class Game {
  constructor(progress) {
    this.progress=cleanProgress(progress);
    this.world=makeWorld();
    this.timeline=CHECKPOINTS.find(c=>c.id===this.progress.checkpoint).phase;
    this.time=0; this.events=[]; this.projectiles=[]; this.particles=[]; this.floats=[]; this.trails=[];
    this.camera={x:0,y:70}; this.shake=0; this.flash=0; this.riftFlash=0;
    this.zone=zoneAt(0).name; this.started=false; this.previous={}; this.respawnTimer=0;
    this.world.enemies.forEach(e=>e.dead=this.progress.defeated.includes(e.id));
    this.world.boss.dead=this.progress.bossDefeated;
    const cp=CHECKPOINTS.find(c=>c.id===this.progress.checkpoint);
    this.player={x:cp.x,y:cp.y-22,w:12,h:22,vx:0,vy:0,facing:1,grounded:false,groundId:null,
      wall:0,coyote:0,buffer:0,wallLock:0,dashTime:0,dashReady:true,dashX:0,dashY:0,
      riftCooldown:0,attack:0,attackCooldown:0,attackHits:[],invincible:0,hp:this.maxHealth,dead:false};
    this.camera.x=clamp(cp.x-170,0,WORLD_WIDTH-640);
    this.camera.y=60;
  }
  get maxHealth(){ return 100+this.progress.skills.vitality*20; }
  get damage(){ return 12+this.progress.skills.edge*4; }
  get seals(){ return this.progress.collected.filter(id=>id.startsWith('seal-')).length; }
  emit(type,data={}){ this.events.push({type,...data}); }
  drainEvents(){ return this.events.splice(0); }
  save(){ this.emit('save'); }
  burst(x,y,color,count=10,speed=55){
    for(let i=0;i<count;i++){
      const a=(i/count)*Math.PI*2+this.time;
      this.particles.push({x,y,vx:Math.cos(a)*speed*(.5+(i%3)*.2),vy:Math.sin(a)*speed-20,
        color,life:.38+(i%4)*.09,max:.65,size:i%3===0?3:2});
    }
  }
  float(text,x,y,color='#fff0bd'){this.floats.push({text,x,y,color,life:1.2});}
  gainXP(amount){
    this.progress.xp+=amount;
    while(this.progress.xp>=xpRequired(this.progress.level)){
      this.progress.xp-=xpRequired(this.progress.level);this.progress.level++;this.progress.skillPoints++;
      this.player.hp=this.maxHealth;
      this.burst(this.player.x+6,this.player.y+12,'#ffdc8c',26,100);
      this.emit('level',{level:this.progress.level});
    }
    this.save();
  }
  buySkill(id){
    const skill=SKILLS.find(s=>s.id===id);
    if(!skill || this.progress.skillPoints<1 || this.progress.skills[id]>=skill.max)return false;
    this.progress.skills[id]++;this.progress.skillPoints--;
    if(id==='vitality')this.player.hp=Math.min(this.maxHealth,this.player.hp+20);
    this.emit('upgrade',{name:skill.name});this.save();return true;
  }
  solids(timeline=this.timeline){return this.world.platforms.filter(p=>activeIn(p.phase,timeline));}
  shift(){
    const p=this.player;if(p.dead||p.riftCooldown>0)return false;
    const target=this.timeline==='present'?'past':'present';
    const box={...p,x:p.x+.3,y:p.y+.3,w:p.w-.6,h:p.h-.6};
    if(this.solids(target).some(s=>overlaps(box,s))){
      this.emit('toast',{text:'A wall occupies this space in the other timeline.'});return false;
    }
    this.timeline=target;p.riftCooldown=.32;this.riftFlash=.55;
    this.burst(p.x+6,p.y+11,target==='past'?'#ffca86':'#93d9ff',18,72);
    this.emit('rift',{timeline:target});return true;
  }
  respawn(countDeath=true){
    const cp=CHECKPOINTS.find(c=>c.id===this.progress.checkpoint),p=this.player;
    if(countDeath)this.progress.deaths++;
    Object.assign(p,{x:cp.x,y:cp.y-22,vx:0,vy:0,hp:this.maxHealth,dead:false,grounded:false,wall:0,
      invincible:1,coyote:0,buffer:0,wallLock:0,dashReady:true,dashTime:0,attack:0,attackCooldown:0,riftCooldown:0});
    this.timeline=cp.phase;this.projectiles=[];this.respawnTimer=0;
    const boss=this.world.boss;
    if(!boss.dead)Object.assign(boss,{x:4140,hp:boss.maxHp,active:false,state:'idle',timer:2.3,cycle:0,tell:0,hurt:0});
    this.camera.x=clamp(p.x-170,0,WORLD_WIDTH-640);this.camera.y=60;
    this.emit('respawn');this.save();
  }
  hurt(amount,sourceX){
    const p=this.player;if(p.invincible>0||p.dead)return;
    p.hp=Math.max(0,p.hp-amount);p.invincible=.9;p.vx=p.x<sourceX?-180:180;p.vy=-150;p.wallLock=.22;
    p.dashTime=0;this.shake=.22;this.flash=.18;this.burst(p.x+6,p.y+10,'#ff7e99',12,80);this.emit('hurt');
    if(p.hp<=0)this.die();
  }
  die(){
    if(this.player.dead)return;
    this.player.dead=true;this.respawnTimer=.8;this.emit('death');
    this.burst(this.player.x+6,this.player.y+11,'#b7eaff',26,100);
  }
  hitEnemy(e,amount){
    if(e.dead||e.hurt>0)return;
    e.hp-=amount;e.hurt=.17;this.float(String(amount),e.x+e.w/2,e.y-5,'#fff6d1');
    this.burst(e.x+e.w/2,e.y+e.h/2,'#f4abde',8,55);this.emit('hit');
    if(e.hp<=0){e.dead=true;this.progress.defeated.push(e.id);this.gainXP(25);this.float('+25 XP',e.x,e.y-20,'#b7f9cf');}
  }
  step(dt,input={}){
    dt=clamp(dt,0,.025);this.time+=dt;
    this.shake=Math.max(0,this.shake-dt);this.flash=Math.max(0,this.flash-dt);this.riftFlash=Math.max(0,this.riftFlash-dt);
    this.particles=this.particles.filter(o=>{o.life-=dt;o.x+=o.vx*dt;o.y+=o.vy*dt;o.vy+=110*dt;return o.life>0;});
    this.floats=this.floats.filter(o=>{o.life-=dt;o.y-=18*dt;return o.life>0;});
    this.trails=this.trails.filter(o=>(o.life-=dt)>0);
    if(!this.started)return;
    this.progress.played+=dt;
    const p=this.player;
    if(p.dead){this.respawnTimer-=dt;if(this.respawnTimer<=0)this.respawn();this.previous={...input};return;}
    const pressed=key=>input[key]&&!this.previous[key];
    for(const key of ['coyote','buffer','wallLock','dashTime','riftCooldown','attack','attackCooldown','invincible'])p[key]=Math.max(0,p[key]-dt);
    for(const platform of this.world.platforms){
      platform.previousX=platform.x;
      if(platform.moving)platform.x=platform.originX+Math.sin(this.time*platform.speed)*platform.amplitude;
      if(p.grounded&&p.groundId===platform.id&&activeIn(platform.phase,this.timeline))p.x+=platform.x-platform.previousX;
    }
    if(pressed('rift'))this.shift();
    if(pressed('jump'))p.buffer=.13;
    if(p.grounded)p.coyote=.11;
    if(p.buffer>0){
      if(p.grounded||p.coyote>0){p.vy=-450;p.grounded=false;p.coyote=0;p.buffer=0;p.groundId=null;this.emit('jump');this.burst(p.x+6,p.y+22,'#c9dcdf',6,28);}
      else if(p.wall!==0){p.vx=-p.wall*240;p.vy=-435;p.wallLock=.18;p.wall=0;p.buffer=0;p.dashReady=true;this.emit('jump');this.burst(p.x+6,p.y+13,'#cadce9',6,35);}
    }
    if(pressed('dash')&&p.dashReady){
      let dx=(input.right?1:0)-(input.left?1:0),dy=(input.down?1:0)-(input.up?1:0);
      if(dx===0&&dy===0)dx=p.facing;
      const length=Math.hypot(dx,dy);p.dashX=dx/length;p.dashY=dy/length;
      p.dashTime=.16*(1+.12*this.progress.skills.stride);p.dashReady=false;p.grounded=false;
      p.vx=p.dashX*550;p.vy=p.dashY*550;this.emit('dash');this.burst(p.x+6,p.y+11,'#99f3ed',8,70);
    }
    if(pressed('attack')&&p.attackCooldown<=0){p.attack=.19;p.attackCooldown=.33;p.attackHits=[];this.emit('swing');}
    const move=(input.right?1:0)-(input.left?1:0);
    if(move&&p.wallLock<=0)p.facing=move;
    if(p.dashTime>0){p.vx=p.dashX*550;p.vy=p.dashY*550;this.trails.push({x:p.x,y:p.y,facing:p.facing,life:.2});}
    else{
      if(p.wallLock<=0)p.vx=approach(p.vx,move*178,(p.grounded?1650:1050)*dt);
      p.vy=Math.min(570,p.vy+1100*dt);
      if(!input.jump&&p.vy < -175)p.vy=-175;
      if(p.wall!==0&&p.vy>0&&move===p.wall){p.vy=Math.min(p.vy,82);if(Math.floor(this.time*15)!==Math.floor((this.time-dt)*15))this.burst(p.x+6,p.y+18,'#a8b7d0',1,12);}
    }
    const solids=this.solids();const previousBottom=p.y+p.h;
    p.wall=0;p.x+=p.vx*dt;
    for(const s of solids){if(overlaps(p,s)){
      if(p.vx>0){p.x=s.x-p.w;p.wall=1;}else if(p.vx<0){p.x=s.x+s.w;p.wall=-1;}
      p.vx=0;if(p.dashTime>0&&Math.abs(p.dashX)>.5)p.dashTime=0;
    }}
    p.x=clamp(p.x,0,WORLD_WIDTH-p.w);p.y+=p.vy*dt;p.grounded=false;p.groundId=null;
    for(const s of solids){if(overlaps(p,s)){
      if(p.vy>=0){p.y=s.y-p.h;p.grounded=true;p.groundId=s.id;p.dashReady=true;}
      else{p.y=s.y+s.h;}
      p.vy=0;if(p.dashTime>0&&Math.abs(p.dashY)>.5)p.dashTime=0;
    }}
    if(p.y>WORLD_HEIGHT+30)this.die();
    for(const spike of this.world.spikes)if(overlaps(p,spike))this.hurt(25,spike.x+spike.w/2);
    for(const item of this.world.pickups){
      if(this.progress.collected.includes(item.id)||!activeIn(item.phase,this.timeline))continue;
      if(Math.hypot(p.x+6-item.x,p.y+11-item.y)<item.radius+13){
        this.progress.collected.push(item.id);this.gainXP(item.xp);
        this.burst(item.x,item.y,item.type==='seal'?'#ffd698':'#aef9de',item.type==='seal'?22:9,60);
        this.float(`+${item.xp} XP`,item.x,item.y-12,'#bdf6d5');this.emit('collect',{kind:item.type,name:item.name});
      }
    }
    for(const refill of this.world.refills){
      refill.ready=Math.max(0,refill.ready-dt);
      if(refill.ready===0&&Math.hypot(p.x+6-refill.x,p.y+11-refill.y)<18){p.dashReady=true;refill.ready=2;this.burst(refill.x,refill.y,'#90f4f2',14,50);this.emit('refill');}
    }
    for(const cp of CHECKPOINTS){
      if(cp.id!==this.progress.checkpoint&&Math.abs(p.x-cp.x)<18&&Math.abs(p.y+p.h-cp.y)<24){
        this.progress.checkpoint=cp.id;p.hp=this.maxHealth;this.emit('checkpoint',{name:cp.label});this.burst(cp.x,cp.y-25,'#aae7ef',22,70);this.save();
      }
    }
    const attackBox={x:p.facing>0?p.x+p.w-3:p.x-33,y:p.y-3,w:36,h:29};
    for(const e of this.world.enemies){
      e.hurt=Math.max(0,e.hurt-dt);if(e.dead||!activeIn(e.phase,this.timeline))continue;
      e.x+=e.dir*(e.type==='wisp'?30:25)*dt;
      if(e.x<e.min){e.x=e.min;e.dir=1;}if(e.x>e.max){e.x=e.max;e.dir=-1;}
      if(e.type==='wisp')e.y=e.originY+Math.sin(this.time*2.3+e.min)*10;
      if(p.attack>0&&overlaps(attackBox,e)&&!p.attackHits.includes(e.id)){p.attackHits.push(e.id);this.hitEnemy(e,this.damage);}
      if(!e.dead&&overlaps(p,e)){
        if(p.vy>40&&previousBottom<=e.y+8){this.hitEnemy(e,18);p.vy=-310;p.dashReady=true;}
        else if(p.dashTime>0){this.hitEnemy(e,10);}
        else this.hurt(15,e.x+9);
      }
    }
    this.updateBoss(dt,attackBox);
    this.projectiles=this.projectiles.filter(o=>{
      o.life-=dt;o.x+=o.vx*dt;o.y+=o.vy*dt;
      if(o.life<=0)return false;
      if(activeIn(o.phase,this.timeline)&&overlaps(p,{x:o.x-o.r,y:o.y-o.r,w:o.r*2,h:o.r*2})){
        if(p.dashTime<=0)this.hurt(o.damage,o.x);return false;
      }
      return true;
    });
    if(pressed('interact')&&Math.abs(p.x-this.world.npc.x)<70)this.emit('dialogue');
    if(p.x>4580&&this.seals===3&&this.progress.bossDefeated&&!this.progress.completed){
      this.progress.completed=true;this.emit('complete');this.save();
    }
    const zone=zoneAt(p.x);
    if(zone.name!==this.zone){this.zone=zone.name;this.emit('zone',zone);}
    this.camera.x+= (clamp(p.x-245+ p.vx*.17,0,WORLD_WIDTH-640)-this.camera.x)*Math.min(1,dt*7);
    this.camera.y+=(clamp(p.y-205,0,WORLD_HEIGHT-360)-this.camera.y)*Math.min(1,dt*5);
    this.previous={...input};
  }
  updateBoss(dt,attackBox){
    const b=this.world.boss,p=this.player;if(b.dead)return;
    b.hurt=Math.max(0,b.hurt-dt);b.tell=Math.max(0,b.tell-dt);
    if(Math.abs(p.x-b.x)<260&&!b.active){b.active=true;this.emit('boss');}
    if(!b.active)return;
    b.timer-=dt;
    if(b.timer<.7&&b.state==='idle'){b.state='charging';b.tell=.7;}
    if(b.timer<=0){
      b.cycle++;b.aura=b.aura==='past'?'present':'past';b.timer=b.hp<b.maxHp*.5?1.7:2.35;b.state='idle';
      const origin={x:b.x+14,y:b.y+14};const angle=Math.atan2(p.y+12-origin.y,p.x+6-origin.x);
      const count=b.hp<b.maxHp*.5?5:3;
      for(let i=0;i<count;i++){
        const a=angle+(i-(count-1)/2)*.21;
        this.projectiles.push({x:origin.x,y:origin.y,vx:Math.cos(a)*125,vy:Math.sin(a)*125,
          r:4,life:4.5,damage:19,phase:b.aura});
      }
      if(b.cycle%3===0){
        for(const dir of [-1,1])this.projectiles.push({x:b.x+14,y:393,vx:dir*140,vy:0,r:7,life:3,damage:22,phase:'both'});
        this.shake=.16;
      }
      this.emit('bossCast');
    }
    if(b.state==='idle')b.x=approach(b.x,clamp(p.x,3950,4340),19*dt);
    if(p.attack>0&&overlaps(attackBox,b)&&!p.attackHits.includes(b.id)&&b.hurt<=0){
      const damage=this.timeline===b.aura?Math.ceil(this.damage*.65):Math.ceil(this.damage*1.5);
      p.attackHits.push(b.id);b.hp=Math.max(0,b.hp-damage);b.hurt=.18;
      this.float(String(damage),b.x+14,b.y-10,'#ffdf9d');this.burst(b.x+14,b.y+15,'#ffc9ea',10,60);this.emit('hit');
      if(b.hp<=0){
        b.dead=true;this.progress.bossDefeated=true;this.gainXP(140);this.burst(b.x+14,b.y+15,'#ffdda5',45,130);this.emit('bossDefeated');this.save();
      }
    }
    if(!b.dead&&overlaps(p,b)&&p.dashTime<=0)this.hurt(22,b.x+14);
  }
}
