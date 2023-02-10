import rss from '@astrojs/rss';
import sanitizeHtml from 'sanitize-html';

export async function get(context) {
  const postImportResult = import.meta.glob('./**/*.md', { eager: true }); 
  const posts = Object.values(postImportResult);
  return rss({
    title: 'Üllar Seerme',
    description: 'Personal website',
    site: context.site,
    items: posts.map((post) => ({
      link: post.url,
      content: sanitizeHtml(post.compiledContent()),
      ...post.frontmatter,
    })),
    drafts: false,
    customData: `<language>en-us</language>`,
    stylesheet: '/pretty-feed-v3.xsl',
  });
}
