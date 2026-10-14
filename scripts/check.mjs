import { copyFile, mkdir, rm } from 'node:fs/promises';
const root = new URL('../', import.meta.url);
const dist = new URL('../dist/', import.meta.url);
await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
await copyFile(new URL('index.html', root), new URL('index.html', dist));
console.log('Placeholder built. Output: dist/');
