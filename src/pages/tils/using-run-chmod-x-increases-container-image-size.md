---
layout: ../../layouts/MarkdownPostLayout.astro
pubDate: 2024-09-05
title: Using 'RUN chmod +x' increases container image size
tags: ["cli", "docker"]
---

You'll only ever notice this if you have files that are several if not hundreds of megabytes or if you have relatively small images to begin with, but running `RUN chmod +x` on a copied file will increase the size of the container image. I'll demonstrate using Astral's '[uv](https://github.com/astral-sh/uv)':

```docker
FROM alpine:latest

COPY uv uv

RUN chmod +x uv
```

Building this image will result in the following:

```console
$ docker images
REPOSITORY         TAG       IMAGE ID       CREATED          SIZE
uv                 large     c530abdb5937   16 minutes ago   53.9MB
```

On first glance there's nothing inherently off here, but I'll try and do better:

```diff
@@ -1,5 +1,3 @@
 FROM alpine:latest

-COPY uv uv
-
-RUN chmod +x uv
+COPY --chmod=755 uv uv
```

After using the ['--chmod' option](https://docs.docker.com/reference/dockerfile/#copy---chown---chmod) (and there's also a `--chown` option) the size decreases noticeably:

```console
$ docker images
REPOSITORY         TAG       IMAGE ID       CREATED             SIZE
uv                 mid       2b6aa72b5770   55 minutes ago      31.4MB
uv                 large     c530abdb5937   55 minutes ago      53.9MB
```

All this has to do with layers and how the file metadata isn't taken into account when calculating the delta between layers[^1].

It might not make sense to go and change every Dockerfile under your control, but if you're one of the people who regularly deals with larger files[^2] then it might make sense to at least consider this (and the `--chown` option).

[^1]: I've had more adventures with layers in a [previous post](https://usrme.xyz/tils/a-lesson-in-docker-build-cache-invalidation/).
[^2]: Surely some of [these](https://sourcegraph.com/search?q=context:global+%22RUN+chmod+%2Bx%22+file:Dockerfile&patternType=keyword&sm=0) people are.
