import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// 記事コレクション。1記事 = src/content/articles/*.md 一枚。
// 新しい記事を追加するには、ここに .md を置いて frontmatter を埋めるだけ。
const articles = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/articles' }),
  schema: z.object({
    title: z.string(),
    // 公開日。permalink の年月（/YYYY/MM/）はこの日付から導出する。
    date: z.coerce.date(),
    // WordPress の post_name。permalink は /<year>/<month>/<slug>/ になる。
    slug: z.string(),
    // カテゴリ slug（event / news / workshop / pr）。複数可。
    categories: z.array(z.string()).default([]),
    // 記事上部に出るシリーズ見出し（例: 現実科学レクチャーシリーズ）
    series_label: z.string().optional(),
    // アイキャッチ。/wp-content/uploads/... のローカルパス。
    featured_image: z.string().optional(),
    // 一覧・OGP 用の抜粋
    excerpt: z.string().optional(),
    // 移行元の WordPress 投稿 ID（トレーサビリティ用）
    wp_id: z.number().optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { articles };
