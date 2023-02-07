import rss, { pagesGlobToRssItems } from '@astrojs/rss';

export async function get(context) {
  return rss({
    title: 'Üllar Seerme',
    description: 'Personal website',
    site: context.site,
    items: await pagesGlobToRssItems(
      import.meta.glob('./**/*.md'),
    ),
    drafts: false,
    customData: `<language>en-us</language>`,
    stylesheet: '/pretty-feed-v3.xsl',
  });
}
