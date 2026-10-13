import { Game, xpRequired } from './engine.js';
import { Renderer } from './render.js';
import { SAVE_KEY, SKILLS, ZONES } from './world.js';

const $=id=>document.getElementById(id);
let saved=null;
try{saved=JSON.parse(localStorage.getItem(SAVE_KEY)||'null');}catch{}
let game=new Game(saved),renderer=new Renderer($('game')),mode='menu',returnMode='play';
let input={},keys=new Set(),touches=new Map(),last=0,accumulator=0,saveClock=0,toastTimer,zoneTimer;
let soundOn=true;try{soundOn=localStorage.getItem('riftbound.sound')!=='off';}catch{}
let audio=null,musicClock=0,musicStep=0;
const melody=[293.66,440,587.33,349.23,440,523.25,261.63,392,523.25,329.63,440,659.25];
function ensureAudio(){try{if(!audio)audio=new(window.AudioContext||window.webkitAudioContext)();if(audio.state==='suspended')audio.resume();}catch{soundOn=false;}}
function tone(hz,duration=.14,volume=.025,type='sine',delay=0){
  if(!soundOn||!audio||audio.state!=='running')return;
  const osc=audio.createOscillator(),gain=audio.createGain(),start=audio.currentTime+delay;
  osc.type=type;osc.frequency.setValueAtTime(hz,start);gain.gain.setValueAtTime(.001,start);
  gain.gain.exponentialRampToValueAtTime(volume,start+.015);gain.gain.exponentialRampToValueAtTime(.001,start+duration);
  osc.connect(gain);gain.connect(audio.destination);osc.start(start);osc.stop(start+duration+.03);
}
function toast(text){$('toast').textContent=text;$('toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').hidden=true,3200);}
function save(){
  if(!game.started)return;
  try{localStorage.setItem(SAVE_KEY,JSON.stringify(game.progress));saved=game.progress;$('save-status').textContent='◇ Saved on this device';}
  catch{$('save-status').textContent='Saving unavailable in this browser';}
}
function clearInput(){keys.clear();touches.clear();input={};game.previous={};}
function refreshMenu(){
  $('continue').hidden=!saved;$('continue-level').textContent=`LV ${game.progress.level}`;
  $('start').firstChild.textContent=saved?'New journey ':'Begin journey ';
  $('start').classList.toggle('primary',!saved);$('continue').classList.toggle('primary',!!saved);
}
function begin(fresh=false){
  game=new Game(fresh?null:saved);game.started=true;mode='play';$('menu').hidden=true;$('panel').hidden=true;
  $('hud').hidden=false;$('objective').hidden=false;$('mobile-controls').hidden=!matchMedia('(pointer: coarse)').matches;
  clearInput();ensureAudio();$('game').focus();save();zoneBanner(ZONES.find(z=>z.name===game.zone)||ZONES[0]);
}
function panel(kind){
  returnMode=mode==='menu'?'menu':'play';mode=kind;clearInput();$('panel').hidden=false;
  let title='',eyebrow='',content='';
  if(kind==='pause'){
    title='Take a moment.';eyebrow='JOURNEY PAUSED';
    content=`<p>Level ${game.progress.level} · ${game.seals}/3 Echo seals · ${Math.floor(game.progress.played/60)} minutes explored</p><div class="panel-actions"><button data-action="skills">Character upgrades</button><button data-action="help">Controls</button><button data-action="menu">Main menu</button></div>`;save();
  }else if(kind==='skills'){
    title='Make the journey your own.';eyebrow=`LEVEL ${game.progress.level} · ${game.progress.skillPoints} SKILL POINT${game.progress.skillPoints===1?'':'S'}`;
    content=`<p>Level up through exploration and combat. Each level grants one point and restores your health.</p><div class="skill-list">${SKILLS.map(s=>`<article class="skill-card"><span>${s.id==='vitality'?'♡':s.id==='edge'?'⚔':'➶'}</span><h3>${s.name}</h3><small>RANK ${game.progress.skills[s.id]} / ${s.max}</small><p>${s.detail}</p><button data-buy="${s.id}" ${game.progress.skillPoints===0||game.progress.skills[s.id]>=s.max?'disabled':''}>${game.progress.skills[s.id]>=s.max?'Mastered':'Upgrade · 1 point'}</button></article>`).join('')}</div>`;
  }else if(kind==='help'){
    title='Learn the crossing.';eyebrow='MOVEMENT & ABILITIES';
    content='<div class="instructions"><div><kbd>A D / ← →</kbd> Move</div><div><kbd>SPACE / C</kbd> Jump</div><div><kbd>X / SHIFT</kbd> Dash</div><div><kbd>Q</kbd> Shift timeline</div><div><kbd>J / Z</kbd> Sword strike</div><div><kbd>E</kbd> Talk to Maelin</div><div><kbd>TAB / U</kbd> Upgrades</div><div><kbd>R</kbd> Return to checkpoint</div></div><p>Hold jump to go higher. Jump against a wall to climb. Hold a direction—including W / ↑ for upward—while dashing. Land or touch a cyan crystal to restore your dash.</p><p>Gold outlines belong to the past. Blue outlines belong to the present. Shift mid-jump to chain platforms. Collect three Echo seals, defeat the Warden, and reach the gate.</p>';
  }else if(kind==='dialogue'){
    title='“You can still reach it.”';eyebrow='MAELIN · KEEPER OF THE CROSSING';
    content='<p>The bridge fell long before you arrived. But the rift has a longer memory than we do.</p><p>Press <kbd>Q</kbd> and find it as it was. Beyond the canyon, recover the three Echo seals. The Warden guards the way out—its own timeline strengthens its armor. Strike from the other.</p><p>Those glowing stone markers? Rest beside them. They remember your journey.</p>';
  }else if(kind==='replace'){
    title='Begin a new journey?';eyebrow='A FRESH START';
    content='<p>This replaces your saved journey on this device.</p><button data-action="new" class="primary">Yes, begin again →</button>';
  }else if(kind==='complete'){
    title='The crossing is yours.';eyebrow='PROLOGUE COMPLETE';
    content=`<p>You recovered every Echo seal and defeated the Rift Warden.</p><p>LEVEL ${game.progress.level} · ${game.progress.deaths} falls · ${Math.floor(game.progress.played/60)} minutes</p><p>You can keep exploring, find the hidden bell, and spend your remaining upgrade points.</p><div class="panel-actions"><button data-action="skills">Character upgrades</button><button data-action="menu">Main menu</button></div>`;
  }
  $('panel-title').textContent=title;$('panel-eyebrow').textContent=eyebrow;$('panel-content').innerHTML=content;
  $('panel-close').firstChild.textContent=returnMode==='menu'?'Back to title ':'Return to journey ';
  $('panel-close').focus();
}
function closePanel(){mode=returnMode;$('panel').hidden=true;clearInput();if(mode==='play')$('game').focus();}
function mainMenu(){save();mode='menu';$('panel').hidden=true;$('menu').hidden=false;$('hud').hidden=true;$('objective').hidden=true;$('boss-hud').hidden=true;$('mobile-controls').hidden=true;clearInput();refreshMenu();}
function zoneBanner(zone){$('zone-name').textContent=zone.name;$('zone-subtitle').textContent=zone.subtitle;$('zone-banner').hidden=true;void $('zone-banner').offsetWidth;$('zone-banner').hidden=false;clearTimeout(zoneTimer);zoneTimer=setTimeout(()=>$('zone-banner').hidden=true,3500);}
function handleEvents(){
  for(const e of game.drainEvents()){
    if(e.type==='save')save();
    else if(e.type==='toast')toast(e.text);
    else if(e.type==='level'){toast(`Level ${e.level} · +1 skill point. Press TAB to upgrade.`);tone(523,.25,.03);tone(659,.25,.03,'sine',.12);tone(784,.4,.03,'sine',.24);}
    else if(e.type==='collect'){tone(e.kind==='mote'?880:660,.18,.02);if(e.kind==='seal')toast(`${e.name} recovered · ${game.seals}/3 seals`);if(e.kind==='secret')toast('Secret found · The Silent Bell');}
    else if(e.type==='rift')tone(e.timeline==='past'?330:440,.4,.02,'triangle');
    else if(e.type==='dash')tone(180,.12,.025,'triangle');
    else if(e.type==='jump')tone(390,.08,.012,'triangle');
    else if(e.type==='swing')tone(240,.07,.015,'triangle');
    else if(e.type==='hit')tone(110,.09,.03,'triangle');
    else if(e.type==='hurt'||e.type==='death')tone(70,.18,.03,'triangle');
    else if(e.type==='refill')tone(1000,.2,.017);
    else if(e.type==='checkpoint'){toast('Checkpoint reached · Health restored');tone(587,.28,.02);}
    else if(e.type==='zone')zoneBanner(e);
    else if(e.type==='dialogue')panel('dialogue');
    else if(e.type==='boss')toast('The Rift Warden · Shift away from its aura to strike harder.');
    else if(e.type==='bossDefeated')toast('Warden defeated · The gate awaits your three Echo seals.');
    else if(e.type==='upgrade'){toast(`${e.name} upgraded`);tone(740,.25,.02);}
    else if(e.type==='complete')panel('complete');
  }
}
const keyMap={ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right',ArrowUp:'up',KeyW:'up',ArrowDown:'down',KeyS:'down',Space:'jump',KeyC:'jump',KeyX:'dash',ShiftLeft:'dash',ShiftRight:'dash',KeyQ:'rift',KeyJ:'attack',KeyZ:'attack',KeyE:'interact'};
function rebuildInput(){input={};for(const code of keys)if(keyMap[code])input[keyMap[code]]=true;for(const action of touches.values())input[action]=true;}
window.addEventListener('keydown',e=>{
  if(e.ctrlKey||e.metaKey||e.altKey)return;
  if(e.code==='Escape'){e.preventDefault();if(mode==='play')panel('pause');else if(mode!=='menu')closePanel();return;}
  if(mode!=='play')return;
  if(e.code==='Tab'||e.code==='KeyU'){e.preventDefault();if(!e.repeat)panel('skills');return;}
  if(e.code==='KeyR'){e.preventDefault();if(!e.repeat)game.respawn(false);return;}
  if(e.code==='KeyM'){if(!e.repeat)toggleSound();return;}
  if(keyMap[e.code]){e.preventDefault();keys.add(e.code);rebuildInput();}
});
window.addEventListener('keyup',e=>{keys.delete(e.code);rebuildInput();});
window.addEventListener('blur',()=>{if(mode==='play')panel('pause');clearInput();});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&mode==='play')panel('pause');});
window.addEventListener('pagehide',save);
$('start').onclick=()=>saved?panel('replace'):begin(true);
$('continue').onclick=()=>begin(false);$('help').onclick=()=>panel('help');$('panel-close').onclick=closePanel;
$('pause-button').onclick=()=>panel('pause');$('skills-button').onclick=()=>panel('skills');
$('timeline-button').onclick=()=>{if(mode==='play'){game.shift();handleEvents();$('game').focus();}};
$('panel-content').addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b)return;
  if(b.dataset.buy){if(game.buySkill(b.dataset.buy)){panel('skills');handleEvents();}return;}
  const action=b.dataset.action;if(action==='menu')mainMenu();else if(action==='new')begin(true);else if(action){panel(action);returnMode='play';}
});
function toggleSound(){soundOn=!soundOn;ensureAudio();try{localStorage.setItem('riftbound.sound',soundOn?'on':'off');}catch{}$('sound').innerHTML=`${soundOn?'♫':'♪'} <span>Sound ${soundOn?'on':'off'}</span>`;$('sound').setAttribute('aria-pressed',String(soundOn));}
$('sound').onclick=toggleSound;$('sound').innerHTML=`${soundOn?'♫':'♪'} <span>Sound ${soundOn?'on':'off'}</span>`;
$('fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await $('game-frame').requestFullscreen();}catch{toast('Fullscreen is unavailable in this browser.');}};
for(const button of document.querySelectorAll('[data-input]')){
  button.addEventListener('pointerdown',e=>{if(mode!=='play')return;e.preventDefault();button.setPointerCapture(e.pointerId);touches.set(e.pointerId,button.dataset.input);rebuildInput();});
  for(const event of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(event,e=>{touches.delete(e.pointerId);rebuildInput();});
}
let hudCounter=0;
function updateHUD(){
  const p=game.player,g=game.progress;$('level').textContent=String(g.level).padStart(2,'0');
  $('health-value').textContent=`${Math.ceil(p.hp)} / ${game.maxHealth}`;$('health-bar').style.width=`${p.hp/game.maxHealth*100}%`;
  $('xp-bar').style.width=`${g.xp/xpRequired(g.level)*100}%`;$('xp-label').textContent=`${g.xp} / ${xpRequired(g.level)} XP`;
  $('timeline-label').textContent=game.timeline==='past'?'THE PAST':'THE PRESENT';$('timeline-dot').style.background=game.timeline==='past'?'#ffd297':'#a6d8f6';
  $('dash-state').textContent=p.dashReady?'DASH READY':'LAND TO RECHARGE';$('seal-count').textContent=`◇ ${game.seals} / 3`;
  $('points-count').textContent=g.skillPoints?`+${g.skillPoints}`:'';
  $('objective-text').textContent=g.completed?'Crossing restored · Explore the remaining secrets':game.seals<3?'Recover the three Echo seals':g.bossDefeated?'Enter the restored gate':'Defeat the Rift Warden';
  const b=game.world.boss;$('boss-hud').hidden=!(mode==='play'&&b.active&&!b.dead);$('boss-bar').style.width=`Math.max(0,b.hp)/b.maxHp*100}%`;
}
function frame(now){
  const elapsed=last?Math.min((now-last)/1000,.05):0;last=now;accumulator+=elapsed;
  while(accumulator>=1/120){
    if(mode==='play'){game.step(1/120,input);handleEvents();saveClock+=1/120;if(saveClock>=3){save();saveClock=0;}
      musicClock+=1/120;if(musicClock>.7){musicClock=0;tone(melody[musicStep%melody.length],.9,.008);if(musicStep%4===0)tone(melody[musicStep%melody.length]/4,2.4,.014,'triangle');musicStep++;}}
    else if(mode==='menu')game.time+=1/120;
    accumulator-=1/120;
  }
  renderer.draw(game,mode==='menu');if(++hudCounter%6===0)updateHUD();requestAnimationFrame(frame);
}
refreshMenu();updateHUD();requestAnimationFrame(frame);
