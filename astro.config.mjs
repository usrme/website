import { defineConfig } from 'astro/config'

export default defineConfig({
  site: 'https://usrme.xyz',
  markdown: {
    drafts: false,
    shikiConfig: {
      theme: 'github-dark-dimmed',
      // https://github.com/shikijs/shiki/blob/main/docs/languages.md
      wrap: false,
      // https://github.com/shikijs/shiki/issues/3#issuecomment-2272168959
      transformers: [
        {
          preprocess(code) {
            if (code.endsWith('\n')) {
              code = code.slice(0, -1)
            }
            return code
          },
        },
      ],
    },
  },
})
