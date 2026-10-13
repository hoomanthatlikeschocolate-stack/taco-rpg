import { Game, xpRequired } from './engine.js';
import { Renderer } from './render.js';
import { GameAudio } from './music.js';
import { SAVE_KEY, SKILLS, POWERS, CHECKPOINTS, ARCHIVE_PAGES, ALL_LORE as LORE, RIFT_CORES, zoneAt } from './world.js';
import { objectiveFor, questRows, dialogueFor } from './story.js';
const $=id=>document.getElementById(id);
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
const setting=(key,fallback)=>{try{return localStorage.getItem(key)??fallback;}catch{return fallback;}};
let saved=null;try{saved=JSON.parse(localStorage.getItem(SAVE_KEY)||'null');if(![1,2,3].includes(saved?.version))saved=null;}catch{}
let game=new Game(saved),renderer=new Renderer($('game')),mode='menu',returnMode='play';
let input={},keys=new Set(),touches=new Map(),last=0,accumulator=0,saveClock=0,toastTimer,zoneTimer,hudCounter=0,whisperTimer;
let journalTab='quests',dialogue=null,dialogueIndex=0,reduceMotion=setting('riftbound.motion','on')==='off';
let soundOn=setting('riftbound.sound','on')!=='off';
const score=new GameAudio(soundOn,Number(setting('riftbound.volume','.65')));
game.reduceMotion=reduceMotion;
function storeSetting(key,value){try{localStorage.setItem(key,String(value));}catch{}}
function toast(text){$('toast').textContent=text;$('toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').hidden=true,4200);}
function save(){if(!game.started)return;try{localStorage.setItem(SAVE_KEY,JSON.stringify(game.progress));saved=game.progress;$('save-status').textContent='◇ Journey saved';}catch{$('save-status').textContent='Saving unavailable';}}
function clearInput(){keys.clear();touches.clear();input={};game.previous={};}
function refreshMenu(){ $('continue').hidden=!saved;$('continue-level').textContent='LV '+game.progress.level;
  $('start').firstChild.textContent=saved?'New journey ':'Begin journey ';$('start').classList.toggle('primary',!saved);$('continue').classList.toggle('primary',!!saved);}
