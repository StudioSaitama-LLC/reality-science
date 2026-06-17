# 記事の追加方法（CMS 不要・誰がやっても同じ手順）

このサイトは **WordPress も管理画面もログインも不要**。記事は `src/content/articles/` の Markdown ファイル **1 枚 = 1 記事**。クローンして、ファイルを足して、push（→PR）するだけで公開できる。

> Claude Code を使う人は、リポジトリ内のスキル **`/add-article`** がこの手順をそのまま案内します。この文書はその正本（人が読んでも分かる版）です。

## はじめに（1回だけ）

```bash
# 公開リポジトリなので HTTPS でそのまま clone できる（SSH 鍵は不要）
git clone https://github.com/StudioSaitama-LLC/reality-science-site.git
cd reality-science-site
npm install
```

公開（PR 作成）に GitHub CLI を使う。未導入なら一度だけ:

```bash
brew install gh      # macOS。他環境は https://cli.github.com/
gh auth login        # ブラウザでログイン（一度だけ）
```

> SSH 鍵を GitHub に登録済みなら `git@github.com:StudioSaitama-LLC/reality-science-site.git` でも clone 可。`gh` を入れない場合は、後述のとおり push 後にブラウザで PR を作ってもよい。

以降のコマンドはすべて **このフォルダ（`package.json` のある場所）** で実行する。

## ディレクトリの地図

| 置き場所 | 何を置くか |
|---|---|
| `src/content/articles/<slug>.md` | 記事本体（1記事1ファイル） |
| `public/wp-content/uploads/YYYY/MM/` | 画像（アイキャッチ・本文画像）。`YYYY/MM` は**公開日の年月** |
| `docs/adding-articles.md` | この手順書 |

記事から画像を参照するときは `/wp-content/uploads/YYYY/MM/ファイル名` と書く（`public/` は URL では省く）。

## 手順

### 1. 雛形を作る

```bash
node scripts/new-article.mjs <slug> "<タイトル>" <カテゴリ,カテゴリ>
# 例
node scripts/new-article.mjs vol-74 "Vol.74 ○○さんレクチャー（2026/8/25開催）" event,news
```

`src/content/articles/vol-74.md` が `draft: true` で作られ、**写真置き場 `public/wp-content/uploads/2026/08/` も自動で用意**される。出力に表示される置き場所と permalink を控える。

> レクチャー告知は、タイトルの **`（YYYY/M/D開催）` に開催日を必ず入れる**。HOME の「NEXT LECTURE」の並び順はこのタイトル内の日付で決まる（タイトルに最初に現れる日付を使う）。
> 一方 **permalink（`/YYYY/MM/`）と画像フォルダの年月は frontmatter の `date`（＝雛形を作った日）** で決まる。両者は別物なので、画像は手順1で表示された `uploads/YYYY/MM/` にそのまま置く（開催月のフォルダには置かない）。

### 2. 画像を置く

アイキャッチや本文画像を、手順1で表示された `public/wp-content/uploads/YYYY/MM/` に入れる。

### 3. 本文を書く

`src/content/articles/<slug>.md` を編集する。

- frontmatter で、**`# featured_image: "…"` の行（パスが書かれた1行）の先頭 `#` だけを外し**、ファイル名を実際に置いた画像に書き換える（説明文のコメント行はそのまま）。これが HOME と一覧カード・OGP のサムネになる。
- 本文を Markdown で記述。画像は `![代替テキスト](/wp-content/uploads/2026/08/ファイル名.jpg)`、YouTube などの埋め込みは `<iframe …></iframe>` をそのまま貼ってよい。

### 4. プレビューで確認する

```bash
npm run dev     # http://localhost:4321/ で確認（編集が即反映）。記事の確認はこれで十分
```

（初回で `astro が無い` 等のエラーが出たら `npm install` がまだ。先に実行する。）

HOME 先頭の **NEWS / LECTURE グリッド / NEXT LECTURE** に新記事が出ること、記事ページが開けることを見る。

公開前に本番と同じ生成で最終チェックしたい場合のみ `npm run build` を回す（研究所 LP 素材 `institute/apps/lp/` を同梱する都合で、それが無い環境では警告が出ることがあるが記事の可否とは無関係）。

### 5. 公開する（main 直 push は禁止 → ブランチ + PR）

frontmatter の `draft: true` を消して（または `false`）から:

```bash
git switch -c post/vol-74
git add src/content/articles/vol-74.md public/wp-content/uploads/2026/08/
git commit -m "記事追加: Vol.74 ○○さんレクチャー"
git push -u origin post/vol-74
gh pr create --fill        # GitHub 上で PR を作る
```

> `gh` を入れていない場合は、`git push` 後にターミナルに出る `https://github.com/StudioSaitama-LLC/reality-science-site/pull/new/post/vol-74` をブラウザで開けば PR を作れる。

PR が **main にマージされると GitHub Actions が自動でビルド & デプロイ**する。これで完了。

## 仕組み（なぜ手作業ゼロで HOME まで更新されるのか）

記事 `.md` は Astro の Content Collection に読み込まれ、ビルド時に次がすべて記事一覧から生成される:

| 自動更新される場所 | 中身 |
|---|---|
| 記事ページ `/YYYY/MM/<slug>/` | 本文 |
| カテゴリ一覧 `/event/` `/news/` … | `categories` に応じて新着順 |
| HOME › **NEWS** | 全カテゴリの新着4件（公開日順） |
| HOME › **LECTURE SERIES** グリッド | `event` の最新3件 |
| HOME › **NEXT LECTURE** | これから開催の最も近いレクチャー（タイトルの開催日で判定。無ければ最新） |

だから「記事を1枚足す」以外の編集は要らない。HOME の外枠デザインは触らずに、この3ブロックだけがビルド時に差し替わる（`src/pages/index.astro`）。

## frontmatter リファレンス

```yaml
---
title: "Vol.74 ○○さんレクチャー（2026/8/25開催）"  # 必須。開催日を（…開催）に入れる
date: 2026-06-18            # 必須。permalink の年月（/2026/06/）はここから導出
slug: vol-74               # 必須。permalink は /YYYY/MM/<slug>/
categories: [event, news]  # event=LECTURE / news=NEWS / workshop / pr
series_label: "現実科学レクチャーシリーズ"   # 記事上部の小見出し
featured_image: "/wp-content/uploads/2026/08/vol74.jpg"  # HOME・一覧・OGP のサムネ
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

## つまずきポイント

- **画像が出ない時はライブ URL（公開後の本番）で確認する。** macOS はファイル名を NFD で保持し、Pages(Linux) はバイト厳密一致のため、濁点・半濁点を含む名前は **ローカルで 200 でも本番で 404** になることがある。`node scripts/normalize-nfc.mjs` を通すと直る。ファイル名は英数字推奨。
- **`npm run build` が失敗したら公開しない。** HOME 差し替えの目印（anchor）が見つからない等を検知して止める設計。
- **main へ直接 push しない。** 必ずブランチ → PR。
