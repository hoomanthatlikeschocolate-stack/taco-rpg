import { readFile, readdir, mkdir, copyFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
const root=new URL('../',import.meta.url),dist=new URL('../dist/',import.meta.url);
await mkdir(dist,{recursive:true});
const required=['index.html','app.js','engine.js','world.js','render.js','story.js','music.js','rifts.js','rift-story.js','style.css','icon.svg'];
for(const name of required){await readFile(new URL(name,root));await copyFile(new URL(name,root),new URL(name,dist));}
for(const name of required.filter(name=>name.endsWith('.js'))){
  const check=spawnSync(process.execPath,['--check',new URL(name,root).pathname],{stdio:'inherit'});
  if(check.status)process.exit(check.status);
}
const tests=(await readdir(new URL('tests/',root))).filter(name=>name.endsWith('.test.mjs')).map(name=>'tests/'+name);
const result=spawnSync(process.execPath,['--test',...tests],{stdio:'inherit',cwd:root});
if(result.status)process.exit(result.status);
console.log('Riftbound 0.3.0 built and verified. Output: dist/');
