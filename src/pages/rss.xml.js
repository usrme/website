import rss from '@astrojs/rss';

export const get = () => rss({
  title: 'Üllar Seerme',
  description: 'My personal website',
  site: 'https://astro.usrme.xyz',
  items: import.meta.glob('./**/*.md'),
  customData: `<language>en-us</language>`,
});
