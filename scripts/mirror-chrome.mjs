// Mirror the live site's chrome assets (CSS / JS / webfonts) into public/,
// preserving path structure (minus the /wp/ prefix) so relative url() refs in
// the CSS keep resolving. Google Fonts stays on its CDN (as in the original).
// Also saves the rendered page HTML to _mirror/ for hand-extracting header/footer.
//   node scripts/mirror-chrome.mjs
//
// ⚠️ src/pages/index.astro は HOME を動的化するため、コミット済みの
// src/mirror/home.body.html 内の特定投稿（post-4981 / vol-70・71・72）を text anchor に
// して3領域(NEWS/NEXT/グリッド)を差し替えている。home.body.html を再 carve すると
// それらの anchor が変わり build が（意図的に）落ちる。再取得したら index.astro の
// anchor 文字列を新スナップショットに合わせて更新すること。
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PUBLIC = path.join(ROOT, 'public');
const MIRROR = path.join(ROOT, '_mirror');
const SITE = 'https://reality-science.com';
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

const PAGES = {
  home: '/',
  article: '/2026/04/vol-73/',
  about: '/about/',
  join: '/join/',
  contact: '/contact/',
  event: '/event/',
};

const seen = new Set();

// /wp/wp-content/... -> /wp-content/... ; keep everything else
function localPath(pathname) {
  return pathname.replace(/^\/wp\//, '/');
}

async function get(url) {
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res;
}

async function saveAsset(absUrl) {
  let u;
  try { u = new URL(absUrl); } catch { return null; }
  if (u.hostname !== 'reality-science.com') return null;      // skip CDNs / Google Fonts
  const lp = localPath(u.pathname);
  if (seen.has(lp)) return lp;
  seen.add(lp);
  const dest = path.join(PUBLIC, lp);
  if (!fs.existsSync(dest)) {
    try {
      const res = await get(u.href);                          // fetch the real URL as-is
      const buf = Buffer.from(await res.arrayBuffer());
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.writeFileSync(dest, buf);
      if (lp.endsWith('.css')) await crawlCssDeps(buf.toString('utf8'), u);
    } catch (e) {
      console.error('  FAIL', u.pathname, e.message);
      return null;
    }
  }
  return lp;
}

async function crawlCssDeps(css, cssUrl) {
  const re = /url\(\s*['"]?([^'")]+?)['"]?\s*\)/g;
  let m;
  const deps = [];
  while ((m = re.exec(css)) !== null) {
    let ref = m[1].trim();
    if (ref.startsWith('data:') || ref.startsWith('#')) continue;
    deps.push(ref.split('?')[0].split('#')[0]);
  }
  for (const ref of [...new Set(deps)]) {
    try { await saveAsset(new URL(ref, cssUrl).href); } catch { /* ignore */ }
  }
}

function collectAssetUrls(html) {
  const urls = [];
  const linkRe = /<link[^>]+href=["']([^"']+)["'][^>]*>/gi;
  let m;
  while ((m = linkRe.exec(html)) !== null) {
    const tag = m[0];
    if (/rel=["'](?:stylesheet|preload|icon|apple-touch-icon|mask-icon)["']/i.test(tag)) urls.push(m[1]);
  }
  const scriptRe = /<script[^>]+src=["']([^"']+)["'][^>]*>/gi;
  while ((m = scriptRe.exec(html)) !== null) urls.push(m[1]);
  return urls;
}

async function main() {
  fs.mkdirSync(MIRROR, { recursive: true });
  const cssOrder = [];
  const jsOrder = [];
  for (const [name, p] of Object.entries(PAGES)) {
    let html;
    try { html = await (await get(SITE + p)).text(); }
    catch (e) { console.error('page fail', p, e.message); continue; }
    fs.writeFileSync(path.join(MIRROR, `${name}.html`), html);
    const assets = collectAssetUrls(html);
    for (const a of assets) {
      const abs = a.startsWith('http') ? a : (a.startsWith('//') ? 'https:' + a : SITE + a);
      const lp = await saveAsset(abs);
      if (lp && name === 'home') {
        if (lp.endsWith('.css') && !cssOrder.includes(lp)) cssOrder.push(lp);
        if (lp.endsWith('.js') && !jsOrder.includes(lp)) jsOrder.push(lp);
      }
    }
    console.log(`mirrored ${name} (${assets.length} asset refs)`);
  }
  fs.writeFileSync(path.join(MIRROR, 'manifest.json'), JSON.stringify({ cssOrder, jsOrder }, null, 2));
  console.log(`\nassets saved: ${seen.size}. manifest -> _mirror/manifest.json`);
}

main().catch((e) => { console.error(e); process.exit(1); });
