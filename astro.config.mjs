import { defineConfig } from 'astro/config';

// https://astro.build/config
export default {
  markdown: {
    shikiConfig: {
      theme: 'github-dark-dimmed',
      // https://github.com/shikijs/shiki/blob/main/docs/languages.md
      wrap: false,
    },
  },
};
