import { ANCHORS, ARCHIVE_PAGES, LORE, PAGE_TEXT } from './world.js';
const line=(speaker,text)=>({speaker,text});
const conversation=(name,role,lines,extra={})=>({name,role,lines,...extra});
const has=(p,id)=>p.collected.includes(id);

export function objectiveFor(p) {
  if(!p.met.includes('maelin'))return {title:'Find out what happened to Ivo',hint:'Speak to Maelin at the lantern camp. E talks and reads.',target:{x:180,y:365},step:'1 / 9',badge:'THE MISSING BROTHER'};
  for(let i=0;i<ANCHORS.length;i++){
    const a=ANCHORS[i],labels=['Crossing','Canyon','Tower'];
    if(!has(p,a.seal)){
      const targets=[{x:966,y:348,phase:'past'},{x:1831,y:275,phase:'past'},{x:2560,y:299,phase:'present'}];
      const hints=['Q reveals the old bridge in Before. Follow the gold platforms.','Double jump with W, W. Dash across the canyon and shift to Before.','Hold W while pressing into a wall to climb. The seal is in the Hollow.'];
      return {title:'Recover the '+labels[i]+' Echo',hint:hints[i],target:targets[i],step:String(i*2+2)+' / 9',badge:'THE THREE LANTERNS'};
    }
    if(!p.anchors.includes(a.id))return {title:'Light the '+a.name,hint:'Bring the Echo to its lantern. Press E to restore it and learn '+a.powerName+'.',target:{x:a.x,y:a.y-30},step:String(i*2+3)+' / 9',badge:'THE THREE LANTERNS'};
  }
  if(!p.bossDefeated)return {title:'Break the Warden’s oath',hint:'He guards the eastern gate. Attack from the realm opposite his aura. Ward blocks his volleys.',target:{x:4110,y:362},step:'8 / 9',badge:'THE MISSING BROTHER'};
  if(!p.completed)return {title:'Enter the restored gate',hint:'The Crossing is safe. Ivo’s voice is coming from the Archive beyond it.',target:{x:4640,y:345},step:'9 / 9',badge:'THE CROSSING RESTORED'};
  for(let i=0;i<ARCHIVE_PAGES.length;i++){
    if(has(p,ARCHIVE_PAGES[i]))continue;
    if(i===2&&!p.switches.includes('archive-switch'))return {title:'Open the Archive floodgate',hint:'Stand left of the glowing eye and fire K toward it. Rift Bolts open this lock.',target:{x:6380,y:382},step:'3 / 5',badge:'THE DROWNED ARCHIVE'};
    const targets=[{x:5190,y:330,phase:'past'},{x:6120,y:258,phase:'present'},{x:6920,y:285,phase:'past'}];
    return {title:'Find Ivo’s '+['first','second','last'][i]+' page',hint:i===0?'The first page is above the old shelves in Before. Q changes realms.':i===1?'Climb the stacks in the Hollow. Hold W against the wall.':'The last page rests in Before, above the listening room.',target:targets[i],step:String(i+1)+' / 5',badge:'THE DROWNED ARCHIVE'};
  }
  if(!p.archiveComplete)return {title:'Find the real Ivo',hint:'Follow the light to the last room. E speaks to Ivo; choose what you will carry home.',target:{x:7100,y:365},step:'5 / 5',badge:'THE DROWNED ARCHIVE'};
  if(!p.gearsReturned)return {title:'Help Pip find his missing gears',hint:'Three gears are hidden along the Crossing. Bring them to Pip by the first lantern.',target:{x:1115,y:365},badge:'OPTIONAL · PIP’S REPAIRS'};
  if(!p.lanternReturned)return {title:'Bring Sera’s lantern back',hint:'Find the glass high in the Hollow wood, then talk to Sera.',target:{x:has(p,'lantern-glass')?3355:3215,y:has(p,'lantern-glass')?365:205,phase:has(p,'lantern-glass')?undefined:'present'},badge:'OPTIONAL · THE LAST LIGHT'};
  if(!p.trialBest)return {title:'Run the Bellkeeper’s trial',hint:'Start the bell run beside the tower. Touch all three bells in 18 seconds.',target:{x:2710,y:305},badge:'OPTIONAL · BELL RUN'};
  return {title:'Leave no name behind',hint:'Find the remaining lore and hidden bells. F opens your journal and fast travel.',target:null,badge:'FREE EXPLORATION'};
}

