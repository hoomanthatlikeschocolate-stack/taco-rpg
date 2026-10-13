import { VIEW, CHECKPOINTS, activeIn } from './world.js';
const hash = n => { const v=Math.sin(n*127.1+311.7)*43758.5453;return v-Math.floor(v); };
const COLORS={
  present:{sky:'#111728',haze:'#465271',far:'#252d49',peak:'#3b4262',snow:'#8a94b0',tree:'#202e43',rock:'#2d354b',edge:'#8a94ae',grass:'#929fb7',accent:'#ace7f1'},
  past:{sky:'#252437',haze:'#a27b78',far:'#66546f',peak:'#8d7588',snow:'#edc7b7',tree:'#354a49',rock:'#394952',edge:'#81a18b',grass:'#a8c798',accent:'#ffd49a'},
};
export class Renderer {
  constructor(canvas,createCanvas=()=>document.createElement('canvas')){
    this.canvas=canvas;this.ctx=canvas.getContext('2d');canvas.width=VIEW.width;canvas.height=VIEW.height;
    this.ctx.imageSmoothingEnabled=false;this.layers={};
    for(const phase of ['present','past']){
      const bg=createCanvas();bg.width=960;bg.height=360;const c=bg.getContext('2d'),p=COLORS[phase];
      const g=c.createLinearGradient(0,0,0,360);g.addColorStop(0,p.sky);g.addColorStop(.65,p.haze);g.addColorStop(1,p.sky);c.fillStyle=g;c.fillRect(0,0,960,360);
      for(let i=0;i<90;i++){c.fillStyle=phase==='present'?'#c7d4e8':'#edc9b0';c.globalAlpha=.2+hash(i)*.6;c.fillRect(hash(i+30)*960,hash(i+50)*155,i%7===0?2:1,1);}c.globalAlpha=1;
      c.fillStyle=phase==='present'?'#d6dde6':'#ffd8a2';c.beginPath();c.arc(phase==='present'?625:670,69,20,0,Math.PI*2);c.fill();
      if(phase==='present'){c.fillStyle=p.sky;c.beginPath();c.arc(617,63,19,0,Math.PI*2);c.fill();}
      const peaks=[[-60,207,70,88,210],[150,193,280,40,420],[340,213,470,110,590],[520,200,640,82,815],[755,225,875,59,1030]];
      for(const [left,base,peak,top,right]of peaks){c.fillStyle=p.far;c.beginPath();c.moveTo(left,360);c.lineTo(left,base);c.lineTo(peak,top);c.lineTo(right,250);c.lineTo(right,360);c.fill();
        c.fillStyle=p.peak;c.beginPath();c.moveTo(peak,top);c.lineTo(peak+28,top+80);c.lineTo(right,280);c.lineTo(right,360);c.lineTo(peak,360);c.fill();
        c.fillStyle=p.snow;c.beginPath();c.moveTo(peak,top);c.lineTo(peak+43,top+66);c.lineTo(peak+17,top+56);c.lineTo(peak+9,top+76);c.lineTo(peak-5,top+47);c.lineTo(peak-44,top+69);c.fill();}
      for(let i=0;i<48;i++)this.pine(c,i*23-12,290+hash(i+74)*47,22+hash(i+95)*28,p.tree);
      this.layers[phase]=bg;
    }
  }
  rect(x,y,w,h,color){const c=this.ctx;c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));}
  pine(c,x,y,h,color){c.fillStyle=color;c.fillRect(x-2,y-h*.6,4,h*.6);for(let i=0;i<4;i++){const yy=y-h+i*h*.2,w=h*.15+i*h*.11;c.beginPath();c.moveTo(x,yy);c.lineTo(x+w,yy+h*.34);c.lineTo(x-w,yy+h*.34);c.fill();}}
  diamond(x,y,r,color){const c=this.ctx;c.fillStyle=color;c.beginPath();c.moveTo(x,y-r);c.lineTo(x+r,y);c.lineTo(x,y+r);c.lineTo(x-r,y);c.fill();}
  text(text,x,y,color='#d5dce7',size=7,align='center'){const c=this.ctx;c.font=`${size}px monospace`;c.textAlign=align;c.fillStyle=color;c.fillText(text,Math.round(x),Math.round(y));}
  hero(x,y,facing,time,moving=false,attack=0,ready=true,alpha=1){
    const c=this.ctx;c.save();c.globalAlpha=alpha;c.translate(Math.round(x+6),Math.round(y+22));c.scale(facing,1);
    const stride=moving?Math.round(Math.sin(time*17)*2):0,bob=moving?Math.abs(Math.round(Math.sin(time*17))):0;
    const r=(xx,yy,w,h,color)=>this.rect(xx,yy-bob,w,h,color);
    r(-6,-22,11,3,'#e4dfda');r(-8,-19,15,9,'#d1d9da');r(-7,-17,13,6,'#b7c7ce');r(-3,-18,9,6,'#34455c');r(2,-17,2,2,'#b8f5ed');
    r(-5,-12,10,10,'#548989');r(-7,-10,13,6,'#779f9a');r(-5,-5,10,3,'#e6c28d');r(-5,-2,4,3,'#26364b');r(2,-2,4,3,'#26364b');
    r(-5,-2+stride,4,3,'#b8c8ca');r(2,-2-stride,4,3,'#b8c8ca');r(-7,-12,14,3,ready?'#8ee8d7':'#89aeb0');
    r(-13,-11+Math.sin(time*8)*1.5,7,3,'#67bdad');r(-18,-10+Math.sin(time*8+1)*1.8,6,2,'#539d97');
    if(attack>0){r(6,-14,3,3,'#ffd9b0');r(8,-20,3,11,'#e0eafb');r(7,-12,7,2,'#f6ce90');c.strokeStyle='#c1fff0';c.lineWidth=2;c.beginPath();c.arc(5,-11,22,-1.35,1.1);c.stroke();}
    else {r(6,-9,3,5,'#d6d9d9');r(-4,-10,2,9,'#374c61');}
    c.restore();
  }
  draw(game,menu=false){
    const c=this.ctx,t=game.time,palette=COLORS[game.timeline],cam=game.camera;
    c.clearRect(0,0,640,360);c.imageSmoothingEnabled=false;
    const bg=this.layers[game.timeline],ox=Math.floor(cam.x*.1)%320;
    c.drawImage(bg,-ox,0);
    // The abandoned aqueduct gives the two timelines the same recognizable landmark.
    c.save();c.translate(-Math.floor(cam.x*.3),-Math.floor(cam.y*.12));
    for(let i=0;i<18;i++){
      const x=360+i*116,y=225;
      this.rect(x,y,116,10,game.timeline==='past'?'#726978':'#4c526f');
      this.rect(x+6,y+10,14,109,game.timeline==='past'?'#5a5f6b':'#3b445e');
      this.rect(x+92,y+10,15,110,game.timeline==='past'?'#535b67':'#363f59');
      for(let j=0;j<6;j++)this.rect(x+21+j*12,y+10+j*2,12,8,game.timeline==='past'?'#676878':'#474f69');
      if(game.timeline==='past'){this.rect(x,y-3,108,3,'#789981');this.rect(x+7,y+27,3,56,'#5c7f78');}
    }c.restore();
    // A falling ribbon of light marks the fractured crossing.
    const waterfallX=930-cam.x*.47;
    if(waterfallX>-90&&waterfallX<730){c.globalAlpha=.16;for(let i=0;i<5;i++)this.rect(waterfallX+i*5,165,4,195,i%2?'#c2c8ec':'#8a94cf');c.globalAlpha=1;for(let i=0;i<22;i++)this.rect(waterfallX+hash(i)*25,165+(t*38+i*19)%185,1,4,'#a8b8d1');}
    c.save();const shake=game.shake>0?Math.sin(t*170)*2:0;c.translate(-Math.floor(cam.x)+shake,-Math.floor(cam.y));
    // Ghost geometry remains visible so timeline puzzles are readable.
    for(const s of game.world.platforms){
      if(s.x+s.w<cam.x-10||s.x>cam.x+650)continue;
      if(!activeIn(s.phase,game.timeline)){c.globalAlpha=.25;c.strokeStyle=s.phase==='past'?'#f5bd83':'#88cbea';c.lineWidth=1;c.strokeRect(Math.floor(s.x)+.5,s.y+.5,s.w-1,s.h-1);for(let x=s.x+4;x<s.x+s.w;x+=10)this.rect(x,s.y,4,1,s.phase==='past'?'#ffd498':'#afd8f3');c.globalAlpha=1;continue;}
      this.rect(s.x,s.y,s.w,s.h,palette.rock);this.rect(s.x,s.y,s.w,3,palette.edge);this.rect(s.x,s.y+3,s.w,3,game.timeline==='past'?'#50746b':'#526078');
      for(let y=s.y+8;y<Math.min(s.y+s.h,cam.y+360);y+=14){const row=Math.floor((y-s.y)/14);for(let x=s.x+row%2*8;x<s.x+s.w-2;x+=19){this.rect(x+2,y,Math.min(14,s.x+s.w-x-2),1,'#222e42');if(hash(x+y)>.5)this.rect(x+5,y+4,4,2,'#46536b');}}
      if(!s.moving){for(let x=s.x+4;x<s.x+s.w-3;x+=12){const h=2+Math.floor(hash(x)*4);this.rect(x,s.y-h,1,h,palette.grass);this.rect(x+1,s.y-h+1,2,1,palette.grass);}}
    }
    for(let i=0;i<24;i++){
      const x=i*205+38;if(x<cam.x-55||x>cam.x+700)continue;
      const h=45+hash(i)*65,ground=400;
      if(game.world.platforms.some(s=>s.h>100&&x>s.x&&x<s.x+s.w))this.pine(c,x,ground,h,game.timeline==='past'?'#243d40':'#192b40');
    }
    for(const spike of game.world.spikes){for(let x=spike.x;x<spike.x+spike.w;x+=8){c.fillStyle='#c7c8d8';c.beginPath();c.moveTo(x,400);c.lineTo(x+4,391);c.lineTo(x+8,400);c.fill();this.rect(x+4,396,2,4,'#697995');}}
    for(const cp of CHECKPOINTS){
      const active=game.progress.checkpoint===cp.id;this.rect(cp.x-5,cp.y-30,10,30,'#405269');this.rect(cp.x-8,cp.y-7,16,7,'#667b89');
      this.diamond(cp.x,cp.y-35,5,active?'#9ff1e3':'#7da3b9');
      c.globalAlpha=active?.18:.07;c.fillStyle='#a7f5e8';c.beginPath();c.arc(cp.x,cp.y-35,15+Math.sin(t*2)*2,0,Math.PI*2);c.fill();c.globalAlpha=1;
    }
    const npc=game.world.npc;this.hero(npc.x,npc.y-22,-1,t,false,0,false);this.rect(npc.x-5,npc.y-28,23,4,'#907f82');
    if(Math.abs(game.player.x-npc.x)<65&&!menu)this.text('E · TALK',npc.x+5,npc.y-40,'#e3d9c8',7);
    for(const item of game.world.pickups){
      if(game.progress.collected.includes(item.id)||item.x<cam.x-20||item.x>cam.x+660)continue;
      const y=item.y+Math.sin(t*2.8+item.x)*2,visible=activeIn(item.phase,game.timeline);c.globalAlpha=visible?1:.23;
      if(item.type==='seal'){c.strokeStyle='#eab787';c.strokeRect(item.x-9,y-9,18,18);this.diamond(item.x,y,6,'#ffe1a1');this.diamond(item.x,y,3,'#fff4d0');}
      else if(item.type==='secret'){this.rect(item.x-5,y-5,10,9,'#e8ce94');this.rect(item.x-7,y+4,14,2,'#ffe8b7');this.rect(item.x-1,y+7,2,2,'#ffe8b7');}
      else{this.diamond(item.x,y,3,'#cdf5b8');this.rect(item.x,y-1,1,2,'#ffffff');}
      c.globalAlpha=1;
    }
    for(const o of game.world.refills){c.globalAlpha=o.ready>0?.22:1;this.diamond(o.x,o.y+Math.sin(t*3)*3,6,'#8eefe4');this.diamond(o.x,o.y+Math.sin(t*3)*3,3,'#defdfa');c.globalAlpha=1;}
    for(const e of game.world.enemies){
      if(e.dead||e.x<cam.x-30||e.x>cam.x+670)continue;c.globalAlpha=activeIn(e.phase,game.timeline)?1:.2;
      const color=e.hurt>0?'#fbe7e8':e.type==='wisp'?'#bea7dc':'#aa7c9d';
      if(e.type==='wisp'){this.diamond(e.x+9,e.y+7,9,color);this.rect(e.x+5,e.y+5,2,2,'#211a39');this.rect(e.x+12,e.y+5,2,2,'#211a39');this.rect(e.x+7,e.y+17,4,2,'#9b85c6');}
      else{this.rect(e.x+3,e.y+3,13,12,color);this.rect(e.x,e.y+8,18,6,color);this.rect(e.x+3,e.y+15,3,2,'#533e64');this.rect(e.x+13,e.y+15,3,2,'#533e64');this.rect(e.x+5,e.y+7,2,2,'#fff0d5');this.rect(e.x+12,e.y+7,2,2,'#fff0d5');}
      if(e.hp<e.maxHp){this.rect(e.x,e.y-5,18,2,'#372944');this.rect(e.x,e.y-5,18*e.hp/e.maxHp,2,'#eeacb7');}c.globalAlpha=1;
    }
    const b=game.world.boss;
    if(!b.dead){const color=b.hurt>0?'#ffffff':b.aura==='past'?'#cb9f86':'#9699c5';
      this.rect(b.x+6,b.y+5,16,24,'#364355');this.rect(b.x+2,b.y+12,24,15,color);this.rect(b.x+5,b.y+30,6,9,'#4d6075');this.rect(b.x+18,b.y+30,6,9,'#4d6075');
      this.rect(b.x+6,b.y-1,18,10,color);this.rect(b.x+9,b.y+3,12,3,'#243247');this.rect(b.x+11,b.y+4,3,1,'#c6ffec');this.rect(b.x+19,b.y+4,3,1,'#c6ffec');
      for(let i=0;i<3;i++)this.diamond(b.x+3+i*11,b.y-7+Math.sin(t*2+i)*2,3,b.aura==='past'?'#ffd59a':'#b5d4f8');
      if(b.tell>0){c.globalAlpha=.5;this.diamond(b.x+14,b.y-25,8,'#ffbb9a');c.globalAlpha=1;}
    }
    const gate=game.world.gate,unlocked=game.seals===3&&game.progress.bossDefeated;
    this.rect(gate.x-27,gate.y-75,10,75,'#5c6680');this.rect(gate.x+17,gate.y-75,10,75,'#5c6680');this.rect(gate.x-27,gate.y-78,54,11,'#8690a5');
    c.globalAlpha=unlocked?.65:.16;this.rect(gate.x-16,gate.y-65,33,65,unlocked?'#99eddf':'#8690be');c.globalAlpha=1;
    for(let i=0;i<3;i++)this.diamond(gate.x-15+i*15,gate.y-87,3,i<game.seals?'#ffe1a2':'#536079');
    for(const o of game.projectiles){c.globalAlpha=activeIn(o.phase,game.timeline)?1:.2;this.diamond(o.x,o.y,o.r+2,o.phase==='past'?'#ffbb94':'#c5b2ff');this.diamond(o.x,o.y,o.r/2,'#fff0e0');c.globalAlpha=1;}
    for(const tr of game.trails)this.hero(tr.x,tr.y,tr.facing,t,false,0,true,tr.life*.7);
    const player=game.player;if(!player.dead&&!(player.invincible>0&&Math.floor(t*15)%2))this.hero(player.x,player.y,player.facing,t,Math.abs(player.vx)>25&&player.grounded,player.attack,player.dashReady);
    for(const o of game.particles){c.globalAlpha=Math.min(1,o.life/.3);this.rect(o.x,o.y,o.size,o.size,o.color);}c.globalAlpha=1;
    for(const o of game.floats){c.globalAlpha=Math.min(1,o.life/.3);this.text(o.text,o.x,o.y,o.color,8);}c.globalAlpha=1;
    if(!menu){
      if(player.x<340)this.text('← → MOVE     SPACE JUMP',350,326,'#d8e1dc',8);
      if(player.x>460&&player.x<750)this.text('Q · SHIFT INTO THE PAST',741,315,'#efd6b9',8);
      if(player.x>1250&&player.x<1800)this.text('X · DASH    Q · CHANGE TIMELINES',1640,248,'#e6d6dc',7);
      if(player.x>2110&&player.x<2530)this.text('JUMP AGAINST A WALL TO CLIMB',2350,208,'#dadde1',7);
    }
    c.restore();
    // Slow drifting motes, independent of world geometry.
    for(let i=0;i<26;i++){const x=(hash(i+120)*640+t*(3+hash(i)*4))%640,y=hash(i+90)*360+Math.sin(t+i)*5;c.globalAlpha=.2+hash(i)*.4;this.rect(x,y,1,1,palette.accent);}c.globalAlpha=1;
    const vignette=c.createRadialGradient(320,150,90,320,170,370);vignette.addColorStop(0,'#090d1600');vignette.addColorStop(1,'#090d168a');c.fillStyle=vignette;c.fillRect(0,0,640,360);
    if(game.riftFlash>0){c.globalAlpha=game.riftFlash*.18;this.rect(0,0,640,360,game.timeline==='past'?'#ffe8c9':'#c4dcff');c.globalAlpha=1;}
    if(game.flash>0){c.globalAlpha=game.flash*.6;this.rect(0,0,640,360,'#ff7796');c.globalAlpha=1;}
  }
}
