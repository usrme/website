# Astro Website

[![Netlify Status](https://api.netlify.com/api/v1/badges/f681eb9e-1e54-4fc8-9a35-bb0de9cd3151/deploy-status)](https://app.netlify.com/sites/usrme-astro-website/deploys)

## 🚀 Project Structure

```console
$ tree -L 2 -I node_modules
.
├── astro.config.mjs
├── package.json
├── package-lock.json
├── public
│   └── favicon.svg
├── README.md
├── src
│   ├── components
│   ├── env.d.ts
│   ├── layouts
│   ├── pages
│   ├── scripts
│   └── styles
└── tsconfig.json
```

Astro looks for `.astro` or `.md` files in the `src/pages/` directory. Each page is exposed as a route based on its file name.

There's nothing special about `src/components/`, but that's where we like to put any Astro/React/Vue/Svelte/Preact components.

Any static assets, like images, can be placed in the `public/` directory.

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                | Action                                           |
| :--------------------- | :----------------------------------------------- |
| `npm install`          | Installs dependencies                            |
| `npm run dev`          | Starts local dev server at `localhost:3000`      |
| `npm run build`        | Build your production site to `./dist/`          |
| `npm run preview`      | Preview your build locally, before deploying     |
| `npm run astro ...`    | Run CLI commands like `astro add`, `astro check` |
| `npm run astro --help` | Get help using the Astro CLI                     |
