// Download the uploads actually referenced by the 87 posts + 5 pages + featured
// images, then recompress them in place. Idempotent/resumable. Live uploads live
// at https://reality-science.com/wp/wp-content/uploads/<path>.
//   node scripts/fetch-media.mjs --dry   # count + list folders, no download
//   node scripts/fetch-media.mjs         # download + optimize
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { streamTables, toObj } from './lib/wpdb.mjs';
import { extractUploadPaths, LIVE_UPLOADS_BASE } from './lib/urls.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DB = path.join(ROOT, '_dump/extracted/database.sql');
const DEST = path.join(ROOT, 'public/wp-content/uploads');
const DRY = process.argv.includes('--dry');
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';
const CONCURRENCY = 8;

async function collectPaths() {
  const paths = new Set();
  const attachedFile = new Map();
  const thumbOf = new Map();
  const featuredAttachments = new Set();

  await streamTables(DB, ['posts', 'postmeta'], (t, row) => {
    const o = toObj(t, row);
    if (t === 'posts') {
      if ((o.post_type === 'post' || o.post_type === 'page') && (o.post_status === 'publish' || o.post_status === 'private')) {
        for (const p of extractUploadPaths(o.post_content || '')) paths.add(p);
      }
    } else if (t === 'postmeta') {
      if (o.meta_key === '_wp_attached_file') attachedFile.set(o.post_id, o.meta_value);
      else if (o.meta_key === '_thumbnail_id') { thumbOf.set(o.post_id, o.meta_value); featuredAttachments.add(o.meta_value); }
    }
  });
  // add featured images (originals)
  for (const att of featuredAttachments) {
    const f = attachedFile.get(att);
    if (f && /\.(jpe?g|png|gif|webp|svg)$/i.test(f)) paths.add(f);
  }
  return paths;
}

async function optimize(file) {
  const ext = path.extname(file).toLowerCase();
  try {
    if (ext === '.jpg' || ext === '.jpeg') {
      const buf = await sharp(file).rotate().jpeg({ quality: 82, mozjpeg: true }).toBuffer();
      if (buf.length < fs.statSync(file).size) fs.writeFileSync(file, buf);
    } else if (ext === '.png') {
      const buf = await sharp(file).png({ compressionLevel: 9, palette: true }).toBuffer();
      if (buf.length < fs.statSync(file).size) fs.writeFileSync(file, buf);
    }
    // gif/svg/webp: leave as-is
  } catch { /* non-image or unreadable; skip */ }
}

async function download(rel) {
  const dest = path.join(DEST, rel);
  if (fs.existsSync(dest) && fs.statSync(dest).size > 0) return 'skip';
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  const url = LIVE_UPLOADS_BASE + rel.split('/').map(encodeURIComponent).join('/');
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) return `FAIL ${res.status}`;
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(dest, buf);
  await optimize(dest);
  return 'ok';
}

async function main() {
  const paths = [...await collectPaths()].sort();
  const folders = {};
  for (const p of paths) { const k = p.split('/').slice(0, 2).join('/'); folders[k] = (folders[k] || 0) + 1; }
  console.log(`referenced upload files: ${paths.length}`);
  console.log(`distinct YYYY/MM folders: ${Object.keys(folders).length}`);
  if (DRY) {
    console.log(JSON.stringify(folders, null, 0));
    return;
  }
  let ok = 0, skip = 0, fail = 0;
  const queue = [...paths];
  async function worker() {
    while (queue.length) {
      const rel = queue.shift();
      const r = await download(rel).catch((e) => `ERR ${e.message}`);
      if (r === 'ok') ok++; else if (r === 'skip') skip++; else { fail++; console.error(`  ${r}  ${rel}`); }
      if ((ok + skip + fail) % 50 === 0) console.log(`  ${ok + skip + fail}/${paths.length} (ok=${ok} skip=${skip} fail=${fail})`);
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  console.log(`done: ok=${ok} skip=${skip} fail=${fail} / ${paths.length}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
