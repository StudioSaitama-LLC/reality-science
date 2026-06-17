# 運用マニュアル

現実科学ラボの**サイト**と**資材**を運用するための逆引きガイド。はじめての人は先に [導入ガイド](getting-started.md) を。

## 運用の原則（これだけ守る）

- あなたが触るのは **Markdown ファイルと写真、そして「ブランチ」だけ**。
- 公開は **PR をマージすると自動**（GitHub Actions → 数分で反映）。
- **トップページ（HOME）は自動更新**。記事を足せば NEWS・NEXT LECTURE・レクチャー一覧に勝手に並ぶ。**手で直さない**。
- **`main` に直接 push しない**。必ずブランチを切って PR。

---

## やりたいこと別ガイド

### 📝 記事を追加する
→ [記事の追加方法](adding-articles.md)。雛形コマンド → 写真を置く → 本文 → `draft` を外す → PR。

### ✏️ 記事を直す（誤字・内容修正）
1. `src/content/articles/<slug>.md` を編集する。
2. `npm run dev` で http://localhost:4321/ を見て確認。
3. ブランチを切って commit → PR。

### 🙈 記事を一時的に下げる / 完全に消す
- **一時的に非公開**: その記事の frontmatter を `draft: true` にして PR。サイトから消える（ファイルは残る）。
- **完全に削除**: `src/content/articles/<slug>.md` を削除して PR。（迷ったらまず `draft: true` を推奨。）

### 🖼 写真を追加・差し替える
- 置き場所は **`public/wp-content/uploads/YYYY/MM/`**（記事の `date` の年月。雛形コマンドが作成する）。
- 本文では `public/` を除いた **`/wp-content/uploads/YYYY/MM/ファイル名`** で参照。
- **ファイル名は英数字を推奨**（例 `vol74_banner.jpg`）。日本語・濁点を含む名前は本番で表示されないことがある（→[トラブルシュート](#トラブルシュート)）。
- アイキャッチは frontmatter の `featured_image` に同じパスを入れる（トップ・一覧・OGP のサムネになる）。

### 🏠 トップページ（HOME）の表示について
- NEWS / NEXT LECTURE / レクチャー一覧は **記事から自動生成**される。原則さわらない。
  - **NEWS** = 公開日の新しい順に4件
  - **NEXT LECTURE** = これから開催される最も近いレクチャー（タイトルの `（YYYY/M/D開催）` で判定）
  - **レクチャー一覧（グリッド）** = `event` カテゴリの最新3件
- だから「トップに新しいレクチャーを出す」には、**記事を1本追加するだけ**でよい。
- ヒーロー画像やキャッチコピーなど“固定の見た目”を変えたいときは Markdown では変えられない。**@Chiaki / 開発に相談**（`src/mirror/` を直接いじらない）。

### 📄 研究所の資材（趣意書・プレスリリース・議事録・デザイン）を更新する
- 置き場所は **`institute/docs/`**（`manifesto.md`、`press-release-vX.Y.md`、`design.md`、`meetings/` など）。サイトには出ない**内部の正本ドキュメント**。
- 更新は Markdown を編集 → ブランチ → PR。バージョンを切るもの（プレスリリース等）は **新しい版を別ファイル**で足し、古い版は残す（履歴を消さない）。

### 🚀 研究所 LP を更新・公開する
- LP の中身は **`institute/apps/lp/`**。**公開されているのは `v7`**（ビルド時に `scripts/embed-lp.mjs` が `v7` を `/institute/lp/` へコピーして配信）。
- **公開中の LP の文言・画像を直す** → `institute/apps/lp/v7/` の中身を編集して PR。
- **新しいバージョン（v8 など）に切り替えて公開する** → 版を足したうえで `embed-lp.mjs` の参照版を変える小さなコード変更が必要。**@Chiaki / 開発に依頼**。
- 公開 URL: `…/reality-science-site/institute/lp/`

### ✅ 公開されたか確認する
1. PR がマージされると、GitHub の **Actions タブ**でビルドが走る（緑のチェックで成功）。
2. 数分後、ライブ URL（https://studiosaitama-llc.github.io/reality-science-site/ ）を**スーパーリロード**して確認。
3. **画像の確認は必ずライブ URL で**（ローカルで見えても本番で出ないケースがあるため。下記）。

---

## やってはいけないこと

- `main` に直接 push する（必ずブランチ → PR）。
- トップページや `src/mirror/` を手で書き換える（自動生成・忠実ミラーのため壊れる）。
- 原稿やコードに本番ドメイン URL（`https://reality-science.com/...`）を直書きする。
- `_dump/`・`dist/`・`public/institute/`（自動生成物）をコミットする。

---

## トラブルシュート

| 症状 | 原因 | 対処 |
|---|---|---|
| **画像がローカルでは出るのに本番で出ない** | ファイル名の文字コード（macOS 特有の NFD）と Linux の不一致。濁点・半濁点を含む名前で起きやすい | ファイル名を英数字にする。直せないときは開発に `node scripts/normalize-nfc.mjs` を依頼。**画像確認は必ずライブ URL で** |
| **記事を出したのにサイトに出ない** | ① `draft: true` のまま ② PR が main にマージされていない ③ 反映前 ④ ブラウザキャッシュ | ① `draft` を外す ② Actions が緑か確認 ③ 数分待つ ④ スーパーリロード |
| **トップに新着が反映されない** | 記事の `date` が古い／タイトルに `（…開催）` 日付が無い | `date` と タイトルの開催日を確認（NEXT/並びはこの日付で決まる） |
| **`npm run dev` / `build` がエラー** | `npm install` 未実行、または Markdown の frontmatter の書式ミス（`:` やインデント） | `npm install` を実行。frontmatter を [リファレンス](adding-articles.md#frontmatter-リファレンス)と見比べる |
| **`gh` で PR が作れない / `command not found`** | GitHub CLI 未導入・未ログイン | `brew install gh` → `gh auth login`。または `git push` 後に表示される URL をブラウザで開いて PR を作る |
| **`git push` で認証を聞かれて通らない** | HTTPS の push にはトークンが必要 | GitHub の Personal Access Token を使うか、`gh auth login` 済みなら gh 経由で push |

---

## 連絡・エスカレーション

- まずこのマニュアルと [記事の追加方法](adding-articles.md) を確認。
- 解決しない、または**固定デザイン・LP のバージョン切替・ドメイン切替**など Markdown で完結しない変更は **@Chiaki / 開発** へ。
- Claude Code を使う人は、リポジトリ同梱スキル **`/add-article`** が記事追加を案内します。技術的な決まりは [`CLAUDE.md`](../CLAUDE.md) を参照。
