import { defineConfig } from 'astro/config'

export default defineConfig({
  site: 'https://usrme.xyz',
  markdown: {
    drafts: false,
    shikiConfig: {
      theme: 'github-dark-dimmed',
      // https://github.com/shikijs/shiki/blob/main/docs/languages.md
      wrap: false,
    },
  },
})
