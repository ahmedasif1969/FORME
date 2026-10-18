import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync, readdirSync } from 'node:fs';
import ffmpeg from 'ffmpeg-static';
const source = process.argv[2];
if (!source) throw new Error('Pass the source video path as the first argument.');
for (const variant of ['desktop', 'phone']) {
  mkdirSync(`public/media/${variant}`, { recursive: true });
  const filter = variant === 'phone' ? ['-vf', 'crop=608:1080:400:0'] : ['-vf', 'scale=1440:810:flags=lanczos'];
  execFileSync(ffmpeg, ['-y','-i',source,...filter,'-an','-fps_mode','passthrough','-c:v','libwebp','-quality',variant === 'phone' ? '80' : '78','-compression_level','4','-start_number','0',`public/media/${variant}/%04d.webp`], { stdio: 'inherit' });
}
const count = readdirSync('public/media/desktop').filter(f => f.endsWith('.webp')).length;
writeFileSync('public/media/manifest.json', JSON.stringify({count, fps:24, desktop:{width:1440,height:810},phone:{width:608,height:1080}}, null, 2));
