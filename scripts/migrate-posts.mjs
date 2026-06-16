// Convert the 87 published WordPress posts in _dump/extracted/database.sql into
// Markdown files under src/content/articles/. Run: npm run migrate:posts
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import TurndownService from 'turndown';
import { gfm } from 'turndown-plugin-gfm';
import { streamTables, toObj } from './lib/wpdb.mjs';
import { rewriteContentUrls, safeFilename } from './lib/urls.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DB = path.join(ROOT, '_dump/extracted/database.sql');
const OUT = path.join(ROOT, 'src/content/articles');

const DEFAULT_SERIES = '現実科学レクチャーシリーズ';

function decodeEntities(s) {
  if (!s) return s;
  return s
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/&#8217;/g, '’')
    .replace(/&#8216;/g, '‘').replace(/&#8211;/g, '–').replace(/&#8212;/g, '—')
    .replace(/&#8230;/g, '…').replace(/&nbsp;/g, ' ').replace(/&#038;/g, '&');
}

function yamlStr(s) {
  return '"' + String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';
}

// WP [caption]...[/caption] shortcode -> <figure>/<figcaption>
function expandCaptions(html) {
  return html.replace(/\[caption[^\]]*\]([\s\S]*?)\[\/caption\]/g, (_, inner) => {
    const imgMatch = inner.match(/<img[\s\S]*?>(?:<\/a>)?/i) || inner.match(/<a[\s\S]*?<\/a>/i);
    const img = imgMatch ? imgMatch[0] : inner;
    const caption = inner.replace(img, '').trim();
    return `<figure>${img}${caption ? `<figcaption>${caption}</figcaption>` : ''}</figure>`;
  });
}

const td = new TurndownService({
  headingStyle: 'atx',
  bulletListMarker: '-',
  codeBlockStyle: 'fenced',
  emDelimiter: '*',
  hr: '---',
});
td.use(gfm);
td.keep(['iframe']); // preserve YouTube / external embeds as raw HTML in the .md

function htmlToMarkdown(html) {
  let s = html || '';
  s = s.replace(/<!--[\s\S]*?-->/g, '');     // drop balanced HTML / Gutenberg comments
  s = s.replace(/<!--|-->/g, '');            // drop orphan comment markers (malformed source)
  s = expandCaptions(s);
  s = rewriteContentUrls(s);
  let md = td.turndown(s);
  md = md.replace(/\n{3,}/g, '\n\n').trim();
  return md;
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });

  const posts = [];
  const attachedFile = new Map();   // attachmentId -> 'YYYY/MM/file'
  const thumbOf = new Map();        // postId -> attachmentId
  const termSlug = new Map();       // term_id -> slug
  const catTermOfTt = new Map();    // term_taxonomy_id -> term_id (category only)
  const ttOfObject = new Map();     // object_id -> [term_taxonomy_id]

  await streamTables(DB, ['posts', 'postmeta', 'terms', 'term_taxonomy', 'term_relationships'], (t, row) => {
    const o = toObj(t, row);
    if (t === 'posts') {
      if (o.post_type === 'post' && o.post_status === 'publish') posts.push(o);
    } else if (t === 'postmeta') {
      if (o.meta_key === '_wp_attached_file') attachedFile.set(o.post_id, o.meta_value);
      else if (o.meta_key === '_thumbnail_id') thumbOf.set(o.post_id, o.meta_value);
    } else if (t === 'terms') {
      termSlug.set(o.term_id, o.slug);
    } else if (t === 'term_taxonomy') {
      if (o.taxonomy === 'category') catTermOfTt.set(o.term_taxonomy_id, o.term_id);
    } else if (t === 'term_relationships') {
      const arr = ttOfObject.get(o.object_id) || [];
      arr.push(o.term_taxonomy_id);
      ttOfObject.set(o.object_id, arr);
    }
  });

  let written = 0;
  const usedNames = new Set();
  for (const p of posts) {
    const id = p.ID;
    const slug = p.post_name;
    const date = p.post_date.slice(0, 10);
    const title = decodeEntities(p.post_title);

    // categories (slugs) for this post
    const cats = (ttOfObject.get(id) || [])
      .filter((tt) => catTermOfTt.has(tt))
      .map((tt) => termSlug.get(catTermOfTt.get(tt)))
      .filter(Boolean);

    // featured image
    let featured = '';
    const att = thumbOf.get(id);
    if (att && attachedFile.has(att)) featured = '/wp-content/uploads/' + attachedFile.get(att);

    const excerpt = decodeEntities((p.post_excerpt || '').trim());
    const body = htmlToMarkdown(p.post_content);

    const fm = ['---'];
    fm.push(`title: ${yamlStr(title)}`);
    fm.push(`date: ${date}`);
    fm.push(`slug: ${yamlStr(slug)}`);
    fm.push(`categories: [${cats.join(', ')}]`);
    fm.push(`series_label: ${yamlStr(DEFAULT_SERIES)}`);
    if (featured) fm.push(`featured_image: ${yamlStr(featured)}`);
    if (excerpt) fm.push(`excerpt: ${yamlStr(excerpt)}`);
    fm.push(`wp_id: ${Number(id)}`);
    fm.push('---');

    let fname = safeFilename(slug, id);
    if (usedNames.has(fname)) fname = `${fname}-${id}`;
    usedNames.add(fname);

    fs.writeFileSync(path.join(OUT, `${fname}.md`), fm.join('\n') + '\n\n' + body + '\n');
    written++;
  }

  console.log(`migrated ${written} posts -> ${path.relative(ROOT, OUT)}`);
  // quick category tally
  const tally = {};
  for (const p of posts) {
    for (const tt of (ttOfObject.get(p.ID) || [])) {
      if (catTermOfTt.has(tt)) {
        const s = termSlug.get(catTermOfTt.get(tt));
        tally[s] = (tally[s] || 0) + 1;
      }
    }
  }
  console.log('category tally:', tally);
}

main().catch((e) => { console.error(e); process.exit(1); });
