// Post-build rewrite for hosting under a sub-path (GitHub Pages project URL).
// The site is authored with root-absolute paths (/wp-content/…, /event/, …) which
// are correct for the eventual custom domain at root. For a project-page preview
// (https://<org>.github.io/<repo>/) every root-absolute reference needs the base
// prefix. Run AFTER `astro build`:  node scripts/rebase.mjs /reality-science
// Idempotent: a negative lookahead skips already-prefixed URLs. Skipping this step
// (custom-domain cutover at root) leaves the build untouched.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.resolve(__dirname, '../dist');
let base = process.argv[2] || '';
if (!base) { console.error('usage: node scripts/rebase.mjs /<base>'); process.exit(1); }
base = '/' + base.replace(/^\/|\/$/g, '');             // normalize to /reality-science
const b = base.slice(1);                                // reality-science (for lookahead)

// negative lookahead so we never double-prefix or touch //, http, data:, mailto:, #
const NEG = `(?!\\/|${b}\\/|http|data:|mailto:|tel:|#)`;

function rewrite(content, isCss) {
  if (isCss) {
    return content.replace(new RegExp(`url\\((['"]?)\\/${NEG}`, 'g'), `url($1${base}/`);
  }
  let s = content;
  // href/src/action/poster attributes
  s = s.replace(new RegExp(`(\\s(?:href|src|action|poster)=")\\/${NEG}`, 'g'), `$1${base}/`);
  // srcset: rewrite each candidate URL
  s = s.replace(/(\ssrcset=")([^"]*)"/g, (_, pre, val) => {
    const fixed = val.replace(new RegExp(`(^|,\\s*)\\/${NEG}`, 'g'), `$1${base}/`);
    return `${pre}${fixed}"`;
  });
  // inline + <style> CSS url()
  s = s.replace(new RegExp(`url\\((['"]?)\\/${NEG}`, 'g'), `url($1${base}/`);
  // JSON-escaped asset paths inside inline scripts (Elementor config etc.)
  s = s.replace(new RegExp(`\\\\\\/(wp-content|wp-includes|assets)\\\\\\/`, 'g'), `\\/${b}\\/$1\\/`);
  return s;
}

function walk(dir) {
  let n = 0;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) { n += walk(p); continue; }
    const ext = path.extname(ent.name).toLowerCase();
    if (ext !== '.html' && ext !== '.css') continue;
    const before = fs.readFileSync(p, 'utf8');
    const after = rewrite(before, ext === '.css');
    if (after !== before) { fs.writeFileSync(p, after); n++; }
  }
  return n;
}

const count = walk(DIST);
console.log(`rebased ${count} files under base ${base}`);
