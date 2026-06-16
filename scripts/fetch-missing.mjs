// Reconcile vendored assets against what the built site actually references.
// mirror-chrome only grabbed CSS/JS/fonts; chrome/page <img> images (logos, hero,
// elementor/thumbs, …) were missed. Scan dist for every /wp-content reference and
// download any that's missing locally from the live site.
//   npm run build && node scripts/fetch-missing.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const PUBLIC = path.join(ROOT, 'public');
const LIVE = 'https://reality-science.com/wp';
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/124.0 Safari/537.36';

function collectRefs() {
  const refs = new Set();
  const add = (u) => { if (u && u.startsWith('/wp-content/')) refs.add(u.split('#')[0].split('?')[0]); };
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) { walk(p); continue; }
      const ext = path.extname(e.name).toLowerCase();
      if (ext !== '.html' && ext !== '.css') continue;
      const h = fs.readFileSync(p, 'utf8');
      for (const m of h.matchAll(/(?:src|href)="([^"]+)"/g)) add(m[1]);
      for (const m of h.matchAll(/srcset="([^"]+)"/g)) for (const part of m[1].split(',')) add(part.trim().split(/\s+/)[0]);
      for (const m of h.matchAll(/url\((['"]?)([^'")]+)\1\)/g)) add(m[2]);
    }
  };
  walk(DIST);
  return [...refs];
}

function decodePath(ref) {
  return '/' + ref.replace(/^\//, '').split('/').map((s) => { try { return decodeURIComponent(s); } catch { return s; } }).join('/');
}

async function main() {
  const refs = collectRefs();
  const missing = refs.filter((ref) => !fs.existsSync(path.join(PUBLIC, decodePath(ref))));
  console.log(`referenced /wp-content assets: ${refs.length}, missing locally: ${missing.length}`);
  let ok = 0, fail = 0;
  for (const ref of missing) {
    const dest = path.join(PUBLIC, decodePath(ref));
    try {
      const res = await fetch(LIVE + ref, { headers: { 'User-Agent': UA } });
      if (!res.ok) { console.error(`  ${res.status}  ${ref}`); fail++; continue; }
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
      ok++;
    } catch (e) { console.error(`  ERR ${e.message}  ${ref}`); fail++; }
  }
  console.log(`downloaded ${ok}, failed ${fail}`);
}
main().catch((e) => { console.error(e); process.exit(1); });
