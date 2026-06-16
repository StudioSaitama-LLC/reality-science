// Scaffold a new article Markdown file. CMS-less authoring entry point.
//   node scripts/new-article.mjs <slug> "<title>" [category[,category...]]
// e.g. node scripts/new-article.mjs vol-74 "Vol.74 ○○さんレクチャー（2026/8/25開催）" event,news
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(__dirname, '../src/content/articles');

const [slug, title, cats = 'event,news'] = process.argv.slice(2);
if (!slug || !title) {
  console.error('usage: node scripts/new-article.mjs <slug> "<title>" [category,category]');
  process.exit(1);
}

const now = new Date();
const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
const categories = cats.split(',').map((c) => c.trim()).filter(Boolean);

const dest = path.join(OUT, `${slug}.md`);
if (fs.existsSync(dest)) {
  console.error(`already exists: ${dest}`);
  process.exit(1);
}

const tpl = `---
title: "${title.replace(/"/g, '\\"')}"
date: ${date}
slug: ${slug}
categories: [${categories.join(', ')}]
series_label: "現実科学レクチャーシリーズ"
# featured_image: "/wp-content/uploads/${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/your-image.jpg"
# excerpt: "一覧・OGP 用の抜粋（任意）"
draft: true
---

ここに本文を Markdown で書きます。画像は public/wp-content/uploads/ 配下に置き、
\`![代替テキスト](/wp-content/uploads/YYYY/MM/file.jpg)\` で参照します。

## 概要

-   開催日時：
-   参加費用：無料
-   参加方法：
`;

fs.writeFileSync(dest, tpl);
console.log(`created ${path.relative(path.resolve(__dirname, '..'), dest)}`);
console.log(`permalink: /${date.slice(0, 4)}/${date.slice(5, 7)}/${slug}/`);
console.log('draft:true のままだと公開されません。仕上がったら draft を外してください。');
