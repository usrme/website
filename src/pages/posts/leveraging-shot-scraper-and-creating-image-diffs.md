---
layout: ../../layouts/MarkdownPostLayout.astro
pubDate: 2022-10-23
title: Leveraging 'shot-scraper' and creating image diffs
---
A little while ago [Simon Willison introduced 'shot-scraper'](https://simonwillison.net/2022/Mar/10/shot-scraper/), which at the time I found very interesting[^1], but didn't have a use case in my own life. At that same time though I was using a service called [Visualping](https://visualping.io/) for automatically checking whether the [Amazon Builders' Library](https://aws.amazon.com/builders-library/) had gotten any new write-ups. That seemed like the quickest way to be notified and grab any PDFs that might not persist into the future[^2].

The thing with Visualping is that while it works wonderfully they a) require an account, which I guess is fine, but b) they also require periodic log-ins with a grace period of only 3 days, if I recall correctly, after they've notified you that you haven't logged in in a while. After that 3 days they would just flat out delete your account. That was the final straw as I _really_ didn't want to even think about a thing like that. As it just so happened Simon Willison made [another post](https://simonwillison.net/2022/Oct/14/automating-screenshots/) around that time about `shot-scraper` and how he used to it automatically create screenshots for the purposes of keeping Datasette's documentation up-to-date.

