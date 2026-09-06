import { existsSync, readdirSync, statSync } from 'node:fs';
import { extname, join, relative, resolve, sep } from 'node:path';
import { spawn } from 'node:child_process';

const root = process.cwd();
const sourceRoot = resolve(root, 'media-export');
const wrangler = resolve(root, 'node_modules/wrangler/wrangler-dist/cli.js');
const bucket = process.env.R2_BUCKET || 'work11';
const concurrency = Math.max(1, Number(process.env.R2_UPLOAD_CONCURRENCY || 4));
const includedDirectories = ['full', 'previews', 'preview', 'images', 'image', 'posters', 'documents'];

if (!existsSync(sourceRoot)) throw new Error(`Media export not found: ${sourceRoot}`);
if (!existsSync(wrangler)) throw new Error(`Wrangler not found: ${wrangler}`);

const contentTypes = {
  '.mp4': 'video/mp4',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
  '.pdf': 'application/pdf'
};

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

const upload = path =>
  new Promise((resolvePromise, rejectPromise) => {
    const key = relative(sourceRoot, path).split(sep).join('/');
    const contentType = contentTypes[extname(path).toLowerCase()] || 'application/octet-stream';
    const child = spawn(
      process.execPath,
      [
        wrangler,
        'r2',
        'object',
        'put',
        `${bucket}/${key}`,
        '--remote',
        '--file',
        path,
        '--content-type',
        contentType,
        '--cache-control',
        'public, max-age=31536000, immutable'
      ],
      { stdio: ['ignore', 'pipe', 'pipe'] }
    );
    let stderr = '';
    child.stderr.on('data', chunk => (stderr += chunk));
    child.on('error', rejectPromise);
    child.on('exit', code => {
      if (code === 0) resolvePromise(key);
      else rejectPromise(new Error(`Upload failed for ${key}: ${stderr.trim()}`));
    });
  });

let nextIndex = 0;
let completed = 0;
const workers = Array.from({ length: Math.min(concurrency, files.length) }, async () => {
  while (nextIndex < files.length) {
    const index = nextIndex++;
    const key = await upload(files[index]);
    completed += 1;
    console.log(`[${completed}/${files.length}] ${key}`);
  }
});

await Promise.all(workers);
console.log(`Uploaded ${completed} objects to ${bucket}.`);
