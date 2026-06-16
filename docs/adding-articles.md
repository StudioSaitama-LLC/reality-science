# 記事の追加方法（CMS 不要）

記事は `src/content/articles/` 配下の Markdown ファイル 1 枚 = 1 記事。CMS もログインも不要で、ファイルを足して push するだけ。

## 手順

### 1. 雛形を作る

```bash
node scripts/new-article.mjs <slug> "<タイトル>" <カテゴリ,カテゴリ>
# 例
node scripts/new-article.mjs vol-74 "Vol.74 ○○さんレクチャー（2026/8/25開催）" event,news
```

`src/content/articles/vol-74.md` が `draft: true` で作られる。

### 2. 画像を置く

アイキャッチや本文画像は `public/wp-content/uploads/YYYY/MM/` に配置し、`/wp-content/uploads/YYYY/MM/ファイル名` で参照する。

```markdown
![](/wp-content/uploads/2026/08/vol74_banner.jpg)
```

frontmatter の `featured_image` に同じパスを入れると、一覧カードと OGP に使われる。

### 3. 本文を書く

Markdown で記述。YouTube 等の埋め込みは `<iframe>` をそのまま書いてよい（生 HTML 可）。

### 4. 公開する

frontmatter の `draft: true` を削除（または `false`）。

```bash
npm run build      # ローカル確認（任意）
git add src/content/articles/vol-74.md public/wp-content/uploads/2026/08/
git commit -m "記事追加: Vol.74 ○○さんレクチャー"
git push           # → GitHub Actions が自動デプロイ
```

## frontmatter リファレンス

```yaml
---
title: "Vol.74 ○○さんレクチャー（2026/8/25開催）"  # 必須
date: 2026-06-17            # 必須。permalink の年月（/2026/06/）はここから導出
slug: vol-74               # 必須。permalink は /YYYY/MM/<slug>/
categories: [event, news]  # event=LECTURE / news=NEWS / workshop / pr
series_label: "現実科学レクチャーシリーズ"   # 記事上部の小見出し
featured_image: "/wp-content/uploads/2026/08/vol74_banner.jpg"
excerpt: "一覧・OGP 用の抜粋（任意）"
draft: false               # true の間は公開されない
---
```

## カテゴリと一覧ページの対応

| カテゴリ slug | 表示名 | 一覧 URL |
|---|---|---|
| `event` | LECTURE | `/event/` |
| `news` | NEWS | `/news/` |
| `workshop` | WORKSHOP | `/workshop/` |
| `pr` | PR | `/news/pr/` |

`categories` に含めたカテゴリの一覧ページに、新着順で自動的に並ぶ。