In that post he mentions a specific [GitHub template for creating automatic screenshots](https://simonwillison.net/2022/Mar/14/shot-scraper-template/), which in all honesty is about 80% of what Visualping already did for me, and I got it up and running in no time so I was pretty chuffed about that. Needless to say I very quickly closed the Visualping account myself to remove yet another account I have laying around[^3]. Now, the automation that he created only commits changes to images when there are any changes and he leaves the decision about that to Git, but I still wanted to _see_ what exactly changed; the last 20% if you will.

I found a bunch of libraries that promised to do this[^4], but none got me to the point quicker than just installing the venerable [ImageMagick](https://imagemagick.org/) during the execution of the GitHub Actions pipeline and using [its wonderful comparison features](https://www.imagemagick.org/Usage/compare/). I'll first illustrate what I am able to see as a differential image, then a little nicety to make it even clearer, and then I'll show the small technical changes I made to accomplish this.

Let's say for example that back on the 17th of October the [jobs page for Fly](https://fly.io/jobs/)[^5] looked like [this](/screenshot_2022-10-17-fly-jobs.png), but now it looks like [this](/screenshot_2022-10-23-fly-jobs.png). Switching back-and-forth between the two makes it obvious what the changes are (a new job ad was posted for an engineering manager), but just having the "after" shot would most likely leave me clueless if I didn't remember the previous shot exactly. So, let's create a comparison [image](/fly-jobs-diff.png) _and_ a comparison [animation](/fly-jobs-anim.gif)! I will concede that the comparison image is very hard to read as all of the other ads got shifted due to the addition, but try to image a scenario where the difference is more subtle and how the mere existence of the highlight will guide your eyes to what changed, and with the help of the animation the difference should be clear.

Before showing the difference between the default GitHub template's workflow configuration and mine I'll show the `shots.yml` that serves as the entrypoint for `shot-scraper`[^6]:

```yaml
- url: https://fly.io/jobs/
  output: fly/after.png
  quality: 20
- url: https://aws.amazon.com/builders-library/
  output: amazon/after.png
  quality: 20
```

And here is the meat of what is going on to make things happen. I'll number every change and describe them below:

```diff
@@ -3,6 +3,8 @@ name: Take screenshots
 on:
   push:
   workflow_dispatch:
+  schedule:
+    - cron: '0 0 * * *'
 
 permissions:
   contents: write
@@ -35,24 +37,53 @@ jobs:
     - name: Install Playwright dependencies
       run: |
         shot-scraper install
-    - uses: actions/github-script@v6
-      name: Create shots.yml if missing on first run
-      with:
-        script: |
-          const fs = require('fs');
-          if (!fs.existsSync('shots.yml')) {
-              const desc = context.payload.repository.description;
-              let line = '';
-              if (desc && (desc.startsWith('http://') || desc.startsWith('https://'))) {
-                  line = `- url: ${desc}` + '\n  output: shot.png\n  height: 800';
-              } else {
-                  line = '# - url: https://www.example.com/\n#   output: shot.png\n#   height: 800';
-              }
-              fs.writeFileSync('shots.yml', line + '\n');
-          }
+    - name: Create 'before' version of image
+      run: |
+        find . -type f -name "after.png" -exec sh -c 'for f; do t=$(dirname "$f"); \
+          cp "$f" "${t}/before.png"; done' sh {} +
     - name: Take shots
       run: |
         shot-scraper multi shots.yml
+    - name: Cache ImageMagick
+      uses: actions/cache@v3
+      with:
+        path: ~/.cache/imagemagick/
+        key: ${{ runner.os }}-imagemagick
+    - name: Download ImageMagick if not already cached
+      run: |-
+        if [[ ! -f ~/.cache/imagemagick/magick ]]; then
+          mkdir -p ~/.cache/imagemagick/
+          wget https://imagemagick.org/archive/binaries/magick -O ~/.cache/imagemagick/magick
+          chmod +x ~/.cache/imagemagick/magick
+        else
+          echo "ImageMagick binary already exists"
+        fi
+    - name: Create differential images
+      run: |-
+        find . -type f -name "after.png" -exec sh -c '
+          changes=$(git status --porcelain)
+          for f; do
+            dir_name=$(dirname "$f")
+            clean_dir_name=$(echo "$dir_name" | tail -c +3)
+            if echo "$changes" | grep -q "${clean_dir_name}/after.png"; then
+              ~/.cache/imagemagick/magick compare -metric AE -fuzz 5% "${dir_name}/before.png" "$f" "${dir_name}/diff.png" || true
+            else
+              echo "Nothing has changed for ${f}, so skipping differential creation"
+            fi
+          done' sh {} +
+    - name: Create differential animations
+      run: |-
+        find . -type f -name "after.png" -exec sh -c '
+          changes=$(git status --porcelain)
+          for f; do
+            dir_name=$(dirname "$f")
+            clean_dir_name=$(echo "$dir_name" | tail -c +3)
+            if echo "$changes" | grep -q "${clean_dir_name}/after.png"; then
+              ~/.cache/imagemagick/magick -delay 100 "${dir_name}/before.png" "$f" "${dir_name}/anim.gif" || true
+            else
+              echo "Nothing has changed for ${f}, so skipping differential animation creation"
+            fi
+          done' sh {} +
     - name: Commit and push
       run: |-
         git config user.name "Automated"
```

1. The `schedule` part just makes it so that on top of running on every commit I want the workflow to run every midnight as well.
1. The step to create `shots.yml` if it is missing is not needed when the file already exists, thus I've removed it.
1. I'm creating a `before.png` of every `after.png` file in their respective subdirectories, hence the `-exec` craziness, prior to the "Take shots" step being ran.
1. I am setting up a cache directory to hold the ImageMagick binary.
1. I am only downloading ImageMagick if it does not already exist in the cache[^7].
1. For each `after.png` that _may_ have changed (leveraging `git status --porcelain` for this) I am creating a differential image `diff.png` in the same subdirectory. The reason for this check is that otherwise a new `diff.png` may still get created that Git may detect as a new file and I want to avoid that.
1. The same logic as above is followed for creating the animation.

After all is said and done (i.e. a change occurred in the `after.png` image, ImageMagick did its thing, and changes were committed) then the source tree looks something like this:

```bash
$ tree
.
├── amazon
│   ├── after.png
│   ├── anim.gif
│   ├── before.png
│   └── diff.png
├── fly
│   ├── after.png
│   ├── anim.gif
│   ├── before.png
│   └── diff.png
├── README.md
├── requirements.txt
└── shots.yml
```

There are, as always, enhancements that could be done to the workflow, but I am definitely wary of spending even more time on this[^8], so here is the full GitHub workflow configuration for perusing:

```yaml
name: Take screenshots

on:
  push:
  workflow_dispatch:
  schedule:
    - cron: '0 0 * * *'

permissions:
  contents: write

jobs:
  shot-scraper:
    runs-on: ubuntu-latest
    if: ${{ github.repository != 'simonw/shot-scraper-template' }}
    steps:
    - uses: actions/checkout@v3
    - name: Set up Python 3.10
      uses: actions/setup-python@v3
      with:
        python-version: "3.10"
    - uses: actions/cache@v3
      name: Configure pip caching
      with:
        path: ~/.cache/pip
        key: ${{ runner.os }}-pip-${{ hashFiles('requirements.txt') }}
        restore-keys: |
          ${{ runner.os }}-pip-
    - name: Cache Playwright browsers
      uses: actions/cache@v3
      with:
        path: ~/.cache/ms-playwright/
        key: ${{ runner.os }}-browsers
    # 'libfuse2' is required on Ubuntu 22.04-based images as otherwise
    # AppImages will not work, which the ImageMagick executable is
    - name: Install dependencies
      run: |
        pip install -r requirements.txt
        sudo apt-get update && sudo apt-get install libfuse2
    - name: Install Playwright dependencies
      run: |
        shot-scraper install
    - name: Create 'before' version of image
      run: |
        find . -type f -name "after.png" -exec sh -c 'for f; do t=$(dirname "$f"); \
          cp "$f" "${t}/before.png"; done' sh {} +
    - name: Take shots
      run: |
        shot-scraper multi shots.yml
    - name: Cache ImageMagick
      uses: actions/cache@v3
      with:
        path: ~/.cache/imagemagick/
        key: ${{ runner.os }}-imagemagick
    - name: Download ImageMagick if not already cached
      run: |-
        if [[ ! -f ~/.cache/imagemagick/magick ]]; then
          mkdir -p ~/.cache/imagemagick/
          wget https://imagemagick.org/archive/binaries/magick -O ~/.cache/imagemagick/magick
          chmod +x ~/.cache/imagemagick/magick
        else
          echo "ImageMagick binary already exists"
        fi
    - name: Create differential images
      run: |-
        find . -type f -name "after.png" -exec sh -c '
          changes=$(git status --porcelain)
          for f; do
            dir_name=$(dirname "$f")
            clean_dir_name=$(echo "$dir_name" | tail -c +3)
            if echo "$changes" | grep -q "${clean_dir_name}/after.png"; then
              ~/.cache/imagemagick/magick compare -metric AE -fuzz 5% "${dir_name}/before.png" "$f" "${dir_name}/diff.png" || true
            else
              echo "Nothing has changed for ${f}, so skipping differential creation"
            fi
          done' sh {} +
    - name: Create differential animations
      run: |-
        find . -type f -name "after.png" -exec sh -c '
          changes=$(git status --porcelain)
          for f; do
            dir_name=$(dirname "$f")
            clean_dir_name=$(echo "$dir_name" | tail -c +3)
            if echo "$changes" | grep -q "${clean_dir_name}/after.png"; then
              ~/.cache/imagemagick/magick -delay 100 "${dir_name}/before.png" "$f" "${dir_name}/anim.gif" || true
            else
              echo "Nothing has changed for ${f}, so skipping differential animation creation"
            fi
          done' sh {} +
    - name: Commit and push
      run: |-
        git config user.name "Automated"
        git config user.email "actions@users.noreply.github.com"
        git add -A
        timestamp=$(date -u)
        git commit -m "${timestamp}" || exit 0
        git pull --rebase
        git push
```

[^1]: I find most things that he does very interesting, but that's besides the point...
[^2]: There are some wonderful thoughts written down there and I highly recommend anyone take a look.
[^3]: Password managers make ad hoc account creations far too easy.
[^4]: ['image-diff'](https://github.com/simonw/image-diff), ['diffimg'](https://github.com/nicolashahn/diffimg), ['blink-diff'](https://github.com/yahoo/blink-diff)
[^5]: I wanted to continue using the Amazon Builders' Library as an example, but loading previous snapshots of their page in the Wayback Machine was just too time-consuming.
[^6]: I only care about the difference being evident, so I am opting for very low quality images to conserve space.
[^7]: It's by no means large, but why even waste time on that if we can store it for later use.
[^8]: Which explains why I am not creating a workflow template based off of this either.
