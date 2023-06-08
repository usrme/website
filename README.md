# Website

[![Netlify Status](https://api.netlify.com/api/v1/badges/f681eb9e-1e54-4fc8-9a35-bb0de9cd3151/deploy-status)](https://app.netlify.com/sites/usrme-astro-website/deploys)

## 🚀 Project Structure

```console
$ tree -L 3 -I 'dist|node_modules|public'
.
├── astro.config.mjs
├── package.json
├── package-lock.json
├── README.md
├── src
│   ├── components
│   │   ├── Analytics.astro
│   │   ├── BlogPost.astro
│   │   ├── Footer.astro
│   │   ├── Header.astro
│   │   ├── Navigation.astro
│   │   └── ThemeIcon.astro
│   ├── content
│   │   ├── config.ts
│   │   └── docs
│   ├── env.d.ts
│   ├── layouts
│   │   ├── BaseLayout.astro
│   │   └── MarkdownPostLayout.astro
│   ├── pages
│   │   ├── about
│   │   ├── about.astro
│   │   ├── blog.astro
│   │   ├── index.astro
│   │   ├── posts
│   │   ├── rss.xml.js
│   │   ├── tils
│   │   └── tils.astro
│   └── styles
│       └── global.css
└── tsconfig.json
```
