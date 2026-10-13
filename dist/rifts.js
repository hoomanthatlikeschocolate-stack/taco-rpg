import { SCENES, RIFT_CORES, CHECKPOINTS, activeIn, sceneUnlocked } from './world.js';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const approach=(v,target,amount)=>v<target?Math.min(target,v+amount):Math.max(target,v-amount);
const overlap=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
const methods={
  initRifts(){
    const cp=CHECKPOINTS.find(c=>c.id===this.progress.checkpoint);
    this.scene=cp.scene||'overworld';this.portalCooldown=0;this.riftAnchor=null;this.freezeUntil=0;
    this.relayTimers={};this.crumbling={};this.plateCharge=0;this.dread=0;this.pursuer=null;
    this.noiseX=this.player.x;this.noiseY=this.player.y;this.lastAction='jump';this.whisperBand=0;
    this.world.borrowed.dead=this.progress.houseBossDefeated;
    if(!this.world.borrowed.dead)Object.assign(this.world.borrowed,{x:11400,y:358,hp:this.world.borrowed.maxHp,active:false,state:'idle',timer:2.6,tell:0,cycle:0,rush:0,hurt:0,lastCopy:null,copy:'jump',warning:''});
    this.clipScene();
  },
  clipScene(){
    const b=SCENES[this.scene];this.player.x=clamp(this.player.x,b.left,b.right-this.player.w);
    this.camera.x=clamp(this.camera.x,b.left,Math.max(b.left,b.right-640));
  },
  isSolidPlatform(s,timeline=this.timeline){
    if((s.scene||'overworld')!==this.scene||!activeIn(s.phase,timeline))return false;
    if(s.crumble&&this.crumbling[s.id]?.until>this.time)return false;
    if(s.timed&&this.freezeUntil<=this.time&&(this.time+s.timed.offset)%s.timed.period>=s.timed.on)return false;
    if(s.relay&&this.relayTimers[s.relay]<=this.time&&!this.progress.collected.includes('rift-core-choir'))return false;
    if(s.relay&&!this.relayTimers[s.relay]&&!this.progress.collected.includes('rift-core-choir'))return false;
    return true;
  },
  portalReady(portal){return !portal.unlock||sceneUnlocked(portal.unlock,this.progress);},
  portalHint(portal){
    if(this.portalReady(portal))return portal.door?'E · '+portal.name:'X · DASH THROUGH '+portal.glyph;
    return ({fold:'Restore the Crossing Lantern',clock:'Restore the Woodland Lantern',choir:'Finish Ivo’s Archive story',house:'Recover all three rift keystones'})[portal.unlock];
  },
  warpPortal(portal){
    const p=this.player;if(p.dead||this.portalCooldown>0||(portal.scene||'overworld')!==this.scene||!activeIn(portal.phase,this.timeline))return false;
    if(!this.portalReady(portal)){this.emit('toast',{text:'This rift is asleep. '+this.portalHint(portal)+'.'});return false;}
    if(portal.door&&this.fightingBoss()){this.emit('toast',{text:'The arena is sealed during the fight. Its small apertures still work.'});return false;}
    const to=this.world.portals.find(q=>q.id===portal.target);if(!to)return false;
    const nextPhase=to.exitPhase||(to.phase==='both'?this.timeline:to.phase),oldScene=this.scene;
    this.scene=to.scene;const box={x:to.x-6,y:to.y-11,w:p.w,h:p.h};
    if(this.solids(nextPhase).some(s=>overlap(box,s))){this.scene=oldScene;this.portalCooldown=.15;this.emit('toast',{text:'The exit is occupied. Wait for its ledge to clear.'});return false;}
    const speed=portal.door?0:clamp(Math.hypot(p.vx,p.vy),420,600),dx=portal.dx??1,dy=portal.dy??0,len=Math.hypot(dx,dy);
    this.burst(p.x+6,p.y+11,'#c4a3ff',18,90);Object.assign(p,{x:box.x,y:box.y,vx:dx/len*speed,vy:dy/len*speed,
      dashX:dx/len,dashY:dy/len,dashTime:portal.door?0:.19,grounded:false,groundId:null,wall:0,wallLock:0,riftCooldown:.08,invincible:.45});
    this.timeline=nextPhase;this.refillMovement();this.portalCooldown=.65;this.riftAnchor=null;this.projectiles=[];
    this.dread=Math.min(this.dread,.28);this.pursuer=null;this.riftFlash=.65;this.camera.x=p.x-245;this.clipScene();
    const checkpoints=CHECKPOINTS.filter(c=>(c.scene||'overworld')===this.scene);
    const cp=checkpoints.sort((a,b)=>Math.abs(a.x-p.x)-Math.abs(b.x-p.x))[0];
    if(cp){this.progress.checkpoint=cp.id;if(!this.progress.visited.includes(cp.id))this.progress.visited.push(cp.id);}
    this.emit('portal',{name:to.name,loud:!portal.door,id:portal.id});this.save();return true;
  },
  placeRiftAnchor(){
    const p=this.player;
    if(!this.hasPower('riftAnchor')){this.emit('toast',{text:'Recover the Fold keystone to awaken Rift Anchor.'});return false;}
    if(this.riftAnchor&&this.riftAnchor.until>this.time){
      const a=this.riftAnchor;if(p.focus<10){this.emit('toast',{text:'Returning to your anchor needs 10 focus.'});return false;}
      const box={x:a.x,y:a.y-p.h,w:p.w,h:p.h};
      if(a.scene!==this.scene||this.solids(a.phase).some(s=>s.id!=='personal-anchor'&&overlap(box,s))){this.emit('toast',{text:'The anchor’s return point is blocked. It will fade in a moment.'});return false;}
      p.focus-=10;Object.assign(p,{x:box.x,y:box.y,vx:0,vy:0,dashTime:0,wall:0,grounded:false,groundId:null,invincible:.25});
      this.timeline=a.phase;this.refillMovement();this.riftAnchor=null;this.riftFlash=.4;this.emit('recall');return true;
    }
    if(p.focus<30){this.emit('toast',{text:'An anchor needs 30 focus. Returning costs another 10.'});return false;}
    const ledge={x:p.x-8,y:p.y+p.h,w:28,h:6},onGround=p.grounded;
    if(!onGround&&this.solids().some(s=>overlap(ledge,s))){this.emit('toast',{text:'Move clear of the wall before placing a foothold.'});return false;}
    p.focus-=30;this.riftAnchor={x:p.x,y:p.y+p.h,phase:this.timeline,scene:this.scene,until:this.time+6,onGround};
    this.emit('anchor');return true;
  },
  freezeClocks(seconds=6){this.freezeUntil=this.time+seconds;this.burst(8790,382,'#ffe8a4',22,90);this.emit('toast',{text:'CLOCK HELD · 6 seconds. The ledges still belong to their own realms.'});this.emit('clock');},
  reflectProjectile(o){
    o.team='player';o.phase=this.timeline;o.vx=-o.vx;o.vy=-o.vy;o.damage=Math.max(24,o.damage||0);o.life=Math.max(o.life,1.5);
    this.player.focus=Math.min(this.maxFocus,this.player.focus+5);this.float('PARRY',this.player.x+6,this.player.y-8,'#b5ffee');this.emit('parry');return true;
  },
  fightingBoss(){return (this.world.boss.active&&!this.world.boss.dead)||(this.world.borrowed.active&&!this.world.borrowed.dead);},
  updateRiftSystems(dt,input){
    const p=this.player;this.portalCooldown=Math.max(0,this.portalCooldown-dt);
    p.sneaking=!!(input.down&&p.grounded&&p.dashTime<=0&&!input.attack&&!input.dash);
    if(input.anchor&&!this.previous.anchor)this.placeRiftAnchor();
    if(this.riftAnchor&&this.riftAnchor.until<=this.time)this.riftAnchor=null;
    for(const s of this.world.platforms){
      if(!s.crumble||(s.scene||'overworld')!==this.scene)continue;
      const state=this.crumbling[s.id]||(this.crumbling[s.id]={stress:0,until:0});
      if(state.until&&state.until<=this.time){state.stress=0;state.until=0;}
      if(p.grounded&&p.groundId===s.id&&state.until<=this.time){
        state.stress+=dt;if(state.stress>=s.crumble){state.until=this.time+3.2;state.stress=0;p.grounded=false;this.burst(s.x+s.w/2,s.y,'#dd9eaa',12,40);this.emit('crack');}
      }else if(!state.until)state.stress=0;
    }
    let onPlate=false;
    for(const plate of this.world.plates){
      if(plate.scene!==this.scene)continue;
      if(p.grounded&&Math.abs(p.x+6-plate.x)<plate.w/2&&Math.abs(p.y+p.h-plate.y)<4&&p.sneaking){
        onPlate=true;this.plateCharge=Math.min(plate.charge,this.plateCharge+dt);
        if(this.plateCharge>=plate.charge){const first=!this.relayTimers[plate.id]||this.relayTimers[plate.id]<this.time;
          this.relayTimers[plate.id]=this.time+plate.duration;if(first){this.emit('toast',{text:'The quiet path opens for 7 seconds. Move now. Q follows the gold and violet ledges.'});this.emit('quiet');}}
      }
    }
    if(!onPlate)this.plateCharge=0;
    if(p.dashTime>0&&this.portalCooldown<=0){
      const portal=this.world.portals.find(q=>!q.door&&q.scene===this.scene&&activeIn(q.phase,this.timeline)&&this.portalReady(q)&&Math.hypot(p.x+6-q.x,p.y+11-q.y)<22);
      if(portal)this.warpPortal(portal);
    }
  },
  updateDread(dt,input){
    const p=this.player;
    const safe=this.world.anchors.some(a=>this.progress.anchors.includes(a.id)&&Math.hypot(p.x-a.x,p.y+p.h-a.y)<95)||
      CHECKPOINTS.some(c=>(c.scene||'overworld')===this.scene&&Math.abs(p.x-c.x)<85);
    if(this.timeline==='past'||safe){this.dread=Math.max(0,this.dread-dt*.2);this.pursuer=null;if(this.dread<.2)this.whisperBand=0;return;}
    if(this.fightingBoss()){this.dread=Math.min(.55,this.dread);this.pursuer=null;return;}
    const rate=this.scene==='choir'?.064:.029;
    this.dread=clamp(this.dread+dt*(p.sneaking?-.1:rate)*(this.progress.riftEnding==='remember'?.65:1),0,1);
    if(!p.sneaking&&(Math.abs(p.vx)>130||input.attack)){this.noiseX=p.x;this.noiseY=p.y;}
    const band=this.dread>.78?3:this.dread>.58?2:this.dread>.34?1:0;
    if(band>this.whisperBand){this.whisperBand=band;this.emit('whisper',{text:['','“Nara... you left me here.”','The voice is behind you now.','It heard you. S hides; Q, lanterns and Ward break its pursuit.'][band]});}
    if(this.dread>.7&&!this.pursuer){this.pursuer={x:p.x-p.facing*175,y:p.y-5,life:0};this.noiseX=p.x;this.noiseY=p.y;}
    if(this.pursuer){
      const s=this.pursuer;s.life+=dt;
      const targetX=p.sneaking?this.noiseX:p.x,targetY=p.sneaking?this.noiseY:p.y;
      s.x=approach(s.x,targetX,108*dt);s.y=approach(s.y,targetY-6,85*dt);
      if(s.life>.7&&Math.hypot(s.x-p.x,s.y-(p.y-6))<20&&!p.sneaking){this.hurt(23,s.x);p.focus=Math.max(0,p.focus-15);s.x=p.x-p.facing*160;this.dread=.48;this.emit('whisper',{text:'It took a little of your light. Get to Before or a lantern.'});}
      if(this.dread<.48)this.pursuer=null;
    }
  },
  hitBorrowed(amount,phase=this.timeline){
    const b=this.world.borrowed;if(!b.active||b.dead||b.hurt>0)return;
    const damage=Math.ceil(amount*(phase===b.aura?.65:1.5));b.hp=Math.max(0,b.hp-damage);b.hurt=.14;
    this.float(String(damage),b.x+11,b.y-7,'#ffd3d3');this.burst(b.x+11,b.y+20,'#eb9daf',12,70);this.emit('hit');
    if(b.hp<=0){b.dead=true;this.progress.houseBossDefeated=true;this.gainXP(190);this.emit('borrowedDefeated');this.save();}
  },
  updateBorrowed(dt){
    const b=this.world.borrowed,p=this.player;if(this.scene!=='house'||b.dead||p.dead)return;
    if(!b.active&&Math.abs(p.x-b.x)<330){b.active=true;this.emit('borrowed');}
    if(!b.active)return;b.hurt=Math.max(0,b.hurt-dt);b.timer-=dt;
    if(b.rush>0){b.rush-=dt;b.x=clamp(b.x+b.dir*340*dt,11020,11700);b.state='rushing';}
    else if(b.timer>.65){b.state='idle';b.x=approach(b.x,clamp(p.x+90,11120,11620),35*dt);}
    if(b.timer<=.65&&b.timer>0&&b.state!=='windup'){
      b.state='windup';b.copy=['dash','bolt','jump','sword','ward'].includes(this.lastAction)?this.lastAction:'jump';
      if(b.copy===b.lastCopy)b.copy=['dash','bolt','jump'][b.cycle%3];
      b.targetX=clamp(p.x-p.facing*100,11030,11680);
      b.warning=({dash:'COPIED DASH · JUMP OR USE AN APERTURE',bolt:'COPIED BOLT · PARRY WITH L',jump:'COPIED JUMP · GROUND WAVES INCOMING',sword:'COPIED BLADE · GET ABOVE IT',ward:'COPIED WARD · MOVE OUT OF THE RING'})[b.copy];
    }
    b.tell=b.state==='windup'?Math.max(0,b.timer):0;
    if(b.timer<=0){
      const x=b.x+11,y=b.y+18,a=Math.atan2(p.y+11-y,p.x+6-x);b.lastCopy=b.copy;b.cycle++;b.timer=b.hp<b.maxHp*.5?2.05:2.8;b.state='idle';
      if(b.copy==='dash'){b.x=b.targetX;b.rush=.42;b.dir=Math.sign(p.x-b.x)||1;}
      else if(b.copy==='bolt'){for(let i=-2;i<=2;i++)this.projectiles.push({x,y,vx:Math.cos(a+i*.18)*185,vy:Math.sin(a+i*.18)*185,r:5,life:3,phase:b.aura,team:'enemy',damage:22});}
      else if(b.copy==='ward'){for(let i=0;i<8;i++){const q=i*Math.PI/4;this.projectiles.push({x,y,vx:Math.cos(q)*110,vy:Math.sin(q)*110,r:5,life:1.6,phase:'both',team:'enemy',damage:18});}}
      else for(const dir of [-1,1])this.projectiles.push({x,y:b.copy==='sword'?375:393,vx:dir*235,vy:0,r:b.copy==='sword'?10:8,life:3,phase:b.copy==='sword'?b.aura:'both',team:'enemy',damage:24});
      b.aura=b.aura==='past'?'present':'past';this.emit('bossCast');
    }
    const reach=p.combo===3?43:34,box={x:p.facing>0?p.x+p.w-3:p.x-reach,y:p.y-4,w:reach+3,h:31};
    if(p.attack>0&&!p.attackHits.includes(b.id)&&overlap(box,b)){p.attackHits.push(b.id);this.hitBorrowed(this.damage*(p.finisherCharged?1.6:1));}
    if(!b.dead&&overlap(p,b)&&p.dashTime<=0)this.hurt(b.state==='rushing'?30:23,b.x+11);
  },
  finishRiftStory(choice){
    const p=this.progress;if(!['remember','bind'].includes(choice)||p.houseComplete||!p.houseBossDefeated||!p.archiveComplete||!RIFT_CORES.every(c=>p.collected.includes(c.id)))return false;
    p.riftEnding=choice;p.houseComplete=true;this.dread=0;this.pursuer=null;this.player.focus=this.maxFocus;this.gainXP(180);this.emit('dialogue',{id:'rift-ending'});this.save();return true;
  }
};
export function installRifts(Game){
  Object.assign(Game.prototype,methods);
  const originalSolids=Game.prototype.solids;
  Game.prototype.solids=function(phase=this.timeline){
    const list=originalSolids.call(this,phase).filter(s=>this.isSolidPlatform(s,phase));
    const a=this.riftAnchor;if(a&&a.until>this.time&&!a.onGround&&a.scene===this.scene&&activeIn(a.phase,phase))list.push({id:'personal-anchor',x:a.x-8,y:a.y,w:28,h:6,phase:a.phase,scene:a.scene});
    return list;
  };
  const originalStep=Game.prototype.step;
  Game.prototype.step=function(dt,input={}){
    dt=clamp(dt,0,.025);if(this.started&&!this.player.dead)this.updateRiftSystems(dt,input);
    originalStep.call(this,dt,input);
    if(this.started&&!this.player.dead){this.clipScene();this.updateDread(dt,input);this.updateBorrowed(dt);}
  };
  const originalRespawn=Game.prototype.respawn;
  Game.prototype.respawn=function(...args){originalRespawn.apply(this,args);this.initRifts();};
  const originalTravel=Game.prototype.travel;
  Game.prototype.travel=function(id){if(this.world.borrowed.active&&!this.world.borrowed.dead){this.emit('toast',{text:'The Unwritten House is sealed until the Borrowed falls.'});return false;}return originalTravel.call(this,id);};
  const originalInteract=Game.prototype.interact;
  Game.prototype.interact=function(){
    const near=this.nearby();
    if(near?.kind==='portal')return this.warpPortal(near);
    if(near?.kind==='loom'){this.emit('dialogue',{id:'memory-loom'});return true;}
    return originalInteract.call(this);
  };
  const originalNearby=Game.prototype.nearby;
  Game.prototype.nearby=function(){
    const base=originalNearby.call(this),p=this.player,entries=base?[base]:[];
    for(const portal of this.world.portals)if(portal.door&&portal.scene===this.scene&&Math.hypot(p.x+6-portal.x,p.y+11-portal.y)<49)entries.push({...portal,kind:'portal',distance:Math.hypot(p.x+6-portal.x,p.y+11-portal.y),name:portal.name});
    const loom=this.world.loom;if(this.scene==='house'&&this.world.borrowed.dead&&Math.hypot(p.x+6-loom.x,p.y+p.h-loom.y)<55)entries.push({...loom,kind:'loom',distance:Math.hypot(p.x+6-loom.x,p.y+p.h-loom.y)});
    return entries.sort((a,b)=>a.distance-b.distance)[0]||null;
  };
  const originalHit=Game.prototype.hitEnemy;
  Game.prototype.hitEnemy=function(e,amount,source={}){
    if(e.type==='sentinel'&&source.kind==='sword'&&e.guardBroken<=0&&(source.x-e.x)*e.dir>0){
      if(source.finisher){e.guardBroken=1.4;amount*=.65;this.float('GUARD BROKEN',e.x,e.y-15,'#ffd099');}
      else{e.guardHit=.25;this.float('FLANK / FINISHER',e.x,e.y-9,'#e2bbae');this.emit('guard');return;}
    }
    if(source.kind==='bolt'){e.stun=1.1;e.shoot=Math.max(e.shoot,1.1);}
    originalHit.call(this,e,amount);
  };
  const originalWard=Game.prototype.castWard;
  Game.prototype.castWard=function(){
    if(this.hasPower('ward')&&this.player.focus>=34&&this.player.wardCooldown<=0)for(const o of this.projectiles)if(o.team!=='player'&&Math.hypot(o.x-this.player.x,o.y-this.player.y)<145)this.reflectProjectile(o);
    const result=originalWard.call(this);
    if(result){this.dread*=.3;this.pursuer=null;if(this.progress.riftEnding==='bind')this.player.wardCooldown=4;
      if(this.world.borrowed.active&&Math.hypot(this.world.borrowed.x-this.player.x,this.world.borrowed.y-this.player.y)<105)this.hitBorrowed(24);}
    return result;
  };
  const originalEmit=Game.prototype.emit;
  Game.prototype.emit=function(type,data={}){
    if(this.scene){
      const action=({dash:'dash',bolt:'bolt',jump:'jump',doubleJump:'jump',swing:'sword',ward:'ward'})[type];if(action)this.lastAction=action;
      const noise=({dash:.045,swing:.02,bolt:.035,portal:data.id==='choir-launch' ? .42 : data.loud ? .16 : 0,recall:.04})[type]||0;
      if(this.timeline==='present'&&noise){this.dread=clamp(this.dread+noise,0,1);this.noiseX=this.player.x;this.noiseY=this.player.y;}
    }
    originalEmit.call(this,type,data);
  };
}
