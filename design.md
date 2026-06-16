# design — 現実科学ラボ サイト

## ステートメント
これは新規デザインではなく **既存ブランドの忠実な保存**。旧 Elementor サイトの見た目・タイポグラフィ・余白・色・インタラクションをそのまま引き継ぎ、基盤だけを静的 + Markdown に置き換える。「作り直したと気づかれない」ことが成功条件。

## 再現の原則（ハイブリッド忠実ミラー）
- **外枠（header / footer / HOME / ABOUT / 記事テンプレ / アーカイブ）** は、旧サイトのレンダリング済み HTML と Elementor のコンパイル済み CSS を**そのまま** `src/mirror/` に carve して使う。自分のセンスで作り直さない。
- **記事本文だけ** を Markdown → HTML パイプラインに載せ、同じ Elementor 単一投稿テンプレート（id 1712）の本文枠に流し込む。
- class 名・data 属性・インライン CSS は原本どおり保持（utility 衝突を避けるため独自 class を足さない）。

## タイポグラフィ / フォント
- 原本と同じ Google Fonts（Noto Sans JP / Noto Serif JP / Open Sans / Roboto 等）を CDN から読む。CJK の self-host はサブセット数が膨大で repo を肥大化させるため、原本と同じく CDN リンクを維持するのが最も忠実かつ実務的。
- アイコンは Font Awesome / eicons の webfont を `public/` に同梱（原本も self-host）。

## レイアウト
- ヘッダー2種：HOME は透過オーバーレイ（id 963）、内ページは通常（id 966）。フッターは共通（id 968）。
- 記事：シリーズ小見出し → タイトル(h1) → 本文。アイキャッチは本文先頭画像が兼ねる（旧テンプレに独立ウィジェットなし）。
- 一覧：Elementor Posts カード（サムネ上・3カラム・影あり）。新着順。

## UX
- 完全静的。JS は原本の Elementor frontend を vendoring（メニュー/スティッキー等の挙動を保持）。アナリティクス(GA)・admin-ajax 依存は除去。
- ページネーションは静的化（一覧は全件表示）。

## タッチポイント
- OGP：記事は featured_image を絶対 URL で出力（`https://reality-science.com/...`）。
- favicon：原本の cropped-logo を流用。
