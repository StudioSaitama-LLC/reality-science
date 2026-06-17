import { getCollection } from 'astro:content';

export type CardItem = {
  url: string;
  title: string;
  thumb?: string;
  date: Date;
  sortKey: number;
  categories: string[];
};

// Lectures should list by the event/開催 date descending (= Vol number order), not
// the publish date — publish dates have ties (e.g. Vol.71/72 same day) that scramble
// the Vol order. Parse the event date from the title「（YYYY/M/D…開催）」; fall back to
// the publish date for non-lecture posts.
function sortDate(title: string, pub: Date): number {
  const m = title.match(/(\d{4})[/／](\d{1,2})[/／](\d{1,2})/);
  if (m) return Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return pub.getTime();
}

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
        sortKey: sortDate(e.data.title, d),
        categories: e.data.categories,
      };
    })
    .sort((a, b) => b.sortKey - a.sortKey);
}

export async function getArticlesInCategory(slug: string): Promise<CardItem[]> {
  return (await getArticles()).filter((e) => e.categories.includes(slug));
}

// HOME の NEWS など「公開日の新しい順」が欲しい用途向け。getArticles() の sortKey は
// lecture の開催日（Vol 順）なので、ニュース系を混ぜると新着順がずれる。ここでは公開日
// (date) 降順で並べ、同じ公開日のタイだけ sortKey（lecture は開催日）降順で割って
// Vol 順を保つ（移行元の Vol.71/72 のように公開日が同日のケースの取り違えを防ぐ）。
export async function getArticlesByPublishDate(): Promise<CardItem[]> {
  return (await getArticles()).sort((a, b) => b.date.getTime() - a.date.getTime() || b.sortKey - a.sortKey);
}
