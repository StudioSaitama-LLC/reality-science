# 現実科学ラボ — reality-science.com

WordPress + Elementor で運用していた「現実科学ラボ」サイトを、**静的サイト + Markdown 記事システム**として再構築したもの。CMS 不要・Claude Code で `.md` を 1 枚追加するだけで記事が増え、GitHub Actions が GitHub Pages へ自動デプロイする。

## 🧑‍🤝‍🧑 運用する人はここから

| 目的 | ドキュメント |
|---|---|
| はじめての人（設置〜最初の一歩） | **[導入ガイド](docs/getting-started.md)** |
| 運用全般（記事・写真・資材・公開確認・困ったとき） | **[運用マニュアル](docs/operations.md)** |
| 記事を追加する詳細手順 | [記事の追加方法](docs/adding-articles.md) |
| 技術的な決まり（開発・Claude Code 向け） | [CLAUDE.md](CLAUDE.md) |

以降は技術構成の説明（運用だけなら上記の3ドキュメントで足ります）。

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

正本の手順 → [docs/adding-articles.md](docs/adding-articles.md)。Claude Code 利用時はリポジトリ同梱スキル **`/add-article`** が同じ手順を案内する。

ざっくり:
1. `node scripts/new-article.mjs vol-74 "Vol.74 …（2026/8/25開催）" event,news`
2. 画像を `public/wp-content/uploads/YYYY/MM/` に置き、本文 `.md` を書く
3. frontmatter の `draft: true` を外す
4. ブランチを切って commit → PR（main マージで GitHub Actions が自動ビルド・デプロイ）

permalink は `date` と `slug` から `/YYYY/MM/slug/` を自動生成（旧 WordPress と同一構造）。記事を1本足すと **HOME の NEWS / NEXT LECTURE / LECTURE グリッドも自動更新**される。

## 移行スクリプト（再実行可能・通常は不要）

`_dump/extracted/database.sql` と旧サイトを入力に、初期データを生成したもの。

| script | 役割 |
|---|---|
| `scripts/migrate-posts.mjs` | DB の 87 投稿 → `src/content/articles/*.md` |
| `scripts/fetch-media.mjs` | 記事参照画像のみDL→最適化→`public/wp-content/uploads/` |
| `scripts/mirror-chrome.mjs` | 旧サイトの CSS/JS/font を `public/` に vendoring |
| `scripts/build-shell.mjs` | 旧 HTML を `src/mirror/` のフラグメントに carve |
| `scripts/fetch-missing.mjs` | `npm run build` 後、dist の全 `/wp-content` 参照を走査し未取得アセットをライブから補完 |
| `scripts/normalize-nfc.mjs` | 画像ファイル名と参照を NFC に統一（macOS の NFD で Linux/Pages が 404 する不具合対策） |

> **注意（macOS の落とし穴）**: macOS は日本語ファイル名を NFD で保持するが、GitHub Pages(Linux) はバイト厳密一致。濁点付き（が/ボ等）のファイル名は **ローカルでは 200 でもライブで 404** になる。`normalize-nfc.mjs` で対処済み。画像周りの不具合はローカルでなく**ライブURLで**確認すること。

## デプロイ

`main` への push で `.github/workflows/deploy.yml` が `npm run build` → GitHub Pages へ。

独自ドメイン `reality-science.com` への切替（DNS カットオーバー）は**本番サイトを止める操作**のため別ステップ。`public/CNAME` の追加と DNS 変更を行う段階で実施する。

## 未対応 / TODO

- **CONTACT フォーム**: 旧 Contact Form 7 はサーバ処理が必要なため静的では送信不可。バックエンド（Cloudflare Worker / Formspree / mailto 等）を確定して差し替える。

> HOME の NEWS / NEXT LECTURE / LECTURE グリッドは記事コレクション駆動で**自動更新済み**（アーカイブ `/event/` `/news/` 同様、記事 `.md` を足すだけで反映。`src/pages/index.astro`）。
