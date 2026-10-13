const notes=semitone=>220*Math.pow(2,semitone/12);
const themes={
  before:{bpm:86,melody:[0,7,12,10,7,5,3,7,0,3,7,15,12,10,7,3],chords:[[0,3,7],[-5,0,3],[-7,-3,0],[-2,2,5]],type:'triangle'},
  hollow:{bpm:70,melody:[0,null,7,null,1,null,12,7,-5,null,3,null,1,0,null,-2],chords:[[0,3,7],[-5,0,6],[-7,-3,0],[-2,1,5]],type:'sine'},
  archive:{bpm:78,melody:[12,7,3,0,2,7,10,null,12,15,14,10,7,3,2,0],chords:[[0,3,7],[-7,-3,0],[-5,0,3],[-2,2,5]],type:'sine'},
  rift:{bpm:94,melody:[0,7,10,12,3,null,2,7,0,12,14,10,7,3,2,null],chords:[[0,3,7],[-5,0,6],[-7,-3,0],[-2,2,5]],type:'triangle'},
  boss:{bpm:124,melody:[0,0,7,3,0,10,7,3,-5,-5,3,0,-2,5,7,2],chords:[[0,3,7],[-5,0,3],[-7,-3,0],[-2,2,5]],type:'triangle'}
};
export class GameAudio{
  constructor(enabled=true,volume=.65){this.enabled=enabled;this.volume=volume;this.ctx=null;this.step=0;this.next=0;this.theme='before';}
  ensure(){
    try{
      if(!this.ctx){
        const Audio=window.AudioContext||window.webkitAudioContext;
        if(!Audio)return;this.ctx=new Audio();this.master=this.ctx.createGain();this.master.gain.value=this.enabled?this.volume:0;
        this.master.connect(this.ctx.destination);
        const convolver=this.ctx.createConvolver(),buffer=this.ctx.createBuffer(2,this.ctx.sampleRate*1.4,this.ctx.sampleRate);
        for(let channel=0;channel<2;channel++){const data=buffer.getChannelData(channel);
          for(let i=0;i<data.length;i++){const noise=Math.sin(i*92.73+channel*311)*43758.54;data[i]=((noise-Math.floor(noise))*2-1)*Math.pow(1-i/data.length,3)*.45;}}
        convolver.buffer=buffer;const wet=this.ctx.createGain();wet.gain.value=.24;
        this.master.connect(convolver);convolver.connect(wet);wet.connect(this.ctx.destination);this.next=this.ctx.currentTime+.04;
      }
      if(this.ctx.state==='suspended')this.ctx.resume().catch(()=>{});
    }catch{this.ctx=null;}
  }
  setEnabled(value){this.enabled=value;this.ensure();if(this.ctx)this.master.gain.setTargetAtTime(value?this.volume:0,this.ctx.currentTime,.08);}
  setVolume(value){this.volume=Math.max(0,Math.min(1,Number(value)));if(this.ctx)this.master.gain.setTargetAtTime(this.enabled?this.volume:0,this.ctx.currentTime,.06);}
  tone(hz,duration=.18,volume=.04,type='sine',at=null,detune=0){
    if(!this.enabled||!this.ctx||this.ctx.state!=='running')return;
    const start=at??this.ctx.currentTime,osc=this.ctx.createOscillator(),gain=this.ctx.createGain();
    osc.type=type;osc.frequency.setValueAtTime(hz,start);osc.detune.setValueAtTime(detune,start);
    gain.gain.setValueAtTime(.0001,start);gain.gain.exponentialRampToValueAtTime(volume,start+.02);
    gain.gain.exponentialRampToValueAtTime(.0001,start+duration);
    osc.connect(gain);gain.connect(this.master);osc.start(start);osc.stop(start+duration+.04);
  }
  drum(at,strong=false){
    if(!this.enabled||!this.ctx)return;
    const osc=this.ctx.createOscillator(),gain=this.ctx.createGain();osc.type='sine';
    osc.frequency.setValueAtTime(strong?125:230,at);osc.frequency.exponentialRampToValueAtTime(42,at+.12);
    gain.gain.setValueAtTime(strong?.07:.024,at);gain.gain.exponentialRampToValueAtTime(.0001,at+.15);
    osc.connect(gain);gain.connect(this.master);osc.start(at);osc.stop(at+.17);
  }
  update(game,mode){
    if(!this.enabled||!this.ctx||this.ctx.state!=='running')return;
    const active=['play','dialogue','power','complete','journal'].includes(mode),now=this.ctx.currentTime;
    this.master.gain.setTargetAtTime(active?this.volume:0,now,.1);
    if(!active){this.next=now+.05;return;}
    const theme=game.fightingBoss()?'boss':game.scene!=='overworld'?'rift':game.player.x>=4800?'archive':game.timeline==='present'?'hollow':'before';
    if(theme!==this.theme){this.theme=theme;this.step=0;this.next=now+.04;}
    if(this.next<now)this.next=now+.03;
    const score=themes[theme],beat=60/score.bpm/2;
    while(this.next<now+.2){
      const s=this.step,note=score.melody[s%score.melody.length],detune=theme==='hollow'?Math.sin(s*.8)*8:0;
      if(note!==null)this.tone(notes(note)*(theme==='archive'?2:1),beat*1.6,theme==='hollow'?.017:.028,score.type,this.next,detune);
      const chord=score.chords[Math.floor(s/8)%4];
      if(s%8===0){for(const n of chord)this.tone(notes(n)/2,beat*8.5,.015,'sine',this.next,detune);
        this.tone(notes(chord[0])/4,beat*5,.028,'triangle',this.next);}
      if(theme==='before'&&s%2===1)this.tone(notes(chord[Math.floor(s/2)%3])+0.5,beat*.7,.012,'sine',this.next);
      if(theme==='boss'){if(s%2===0)this.drum(this.next,s%4===0);if(s%4===3)this.tone(notes(-12),beat*.5,.026,'triangle',this.next);}
      if(theme==='hollow'&&s%8===6)this.tone(notes(18),beat*3,.008,'sine',this.next,-11);
      this.next+=beat;this.step++;
    }
  }
  effect(name){
    if(!this.ctx||!this.enabled)return;const now=this.ctx.currentTime;
    if(name==='portal'||name==='recall'){this.tone(220,.2,.035,'triangle');this.tone(659,.4,.025,'sine',now+.05);}
    else if(name==='whisper')this.tone(49,.8,.018,'sine');
    else if(name==='parry'){this.tone(880,.12,.045,'triangle');this.tone(1320,.2,.028,'sine',now+.03);}
    else if(name==='clock'||name==='quiet'||name==='anchor')this.tone(587,.4,.035);
    else if(name==='guard'||name==='crack')this.tone(125,.13,.033,'triangle');
    else if(name==='level'||name==='power'||name==='quest'){[0,4,7,12].forEach((n,i)=>this.tone(notes(n+12),.5,.045,'triangle',now+i*.11));}
    else if(name==='jump'||name==='climb')this.tone(390,.08,.026,'triangle');
    else if(name==='doubleJump'){this.tone(523,.14,.032,'triangle');this.tone(784,.18,.023,'sine',now+.04);}
    else if(name==='dash')this.tone(175,.13,.04,'triangle');
    else if(name==='rift'){this.tone(146,.4,.037,'triangle');this.tone(294,.5,.026,'sine',now+.06);}
    else if(name==='bolt'){this.tone(620,.11,.04,'triangle');this.tone(930,.08,.023,'sine',now+.04);}
    else if(name==='ward'){this.tone(110,.6,.05,'sine');this.tone(440,.75,.035,'triangle');}
    else if(name==='hurt'||name==='death')this.tone(62,.21,.06,'triangle');
    else if(name==='swing')this.tone(260,.055,.022,'triangle');
    else if(name==='hit')this.tone(105,.09,.04,'triangle');
    else if(name==='mimic')this.tone(49,.4,.035,'triangle');
    else if(name==='bell'||name==='checkpoint'||name==='switch'){this.tone(587,.5,.04);this.tone(1174,.7,.018,'sine',now+.035);}
    else if(name==='collect'||name==='refill')this.tone(name==='refill'?1100:880,.2,.025);
    else if(name==='bossCast')this.drum(now,true);
  }
}
