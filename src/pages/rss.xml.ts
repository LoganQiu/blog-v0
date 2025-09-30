import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';
import { getPostPath } from '@/utils/getPostPath';
import { SITE } from '@/config';

export async function GET(context: APIContext) {
  const blogPosts = await getCollection('blog', ({ data }) => !data.draft);
  const sortedPosts = blogPosts.sort((a, b) => {
    const dateA = a.data.moddate || a.data.pubdate;
    const dateB = b.data.moddate || b.data.pubdate;
    return dateB.valueOf() - dateA.valueOf();
  });
  return rss({
    title: SITE.title,
    description: SITE.desc,
    site: context.site || SITE.website,
    items: sortedPosts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.pubdate,
      description: post.data.desc || post.data.subtitle || '',
      link: getPostPath(post),
      author: post.data.author,
      categories: [...(post.data.categories || []), ...(post.data.tags || [])]
    })),
    customData: `<language>${SITE.lang}</language>`,
  });
}