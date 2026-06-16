import { getCollection } from 'astro:content';

export type CardItem = {
  url: string;
  title: string;
  thumb?: string;
  date: Date;
  categories: string[];
};

// All published articles as card items, newest first. The permalink mirrors the
// original WordPress structure /YYYY/MM/slug/ (derived from the article date).
export async function getArticles(): Promise<CardItem[]> {
  const arts = await getCollection('articles', ({ data }) => !data.draft);
  return arts
    .map((e) => {
      const d = e.data.date;
      const y = d.getUTCFullYear();
      const m = String(d.getUTCMonth() + 1).padStart(2, '0');
      return {
        url: `/${y}/${m}/${e.data.slug}/`,
        title: e.data.title,
        thumb: e.data.featured_image,
        date: d,
        categories: e.data.categories,
      };
    })
    .sort((a, b) => b.date.getTime() - a.date.getTime());
}

export async function getArticlesInCategory(slug: string): Promise<CardItem[]> {
  return (await getArticles()).filter((e) => e.categories.includes(slug));
}
