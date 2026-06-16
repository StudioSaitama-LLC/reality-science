// One-time extraction: carve the mirrored live HTML (_mirror/*.html) into reusable
// fragments under src/mirror/ that the Astro layouts/pages assemble. Re-runnable.
//   node scripts/build-shell.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const MIRROR = path.join(ROOT, '_mirror');
const OUT = path.join(ROOT, 'src/mirror');
fs.mkdirSync(OUT, { recursive: true });

const manifest = JSON.parse(fs.readFileSync(path.join(MIRROR, 'manifest.json'), 'utf8'));
const read = (n) => fs.readFileSync(path.join(MIRROR, `${n}.html`), 'utf8');

// --- URL / analytics cleanup -------------------------------------------------
function clean(html) {
  let s = html;
  s = s.replace(/https?:\/\/reality-science\.com\/wp\/wp-content\//g, '/wp-content/');
  s = s.replace(/https?:\/\/reality-science\.com\/wp\/wp-includes\//g, '/wp-includes/');
  s = s.replace(/\/wp\/wp-content\//g, '/wp-content/');
  s = s.replace(/\/wp\/wp-includes\//g, '/wp-includes/');
  s = s.replace(/https?:\/\/reality-science\.com\//g, '/');
  s = s.replace(/https?:\/\/reality-science\.com\b/g, '/'); // bare domain (logo/home link)
  return s;
}

// --- balanced <div> matcher --------------------------------------------------
function extractBalancedDiv(html, openIdx) {
  const tagRe = /<(\/?)div\b[^>]*>/gi;
  tagRe.lastIndex = openIdx;
  let depth = 0, m;
  while ((m = tagRe.exec(html)) !== null) {
    depth += m[1] === '/' ? -1 : 1;
    if (depth === 0) return [html.slice(openIdx, tagRe.lastIndex), tagRe.lastIndex];
  }
  return [html.slice(openIdx), html.length];
}
function divByAttr(html, attr) {
  const i = html.indexOf(attr);
  if (i < 0) return null;
  return html.lastIndexOf('<div', i);
}
function elementorBlock(html, type) {
  const open = divByAttr(html, `data-elementor-type="${type}"`);
  if (open == null) return '';
  return extractBalancedDiv(html, open)[0];
}
// Remove per-page "current page" nav markers so the shared header doesn't force a
// highlight on the wrong item across every page.
function stripCurrentMarkers(html) {
  return html
    .replace(/\s*\bcurrent[-_](?:menu-item|page-item|menu-ancestor|menu-parent|page-ancestor)\b/g, '')
    .replace(/\s*aria-current="[^"]*"/g, '');
}

// --- head pieces -------------------------------------------------------------
function bodyClass(html) {
  const m = html.match(/<body[^>]*class="([^"]+)"/);
  return m ? m[1] : '';
}
function headOf(html) {
  const m = html.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
  return m ? m[1] : '';
}
function inlineStyles(headHtml) {
  return [...headHtml.matchAll(/<style[^>]*>[\s\S]*?<\/style>/gi)].map((m) => m[0]).join('\n');
}
function favicons(headHtml) {
  return [...headHtml.matchAll(/<link[^>]+rel=["'](?:icon|shortcut icon|apple-touch-icon|mask-icon)["'][^>]*>/gi)]
    .map((m) => m[0]).join('\n');
}
function googleFontsLink(headHtml) {
  const m = headHtml.match(/<link[^>]+href=["'][^"']*fonts\.googleapis\.com[^"']*["'][^>]*>/i);
  return m ? m[0].replace(/&#0?38;/g, '&') : '';
}

// --- scripts (from body), minus analytics -----------------------------------
function bodyScripts(html) {
  const bodyM = html.match(/<body[\s\S]*<\/body>/i);
  const body = bodyM ? bodyM[0] : html;
  const tags = [...body.matchAll(/<script\b[\s\S]*?<\/script>/gi)].map((m) => m[0]);
  return tags.filter((t) => !/googletagmanager|google-analytics|gtag\(|dataLayer|UA-\d/i.test(t));
}

// ============================================================================
const home = read('home');
const about = read('about');
const article = read('article');

// 1) shared head: css links (manifest order) + google fonts + favicons
const cssLinks = manifest.cssOrder
  .map((href) => `<link rel="stylesheet" href="${href}" />`).join('\n');
const headLinks = [
  cssLinks,
  googleFontsLink(headOf(home)),
  clean(favicons(headOf(home))),
].filter(Boolean).join('\n');
fs.writeFileSync(path.join(OUT, 'head-links.html'), headLinks + '\n');

// 2) header variants + footer. Inner header is taken from the article page (a
// neutral page that highlights no menu item); current-page markers are stripped.
fs.writeFileSync(path.join(OUT, 'header-home.html'), clean(stripCurrentMarkers(elementorBlock(home, 'header'))) + '\n');
fs.writeFileSync(path.join(OUT, 'header-inner.html'), clean(stripCurrentMarkers(elementorBlock(article, 'header'))) + '\n');
fs.writeFileSync(path.join(OUT, 'footer.html'), clean(elementorBlock(home, 'footer')) + '\n');

// 3) scripts partial (from home; same set on every page)
fs.writeFileSync(path.join(OUT, 'scripts.html'), clean(bodyScripts(home).join('\n')) + '\n');

// 4) per-page: head inline styles + body content (header/footer/scripts removed)
function pageBody(html) {
  const bodyM = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  let body = bodyM ? bodyM[1] : html;
  for (const type of ['header', 'footer']) {
    const block = elementorBlock(html, type);
    if (block) body = body.replace(block, '');
  }
  body = body.replace(/<script\b[\s\S]*?<\/script>/gi, '');
  return clean(body).trim();
}
for (const [name, html] of [['home', home], ['about', about], ['join', read('join')], ['contact', read('contact')], ['event', read('event')]]) {
  fs.writeFileSync(path.join(OUT, `${name}.head.html`), clean(inlineStyles(headOf(html))) + '\n');
  fs.writeFileSync(path.join(OUT, `${name}.body.html`), pageBody(html) + '\n');
  fs.writeFileSync(path.join(OUT, `${name}.bodyclass.txt`), bodyClass(html));
}

// 5) ARTICLE template: extract single-post(1712), templatize 3 injection points
let art = elementorBlock(article, 'single-post');
// 5a. series label
art = art.replace('現実科学レクチャーシリーズ', '<!--RS_SERIES-->');
// 5b. title: replace text inside elementor-heading-title within page-title widget
{
  const ptIdx = art.indexOf('elementor-page-title');
  const htIdx = art.indexOf('elementor-heading-title', ptIdx);
  const gt = art.indexOf('>', htIdx);
  const lt = art.indexOf('<', gt + 1);
  art = art.slice(0, gt + 1) + '<!--RS_TITLE-->' + art.slice(lt);
}
// 5c. post-content: replace inner of the widget-container under theme-post-content
{
  const pcIdx = art.indexOf('elementor-widget-theme-post-content');
  const wcIdx = art.indexOf('<div class="elementor-widget-container">', pcIdx);
  const [block, end] = extractBalancedDiv(art, wcIdx);
  const openTagEnd = wcIdx + '<div class="elementor-widget-container">'.length;
  const closeLen = '</div>'.length;
  art = art.slice(0, openTagEnd) + '<!--RS_CONTENT-->' + art.slice(end - closeLen);
}
fs.writeFileSync(path.join(OUT, 'article.shell.html'), clean(art) + '\n');
fs.writeFileSync(path.join(OUT, 'article.head.html'), clean(inlineStyles(headOf(article))) + '\n');
fs.writeFileSync(path.join(OUT, 'article.bodyclass.txt'), bodyClass(article));

// 6) ARCHIVE template (shared by every category archive; carved from /event/).
//    Templatize the page title and the cards-grid contents; drop pagination.
{
  let arch = pageBody(read('event'));
  const pcIdx = arch.indexOf('elementor-posts-container');
  const open = arch.lastIndexOf('<div', pcIdx);
  const [, end] = extractBalancedDiv(arch, open);
  const openTagEnd = arch.indexOf('>', open) + 1;
  arch = arch.slice(0, openTagEnd) + '<!--RS_CARDS-->' + arch.slice(end - '</div>'.length);
  arch = arch.replace(/(<h1[^>]*>)[\s\S]*?(<\/h1>)/, '$1<!--RS_TITLE-->$2');
  arch = arch.replace(/<nav class="elementor-pagination"[\s\S]*?<\/nav>/g, '');
  fs.writeFileSync(path.join(OUT, 'archive.shell.html'), arch + '\n');
}

console.log('shell fragments written to src/mirror/');
for (const f of fs.readdirSync(OUT)) {
  console.log(`  ${String(fs.statSync(path.join(OUT, f)).size).padStart(8)}  ${f}`);
}
