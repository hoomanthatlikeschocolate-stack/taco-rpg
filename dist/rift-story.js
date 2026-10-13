import { RIFT_CORES } from './world.js';
const say=(speaker,text)=>({speaker,text});
const talk=(name,role,lines,extra={})=>({name,role,lines,...extra});
export function riftObjective(p,scene='overworld'){
  const core=RIFT_CORES.find(c=>c.scene===scene);
  if(core){
    if(scene==='fold'&&!p.met.includes('orin'))return {title:'Speak to the faceless cartographer',hint:'Orin is beside the first rift. E talks. The gold aperture ahead carries your dash through the gap.',target:{x:7730,y:365},badge:'THE FOLDED ATRIUM'};
    if(!p.collected.includes(core.id)){
      const hints={fold:'Dash into aperture A in Before. Its exit is Hollow. Keep your momentum, then Q onto the gold ledge; chain a jump and another shift.',
        clock:'K shoots the clock eye for 6 solid seconds. Plan your Q switches before spending focus. Striped ledges will fade again.',
        choir:'Hold S on the quiet stone to open a 7-second bridge. Or take aperture B: it is faster, but the Hollow hears it.'};
      return {title:'Recover '+core.name,hint:hints[scene],target:{x:core.x,y:core.y,phase:core.phase},badge:'RIFT CHALLENGE · '+scene.toUpperCase()};
    }
    const x={fold:7660,clock:8660,choir:9760}[scene];
    return {title:'Return through the chamber’s rift',hint:'The keystone is safe in your journal. E at the entrance rift returns you to the world; F can also fast travel.',target:{x,y:345},badge:'KEYSTONE RECOVERED'};
  }
  if(scene==='house'){
    if(!p.houseBossDefeated)return {title:'Face the thing rehearsing your name',hint:'The Borrowed copies your recent actions. Bait an attack, change tactics, and use the small apertures to flank it. Its opposite realm takes more damage.',target:{x:11400,y:350},badge:'THE UNWRITTEN HOUSE'};
    if(!p.houseComplete)return {title:'Decide what the kingdom remembers',hint:'The memory loom is open. E lets you choose: return the lost names, or bind the voice inside it.',target:{x:11400,y:365},badge:'THE LAST BARGAIN'};
    return {title:'Leave the House behind',hint:'Your choice is written in the journal. The rifts remain open for exploration.',target:{x:10960,y:345},badge:'CHAPTER III COMPLETE'};
  }
  if(!p.archiveComplete||p.houseComplete)return null;
  if(!p.met.includes('orin'))return {title:'Find the cartographer inside Rift I',hint:'Fast travel with F to the Broken Crossing. The rift west of that checkpoint leads to Orin and the Folded Atrium.',target:{x:530,y:340},badge:'CHAPTER III · THE BORROWED'};
  const missing=RIFT_CORES.find(c=>!p.collected.includes(c.id));
  if(missing)return {title:'Enter Rift '+({fold:'I',clock:'II',choir:'III'})[missing.scene],hint:({fold:'The Fold rift is west of the Broken Crossing checkpoint. Carry a dash through its paired apertures.',clock:'Rift II is beside the tower. K can hold its shifting ledges; watch your focus.',choir:'Rift III sits on the Archive’s stone shelves. Staying quiet and taking the fast path have different costs.'})[missing.scene],target:{x:missing.doorX,y:missing.scene==='choir'?280:340},badge:'THE THREE WOUNDS · '+RIFT_CORES.filter(c=>p.collected.includes(c.id)).length+' / 3'};
  if(!p.houseBossDefeated)return {title:'Enter the Unwritten House',hint:'Rift IV is beside the Unremembered Wood checkpoint. Three keystones open it. The thing inside knows how you fight.',target:{x:3430,y:340},badge:'CHAPTER III · THE BORROWED'};
  return {title:'Return to the memory loom',hint:'Rift IV remains open. The Borrowed has fallen, but its stolen names still need your decision.',target:{x:3430,y:340},badge:'THE LAST BARGAIN'};
}
export function riftDialogue(event,game){
  const p=game.progress,id=event.id,count=RIFT_CORES.filter(c=>p.collected.includes(c.id)).length;
  if(id==='orin'){
    if(p.houseComplete)return talk('Orin','A MAP THAT FINALLY HOLDS STILL',[
      say('Orin',p.riftEnding==='remember'?'People are waking with names they thought belonged to dreams. The dark has fewer voices now.':'It is quiet. Really quiet. Not the kind that waits for you to turn away.'),
      say('Nara','There are still empty places on your map.'),
      say('Orin','There always will be. But now we get to decide where the next line goes.')
    ]);
    if(count===3)return talk('Orin','THE LAST DOOR',[
      say('Orin','All three wounds remembered their shape. The House can no longer move its door.'),
      say('Nara','What is it copying?'),
      say('Orin','You. Every dash. Every strike. Every time you choose fear over stillness. Change your answer after it commits to a move.'),
      say('Orin','Rift IV stands beside the Wood checkpoint. Inside, the small apertures can put you behind it. Your Ward can send its bolts home.')
    ]);
    return talk('Orin','A CARTOGRAPHER WITHOUT A FACE',[
      say('Orin',event.first?'I drew the river after it moved. I drew the roads after they forgot where they went. Then I tried to draw the House. It borrowed my face.':'The map has changed again. Something is listening to the way you move.'),
      say('Nara',p.archiveComplete?'I found my brother in the Archive. Why does something in the wood still speak with his voice?':'I’m looking for my brother. Something in the wood is already speaking with his voice.'),
      say('Orin','It does not want your brother anymore. It wants to be the person who came looking for him. It is practicing being Nara.'),
      say('Orin','Three wounds hold its House together: the Fold, the Clockwell and the Choir. Take their keystones and its door will stay still.'),
      say('Orin','Dash into an aperture with a letter. Momentum survives the crossing. The exit may be in the other realm. Doors marked E can be entered at rest.'),
      say('Nara','And the whispers?'),
      say('Orin','Noise tells it where you are. S makes your steps quiet. Before and lanterns make it lose you. Ward can banish the thing following your light.')
    ]);
  }
  if(id==='rift-core-fold')return talk('A stolen memory','THE FOLD KEYSTONE',[
    say('Ivo','Nara, the bridge is gone. Give me your hand.'),
    say('Nara','That never happened. I wasn’t with him when the bridge fell.'),
    say('The Borrowed','Not yet. I can put you in the memory. I can give you a brother who comes home.'),
    say('Nara','You have his voice. You don’t have him.'),
    say('Orin','The Fold keystone remembers a place twice. V places a six-second anchor; V again recalls you. Placing costs 30 focus, returning costs 10. Plan where you can afford to fail.')
  ]);
  if(id==='rift-core-clock')return talk('A stolen memory','THE CLOCK KEYSTONE',[
    say('Maelin','A name for every winter. One more, and the village will be safe.'),
    say('Nara','How many winters did you buy?'),
    say('The Borrowed','She stopped counting. I didn’t.'),
    say('Nara','You are the price she never understood.'),
    say('The Borrowed','I am the part of the bargain that learned to want things.')
  ]);
  if(id==='rift-core-choir')return talk('A stolen memory','THE CHOIR KEYSTONE',[
    say('The Borrowed','Your mother won’t know which of us comes home.'),
    say('Nara','She knows how I laugh.'),
    say('The Borrowed','I can learn.'),
    say('Ivo','Nara. It can copy what you do. It cannot choose why you do it.'),
    say('Nara','Then let it watch.')
  ]);
  if(id==='borrowed-fallen')return talk('The Borrowed','A VOICE WITHOUT A BODY',[
    say('The Borrowed','If I stop speaking, they all disappear again.'),
    say('Nara','No. You were keeping them here so you would never be alone.'),
    say('The Borrowed','What would you have done?'),
    say('Nara','I would have asked.'),
    say('Orin','The loom is open. E at its center lets you return the names, or seal the voice. That choice will change what follows you into the Hollow.')
  ]);
  if(id==='memory-loom'){
    if(p.houseComplete)return talk('Nara','A BARGAIN ALREADY MADE',[say('Nara',p.riftEnding==='remember'?'Their names belong to them again. The dark will have to find another song.':'The voice is bound. I can feel its silence inside the Ward.')]);
    return talk('The memory loom','THE LAST BARGAIN',[
      say('Orin','Return the names, and the Hollow loses some of its hold. Bind the voice, and its strength becomes part of your Ward.'),
      say('Nara','The names were never ours to trade.'),
      say('Ivo',p.ending==='home'?'Whatever you choose, take your own name home.':'I’ll stay with your light. Choose what we can live with.')
    ],{scope:'rift',choices:[{id:'remember',label:'Return the lost names · calmer Hollow'},{id:'bind',label:'Bind the voice · faster Ward recovery'}]});
  }
  if(id==='rift-ending')return talk('Nara','CHAPTER III · THE UNWRITTEN HOUSE',[
    say('Nara',p.riftEnding==='remember'?'Names rise from the loom like sparks. Somewhere, a mother remembers an empty chair. Somewhere, a child remembers how to answer.':'The voice folds into the Ward. For the first time since I entered the wood, the silence is only silence.'),
    say('Orin',p.riftEnding==='remember'?'It will still be dark out there. But it will take longer for the dark to find you.':'Your Ward will recover faster now. Use the strength it stole to keep the next person safe.'),
    say('Nara','I am Nara. I came here for someone I love. That is a name it cannot borrow.'),
    say('Ivo','Then let’s go home. Or further. This time, we get to choose.')
  ]);
  if(id==='maelin'&&count>0)return talk('Maelin',p.houseComplete?'A PRICE FINALLY PAID':'THE NAME SHE WOULD NOT SAY',[
    say('Nara',p.houseComplete?'I found the thing your bargain made. It will not wear anybody else’s name.':'You knew the House was there. You knew it had learned to want us.'),
    say('Maelin','I thought forgetting would keep it weak. Every silence made it hungrier.'),
    say('Nara','No more bargains made for people who cannot answer.'),
    say('Maelin',p.houseComplete?'No more. Tell me the names, Nara. I will remember this time.':'Find Orin through Rift I. If anybody has drawn a way into that place, it is him.')
  ]);
  return null;
}