function begin(fresh=false){
  game=new Game(fresh?null:saved);game.started=true;game.reduceMotion=reduceMotion;mode='play';
  $('menu').hidden=true;$('panel').hidden=true;$('hud').hidden=false;$('objective').hidden=false;
  $('mobile-controls').hidden=!matchMedia('(pointer: coarse)').matches;clearInput();score.ensure();$('game').focus();save();zoneBanner(zoneAt(game.player.x));
  if(fresh)toast('You are Nara. Find Maelin’s lantern and press E. W jumps; hold W against a wall to climb.');
}
function shellPanel(title,eyebrow,content,kind){
  if(mode==='menu')returnMode='menu';else returnMode='play';mode=kind;clearInput();$('panel').hidden=false;
  $('panel-title').textContent=title;$('panel-eyebrow').textContent=eyebrow;$('panel-content').innerHTML=content;
  $('panel-close').firstChild.textContent=returnMode==='menu'?'Back to title ':'Return to journey ';$('panel-close').focus();
}
function panel(kind,event={}){
  const p=game.progress;
  if(kind==='pause')shellPanel('A light worth keeping.','JOURNEY PAUSED',
    '<p>Nara · Level '+p.level+' · '+Math.floor(p.played/60)+' minutes · '+p.deaths+' falls</p><div class="panel-actions"><button data-action="journal">Quest journal</button><button data-action="skills">Upgrades</button><button data-action="help">Controls</button></div><div class="audio-settings"><label>Music & effects <input id="volume-control" type="range" min="0" max="1" step=".05" value="'+score.volume+'"></label><label><input id="motion-control" type="checkbox" '+(reduceMotion?'checked':'')+'> Reduce screen movement</label></div><button data-action="menu">Return to title</button>',kind);
  else if(kind==='skills')shellPanel('Give the dark something to fear.','LEVEL '+p.level+' · '+p.skillPoints+' SKILL POINTS',
    '<p>Exploration, quests and combat grant XP. Every level gives one skill point and restores health and focus.</p><div class="skill-list">'+SKILLS.map(s=>'<article class="skill-card"><span>'+s.symbol+'</span><h3>'+s.name+'</h3><small>RANK '+p.skills[s.id]+' / '+s.max+'</small><p>'+s.detail+'</p><button data-buy="'+s.id+'" '+(!p.skillPoints||p.skills[s.id]>=s.max?'disabled':'')+'>'+(p.skills[s.id]>=s.max?'Mastered':'Upgrade · 1 point')+'</button></article>').join('')+'</div><div class="power-summary">'+POWERS.map(s=>'<span class="'+(game.hasPower(s.id)?'unlocked':'locked')+'">'+(game.hasPower(s.id)?'✦':'◇')+' '+s.name+'</span>').join('')+'</div>',kind);
  else if(kind==='help')shellPanel('Keep moving. Keep remembering.','CONTROLS & THE TWO REALMS',
    '<div class="instructions"><div><kbd>A D / ← →</kbd> Move</div><div><kbd>W / ↑</kbd> Jump</div><div><kbd>Hold W + A/D</kbd> Climb a wall</div><div><kbd>X / SHIFT</kbd> Aim and dash</div><div><kbd>Q</kbd> Before ↔ Hollow</div><div><kbd>J / Z</kbd> Hold for sword combo</div><div><kbd>K</kbd> Rift Bolt</div><div><kbd>L</kbd> Ward Pulse</div><div><kbd>E</kbd> Talk, read, enter rifts</div><div><kbd>S</kbd> Quiet walk / silence plates</div><div><kbd>V</kbd> Place / recall rift anchor</div><div><kbd>F</kbd> Quest journal / travel</div><div><kbd>U / TAB</kbd> Upgrades</div><div><kbd>R</kbd> Return to checkpoint</div></div><p>Hold W for a high jump. For easy climbing, hold W while pressing A or D into the wall. Nara climbs continuously and pulls herself over the edge. Release and press W again to wall jump.</p><p>After restoring the first lantern, press W a second time in the air to double jump. Aim dashes with WASD. Landing, wall jumps and cyan crystals restore your movement powers.</p><p>Gold platforms are solid in Before; violet platforms are solid in the Hollow. Follow the gold quest marker and the directions at the bottom of the screen. F lists every quest, power, recovered memory and unlocked travel point.</p><p>Lettered apertures carry your dash and can change realms. Release W to aim a horizontal dash. E enters a numbered rift door. In the Clockwell, K freezes ledges for six seconds. In the Choir, hold S on the quiet stone; its fast portal route makes noise.</p><p>Striped ledges crumble if you wait. Sentinels block frontal sword hits: flank them or use a charged third strike, which costs 12 focus. Bolts stun enemies. A fresh Ward reflects incoming shots. V places a six-second foothold for 30 focus; recalling costs 10.</p><p>The Hollow listens. S hides your steps. Before, restored lanterns and checkpoints make it lose you; Ward banishes a pursuer.</p><p>The Hollow has charging husks, projectile watchers and false treasure mimics. The Warden telegraphs his next attack. Ward blocks damage and clears nearby enemy bolts. Focus recovers over time.</p>',kind);
  else if(kind==='replace')shellPanel('Begin a new journey?','A FRESH START','<p>This replaces the journey saved on this device.</p><button data-action="new" class="primary">Begin again →</button>',kind);
  else if(kind==='complete')shellPanel('The crossing is only the beginning.','CHAPTER I · RESTORED',
    '<p>Lumen is free. The three lanterns are burning again.</p><p>Ivo’s voice is coming from the Drowned Archive beyond the gate. Find his three torn pages, open the floodgate with Rift Bolt, and reach the last room.</p><p>Your side quests remain in the journal. You can travel back to any checkpoint you have reached.</p><button data-action="journal">Open quest journal</button>',kind);
  else if(kind==='power'){
    if(event.ending){showDialogue({id:'ending'});return;}
    const memory=dialogueFor({id:event.anchor},game);
    shellPanel(event.name,'A NEW POWER AWAKENS','<div class="power-unlock">✦</div><p class="power-detail">'+escape(event.detail)+'</p><p>'+escape(memory.lines[1]?.text||'Your lantern remembers another way forward.')+'</p><p>Use U to strengthen your abilities. F keeps the next quest marked.</p>',kind);
  }else if(kind==='journal')renderJournal();
  if(kind==='pause')save();
}
function renderJournal(){
  const p=game.progress,o=objectiveFor(p,game.scene);
  let body='';
  if(journalTab==='quests')body='<div class="current-quest"><small>'+escape(o.badge)+'</small><h3>'+escape(o.title)+'</h3><p>'+escape(o.hint)+'</p></div><div class="quest-list">'+questRows(p).map(q=>'<article class="'+(q.done?'done':'')+'"><strong>'+(q.done?'✓ ':'◇ ')+escape(q.name)+'</strong><p>'+escape(q.detail)+'</p></article>').join('')+'</div>';
  if(journalTab==='lore')body='<p>Recovered words stay with you. Read marked stones with E; collect Ivo’s pages in both realms.</p><div class="lore-list">'+LORE.map(l=>p.lore.includes(l.id)?'<button data-read="'+l.id+'">✧ '+escape(l.name)+'</button>':'<span class="locked">◇ Unread inscription</span>').join('')+ARCHIVE_PAGES.map((id,i)=>p.collected.includes(id)?'<button data-read="'+id+'">▤ Ivo’s page '+(i+1)+'</button>':'<span class="locked">◇ Missing Archive page</span>').join('')+'</div>';
  if(journalTab==='travel')body='<div class="world-map"><div><small>CHAPTER I</small><strong>The Broken Crossing</strong><span>Three lanterns · Lumen’s oath · the lost names</span></div><div class="'+(p.completed?'':'locked')+'"><small>CHAPTER II</small><strong>The Drowned Archive</strong><span>'+(p.completed?'Three pages · the floodgate · Ivo’s last room':'Restore the Crossing to enter')+'</span></div><div class="rift-map-card"><small>CHAPTER III</small><strong>The Unwritten House</strong><span>Rift I · Fold / Rift II · Clock / Rift III · Choir / Rift IV · House</span></div></div><p>Travel restores health and focus. New checkpoints become available as you reach them. Fast travel is disabled during boss fights.</p><div class="travel-grid">'+CHECKPOINTS.map(cp=>'<button data-travel="'+cp.id+'" '+(!p.visited.includes(cp.id)?'disabled':'')+'>'+(p.visited.includes(cp.id)?'◇ ':'· ')+escape(cp.label)+'</button>').join('')+'</div>';
  if(journalTab==='lore')body+='<div class="lore-list">'+RIFT_CORES.map(c=>p.collected.includes(c.id)?'<button data-read="'+c.id+'">◇ '+escape(c.name)+'</button>':'<span class="locked">◇ Unrecovered keystone memory</span>').join('')+'</div>';
  if(journalTab==='powers')body='<div class="quest-list">'+POWERS.map(s=>'<article class="'+(game.hasPower(s.id)?'done':'')+'"><strong>'+(game.hasPower(s.id)?'✦ ':'◇ ')+s.name+' <kbd>'+s.key+'</kbd></strong><p>'+s.detail+'</p></article>').join('')+'</div>';
  const tabs='<nav class="journal-tabs" aria-label="Journal sections">'+['quests','lore','travel','powers'].map(t=>'<button data-journal="'+t+'" aria-pressed="'+(t===journalTab)+'">'+t[0].toUpperCase()+t.slice(1)+'</button>').join('')+'</nav>';
  shellPanel('The names we keep.','NARA’S JOURNAL',tabs+body,'journal');
}
function showDialogue(event){dialogue=dialogueFor(event,game);dialogueIndex=0;renderDialogue();}
function renderDialogue(){
  const row=dialogue.lines[dialogueIndex],lastLine=dialogueIndex===dialogue.lines.length-1;
  const actions=lastLine&&dialogue.choices?'<div class="story-choices">'+dialogue.choices.map(c=>'<button data-ending="'+c.id+'">'+escape(c.label)+' →</button>').join('')+'</div>':'<button data-next class="dialogue-next">'+(lastLine?'Continue journey →':'Next · E →')+'</button>';
  shellPanel(row.speaker,dialogue.role,'<div class="dialogue-layout"><canvas id="portrait" aria-hidden="true"></canvas><p class="dialogue-line">'+escape(row.text)+'</p></div><div class="dialogue-progress">'+(dialogueIndex+1)+' / '+dialogue.lines.length+'</div>'+actions,'dialogue');
  renderer.portrait($('portrait'),row.speaker);
}
function nextDialogue(){if(dialogueIndex<dialogue.lines.length-1){dialogueIndex++;renderDialogue();}else if(!dialogue.choices)closePanel();}
function closePanel(){mode=returnMode;$('panel').hidden=true;clearInput();if(mode==='play')$('game').focus();}
function mainMenu(){save();mode='menu';$('panel').hidden=true;$('menu').hidden=false;$('hud').hidden=true;$('objective').hidden=true;$('boss-hud').hidden=true;$('interaction').hidden=true;$('trial-hud').hidden=true;$('dread-hud').hidden=true;$('rift-status').hidden=true;$('whisper').hidden=true;$('mobile-controls').hidden=true;clearInput();refreshMenu();}
function zoneBanner(zone){$('zone-name').textContent=zone.name;$('zone-subtitle').textContent=zone.subtitle;$('zone-banner').hidden=true;void $('zone-banner').offsetWidth;$('zone-banner').hidden=false;clearTimeout(zoneTimer);zoneTimer=setTimeout(()=>$('zone-banner').hidden=true,3500);}
function handleEvents(){
  for(const e of game.drainEvents()){
    score.effect(e.type);
    if(e.type==='save')save();
    else if(e.type==='toast')toast(e.text);
    else if(e.type==='level')toast('LEVEL '+e.level+' · +1 skill point · U opens upgrades');
    else if(e.type==='collect')toast(e.name?(e.name+' recovered'+(e.kind==='seal'?' · Bring it to its lantern':e.kind==='page'?' · Added to journal [F]':'')):'+12 XP');
    else if(e.type==='checkpoint')toast(e.name+' · Health and focus restored · Fast travel unlocked [F]');
    else if(e.type==='zone')zoneBanner(e);
    else if(e.type==='dialogue')showDialogue(e);
    else if(e.type==='power')panel('power',e);
    else if(e.type==='core')showDialogue({id:e.id});
    else if(e.type==='borrowed')toast('THE BORROWED · It copies your last action. Bait it, then change tactics.');
    else if(e.type==='borrowedDefeated')showDialogue({id:'borrowed-fallen'});
    else if(e.type==='whisper'){ $('whisper').textContent=e.text;$('whisper').hidden=false;clearTimeout(whisperTimer);whisperTimer=setTimeout(()=>$('whisper').hidden=true,5000); }
    else if(e.type==='boss')toast('Lumen, the Rift Warden · Q away from his aura. Watch the attack warning.');
    else if(e.type==='bossDefeated')showDialogue({id:'warden-freed'});
    else if(e.type==='quest')toast('QUEST COMPLETE · '+e.name+' · '+e.reward);
    else if(e.type==='upgrade')toast(e.name+' upgraded');
    else if(e.type==='complete')panel('complete');
  }
}
const keyMap={ArrowLeft:['left'],KeyA:['left'],ArrowRight:['right'],KeyD:['right'],ArrowUp:['up','jump'],KeyW:['up','jump'],ArrowDown:['down'],KeyS:['down'],KeyC:['jump'],KeyX:['dash'],ShiftLeft:['dash'],ShiftRight:['dash'],KeyQ:['rift'],KeyJ:['attack'],KeyZ:['attack'],KeyK:['bolt'],KeyL:['ward'],KeyV:['anchor'],KeyE:['interact']};
function rebuildInput(){input={};for(const code of keys)for(const action of keyMap[code]||[])input[action]=true;for(const action of touches.values()){input[action]=true;if(action==='jump')input.up=true;}}
window.addEventListener('keydown',e=>{
  if(e.ctrlKey||e.metaKey||e.altKey)return;
  if(mode==='dialogue'&&(e.code==='KeyE'||e.code==='Enter')){e.preventDefault();if(!e.repeat)nextDialogue();return;}
  if(e.code==='Escape'){e.preventDefault();if(mode==='play')panel('pause');else if(mode!=='menu')closePanel();return;}
  if(e.code==='KeyM'&&!e.repeat){toggleSound();return;}
  if(mode!=='play')return;
  if(e.code==='Tab'||e.code==='KeyU'){e.preventDefault();if(!e.repeat)panel('skills');return;}
  if(e.code==='KeyF'){e.preventDefault();if(!e.repeat)panel('journal');return;}
  if(e.code==='KeyR'){e.preventDefault();if(!e.repeat){game.respawn(false);handleEvents();}return;}
  if(e.code==='Space'){e.preventDefault();return;}
  if(keyMap[e.code]){e.preventDefault();keys.add(e.code);rebuildInput();}
});
window.addEventListener('keyup',e=>{keys.delete(e.code);rebuildInput();});
window.addEventListener('blur',()=>{if(mode==='play')panel('pause');clearInput();});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&mode==='play')panel('pause');});
window.addEventListener('pagehide',save);
$('start').onclick=()=>saved?panel('replace'):begin(true);$('continue').onclick=()=>begin(false);$('help').onclick=()=>panel('help');$('panel-close').onclick=closePanel;
$('pause-button').onclick=()=>panel('pause');$('skills-button').onclick=()=>panel('skills');$('journal-button').onclick=()=>panel('journal');
$('timeline-button').onclick=()=>{if(mode==='play'){game.shift();handleEvents();$('game').focus();}};
$('panel-content').addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b)return;
  if(b.hasAttribute('data-next')){nextDialogue();return;}
  if(b.dataset.buy){if(game.buySkill(b.dataset.buy)){panel('skills');handleEvents();}return;}
  if(b.dataset.journal){journalTab=b.dataset.journal;renderJournal();return;}
  if(b.dataset.read){showDialogue({id:b.dataset.read});return;}
  if(b.dataset.travel){if(game.travel(b.dataset.travel)){closePanel();handleEvents();}else handleEvents();return;}
  if(b.dataset.ending){if(dialogue?.scope==='rift'?game.finishRiftStory(b.dataset.ending):game.chooseEnding(b.dataset.ending)){handleEvents();}return;}
  const action=b.dataset.action;if(action==='menu')mainMenu();else if(action==='new')begin(true);else if(action)panel(action);
});
$('panel-content').addEventListener('input',e=>{
  if(e.target.id==='volume-control'){score.setVolume(e.target.value);storeSetting('riftbound.volume',score.volume);}
  if(e.target.id==='motion-control'){reduceMotion=e.target.checked;game.reduceMotion=reduceMotion;storeSetting('riftbound.motion',reduceMotion?'off':'on');}
});
function toggleSound(){soundOn=!soundOn;score.setEnabled(soundOn);storeSetting('riftbound.sound',soundOn?'on':'off');updateSound();}
function updateSound(){$('sound').innerHTML=(soundOn?'♫':'♪')+' <span>Music '+(soundOn?'on':'off')+'</span>';$('sound').setAttribute('aria-pressed',String(soundOn));}
$('sound').onclick=toggleSound;updateSound();
$('fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await $('game-frame').requestFullscreen();}catch{toast('Fullscreen is unavailable.');}};
for(const b of document.querySelectorAll('[data-input]')){
  b.addEventListener('pointerdown',e=>{if(mode!=='play')return;e.preventDefault();b.setPointerCapture(e.pointerId);touches.set(e.pointerId,b.dataset.input);rebuildInput();});
  for(const evt of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(evt,e=>{touches.delete(e.pointerId);rebuildInput();});
}
function updateHUD(){
  const p=game.player,g=game.progress,o=objectiveFor(g,game.scene);
  $('level').textContent=String(g.level).padStart(2,'0');$('health-value').textContent=Math.ceil(p.hp)+' / '+game.maxHealth;$('health-bar').style.width=p.hp/game.maxHealth*100+'%';
  $('xp-bar').style.width=g.xp/xpRequired(g.level)*100+'%';$('xp-label').textContent=g.xp+' / '+xpRequired(g.level)+' XP';
  $('focus-bar').style.width=p.focus/game.maxFocus*100+'%';$('focus-value').textContent=Math.floor(p.focus)+' FOCUS';
  $('timeline-label').textContent=game.timeline==='past'?'BEFORE':'THE HOLLOW';$('timeline-dot').style.background=game.timeline==='past'?'#ffd297':'#c99cf5';
  $('dash-state').textContent=p.climbing?'CLIMBING':p.dashes+' / '+game.maxDashes+' DASH'+(game.maxDashes>1?'ES':'');
  $('seal-count').textContent=game.scene!=='overworld'||g.archiveComplete?'◇ '+RIFT_CORES.filter(c=>g.collected.includes(c.id)).length+' / 3':'✦ '+g.anchors.length+' / 3';$('points-count').textContent=g.skillPoints?'+'+g.skillPoints:'';
  $('quest-badge').textContent=o.badge+(o.step?' · '+o.step:'');$('objective-text').textContent=o.title;$('objective-hint').textContent=o.hint;
  $('quest-direction').textContent=o.target?((o.target.x<p.x?'← ':'→ ')+Math.round(Math.abs(o.target.x-p.x))+'m'+(o.target.phase?' · '+(o.target.phase==='past'?'BEFORE':'HOLLOW'):'')):'';
  $('powers-hud').textContent=(game.hasPower('doubleJump')?'W W · SECOND WIND  ':'')+(game.hasPower('bolt')?'K · BOLT  ':'')+(game.hasPower('ward')?(p.wardCooldown>0?'L · '+p.wardCooldown.toFixed(1)+'s':'L · WARD'):'')+(game.hasPower('riftAnchor')?'  V · ANCHOR':'');
  const near=game.nearby();$('interaction').hidden=mode!=='play'||!near;$('interaction').textContent=near?(near.kind==='portal'?game.portalHint(near):'E · '+(near.kind==='npc'?'Talk to ':near.kind==='lore'?'Read ':near.kind==='anchor'?'Restore / rest at ':'')+near.name):'';
  $('trial-hud').hidden=!game.trial||mode!=='play';if(game.trial)$('trial-hud').textContent='BELL RUN · '+game.trial.next+'/3 · '+Math.max(0,18-game.trial.time).toFixed(1)+'s';
  $('dread-hud').hidden=mode!=='play'||game.timeline==='past';
  $('dread-bar').style.width=game.dread*100+'%';
  $('dread-label').textContent=p.sneaking?'HUSHED · S':game.pursuer?'IT HEARD YOU':game.dread>.58?'SOMETHING IS LISTENING':'THE HOLLOW LISTENS';
  $('game-frame').classList.toggle('haunted',game.dread>.6);
  const statuses=[];
  if(game.freezeUntil>game.time)statuses.push('CLOCK HELD · '+(game.freezeUntil-game.time).toFixed(1)+'s');
  if(game.relayTimers['choir-bridge']>game.time)statuses.push('QUIET PATH · '+(game.relayTimers['choir-bridge']-game.time).toFixed(1)+'s');
  if(game.plateCharge>0&&game.plateCharge<1.2)statuses.push('HOLD S · '+Math.round(game.plateCharge/1.2*100)+'%');
  if(game.riftAnchor)statuses.push('V RECALL · '+Math.max(0,game.riftAnchor.until-game.time).toFixed(1)+'s');
  $('rift-status').hidden=mode!=='play'||!statuses.length;$('rift-status').textContent=statuses.join(' / ');
  const b=game.scene==='house'?game.world.borrowed:game.world.boss;
  $('boss-name').textContent=b.id==='borrowed'?'THE BORROWED':'LUMEN · THE RIFT WARDEN';
  $('boss-hud').hidden=!(mode==='play'&&b.active&&!b.dead);$('boss-bar').style.width=Math.max(0,b.hp)/b.maxHp*100+'%';
  $('boss-hint').textContent=b.id==='borrowed'?(b.state==='windup'?b.warning:'Bait a move, then change tactics · Aura: '+(b.aura==='past'?'Before':'Hollow')):(b.state==='windup'?['VOLLEY · Dash / Ward','CHARGE · Jump / Ward','GROUND WAVE · Jump'][b.cycle%3]:'Aura: '+(b.aura==='past'?'Before · strike from Hollow':'Hollow · strike from Before'));
}
function frame(now){
  const elapsed=last?Math.min((now-last)/1000,.05):0;last=now;accumulator+=elapsed;
  while(accumulator>=1/120){
    if(mode==='play'){game.step(1/120,input);handleEvents();saveClock+=1/120;if(saveClock>=4){save();saveClock=0;}}
    else if(mode==='menu')game.time+=1/120;accumulator-=1/120;
  }
  score.update(game,mode);renderer.draw(game,mode==='menu');if(++hudCounter%6===0)updateHUD();requestAnimationFrame(frame);
}
export { game };
refreshMenu();updateHUD();requestAnimationFrame(frame);
