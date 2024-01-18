import rss, { pagesGlobToRssItems } from '@astrojs/rss';

export async function GET(context) {
  return rss({
    title: 'Üllar Seerme',
    description: 'Personal website',
    site: context.site,
    items: (await pagesGlobToRssItems(
      import.meta.glob('./**/*.md'),
    )).sort((a, b) => b.pubDate - a.pubDate),
    customData: `<language>en-us</language>`,
    stylesheet: '/pretty-feed-v3.xsl',
  });
}
