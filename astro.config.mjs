import { defineConfig } from 'astro/config'
import starlight from '@astrojs/starlight';

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
  integrations: [
    starlight({
      title: 'Back to home page',
      sidebar: [
        {
          label: 'Start here',
          items: [
            { label: 'Ansible', link: '/snippets/ansible' },
            { label: 'Docker/Podman', link: '/snippets/docker-podman' },
            { label: 'Git', link: '/snippets/git' },
            { label: 'Kubernetes', link: '/snippets/kubernetes' },
            { label: 'PowerShell', link: '/snippets/powershell' },
            { label: 'Shell', link: '/snippets/shell' },
            { label: 'Vim', link: '/snippets/vim' },
          ],
        },
      ],
      head: [
        {
          tag: 'script',
          attrs: {
            src: '//gc.zgo.at/count.js',
            'data-goatcounter': 'https://usrme.goatcounter.com/count',
            defer: true,
          },
        },
      ],
    }),
  ],
})
