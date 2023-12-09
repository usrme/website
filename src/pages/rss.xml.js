import rss from '@astrojs/rss'

export async function get(context) {
  const posts = await getCollection('posts')
  return rss({
    title: 'Üllar Seerme',
    description: 'Personal website',
    site: context.site,
    items: posts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.pubDate,
      description: post.data.description,
      link: `/posts/${post.slug}/`,
    })),
    drafts: false,
    customData: `<language>en-us</language>`,
    stylesheet: '/pretty-feed-v3.xsl',
  })
}
