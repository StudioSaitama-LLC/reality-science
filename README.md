# 現実科学ラボ — reality-science.com

WordPress + Elementor で運用していた「現実科学ラボ」サイトを、**静的サイト + Markdown 記事システム**として再構築したもの。CMS 不要・Claude Code で `.md` を 1 枚追加するだけで記事が増え、GitHub Actions が GitHub Pages へ自動デプロイする。

## 技術スタック

| 領域 | 採用 |
|---|---|
| サイトジェネレータ | [Astro](https://astro.build/)（完全静的出力 / content collections） |
| 記事 | `src/content/articles/*.md`（frontmatter + 本文） |
| デザイン | 旧 Elementor の外枠（header/footer/HOME/記事テンプレ）を**忠実ミラー**。CSS/JS/webfont は `public/` に vendoring（Google Fonts のみ CDN のまま＝原本と同じ） |
| メディア | 記事が参照する画像のみ `public/wp-content/uploads/` に同梱（最適化済み） |
| デプロイ | GitHub Actions → GitHub Pages（`.github/workflows/deploy.yml`） |

## ディレクトリ

```
src/
  content/articles/   # 記事 .md（87本 + 追加分）。SSoT
  content.config.ts   # 記事スキーマ（zod）
  layouts/            # BaseLayout / ArticleLayout / ArchiveLayout
  components/         # SiteHeader 等は mirror から、PostCard
  mirror/             # 旧サイトから carve した HTML/CSS フラグメント（ビルド入力・要コミット）
  pages/              # index / about / join / contact / [year]/[month]/[slug] / event 等アーカイブ / 404
  lib/posts.ts        # 記事一覧・カテゴリ抽出ヘルパー
public/
  assets/ wp-content/ wp-includes/   # vendoring したCSS/JS/font + 画像
scripts/              # 移行・ミラー用ワンショット（_dump を入力に使う）
_dump/                # WordPress ダンプ（gitignore・巨大・ビルドには不要）
_mirror/              # 旧サイトの生HTML（build-shell の入力）
```

## 開発

```bash
npm install
npm run dev        # 開発サーバ
npm run build      # dist/ に静的出力
npm run preview    # ビルド結果をプレビュー
```

## 記事を追加する（CMS 不要フロー）

→ [docs/adding-articles.md](docs/adding-articles.md)

ざっくり:
1. `node scripts/new-article.mjs vol-74 "Vol.74 …（2026/8/25開催）" event,news`
2. 画像を `public/wp-content/uploads/YYYY/MM/` に置き、本文 `.md` を書く
3. frontmatter の `draft: true` を外す
4. commit & push → GitHub Actions が自動ビルド・デプロイ

permalink は `date` と `slug` から `/YYYY/MM/slug/` を自動生成（旧 WordPress と同一構造）。

## 移行スクリプト（再実行可能・通常は不要）

`_dump/extracted/database.sql` と旧サイトを入力に、初期データを生成したもの。

| script | 役割 |
|---|---|
| `scripts/migrate-posts.mjs` | DB の 87 投稿 → `src/content/articles/*.md` |
| `scripts/fetch-media.mjs` | 記事参照画像のみDL→最適化→`public/wp-content/uploads/` |
| `scripts/mirror-chrome.mjs` | 旧サイトの CSS/JS/font を `public/` に vendoring |
| `scripts/build-shell.mjs` | 旧 HTML を `src/mirror/` のフラグメントに carve |

## デプロイ

`main` への push で `.github/workflows/deploy.yml` が `npm run build` → GitHub Pages へ。

独自ドメイン `reality-science.com` への切替（DNS カットオーバー）は**本番サイトを止める操作**のため別ステップ。`public/CNAME` の追加と DNS 変更を行う段階で実施する。

## 未対応 / TODO

- **CONTACT フォーム**: 旧 Contact Form 7 はサーバ処理が必要なため静的では送信不可。バックエンド（Cloudflare Worker / Formspree / mailto 等）を確定して差し替える。
- **HOME の NEWS / NEXT LECTURE**: 現状は移行時点のスナップショット。記事追加で自動更新したい場合は collection 駆動に置き換える（アーカイブ `/event/` `/news/` は既に collection 駆動）。
