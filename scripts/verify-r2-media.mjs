import { existsSync, readdirSync, statSync } from 'node:fs';
import { extname, join, relative, resolve, sep } from 'node:path';

const root = process.cwd();
const sourceRoot = resolve(root, 'media-export');
const baseUrl = (process.env.NEXT_PUBLIC_MEDIA_BASE_URL ||
  'https://pub-32146805d38d4e4c8130abf9a4c7ae79.r2.dev').replace(/\/$/, '');
const concurrency = Math.max(1, Number(process.env.R2_VERIFY_CONCURRENCY || 6));
const includedDirectories = ['full', 'previews', 'preview', 'images', 'image', 'posters', 'documents'];

if (!existsSync(sourceRoot)) throw new Error(`Media export not found: ${sourceRoot}`);

const walk = directory =>
  readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });

const files = includedDirectories
  .flatMap(directory => walk(join(sourceRoot, directory)))
  .concat(join(sourceRoot, 'manifest.json'))
  .filter(path => statSync(path).isFile())
  .sort((a, b) => a.localeCompare(b, 'en'));

const wait = milliseconds => new Promise(resolvePromise => setTimeout(resolvePromise, milliseconds));
const request = async (url, options, attempts = 4) => {
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const response = await fetch(url, options);
    if (response.status !== 429 && response.status < 500) return response;
    if (attempt === attempts) return response;
    await wait(attempt * 750);
  }
};

const verify = async path => {
  const key = relative(sourceRoot, path).split(sep).join('/');
  const url = `${baseUrl}/${key.split('/').map(encodeURIComponent).join('/')}`;
  const head = await request(url, { method: 'HEAD' });
  if (!head.ok) throw new Error(`${key}: HEAD returned ${head.status}`);
  const remoteSize = Number(head.headers.get('content-length'));
  const localSize = statSync(path).size;
  if (remoteSize !== localSize) throw new Error(`${key}: expected ${localSize} bytes, received ${remoteSize}`);
  if (head.headers.get('cache-control') !== 'public, max-age=31536000, immutable') {
    throw new Error(`${key}: unexpected Cache-Control`);
  }
  if (extname(path).toLowerCase() === '.mp4') {
    const range = await request(url, { headers: { Range: 'bytes=0-0' } });
    if (range.status !== 206 || !range.headers.get('content-range')?.startsWith('bytes 0-0/')) {
      throw new Error(`${key}: byte-range request failed (${range.status})`);
    }
    await range.arrayBuffer();
  }
  return key;
};

let nextIndex = 0;
let completed = 0;
const workers = Array.from({ length: Math.min(concurrency, files.length) }, async () => {
  while (nextIndex < files.length) {
    const index = nextIndex++;
    await verify(files[index]);
    completed += 1;
    if (completed % 20 === 0 || completed === files.length) console.log(`Verified ${completed}/${files.length}`);
  }
});

await Promise.all(workers);
console.log(`All ${completed} R2 objects passed public delivery checks.`);
