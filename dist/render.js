import { VIEW, CHECKPOINTS, activeIn } from './world.js';
import { objectiveFor } from './story.js';
const hash = n => { const v=Math.sin(n*127.1+311.7)*43758.5453;return v-Math.floor(v); };
const COLORS={
  present:{sky:'#0c0b17',haze:'#3c294b',far:'#241b35',peak:'#45344f',snow:'#927688',tree:'#181527',rock:'#302a40',edge:'#a996b5',grass:'#a493b5',accent:'#ceaff6'},
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
    r(-6,-23,11,5,'#352435');r(-7,-19,12,7,'#4c2e40');r(-3,-19,8,7,'#dfad8e');r(-6,-22,8,2,'#96604e');r(3,-18,2,2,'#122b35');r(5,-16,1,3,'#edc0a3');
    r(-5,-12,10,10,'#548989');r(-7,-10,13,6,'#779f9a');r(-5,-5,10,3,'#e6c28d');r(-5,-2,4,3,'#26364b');r(2,-2,4,3,'#26364b');
    r(-5,-2+stride,4,3,'#b8c8ca');r(2,-2-stride,4,3,'#b8c8ca');r(-7,-12,14,3,ready?'#ffc48d':'#b19b91');
    r(-13,-11+Math.sin(time*8)*1.5,7,3,'#d67c71');r(-18,-10+Math.sin(time*8+1)*1.8,6,2,'#b66771');
    if(attack>0){r(6,-14,3,3,'#ffd9b0');r(8,-20,3,11,'#e0eafb');r(7,-12,7,2,'#f6ce90');c.strokeStyle='#c1fff0';c.lineWidth=2;c.beginPath();c.arc(5,-11,22,-1.35,1.1);c.stroke();}
    else {r(6,-9,3,5,'#d6d9d9');r(-4,-10,2,9,'#374c61');}
    c.restore();
  }
  character(id,x,y,t){
    const c=this.ctx;c.save();c.translate(Math.round(x),Math.round(y));
    const r=(a,b,w,h,color)=>this.rect(a,b,w,h,color);
    if(id==='borrowed'){r(0,-52,13,4,'#b6a0aa');r(-3,-48,19,15,'#d9bdc3');r(-1,-44,6,5,'#17101e');r(9,-45,6,5,'#17101e');r(1,-42,2,1,'#e4a4ad');r(11,-43,2,1,'#e4a4ad');r(5,-37,4,9,'#110b1c');r(0,-32,13,26,'#211329');r(-6,-32,4,17,'#8d6d83');r(-10,-17,4,18,'#8d6d83');r(-12,-1,1,8,'#ceb0bc');r(-9,-1,1,10,'#ceb0bc');r(16,-33,4,21,'#8d6d83');r(19,-13,3,17,'#8d6d83');r(20,3,1,9,'#ceb0bc');r(23,2,1,8,'#ceb0bc');r(0,-8,4,10,'#57405c');r(10,-7,4,9,'#57405c');r(-3,-27,20,3,'#c28d91');r(-9,-26,7,2,'#9f5b70');}
    else if(id==='orin'){r(-2,-30,17,14,'#766f86');r(1,-26,11,9,'#181722');r(-1,-17,16,16,'#47566b');r(0,-15,3,15,'#b7ad91');r(15,-17,6,13,'#a39f86');r(16,-15,4,1,'#444458');r(17,-11,3,1,'#444458');r(2,-2,4,3,'#b9c1c1');r(10,-2,4,3,'#b9c1c1');}
    else if(id==='pip'){r(0,-17,15,11,'#8d7258');r(5,-21,10,8,'#b59b78');r(14,-18,7,3,'#e1bd84');r(10,-19,3,2,'#8cf4d9');r(-6,-11,9,3,'#574a50');r(4,-5,2,5,'#d8a46e');r(11,-5,2,5,'#d8a46e');this.diamond(6,-11,3,'#e3c98b');}
    else if(id==='maelin'){r(-3,-25,16,4,'#b09ba0');r(1,-29,9,5,'#745968');r(2,-21,9,9,'#d6b4a0');r(2,-16,9,7,'#ddd0c1');r(-1,-11,16,11,'#6b607b');r(0,-10,3,10,'#b3939b');r(17,-25,2,25,'#b6a083');this.diamond(18,-26,4,'#ffda97');}
    else if(id==='sera'){r(-1,-25,14,11,'#422f44');r(3,-22,10,9,'#e6b393');r(8,-19,5,2,'#322c3a');r(0,-13,15,11,'#ad6572');r(1,-11,4,10,'#d7957f');r(1,-3,4,3,'#514559');r(10,-3,4,3,'#514559');r(18,-26,2,26,'#9ba2b1');r(16,-27,6,2,'#c9b98f');}
    else{c.globalAlpha=id==='ivo-echo'?.6:.82;r(0,-25,12,6,'#466b85');r(2,-21,10,8,'#b4d3d9');r(10,-19,2,2,'#305069');r(-1,-13,15,12,'#759cba');r(-5,-13,16,3,'#c8dff0');r(0,-2,5,2,'#ccddec');r(9,-2,5,2,'#ccddec');for(let i=0;i<3;i++)r(-3,-22+i*7,19,1,'#b6def2');}
    c.restore();
  }
  portrait(canvas,id){
    const previous=this.ctx,c=canvas.getContext('2d');canvas.width=88;canvas.height=88;c.imageSmoothingEnabled=false;c.fillStyle='#202638';c.fillRect(0,0,88,88);this.ctx=c;
    c.save();if(id==='The Borrowed'){c.scale(1.5,1.5);this.character('borrowed',24,55,0);c.restore();this.ctx=previous;return;}c.scale(2.5,2.5);if(id==='Nara')this.hero(13,8,1,0,false,0,true);else this.character(({Maelin:'maelin',Pip:'pip',Sera:'sera',Ivo:'ivo',Lumen:'maelin',Orin:'orin','The Borrowed':'borrowed'})[id]||'ivo-echo',12,31,0);c.restore();this.ctx=previous;
  }
  extras(game,menu){
    const c=this.ctx,t=game.time,cam=game.camera,p=game.player;
    for(const a of game.world.anchors){if(a.x<cam.x-40||a.x>cam.x+680)continue;const lit=game.progress.anchors.includes(a.id);
      this.rect(a.x-7,a.y-27,14,27,'#657184');this.rect(a.x-11,a.y-7,22,7,'#85929b');this.rect(a.x-3,a.y-38,6,10,lit?'#fff1bd':'#795775');
      c.globalAlpha=lit?.2:.07;c.fillStyle=lit?'#ffe3a4':'#bf87a3';c.beginPath();c.arc(a.x,a.y-34,lit?42:18,0,Math.PI*2);c.fill();c.globalAlpha=1;
      this.text(lit?'RESTORED':'E · LIGHT',a.x,a.y-52,lit?'#ffe4b7':'#d1bdcf',6);}
    for(const l of game.world.lore){if(l.x<cam.x-20||l.x>cam.x+660)continue;this.rect(l.x-5,l.y-18,10,18,'#7f7687');this.rect(l.x-3,l.y-14,6,2,'#d8c8a5');if(!game.progress.lore.includes(l.id))this.text('✧',l.x,l.y-24,'#ffe0a4',10);}
    for(const h of game.world.hazards){c.globalAlpha=activeIn(h.phase,game.timeline)?1:.2;const x=h.x+Math.sin(t*h.speed)*h.range;c.strokeStyle='#776484';c.beginPath();c.moveTo(h.x,h.y-65);c.lineTo(x,h.y);c.stroke();this.diamond(x,h.y,h.r,'#dbadc5');this.diamond(x,h.y,3,'#532a51');c.globalAlpha=1;}
    for(const chest of game.world.chests){if(game.progress.opened.includes(chest.id))continue;this.rect(chest.x-8,chest.y-13,16,13,'#947659');this.rect(chest.x-9,chest.y-14,18,4,'#c7aa7a');this.rect(chest.x-2,chest.y-8,4,4,'#ffe2a3');}
    for(const s of game.world.switches){const open=game.progress.switches.includes(s.id);this.diamond(s.x,s.y,12,open?'#93e6cd':'#ae7998');this.rect(s.x-6,s.y-3,12,6,'#222135');this.rect(s.x-2,s.y-3,4,6,open?'#bcffe0':'#f4c3a7');if(!open)this.text('K · SHOOT',s.x,s.y-25,'#ffe1ba',7);}
    for(const s of game.solids().filter(s=>['oath-lock','archive-lock','floodgate'].includes(s.id))){this.rect(s.x,150,18,250,'#4b395d');for(let y=165;y<400;y+=24)this.diamond(s.x+9,y,4,'#dd9daf');if(s.id==='oath-lock')this.text('RESTORE 3 LANTERNS',s.x-42,345,'#f0c5cf',7);if(s.id==='floodgate')this.text('K → EYE SWITCH',s.x-42,335,'#f0c5cf',7);}
    const trial=game.world.trial;this.rect(trial.x-3,trial.y-25,6,25,'#9f8e77');this.diamond(trial.x,trial.y-29,7,'#e5c590');
    if(game.trial)for(let i=game.trial.next;i<trial.bells.length;i++){const b=trial.bells[i];c.strokeStyle=i===game.trial.next?'#ffdf97':'#b09676';c.lineWidth=2;c.beginPath();c.arc(b.x,b.y,13,0,Math.PI*2);c.stroke();this.text(String(i+1),b.x,b.y+3,'#fff2b9',9);}
    if(game.timeline==='present'){
      for(let i=0;i<20;i++){const x=i*383+250;if(x<cam.x-50||x>cam.x+690)continue;c.globalAlpha=.25;this.rect(x,302,7,66,'#090917');this.rect(x-4,298,16,13,'#171023');this.rect(x,303,2,1,'#e0b3bb');this.rect(x+5,303,2,1,'#e0b3bb');this.rect(x-8,322,5,38,'#110b1c');c.globalAlpha=1;}
    }
    if(p.x>=4800){for(let x=4820;x<7600;x+=150){if(x<cam.x-160||x>cam.x+700)continue;this.rect(x,245,100,8,'#6f607c');this.rect(x,245,9,155,'#49405b');this.rect(x+92,245,9,155,'#49405b');for(let j=0;j<5;j++){this.rect(x+11,272+j*22,80,3,'#6e657b');for(let k=0;k<9;k++)this.rect(x+14+k*8,259+j*22,5,12,['#836c80','#627d8e','#98867e'][k%3]);}}}
    if(!menu){const o=objectiveFor(game.progress,game.scene);if(o.target&&o.target.x>cam.x+15&&o.target.x<cam.x+625){const y=o.target.y-25+Math.sin(t*2)*2;this.diamond(o.target.x,y,5,'#ffe0a2');this.text(o.target.phase?(o.target.phase==='past'?'BEFORE':'HOLLOW'):'QUEST',o.target.x,y-10,'#ffe8c0',6);}}
  }
  riftBackdrop(game){
    const c=this.ctx,t=game.reduceMotion?0:game.time,cam=game.camera,phase=game.timeline;
    c.save();
    if(game.scene==='fold'){
      this.rect(7600,85,920,315,phase==='past'?'#373445':'#21182f');
      for(let x=7630;x<8500;x+=115){
        this.rect(x,95,20,305,'#545069');this.rect(x-8,92,36,8,'#807b8c');
        this.rect(x+33,140,44,107,'#1d1a2e');this.rect(x+53,140,3,107,'#6f657e');
        this.rect(x+33,191,44,3,'#6f657e');this.rect(x+35,143,18,45,phase==='past'?'#816773':'#4b345d');
      }
      c.globalAlpha=.3;this.text('THE ROOM BETWEEN TWO MOMENTS',8050,125,'#ded1bf',9);c.globalAlpha=1;
    }
    if(game.scene==='clock'){
      this.rect(8600,76,1020,324,phase==='past'?'#37323f':'#211c30');
      const x=9130,y=207,frozen=game.freezeUntil>game.time;
      c.strokeStyle=frozen?'#e8c284':'#71647e';c.lineWidth=5;c.beginPath();c.arc(x,y,109,0,Math.PI*2);c.stroke();
      c.lineWidth=1;c.beginPath();c.arc(x,y,99,0,Math.PI*2);c.stroke();
      for(let i=0;i<12;i++){const q=i*Math.PI/6;this.diamond(x+Math.sin(q)*93,y-Math.cos(q)*93,3,'#a4929e');}
      const q=frozen?-.6:t*.32;c.lineWidth=3;c.beginPath();c.moveTo(x+Math.sin(q)*74,y-Math.cos(q)*74);c.lineTo(x,y);c.lineTo(x+Math.sin(q*.13)*49,y-Math.cos(q*.13)*49);c.stroke();
      for(let xx=8660;xx<9600;xx+=150){this.rect(xx,90,3,233,'#595368');this.diamond(xx+1,320,7,'#938295');}
      this.text(frozen?'SIX BORROWED SECONDS':'EVERY MOMENT HAS TEETH',9130,79,frozen?'#ffdda0':'#b09ab6',8);
    }
    if(game.scene==='choir'){
      this.rect(9700,83,1100,317,phase==='past'?'#3f3548':'#22172e');
      for(let i=0;i<10;i++){
        const x=9740+i*106,y=172+Math.sin(i*1.9)*32;
        this.rect(x,84,1,y-84,'#685367');this.rect(x-11,y,23,18,'#b6a3ad');this.rect(x-16,y+17,32,115,'#2e203a');
        this.rect(x-9,y+5,5,game.player.sneaking?1:4,'#281629');this.rect(x+5,y+5,5,game.player.sneaking?1:4,'#281629');this.rect(x-2,y+11,4,7,'#453042');
        this.rect(x-12,y+27,2,95,'#54415c');this.rect(x+11,y+29,2,80,'#54415c');
      }
      this.text('THEY STOP SINGING WHEN YOU LOOK',10250,103,'#977e99',8);
    }
    if(game.scene==='house'){
      this.rect(10900,62,900,338,'#20192d');
      for(let x=10920;x<11800;x+=97){this.rect(x,63,4,335,'#48364e');this.rect(x+13,128,52,146,'#2f223b');this.rect(x+13,129,52,3,'#574052');this.rect(x+38,128,2,146,'#574052');}
      this.text('SOMEONE HAS BEEN PRACTICING YOUR NAME',11350,100,'#aa819a',8);
    }
    if(phase==='present'&&(game.scene==='house'||(game.player.x>3050&&game.player.x<3900)||game.dread>.58)){
      const x=game.scene==='house'?11450:cam.x+470,y=game.scene==='house'?187:177;
      c.globalAlpha=game.scene==='house'?.15:.07+game.dread*.09;c.fillStyle='#dec2cc';
      c.beginPath();c.moveTo(x-83,y-95);c.lineTo(x+57,y-101);c.lineTo(x+86,y-34);c.lineTo(x+50,y+78);c.lineTo(x-29,y+91);c.lineTo(x-76,y+23);c.closePath();c.fill();
      this.rect(x-56,y-24,34,17,'#1a1027');this.rect(x+18,y-30,31,19,'#1a1027');this.rect(x-12,y+18,21,57,'#1a1027');
    }
    c.restore();
  }
  riftDetails(game){
    const c=this.ctx,t=game.reduceMotion?0:game.time,cam=game.camera;
    for(const portal of game.world.portals){
      if(portal.scene!==game.scene||portal.x<cam.x-35||portal.x>cam.x+675)continue;
      const ready=game.portalReady(portal),visible=activeIn(portal.phase,game.timeline),color=portal.phase==='past'?'#ffd29d':portal.phase==='present'?'#c3a5ef':'#a1e4e0';
      c.save();c.globalAlpha=!ready?.25:visible?1:.28;c.strokeStyle=color;c.lineWidth=2;
      c.beginPath();c.ellipse(portal.x,portal.y,16,27,0,0,Math.PI*2);c.stroke();c.globalAlpha*=.25;c.fillStyle=color;c.fill();c.globalAlpha=!ready?.25:visible?1:.28;
      this.rect(portal.x-6,portal.y-18,1,36,color);this.rect(portal.x+6,portal.y-18,1,36,color);
      this.text(portal.glyph,portal.x,portal.y+3,'#fff0dc',9);
      this.text(portal.door?(ready?'E · RIFT '+portal.glyph:'SEALED · '+portal.glyph):'DASH · '+portal.glyph,portal.x,portal.y-35,color,6);
      for(let i=0;i<5;i++){const q=t*1.2+i*1.256;this.rect(portal.x+Math.cos(q)*19,portal.y+Math.sin(q)*30,2,2,color);}
      c.restore();
    }
    for(const plate of game.world.plates){
      if(plate.scene!==game.scene)continue;
      this.rect(plate.x-plate.w/2,plate.y-3,plate.w,3,'#8fd6c7');
      this.text('HOLD S · BE STILL',plate.x,plate.y-16,'#bfe8d6',6);
      if(game.plateCharge>0)this.rect(plate.x-plate.w/2,plate.y-6,plate.w*game.plateCharge/plate.charge,2,'#ffdda2');
    }
    const a=game.riftAnchor;
    if(a&&a.scene===game.scene){c.globalAlpha=.75;this.rect(a.x-8,a.y,28,3,'#acf5e3');this.diamond(a.x+6,a.y-9,5,'#acf5e3');this.text('V · '+Math.max(0,a.until-game.time).toFixed(1)+'s',a.x+6,a.y-20,'#caffec',6);c.globalAlpha=1;}
    for(const core of game.world.pickups.filter(p=>p.type==='core')){
      if(core.scene!==game.scene||game.progress.collected.includes(core.id)||core.x<cam.x-20||core.x>cam.x+660)continue;
      const y=core.y+Math.sin(t*2)*3;c.globalAlpha=activeIn(core.phase,game.timeline)?1:.25;
      c.strokeStyle='#c399ce';c.strokeRect(core.x-11,y-11,22,22);this.diamond(core.x,y,9,'#ddb290');this.diamond(core.x,y,4,'#ffedba');this.text('KEYSTONE',core.x,y-22,'#edccaa',6);c.globalAlpha=1;
    }
    const b=game.world.borrowed;
    if(game.scene==='house'){
      if(!b.dead){
        c.save();c.globalAlpha=b.hurt>0?.5:1;this.character('borrowed',b.x+4,b.y+48,t);c.restore();
        this.diamond(b.x+11,b.y+20,3,b.aura==='past'?'#ffd29d':'#c3a5ef');
        if(b.state==='windup'){this.text('COPIED '+b.copy.toUpperCase(),b.x+11,b.y-18,'#ffb4ba',8);
          if(b.copy==='dash'){c.strokeStyle='#eea0ae';c.beginPath();c.ellipse(b.targetX+11,399,24,5,0,0,Math.PI*2);c.stroke();}}
      }else{const l=game.world.loom;this.rect(l.x-12,l.y-30,24,30,'#69647e');this.rect(l.x-17,l.y-35,34,5,'#9d91a6');this.diamond(l.x,l.y-20,7,'#ffcfa2');this.text('E · MEMORY LOOM',l.x,l.y-48,'#f2d3b3',7);}
    }
    if(game.pursuer){
      c.save();c.globalAlpha=.72;this.character('borrowed',game.pursuer.x,game.pursuer.y+32,t);this.text('N A R A',game.pursuer.x+6,game.pursuer.y-25,'#e9b1bf',8);c.restore();
    }
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
    c.save();const shake=game.shake>0&&!game.reduceMotion?Math.sin(t*170)*2:0;c.translate(-Math.floor(cam.x)+shake,-Math.floor(cam.y));this.riftBackdrop(game);
    // Ghost geometry remains visible so timeline puzzles are readable.
    for(const s of game.world.platforms){
      if((s.scene||'overworld')!==game.scene||s.x+s.w<cam.x-10||s.x>cam.x+650)continue;
      if(!game.isSolidPlatform(s)){c.globalAlpha=.25;c.strokeStyle=s.phase==='past'?'#f5bd83':'#88cbea';c.lineWidth=1;c.strokeRect(Math.floor(s.x)+.5,s.y+.5,s.w-1,s.h-1);for(let x=s.x+4;x<s.x+s.w;x+=10)this.rect(x,s.y,4,1,s.phase==='past'?'#ffd498':'#afd8f3');c.globalAlpha=1;continue;}
      this.rect(s.x,s.y,s.w,s.h,palette.rock);this.rect(s.x,s.y,s.w,3,palette.edge);this.rect(s.x,s.y+3,s.w,3,game.timeline==='past'?'#50746b':'#526078');
      for(let y=s.y+8;y<Math.min(s.y+s.h,cam.y+360);y+=14){const row=Math.floor((y-s.y)/14);for(let x=s.x+row%2*8;x<s.x+s.w-2;x+=19){this.rect(x+2,y,Math.min(14,s.x+s.w-x-2),1,'#222e42');if(hash(x+y)>.5)this.rect(x+5,y+4,4,2,'#46536b');}}
      if(s.timed||s.crumble){for(let x=s.x+3;x<s.x+s.w-3;x+=9)this.rect(x,s.y+1,4,2,s.timed?'#edbd79':'#dca1a3');
        if(s.crumble&&game.crumbling[s.id]?.stress>0)this.rect(s.x,s.y-3,s.w*game.crumbling[s.id].stress/s.crumble,2,'#ff9d99');}
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
    for(const npc of game.world.npcs){if(npc.x<cam.x-35||npc.x>cam.x+675)continue;this.character(npc.id,npc.x,npc.y,t);this.text(npc.name,npc.x+6,npc.y-38,'#e9dac7',7);}
    for(const item of game.world.pickups){
      if(game.progress.collected.includes(item.id)||item.x<cam.x-20||item.x>cam.x+660)continue;
      const y=item.y+Math.sin(t*2.8+item.x)*2,visible=activeIn(item.phase,game.timeline);c.globalAlpha=visible?1:.23;
      if(item.type==='seal'){c.strokeStyle='#eab787';c.strokeRect(item.x-9,y-9,18,18);this.diamond(item.x,y,6,'#ffe1a1');this.diamond(item.x,y,3,'#fff4d0');}
      else if(item.type==='gear'){this.diamond(item.x,y,7,'#d9b37b');this.diamond(item.x,y,3,'#514052');}
      else if(item.type==='page'){this.rect(item.x-5,y-7,10,14,'#e9d6a4');for(let i=0;i<3;i++)this.rect(item.x-3,y-4+i*3,6,1,'#8b6a70');}
      else if(item.type==='lantern'){this.diamond(item.x,y,8,'#91eadf');this.diamond(item.x,y,4,'#ffdfaa');}
      else if(item.type==='secret'){this.rect(item.x-5,y-5,10,9,'#e8ce94');this.rect(item.x-7,y+4,14,2,'#ffe8b7');this.rect(item.x-1,y+7,2,2,'#ffe8b7');}
      else{this.diamond(item.x,y,3,'#cdf5b8');this.rect(item.x,y-1,1,2,'#ffffff');}
      c.globalAlpha=1;
    }
    for(const o of game.world.refills){c.globalAlpha=o.ready>0?.22:1;this.diamond(o.x,o.y+Math.sin(t*3)*3,6,'#8eefe4');this.diamond(o.x,o.y+Math.sin(t*3)*3,3,'#defdfa');c.globalAlpha=1;}
    for(const e of game.world.enemies){
      if(e.dead||e.x<cam.x-30||e.x>cam.x+670)continue;c.globalAlpha=activeIn(e.phase,game.timeline)?1:.2;
      const color=e.hurt>0?'#fbe7e8':e.type==='wisp'?'#bea7dc':'#aa7c9d';
      if(e.type==='sentinel'){this.rect(e.x+3,e.y,14,7,color);this.rect(e.x+1,e.y+7,18,15,'#505067');this.rect(e.x+4,e.y+5,10,2,'#f7bb97');this.rect(e.x+3,e.y+21,5,5,'#afa5ad');this.rect(e.x+13,e.y+21,5,5,'#afa5ad');const shieldX=e.dir>0?e.x+17:e.x-3;this.rect(shieldX,e.y+7,6,16,e.guardBroken>0?'#665266':'#cab896');this.rect(shieldX+2,e.y+10,2,9,'#775d76');if(e.stun>0)this.text('✦',e.x+10,e.y-12,'#a8f1e1',9);}
      else if(e.type==='husk'){this.rect(e.x+4,e.y,8,7,color);this.rect(e.x+2,e.y+5,12,13,'#554158');this.rect(e.x,e.y+8,3,15,color);this.rect(e.x+14,e.y+7,3,14,color);this.rect(e.x+3,e.y+18,3,7,color);this.rect(e.x+11,e.y+18,3,7,color);this.rect(e.x+6,e.y+2,4,2,'#ffd195');}
      else if(e.type==='watcher'){this.diamond(e.x+9,e.y+8,12,color);this.rect(e.x+2,e.y+5,14,7,'#20162f');this.rect(e.x+6,e.y+5,5,6,'#efc6a4');this.rect(e.x+8,e.y+6,2,4,'#20162f');}
      else if(e.type==='mimic'){this.rect(e.x,e.y+4,18,12,e.awake?'#633d59':'#a88861');this.rect(e.x+2,e.y+2,14,4,'#d0ab77');this.rect(e.x+7,e.y+7,4,3,e.awake?'#fa9fac':'#ffe4a4');if(e.awake){this.rect(e.x-4,e.y+11,5,4,'#b47799');this.rect(e.x+17,e.y+11,5,4,'#b47799');}}
      else if(e.type==='wisp'){this.diamond(e.x+9,e.y+7,9,color);this.rect(e.x+5,e.y+5,2,2,'#211a39');this.rect(e.x+12,e.y+5,2,2,'#211a39');this.rect(e.x+7,e.y+17,4,2,'#9b85c6');}
      else{this.rect(e.x+3,e.y+3,13,12,color);this.rect(e.x,e.y+8,18,6,color);this.rect(e.x+3,e.y+15,3,2,'#533e64');this.rect(e.x+13,e.y+15,3,2,'#533e64');this.rect(e.x+5,e.y+7,2,2,'#fff0d5');this.rect(e.x+12,e.y+7,2,2,'#fff0d5');}
      if(e.tell>0)this.text('!',e.x+9,e.y-12,'#ffc187',11);
      if(e.hp<e.maxHp){this.rect(e.x,e.y-5,18,2,'#372944');this.rect(e.x,e.y-5,18*e.hp/e.maxHp,2,'#eeacb7');}c.globalAlpha=1;
    }
    const b=game.world.boss;
    if(!b.dead){const color=b.hurt>0?'#ffffff':b.aura==='past'?'#cb9f86':'#9699c5';
      this.rect(b.x+6,b.y+5,16,24,'#364355');this.rect(b.x+2,b.y+12,24,15,color);this.rect(b.x+5,b.y+30,6,9,'#4d6075');this.rect(b.x+18,b.y+30,6,9,'#4d6075');
      this.rect(b.x+6,b.y-1,18,10,color);this.rect(b.x+9,b.y+3,12,3,'#243247');this.rect(b.x+11,b.y+4,3,1,'#c6ffec');this.rect(b.x+19,b.y+4,3,1,'#c6ffec');
      for(let i=0;i<3;i++)this.diamond(b.x+3+i*11,b.y-7+Math.sin(t*2+i)*2,3,b.aura==='past'?'#ffd59a':'#b5d4f8');
      if(b.tell>0){c.globalAlpha=.5;this.diamond(b.x+14,b.y-25,8,'#ffbb9a');c.globalAlpha=1;}
    }
    this.extras(game,menu);this.riftDetails(game);
    const gate=game.world.gate,unlocked=game.seals===3&&game.progress.bossDefeated&&game.progress.anchors.length===3;
    this.rect(gate.x-27,gate.y-75,10,75,'#5c6680');this.rect(gate.x+17,gate.y-75,10,75,'#5c6680');this.rect(gate.x-27,gate.y-78,54,11,'#8690a5');
    c.globalAlpha=unlocked?.65:.16;this.rect(gate.x-16,gate.y-65,33,65,unlocked?'#99eddf':'#8690be');c.globalAlpha=1;
    for(let i=0;i<3;i++)this.diamond(gate.x-15+i*15,gate.y-87,3,i<game.seals?'#ffe1a2':'#536079');
    for(const o of game.projectiles){c.globalAlpha=activeIn(o.phase,game.timeline)?1:.2;this.diamond(o.x,o.y,o.r+2,o.team==='player'?'#a8fff2':o.phase==='past'?'#ffbb94':'#c5b2ff');this.diamond(o.x,o.y,o.r/2,'#fff0e0');c.globalAlpha=1;}
    for(const tr of game.trails)this.hero(tr.x,tr.y,tr.facing,t,false,0,true,tr.life*.7);
    const player=game.player;if(!player.dead&&player.wardTime>0){c.strokeStyle='#c9fff0';c.lineWidth=2;c.beginPath();c.arc(player.x+6,player.y+11,27,0,Math.PI*2);c.stroke();}
    if(game.progress.ending==='search')this.diamond(player.x-18,player.y+3+Math.sin(t*2)*3,4,'#b2dcff');
    if(!player.dead&&!(player.invincible>0&&Math.floor(t*15)%2))this.hero(player.x,player.y,player.facing,t,(Math.abs(player.vx)>25&&player.grounded)||player.climbing,player.attack,player.dashReady);
    for(const o of game.particles){c.globalAlpha=Math.min(1,o.life/.3);this.rect(o.x,o.y,o.size,o.size,o.color);}c.globalAlpha=1;
    for(const o of game.floats){c.globalAlpha=Math.min(1,o.life/.3);this.text(o.text,o.x,o.y,o.color,8);}c.globalAlpha=1;
    if(!menu){
      if(player.x<340)this.text('A / D MOVE   W JUMP   E TALK',350,326,'#d8e1dc',8);
      if(player.x>460&&player.x<750)this.text('Q · REVEAL BEFORE',741,315,'#efd6b9',8);
      if(player.x>1250&&player.x<1800)this.text('X · DASH    Q · CHANGE TIMELINES',1640,248,'#e6d6dc',7);
      if(player.x>2110&&player.x<2530)this.text('HOLD W + A / D INTO A WALL TO CLIMB',2350,208,'#dadde1',7);
    }
    c.restore();
    // Slow drifting motes, independent of world geometry.
    for(let i=0;i<26;i++){const x=(hash(i+120)*640+t*(3+hash(i)*4))%640,y=hash(i+90)*360+Math.sin(t+i)*5;c.globalAlpha=.2+hash(i)*.4;this.rect(x,y,1,1,palette.accent);}c.globalAlpha=1;
    const vignette=c.createRadialGradient(320,150,90,320,170,370);vignette.addColorStop(0,'#090d1600');vignette.addColorStop(1,'#090d168a');c.fillStyle=vignette;c.fillRect(0,0,640,360);
    if(game.timeline==='present'&&!game.reduceMotion){c.globalAlpha=.035;for(let i=0;i<3;i++)this.rect(0,80+i*93+Math.sin(t*.7+i)*14,640,3,'#d599b8');c.globalAlpha=1;}
    if(game.timeline==='present'&&game.dread>.3){const fog=c.createRadialGradient(320,170,95,320,170,355);fog.addColorStop(0,'#11071a00');fog.addColorStop(1,'#160716b5');c.globalAlpha=game.dread*.55;c.fillStyle=fog;c.fillRect(0,0,640,360);c.globalAlpha=1;}
    if(game.riftFlash>0){c.globalAlpha=game.riftFlash*.18;this.rect(0,0,640,360,game.timeline==='past'?'#ffe8c9':'#c4dcff');c.globalAlpha=1;}
    if(game.flash>0){c.globalAlpha=game.flash*.6;this.rect(0,0,640,360,'#ff7796');c.globalAlpha=1;}
  }
}
