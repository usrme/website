---
layout: ../../layouts/MarkdownPostLayout.astro
pubDate: 2022-10-26
title: Replacing a CMS using Gitpod
tags: ["technical-post"]
---
For a while now I've been using [Forestry](https://forestry.io/) as a simple CMS that hooks into [this website's repository](https://github.com/usrme/website) as a way to nicely be able to write blog posts when I am not near my main machine. The benefits where that I had a fairly good WYSIWYG interface for writing Markdown and then being able to directly preview it by having Forestry build the changes immediately using [Hugo](https://gohugo.io/). For sites that rely on multiple people editing a single site or a site with sub-sites it's probably way better than what I'm about to introduce here,  but for me it was time to sunset its usage.

As far as I know [Gitpod](https://www.gitpod.io/) is the OG in the space of remote development platforms with [GitHub's Codespaces](https://github.com/features/codespaces) hot on its heels[^1]. While it definitely makes most sense for projects where the process to set up should be abstracted away as much as possible to make collaboration between people easier, I still felt I could use this service to improve upon my own workflow as well. While I would have actually liked to use GitHub's solution for this to keep myself in its walled garden (`/s`)[^2],  this was so simple to set up that I figured it was worth it anyway.

To get started just add a `.gitpod.yml` to the root of the repository, as such:

```yaml
tasks:
  - name: Install Hugo dependencies
    before: brew install hugo
    init: echo "Your version of Hugo is `hugo version`"
    command: hugo server -D -F --baseUrl $(gp url 1313) --liveReloadPort=443 --appendPort=false --bind=0.0.0.0
ports:
  - port: 1313
    onOpen: open-preview
```

This is seemingly the [official template](https://github.com/gitpod-io/template-hugo/blob/main/.gitpod.yml), but right out of the gate I wanted to use the same version of Hugo that I use for my live website and doing that with `brew` was a chore on top of being awfully slow to install everything[^3]. So here is what I came up with instead (shown as a diff):

```diff
 tasks:
-  - name: Install Hugo dependencies
-    before: brew install hugo
+  - name: Install Hermit and Hugo
+    before: |
+      curl -fsSL https://github.com/cashapp/hermit/releases/download/stable/install.sh | /bin/bash
+      export PATH="/home/gitpod/bin:${PATH}"
+      pushd ~
+      mkdir hermit-packages && cd hermit-packages
+      hermit init
+      . ./bin/activate-hermit
+      hermit install hugo-0.88.1
+      popd
     init: echo "Your version of Hugo is `hugo version`"
     command: hugo server -D -F --baseUrl $(gp url 1313) --liveReloadPort=443 --appendPort=false --bind=0.0.0.0
 ports:
```

I'm using [Hermit](https://cashapp.github.io/hermit/) as the package manager as I know that is extremely straight-forward because it heavily relies on just pulling binaries instead of resolving any dependencies, installing those, etc. By the time the workspace has booted up everything is already set up and running.

After saving that YAML file just authenticate Gitpod and create a new [workspace](https://gitpod.io/workspaces). It will then discover that file, set everything up accordingly, and present you with VS Code in your browser (other options are available as well). It really is that easy! After that I just had to make some minor modifications:

- remove the `onOpen` declaration as I didn't want a preview being opened in the in-browser version of VS Code when there is a valid URL that can be browsed to in a separate tab;
- add the `public_repo` permission inside Gitpod's [integrations page](https://gitpod.io/integrations) to allow for committing straight back to the repository;
- add a VS Code `.vscode/settings.json` file in the root of the repository that among other things disables auto-saving[^4], which I didn't want because I have the preview open in another tab and I don't want it flashing all the time when I haven't even saved the file yet;
- add a few extensions in the `.gitpod.yml` file:

```yaml
vscode:
  extensions:
    - Catppuccin.catppuccin-vsc
    - file-icons.file-icons
```

While I'm fine with just writing in VS Code, I am sure there are extensions out there that turn VS Code more into what an actual writer might use so there's tons of potential here. Now I, myself, can just hop in any browser, fire up a workspace in Gitpod, enter Zen mode in VS Code and get cracking![^5]

[^1]: Somewhat... it's still (at the time of writing) not available to personal accounts.
[^2]: Actually I just want to pare down the various services I somewhat rely on, even if minimally.
[^3]: More information here: https://github.com/Homebrew/discussions/discussions/2941.
[^4]: This is just a subset of the configuration I have locally as other things don't make sense to have (i.e. Python-specific settings): https://github.com/usrme/website/blob/master/.vscode/settings.json
[^5]: The entirety of this post was written using the power of the cloud; how very modern! Though I weep inside that I my shitty little blog takes up some _extra_ amount of physical hardware somewhere... I may just scrap this sooner than I think.
