---
layout: ../../layouts/MarkdownPostLayout.astro
pubDate: 2021-11-10
title: It makes sense to pin even patch versions of dependencies
tags: ["docker", "python"]
---
On September 18th, 2021, a [CPython bug fix](https://github.com/python/cpython/pull/28420 "bpo-45235: Fix argparse overrides namespace with subparser defaults") was merged and today the [Docker image for Python 3.9.8](https://hub.docker.com/layers/python/library/python/3.9.8/images/sha256-548c4f51ba411aebfee2baf188f2b97b172e78a2505d152a43a957a70b83fde8?context=explore "python:3.9.8 Docker image"), which includes the merged fix, was pushed. This had the knock-on effect of breaking CLI tools that rely on how namespaces are handled in `argparse`, namely [Azure CLI](https://github.com/Azure/azure-cli/issues/20269 "GitHub.com Azure/azure-cli issue: Global Arguments stop working in Python 3.9.8").

It was a really fun (`/s`) 3-4 hours spent debugging how a seemingly minor change I introduced, around the very same time the Docker image was pushed, could have so catastrophically broken the `--query` parameter for Azure CLI commands.

When I discovered the Azure CLI issue I took notice of the Dockerfile I use to set up the so-called "prerequisites" image on top which the project itself gets installed on:

```docker
FROM python:3.9-slim-buster

RUN : \
    && apt-get update \
    && apt-get install -y \
      git \
      openssh-client \
    && rm -rf /var/lib/apt/lists/*

RUN pip install --disable-pip-version-check --no-cache-dir poetry

COPY pyproject.toml poetry.lock ./

# Skip creation of virtual environment: https://github.com/python-poetry/poetry/issues/4557
RUN poetry config virtualenvs.create false && poetry install --no-root --no-dev
```

You probably already got it from the title of this post, but notice anything? The very first line, which sets the base image for subsequent instructions, is set to `3.9-slim-buster`, which actually points to whatever the latest patch tag is. So, prior to `3.9.8-slim-buster` being pushed I had the equivalent of `3.9-slim-buster` ->  `3.9.7-slim-buster` which worked fine, but when the newer patch tag was pushed it right away brought to light the merged fix that broke argument parsing.

After realizing that all I had to do was use the `3.9.7-slim-buster` tag directly, thus pinning even the patch version (something I probably would have never done otherwise for such an image), all the issues were resolved. But man, oh man, was it fun to stare debug outputs of identical Azure CLI versions side-by-side and not seeing what possibly could have gone wrong. Surely it can't be that Python 3.9.8 vs. 3.9.7 is the culprit. Surely...
