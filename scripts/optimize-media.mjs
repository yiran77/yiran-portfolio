import { cpSync, existsSync, mkdirSync, readdirSync, statSync, unlinkSync, writeFileSync } from 'node:fs';
import { basename, extname, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const sourceRoot = resolve(root, 'public/media');
const exportRoot = resolve(root, 'media-export');
const defaultToolRoot = '/private/tmp/portfolio-media-tools/node_modules/.pnpm';
const ffmpeg =
  process.env.FFMPEG_BIN ||
  join(defaultToolRoot, 'ffmpeg-static@5.3.0/node_modules/ffmpeg-static/ffmpeg');
const ffprobe =
  process.env.FFPROBE_BIN ||
  join(defaultToolRoot, 'ffprobe-static@3.1.0/node_modules/ffprobe-static/bin/darwin/arm64/ffprobe');

for (const [label, path] of [
  ['FFmpeg', ffmpeg],
  ['FFprobe', ffprobe],
  ['source media', sourceRoot]
]) {
  if (!existsSync(path)) throw new Error(`${label} not found: ${path}`);
}

const run = (command, args) => {
  const result = spawnSync(command, args, { stdio: 'inherit' });
  if (result.status !== 0) throw new Error(`${basename(command)} exited with code ${result.status}`);
};

const probe = path => {
  const result = spawnSync(
    ffprobe,
    [
      '-v',
      'error',
      '-select_streams',
      'v:0',
      '-show_entries',
      'stream=codec_name,width,height,pix_fmt',
      '-show_entries',
      'format=duration',
      '-of',
      'json',
      path
    ],
    { encoding: 'utf8' }
  );
  if (result.status !== 0) throw new Error(`Unable to inspect ${path}`);
  const data = JSON.parse(result.stdout);
  return {
    codec: data.streams?.[0]?.codec_name,
    width: data.streams?.[0]?.width,
    height: data.streams?.[0]?.height,
    pixelFormat: data.streams?.[0]?.pix_fmt,
    duration: Number(data.format?.duration || 0)
  };
};

const mediaFiles = directory =>
  readdirSync(directory)
    .filter(name => !name.startsWith('.'))
    .sort((a, b) => a.localeCompare(b, 'en'));

const isValidOutput = (source, output) => {
  if (!existsSync(output) || statSync(output).size === 0) return false;
  try {
    const before = probe(source);
    const after = probe(output);
    return (
      after.codec === 'h264' &&
      after.pixelFormat === 'yuv420p' &&
      before.width === after.width &&
      before.height === after.height &&
      Math.abs(before.duration - after.duration) < 0.15
    );
  } catch {
    return false;
  }
};

mkdirSync(exportRoot, { recursive: true });
for (const directory of ['full', 'previews', 'preview', 'images', 'image', 'posters', 'documents', 'reports']) {
  mkdirSync(join(exportRoot, directory), { recursive: true });
}

for (const directory of ['images', 'image', 'posters', 'documents']) {
  cpSync(join(sourceRoot, directory), join(exportRoot, directory), {
    recursive: true,
    force: true
  });
}

const fullSources = mediaFiles(join(sourceRoot, 'full')).filter(name => extname(name).toLowerCase() === '.m4v');
for (const [index, name] of fullSources.entries()) {
  const source = join(sourceRoot, 'full', name);
  const output = join(exportRoot, 'full', `${basename(name, extname(name))}.mp4`);
  if (isValidOutput(source, output)) {
    console.log(`[full ${index + 1}/${fullSources.length}] verified, skipping ${basename(output)}`);
    continue;
  }
  if (existsSync(output)) unlinkSync(output);
  console.log(`[full ${index + 1}/${fullSources.length}] encoding ${name}`);
  run(ffmpeg, [
    '-hide_banner',
    '-loglevel',
    'error',
    '-y',
    '-i',
    source,
    '-map',
    '0:v:0',
    '-map',
    '0:a?',
    '-vf',
    "scale='min(1920,iw)':'min(1080,ih)':force_original_aspect_ratio=decrease:force_divisible_by=2",
    '-c:v',
    'libx264',
    '-preset',
    'slow',
    '-crf',
    '21',
    '-pix_fmt',
    'yuv420p',
    '-c:a',
    'aac',
    '-b:a',
    '128k',
    '-movflags',
    '+faststart',
    output
  ]);
  if (!isValidOutput(source, output)) throw new Error(`Validation failed: ${output}`);
}

for (const directory of ['previews', 'preview']) {
  const sources = mediaFiles(join(sourceRoot, directory)).filter(name => extname(name).toLowerCase() === '.m4v');
  for (const [index, name] of sources.entries()) {
    const source = join(sourceRoot, directory, name);
    const output = join(exportRoot, directory, `${basename(name, extname(name))}.mp4`);
    if (isValidOutput(source, output)) {
      console.log(`[${directory} ${index + 1}/${sources.length}] verified, skipping ${basename(output)}`);
      continue;
    }
    if (existsSync(output)) unlinkSync(output);
    console.log(`[${directory} ${index + 1}/${sources.length}] remuxing ${name}`);
    run(ffmpeg, [
      '-hide_banner',
      '-loglevel',
      'error',
      '-y',
      '-i',
      source,
      '-map',
      '0:v:0',
      '-c',
      'copy',
      '-movflags',
      '+faststart',
      output
    ]);
    if (!isValidOutput(source, output)) throw new Error(`Validation failed: ${output}`);
  }
}

const manifest = [];
for (const directory of ['full', 'previews', 'preview']) {
  for (const name of mediaFiles(join(exportRoot, directory)).filter(name => extname(name) === '.mp4')) {
    const output = join(exportRoot, directory, name);
    const source = join(sourceRoot, directory, `${basename(name, '.mp4')}.m4v`);
    const details = probe(output);
    manifest.push({
      key: `${directory}/${name}`,
      sourceBytes: statSync(source).size,
      outputBytes: statSync(output).size,
      ...details
    });
  }
}

const sourceBytes = manifest.reduce((total, item) => total + item.sourceBytes, 0);
const outputBytes = manifest.reduce((total, item) => total + item.outputBytes, 0);
const report = {
  generatedAt: new Date().toISOString(),
  settings: {
    full: 'H.264 CRF 21, AAC 128 kbps, original dimensions up to 1920x1080, faststart',
    previews: 'stream copy to MP4, faststart',
    images: 'copied without recompression'
  },
  totals: {
    videoCount: manifest.length,
    sourceBytes,
    outputBytes,
    savedBytes: sourceBytes - outputBytes,
    savedPercent: Number((((sourceBytes - outputBytes) / sourceBytes) * 100).toFixed(2))
  },
  files: manifest
};

writeFileSync(join(exportRoot, 'manifest.json'), `${JSON.stringify(report, null, 2)}\n`);
writeFileSync(join(exportRoot, 'reports', 'summary.json'), `${JSON.stringify(report.totals, null, 2)}\n`);
console.log(`Complete: ${manifest.length} videos, ${report.totals.savedPercent}% smaller.`);