export function questRows(p) {
  const gears=p.collected.filter(id=>id.startsWith('gear-')).length;
  return [
    {name:'The missing brother',done:p.completed,detail:p.completed?'The Crossing is restored; Lumen has been freed.':p.anchors.length+' / 3 lanterns lit. Recover the Echoes and break the Warden’s oath.'},
    {name:'The Drowned Archive',done:p.archiveComplete,detail:p.archiveComplete?(p.ending==='home'?'You chose to carry Ivo’s memory home.':'You chose to keep searching with Ivo’s echo.'):ARCHIVE_PAGES.filter(id=>has(p,id)).length+' / 3 pages. Find the truth beyond the restored gate.'},
    {name:'A crow out of time',done:p.gearsReturned,detail:p.gearsReturned?'Pip is repaired. +20 focus and a wider pickup reach.':gears+' / 3 gears. Return them to Pip beside the Crossing Lantern.'},
    {name:'The last light',done:p.lanternReturned,detail:p.lanternReturned?'Sera’s lantern is repaired. +10 maximum health.':(has(p,'lantern-glass')?'Glass found. Return it to Sera.':'Find lantern glass above the wood in the Hollow, then talk to Sera.')},
    {name:'The Bellkeeper’s run',done:!!p.trialBest,detail:p.trialBest?'Best time: '+p.trialBest.toFixed(2)+'s. Replay for a better medal.':'E at the bell marker by the tower. Touch three bells before time runs out.'},
    {name:'Names in the margins',done:p.lore.length===LORE.length,detail:p.lore.length+' / '+LORE.length+' inscriptions read. E reads marked stones.'},
    {name:'Things that should not ring',done:has(p,'secret-bell')&&has(p,'secret-archive'),detail:p.collected.filter(id=>id.startsWith('secret-')).length+' / 2 hidden relics found.'}
  ];
}

