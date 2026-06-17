---
name: add-article
description: 現実科学ラボのサイト(reality-science)に記事を1本追加する。レクチャー告知・レポート・お知らせなど。雛形生成→写真配置→本文→プレビュー→公開(PR)までを、誰がやっても同じ手順で進める。「記事を追加」「レクチャーを追加」「Vol.◯◯を載せたい」等で使う。
---

# 記事を追加する（reality-science）

このリポジトリは **CMS 不要**。`src/content/articles/` に Markdown を1枚足すだけで、記事ページ・カテゴリ一覧・**HOME の NEWS / NEXT LECTURE / LECTURE グリッド**が自動更新される。人手の手順書は [`docs/adding-articles.md`](../../../docs/adding-articles.md)（これが正本。迷ったら必ず参照）。

リポジトリ root（`package.json` のある所）で作業すること。

## 手順

### 1. 必要情報を確認する
ユーザーに（不足していれば）以下を聞く:
- **タイトル**: レクチャーは「`Vol.◯◯ 氏名さんレクチャー（YYYY/M/D開催）`」の形。**開催日を `（…開催）` の中に必ず入れる**（NEXT LECTURE と並び順がこの日付で決まるため）。
- **slug**: 英小文字・数字・ハイフン。レクチャーは `vol-74` のように連番。
- **カテゴリ**: 既定は `event,news`（event=LECTURE / news=NEWS / workshop / pr）。
- **写真**: アイキャッチ（必須級）と本文用画像。ファイルがあれば受け取る。

### 2. 雛形を生成する
```bash
node scripts/new-article.mjs <slug> "<タイトル>" <カテゴリ,カテゴリ>
```
出力された「記事ファイル」「写真置き場（`public/wp-content/uploads/YYYY/MM/`）」「permalink」を控える。

### 3. 写真を置く
画像を、出力された `public/wp-content/uploads/YYYY/MM/` に配置する（**この年月＝公開日の年月**。scaffolder が作成済み）。

### 4. 記事を仕上げる
生成された `src/content/articles/<slug>.md` を編集:
- `# featured_image: "…"`（パスが書かれた1行）の先頭 `#` だけを外し、置いた画像名にする（例 `/wp-content/uploads/2026/08/<slug>.jpg`）。説明文のコメント行は残す。
- 本文を Markdown で記述。本文画像は `![alt](/wp-content/uploads/YYYY/MM/ファイル名)`、YouTube 等は `<iframe>` 生 HTML 可。

### 5. プレビューで確認する
```bash
npm run dev        # http://localhost:4321/ で確認（記事の見た目はこれで十分）
```
HOME 先頭の NEWS / LECTURE グリッド / NEXT LECTURE に新記事が反映されること、記事ページが開けることを確認。公開前の最終チェックには `npm run build`（HOME 差し替えの anchor 検証も兼ねる。落ちたら出荷しない）。

### 6. 公開する（PR 経由・main 直 push 禁止）
`draft: true` を削除（または `false`）してから:
```bash
git switch -c post/<slug>
git add src/content/articles/<slug>.md public/wp-content/uploads/YYYY/MM/
git commit -m "記事追加: <タイトル>"
```
**push と PR 作成の前にユーザーへ確認を取る。** 了承後:
```bash
git push -u origin post/<slug>
gh pr create --fill
```
`gh` 未導入なら、push 後に表示される PR 作成 URL をブラウザで開く。main にマージされると GitHub Actions が自動デプロイする。

## 守ること
- **画像の確認はライブ URL で**。macOS のファイル名は NFD 保持で、Linux(Pages) とバイト不一致になり濁点入り名が **ローカル 200 でもライブ 404** になる。心配なら `node scripts/normalize-nfc.mjs` を通す。
- `npm run build` が落ちたら出荷しない（HOME の splice anchor 不一致などを検知する設計）。
- main へ直接 push しない。push / PR は必ずユーザー確認後。
