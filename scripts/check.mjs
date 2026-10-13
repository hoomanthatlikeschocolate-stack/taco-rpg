import { readFile, readdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
const required=['index.html','app.js','engine.js','world.js','render.js','style.css','icon.svg'];
for(const name of required)await readFile(new URL(`../dist/${name}`,import.meta.url));
for(const name of await readdir(new URL('../dist/',import.meta.url))){
  if(name.endsWith('.js')){
    const check=spawnSync(process.execPath,['--check',new URL(`../dist/${name}`,import.meta.url).pathname],{stdio:'inherit'});
    if(check.status)process.exit(check.status);
  }
}
const tests=spawnSync(process.execPath,['--test','tests/engine.test.mjs'],{stdio:'inherit',cwd:new URL('../',import.meta.url)});
if(tests.status)process.exit(tests.status);
console.log('Riftbound static build verified. Output: dist/');
