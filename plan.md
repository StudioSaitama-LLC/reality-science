# plan — 現実科学ラボ サイト再構築

## 何を
WordPress + Elementor で運用していた reality-science.com を、**見た目を完全再現した静的サイト**として作り直し、記事を **Markdown ファイル**で管理する仕組みに移行する。

## なぜ
- WordPress / Elementor / 各種プラグインの運用・保守・セキュリティ負荷とコストを外す
- 記事を CMS でなく Git 上の `.md` で管理し、Claude Code で追加・編集できるようにする
- ホスティングを GitHub Pages（無料・静的・高速・堅牢）に寄せる

## 誰が使う
- 運営（現実科学ラボ事務局 / Studio Saitama）— 記事追加・更新
- 追加作業は Claude Code もしくは手作業で `.md` を 1 枚足すだけ

## アウトプット
- 静的サイト（HOME / ABOUT / JOIN / CONTACT / 87 記事 / カテゴリ別一覧）
- 記事の SSoT = `src/content/articles/*.md`
- GitHub Actions による自動デプロイ

## フロー（記事追加）
`.md` を追加 → `git push` → GitHub Actions が `astro build` → GitHub Pages 公開。
permalink は旧サイトと同一（`/YYYY/MM/slug/`）。

## スコープ外（現時点）
- CONTACT フォームのサーバ処理（バックエンド未確定。別途差し替え）
- HOME の NEWS / NEXT LECTURE の collection 駆動化（現状スナップショット）
- 独自ドメインへの DNS カットオーバー（本番停止を伴うため明示 GO 後）

## 関連
デザイン方針は [design.md](design.md)、運用手順は [README.md](README.md) / [docs/adding-articles.md](docs/adding-articles.md)。
