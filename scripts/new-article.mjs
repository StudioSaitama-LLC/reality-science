// 記事 Markdown の雛形を作る。CMS 不要・誰がやっても同じ手順の入口。
//   node scripts/new-article.mjs <slug> "<title>" [category[,category...]]
// 例:
//   node scripts/new-article.mjs vol-74 "Vol.74 ○○さんレクチャー（2026/8/25開催）" event,news
//
// やること:
//   1) src/content/articles/<slug>.md を draft:true で生成
//   2) 写真置き場 public/wp-content/uploads/YYYY/MM/ を用意（ここに画像を入れる）
//   3) 次にやること（画像配置→本文→プレビュー→公開）を表示
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'src/content/articles');

const [slug, title, cats = 'event,news'] = process.argv.slice(2);
if (!slug || !title) {
  console.error('usage: node scripts/new-article.mjs <slug> "<title>" [category,category]');
  console.error('  例: node scripts/new-article.mjs vol-74 "Vol.74 ○○さんレクチャー（2026/8/25開催）" event,news');
  process.exit(1);
}
if (!/^[a-z0-9][a-z0-9-]*$/.test(slug)) {
  console.error(`slug は英小文字・数字・ハイフンのみ: "${slug}"（例: vol-74, 20260825_event）`);
  process.exit(1);
}

const now = new Date();
const yyyy = String(now.getFullYear());
const mm = String(now.getMonth() + 1).padStart(2, '0');
const dd = String(now.getDate()).padStart(2, '0');
const date = `${yyyy}-${mm}-${dd}`;
const categories = cats.split(',').map((c) => c.trim()).filter(Boolean);

const dest = path.join(OUT, `${slug}.md`);
if (fs.existsSync(dest)) {
  console.error(`既に存在します: ${path.relative(ROOT, dest)}（別の slug にするか、そのファイルを編集してください）`);
  process.exit(1);
}

// 写真置き場（公開日の年月）。ここに画像を入れて /wp-content/uploads/YYYY/MM/ で参照する。
const uploadsRel = `public/wp-content/uploads/${yyyy}/${mm}`;
const uploadsAbs = path.join(ROOT, uploadsRel);
fs.mkdirSync(uploadsAbs, { recursive: true });

const tpl = `---
title: "${title.replace(/"/g, '\\"')}"
date: ${date}
slug: ${slug}
categories: [${categories.join(', ')}]
series_label: "現実科学レクチャーシリーズ"
# アイキャッチ: HOME(NEWS/NEXT LECTURE/LECTURE グリッド)・一覧カード・OGP に使われる。
# ↓この1行の先頭 # を外し、ファイル名を実際に置いた画像に書き換える:
# featured_image: "/wp-content/uploads/${yyyy}/${mm}/${slug}.jpg"
# excerpt: "一覧・OGP 用の抜粋（任意）"
draft: true
---

ここに本文を Markdown で書きます。画像は ${uploadsRel}/ に置き、
\`![代替テキスト](/wp-content/uploads/${yyyy}/${mm}/ファイル名.jpg)\` で参照します。
YouTube 等の埋め込みは <iframe> をそのまま貼って構いません（生 HTML 可）。

## 概要

-   開催日時：
-   参加費用：無料
-   参加方法：
`;

fs.writeFileSync(dest, tpl);

const permalink = `/${yyyy}/${mm}/${slug}/`;
console.log('');
console.log('✓ 記事の雛形を作成しました');
console.log(`  記事ファイル : ${path.relative(ROOT, dest)}`);
console.log(`  写真置き場   : ${uploadsRel}/   ← ここに画像を入れる`);
console.log(`  permalink    : ${permalink}`);
console.log('');
console.log('次の手順:');
console.log(`  1. 画像を ${uploadsRel}/ に入れる`);
console.log(`  2. frontmatter の featured_image を有効化（# を外してファイル名に）`);
console.log('  3. 本文を書く');
console.log('  4. プレビュー: npm run dev  → http://localhost:4321/');
console.log('  5. 公開: frontmatter の draft:true を消す → git add/commit/push');
console.log('');
console.log('公開すると HOME の NEWS / NEXT LECTURE / LECTURE グリッドと一覧ページに自動で並びます。');
