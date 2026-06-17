# 導入ガイド（はじめての人へ）

現実科学ラボのサイトと資材を運用するチームの最初のページ。**プログラミングの知識は不要**。やることは「テキスト（Markdown）を書いて、変更を提出する」だけで、公開は自動です。

---

## これは何？

- **サイト本体** … 現実科学ラボの Web サイト（reality-science.com）。レクチャー記事・お知らせを載せる。
- **資材** … 現実科学研究所(RSI)の LP・趣意書・プレスリリース・議事録など（`institute/` 配下）。

どちらも**ファイルを編集して提出すると、GitHub が自動でビルドして公開**します。管理画面（WordPress 等）はありません。

## 全体像（これだけ掴めば OK）

```
あなた: Markdown を書く / 写真を置く
        └─ 変更を「PR（提出）」する
              └─ レビュー後、main にマージ
                    └─ GitHub Actions が自動でビルド & 公開（数分）
```

- 記事を1本足すと、**記事ページ・一覧・トップページ（NEWS / NEXT LECTURE / レクチャー一覧）まで自動で更新**されます。手で複数箇所を直す必要はありません。
- 公開先（現時点）: **https://studiosaitama-llc.github.io/reality-science-site/** （将来 reality-science.com に切替予定）

## 必要なもの（最初に揃える）

| もの | 用途 | 入手 |
|---|---|---|
| パソコン（Mac/Windows） | 作業 | — |
| GitHub アカウント | リポジトリへのアクセス | https://github.com/ で作成 → **@Chiaki にリポジトリへの招待を依頼** |
| Node.js（LTS版） | プレビュー・ビルド | https://nodejs.org/ |
| Git | 変更の取得・提出 | https://git-scm.com/（Mac は標準で入っていることが多い） |
| エディタ | Markdown 編集 | **VS Code** 推奨 https://code.visualstudio.com/ |
| GitHub CLI `gh`（任意） | 提出(PR)を楽にする | https://cli.github.com/ |

## セットアップ（1回だけ）

ターミナル（VS Code の「ターミナル」でも可）で:

```bash
# 1. リポジトリを取得（公開なので鍵は不要）
git clone https://github.com/StudioSaitama-LLC/reality-science-site.git
cd reality-science-site

# 2. 必要部品をインストール
npm install

# 3. （任意）提出を CLI でやるなら一度だけログイン
gh auth login
```

以降のコマンドは、すべて `reality-science-site` フォルダの中で実行します。

## 動かしてみる

```bash
npm run dev
```

ブラウザで **http://localhost:4321/** を開くと、サイトがローカルで表示されます（編集すると即反映）。`Ctrl + C` で止められます。これが確認の基本です。

## 最初の一歩

- **記事を追加してみる** → [記事の追加方法](adding-articles.md)（雛形コマンド1つから）
- **運用全体（記事の修正・写真・資材・公開確認・困ったとき）** → [運用マニュアル](operations.md)

## 用語ミニ辞典

| 言葉 | 意味 |
|---|---|
| リポジトリ | プロジェクトのファイル一式（このフォルダ全体） |
| Markdown（.md） | 見出しやリンクを記号で書ける軽いテキスト形式。記事はこれで書く |
| frontmatter | 記事ファイル先頭の `---` で囲んだ設定欄（タイトル・日付・カテゴリ等） |
| ブランチ | 本番に影響させず作業するための「作業用コピー」。`post/vol-74` のように切る |
| PR（プルリクエスト） | 「この変更を入れてください」という提出。レビューしてからマージ |
| マージ | PR を本番(main)に取り込むこと。これで自動公開が走る |
| デプロイ | 公開（ビルドして Web に出す）こと。ここでは自動 |
| draft | `draft: true` の間はその記事は公開されない（下書き） |

## 困ったら

[運用マニュアルのトラブルシュート](operations.md#トラブルシュート)を見て、それでも解決しなければ **@Chiaki** に連絡してください。