export function dialogueFor(event,game) {
  const p=game.progress,dark=game.timeline==='present',id=event.id;
  const a=ANCHORS.find(a=>a.id===id);
  if(a)return conversation('The lantern','A NAME RETURNED',[
    line('Nara','The Echo fits. The light is coming back.'),
    line('Lumen',id==='anchor-bridge'?'One name returned. I heard the bell. I remember a river.':id==='anchor-canyon'?'Two names. I remember someone telling me to wait. I have waited so long.':'Three names. There was a boy. He came here to open the gate. I could not let him pass.'),
    line('Nara',id==='anchor-tower'?'Then I’m coming to relieve you of your oath.':'Ivo was here. I’m getting closer.')
  ]);
  const lore=LORE.find(l=>l.id===id);
  if(lore)return conversation('A recovered inscription',lore.name,[line('The inscription',lore.text),line('Nara',id==='lore-camp'?'I know your handwriting. You were afraid, and you went anyway.':id==='lore-warden'?'Nobody ever came to relieve him.':'Another piece of what this place tried to forget.')]);
  if(id==='maelin'){
    if(event.first)return conversation('Maelin','LANTERN KEEPER',[
      line('Maelin','Nara. Your brother passed this way three nights ago. He said he had found a way to bring the missing names home.'),
      line('Nara','Then why is his name scratched out of every letter he sent me?'),
      line('Maelin','Because something in the Hollow wants him forgotten. Keep his name in your mouth. Ivo. Say it until it feels real.'),
      line('Maelin','Recover the three Echoes. Bring each to its lantern. Their light will teach you what you need to reach the Warden.'),
      line('Nara','And after the Warden?'),
      line('Maelin','An archive under the river. That is where I would hide a stolen name. Go carefully. W jumps; hold it into a wall to climb. Q reveals Before.')
    ]);
    if(p.archiveComplete)return conversation('Maelin','A LIGHT LEFT BURNING',[
      line('Nara',p.ending==='home'?'I found him. What was left of him. I brought his name home.':'I found his echo. We’re going to keep searching for the rest.'),
      line('Maelin','Then the Hollow has not won. Memory is a small thing, Nara. It can still hold back a very large dark.'),
      line('Nara','Your brother’s name was Ansel. I found it in the Archive.'),
      line('Maelin','Ansel. Yes. Oh, yes. Thank you.')
    ]);
    return conversation('Maelin',dark?'A WHISPER BEHIND THE LANTERN':'LANTERN KEEPER',[
      line('Maelin',dark?'The trees are closer than they were. Do not look at them for too long.':'The sunlight here remembers summer. It does not mean this place is safe.'),
      line('Nara','Did you know what the town was trading away?'),
      line('Maelin','I knew. I thought I could pay the price alone. That is how every terrible bargain begins.'),
      line('Maelin',p.anchors.length<3?'Follow the lantern light. Your journal will keep the next task marked.':'The Warden was once Captain Lumen. He is not your enemy. His oath is.')
    ]);
  }
  if(id==='pip'){
    if(event.reward==='gears')return conversation('Pip','CLOCKWORK CROW · REPAIRED',[
      line('Pip','Three gears! Three beautiful gears! I can finally remember what time it is.'),
      line('Nara','What time is it?'),
      line('Pip','A quarter past catastrophe. Give or take a century.'),
      line('Pip','I tuned your lantern while you were looking. More focus, and little lights will come to you from farther away. We are even. Mostly.')
    ]);
    return conversation('Pip','CLOCKWORK CROW',[
      line('Pip',event.first?'Name’s Pip. Official assistant bellkeeper. Unofficial collector of shiny disasters.':'You look alive. Excellent. That puts you ahead of most of my customers.'),
      line('Pip','I lost three gears: one over the old bridge, one on the tower balcony, one high in the Hollow wood. Bring them back and I’ll tune your lantern.'),
      line('Nara','What happens when the bells stop?'),
      line('Pip',dark?'Things with no names start borrowing ours. One of them called itself Pip yesterday. Very rude.':'Then we ring them again. Obviously. I am a professional optimist.')
    ]);
  }
  if(id==='sera'){
    if(event.reward==='lantern')return conversation('Sera','THE LAST FERRYMAN',[
      line('Sera','You found the glass. I can take the boat out again.'),
      line('Nara','Who are you waiting for?'),
      line('Sera','My daughter. The river forgot her. I didn’t.'),
      line('Sera','Here. Keep this knot tied around your wrist. Sailors wear them when the water starts calling. It will keep your heart steady.')
    ]);
    return conversation('Sera','THE LAST FERRYMAN',[
      line('Sera','Don’t answer the voices. Mine sounds like a little girl. Yours will know exactly who you miss.'),
      line('Nara','I’m looking for my brother. Ivo.'),
      line('Sera','A boy crossed the river with a book wrapped in his coat. He was carrying somebody else’s fear.'),
      line('Sera','My lantern glass is on the branch high above us in the Hollow. Bring it back, and I’ll give you something for the journey.'),
      line('Nara','Are you afraid?'),
      line('Sera','Every night. I go out anyway.')
    ]);
  }
  if(id==='ivo-echo')return conversation('Ivo’s echo','A VOICE BETWEEN THE SHELVES',[
    line('Ivo','Nara? Don’t follow the other voice. It knows my name, but it doesn’t know yours.'),
    line('Nara','Ivo! Where are you?'),
    line('Ivo','Three pages. I tore the truth into three pages so the Archive couldn’t swallow it all at once.'),
    line('Ivo','One in Before. One where the dark listens. The last beyond the floodgate. Shine a bolt into its eye.'),
    line('Nara','Stay with me.'),
    line('Ivo','I’m trying.')
  ]);
  if(id==='ivo'){
    if(p.archiveComplete)return conversation('Ivo','A NAME REMEMBERED',[
      line('Ivo',p.ending==='home'?'When you go home, tell them I was here. Tell them I tried.':'I can stay with your lantern. We can find the rest together.'),
      line('Nara','Nobody is going to scratch your name out again.')
    ]);
    if(ARCHIVE_PAGES.some(page=>!has(p,page)))return conversation('Ivo','A BROKEN MEMORY',[
      line('Ivo','I can almost remember. The pages, Nara. I need all three pages.'),
      line('Nara','I’ll find them. I’m not leaving you behind.')
    ]);
    return conversation('Ivo','THE LAST REMEMBERED ROOM',[
      line('Ivo','I wanted to bring everyone home. All the names they traded away.'),
      line('Nara','You opened the crossing.'),
      line('Ivo','The Hollow came through with them. I stayed to close it. This is all it left of me.'),
      line('Nara','Then I’ll take what is left. You’re still my brother.'),
      line('Ivo','A memory can go home. An echo can keep searching. I don’t know which one I am anymore.'),
      line('Nara','I do. You’re Ivo.')
    ],{choices:[{id:'home',label:'Carry his memory home'},{id:'search',label:'Keep searching together'}]});
  }
  if(id==='warden-freed')return conversation('Captain Lumen','AN OATH FINALLY ENDED',[
    line('Lumen','The bells. I can hear them again. Are they all back?'),
    line('Nara','You can rest, Captain. I’ll find the ones who are still missing.'),
    line('Lumen','A boy went into the Archive. He was carrying a lantern just like yours.'),
    line('Lumen','I should have helped him. I remembered the order. I forgot why it mattered.'),
    line('Nara','You’ve helped me now.')
  ]);
  if(id==='ending')return conversation('Nara',p.ending==='home'?'A NAME CARRIED HOME':'A LIGHT THAT KEEPS SEARCHING',[
    line('Nara',p.ending==='home'?'I will say your name every morning, Ivo. Until the town remembers how.':'Stay close, Ivo. There are more lights beyond this river. We’ll find them.'),
    line('Ivo','Then the dark will have to learn to be afraid of us.'),
    line('Nara','Echo Step awakened: two dashes before landing. There are still people to help, bells to ring, and names to recover.')
  ]);
  const pageIndex=ARCHIVE_PAGES.indexOf(id);
  if(pageIndex>=0)return conversation('Ivo’s recovered page','ARCHIVE FRAGMENT '+(pageIndex+1),[line('Ivo',PAGE_TEXT[pageIndex])]);
  return conversation('Nara','THE JOURNEY CONTINUES',[line('Nara','There are still lights out there. I can reach them.')]);
}
