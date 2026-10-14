import { mkdir, rm, copyFile, readdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
const root = new URL('../', import.meta.url), dist = new URL('../dist/', import.meta.url);
const files = ['index.html', 'style.css', 'engine.js', 'render.js', 'audio.js', 'app.js'];
await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
for (const file of files) await copyFile(new URL(file, root), new URL(file, dist));
for (const file of files.filter(f => f.endsWith('.js'))) {
  const r = spawnSync(process.execPath, ['--check', new URL(file, root).pathname], { stdio: 'inherit' });
  if (r.status) process.exit(r.status);
}
const tests = (await readdir(new URL('tests/', root))).filter(f => f.endsWith('.test.mjs')).map(f => 'tests/' + f);
const r = spawnSync(process.execPath, ['--test', ...tests], { cwd: root, stdio: 'inherit' });
if (r.status) process.exit(r.status);
console.log('Opening built and verified. Output: dist/');
